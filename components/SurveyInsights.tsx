import React, { useState, useEffect, useMemo } from 'react';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { transformSheetDataForCharts } from '../utils/chartUtils';
import { ChartComponent } from './charts';
import { ChartBarIcon, GlobeAltIcon, ArrowPathIcon, ExclamationTriangleIcon, SparklesIcon } from './icons';

export const SurveyInsights: React.FC = () => {
    const [sheetData, setSheetData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

    useEffect(() => {
        const savedId = localStorage.getItem('cna_system_spreadsheet_id');
        if (savedId) {
            setSpreadsheetId(savedId);
            fetchData(savedId);
        }
    }, []);

    const fetchData = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await GoogleSheetsService.fetchSurveyData(id);
            if (data && data.length > 0) {
                setSheetData(data);
                const headers = Object.keys(data[0]);
                setColumns(headers);
                // Default to a common question column if available
                const defaultCol = headers.find(h => h.includes('?') || h.toLowerCase().includes('rate')) || headers[0];
                setSelectedColumn(defaultCol);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to sync with Cloud Terminal.');
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!selectedColumn || sheetData.length === 0) return null;
        const transformed = transformSheetDataForCharts(sheetData, selectedColumn);
        
        return {
            labels: transformed.map(t => t.category),
            datasets: [{
                label: 'Response Count',
                data: transformed.map(t => t.score),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(139, 92, 246, 0.7)'
                ],
                borderRadius: 8
            }]
        };
    }, [sheetData, selectedColumn]);

    if (!spreadsheetId) {
        return (
            <div className="flex-1 p-10 flex flex-col items-center justify-center text-center bg-[#F4F7F9]">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                    <GlobeAltIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cloud Terminal Not Configured</h2>
                <p className="text-sm text-slate-500 max-w-sm mt-2">Please visit System Settings to link a Google Sheets survey database before viewing insights.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#F4F7F9] font-['Inter']">
            <header className="p-6 md:p-8 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                        <ChartBarIcon className="w-7 h-7 text-blue-600" />
                        Community Survey Insights
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        Connected to Cloud Registry: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-mono">{spreadsheetId}</code>
                    </p>
                </div>
                <button 
                    onClick={() => fetchData(spreadsheetId)}
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#1A365D] hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Sync Cloud Data
                </button>
            </header>

            <main className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
                {error ? (
                    <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                        <ExclamationTriangleIcon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">Sync Failure</h3>
                        <p className="text-sm text-rose-700 mt-2 whitespace-pre-wrap">{error}</p>
                        <div className="mt-6 p-4 bg-white/50 rounded-xl text-left inline-block">
                            <p className="text-xs font-black text-rose-800 uppercase mb-2 tracking-widest">Troubleshooting Guide:</p>
                            <ul className="text-xs text-rose-600 space-y-1 list-disc list-inside font-medium">
                                <li>Ensure the Service Account has "Viewer" access.</li>
                                <li>Verify the Spreadsheet ID is correct in Settings.</li>
                                <li>Check if the Sheet is published or shared correctly.</li>
                            </ul>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <SparklesIcon className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs">Aggregating National Data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Selector Section */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Diagnostic Column</label>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                                    {columns.map(col => (
                                        <button
                                            key={col}
                                            onClick={() => setSelectedColumn(col)}
                                            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${
                                                selectedColumn === col 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                                                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                                            }`}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Visualization Section */}
                        <div className="lg:col-span-8">
                            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">{selectedColumn}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Frequency Distribution • N={sheetData.length}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Valid Engine</div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 relative">
                                    {chartData && (
                                        <ChartComponent 
                                            type="bar" 
                                            data={chartData} 
                                            options={{
                                                indexAxis: 'y',
                                                plugins: { legend: { display: false } },
                                                scales: { x: { grid: { display: false } } }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
