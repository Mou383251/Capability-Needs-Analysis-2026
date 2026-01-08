
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiGapAnalysisReport, AgencyType, AiLearningSolution, AiReportSummary, QUESTION_TEXT_MAPPING } from '../types';
import { AI_GAP_ANALYSIS_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { DataAggregator } from '../services/DataAggregator';
import { ReportTemplate } from './ReportTemplate';
import { SuccessionPlanningTable } from './SuccessionPlanningTable';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiGapAnalysisReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        prioritizedGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    gapName: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['[SKILL GAP]', '[QUALIFICATION GAP]'] },
                    impact: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                    context: { type: Type.STRING },
                    actionableIntervention: { type: Type.STRING, description: "Detailed 70:20:10 or Academic pathway recommendation." }
                },
                required: ["gapName", "type", "impact", "context", "actionableIntervention"]
            }
        },
        successionPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    roleOrPosition: { type: Type.STRING },
                    potentialSuccessors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    readinessLevel: { type: Type.STRING },
                    developmentNeeds: { type: Type.STRING },
                    estimatedTimeline: { type: Type.STRING }
                },
                required: ["roleOrPosition", "potentialSuccessors", "readinessLevel", "developmentNeeds", "estimatedTimeline"]
            }
        }
    },
    required: ["executiveSummary", "prioritizedGaps", "successionPlan"]
};

export const CapabilityGapAnalysisReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("System Configuration Error: Missing AI Gateway.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `
                Generate a high-fidelity Gap Analysis Report for ${agencyName}.
                
                **LOGIC ENGINE PARAMETERS:**
                1. Differentiate between SKILL GAPS (functional/training) and QUALIFICATION GAPS (formal/academic).
                2. Explicitly label the 'type' field in the JSON response as either '[SKILL GAP]' or '[QUALIFICATION GAP]'.
                3. Cross-reference low scores (1-6) from Sections A-G for Skills.
                4. Identify Qualification gaps for officers in Grade 14+ lacking Degrees.
                
                DATA: ${JSON.stringify(data.map(o => ({ 
                    name: o.name, 
                    grade: o.grade, 
                    qual: o.jobQualification, 
                    ratings: o.capabilityRatings 
                })))}
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_GAP_ANALYSIS_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiGapAnalysisReportSchema,
                    },
                });

                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error("Gap Analysis Error:", e);
                setError("AI Data Triangulation Failed.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Capability Gap Analysis - ${agencyName}`,
            sections: [
                { title: "Executive Strategic Overview", content: [report.executiveSummary] },
                {
                    title: "Prioritized Institutional Gaps",
                    content: [{
                        type: 'table',
                        headers: ['Capability Area', 'Gap Classification', 'Impact', 'Strategic Context', 'Recommended Intervention'],
                        rows: report.prioritizedGaps.map((g: any) => [
                            g.gapName, g.type, g.impact, g.context, g.actionableIntervention
                        ])
                    }],
                    orientation: 'landscape'
                },
                {
                    title: "Critical Role Succession Track",
                    content: [{
                        type: 'table',
                        headers: ['Role', 'Candidates', 'Readiness', 'Development Plan', 'Estimated Time'],
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
            title="Capability Gap Analysis" 
            subtitle={agencyName} 
            onClose={onClose} 
            onExport={handleExport} 
            loading={loading}
        >
            <div className="space-y-12">
                <section>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Strategic Assessment Summary</h3>
                    <p className="text-[#1A365D] leading-relaxed text-sm font-medium border-l-4 border-[#2AAA52] pl-6 bg-slate-50 py-4 rounded-r-xl shadow-inner">
                        {report?.executiveSummary}
                    </p>
                </section>

                <section>
                    <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#2AAA52] rounded-full"></div>
                        Categorized Gap Matrix (Skill vs. Qualification)
                    </h3>
                    <div className="overflow-x-auto border border-slate-100 rounded-[20px] shadow-xl bg-white">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead className="bg-[#1A365D] text-white">
                                <tr>
                                    <th className="p-5 font-black uppercase tracking-widest">Capability Area</th>
                                    <th className="p-5 font-black uppercase tracking-widest">Classification</th>
                                    <th className="p-5 font-black uppercase tracking-widest text-center">Impact</th>
                                    <th className="p-5 font-black uppercase tracking-widest">Recommended Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {report?.prioritizedGaps.map((gap: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-5">
                                            <p className="font-black text-[#1A365D] text-[12px] group-hover:text-blue-600 transition-colors">{gap.gapName}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">{gap.context}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                gap.type.includes('QUALIFICATION') 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {gap.type}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`text-[10px] font-black ${gap.impact === 'High' ? 'text-rose-600' : 'text-amber-500'}`}>{gap.impact}</span>
                                        </td>
                                        <td className="p-5 leading-relaxed font-semibold text-slate-600 italic whitespace-normal min-w-[300px]">
                                            {gap.actionableIntervention}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h3 className="text-xs font-black text-[#1A365D] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                        Institutional Leadership Succession Track
                    </h3>
                    <SuccessionPlanningTable candidates={report?.successionPlan || []} />
                </section>
            </div>
        </ReportTemplate>
    );
};
