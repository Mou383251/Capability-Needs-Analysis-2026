
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AgencyType, QUESTION_TEXT_MAPPING, StructuredCorporatePlan } from '../types';
import { XIcon, SparklesIcon, DocumentChartBarIcon, ArrowDownTrayIcon, BookOpenIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { DataAggregator } from '../services/DataAggregator';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  corporatePlanContext: string;
  onClose: () => void;
}

const aiGeneratedSectionsSchema = {
    type: Type.OBJECT,
    properties: {
        ministerialStatement: { type: Type.STRING },
        secretarysForeword: { type: Type.STRING },
        executiveSummary: { type: Type.STRING },
        swotAnalysis: {
            type: Type.OBJECT,
            properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["ministerialStatement", "secretarysForeword", "executiveSummary", "swotAnalysis", "recommendations"]
};

interface AiGeneratedSections {
    ministerialStatement: string;
    secretarysForeword: string;
    executiveSummary: string;
    swotAnalysis: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; };
    recommendations: string[];
}

const ReportSection: React.FC<{ title: string; children: React.ReactNode; formal?: boolean }> = ({ title, children, formal }) => (
    <div className={`${formal ? 'bg-[#F9FAFB] border-double border-4 border-slate-200' : 'bg-white'} rounded-xl shadow-sm border border-slate-200 p-6 sm:p-10 mb-8 break-after-page`}>
        <h2 className={`${formal ? 'text-2xl text-center' : 'text-xl'} font-black text-[#1A365D] mb-6 border-b border-slate-200 pb-4 uppercase tracking-tighter`}>{title}</h2>
        <div className={`prose prose-sm max-w-none text-slate-700 ${formal ? 'italic font-medium leading-relaxed text-center max-w-3xl mx-auto whitespace-pre-wrap' : ''}`}>{children}</div>
    </div>
);

export const AutomatedOrganisationalAnalysisReport: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, corporatePlanContext, onClose }) => {
    const [aiContent, setAiContent] = useState<AiGeneratedSections | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showMobileReadMode, setShowMobileReadMode] = useState(false);

    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                // Multimodal Logic: Attempt to parse structured context from Master Scanner
                let highFidelityContext = "";
                try {
                    const parsed = JSON.parse(corporatePlanContext) as StructuredCorporatePlan;
                    highFidelityContext = `
                    **MASTER SCANNER STRATEGIC CONTEXT (PRIORITY SOURCE):**
                    - VISION: ${parsed.strategic_goals.vision}
                    - MISSION: ${parsed.strategic_goals.mission}
                    - STRATEGIC OBJECTIVES: ${parsed.strategic_goals.objectives.join(', ')}
                    - FINANCIAL CONTEXT: ${parsed.financial_context}
                    - RISK ASSESSMENT: ${parsed.risk_assessment}
                    - PERSONNEL ESTABLISHMENT: ${parsed.personnel_establishment}
                    - TRAINING NEEDS FROM PLAN: ${parsed.training_needs}
                    `;
                } catch (e) {
                    // Fallback to legacy plain text
                    highFidelityContext = corporatePlanContext || 'PNG National Vision 2050 and MTDP IV Strategic Priorities.';
                }

                const promptText = `
                Generate a Strategic 4+ Page Organisational Analysis for ${agencyName}.
                
                **EVIDENCE BASE:**
                ${highFidelityContext}
                
                **DIAGNOSTIC TRIANGULATION:**
                - Institutional Baseline: ${stats.baselineScore.toFixed(1)}/10
                - Survey Participants: ${stats.cnaParticipants}
                - Actual Staff on Strength: ${stats.onStrength}
                - Authorized Post Ceiling: ${stats.totalPositions}
                - Primary Skill Gap Area: ${stats.gapSector.name} (Score: ${stats.gapSector.score.toFixed(1)})
                - Top Proficiency Area: ${stats.peakSector.name}
                
                **DIRECTIVES:**
                1. SECRETARY'S FOREWORD: Synthesize the Vision/Mission from the evidence base with current baseline (${stats.baselineScore.toFixed(1)}/10). Focus on institutional readiness.
                2. MINISTERIAL STATEMENT: Link 'Capability Gap Analysis' results to financial priorities (Financial Context) and national development outcomes.
                3. EXECUTIVE SUMMARY: Use 70:20:10 model recommendations derived from the identified gaps and the "training_needs" bucket.
                4. SWOT ANALYSIS: Strengths/Weaknesses must be derived from internal data; Opportunities/Threats from the "risk_assessment" bucket.

                **REQUIREMENTS:**
                - Return strictly JSON. 
                - Professional high-level management consultancy tone.
                `;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-preview', // High fidelity synthesis
                    contents: promptText,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: aiGeneratedSectionsSchema,
                    },
                });

                setAiContent(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error(e);
                setError("Strategic Synthesis Failure: Evidence base inconsistent.");
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, [data, establishmentData, agencyName, corporatePlanContext, stats]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!aiContent) return;
        const reportData: ReportData = {
            title: `Strategic Organisational Analysis - ${agencyName}`,
            sections: [
                { title: "Secretary's Foreword", content: [aiContent.secretarysForeword] },
                { title: "Ministerial Statement", content: [aiContent.ministerialStatement] },
                { title: "Executive Summary", content: [aiContent.executiveSummary] }
            ]
        };
        if(format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };

    if (loading) return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="text-center">
                <SparklesIcon className="w-16 h-16 text-blue-400 animate-pulse mx-auto mb-4" />
                <p className="font-black text-white uppercase tracking-[0.3em] text-xs">Generating Strategic Intelligence...</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in no-print overflow-y-auto">
            <div className="bg-[#F3F4F6] rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col mb-12">
                <header className="flex justify-between items-center p-6 border-b border-slate-200 flex-shrink-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Strategic Analysis Report</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowMobileReadMode(true)}
                            className="md:hidden flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest"
                        >
                            <BookOpenIcon className="w-4 h-4" /> Read Mode
                        </button>
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-rose-600 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <main className="p-8 space-y-12 bg-white">
                    <ReportSection title="Secretary's Foreword" formal>{aiContent?.secretarysForeword}</ReportSection>
                    <ReportSection title="Ministerial Statement" formal>{aiContent?.ministerialStatement}</ReportSection>
                    <ReportSection title="Executive Summary">{aiContent?.executiveSummary}</ReportSection>
                </main>

                <footer className="p-6 text-center border-t border-slate-200 bg-slate-50 rounded-b-2xl no-print">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidential Personnel Record • Strategic Capability Unit • Property of DPM</p>
                </footer>
            </div>

            {/* Mobile Read Mode Overlay */}
            {showMobileReadMode && (
                <div className="fixed inset-0 bg-white z-[110] flex flex-col animate-fade-in">
                    <header className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Strategic Preview</span>
                        <button onClick={() => setShowMobileReadMode(false)} className="p-2 text-slate-900"><XIcon className="w-6 h-6" /></button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                        <div>
                            <h2 className="text-2xl font-black text-[#1A365D] uppercase border-b-2 border-blue-600 pb-2 mb-4">Secretary's Foreword</h2>
                            <p className="text-[16px] leading-relaxed text-slate-800 italic whitespace-pre-wrap">{aiContent?.secretarysForeword}</p>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#1A365D] uppercase border-b-2 border-blue-600 pb-2 mb-4">Ministerial Statement</h2>
                            <p className="text-[16px] leading-relaxed text-slate-800 italic whitespace-pre-wrap">{aiContent?.ministerialStatement}</p>
                        </div>
                    </div>
                    <footer className="p-6 border-t bg-slate-50">
                        <button 
                            onClick={() => handleExport('pdf')}
                            className="w-full py-4 bg-blue-700 text-white font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 shadow-xl"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" /> Download Full 4-Page PDF
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
};
