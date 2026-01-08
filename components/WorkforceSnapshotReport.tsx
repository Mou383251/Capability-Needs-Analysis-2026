import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiWorkforceSnapshotReport, AgencyType, QUESTION_TEXT_MAPPING } from '../types';
import { AI_WORKFORCE_SNAPSHOT_PROMPT_INSTRUCTIONS } from '../constants';
import { DataAggregator } from '../services/DataAggregator';
import { ReportTemplate } from './ReportTemplate';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: any[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiWorkforceSnapshotSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        strategicAlignmentInsights: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                gesiFocus: { type: Type.STRING },
                shrmFocus: { type: Type.STRING },
            },
            required: ["summary", "gesiFocus", "shrmFocus"],
        }
    },
    required: ["executiveSummary", "strategicAlignmentInsights"]
};

export const WorkforceSnapshotReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [aiContent, setAiContent] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) { setError("API Key Missing"); setLoading(false); return; }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Perform a Strategic Assessment for ${agencyName}. Pre-calculated Metrics: ${JSON.stringify(stats)}. Contextualize these findings within the MTDP IV framework.`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_WORKFORCE_SNAPSHOT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiWorkforceSnapshotSchema,
                    },
                });
                setAiContent(JSON.parse(response.text.trim()));
            } catch (e) {
                setError("AI Generation Failed.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [stats, agencyName]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        // Handled by ReportTemplate internal listener if using official utility
    };

    return (
        <ReportTemplate 
            title="Workforce Snapshot Report" 
            subtitle="Capability Needs Analysis (CNA)" 
            agencyName={agencyName}
            onClose={onClose} 
            onExport={handleExport} 
            loading={loading}
        >
            <div className="space-y-6">
                <section>
                    <h3 className="text-[10pt] font-black text-[#1A365D] uppercase tracking-widest mb-2 border-l-4 border-[#2AAA52] pl-3">Strategic Context</h3>
                    <p className="text-slate-700 leading-relaxed text-[9pt] font-medium">{aiContent?.executiveSummary}</p>
                </section>

                <div className="grid grid-cols-4 gap-3">
                    {[
                        { l: "Authorized Ceiling", v: stats.totalPositions, c: "text-blue-600" },
                        { l: "On Strength", v: stats.filledPositions, c: "text-emerald-600" },
                        { l: "Skill Gaps", v: stats.skillGapsCount, c: "text-amber-600" },
                        { l: "Qual Gaps", v: stats.qualificationGapsCount, c: "text-rose-600" },
                    ].map((item, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <p className={`text-xl font-black ${item.c}`}>{item.v}</p>
                            <p className="text-[7pt] font-black text-slate-400 uppercase tracking-widest mt-1">{item.l}</p>
                        </div>
                    ))}
                </div>

                <section>
                    <h3 className="text-[10pt] font-black text-[#1A365D] uppercase tracking-widest mb-3 border-l-4 border-[#2AAA52] pl-3">Mainstreaming Insights</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <h4 className="font-black text-[7pt] text-emerald-800 uppercase tracking-widest mb-1">GESI Pillar</h4>
                            <p className="text-[8pt] text-emerald-900 font-medium leading-relaxed">{aiContent?.strategicAlignmentInsights.gesiFocus}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="font-black text-[7pt] text-blue-800 uppercase tracking-widest mb-1">SHRM Pillar</h4>
                            <p className="text-[8pt] text-blue-900 font-medium leading-relaxed">{aiContent?.strategicAlignmentInsights.shrmFocus}</p>
                        </div>
                    </div>
                </section>
            </div>
        </ReportTemplate>
    );
};
