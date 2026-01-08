
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiAnnualTrainingPlan, AnnualTrainingPlanItem, AgencyType, AiReportSummary, FundingSource, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_ANNUAL_TRAINING_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ChartBarSquareIcon, ArrowPathIcon, DocumentChartBarIcon, ArrowLeftIcon, ArrowRightIcon, HomeIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { saveReportToCache, getReportFromCache, clearReportCache } from '../utils/reportCache';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const CACHE_KEY_ANNUAL_PLAN = 'cna_annual_training_plan_report';

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

const aiAnnualTrainingPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        year: { type: Type.NUMBER },
        trainingPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING },
                    fundingSource: { type: Type.STRING, enum: ['Internal Budget', 'Donor Funded', 'GoPNG', 'Other (Specify)'] },
                    trainingArea: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    deliveryMethod: { type: Type.STRING, enum: ['Workshop', 'Mentoring', 'On-the-Job', 'E-Learning', 'Secondment'] },
                    priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    quarter: { type: Type.STRING, enum: ['Q1', 'Q2', 'Q3', 'Q4'] },
                    estimatedCost: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                },
                required: ["division", "fundingSource", "trainingArea", "targetAudience", "deliveryMethod", "priority", "quarter", "estimatedCost", "rationale"]
            }
        },
        summary: aiReportSummarySchema,
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "year", "trainingPlan", "summary", "successionPlan"]
};

// FIX: Added anchorId to props to fix line 71 error
const ReportSection: React.FC<{ title: string; children: React.ReactNode; anchorId?: string }> = ({ title, children, anchorId }) => (
    <div className="pt-4 mb-4" id={anchorId}>
        <h2 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600 pb-1">{title}</h2>
        <div className="text-slate-700 dark:text-slate-300 text-sm space-y-2">{children}</div>
    </div>
);

const PriorityBadge: React.FC<{ level: 'High' | 'Medium' | 'Low' }> = ({ level }) => {
    const styles = {
        High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        Low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${styles[level]}`}>{level}</span>;
};

export const AnnualTrainingPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiAnnualTrainingPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyName}', a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general and applicable for all agencies.';
    }, [agencyType, agencyName]);

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        if (!process.env.API_KEY) {
            setError("API key is not configured.");
            setLoading(false);
            return;
        }
        try {
            // FIX: Using named parameter for GoogleGenAI initialization
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const promptText = `Please analyze the following CNA data and generate a consolidated training plan.\n\nCONTEXT: ${promptContext}\n\nDATA:\n${JSON.stringify(data, null, 2)}`;
            
            // FIX: Using gemini-3-flash-preview as per task type
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `You MUST use this mapping to understand question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${promptText}`,
                config: {
                    systemInstruction: AI_ANNUAL_TRAINING_PLAN_PROMPT_INSTRUCTIONS,
                    responseMimeType: "application/json",
                    responseSchema: aiAnnualTrainingPlanSchema,
                },
            });

            // FIX: Accessing .text property directly
            const jsonStr = response.text?.trim() || '{}';
            const result = JSON.parse(jsonStr) as AiAnnualTrainingPlan;
            setReport(result);
            saveReportToCache(CACHE_KEY_ANNUAL_PLAN, result);
        } catch (e) {
            console.error("AI Training Plan Error:", e);
            setError("An error occurred while generating the AI analysis for the training plan.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cachedData = getReportFromCache<AiAnnualTrainingPlan>(CACHE_KEY_ANNUAL_PLAN);
        if (cachedData) {
            setReport(cachedData);
            setLoading(false);
        } else {
            generateReport();
        }
    }, [data, promptContext]);

    const handleRefresh = () => {
        clearReportCache(CACHE_KEY_ANNUAL_PLAN);
        generateReport();
    };

    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        
        const tableHeaders = ['Training Area', 'Target Audience', 'Delivery Method', 'Priority', 'Quarter', 'Est. Cost (PGK)', 'Rationale'];
        const tableRows = report.trainingPlan.map(item => [
            item.trainingArea,
            item.targetAudience,
            item.deliveryMethod,
            item.priority,
            item.quarter,
            item.estimatedCost,
            item.rationale
        ]);

        return {
            title: `Annual Training Plan - ${report.year || '2026'}`,
            sections: [
                { title: "Executive Summary", content: [report.executiveSummary] },
                { 
                    title: "Detailed Training Plan", 
                    content: [{
                        type: 'table',
                        headers: tableHeaders,
                        rows: tableRows
                    }] 
                }
            ]
        };
    };
    
    const handleExport = (format: 'pdf' | 'xlsx' | 'docx') => {
        try {
            const reportData = getReportDataForExport();
            if(format === 'pdf') {
                 exportToPdf(reportData);
            } else if (format === 'xlsx') {
                 exportToXlsx(reportData);
            } else if (format === 'docx') {
                 exportToDocx(reportData);
            }
        } catch(e) {
             console.error("Export failed:", e);
             alert("Could not export report.");
        }
    };

    const sections = useMemo(() => {
        if (!report) return [];
        return [
            {
                title: "Executive Summary",
                content: (
                    <ReportSection title="Executive Summary" anchorId="exec-summary">
                        <p>{report.executiveSummary}</p>
                    </ReportSection>
                )
            },
            {
                title: "Detailed Training Plan",
                content: (
                    <ReportSection title={`Detailed Annual Training Plan - ${report.year || 2026}`} anchorId="detailed-plan">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-200 dark:bg-gray-700/50 text-xs uppercase">
                                    <tr>
                                        <th className="p-2 font-semibold">Training Area</th>
                                        <th className="p-2 font-semibold">Target Audience</th>
                                        <th className="p-2 font-semibold">Method</th>
                                        <th className="p-2 font-semibold">Priority</th>
                                        <th className="p-2 font-semibold">Quarter</th>
                                        <th className="p-2 font-semibold">Est. Cost</th>
                                        <th className="p-2 font-semibold">Rationale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.trainingPlan.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20">
                                            <td className="p-2 font-semibold">{item.trainingArea}</td>
                                            <td className="p-2">{item.targetAudience}</td>
                                            <td className="p-2">{item.deliveryMethod}</td>
                                            <td className="p-2"><PriorityBadge level={item.priority as any} /></td>
                                            <td className="p-2">{item.quarter}</td>
                                            <td className="p-2">{item.estimatedCost}</td>
                                            <td className="p-2 text-xs">{item.rationale}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ReportSection>
                )
            }
        ];
    }, [report]);

    const handlePrev = () => setCurrentSectionIndex(prev => Math.max(0, prev - 1));
    const handleNext = () => setCurrentSectionIndex(prev => Math.min(sections.length - 1, prev + 1));

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-purple-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Generating Consolidated Plan...</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Gemini is synthesizing all CNA data into a strategic training plan.</p>
                </div>
            );
        }
        if (error) {
            return (
                 <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px] text-center">
                    <XIcon className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                    <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Retry</button>
                </div>
            );
        }
        if (report && sections.length > 0) {
            return (
                <div className="space-y-6">
                    {sections[currentSectionIndex].content}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-purple-500" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Consolidated Training Plan</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <button 
                            onClick={handleRefresh} 
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                            title="Refresh Analysis"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6 flex-1">
                    {renderContent()}
                </main>
                {/* Navigation Bar */}
                {report && (
                    <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md"
                        >
                            <HomeIcon className="w-4 h-4" />
                            <span>Home</span>
                        </button>
                        
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrev}
                                disabled={currentSectionIndex === 0}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeftIcon className="w-4 h-4" />
                                <span>Previous Section</span>
                            </button>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                Section {currentSectionIndex + 1} of {sections.length}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={currentSectionIndex === sections.length - 1}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>Next Section</span>
                                <ArrowRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </footer>
                )}
            </div>
        </div>
    );
};
