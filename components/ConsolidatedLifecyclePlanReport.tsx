import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, QUESTION_TEXT_MAPPING } from '../types';
import { XIcon, SparklesIcon, ClipboardDocumentListIcon, UserCircleIcon, CheckCircleIcon, ArrowRightIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyName: string;
  onClose: () => void;
}

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        lifecycleDistribution: {
            type: Type.OBJECT,
            properties: {
                recruitment: { type: Type.NUMBER },
                earlyCareer: { type: Type.NUMBER },
                careerProgression: { type: Type.NUMBER },
                leadershipTrack: { type: Type.NUMBER },
                exitPrep: { type: Type.NUMBER }
            },
            required: ["recruitment", "earlyCareer", "careerProgression", "leadershipTrack", "exitPrep"]
        },
        strategicInsights: { type: Type.STRING },
        individualPaths: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    officerName: { type: Type.STRING },
                    assignedStage: { type: Type.STRING },
                    primaryObjective: { type: Type.STRING },
                    suggestedIntervention: { type: Type.STRING },
                    staggeredTimeline: { type: Type.STRING }
                },
                required: ["officerName", "assignedStage", "primaryObjective", "suggestedIntervention", "staggeredTimeline"]
            }
        }
    },
    required: ["executiveSummary", "lifecycleDistribution", "strategicInsights", "individualPaths"]
};

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center justify-center mb-8 border-b-2 border-slate-100 pb-8">
        <div className="w-24 h-24 border-2 border-slate-200 rounded-full flex flex-col items-center justify-center bg-white text-slate-300 p-2 text-center shadow-sm mb-3">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30 mb-1">
                <path d="M50 10 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="#EAB308" />
            </svg>
            <span className="text-[7px] font-black uppercase tracking-tighter">Official Seal</span>
        </div>
        <p className="text-[11px] font-bold text-[#1A365D] uppercase tracking-[0.3em]">Independent State of Papua New Guinea</p>
    </div>
);

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
        <span className={`text-2xl font-black ${color} tracking-tighter`}>{value}</span>
    </div>
);

export const ConsolidatedLifecyclePlanReport: React.FC<ReportProps> = ({ data, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("Security Gate: API key missing.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `
                Act as a Workforce Lifecycle Architect. Consolidate the individual development paths for all personnel into a single Strategic Life Cycle Plan for ${agencyName}.
                
                **PERSONNEL DATA ROLL-UP:**
                ${JSON.stringify(data.map(o => ({
                    name: o.name,
                    pos: o.position,
                    grade: o.grade,
                    exp: o.yearsOfExperience,
                    age: o.age,
                    stage: o.lifecycleStage
                })))}

                **DIRECTIVES:**
                1. Categorize everyone into: Recruitment/Entry, Early Career, Career Progression, Leadership Track, or Exit/Retirement Prep.
                2. For each stage, provide a "Strategic Insight" on how the organization should manage that cohort.
                3. Map EVERY individual to a specific path assignment with a staggered timeline (2025-2029).
                4. Use the 70:20:10 learning logic for the "suggestedIntervention" field.
                
                **OUTPUT:** Strictly JSON following the provided schema.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: "You are a Strategic Workforce Planner. Consolidate individual career paths into a national human capital roadmap.",
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });

                setReport(JSON.parse(response.text?.trim() || '{}'));
            } catch (e) {
                console.error(e);
                setError("Consolidation Failure: AI Engine timeout or data volume issue.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, agencyName]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Consolidated Workforce Life Cycle Plan - ${agencyName}`,
            sections: [
                { title: "Executive Strategic Overview", content: [report.executiveSummary] },
                { title: "Strategic Insights by Cohort", content: [report.strategicInsights] },
                { 
                    title: "Individual Path Assignments", 
                    content: [{
                        type: 'table',
                        headers: ['Officer', 'Assigned Stage', 'Objective', 'Primary Intervention', 'Timeline'],
                        rows: report.individualPaths.map((p: any) => [
                            p.officerName, p.assignedStage, p.primaryObjective, p.suggestedIntervention, p.staggeredTimeline
                        ])
                    }],
                    orientation: 'landscape'
                }
            ]
        };
        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };

    if (loading) return (
        <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className="text-center animate-pulse">
                <ClipboardDocumentListIcon className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Lifecycle Consolidation Engine</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Aggregating individual paths into strategic roadmap...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start pt-10 pb-10 px-4 no-print overflow-y-auto font-['Inter']">
            <div className="bg-[#FAFBFD] rounded-[32px] shadow-2xl max-w-6xl w-full flex flex-col border border-slate-200 mb-20 overflow-hidden">
                
                <header className="flex justify-between items-center p-8 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-[#2AAA52] rounded-2xl shadow-lg shadow-emerald-200"><ClipboardDocumentListIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Workforce Life Cycle Plan</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Consolidated Strategic Roadmap • {agencyName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"><XIcon className="w-8 h-8" /></button>
                    </div>
                </header>

                <main className="flex-1 p-12 space-y-16">
                    
                    <PNGNationalCrest />

                    {/* 1. Executive Summary */}
                    <section className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl relative overflow-hidden">
                        <h3 className="text-xs font-black text-[#2AAA52] uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
                            <div className="w-2 h-8 bg-[#2AAA52] rounded-full"></div>
                            Executive Strategic Intent
                        </h3>
                        <p className="text-lg leading-relaxed text-slate-700 font-serif whitespace-pre-wrap">{report?.executiveSummary}</p>
                    </section>

                    {/* 2. Distribution Statistics */}
                    <section>
                         <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-[0.2em] mb-8">Workforce Cohort Distribution</h3>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatCard label="Recruitment/Entry" value={report?.lifecycleDistribution.recruitment} color="text-blue-600" />
                            <StatCard label="Early Career" value={report?.lifecycleDistribution.earlyCareer} color="text-emerald-600" />
                            <StatCard label="Career Progression" value={report?.lifecycleDistribution.careerProgression} color="text-indigo-600" />
                            <StatCard label="Leadership Track" value={report?.lifecycleDistribution.leadershipTrack} color="text-amber-500" />
                            <StatCard label="Exit/Retirement" value={report?.lifecycleDistribution.exitPrep} color="text-rose-500" />
                         </div>
                    </section>

                    {/* 3. Strategic Narrative */}
                    <div className="p-8 bg-[#1A365D] rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                         <h3 className="text-xs font-black text-blue-300 uppercase tracking-[0.3em] mb-4">Strategic Lifecycle Insights</h3>
                         <p className="text-md leading-relaxed font-light italic opacity-90">"{report?.strategicInsights}"</p>
                    </div>

                    {/* 4. Full Personnel Path Registry */}
                    <section className="space-y-8">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-[0.2em]">Individual Path Registry (N={data.length})</h3>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Sorted by Staggered Allocation</span>
                        </div>
                        
                        <div className="overflow-hidden border border-slate-200 rounded-[24px] shadow-sm bg-white">
                            <table className="w-full text-left text-[11px] border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        <th className="p-5">Officer Name</th>
                                        <th className="p-5">Assigned Lifecycle Stage</th>
                                        <th className="p-5">Primary Growth Objective</th>
                                        <th className="p-5">70:20:10 Intervention</th>
                                        <th className="p-5 text-center">Planned Year</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {report?.individualPaths.map((path: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-5 font-black text-slate-900 uppercase tracking-tighter">{path.officerName}</td>
                                            <td className="p-5">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase whitespace-nowrap">
                                                    {path.assignedStage}
                                                </span>
                                            </td>
                                            <td className="p-5 font-bold text-slate-600 leading-tight">{path.primaryObjective}</td>
                                            <td className="p-5 text-slate-500 italic font-medium leading-relaxed max-w-xs">{path.suggestedIntervention}</td>
                                            <td className="p-5 text-center">
                                                <div className="px-3 py-1 bg-[#1A365D] text-white rounded-lg font-black text-[10px] shadow-sm">
                                                    {path.staggeredTimeline}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="bg-slate-50 p-10 rounded-[40px] text-center border border-dashed border-slate-300">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Official Declaration</h3>
                         <p className="text-sm italic text-slate-500 font-serif leading-relaxed max-w-2xl mx-auto">
                            "This Consolidated Life Cycle Plan constitutes the validated strategic roadmap for the 2025-2029 period. Individual officer paths are aligned with national establishment requirements and capability diagnostic results."
                         </p>
                    </div>

                </main>

                <footer className="p-8 border-t border-slate-100 bg-white flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <span>DPM PNG - Strategic Capability Unit</span>
                    <span>Classified Personnel Record</span>
                </footer>
            </div>
        </div>
    );
};
