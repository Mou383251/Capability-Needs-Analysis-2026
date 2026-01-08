
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, QUESTION_TEXT_MAPPING, EstablishmentRecord } from '../types';
import { AI_AUTOMATED_ESTABLISHMENT_SUMMARY_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, BuildingOfficeIcon, InformationCircleIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, exportToCsv, copyForSheets } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

interface EstablishmentSummaryItem {
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    status: string;
    cnaSubmitted: 'Submitted' | 'TBD' | 'N/A';
}

interface SummaryStats {
    totalPositions: number;
    confirmedOfficers: number;
    cnaSubmittedCount: number;
    eligibleForTraining: number;
    vacantPositions: number;
    stcOfficers: number;
    attendedTraining: number;
}

interface AiEstablishmentSummaryReport {
    establishmentList: EstablishmentSummaryItem[];
    summaryStats: SummaryStats;
}

const aiAutomatedEstablishmentSummarySchema = {
    type: Type.OBJECT,
    properties: {
        establishmentList: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    positionNumber: { type: Type.STRING },
                    grade: { type: Type.STRING },
                    designation: { type: Type.STRING },
                    occupant: { type: Type.STRING },
                    status: { type: Type.STRING },
                    cnaSubmitted: { type: Type.STRING, enum: ['Submitted', 'TBD', 'N/A'] },
                },
                required: ["positionNumber", "grade", "designation", "occupant", "status", "cnaSubmitted"]
            }
        },
        summaryStats: {
            type: Type.OBJECT,
            properties: {
                totalPositions: { type: Type.NUMBER },
                confirmedOfficers: { type: Type.NUMBER },
                cnaSubmittedCount: { type: Type.NUMBER },
                eligibleForTraining: { type: Type.NUMBER },
                vacantPositions: { type: Type.NUMBER },
                stcOfficers: { type: Type.NUMBER },
                attendedTraining: { type: Type.NUMBER },
            },
            required: ["totalPositions", "confirmedOfficers", "cnaSubmittedCount", "eligibleForTraining", "vacantPositions", "stcOfficers", "attendedTraining"]
        }
    },
    required: ["establishmentList", "summaryStats"]
};

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center mb-8">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <circle cx="50" cy="50" r="48" stroke="#1A365D" strokeWidth="1" strokeOpacity="0.2" fill="#1A365D" fillOpacity="0.05" />
            <path d="M50 15 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z" fill="#EAB308" />
            <text x="50" y="35" textAnchor="middle" fill="#1A365D" fontSize="10" fontWeight="bold">PNG</text>
        </svg>
        <div className="h-0.5 w-16 bg-[#1A365D] rounded-full opacity-20 mt-2"></div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
        <p className="text-3xl font-black text-[#1A365D] dark:text-blue-400">{value}</p>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">{title}</h3>
    </div>
);


export const AutomatedEstablishmentSummary: React.FC<ReportProps> = ({ data, establishmentData, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiEstablishmentSummaryReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const promptContext = useMemo(() => {
        if (agencyName && agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyName}', a '${agencyType}'.`;
        }
        if (agencyType !== 'All Agencies') {
            return `The analysis should be tailored for a '${agencyType}'.`;
        }
        return 'The analysis should be general and applicable for all public service agencies.';
    }, [agencyType, agencyName]);

    useEffect(() => {
        const generateForm = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
             if (!establishmentData || establishmentData.length === 0) {
                 setError("No establishment data available. Please import the master register.");
                 setLoading(false);
                 return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Generate an exhaustive Establishment Summary. Compare the Master Establishment data against the CNA staff records to find 'Staffing on Strength'. Do not skip any rows or sheets.\n\nESTABLISHMENT:\n${JSON.stringify(establishmentData, null, 2)}\n\nCNA STAFF RECORDS:\n${JSON.stringify(data.map(d=>({name: d.name, pos: d.positionNumber})), null, 2)}`;
                
                /* FIX: Updated model to 'gemini-3-flash-preview' per guidelines */
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_AUTOMATED_ESTABLISHMENT_SUMMARY_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiAutomatedEstablishmentSummarySchema,
                    },
                });

                const result = JSON.parse(response.text.trim()) as AiEstablishmentSummaryReport;
                setReport(result);
            } catch (e) {
                setError("Failed to aggregate register data.");
            } finally {
                setLoading(false);
            }
        };
        generateForm();
    }, [data, establishmentData, promptContext]);

    const handleExport = (format: string) => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Establishment & Strength Summary - ${agencyName}`,
            sections: [
                {
                    title: "Management Performance Indicators",
                    content: [{
                        type: 'table',
                        headers: ['Metric', 'Total Count'],
                        rows: [
                            ['Total Staff Ceiling (Authorized)', report.summaryStats.totalPositions],
                            ['Staff on Strength (Actual)', report.summaryStats.totalPositions - report.summaryStats.vacantPositions],
                            ['Vacant Positions', report.summaryStats.vacantPositions],
                            ['CNA Participation Rate', `${((report.summaryStats.cnaSubmittedCount / (report.summaryStats.totalPositions - report.summaryStats.vacantPositions)) * 100).toFixed(1)}%`]
                        ]
                    }]
                },
                {
                    title: "Establishment Register Audit",
                    content: [{
                        type: 'table',
                        headers: ['Position No.', 'Grade', 'Designation', 'Occupant Name', 'Status', 'CNA Progress'],
                        rows: report.establishmentList.map(o => [
                            o.positionNumber, o.grade, o.designation, o.occupant || 'VACANT', o.status, o.cnaSubmitted
                        ])
                    }],
                    orientation: 'landscape'
                }
            ]
        };

        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'docx') exportToDocx(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'csv') exportToCsv(reportData);
    };

    const renderContent = () => {
        if (loading) return <div className="text-center p-20"><SparklesIcon className="w-16 h-16 mx-auto animate-pulse text-blue-500" /><p className="mt-6 font-black text-slate-400 uppercase tracking-widest">Scanning Register Sheets...</p></div>;
        if (error) return <div className="p-10 text-center text-red-600 font-black uppercase">{error}</div>;
        if (report) {
            const filledPositions = report.summaryStats.totalPositions - report.summaryStats.vacantPositions;
            return (
             <div className="space-y-10 p-4">
                <PNGNationalCrest />
                <h2 className="text-center font-black text-2xl text-[#1A365D] uppercase tracking-[0.2em] mb-10">Institutional Establishment Summary</h2>

                 <div className="bg-slate-50/50 p-10 rounded-[32px] border border-slate-100 shadow-inner">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard title="Total Staff Ceiling" value={report.summaryStats.totalPositions} />
                        <StatCard title="Staff on Strength" value={filledPositions} />
                        <StatCard title="Confirmed Officers" value={report.summaryStats.confirmedOfficers} />
                        <StatCard title="Vacant Positions" value={report.summaryStats.vacantPositions} />
                    </div>
                </div>

                <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                        <h3 className="text-lg font-black text-[#1A365D] uppercase tracking-widest">Establishment Register Details</h3>
                        <div className="[&_button]:bg-[#2AAA52] [&_button]:text-white [&_button]:border-none [&_button]:px-6 [&_button]:rounded-xl [&_button]:font-black [&_button]:uppercase [&_button]:text-[10px] [&_button]:tracking-widest shadow-lg">
                            <ExportMenu onExport={handleExport} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead className="bg-[#1A365D] text-white">
                                <tr>
                                    {['Position No.', 'Grade', 'Designation', 'Occupant Name', 'Status', 'CNA Progress'].map(h => 
                                        <th key={h} className="p-5 font-black uppercase tracking-[0.1em] border-r border-white/5">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {report.establishmentList.map((officer, index) => (
                                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 font-black text-[#1A365D]">{officer.positionNumber}</td>
                                        <td className="p-5 text-slate-500">{officer.grade}</td>
                                        <td className="p-5 font-bold text-slate-700">{officer.designation}</td>
                                        <td className="p-5 font-semibold text-slate-800">{officer.occupant || <span className="text-red-400 font-black italic">VACANT</span>}</td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${officer.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{officer.status}</span>
                                        </td>
                                        <td className="p-5 text-center">
                                             <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${officer.cnaSubmitted === 'Submitted' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{officer.cnaSubmitted}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in no-print overflow-y-auto" aria-modal="true" role="dialog">
            <div className="bg-slate-50 rounded-[32px] shadow-2xl max-w-7xl w-full flex flex-col mb-10">
                <header className="flex justify-between items-center p-8 border-b border-slate-200 flex-shrink-0 bg-white rounded-t-[32px]">
                     <div className="flex items-center gap-5">
                        <BuildingOfficeIcon className="w-10 h-10 text-[#1A365D]" />
                        <div>
                            <h1 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter">Establishment Summary Report</h1>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Register for Management Decision Making</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm">
                        <XIcon className="w-8 h-8" />
                    </button>
                </header>
                <main className="overflow-y-auto p-10 bg-white">
                   {renderContent()}
                </main>
                 <footer className="text-center p-6 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-[32px]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Confidential - National Public Service Personnel Records</p>
                </footer>
            </div>
        </div>
    );
};
