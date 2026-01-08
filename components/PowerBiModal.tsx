
import React, { useState } from 'react';
import { OfficerRecord } from '../types';
import { XIcon, PresentationChartLineIcon, DocumentArrowUpIcon, InformationCircleIcon } from './icons';
import { exportToCsv, ReportData } from '../utils/export';

interface PowerBiModalProps {
    data: OfficerRecord[];
    onClose: () => void;
}

export const PowerBiModal: React.FC<PowerBiModalProps> = ({ data, onClose }) => {
    const [embedUrl, setEmbedUrl] = useState('');
    const [iframeUrl, setIframeUrl] = useState('');

    const handleEmbed = () => {
        // Directly set the URL for the iframe. 
        // We DO NOT fetch/validate it to avoid CORS errors.
        if (embedUrl.trim()) {
            setIframeUrl(embedUrl.trim());
        }
    };

    const handleExportData = () => {
        // Flatten data for Power BI optimization (Unpivot capability ratings)
        const headers = [
            'Officer Name', 'Position', 'Division', 'Grade', 'Grading Group', 
            'Gender', 'Age', 'SPA Rating', 'Years of Experience',
            'Question Code', 'Current Score', 'Gap Score', 'Gap Category'
        ];
        
        const rows: (string | number)[][] = [];

        data.forEach(officer => {
            if (officer.capabilityRatings && officer.capabilityRatings.length > 0) {
                officer.capabilityRatings.forEach(rating => {
                    rows.push([
                        officer.name,
                        officer.position,
                        officer.division,
                        officer.grade,
                        officer.gradingGroup || 'Other',
                        officer.gender || 'Unknown',
                        officer.age || '',
                        officer.spaRating,
                        officer.yearsOfExperience || '',
                        rating.questionCode,
                        rating.currentScore,
                        rating.gapScore,
                        rating.gapCategory
                    ]);
                });
            } else {
                // Include officers even if they have no ratings (for headcount)
                rows.push([
                    officer.name,
                    officer.position,
                    officer.division,
                    officer.grade,
                    officer.gradingGroup || 'Other',
                    officer.gender || 'Unknown',
                    officer.age || '',
                    officer.spaRating,
                    officer.yearsOfExperience || '',
                    'N/A', 0, 0, 'No Data'
                ]);
            }
        });

        const reportData: ReportData = {
            title: 'CNA_PowerBI_Dataset',
            sections: [{
                title: 'Data',
                content: [{ type: 'table', headers, rows }]
            }]
        };

        exportToCsv(reportData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-6xl w-full h-[85vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500 rounded-lg">
                            <PresentationChartLineIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Power BI Integration</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Embed dashboards & prepare data</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                
                <main className="flex-1 overflow-hidden flex flex-col p-6 gap-6">
                    {/* Controls Section */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Power BI Embed URL</label>
                                <input 
                                    type="text" 
                                    value={embedUrl} 
                                    onChange={(e) => setEmbedUrl(e.target.value)} 
                                    placeholder="Paste 'Publish to Web' URL or Secure Embed URL..." 
                                    className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                />
                            </div>
                            <button 
                                onClick={handleEmbed} 
                                className="w-full md:w-auto px-6 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-semibold text-sm whitespace-nowrap shadow-sm transition-colors"
                            >
                                Load Dashboard
                            </button>
                            <div className="hidden md:block h-8 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
                            <button 
                                onClick={handleExportData} 
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold text-sm whitespace-nowrap shadow-sm transition-colors"
                            >
                                <DocumentArrowUpIcon className="w-4 h-4" />
                                Get Data (CSV)
                            </button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-3 rounded">
                            <InformationCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                            <p>
                                <strong>Tip:</strong> For public access, use <em>File &gt; Embed report &gt; Publish to web (public)</em> in Power BI Service. 
                                For secure reports, ensure you are logged into Power BI in this browser. 
                                Use "Get Data" to download the dataset structured specifically for Power BI Desktop import.
                            </p>
                        </div>
                    </div>

                    {/* Iframe Container */}
                    <div className="flex-1 bg-slate-200 dark:bg-slate-900/50 rounded-lg shadow-inner border border-slate-300 dark:border-slate-700 overflow-hidden relative">
                        {iframeUrl ? (
                            <iframe 
                                title="Power BI Report"
                                src={iframeUrl} 
                                className="w-full h-full border-0" 
                                allowFullScreen={true}
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                loading="lazy"
                            ></iframe>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-full mb-4 shadow-sm">
                                    <PresentationChartLineIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-lg font-semibold">Dashboard Preview Area</p>
                                <p className="text-sm max-w-md mt-2">
                                    Paste a URL above to load your interactive report.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
