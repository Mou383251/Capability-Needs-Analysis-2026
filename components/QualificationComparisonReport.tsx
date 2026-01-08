
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, EstablishmentRecord, AgencyType, AiQualificationComparisonReport, QualificationComparisonRecord } from '../types';
import { AI_QUALIFICATION_COMPARISON_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, AcademicCapIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData, copyForSheets, exportToCsv } from '../utils/export';

interface ReportProps {
    cnaData: OfficerRecord[];
    establishmentData: EstablishmentRecord[];
    agencyName: string;
    onClose: () => void;
}

const aiSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        comparisonTable: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    officerId: { type: Type.STRING },
                    officerName: { type: Type.STRING },
                    division: { type: Type.STRING },
                    positionTitle: { type: Type.STRING },
                    positionNumber: { type: Type.STRING },
                    jobRequiredQualification: { type: Type.STRING },
                    officerAttainedQualification: { type: Type.STRING },
                    qualificationMatchStatus: { type: Type.STRING, enum: ['Match', 'Gap', 'Overqualified', 'N/A'] },
                    qualificationGapDescription: { type: Type.STRING },
                    recommendationCategory: { type: Type.STRING, enum: ['Training', 'Upskilling', 'Qualified', 'Overqualified', 'Review'] },
                    remarks: { type: Type.STRING },
                },
                required: ["officerId", "officerName", "division", "positionTitle", "positionNumber", "jobRequiredQualification", "officerAttainedQualification", "qualificationMatchStatus", "qualificationGapDescription", "recommendationCategory", "remarks"]
            }
        }
    },
    required: ["executiveSummary", "comparisonTable"]
};

const ReportSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">{title}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);

export const QualificationComparisonReport: React.FC<ReportProps> = ({ cnaData, establishmentData, agencyName, onClose }) => {
    const [report, setReport] = useState<AiQualificationComparisonReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const generateReport = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }
            if (!establishmentData || establishmentData.length === 0 || !cnaData || cnaData.length === 0) {
                 setError("Both CNA and Establishment data are required to generate this report.");
                 setLoading(false);
                 return;
            }
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const promptText = `Please analyze the following datasets for ${agencyName} to generate the Qualification Comparison Table.\n\nCNA DATA:\n${JSON.stringify(cnaData, null, 2)}\n\nESTABLISHMENT DATA:\n${JSON.stringify(establishmentData, null, 2)}`;
                
                /* FIX: Updated model to 'gemini-3-flash-preview' per guidelines */
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: promptText,
                    config: {
                        systemInstruction: AI_QUALIFICATION_COMPARISON_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiSchema,
                    },
                });

                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error("AI Qualification Comparison Report Error:", e);
                setError("An error occurred while generating the AI analysis. The model may have returned an unexpected format.");
            } finally {
                setLoading(false);
            }
        };
        generateReport();
    }, [cnaData, establishmentData, agencyName]);

    const filteredData = useMemo(() => {
        if (!report?.comparisonTable) return [];
        const lowerCaseFilter = filter.toLowerCase();
        return report.comparisonTable.filter(record => 
            Object.values(record).some(val => 
                String(val).toLowerCase().includes(lowerCaseFilter)
            )
        );
    }, [report, filter]);
    
    const getReportDataForExport = (): ReportData => {
        if (!report) throw new Error("Report not available");
        const headers = ['Officer ID', 'Officer Name', 'Division', 'Position Title', 'Position Number', 'Job Required Qualification', 'Officer Attained Qualification', 'Match Status', 'Gap Description', 'Recommendation', 'Remarks'];
        const rows = filteredData.map(r => [
            r.officerId, r.officerName, r.division, r.positionTitle, r.positionNumber, r.jobRequiredQualification, r.officerAttainedQualification,
            r.qualificationMatchStatus, r.qualificationGapDescription, r.recommendationCategory, r.remarks
        ]);
        return {
            title: `Qualification Comparison - ${agencyName}`,
            sections: [
                { title: "Executive Summary", content: [report.executiveSummary] },
                { title: "Qualification Comparison Table", content: [{ type: 'table', headers, rows }], orientation: 'landscape' }
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'csv') exportToCsv(reportData);
            else if (format === 'sheets') copyForSheets(reportData).then(msg => alert(msg)).catch(err => alert(String(err)));
            else if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };
    
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Match': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Gap': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case 'Overqualified': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const renderContent = () => {
        if (loading) return <div className="p-8 text-center"><SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-blue-500" /><p className="mt-2">AI is analyzing qualifications...</p></div>;
        if (error) return <div className="p-8 bg-red-50 dark:bg-red-900/20 text-center"><h3 className="font-bold text-red-700">Analysis Failed</h3><p className="text-sm">{error}</p></div>;
        if (!report) return <div className="p-8 text-center">No data to display.</div>;

        return (
            <div className="space-y-6">
                <ReportSection title="Executive Summary"><p>{report.executiveSummary}</p></ReportSection>
                <div className="bg-white dark:bg-blue-900/50 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Qualification Comparison Table ({filteredData.length})</h3>
                        <input
                            type="text"
                            placeholder="Filter table..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full max-w-sm p-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-200 dark:bg-slate-800/50">
                                <tr>
                                    {['Officer', 'Position', 'Required Qualification', 'Attained Qualification', 'Status', 'Recommendation', 'Remarks'].map(h => 
                                        <th key={h} className="p-2 font-semibold">{h}</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, index) => (
                                    <tr key={index} className="border-b border-slate-200 dark:border-slate-700">
                                        <td className="p-2"><p className="font-semibold">{row.officerName}</p><p className="text-slate-500">{row.officerId}</p></td>
                                        <td className="p-2"><p className="font-semibold">{row.positionTitle}</p><p className="text-slate-500">{row.positionNumber}</p></td>
                                        <td className="p-2">{row.jobRequiredQualification}</td>
                                        <td className="p-2">{row.officerAttainedQualification}</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(row.qualificationMatchStatus)}`}>{row.qualificationMatchStatus}</span></td>
                                        <td className="p-2">{row.recommendationCategory}</td>
                                        <td className="p-2 italic text-slate-500">{row.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AcademicCapIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Qualification Comparison Report</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                <main className="overflow-y-auto p-6">{renderContent()}</main>
            </div>
        </div>
    );
};
