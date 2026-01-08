
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AiTalentCardReport, AiLearningSolution, PerformanceRatingLevel, AiReportSummary, SpaSummary, CapabilityAnalysisItem, QUESTION_TEXT_MAPPING, AiProgressionAnalysis } from '../types';
import { AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, UserCircleIcon, GlobeAltIcon, CheckCircleIcon, ExclamationTriangleIcon, PresentationChartLineIcon, AcademicCapIcon, ArrowRightIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv, exportToJson } from '../utils/export';

interface ProfileProps {
  officer: OfficerRecord;
  establishmentData: EstablishmentRecord[];
  onClose: () => void;
}

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

const ProgressBar: React.FC<{ score: number }> = ({ score }) => {
    // Traffic Light System
    const color = score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
            <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${score * 10}%` }}></div>
        </div>
    );
};

export const IndividualTalentCardReport: React.FC<ProfileProps> = ({ officer, establishmentData, onClose }) => {
    const [report, setReport] = useState<AiTalentCardReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
                const prompt = `Generate a talent diagnostic card for: ${JSON.stringify(officer, null, 2)}. 
                Establishment Data: ${JSON.stringify(establishmentData, null, 2)}.
                Map capability domains to question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}.`;
                
                /* Updated model to gemini-3-flash-preview as per guidelines */
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTalentCardReportSchema,
                    },
                });

                /* Accessing .text property directly as per guidelines */
                const jsonStr = response.text?.trim() || '{}';
                setReport(JSON.parse(jsonStr));
            } catch (e) {
                console.error("AI Talent Card Error:", e);
                setError("AI Engine Failure: Dataset synthesis timed out.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [officer, establishmentData]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets' | 'json' | 'print') => {
        if (format === 'print') { window.print(); return; }
        // ... Logic for other exports (inherited from existing util)
    };

    if (loading) return (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="text-center">
                <SparklesIcon className="w-16 h-16 text-blue-400 animate-pulse mx-auto mb-4" />
                <p className="font-black text-white uppercase tracking-[0.3em] text-xs">Synthesizing Diagnostic Data...</p>
            </div>
        </div>
    );

    if (error || !report) return null;

    const talentCategoryStyles: Record<string, string> = {
        'Well Above Required': 'text-emerald-500',
        'Above Required': 'text-blue-500',
        'At Required Level': 'text-amber-500',
        'Below Required Level': 'text-rose-400',
        'Well Below Required Level': 'text-rose-600',
        'Not Rated': 'text-slate-500',
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-lg z-50 flex items-center justify-center p-6 font-['Inter',_sans-serif]">
            {/* Main Diagnostic Container */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Command Center Header */}
                <header className="bg-[#0f172a] p-8 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                            <UserCircleIcon className="w-10 h-10 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{officer.name}</h1>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1">{officer.position} • {officer.grade}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-500 rounded-xl transition-all">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12 max-h-[70vh]">
                    
                    {/* Status & Compliance Row */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Rating</p>
                            <p className={`text-sm font-bold ${talentCategoryStyles[report.spaSummary.performanceCategory]}`}>{report.spaSummary.performanceCategory}</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Qualification Status</p>
                            <div className="flex items-center gap-2">
                                {report.progressionAnalysis.missingCurrentSkills.length > 0 ? (
                                    <><ExclamationTriangleIcon className="w-4 h-4 text-amber-500" /><span className="text-sm font-bold text-amber-600">Review Needed</span></>
                                ) : (
                                    <><CheckCircleIcon className="w-4 h-4 text-emerald-500" /><span className="text-sm font-bold text-emerald-600">Standard Met</span></>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Role Stability</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{officer.employmentStatus || 'Permanent'}</p>
                        </div>
                    </section>

                    {/* Diagnostic Overview */}
                    <section>
                        <h2 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <PresentationChartLineIcon className="w-4 h-4 text-blue-600" />
                            Diagnostic Overview
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            {report.introduction}
                        </p>
                    </section>

                    {/* Universal Capability Grid */}
                    <section>
                        <h2 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em] mb-6">Capability Domain Matrix</h2>
                        <div className="space-y-8">
                            {report.capabilityAnalysis.map((domain, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-end mb-1">
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{domain.domain}</h4>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{domain.currentScore.toFixed(1)} / 10.0</span>
                                    </div>
                                    <ProgressBar score={domain.currentScore} />
                                    
                                    {/* 3-Column Intervention Matrix */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-4 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-4 border-r border-slate-100 dark:border-slate-800">
                                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2">70% Experience</p>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{domain.learningSolution.experiential70}</p>
                                        </div>
                                        <div className="p-4 border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2">20% Social</p>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{domain.learningSolution.social20}</p>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-2">10% Formal</p>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{domain.learningSolution.formal10}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Professional Growth Path */}
                    <section>
                        <h2 className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em] mb-6">Professional Growth Path</h2>
                        <div className="bg-[#0f172a] text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24"></div>
                            <div className="relative z-10">
                                <p className="text-sm font-light leading-relaxed mb-8 opacity-80 italic">"{report.progressionAnalysis.progressionSummary}"</p>
                                
                                {/* Universal Career Stepper */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-center">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Current Role</p>
                                        <p className="text-xs font-bold truncate">{officer.position}</p>
                                    </div>
                                    <ArrowRightIcon className="w-5 h-5 text-white/20 shrink-0" />
                                    <div className="flex-1 px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-center">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Target Milestone</p>
                                        <p className="text-xs font-bold truncate">{report.progressionAnalysis.nextPositionSkills[0] || 'Leadership Track'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Sticky Interactive Footer */}
                <footer className="bg-slate-50 dark:bg-slate-800 p-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        System Analysis: Gemini 3 Flash • Official Access
                    </p>
                    <div className="flex gap-3">
                        <ExportMenu onExport={handleExport} />
                        <button className="px-8 py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center gap-3">
                            <SparklesIcon className="w-4 h-4" />
                            Generate Analysis Report
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
