
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING } from '../types';
import { AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, DocumentChartBarIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, ReportData } from '../utils/export';
import { ChartComponent } from './charts';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

interface AiGeneratedContent {
    executiveSummary: string;
    conclusionAndRecommendations: string;
}

const aiConsolidatedStrategicPlanSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "A high-level overview of all findings, starting with the total number of respondents and the overall state of organizational capability." },
        conclusionAndRecommendations: { type: Type.STRING, description: "A concluding summary with 3-5 key, actionable bullet points for leadership." }
    },
    required: ["executiveSummary", "conclusionAndRecommendations"]
};

// --- Sub-Components for Rendering ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode; anchorId: string }> = ({ title, children, anchorId }) => (
    <div className="pt-4 mb-4" id={anchorId}>
        <h2 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-600 pb-1">{title}</h2>
        <div className="text-slate-700 dark:text-slate-300 text-sm space-y-2">{children}</div>
    </div>
);


const CoverPage: React.FC<{ agencyName: string }> = ({ agencyName }) => (
    <div className="text-center mb-6">
        <h1 className="text-center font-bold text-xl mb-4 text-slate-900 dark:text-white uppercase tracking-wider">Consolidated Strategic Plan Report</h1>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{agencyName}</p>
    </div>
);

const TableOfContents: React.FC<{ sections: { id: string, title: string }[] }> = ({ sections }) => (
    <ReportSection title="Table of Contents" anchorId="toc">
        <ul className="list-none p-0 space-y-2">
            {sections.map(section => (
                <li key={section.id}>
                    <a href={`#${section.id}`} className="text-blue-600 hover:underline">{section.title}</a>
                </li>
            ))}
        </ul>
    </ReportSection>
);

// --- Main Component ---
export const ConsolidatedTrainingPlanReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [aiContent, setAiContent] = useState<AiGeneratedContent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const organizationalAverages = useMemo(() => {
        const ratings = data.flatMap(o => o.capabilityRatings);
        const map = new Map<string, number[]>();
        ratings.forEach(r => {
            if(!map.has(r.questionCode)) map.set(r.questionCode, []);
            map.get(r.questionCode)!.push(r.currentScore);
        });
        return Array.from(map.entries()).map(([code, scores]) => ({
            code,
            text: QUESTION_TEXT_MAPPING[code] || code,
            avg: scores.reduce((a,b)=>a+b, 0) / scores.length
        })).sort((a,b) => a.avg - b.avg);
    }, [data]);

    useEffect(() => {
        const generateReport = async () => {
             if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                // FIX: Using named parameter for GoogleGenAI initialization
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Generate a consolidated strategic plan for ${agencyName} (${agencyType}). Aggregated Averages: ${JSON.stringify(organizationalAverages)}. Total Officers: ${data.length}`;
                
                // FIX: Using gemini-3-flash-preview as per task guidelines
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiConsolidatedStrategicPlanSchema,
                    },
                });

                // FIX: Accessing .text property directly
                const text = response.text || '';
                setAiContent(JSON.parse(text.trim()));
            } catch (e) {
                console.error(e);
                setError("AI generation failed.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, organizationalAverages, agencyName, agencyType]);

    const handleExport = (format: 'pdf' | 'docx') => {
        if(!aiContent) return;
        const reportData: ReportData = {
            title: `Consolidated Strategic Plan - ${agencyName}`,
            sections: [
                { title: "Executive Summary", content: [aiContent.executiveSummary] },
                { title: "Conclusion and Recommendations", content: [aiContent.conclusionAndRecommendations] }
            ]
        };
        if(format === 'pdf') exportToPdf(reportData);
        else exportToDocx(reportData);
    };

    const renderContent = () => {
        if (loading) return <div className="text-center p-8"><SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-blue-500" /><p className="mt-2">Synthesizing strategic findings...</p></div>;
        if (error) return <div className="p-8 bg-red-100 text-red-700 text-center">{error}</div>;
        if (!aiContent) return null;

        return (
            <div className="space-y-6">
                <CoverPage agencyName={agencyName} />
                <ReportSection title="Executive Summary" anchorId="exec">
                    <p className="whitespace-pre-wrap">{aiContent.executiveSummary}</p>
                </ReportSection>
                <ReportSection title="Capability Baseline" anchorId="baseline">
                    <div className="h-96">
                        <ChartComponent 
                            type="bar" 
                            data={{
                                labels: organizationalAverages.slice(0, 10).map(a => a.code),
                                datasets: [{ label: 'Avg Proficiency', data: organizationalAverages.slice(0, 10).map(a => a.avg), backgroundColor: '#3B82F6'}]
                            }}
                            options={{ maintainAspectRatio: false }}
                        />
                    </div>
                </ReportSection>
                <ReportSection title="Conclusion and Recommendations" anchorId="concl">
                    <p className="whitespace-pre-wrap">{aiContent.conclusionAndRecommendations}</p>
                </ReportSection>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <DocumentChartBarIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Consolidated Strategic Plan</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};
