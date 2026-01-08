import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AiSuccessionPlanReport, SuccessionCandidate } from '../types';
import { AI_SUCCESSION_PLAN_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, UsersIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyName: string;
  onClose: () => void;
}

const successionCandidateSchema = {
    type: Type.OBJECT,
    properties: {
        roleOrPosition: { type: Type.STRING },
        potentialSuccessors: { type: Type.ARRAY, items: { type: Type.STRING } },
        readinessLevel: { type: Type.STRING, enum: ['Ready Now', '1-2 Years', '3-5 Years', 'Long-term'] },
        developmentNeeds: { type: Type.STRING, description: "Analyze gaps. Distinguish 'Skill' (workshop) vs 'Qualification' (diploma/degree) for target role grade." },
        estimatedTimeline: { type: Type.STRING },
    },
    required: ["roleOrPosition", "potentialSuccessors", "readinessLevel", "developmentNeeds", "estimatedTimeline"]
};

const aiSuccessionPlanReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        successionPlan: {
            type: Type.ARRAY,
            items: successionCandidateSchema
        }
    },
    required: ["executiveSummary", "successionPlan"],
};

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center justify-center mb-8 border-b-2 border-slate-100 pb-6">
        <div className="w-24 h-24 border-2 border-slate-200 rounded-full flex flex-col items-center justify-center bg-white text-slate-300 p-2 text-center shadow-sm mb-3">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30 mb-1">
                <path d="M50 10 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="#EAB308" />
            </svg>
            <span className="text-[7px] font-black uppercase tracking-tighter">National Crest</span>
        </div>
        <p className="text-[11px] font-bold text-[#1A365D] uppercase tracking-[0.3em]">Independent State of Papua New Guinea</p>
    </div>
);

const ReportSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 page-break-inside-avoid">
        <h2 className="text-xl font-bold text-[#1A365D] dark:text-blue-400 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 uppercase tracking-wider">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

export const SuccessionPlanReport: React.FC<ReportProps> = ({ data, establishmentData, agencyName, onClose }) => {
    const [report, setReport] = useState<AiSuccessionPlanReport | null>(null);
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
                /* Correct initialization as per guidelines using named parameter */
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const promptText = `Generate a High-Fidelity Succession Plan for "${agencyName}".
                
                **Lifecycle Mapping (Mandatory):**
                For each identified successor:
                1. Check if they have the skills but lack the qualification for the target position's grade.
                2. If so, recommend specific SILAG or tertiary qualification courses.
                3. Use the 'Development Needs / Actions' column to project specific training solutions (70:20:10).
                
                Establishment Registry: ${JSON.stringify(establishmentData, null, 2)}
                CNA Records: ${JSON.stringify(data.map(o => ({ name: o.name, pos: o.position, grade: o.grade, qual: o.jobQualification, spa: o.spaRating })), null, 2)}
                `;
                
                /* Updated model to gemini-3-flash-preview as per coding guidelines */
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_SUCCESSION_PLAN_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSuccessionPlanReportSchema,
                    },
                });

                /* Accessing .text property directly instead of text() method as per guidelines */
                const textResponse = response.text || '';
                setReport(JSON.parse(textResponse.trim()));
            } catch (e) {
                console.error("Succession Plan Error:", e);
                setError("System failed to generate leader pipeline assessment.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, establishmentData, agencyName]);
    
    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Succession Plan Report - ${agencyName}`,
            sections: [
                { title: "Executive Summary", content: [report.executiveSummary] },
                { 
                    title: "Strategic Succession Plan", 
                    content: [{
                        type: 'table',
                        headers: ['Critical Role', 'Successor Candidate(s)', 'Readiness', 'Development Needs / Actions', 'Estimated Timeline'],
                        rows: report.successionPlan.map(plan => [
                            plan.roleOrPosition,
                            plan.potentialSuccessors.join(', '),
                            plan.readinessLevel,
                            plan.developmentNeeds,
                            plan.estimatedTimeline
                        ])
                    }],
                    orientation: 'landscape'
                }
            ]
        };

        if(format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };
    
    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in no-print overflow-y-auto" aria-modal="true" role="dialog">
            <div className="bg-slate-50 dark:bg-slate-950 rounded-[24px] shadow-2xl max-w-7xl w-full flex flex-col mb-12">
                <header className="flex justify-between items-center p-8 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900 rounded-t-[24px]">
                     <div className="flex items-center gap-5">
                        <UsersIcon className="w-10 h-10 text-[#1A365D] dark:text-blue-400" />
                        <div>
                            <h1 className="text-2xl font-black text-[#1A365D] dark:text-white uppercase tracking-tighter">Succession Strategy</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Leadership Pipeline & Risk Monitor</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm">
                            <XIcon className="w-7 h-7" />
                        </button>
                    </div>
                </header>
                
                <main className="p-10 bg-white dark:bg-slate-900 min-h-[600px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96">
                            <SparklesIcon className="w-16 h-16 text-blue-500 animate-pulse" />
                            <h2 className="mt-6 text-xl font-black text-slate-400 uppercase tracking-widest text-center">Scanning Establishment Registry for Risk...</h2>
                        </div>
                    ) : error ? (
                        <div className="p-8 bg-rose-50 text-rose-700 rounded-2xl text-center font-bold">{error}</div>
                    ) : report && (
                        <div className="animate-fade-in max-w-5xl mx-auto">
                            <PNGNationalCrest />
                            <div className="text-center mb-12">
                                <h1 className="text-3xl font-black text-[#1A365D] dark:text-white tracking-[0.2em] uppercase">OFFICIAL SUCCESSION REGISTER</h1>
                                <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest">{agencyName}</p>
                            </div>

                            <ReportSection title="Executive Summary">
                                <p className="leading-relaxed text-md font-medium">{report.executiveSummary}</p>
                            </ReportSection>

                            <ReportSection title="Succession Strategy & Lifecycle Intervention">
                                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-[16px]">
                                    <table className="w-full text-left text-[11px] border-collapse">
                                        <thead className="bg-[#1A365D] text-white">
                                            <tr>
                                                <th className="p-4 uppercase tracking-widest font-black">Target Role</th>
                                                <th className="p-4 uppercase tracking-widest font-black">Identified Successor(s)</th>
                                                <th className="p-4 uppercase tracking-widest font-black text-center">Readiness</th>
                                                <th className="p-4 uppercase tracking-widest font-black">Development Needs / Actions</th>
                                                <th className="p-4 uppercase tracking-widest font-black text-center">Timeline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {report.successionPlan.map((plan, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-800 dark:text-white">{plan.roleOrPosition}</td>
                                                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{plan.potentialSuccessors.join(', ')}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            plan.readinessLevel === 'Ready Now' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {plan.readinessLevel}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 leading-relaxed font-semibold text-slate-600 dark:text-slate-400">
                                                        {plan.developmentNeeds}
                                                    </td>
                                                    <td className="p-4 text-center font-black text-[#1A365D] dark:text-blue-400 whitespace-nowrap">{plan.estimatedTimeline}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ReportSection>
                        </div>
                    )}
                </main>
                
                <footer className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 rounded-b-[24px] flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <span>{CUSTODIAN}</span>
                    <span>Classified Personnel Record</span>
                </footer>
            </div>
        </div>
    );
};

const CUSTODIAN = "System Custodian: Department of Personnel Management (DPM)";
