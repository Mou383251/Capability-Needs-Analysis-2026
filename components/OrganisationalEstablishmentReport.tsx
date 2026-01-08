
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AiOrganisationalEstablishmentReport, AgencyType, QUESTION_TEXT_MAPPING } from '../types';
import { AI_ORGANISATIONAL_ESTABLISHMENT_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, BuildingOfficeIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
    data: OfficerRecord[];
    establishmentData: EstablishmentRecord[];
    agencyName: string;
    onClose: () => void;
}

const aiReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        establishmentByDivision: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    divisionName: { type: Type.STRING },
                    positions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                division: { type: Type.STRING },
                                clevel: { type: Type.STRING },
                                positionNumber: { type: Type.STRING },
                                positionTitle: { type: Type.STRING },
                                frz: { type: Type.STRING },
                                reference: { type: Type.STRING },
                                funding: { type: Type.STRING },
                                accountNumber: { type: Type.STRING },
                                award: { type: Type.STRING },
                                class: { type: Type.STRING },
                                step: { type: Type.STRING },
                                occupantName: { type: Type.STRING },
                                gen: { type: Type.STRING },
                                dob: { type: Type.STRING },
                                age: { type: Type.NUMBER },
                                firstCommence: { type: Type.STRING },
                            },
                            required: ["division", "clevel", "positionNumber", "positionTitle", "frz", "reference", "funding", "accountNumber", "award", "class", "step", "occupantName", "gen", "dob", "age", "firstCommence"]
                        }
                    }
                },
                required: ["divisionName", "positions"]
            }
        },
        summaryStats: {
            type: Type.OBJECT,
            properties: {
                totalPositions: { type: Type.NUMBER },
                frozenPositions: { type: Type.NUMBER },
                filledPositions: { type: Type.NUMBER },
                vacantPositions: { type: Type.NUMBER },
                averageAge: { type: Type.NUMBER },
                averageYearsOfService: { type: Type.NUMBER },
            },
            required: ["totalPositions", "frozenPositions", "filledPositions", "vacantPositions", "averageAge", "averageYearsOfService"]
        },
        observationsAndRecommendations: { type: Type.STRING },
    },
    required: ["executiveSummary", "establishmentByDivision", "summaryStats", "observationsAndRecommendations"]
};


const ReportSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-blue-800 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-blue-800 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-slate-100 dark:bg-blue-950 p-4 rounded-lg shadow-sm">
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{value}</p>
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">{title}</h3>
    </div>
);

export const OrganisationalEstablishmentReport: React.FC<ReportProps> = ({ data, establishmentData, agencyName, onClose }) => {
    const [report, setReport] = useState<AiOrganisationalEstablishmentReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                const prompt = `Please generate an Organisational Establishment report for ${agencyName}.
                
                **Establishment Data (Primary Source):**
                ${JSON.stringify(establishmentData, null, 2)}

                **CNA Data (For enriching officer details like gender, DOB, etc.):**
                ${JSON.stringify(data.map(o => ({ positionNumber: o.positionNumber, name: o.name, gender: o.gender, dateOfBirth: o.dateOfBirth, commencementDate: o.commencementDate })), null, 2)}
                `;

                // FIX: Changed model to 'gemini-3-flash-preview' as per task guidelines
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: `You MUST use this mapping to understand question codes: ${JSON.stringify(QUESTION_TEXT_MAPPING, null, 2)}\n${prompt}`,
                    config: {
                        systemInstruction: AI_ORGANISATIONAL_ESTABLISHMENT_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiReportSchema,
                    },
                });

                // FIX: Accessing .text property directly
                const text = response.text || '';
                const parsedReport = JSON.parse(text.trim()) as AiOrganisationalEstablishmentReport;
                setReport(parsedReport);
            } catch (e) {
                console.error("Organisational Establishment Report Error:", e);
                setError("An error occurred while generating the AI analysis for the establishment report.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [data, establishmentData, agencyName]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        alert(`Export to ${format} is not yet implemented for this report.`);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-slate-500 animate-pulse" />
                    <h2 className="mt-4 text-2xl font-bold">Analyzing Establishment Data...</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Gemini is compiling the organizational structure report.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[400px] text-center">
                    <XIcon className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-red-700 dark:text-red-300">Analysis Failed</h2>
                    <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
                </div>
            );
        }

        if (report) {
            const stats = report.summaryStats;
            return (
                <div className="space-y-6">
                    <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                    
                    <ReportSection title="Overall Establishment Summary">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <StatCard title="Total Positions" value={stats.totalPositions} />
                            <StatCard title="Filled Positions" value={stats.filledPositions} />
                            <StatCard title="Vacant Positions" value={stats.vacantPositions} />
                            <StatCard title="Frozen Positions" value={stats.frozenPositions} />
                            <StatCard title="Average Age" value={stats.averageAge.toFixed(1)} />
                            <StatCard title="Avg. Years of Service" value={stats.averageYearsOfService.toFixed(1)} />
                        </div>
                    </ReportSection>

                    {report.establishmentByDivision.map(division => (
                        <ReportSection key={division.divisionName} title={`Division: ${division.divisionName}`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-200 dark:bg-blue-800/50">
                                        <tr>
                                            <th className="p-2 font-semibold">C.Level</th>
                                            <th className="p-2 font-semibold">Position No.</th>
                                            <th className="p-2 font-semibold">Position Title</th>
                                            <th className="p-2 font-semibold">Class</th>
                                            <th className="p-2 font-semibold">Occupant</th>
                                            <th className="p-2 font-semibold">Gen</th>
                                            <th className="p-2 font-semibold">Age</th>
                                            <th className="p-2 font-semibold">First Commence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {division.positions.map((pos, index) => (
                                            <tr key={index} className="border-b border-slate-200 dark:border-blue-800">
                                                <td className="p-2">{pos.clevel}</td>
                                                <td className="p-2">{pos.positionNumber}</td>
                                                <td className="p-2 font-semibold">{pos.positionTitle}</td>
                                                <td className="p-2">{pos.class}</td>
                                                <td className="p-2">{pos.occupantName}</td>
                                                <td className="p-2">{pos.gen}</td>
                                                <td className="p-2">{pos.age}</td>
                                                <td className="p-2">{pos.firstCommence}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </ReportSection>
                    ))}

                    <ReportSection title="Observations & Recommendations">
                        <p className="whitespace-pre-wrap">{report.observationsAndRecommendations}</p>
                    </ReportSection>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <BuildingOfficeIcon className="w-7 h-7 text-slate-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organisational Establishment Report</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close report">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
                 <footer className="text-center p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Analysis generated by Google Gemini.</p>
                </footer>
            </div>
        </div>
    );
};
