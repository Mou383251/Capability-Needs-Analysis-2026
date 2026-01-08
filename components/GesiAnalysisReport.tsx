import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, GesiGap, EstablishmentRecord } from '../types';
import { AI_GESI_ANALYSIS_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { ReportTemplate } from './ReportTemplate';
import { DataAggregator } from '../services/DataAggregator';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyName: string;
  onClose: () => void;
}

const aiLearningSolutionSchema = {
    type: Type.OBJECT,
    properties: {
        experiential70: { type: Type.STRING },
        social20: { type: Type.STRING },
        formal10: { type: Type.STRING },
    },
    required: ["experiential70", "social20", "formal10"]
};

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        equityStats: {
            type: Type.OBJECT,
            properties: {
                femaleSeniorityRate: { type: Type.STRING },
                disabilityInclusionLevel: { type: Type.STRING },
                overallGesiAwareness: { type: Type.STRING }
            },
            required: ["femaleSeniorityRate", "disabilityInclusionLevel", "overallGesiAwareness"]
        },
        identifiedGapsAndRisks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['[SKILL GAP]', '[QUALIFICATION GAP]', '[LEADERSHIP_EQUITY_GAP]'] },
                    riskImplication: { type: Type.STRING },
                    learningSolution: aiLearningSolutionSchema,
                },
                required: ["description", "type", "riskImplication", "learningSolution"]
            }
        },
        successfulBenchmarks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["executiveSummary", "equityStats", "identifiedGapsAndRisks", "successfulBenchmarks"]
};

export const GesiAnalysisReport: React.FC<ReportProps> = ({ data, establishmentData, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) { setError("API missing"); setLoading(false); return; }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Perform GESI Analysis for ${agencyName}. Stats: ${JSON.stringify(stats)}`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_GESI_ANALYSIS_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });
                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                setError("AI Failure.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [stats, agencyName]);

    return (
        <ReportTemplate 
            title="GESI Capability Analysis" 
            agencyName={agencyName}
            subtitle="Capability Needs Analysis (CNA)"
            onClose={onClose} 
            onExport={() => {}} 
            loading={loading}
        >
            <div className="space-y-6">
                <section>
                    <h3 className="text-[10pt] font-black text-[#1A365D] uppercase tracking-widest mb-2 border-l-4 border-[#059669] pl-3">Equity Baseline</h3>
                    <p className="text-slate-700 leading-relaxed text-[8pt] font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">{report?.executiveSummary}</p>
                </section>

                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                        <span className="text-[7pt] font-black text-slate-400 uppercase block mb-1">Female Seniority</span>
                        <span className="text-xl font-black text-[#1A365D]">{report?.equityStats.femaleSeniorityRate}</span>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                        <span className="text-[7pt] font-black text-slate-400 uppercase block mb-1">GESI Awareness</span>
                        <span className="text-xl font-black text-emerald-600">{report?.equityStats.overallGesiAwareness}</span>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                        <span className="text-[7pt] font-black text-slate-400 uppercase block mb-1">Disability Inclusivity</span>
                        <span className="text-xl font-black text-amber-600">{report?.equityStats.disabilityInclusionLevel}</span>
                    </div>
                </div>

                <section>
                    <h3 className="text-[8pt] font-black text-[#1A365D] uppercase tracking-widest mb-2">Inclusion Risk Matrix</h3>
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-[7.5pt] border-collapse">
                            <thead className="bg-[#1A365D] text-white uppercase tracking-tighter">
                                <tr>
                                    <th className="p-3">Gap Type</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Risk/Implication</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report?.identifiedGapsAndRisks.map((gap: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-black text-rose-600 whitespace-nowrap">{gap.type}</td>
                                        <td className="p-3 font-semibold text-slate-800">{gap.description}</td>
                                        <td className="p-3 italic text-slate-500 leading-tight">{gap.riskImplication}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </ReportTemplate>
    );
};
