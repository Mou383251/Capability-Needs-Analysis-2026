
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiFiveYearPlan, AgencyType, AiReportSummary, QUESTION_TEXT_MAPPING, SuccessionCandidate } from '../types';
import { AI_FIVE_YEAR_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, CalendarDaysIcon, ArrowPathIcon, HomeIcon, ArrowLeftIcon, ArrowRightIcon, ChartBarSquareIcon, BriefcaseIcon, AcademicCapIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { DataAggregator } from '../services/DataAggregator';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: any[];
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

const aiFiveYearPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        trainingPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { type: Type.STRING },
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    proposedCourse: { type: Type.STRING },
                    institution: { type: Type.STRING },
                    fundingSource: { type: Type.STRING },
                    trainingYear: { type: Type.NUMBER },
                    // Fixed property name typo from 'rational' to 'rationale'
                    rationale: { type: Type.STRING }
                },
                required: ["division", "positionNumber", "grade", "designation", "occupant", "proposedCourse", "institution", "fundingSource", "trainingYear", "rationale"]
            }
        },
        summary: aiReportSummarySchema,
    },
    required: ["executiveSummary", "trainingPlan", "summary"],
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-[24px] shadow-sm border border-slate-200 p-8 mb-8 ${className}`}>
        <h2 className="text-xl font-black text-[#1A365D] uppercase tracking-tighter mb-6 border-b border-slate-50 pb-4 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#2AAA52] rounded-full"></div>
            {title}
        </h2>
        <div className="prose prose-sm max-w-none text-slate-600 font-medium leading-relaxed">{children}</div>
    </div>
);

export const FiveYearPlanReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiFiveYearPlan | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    const getPhasedDistributionPrompt = () => {
        const opEffectivenessScore = stats.genderPillarAnalysis['Operational Effectiveness']?.avg || 7.7;
        const gapSectorName = stats.gapSector.name;

        const top5 = [...data]
            .map(officer => {
                const avgProficiency = officer.capabilityRatings.length > 0
                    ? officer.capabilityRatings.reduce((sum, r) => sum + r.currentScore, 0) / officer.capabilityRatings.length
                    : 0;
                const validationScore = parseInt(officer.spaRating) || 0;
                const combinedScore = (avgProficiency / 10 * 0.5) + (validationScore / 5 * 0.5);
                return { name: officer.name, score: combinedScore };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(p => p.name);

        return `
            **DISTRIBUTION LOGIC ENGINE:**
            - Current Baseline: ${stats.baselineScore.toFixed(1)}/10. 
            - Vacancy Pressure: ${stats.vacantPositions} Unfilled Roles.
            
            **PHASE 1: STABILIZATION (YEAR 1 / 2025)**
            - MISSION: Improve 'Operational Effectiveness' (Baseline: ${opEffectivenessScore.toFixed(1)}/10).
            - ACTION: Prioritize short-term internal workshops for the Gap Sector ('${gapSectorName}').
            - TARGET: Focus on induction for the ${stats.vacantPositions} projected recruits.
            
            **PHASE 2: ACADEMIC TRANSFORMATION (YEARS 2-5 / 2026-2029)**
            - MISSION: Long-term Degree/Diploma pathways via SILAG or Tertiary Institutions.
            - ACTION: Stagger 10% Formal training for the Elite Cohort: ${top5.join(', ')}.
            - STAGGERING RULE: Assign no more than 1 Elite candidate to a Degree path per year to manage fiscal ceiling.
            
            **PERSONNEL SOURCE:** ${JSON.stringify(data.map(o => ({ name: o.name, pos: o.position, grade: o.grade })))}
        `;
    };

    const generateReport = async () => {
        setLoading(true);
        setError(null);

        if (!process.env.API_KEY) {
            setError("Security Clearance Failure: API key not configured.");
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const promptText = `
            Act as a Strategic Workforce Architect. Generate a 5-Year Phased Training Roadmap for ${agencyName}.
            
            ${getPhasedDistributionPrompt()}
            
            **OUTPUT:** Strictly JSON following the standard 5-year schema.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: promptText,
                config: {
                    systemInstruction: AI_FIVE_YEAR_PLAN_PROMPT_INSTRUCTIONS,
                    responseMimeType: "application/json",
                    responseSchema: aiFiveYearPlanSchema,
                },
            });

            const result = JSON.parse(response.text?.trim() || '{}');
            setReport(result);
        } catch (e) {
            console.error(e);
            setError("Roadmap Generation Failed: Budgetary constraint violation.");
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
            title: `5-Year Phased Capability Roadmap - ${agencyName}`,
            sections: [
                { title: "Strategic Phasing Overview", content: [report.executiveSummary] },
                { 
                    title: "Roadmap Details (2025-2029)", 
                    content: [{
                        type: 'table',
                        headers: ['Year', 'Priority Area', 'Candidate', 'Path Type', 'Rationale'],
                        rows: report.trainingPlan.map(p => [
                            // Fixed property access typo from p.rational to p.rationale
                            p.trainingYear, p.proposedCourse, p.occupant, p.fundingSource, p.rationale
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

    const sections = useMemo(() => {
        if (!report) return [];
        return [
            {
                title: "Phasing Overview",
                content: (
                    <div className="space-y-8 animate-fade-in">
                        <ReportSection title="Phased Strategic Mission">
                            <p className="text-lg leading-relaxed">{report.executiveSummary}</p>
                        </ReportSection>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-[#1A365D] p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-1000"></div>
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4">Phase 1 Trigger</h4>
                                <p className="text-xs font-bold leading-relaxed opacity-80">Initial focus on Gap Sector stabilization through 70% Experiential and 20% Social Learning models.</p>
                            </div>
                            <div className="bg-emerald-600 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-1000"></div>
                                <h4 className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.4em] mb-4">Phase 2 Trigger</h4>
                                <p className="text-xs font-bold leading-relaxed opacity-80">Long-term academic transformation focusing on the top performing Elite Cohort for succession planning.</p>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: "Full Phased Roadmap",
                content: (
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] border-collapse">
                                <thead className="bg-[#1A365D] text-white uppercase text-[10px] tracking-widest font-black">
                                    <tr>
                                        <th className="p-5">Plan Year</th>
                                        <th className="p-5">Strategic Division</th>
                                        <th className="p-5">Intervention / Course</th>
                                        <th className="p-5">Officer Occupant</th>
                                        <th className="p-5">Budget Source</th>
                                        <th className="p-5">Strategic Rationale</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.trainingPlan.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-5 font-black text-[#1A365D]">{p.trainingYear}</td>
                                            <td className="p-5 text-slate-400 font-bold uppercase tracking-tight">{p.division}</td>
                                            <td className="p-5 font-black text-slate-800">{p.proposedCourse}</td>
                                            <td className="p-5 font-bold text-slate-600">{p.occupant}</td>
                                            <td className="p-5">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                                                    p.fundingSource.includes('Donor') ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {p.fundingSource}
                                                </span>
                                            </td>
                                            <td className="p-5 text-slate-500 italic font-medium leading-relaxed max-w-xs">{p.rationale}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }
        ];
    }, [report, stats]);

    const handlePrev = () => setCurrentSectionIndex(prev => Math.max(0, prev - 1));
    const handleNext = () => setCurrentSectionIndex(prev => Math.min(sections.length - 1, prev + 1));

    if (loading) return (
        <div className="fixed inset-0 bg-[#0F172A]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className="text-center animate-pulse">
                <CalendarDaysIcon className="w-20 h-20 text-[#2AAA52] mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Roadmap Intelligence Terminal</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 italic">Executing Phased Distribution Algorithm...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-[32px] p-12 text-center max-w-md shadow-2xl">
                <XIcon className="w-16 h-16 text-rose-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Strategic Failure</h2>
                <p className="text-slate-500 font-medium mt-4 leading-relaxed">{error}</p>
                <button onClick={onClose} className="mt-8 px-10 py-3 bg-[#1A365D] text-white rounded-xl font-black text-xs uppercase tracking-widest">Close Terminal</button>
            </div>
        </div>
    );

    // FIX: Ensured the component returns non-void JSX
    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start pt-10 pb-10 px-4 no-print overflow-y-auto">
            <div className="bg-[#FAFBFD] rounded-[40px] shadow-2xl max-w-7xl w-full flex flex-col border border-slate-200 mb-20 overflow-hidden">
                <header className="flex justify-between items-center p-8 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-[#1A1A40] rounded-2xl shadow-lg shadow-blue-900/20"><CalendarDaysIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">5-Year Strategic Capability roadmap</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">DPM Authorized Phased distribution Plan • {agencyName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm">
                            <XIcon className="w-8 h-8" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-12 space-y-12">
                    <div className="flex gap-4">
                        {sections.map((s, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setCurrentSectionIndex(idx)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                    currentSectionIndex === idx ? 'bg-[#1A365D] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 bg-slate-100'
                                }`}
                            >
                                Step {idx + 1}: {s.title}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[500px]">
                        {sections[currentSectionIndex].content}
                    </div>
                </main>

                <footer className="p-10 border-t border-slate-100 bg-white flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <span>DPM PNG - Strategic Workforce Unit</span>
                    <div className="flex items-center gap-4">
                         <button onClick={handlePrev} disabled={currentSectionIndex === 0} className="px-5 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30">Previous Section</button>
                         <span className="text-slate-200">|</span>
                         <button onClick={handleNext} disabled={currentSectionIndex === sections.length - 1} className="px-5 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30">Next Section</button>
                    </div>
                    <span>Classified Official Record</span>
                </footer>
            </div>
        </div>
    );
};
