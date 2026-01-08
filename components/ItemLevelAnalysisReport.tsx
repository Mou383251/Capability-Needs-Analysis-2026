
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING } from '../types';
import { XIcon, SparklesIcon, ChevronDownIcon, ChartBarSquareIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { ChartComponent } from './charts';

// --- Types for this Report ---
interface QuestionStats {
    questionCode: string;
    questionText: string;
    responseCount: number;
    totalPossible: number;
    averageScore: number;
    modalScore: number;
    variance: number;
    tally: Record<number, number>; // e.g., { 10: 5, 9: 10, ... }
}

interface AiNarrativeContent {
    introduction: string;
    visualSummaryCommentary: string;
    priorityGaps: {
        questionCode: string;
        reason: string;
    }[];
}

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

// --- AI Schema and Prompt ---
const AI_PROMPT_INSTRUCTIONS = `
You are an expert data analyst for the PNG public service. You will receive pre-calculated statistics from a CNA survey. Your task is to generate narrative insights.

**YOUR TASK:**
1.  **Introduction:** Write a brief introduction (2-3 sentences) explaining that the following report breaks down each survey question by response frequency to identify specific trends.
2.  **Visual Summary Commentary:** Analyze the provided Top 5 and Bottom 5 questions. Write a short paragraph identifying any overarching patterns or trends (e.g., "A clear pattern emerges in Section C, where items related to leadership consistently scored low, suggesting a systemic challenge in management capability.").
3.  **Gap Identification:** Review all the provided question statistics. Identify up to 10 priority gap areas based on a combination of low average ratings (below 5.5) and high variance (indicating inconsistent understanding). For each, provide a brief 'reason'.

**OUTPUT FORMAT:**
- You MUST return a single, valid JSON object that strictly adheres to the schema.
- Do not add any other text, explanations, or markdown.
`;

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        introduction: { type: Type.STRING },
        visualSummaryCommentary: { type: Type.STRING },
        priorityGaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionCode: { type: Type.STRING },
                    reason: { type: Type.STRING },
                },
                required: ["questionCode", "reason"]
            }
        },
    },
    required: ["introduction", "visualSummaryCommentary", "priorityGaps"]
};


// --- Sub-components ---
const ReportSection: React.FC<{ title: string; children: React.ReactNode; anchorId: string, headingStyle?: 'Blue' | 'Green' }> = ({ title, children, anchorId, headingStyle }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 p-4 sm:p-6 mb-6 break-after-page" id={anchorId}>
        <h2 className={`text-xl font-bold mb-4 border-b border-slate-200 dark:border-blue-800 pb-3 ${headingStyle === 'Blue' ? 'text-blue-600 dark:text-blue-400' : headingStyle === 'Green' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {title}
        </h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);


const ChartCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-slate-100/50 dark:bg-blue-950/40 p-4 rounded-lg h-full flex flex-col">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-2 text-center">{title}</h3>
        <div className="flex-grow">{children}</div>
    </div>
);

const QuestionDetailAccordion: React.FC<{ stat: QuestionStats }> = ({ stat }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const chartData = {
        labels: Object.keys(stat.tally).sort((a,b) => parseInt(a) - parseInt(b)),
        datasets: [{
            label: 'Response Count',
            data: Object.keys(stat.tally).sort((a,b) => parseInt(a) - parseInt(b)).map(key => stat.tally[parseInt(key)]),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
        }]
    };

    return (
        <div className="border-b border-gray-200 dark:border-blue-800 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-100 dark:hover:bg-blue-900"
            >
                <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{stat.questionCode}: {stat.questionText}</p>
                    <p className="text-xs text-gray-500">Avg: {stat.averageScore.toFixed(2)} | Mode: {stat.modalScore} | Variance: {stat.variance.toFixed(2)} | Responses: {stat.responseCount}</p>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-50 dark:bg-blue-900/50">
                    <div className="relative h-48"><ChartComponent type="bar" data={chartData} options={{ maintainAspectRatio: false }}/></div>
                </div>
            )}
        </div>
    );
};


// --- Main Component ---
export const ItemLevelAnalysisReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [aiContent, setAiContent] = useState<AiNarrativeContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const analysis = useMemo(() => {
        const statsByQuestion: Record<string, QuestionStats> = {};
        
        data.forEach(officer => {
            officer.capabilityRatings.forEach(rating => {
                if (!statsByQuestion[rating.questionCode]) {
                    statsByQuestion[rating.questionCode] = {
                        questionCode: rating.questionCode,
                        questionText: QUESTION_TEXT_MAPPING[rating.questionCode] || rating.questionCode,
                        responseCount: 0,
                        totalPossible: 0,
                        averageScore: 0,
                        modalScore: 0,
                        variance: 0,
                        tally: {}
                    };
                }
                const stat = statsByQuestion[rating.questionCode];
                stat.responseCount++;
                stat.tally[rating.currentScore] = (stat.tally[rating.currentScore] || 0) + 1;
            });
        });

        Object.values(statsByQuestion).forEach(stat => {
            const scores = Object.entries(stat.tally).flatMap(([score, count]) => Array(count).fill(parseInt(score)));
            const sum = scores.reduce((a, b) => a + b, 0);
            stat.averageScore = sum / stat.responseCount;
            
            const mean = stat.averageScore;
            stat.variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / stat.responseCount;

            const modeEntry = Object.entries(stat.tally).sort((a,b) => b[1] - a[1])[0];
            stat.modalScore = parseInt(modeEntry[0]);
        });

        const statsArray = Object.values(statsByQuestion);
        const top5 = [...statsArray].sort((a,b) => b.averageScore - a.averageScore).slice(0, 5);
        const bottom5 = [...statsArray].sort((a,b) => a.averageScore - b.averageScore).slice(0, 5);

        return { stats: statsArray, top5, bottom5, statsByQuestion };
    }, [data]);
    
    useEffect(() => {
        if (analysis.stats.length === 0) {
            setLoading(false);
            return;
        }
        const generateNarrative = async () => {
             if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            try {
                /* Correct initialization as per guidelines */
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Please generate narrative insights based on the following pre-calculated CNA data analysis.\n\nTop 5 Highest Scoring Questions:\n${JSON.stringify(analysis.top5.map(s=>({code: s.questionCode, text: s.questionText, avg: s.averageScore})))} \n\nTop 5 Lowest Scoring Questions:\n${JSON.stringify(analysis.bottom5.map(s=>({code: s.questionCode, text: s.questionText, avg: s.averageScore})))} \n\nAll Questions Stats:\n${JSON.stringify(analysis.stats.map(s=>({code: s.questionCode, avg: s.averageScore, variance: s.variance})))}`;
                
                /* Updated model to gemini-3-flash-preview as per guidelines */
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });

                /* Accessing .text property directly as per guidelines */
                const jsonStr = response.text?.trim() || '{}';
                setAiContent(JSON.parse(jsonStr));
            } catch (e) {
                console.error("AI Narrative Error:", e);
                setError("An error occurred while generating the AI narrative insights.");
            } finally {
                setLoading(false);
            }
        };
        generateNarrative();
    }, [analysis]);
    
    const renderContent = () => {
        if (analysis.stats.length === 0) return <div className="p-8 text-center">No capability rating data available for analysis.</div>;
        if (loading) return <div className="p-8 text-center"><SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-blue-500" /><p className="mt-2">Generating AI insights...</p></div>;
        if (error) return <div className="p-8 bg-red-50 text-center"><h3 className="font-bold text-red-700">Analysis Failed</h3><p className="text-sm">{error}</p></div>;

        if (aiContent) {
            return (
                <div className="space-y-6">
                    <ReportSection title="Introduction & Visual Summary" anchorId="intro-summary" headingStyle="Blue">
                        <p>{aiContent.introduction}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <ChartCard title="Top 5 Highest Scoring Questions">
                                <div className="h-64">
                                    <ChartComponent type="horizontalBar" data={{ labels: analysis.top5.map(s => s.questionCode), datasets: [{ label: 'Average Score', data: analysis.top5.map(s => s.averageScore), backgroundColor: '#10B981'}] }} />
                                </div>
                            </ChartCard>
                             <ChartCard title="Top 5 Lowest Scoring Questions">
                                <div className="h-64">
                                    <ChartComponent type="horizontalBar" data={{ labels: analysis.bottom5.map(s => s.questionCode), datasets: [{ label: 'Average Score', data: analysis.bottom5.map(s => s.averageScore), backgroundColor: '#EF4444'}] }} />
                                </div>
                            </ChartCard>
                        </div>
                        <h4 className="font-bold mt-4">AI Commentary:</h4>
                        <p className="italic">{aiContent.visualSummaryCommentary}</p>
                    </ReportSection>
                     <ReportSection title="Priority Gaps Identified by AI" anchorId="priority-gaps" headingStyle="Green">
                        <div className="space-y-4">
                            {aiContent.priorityGaps?.map(gap => (
                                <div key={gap.questionCode} className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500">
                                    <h4 className="font-bold text-amber-800 dark:text-amber-200">{gap.questionCode}: {analysis.statsByQuestion[gap.questionCode]?.questionText}</h4>
                                    <p className="text-sm italic">{gap.reason}</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                    <ReportSection title="Detailed Item-by-Item Analysis" anchorId="item-analysis" headingStyle="Blue">
                        <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-gray-200 dark:border-blue-800 overflow-hidden">
                            {analysis.stats.map(stat => (
                                <QuestionDetailAccordion key={stat.questionCode} stat={stat} />
                            ))}
                        </div>
                    </ReportSection>
                </div>
            );
        }
        return null; // Should not be reached if no errors
    };

     return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-blue-950 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-blue-800 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartBarSquareIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Item-Level Questionnaire Analysis</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-blue-800" aria-label="Close report">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                <main className="overflow-y-auto p-6">
                   {renderContent()}
                </main>
            </div>
        </div>
    );
};
