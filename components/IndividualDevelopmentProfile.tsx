import React, { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiIndividualDevelopmentPlan, AiLearningSolution, QUESTION_TEXT_MAPPING } from '../types';
import { AI_INDIVIDUAL_DEVELOPMENT_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, UserCircleIcon, CalendarDaysIcon, IdentificationIcon, AcademicCapIcon, BuildingOfficeIcon, ChevronDownIcon, ArrowDownTrayIcon } from './icons';
import { exportToDocx, exportToXlsx, exportToCsv, copyForSheets, ReportData } from '../utils/export';
import { exportOfficialReport } from '../utils/pdfExport';
import { ExportMenu } from './ExportMenu';

interface SummaryProps {
  officer: OfficerRecord;
  agencyName: string;
  onClose: () => void;
}

const aiIndividualDevelopmentPlanSchema = {
    type: Type.OBJECT,
    properties: {
        officerStatus: { type: Type.STRING },
        age: { type: Type.NUMBER },
        lifecycleStage: { type: Type.STRING },
        retirementWarning: { type: Type.STRING },
        performanceCategory: { type: Type.STRING, enum: ['Excellent', 'Satisfactory', 'Unsatisfactory'] },
        promotionPotential: { type: Type.STRING, enum: ['Overdue for Promotion', 'Promotion Now', 'Needs Development', 'Not Promotable'] },
        plan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING, enum: ['Qualifications & Experience', 'Skills', 'Knowledge'] },
                    needs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                perceivedArea: { type: Type.STRING },
                                jobRequirement: { type: Type.STRING },
                                proposedCourse: { type: Type.STRING },
                                institution: { type: Type.STRING },
                                fundingSource: { type: Type.STRING },
                                yearOfCommencement: { type: Type.NUMBER },
                                gapType: { type: Type.STRING, enum: ['Skill', 'Qualification'] },
                                remarks: { type: Type.STRING },
                                learningSolution: {
                                    type: Type.OBJECT,
                                    properties: {
                                        experiential70: { type: Type.STRING },
                                        social20: { type: Type.STRING },
                                        formal10: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

const PNGNationalCrestPlaceholder = () => (
    <div className="flex flex-col items-center justify-center mb-8 border-b-2 border-slate-100 pb-8">
        <div className="w-32 h-32 border-2 border-slate-200 rounded-full flex flex-col items-center justify-center bg-white text-slate-400 p-2 text-center shadow-sm mb-4">
            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 mb-1">
                <path d="M50 10 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="#EAB308" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-tighter leading-tight">National Crest</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Independent State of Papua New Guinea</p>
    </div>
);

export const IndividualDevelopmentProfile: React.FC<SummaryProps> = ({ officer, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) { setError("API key missing."); setLoading(false); return; }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Generate a Workforce Lifecycle Plan for: ${JSON.stringify(officer, null, 2)}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_INDIVIDUAL_DEVELOPMENT_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiIndividualDevelopmentPlanSchema as any,
                    },
                });
                setReport(JSON.parse(response.text?.trim() || '{}'));
            } catch (e) { setError("Failed to aggregate lifecycle data."); } finally { setLoading(false); }
        };
        generateReport();
    }, [officer]);

    const handleExport = async (format: string) => {
        if (!report) return;
        if (format === 'pdf') {
            await exportOfficialReport('individual-report-a4', `LND_Plan_${officer.name}`);
        } else if (format === 'docx') {
            const reportData: ReportData = {
                title: `Training & Development Plan - ${officer.name}`,
                sections: [{ title: "Officer Details", content: [`Name: ${officer.name}`, `Division: ${officer.division}`] }]
            };
            exportToDocx(reportData);
        }
    };

    const toggleRow = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
            return newSet;
        });
    };

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start overflow-y-auto no-print px-4 py-10">
            <div className="max-w-7xl w-full">
                <header className="flex justify-between items-center mb-10 no-print">
                    <h1 className="text-white text-3xl font-black uppercase tracking-tighter">Officer Lifecycle Monitoring</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-6 py-3 bg-[#2AAA52] hover:bg-[#238C44] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">
                            <ArrowDownTrayIcon className="w-4 h-4" /> High-Fidelity Export
                        </button>
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-4 bg-white/10 hover:bg-rose-600 text-white rounded-xl backdrop-blur-xl border border-white/10 shadow-xl transition-all">
                            <XIcon className="w-8 h-8" />
                        </button>
                    </div>
                </header>

                <main id="individual-report-a4" className="high-fidelity-report bg-white shadow-2xl rounded-[24px] border border-slate-100 mb-20 relative p-12 overflow-hidden min-h-[297mm]">
                    {loading ? (
                        <div className="text-center p-24"><SparklesIcon className="w-20 h-20 mx-auto animate-pulse text-blue-500 opacity-40" /><p className="mt-6 font-black text-slate-400 uppercase tracking-[0.3em]">Mapping Lifecycle Paths...</p></div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-600 font-black uppercase tracking-widest">{error}</div>
                    ) : report && (
                        <div className="animate-fade-in">
                            <PNGNationalCrestPlaceholder />
                            <div className="text-center mb-10">
                                <h1 className="font-black text-3xl text-[#1A365D] uppercase tracking-[0.15em] mb-2">TRAINING & DEVELOPMENT PLAN 2025 - 2029</h1>
                                <span className="px-4 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200">Stage: {report.lifecycleStage}</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 text-sm mb-12 bg-[#F8FAFC] rounded-[20px] border border-slate-100">
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Division</p><p className="font-bold text-[#1A365D]">{officer.division}</p></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Officer Name</p><p className="font-bold text-[#1A365D]">{officer.name}</p></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Position No.</p><p className="font-bold text-[#1A365D]">{officer.positionNumber || 'N/A'}</p></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Substantive Title</p><p className="font-bold text-[#1A365D] truncate">{officer.position}</p></div>
                            </div>
                            
                            <div className="overflow-hidden border border-slate-200 rounded-[20px] shadow-sm mb-12">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-[#1A365D] text-white">
                                        <tr>
                                            <th className="p-5 uppercase tracking-widest font-black">Area / Gap Identification</th>
                                            <th className="p-5 uppercase tracking-widest font-black">Path Type</th>
                                            <th className="p-5 uppercase tracking-widest font-black">Proposed Intervention</th>
                                            <th className="p-5 uppercase tracking-widest font-black text-center">Commence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.plan?.map((category: any) => (
                                            <React.Fragment key={category.category}>
                                                <tr className="bg-slate-100 border-y border-slate-200"><td colSpan={4} className="p-5 font-black text-[#1A365D] uppercase tracking-widest">{category.category}</td></tr>
                                                {category.needs.map((need: any, index: number) => (
                                                    <tr key={index} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="p-5 font-bold text-slate-700">{need.perceivedArea}</td>
                                                        <td className="p-5"><span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-[9px] font-black uppercase">{need.gapType || 'Skill'}</span></td>
                                                        <td className="p-5 font-black text-blue-700">{need.proposedCourse}</td>
                                                        <td className="p-5 text-center font-black text-[#1A365D]">{need.yearOfCommencement}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};