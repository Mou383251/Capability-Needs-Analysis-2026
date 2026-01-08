import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord } from '../types';
import { SparklesIcon } from './icons';
import { ReportTemplate } from './ReportTemplate';

interface ReportProps {
  data: OfficerRecord[];
  agencyName: string;
  onClose: () => void;
}

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        pathwayAnalysis: { type: Type.STRING },
        individualAssignments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    officerName: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    formalProgram: { type: Type.STRING },
                    staggeredYear: { type: Type.NUMBER },
                    successionRationale: { type: Type.STRING }
                },
                required: ["officerName", "grade", "formalProgram", "staggeredYear", "successionRationale"]
            }
        }
    },
    required: ["pathwayAnalysis", "individualAssignments"]
};

export const DevelopmentPathwaysReport: React.FC<ReportProps> = ({ data, agencyName, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const hiPoCandidates = useMemo(() => {
        return [...data]
            .map(officer => {
                const avgProficiency = officer.capabilityRatings.length > 0
                    ? officer.capabilityRatings.reduce((sum, r) => sum + r.currentScore, 0) / officer.capabilityRatings.length
                    : 0;
                const validationScore = parseInt(officer.spaRating) || 0;
                const score = (avgProficiency / 10 * 0.5) + (validationScore / 5 * 0.5);
                return { ...officer, rankScore: score };
            })
            .sort((a, b) => b.rankScore - a.rankScore)
            .slice(0, 16); 
    }, [data]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("Security Gate: System API missing.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `
                Generate Section 6: Development Pathways for ${agencyName}.
                
                **CONTENT REQUIREMENTS:**
                1. Reconstruct the 'Strategic Assessment Narrative' into full, coherent sentences in a single justified paragraph. Reference the '10% Formal Training' allocation.
                2. Process 16 candidate profiles.
                3. For each candidate, provide:
                   - Name
                   - Current Grade
                   - Target Year (Staggered 2025-2029)
                   - Formal Program Title
                   - Succession Rationale: A single, fully justified paragraph (no hyphenation) explaining their transition into the leadership pipeline.
                
                **DATA:**
                ${JSON.stringify(hiPoCandidates.map(c => ({ name: c.name, pos: c.position, grade: c.grade })))}
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: "You are a Strategic Workforce Architect. Format findings for a standardized border-free A4 National Report. Paragraphs MUST be justified and sentences continuous.",
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });

                setReport(JSON.parse(response.text?.trim() || '{}'));
            } catch (e) {
                setError("AI Engine failure during report reconstruction.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [hiPoCandidates, agencyName]);

    return (
        <ReportTemplate
            title="SECTION 6: DEVELOPMENT PATHWAYS"
            subtitle={`Strategic Alignment with ${agencyName} Corporate Plan`}
            agencyName={agencyName}
            onClose={onClose}
            onExport={() => {}} 
            loading={loading}
        >
            <div className="space-y-16">
                {/* 1. Strategic Assessment Narrative */}
                <section className="page-break-avoid">
                    <h3 className="text-center text-sm font-black text-[#1A365D] uppercase tracking-[0.4em] mb-10 border-b border-slate-100 pb-6">
                        Strategic Assessment Narrative
                    </h3>
                    <div className="report-justified-text text-[11pt] text-slate-700 font-serif italic px-6 leading-relaxed">
                        {report?.pathwayAnalysis}
                    </div>
                </section>

                {/* 2. Professional Candidate Registry */}
                <section className="pt-10">
                    <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
                        Succession Cohort Pathway Assignments (10% Track)
                    </h3>
                    
                    <div className="space-y-20">
                        {report?.individualAssignments.map((item: any, idx: number) => (
                            <div key={idx} className="page-break-avoid">
                                <div className="flex justify-between items-baseline mb-6 border-b-2 border-slate-900 pb-2">
                                    <div className="flex items-baseline gap-5">
                                        <span className="text-2xl font-black text-slate-200">#{String(idx + 1).padStart(2, '0')}</span>
                                        <h4 className="text-lg font-black text-[#1A365D] uppercase tracking-tighter">{item.officerName}</h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                            GRADE: {item.grade} | TARGET YEAR: {item.staggeredYear}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-blue-800 uppercase tracking-[0.2em] whitespace-nowrap">Pathway Assignment:</span>
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.formalProgram}</p>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Strategic Succession Rationale:</span>
                                        <div className="report-justified-text text-[10.5pt] text-slate-700 leading-relaxed font-medium">
                                            {item.successionRationale}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final Institutional Directive */}
                <div className="mt-24 pt-12 border-t-2 border-slate-100 text-center page-break-avoid">
                    <h3 className="text-[10px] font-black text-[#1A365D] uppercase tracking-[0.5em] mb-6">Official Strategic Directive</h3>
                    <div className="report-justified-text text-[10.5pt] italic text-slate-500 font-serif leading-relaxed max-w-2xl mx-auto text-center">
                        "The development pathways identified for this cohort represent the mandatory leadership pipeline for {agencyName}. This strategic intervention is designed to mitigate transition risks and professionalize service delivery across the national network through 2029."
                    </div>
                </div>
            </div>
        </ReportTemplate>
    );
};