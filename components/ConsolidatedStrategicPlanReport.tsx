import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, EstablishmentRecord, StructuredCorporatePlan } from '../types';
import { AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, DocumentChartBarIcon, ArrowPathIcon, HomeIcon, BriefcaseIcon, AcademicCapIcon, ScaleIcon, CalendarDaysIcon, ChartBarSquareIcon, CheckCircleIcon, IdentificationIcon } from './icons';
import { DataAggregator } from '../services/DataAggregator';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiConsolidatedStrategicPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveNarrative: { type: Type.STRING },
        section1_Foreword: { type: Type.STRING, description: "Dynamic Foreword following the Secretary/CEO draft template." },
        section2_Framework: { type: Type.STRING },
        section3_Diagnostic: { type: Type.STRING },
        section4_Predictive: { type: Type.STRING },
        section5_Fiscal: { type: Type.STRING },
        section6_Pathways: { type: Type.STRING },
        section7_Execution: { type: Type.STRING },
        ganttData: {
           type: Type.ARRAY,
           items: {
               type: Type.OBJECT,
               properties: {
                   task: { type: Type.STRING },
                   phase: { type: Type.STRING, enum: ['Stabilization', 'Mentoring', 'Elite Track', 'Onboarding'] },
                   startYear: { type: Type.NUMBER },
                   durationYears: { type: Type.NUMBER }
               },
               required: ["task", "phase", "startYear", "durationYears"]
           }
        }
    },
    required: ["executiveNarrative", "section1_Foreword", "section2_Framework", "section3_Diagnostic", "section4_Predictive", "section5_Fiscal", "section6_Pathways", "section7_Execution", "ganttData"]
};

const RoadmapGantt: React.FC<{ data: any[] }> = ({ data }) => {
    const years = [2025, 2026, 2027, 2028, 2029];
    const colors = {
        'Stabilization': 'bg-blue-600',
        'Mentoring': 'bg-emerald-600',
        'Elite Track': 'bg-amber-500',
        'Onboarding': 'bg-slate-400'
    };

    return (
        <div className="mt-8 bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl overflow-x-auto">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 text-center underline decoration-slate-200 underline-offset-8">Execution Roadmap: 5-Year Staggered Distribution</h4>
            <div className="min-w-[900px]">
                <div className="grid grid-cols-12 mb-6 border-b-2 border-slate-50 pb-4">
                    <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Capability Initiative</div>
                    {years.map(y => (
                        <div key={y} className="col-span-1 text-center text-[10px] font-black text-[#1A365D]">{y}</div>
                    ))}
                    <div className="col-span-3"></div>
                </div>
                <div className="space-y-6">
                    {data.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 items-center">
                            <div className="col-span-4 pr-6">
                                <p className="text-xs font-black text-[#1A365D] uppercase tracking-tight">{item.task}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{item.phase} Phase</p>
                            </div>
                            <div className="col-span-8 relative h-8 bg-slate-50/50 rounded-2xl overflow-hidden border border-slate-100/50">
                                <div 
                                    className={`absolute h-full rounded-2xl ${colors[item.phase as keyof typeof colors] || 'bg-slate-300'} shadow-lg transform transition-all duration-1000`}
                                    style={{ 
                                        left: `${((item.startYear - 2025) / 5) * 100}%`,
                                        width: `${(item.durationYears / 5) * 100}%`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const ConsolidatedStrategicPlanReport: React.FC<ReportProps> = ({ 
    data, 
    establishmentData, 
    agencyType,
    agencyName, 
    onClose 
}) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnnex, setShowAnnex] = useState(false);

    // Dynamic Title Logic
    const leadershipTitle = useMemo(() => {
        if (agencyType === 'Provincial Health Authority') return 'Chief Executive Officer';
        return 'Secretary';
    }, [agencyType]);

    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    // Deterministic Top 5 Elite Cohort (Bucket 1 Logic)
    const eliteCohort = useMemo(() => {
        return [...data]
            .map(officer => {
                const avgProficiency = officer.capabilityRatings.length > 0
                    ? officer.capabilityRatings.reduce((sum, r) => sum + r.currentScore, 0) / officer.capabilityRatings.length
                    : 0;
                const validationScore = parseInt(officer.spaRating) || 0;
                const combinedScore = (avgProficiency / 10) * 0.5 + (validationScore / 5) * 0.5;
                return { name: officer.name, score: combinedScore, pos: officer.position, grade: officer.grade };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }, [data]);

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        if (!process.env.API_KEY) {
            setError("Security Gate: System API missing.");
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
            Act as a Strategic Human Capital Planner. Generate a 5-Year Consolidated Strategic Plan for ${agencyName}.
            
            **DYNAMIC FOREWORD TEMPLATE (FOLLOW THIS EXACTLY):**
            From: ${leadershipTitle}
            Subject: Strategic Capability Roadmap (2025–2030)
            
            [Paragraph 1: Welcome and link to Corporate Plan]
            
            ### Our Current Capability Landscape
            Our recent CNA Diagnostic Summary (Total Participants: ${stats.cnaParticipants} out of ${stats.onStrength} staff on strength) has provided a baseline:
            * Institutional Baseline: ${stats.baselineScore.toFixed(1)}/10
            * Operational Effectiveness: ${stats.peakSector.score.toFixed(1)} (Peak Sector: ${stats.peakSector.name})
            * Lifecycle Risks: ${stats.retirementRiskCount} key personnel retiring within the next 5 years.
            
            ### The 70:20:10 Strategic Framework
            1. 70% Experiential (On-the-Job): Rotations in Gap Sector (${stats.gapSector.name} at ${stats.gapSector.score.toFixed(1)} proficiency).
            2. 20% Social (Mentorship): Leverage 100% Validated status personnel.
            3. 10% Formal (Elite Pathway): Reserved for Top 5 Performing Officers: ${eliteCohort.map(c => c.name).join(', ')}.
            
            **DYNAMIC LEADERSHIP MAPPING:**
            - Primary Signatory Title: ${leadershipTitle} (Mandatory for all signatures and TOC).
            
            **BUCKETED 70:20:10 STRATEGY:**
            1. **BUCKET 1 (10% ELITE FORMAL):** Restricted ONLY to the Top 5. Target: Masters/Degrees.
            2. **BUCKET 2 (20% SOCIAL):** For mid-tier performers.
            3. **BUCKET 3 (70% EXPERIENTIAL):** Focus exclusively on immediate Gap Sector (${stats.gapSector.name}).
            
            **OUTPUT:** Strictly JSON per schema. Generate a full, professional foreword based on the template above.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: {
                    systemInstruction: AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS,
                    responseMimeType: "application/json",
                    responseSchema: aiConsolidatedStrategicPlanSchema,
                },
            });

            setReport(JSON.parse(response.text?.trim() || '{}'));
        } catch (e) {
            console.error(e);
            setError("Synthesis Failure: Metadata inconsistency.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateReport();
    }, [agencyName]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Consolidated Strategic Plan - ${agencyName}`,
            sections: [
                { title: `Executive Foreword - ${leadershipTitle}`, content: [report.section1_Foreword] },
                { title: "Diagnostic Summary", content: [report.section3_Diagnostic] },
                { 
                    title: "Annex A: Elite Succession Cohort (Restricted)", 
                    content: [{
                        type: 'table',
                        headers: ['Rank', 'Officer Name', 'Current Position', 'Proficiency (Normalized)'],
                        rows: eliteCohort.map((c, i) => [`#0${i+1}`, c.name, c.pos, c.score.toFixed(2)])
                    }]
                }
            ]
        };
        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };

    if (loading) return (
        <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 font-['Inter']">
            <div className="text-center animate-pulse">
                <SparklesIcon className="w-20 h-20 text-[#2AAA52] mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic Intelligence Terminal</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Generating Dynamic ${leadershipTitle} Foreword...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-start pt-10 pb-10 px-4 no-print overflow-y-auto font-['Inter']">
            <div className="bg-[#FAFBFD] rounded-[40px] shadow-2xl max-w-6xl w-full flex flex-col border border-slate-200 mb-20 overflow-hidden">
                
                {/* Master Header */}
                <header className="flex justify-between items-center p-10 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-8">
                            <button onClick={onClose} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-2xl transition-all"><HomeIcon className="w-7 h-7" /></button>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Strategic Plan 2025-2029</h1>
                            <p className="text-[10px] font-bold text-[#2AAA52] uppercase tracking-widest mt-2">{leadershipTitle}'s Capability Instrument</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm">
                            <XIcon className="w-8 h-8" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-12 space-y-16">
                    
                    {/* Executive Message / Section 1 */}
                    <section className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                             <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Headcount Verify</span>
                                <span className="text-2xl font-black text-[#1A365D]">{stats.cnaParticipants}</span>
                                <span className="text-[7px] font-bold text-slate-400 uppercase">Respondents</span>
                             </div>
                        </div>
                        <div className="max-w-4xl">
                            <h3 className="text-xs font-black text-[#059669] uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <div className="w-2 h-8 bg-[#059669] rounded-full"></div>
                                Section 1: Executive Foreword
                            </h3>
                            <div className="prose prose-slate max-w-none font-serif text-slate-800 leading-[1.8] whitespace-pre-wrap">
                                {report?.section1_Foreword}
                            </div>
                            
                            <div className="mt-12 flex items-center gap-6 pt-8 border-t border-slate-100">
                                <div className="w-48 h-12 border-b border-slate-300"></div>
                                <div>
                                    <p className="text-sm font-black uppercase text-slate-900 leading-none">Secretary, DPM</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Electronic Signatory</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 - Unique Diagnostic Source */}
                    <div className="bg-blue-50 rounded-[40px] p-10 border border-blue-100 relative overflow-hidden shadow-inner">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg"><ChartBarSquareIcon className="w-6 h-6 text-white" /></div>
                            <div>
                                <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">3. Current Capability Diagnostic</h3>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Institutional Baseline Intelligence</p>
                            </div>
                        </div>
                        <p className="text-sm text-blue-800 leading-relaxed font-medium mb-6">{report?.section3_Diagnostic}</p>
                        <div className="flex gap-4">
                            <div className="px-5 py-3 bg-white rounded-xl border border-blue-100 font-black text-[#1A365D] text-lg">Baseline: {stats.baselineScore.toFixed(1)}/10</div>
                            <div className="px-5 py-3 bg-white rounded-xl border border-blue-100 font-black text-[#1A365D] text-lg">Validation: {stats.dataIntegrityScore.toFixed(0)}%</div>
                        </div>
                    </div>

                    {/* Restricted Annex A */}
                    <section className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-rose-600 rounded-2xl shadow-lg shadow-rose-900/40 animate-pulse"><IdentificationIcon className="w-6 h-6 text-white" /></div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Annex A: Restricted Elite Talent Roll</h3>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-1">10% Formal Training Track Assignment</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowAnnex(!showAnnex)}
                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                            >
                                {showAnnex ? 'Hide Protected Data' : 'Authorize View'}
                            </button>
                        </div>
                        
                        {showAnnex && (
                            <div className="animate-fade-in space-y-6">
                                <p className="text-sm text-slate-400 font-medium italic">
                                    "The following officers have been identified through the CNA Matrix as the highest-performing assets for succession planning. Formal educational investments are strictly limited to this cohort to maintain institutional excellence."
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {eliteCohort.map((c, i) => (
                                        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-rose-500 transition-all group">
                                            <span className="text-[8px] font-black text-rose-400 uppercase mb-2 block">Candidate #0{i+1}</span>
                                            <p className="text-sm font-black text-white uppercase leading-tight group-hover:text-rose-400">{c.name}</p>
                                            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase truncate">{c.pos}</p>
                                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[8px] font-black text-slate-400 uppercase">Proficiency</span>
                                                <span className="text-xs font-black text-emerald-400">{c.score.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Gantt / Roadmap */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">7. Execution Roadmap</span>
                             <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{report?.section7_Execution}</p>
                        </div>
                        <RoadmapGantt data={report?.ganttData || []} />
                    </div>

                </main>
            </div>
        </div>
    );
};
