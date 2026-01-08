
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiDetailedCapabilityReport, AgencyType, CapabilityItemAnalysis, AiReportSummary, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_DETAILED_CAPABILITY_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ClipboardDocumentListIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiReportSummarySchema = {
    type: Type.OBJECT,
    properties: {
        totalGapsDetected: { type: Type.NUMBER },
        criticalGapsCount: { type: Type.NUMBER },
        staffCategoryDistribution: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    count: { type: Type.NUMBER },
                },
                required: ["category", "count"],
            }
        },
        topImprovementAreas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    area: { type: Type.STRING },
                    reason: { type: Type.STRING },
                },
                required: ["area", "reason"],
            }
        },
        concludingIntervention: { type: Type.STRING },
    },
    required: ["totalGapsDetected", "criticalGapsCount", "staffCategoryDistribution", "topImprovementAreas", "concludingIntervention"]
};

const successionCandidateSchema = {
    type: Type.OBJECT,
    properties: {
        roleOrPosition: { type: Type.STRING },
        potentialSuccessors: { type: Type.ARRAY, items: { type: Type.STRING } },
        readinessLevel: { type: Type.STRING, enum: ['Ready Now', '1-2 Years', '3-5 Years', 'Long-term'] },
        developmentNeeds: { type: Type.STRING },
        estimatedTimeline: { type: Type.STRING },
    },
    required: ["roleOrPosition", "potentialSuccessors", "readinessLevel", "developmentNeeds", "estimatedTimeline"]
};

const aiDetailedCapabilityReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        capabilityBreakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionCode: { type: Type.STRING },
                    questionText: { type: Type.STRING },
                    capabilityCategory: { type: Type.STRING },
                    averageCurrentRating: { type: Type.NUMBER },
                    realisticRating: { type: Type.NUMBER },
                    averageGapScore: { type: Type.NUMBER },
                    gapCategory: { type: Type.STRING, enum: ['No Gap', 'Minor Gap', 'Moderate Gap', 'Critical Gap'] },
                    suggestedLearningMethod: { type: Type.STRING },
                    responseCount: { type: Type.NUMBER },
                    totalOfficers: { type: Type.NUMBER },
                },
                required: ["questionCode", "questionText", "capabilityCategory", "averageCurrentRating", "realisticRating", "averageGapScore", "gapCategory", "suggestedLearningMethod", "responseCount", "totalOfficers"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "capabilityBreakdown", "summary", "successionPlan"]
};


const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6 ${className}`}>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 uppercase tracking-widest">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const SummarySection: React.FC<{ summary: AiReportSummary | undefined }> = ({ summary }) => {
    if (!summary) return null;

    return (
        <ReportSection title="Key Insights Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold">{summary.totalGapsDetected}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">Total Gaps Detected</p>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.criticalGapsCount}</p>
                    <p className="text-xs font-semibold uppercase text-slate-500">Critical Gaps (Priority)</p>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 text-center uppercase text-slate-500">Staff Categories</h4>
                    <div className="flex justify-around text-xs">
                        {summary.staffCategoryDistribution?.map(cat => (
                            <div key={cat.category} className="text-center">
                                <p className="font-bold text-lg">{cat.count}</p>
                                <p className="text-xs">{cat.category.replace(' Candidate', '')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Top 3 Improvement Areas</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {summary.topImprovementAreas?.map(area => (
                            <li key={area.area}><strong>{area.area}:</strong> {area.reason}</li>
                        ))}
                    </ul>
                </div>
                <div className="p-3 bg-slate-200/50 dark:bg-slate-900/50 rounded-lg">
                    <h4 className="font-bold text-sm mb-1 uppercase text-slate-500">Concluding Recommendation</h4>
                    <p className="text-sm italic">{summary.concludingIntervention}</p>
                </div>
            </div>
        </ReportSection>
    );
};

const GapCategoryBadge: React.FC<{ category: CapabilityItemAnalysis['gapCategory'] }> = ({ category }) => {
    const styles = {
        'No Gap': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'Minor Gap': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        'Moderate Gap': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        'Critical Gap': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return (<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[category]}`}>{category}</span>);
};

export const DetailedCapabilityBreakdownReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiDetailedCapabilityReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis and recommendations should be specifically tailored for the '${agencyName}', which is a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis and recommendations should be specifically tailored for a '${agencyType}'.`;
        }
        return 'The analysis and recommendations should be general and applicable to all types of public service agencies.';
    }, [agencyType, agencyName]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }

            try {
                /* Correct initialization as per guidelines */
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const promptData = {
                    totalOfficers: data.length,
                    officerData: data.map(o => ({
                        capabilityRatings: o.capabilityRatings,
                        technicalCapabilityGaps: o.technicalCapabilityGaps,
                        leadershipCapabilityGaps: o.leadershipCapabilityGaps
                    }))
                };

                const promptText = `You MUST use this mapping to understand the question codes in the data.
QUESTION MAPPING:
${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}

Please analyze the following aggregated Capability Needs Analysis (CNA) survey data and generate a Detailed Capability Breakdown Report. The data is provided in JSON format.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(promptData, null, 2)}`;
                
                /* Updated model to gemini-3-flash-preview as per guidelines */
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_DETAILED_CAPABILITY_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiDetailedCapabilityReportSchema,
                    },
                });

                /* Accessing .text property directly as per guidelines */
                const jsonStr = response.text?.trim() || '{}';
                const parsedReport = JSON.parse(jsonStr) as AiDetailedCapabilityReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("AI Detailed Capability Report Error:", e);
                setError("An error occurred while generating the AI analysis for the detailed capability breakdown. Please check the console for details.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, promptContext]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("AI report not available");
        
        const sections: ReportData['sections'] = [
            { title: "Executive Summary", content: [report.executiveSummary] },
            {
                title: "Detailed Capability Item Breakdown",
                content: [{
                    type: 'table',
                    headers: ['Code', 'Question Text', 'Capability Category', 'Avg Rating', 'Gap %', 'Gap Category', 'Responses', 'Suggested Learning Method'],
                    rows: report.capabilityBreakdown.map(item => [
                        item.questionCode,
                        item.questionText,
                        item.capabilityCategory,
                        item.averageCurrentRating.toFixed(2),
                        `${((item.averageGapScore / 10) * 100).toFixed(0)}%`,
                        item.gapCategory,
                        `${item.responseCount}/${item.totalOfficers}`,
                        item.suggestedLearningMethod,
                    ])
                }],
                orientation: 'landscape'
            }
        ];
        
        if (report.successionPlan) {
            sections.push({
                title: "Succession Planning",
                content: [{
                    type: 'table',
                    headers: ['Role / Position', 'Potential Successor(s)', 'Readiness Level', 'Development Needs / Actions', 'Estimated Timeline'],
                    rows: report.successionPlan.map(plan => [
                        plan.roleOrPosition,
                        plan.potentialSuccessors.join(', '),
                        plan.readinessLevel,
                        plan.developmentNeeds,
                        plan.estimatedTimeline
                    ])
                }],
                orientation: 'landscape'
            });
        }

        if (report.summary) {
            sections.push({
                title: "Key Insights Summary",
                content: [
                    `Total Gaps Detected: ${report.summary.totalGapsDetected}`,
                    `Critical Gaps Count: ${report.summary.criticalGapsCount}`,
                    `Staff Distribution: ${report.summary.staffCategoryDistribution.map(s => `${s.category}: ${s.count}`).join(', ')}`,
                    `Top Improvement Areas:\n${report.summary.topImprovementAreas.map(s => `- ${s.area}: ${s.reason}`).join('\n')}`,
                    `Concluding Intervention: ${report.summary.concludingIntervention}`
                ]
            });
        }

        return {
            title: `Detailed Capability Breakdown - ${agencyName}`,
            sections,
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            switch (format) {
                case 'pdf': exportToPdf(reportData); break;
                case 'docx': exportToDocx(reportData); break;
                case 'xlsx': exportToXlsx(reportData); break;
            }
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-cyan-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Analyzing Component Gaps...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is performing an item-by-item analysis of all survey questions...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px]">
                    <XIcon className="w-16 h-16 text-red-500" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">System Error</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }
        
        if (report) {
            return (
                 <div className="space-y-6">
                    <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                    
                    <ReportSection title="Item-by-Item Capability Analysis">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-[#1A365D] text-white">
                                    <tr>
                                        <th className="p-3 font-semibold uppercase text-[10px] tracking-widest">Code</th>
                                        <th className="p-3 font-semibold uppercase text-[10px] tracking-widest">Capability Item</th>
                                        <th className="p-3 font-semibold text-center uppercase text-[10px] tracking-widest">Avg. Rating</th>
                                        <th className="p-3 font-semibold text-center uppercase text-[10px] tracking-widest">Gap %</th>
                                        <th className="p-3 font-semibold uppercase text-[10px] tracking-widest">Gap Category</th>
                                        <th className="p-3 font-semibold uppercase text-[10px] tracking-widest">Suggested Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.capabilityBreakdown.map(item => (
                                        <tr key={item.questionCode} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="p-3 font-bold text-[#1A365D]">{item.questionCode}</td>
                                            <td className="p-3">
                                                <p className="text-slate-800 font-medium">{item.questionText}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-tight">{item.capabilityCategory}</p>
                                            </td>
                                            <td className="p-3 text-center font-bold text-slate-700 text-lg">{item.averageCurrentRating.toFixed(1)}</td>
                                            <td className="p-3 text-center font-bold text-red-600 text-lg">{((item.averageGapScore / 10) * 100).toFixed(0)}%</td>
                                            <td className="p-3"><GapCategoryBadge category={item.gapCategory} /></td>
                                            <td className="p-3 text-[11px] font-semibold text-blue-700">{item.suggestedLearningMethod}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                     {report.successionPlan && (
                        <ReportSection title="Succession Planning">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#1A365D] text-white">
                                        <tr>
                                            <th className="p-3 font-semibold">Role / Position</th>
                                            <th className="p-3 font-semibold">Potential Successor(s)</th>
                                            <th className="p-3 font-semibold">Readiness Level</th>
                                            <th className="p-3 font-semibold">Development Needs / Actions</th>
                                            <th className="p-3 font-semibold">Estimated Timeline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.successionPlan.map((plan, index) => (
                                            <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="p-2 font-semibold">{plan.roleOrPosition}</td>
                                                <td className="p-2">{plan.potentialSuccessors.join(', ')}</td>
                                                <td className="p-2">{plan.readinessLevel}</td>
                                                <td className="p-2">{plan.developmentNeeds}</td>
                                                <td className="p-2">{plan.estimatedTimeline}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ReportSection>
                    )}
                    <SummarySection summary={report.summary} />
                </div>
            );
        }
        
        return null;
    }


    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in no-print overflow-y-auto" aria-modal="true" role="dialog">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full flex flex-col mb-12">
                <header className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 rounded-t-xl">
                     <div className="flex items-center gap-3">
                        <ClipboardDocumentListIcon className="w-8 h-8 text-[#1A365D]" />
                        <h1 className="text-2xl font-black text-[#1A365D] dark:text-white uppercase tracking-tighter">Detailed Capability Breakdown</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white transition-all">
                            <XIcon className="w-7 h-7" />
                        </button>
                    </div>
                </header>
                <main className="p-8 bg-white dark:bg-slate-900">
                   {renderContent()}
                </main>
                 <footer className="p-4 text-center border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analysis generated by Google Gemini • Official National Public Service Resource</p>
                </footer>
            </div>
        </div>
    );
};
