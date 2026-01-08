import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AgencyType, QUESTION_TEXT_MAPPING, StructuredCorporatePlan } from '../types';
import { ReportTemplate } from './ReportTemplate';
import { AI_LEARNING_INTERPRETATION_GUIDE } from '../constants';

interface ReportProps {
    data: OfficerRecord[];
    establishmentData: EstablishmentRecord[];
    agencyType: AgencyType;
    agencyName: string;
    corporatePlanContext: string;
    onClose: () => void;
}

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        frameworkPlan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    capabilityCategory: { type: Type.STRING },
                    alignedStrategicGoal: { type: Type.STRING },
                    priorityLevel: { type: Type.STRING, enum: ['Primary', 'Secondary'] },
                    descriptionAndKRA: { type: Type.STRING },
                    develop70: { type: Type.STRING },
                    help20: { type: Type.STRING },
                    formal10: { type: Type.STRING },
                    when: { type: Type.STRING },
                },
                required: ["capabilityCategory", "alignedStrategicGoal", "priorityLevel", "descriptionAndKRA", "develop70", "help20", "formal10", "when"]
            }
        }
    },
    required: ["executiveSummary", "frameworkPlan"]
};

export const TrainingNeedsAnalysisReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, corporatePlanContext, onClose }) => {
    const [report, setReport] = useState<any>(null);
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
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                let strategicEvidence = "";
                try {
                    const parsed = JSON.parse(corporatePlanContext) as StructuredCorporatePlan;
                    strategicEvidence = `VISION: ${parsed.strategic_goals.vision}. MISSION: ${parsed.strategic_goals.mission}. OBJECTIVES: ${parsed.strategic_goals.objectives.join(', ')}.`;
                } catch (e) {
                    strategicEvidence = corporatePlanContext || 'MTDP IV Alignment.';
                }

                const promptText = `
                Generate a Strategic Training Needs Analysis (TNA) for ${agencyName}.
                
                **HIERARCHY OF AUTHORITY:**
                1. The Corporate Plan is the ONLY source of truth.
                2. Map skill gaps to Plan Objectives.
                3. FLAG as 'Secondary' if not in Plan.
                
                DATA: ${strategicEvidence}. PERSONNEL: ${data.length}.
                GAPS: ${JSON.stringify(data.map(o => ({ name: o.name, gaps: o.technicalCapabilityGaps })))}
                
                OUTPUT: Strictly JSON.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: promptText,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });

                setReport(JSON.parse(response.text?.trim() || '{}'));
            } catch (e) {
                setError("Consolidation Error: Strategic dataset misalignment.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, agencyName, corporatePlanContext]);

    return (
        <ReportTemplate 
            title="Training Needs Analysis" 
            subtitle="Strategic Alignment Report"
            agencyName={agencyName}
            onClose={onClose} 
            onExport={() => {}} 
            loading={loading}
        >
            <div className="space-y-8 pb-10">
                <section className="page-break-avoid">
                    <h3 className="text-[10pt] font-black text-[#1A365D] uppercase tracking-widest mb-2 border-l-4 border-[#2AAA52] pl-3">Strategic Synthesis</h3>
                    <p className="text-slate-700 leading-relaxed text-[9pt] font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 italic">{report?.executiveSummary}</p>
                </section>

                <div className="border border-slate-200 rounded-[16px] shadow-sm overflow-hidden">
                    <table className="report-data-table w-full">
                        <thead className="bg-[#1A365D] text-white">
                            <tr>
                                <th className="p-3 text-left uppercase tracking-widest">Hierarchy</th>
                                <th className="p-3 text-left uppercase tracking-widest">Strategic Goal</th>
                                <th className="p-3 text-left uppercase tracking-widest">Justification</th>
                                <th className="p-3 text-left uppercase tracking-widest">70:20:10 Pathway</th>
                                <th className="p-3 text-center uppercase tracking-widest">Target</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {report?.frameworkPlan.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3 align-top">
                                        <span className={`px-2 py-0.5 rounded text-[7pt] font-black uppercase tracking-widest ${item.priorityLevel === 'Primary' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                            {item.priorityLevel}
                                        </span>
                                    </td>
                                    <td className="p-3 font-bold text-[#1A365D] text-[8pt] align-top">{item.alignedStrategicGoal}</td>
                                    <td className="p-3 text-slate-600 text-[7.5pt] leading-tight align-top">{item.descriptionAndKRA}</td>
                                    <td className="p-3 text-[7.5pt] align-top">
                                        <div className="space-y-1">
                                            <p><span className="font-black text-blue-700">70%:</span> {item.develop70}</p>
                                            <p><span className="font-black text-emerald-700">20%:</span> {item.help20}</p>
                                            <p><span className="font-black text-indigo-700">10%:</span> {item.formal10}</p>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center font-black text-[#1A365D] whitespace-nowrap text-[8pt] align-top">{item.when}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ReportTemplate>
    );
};
