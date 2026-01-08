
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AgencyType, QUESTION_TEXT_MAPPING } from '../types';
import { AI_COMPETENCY_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { DataAggregator } from '../services/DataAggregator';
import { ReportTemplate } from './ReportTemplate';
import { SuccessionPlanningTable } from './SuccessionPlanningTable';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiCompetencyReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        domains: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    domainName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    currentProficiency: { type: Type.NUMBER },
                    desiredProficiency: { type: Type.NUMBER },
                    skillGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Competency areas requiring 70:20:10 training interventions." },
                    qualificationGaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Academic gaps requiring formal SILAG or tertiary courses." },
                    projectedIntervention: { type: Type.STRING, description: "Specific recommended pathway for the domain." }
                },
                required: ["domainName", "description", "currentProficiency", "desiredProficiency", "skillGaps", "qualificationGaps", "projectedIntervention"]
            }
        },
        successionPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    roleOrPosition: { type: Type.STRING },
                    potentialSuccessors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    readinessLevel: { type: Type.STRING, enum: ['Ready Now', '1-2 Years', '3-5 Years', 'Long-term'] },
                    developmentNeeds: { type: Type.STRING },
                    estimatedTimeline: { type: Type.STRING }
                },
                required: ["roleOrPosition", "potentialSuccessors", "readinessLevel", "developmentNeeds", "estimatedTimeline"]
            }
        }
    },
    required: ["executiveSummary", "domains", "successionPlan"]
};

const ProficiencyGauge: React.FC<{ current: number; desired: number }> = ({ current, desired }) => {
    const percentage = Math.min((current / desired) * 100, 100);
    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proficiency Maturity</span>
                <span className="text-xs font-black text-[#1A365D]">{current.toFixed(1)} / {desired.toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 border border-slate-200 shadow-inner">
                <div 
                    className="bg-[#2AAA52] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export const CompetencyDomainReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Optimized parallel pre-calculation
    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("System Access Restricted: API key not configured.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `
                Perform a Competency Domain Analysis for ${agencyName}.
                
                **INTELLIGENCE MAPPING:**
                - Strategic Domain: Analyze alignment with MTDP IV and Corporate Plan understanding (Section A).
                - Operational Domain: Analyze effectiveness in daily tasks (Section B).
                - Leadership Domain: Assess candidate pools for senior tracks (Section C).
                - Technical/Finance: Identify SILAG certification needs (Sections E, F).

                **GAP SPECIFICITY:**
                Distinguish between 'Skill Gaps' (require workshops/mentoring) and 'Qualification Gaps' (require formal SILAG diplomas/degrees).
                
                Workforce Stats: ${JSON.stringify(stats)}
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_COMPETENCY_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiCompetencyReportSchema,
                    },
                });

                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error("Analysis Failed:", e);
                setError("AI Synthesis Error: Data integrity check failed.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [stats, agencyName]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Competency Domain Analysis - ${agencyName}`,
            sections: [
                {
                    title: "Executive Assessment Summary",
                    content: [report.executiveSummary]
                },
                ...report.domains.map((d: any) => ({
                    title: `Domain Assessment: ${d.domainName}`,
                    content: [
                        `Context: ${d.description}`,
                        `Maturity: ${d.currentProficiency}/${d.desiredProficiency}`,
                        `Identified Skill Gaps (Training): ${d.skillGaps.join(', ')}`,
                        `Qualification Gaps (Academic): ${d.qualificationGaps.join(', ') || 'None identified'}`,
                        `Projected Intervention: ${d.projectedIntervention}`
                    ]
                })),
                {
                    title: "Succession Planning Track",
                    content: [{
                        type: 'table',
                        headers: ['Role', 'Candidate(s)', 'Readiness', 'Development Needs', 'Timeline'],
                        rows: report.successionPlan.map((s: any) => [
                            s.roleOrPosition, s.potentialSuccessors.join(', '), s.readinessLevel, s.developmentNeeds, s.estimatedTimeline
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

    return (
        <ReportTemplate 
            title="Competency Domain Analysis" 
            subtitle={agencyName} 
            onClose={onClose} 
            onExport={handleExport} 
            loading={loading}
        >
            <div className="space-y-12">
                <section>
                    <h3 className="text-sm font-black text-[#1A365D] uppercase tracking-widest mb-4 border-l-4 border-[#2AAA52] pl-3">Strategic Capability Maturity</h3>
                    <p className="text-slate-700 leading-relaxed text-sm font-medium">{report?.executiveSummary}</p>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {report?.domains.map((domain: any, i: number) => (
                        <div key={i} className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 flex flex-col h-full hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-lg font-black text-[#1A365D] uppercase tracking-tight">{domain.domainName}</h4>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <svg className="w-5 h-5 text-[#2AAA52]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-6 leading-relaxed">{domain.description}</p>
                            
                            <ProficiencyGauge current={domain.currentProficiency} desired={domain.desiredProficiency} />

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Skill Gaps (70:20:10)</p>
                                    <p className="text-xs text-slate-700 font-semibold">{domain.skillGaps.join(' • ')}</p>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Qualification Gaps (Academic)</p>
                                    <p className="text-xs text-slate-700 font-semibold">{domain.qualificationGaps.join(' • ') || 'Aligned'}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Strategic Recommended Intervention</p>
                                    <p className="text-xs font-black text-[#1A365D] uppercase leading-tight">{domain.projectedIntervention}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                <section>
                    <h3 className="text-sm font-black text-[#1A365D] uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        Institutional Leadership Succession Track
                    </h3>
                    <SuccessionPlanningTable candidates={report?.successionPlan || []} />
                </section>
            </div>
        </ReportTemplate>
    );
};
