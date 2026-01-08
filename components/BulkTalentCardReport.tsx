import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AiTalentCardReport, QUESTION_TEXT_MAPPING, SpaSummary, CapabilityAnalysisItem, AiProgressionAnalysis } from '../types';
import { AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, ChevronDownIcon, UserCircleIcon, GlobeAltIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';

const aiLearningSolutionSchema = {
    type: Type.OBJECT,
    properties: {
        experiential70: { type: Type.STRING },
        social20: { type: Type.STRING },
        formal10: { type: Type.STRING },
    },
    required: ["experiential70", "social20", "formal10"]
};

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

const aiProgressionAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        currentPositionSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingCurrentSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        nextPositionSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        progressionSummary: { type: Type.STRING },
    },
    required: ["currentPositionSkills", "missingCurrentSkills", "nextPositionSkills", "progressionSummary"]
};

const aiTalentCardReportSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING, description: "A brief introductory paragraph summarizing the officer's background details for context." },
        employeeId: { type: Type.STRING },
        division: { type: Type.STRING },
        spaSummary: {
            type: Type.OBJECT,
            properties: {
                performanceRating: { type: Type.STRING },
                performanceCategory: { type: Type.STRING, enum: ['Well Above Required', 'Above Required', 'At Required Level', 'Below Required Level', 'Well Below Required Level', 'Not Rated'] },
                explanation: { type: Type.STRING },
            },
            required: ["performanceRating", "performanceCategory", "explanation"]
        },
        capabilityAnalysis: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    domain: { type: Type.STRING },
                    currentScore: { type: Type.NUMBER, description: "The calculated current performance score for this domain, from 0-10." },
                    gapScore: { type: Type.NUMBER, description: "The calculated gap score for this domain (10 - currentScore)." },
                    learningSolution: aiLearningSolutionSchema,
                    sdgAlignment: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                sdgNumber: { type: Type.NUMBER },
                                sdgName: { type: Type.STRING },
                            },
                            required: ["sdgNumber", "sdgName"],
                        }
                    }
                },
                required: ["domain", "currentScore", "gapScore", "learningSolution"]
            }
        },
        progressionAnalysis: aiProgressionAnalysisSchema,
        summary: aiReportSummarySchema,
    },
    required: ["introduction", "employeeId", "division", "spaSummary", "capabilityAnalysis", "progressionAnalysis", "summary"]
};


interface BulkReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  onClose: () => void;
}

const TalentCardView: React.FC<{ report: AiTalentCardReport }> = ({ report }) => {
    const talentCategoryStyles: Record<string, string> = {
        'Well Above Required': 'text-green-600 dark:text-green-400',
        'Above Required': 'text-sky-600 dark:text-sky-400',
        'At Required Level': 'text-yellow-500 dark:text-yellow-400',
        'Below Required Level': 'text-orange-600 dark:text-orange-400',
        'Well Below Required Level': 'text-red-600 dark:text-red-400',
        'Not Rated': 'text-slate-500 dark:text-slate-400',
    };

    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-4">{report.introduction}</p>

            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">SPA Summary (Performance)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                         <p className="text-xs uppercase font-semibold text-slate-500">Performance Rating</p>
                         <p><span className={`font-bold text-lg ${talentCategoryStyles[report.spaSummary.performanceCategory]}`}>{report.spaSummary.performanceCategory}</span> ({report.spaSummary.performanceRating}/5)</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase font-semibold text-slate-500">AI Explanation</p>
                        <p className="italic text-slate-600 dark:text-slate-400">{report.spaSummary.explanation}</p>
                    </div>
                 </div>
            </div>

            <div className="mt-4">
                <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-2">Capability & Progression Analysis</h3>
                <div className="space-y-3">
                    {report.capabilityAnalysis.map((gap, index) => (
                        <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-blue-700 dark:text-blue-400">{gap.domain}</h4>
                                <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                    <p>Score: <b className="text-slate-700 dark:text-slate-200">{gap.currentScore.toFixed(1)}/10</b></p>
                                    <p className="font-bold text-red-600 dark:text-red-400">Gap: {(gap.gapScore / 10 * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                            <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                <li className="flex items-start"><span className="font-bold w-16 flex-shrink-0">70% Exp:</span><p>{gap.learningSolution.experiential70}</p></li>
                                <li className="flex items-start"><span className="font-bold w-16 flex-shrink-0">20% Social:</span><p>{gap.learningSolution.social20}</p></li>
                                <li className="flex items-start"><span className="font-bold w-16 flex-shrink-0">10% Formal:</span><p>{gap.learningSolution.formal10}</p></li>
                            </ul>
                        </div>
                    ))}
                    {report.progressionAnalysis && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-md text-purple-700 dark:text-purple-400 mb-2">Career Progression</h4>
                             <p className="text-sm italic text-slate-600 dark:text-slate-400 mb-2">{report.progressionAnalysis.progressionSummary}</p>
                             <div className="grid grid-cols-3 gap-2 text-xs">
                                 <div><p className="font-bold text-green-600">Current Skills:</p><ul className="list-disc list-inside">{report.progressionAnalysis.currentPositionSkills.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                                 <div><p className="font-bold text-orange-600">Gaps (Current Role):</p><ul className="list-disc list-inside">{report.progressionAnalysis.missingCurrentSkills.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                                 <div><p className="font-bold text-blue-600">For Next Level:</p><ul className="list-disc list-inside">{report.progressionAnalysis.nextPositionSkills.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const BulkTalentCardReport: React.FC<BulkReportProps> = ({ data, establishmentData, onClose }) => {
    const [reports, setReports] = useState<({ report: AiTalentCardReport; officer: OfficerRecord })[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);

    useEffect(() => {
        const generateReports = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }

            const officersToProcess = data.filter(o => o.capabilityRatings.some(r => r.currentScore <= 8));

            if (officersToProcess.length === 0) {
                setError("No officers found with identified capability gaps (score <= 8).");
                setLoading(false);
                return;
            }

            setProgress({ current: 0, total: officersToProcess.length });
            
            /* Correct initialization using named parameter */
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const generatedReports: ({ report: AiTalentCardReport; officer: OfficerRecord })[] = [];

            for (const officer of officersToProcess) {
                try {
                    const prompt = `You MUST use this mapping to understand the question codes in the data.
                    QUESTION MAPPING:
                    ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}
                    
                    You MUST use this establishment data to understand the organizational structure and potential career paths.
                    ESTABLISHMENT DATA:
                    ${JSON.stringify(establishmentData, null, 2)}
                    
                    Please generate a talent profile card for the following officer:\n${JSON.stringify(officer, null, 2)}`;
                
                    /* Updated model to gemini-3-flash-preview as per coding guidelines */
                    const response = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: prompt,
                        config: {
                            systemInstruction: AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS,
                            responseMimeType: "application/json",
                            responseSchema: aiTalentCardReportSchema,
                        },
                    });

                    /* Correctly accessing .text property instead of text() method */
                    const textResponse = response.text || '';
                    const parsedReport = JSON.parse(textResponse.trim()) as AiTalentCardReport;
                    generatedReports.push({ report: parsedReport, officer });
                    setProgress(p => ({ ...p, current: p.current + 1 }));

                } catch (e) {
                    console.error(`Failed to generate report for ${officer.name}:`, e);
                }
            }

            setReports(generatedReports);
            setLoading(false);
        };

        generateReports();
    }, [data, establishmentData]);

    const getReportDataForExport = (): ReportData => {
        const sections = reports.map(({ report, officer }) => {
            const capabilityContent = report.capabilityAnalysis.map(item => 
                `**Domain: ${item.domain} (Score: ${item.currentScore.toFixed(1)}/10)**\n` +
                `- 70% Experiential: ${item.learningSolution.experiential70}\n` +
                `- 20% Social: ${item.learningSolution.social20}\n` +
                `- 10% Formal: ${item.learningSolution.formal10}`
            ).join('\n\n');

            return {
                title: `Talent Profile: ${officer.name} (${officer.position})`,
                content: [
                    report.introduction,
                    `**SPA Summary:** ${report.spaSummary.performanceCategory} (${report.spaSummary.performanceRating}/5) - ${report.spaSummary.explanation}`,
                    `\n**Capability Analysis:**\n${capabilityContent}`,
                    `\n**Progression Summary:** ${report.progressionAnalysis.progressionSummary}`,
                ]
            };
        });

        return {
            title: 'Bulk Talent Card Report',
            sections: sections,
        };
    };

    const handleExport = (format: 'pdf' | 'docx') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-amber-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">Generating Talent Cards...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">This may take several minutes depending on the number of officers.</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-4">
                        <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${(progress.current / (progress.total || 1)) * 100}%`, transition: 'width 0.5s' }}></div>
                    </div>
                    <p className="text-sm mt-2 font-semibold">{progress.current} of {progress.total} cards generated.</p>
                </div>
            );
        }
        if (error) return <div className="p-8 bg-red-100 text-red-700 rounded-md text-center"><strong>Error:</strong> {error}</div>;

        return (
            <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {reports.map(({ report, officer }) => {
                    const isOpen = openAccordion === officer.email;
                    return (
                         <div key={officer.email} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                            <button
                                onClick={() => setOpenAccordion(isOpen ? null : officer.email)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <div className="flex items-center gap-3">
                                    <UserCircleIcon className="w-6 h-6 text-slate-500" />
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{officer.name}</p>
                                        <p className="text-xs text-slate-500">{officer.position}</p>
                                    </div>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                             {isOpen && <TalentCardView report={report} />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <UserCircleIcon className="w-7 h-7 text-amber-600" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Talent Card Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={(format) => handleExport(format as any)} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
            </div>
        </div>
    );
};
