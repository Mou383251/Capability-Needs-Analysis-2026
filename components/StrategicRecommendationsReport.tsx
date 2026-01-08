import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, EstablishmentRecord, StructuredCorporatePlan } from '../types';
import { AI_STRATEGIC_RECOMMENDATIONS_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { DataAggregator } from '../services/DataAggregator';
import { ReportTemplate } from './ReportTemplate';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiStrategicRecsReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        strategicInterventions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    pillar: { type: Type.STRING, description: "Direct Pillar/Goal from Corporate Plan." },
                    alignmentPriority: { type: Type.STRING, enum: ['High (Corp Plan)', 'Medium', 'Supportive'] },
                    targetGap: { type: Type.STRING },
                    action: { type: Type.STRING },
                    expectedOutcome: { type: Type.STRING }
                },
                required: ["pillar", "alignmentPriority", "targetGap", "action", "expectedOutcome"]
            }
        },
        implementationHorizon: { type: Type.STRING }
    },
    required: ["executiveSummary", "strategicInterventions", "implementationHorizon"]
};

export const StrategicRecommendationsReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) { setError("API key missing."); setLoading(false); return; }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `
                Act as a Strategic Management Consultant for ${agencyName}.
                
                **HIERARCHY OF AUTHORITY:**
                Your recommendations MUST be anchored in the official Corporate Plan objectives.
                
                **INPUTS:**
                - Workforce Baseline: ${stats.baselineScore.toFixed(1)}/10
                - Critical Gaps: ${stats.gapSector.name}
                - Elite Succession Candidates: ${data.filter(o => parseInt(o.spaRating) >= 4).length} personnel identified.
                
                **TASK:**
                1. Link all interventions to specific Corporate Plan Pillars.
                2. Prioritize actions that address the ${stats.gapSector.name} gap.
                3. Categorize priority as 'High (Corp Plan)' for direct alignment.
                
                **OUTPUT:** Strictly JSON.
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_STRATEGIC_RECOMMENDATIONS_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiStrategicRecsReportSchema,
                    },
                });
                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                setError("AI Strategic Synthesis Failed: Metadata mismatch.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [stats, agencyName]);
    
    const handleExport = (format: string) => {
        // Handled by Template internal
    };

    return (
        <ReportTemplate 
            title="Strategic Recommendations" 
            agencyName={agencyName}
            subtitle="Hierarchy of Strategic Objectives"
            onClose={onClose} 
            onExport={handleExport} 
            loading={loading}
        >
            <div className="space-y-6">
                <section className="bg-[#0F172A] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <h3 className="text-[7pt] font-black uppercase tracking-[0.3em] mb-2 text-blue-400">Executive Strategic Intent</h3>
                    <p className="text-[9pt] leading-relaxed font-light italic">"{report?.executiveSummary}"</p>
                </section>

                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-[8pt] border-collapse">
                        <thead className="bg-slate-50 text-[#1A365D]">
                            <tr>
                                <th className="p-4 font-black uppercase tracking-widest border-b-2 border-slate-100">Corp Plan Pillar</th>
                                <th className="p-4 font-black uppercase tracking-widest border-b-2 border-slate-100">Alignment</th>
                                <th className="p-4 font-black uppercase tracking-widest border-b-2 border-slate-100">Target Capability Gap</th>
                                <th className="p-4 font-black uppercase tracking-widest border-b-2 border-slate-100">Strategic Intervention</th>
                                <th className="p-4 font-black uppercase tracking-widest border-b-2 border-slate-100">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {report?.strategicInterventions.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 font-black text-[#1A365D] uppercase max-w-[120px]">{item.pillar}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[7pt] font-black uppercase whitespace-nowrap ${item.alignmentPriority.includes('High') ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.alignmentPriority}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700">{item.targetGap}</td>
                                    <td className="p-4 font-medium text-slate-600 italic leading-snug">{item.action}</td>
                                    <td className="p-4 font-black text-emerald-600 uppercase tracking-tighter">{item.expectedOutcome}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-[8pt] font-black text-[#1A365D] uppercase tracking-[0.2em] mb-2">Implementation Horizon</h4>
                    <p className="text-[9pt] text-slate-600 font-medium leading-relaxed">{report?.implementationHorizon}</p>
                </div>
            </div>
        </ReportTemplate>
    );
};
