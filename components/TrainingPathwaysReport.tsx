import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiTrainingPathwayReport, QUESTION_TEXT_MAPPING } from '../types';
import { XIcon, SparklesIcon, AcademicCapIcon, CheckCircleIcon, IdentificationIcon, ArrowDownTrayIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';
import { exportOfficialReport } from '../utils/pdfExport';

interface ReportProps {
  officer: OfficerRecord;
  agencyName: string;
  onClose: () => void;
}

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        officerName: { type: Type.STRING },
        officerId: { type: Type.STRING },
        executiveRationale: { type: Type.STRING },
        pathwayTimeline: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    year: { type: Type.NUMBER },
                    competencyHeading: { type: Type.STRING },
                    learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendedModule: { type: Type.STRING },
                    evidenceTag: { type: Type.STRING },
                    verificationStatus: { type: Type.STRING, enum: ['Strategically Aligned', 'Priority Gap', 'Succession Critical'] }
                },
                required: ["year", "competencyHeading", "learningObjectives", "recommendedModule", "evidenceTag", "verificationStatus"]
            }
        },
        evidenceRegistry: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    tag: { type: Type.STRING },
                    sourceDescription: { type: Type.STRING },
                    metricValue: { type: Type.STRING }
                },
                required: ["tag", "sourceDescription", "metricValue"]
            }
        }
    },
    required: ["officerName", "officerId", "executiveRationale", "pathwayTimeline", "evidenceRegistry"]
};

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center justify-center mb-8 border-b-2 border-slate-100 pb-8">
        <div className="w-24 h-24 border-2 border-slate-200 rounded-full flex flex-col items-center justify-center bg-white text-slate-300 p-2 text-center shadow-sm mb-3">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30 mb-1">
                <path d="M50 10 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="#EAB308" />
            </svg>
            <span className="text-[7px] font-black uppercase tracking-tighter leading-tight">National Seal</span>
        </div>
        <p className="text-[10px] font-bold text-[#1A365D] uppercase tracking-[0.3em]">Independent State of Papua New Guinea</p>
    </div>
);

export const TrainingPathwaysReport: React.FC<ReportProps> = ({ officer, agencyName, onClose }) => {
    const [report, setReport] = useState<AiTrainingPathwayReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generatePathway = async () => {
            if (!process.env.API_KEY) { setError("API key missing."); setLoading(false); return; }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Act as a National Capability Architect. Generate a high-fidelity 'Training Pathway Timeline' for: ${JSON.stringify(officer, null, 2)}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: "You are an expert L&D strategist. Map officer gaps to standardized training milestones with evidence citations.",
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });
                setReport(JSON.parse(response.text?.trim() || '{}'));
            } catch (e) { setError("Engine failure during pathway mapping."); } finally { setLoading(false); }
        };
        generatePathway();
    }, [officer]);

    const handleExport = async (format: string) => {
        if (!report) return;
        if (format === 'pdf') {
            await exportOfficialReport('pathway-report-a4', `Training_Pathway_${officer.name}`);
        } else {
            const reportData: ReportData = {
                title: `Training Pathway Report - ${officer.name}`,
                sections: [{ title: "Strategic Rationale", content: [report.executiveRationale] }]
            };
            if (format === 'docx') exportToDocx(reportData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start pt-10 pb-10 px-4 no-print overflow-y-auto">
            <div className="max-w-6xl w-full">
                <header className="flex justify-between items-center mb-10 no-print">
                    <h1 className="text-white text-3xl font-black uppercase tracking-tighter">Strategic Pathway Instrument</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-6 py-3 bg-[#2AAA52] hover:bg-[#238C44] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">
                            <ArrowDownTrayIcon className="w-4 h-4" /> High-Fidelity Export
                        </button>
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-sm"><XIcon className="w-8 h-8" /></button>
                    </div>
                </header>

                <main id="pathway-report-a4" className="high-fidelity-report bg-white rounded-[32px] shadow-2xl border border-slate-200 mb-20 p-12 overflow-hidden min-h-[297mm]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <SparklesIcon className="w-20 h-20 text-emerald-400 animate-pulse mx-auto mb-6" />
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Synthesizing Pathway...</h2>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-600 font-bold">{error}</div>
                    ) : report && (
                        <div className="animate-fade-in space-y-12">
                            <PNGNationalCrest />
                            <div className="grid grid-cols-3 gap-8 p-10 bg-slate-50 rounded-[24px] border border-slate-100">
                                <div className="col-span-2">
                                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Executive Rationale</h3>
                                     <p className="text-lg leading-relaxed text-slate-700 font-serif font-medium italic">"{report.executiveRationale}"</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Personnel</p>
                                    <p className="text-xl font-black text-[#1A365D] uppercase leading-none">{report.officerName}</p>
                                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase">{officer.position}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {report.pathwayTimeline.map((milestone: any, idx: number) => (
                                    <div key={idx} className="flex gap-10 items-start">
                                        <div className="w-20 pt-1 flex flex-col items-center shrink-0">
                                            <span className="text-2xl font-black text-[#1A365D]">{milestone.year}</span>
                                            <div className="w-0.5 h-16 bg-slate-100 mt-4"></div>
                                        </div>
                                        <div className="flex-1 bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm hover:border-emerald-200 transition-all">
                                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">{milestone.competencyHeading}</h4>
                                            <p className="text-sm font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 inline-block mb-4">{milestone.recommendedModule}</p>
                                            <ul className="grid grid-cols-2 gap-x-10 gap-y-2 list-disc list-inside text-xs text-slate-600 font-medium">
                                                {milestone.learningObjectives.map((obj: string, i: number) => <li key={i}>{obj}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};