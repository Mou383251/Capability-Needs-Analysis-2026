
import React, { useState, useEffect } from 'react';
import { GlobeAltIcon, CheckCircleIcon, ExclamationTriangleIcon, SaveIcon, ArrowPathIcon, ClipboardIcon } from './icons';
import { GoogleSheetsService } from '../services/GoogleSheetsService';

interface SystemSettingsProps {
    onClose?: () => void;
}

const SERVICE_ACCOUNT_EMAIL = 'cna-survey-reader@gen-lang-client-0479675963.iam.gserviceaccount.com';

export const SystemSettings: React.FC<SystemSettingsProps> = () => {
    const [sheetUrl, setSheetUrl] = useState('');
    const [extractedId, setExtractedId] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load initial ID from storage if exists
    useEffect(() => {
        const savedId = localStorage.getItem('cna_system_spreadsheet_id');
        if (savedId) {
            setExtractedId(savedId);
            setSheetUrl(`https://docs.google.com/spreadsheets/d/${savedId}/edit`);
            validateConnection(savedId);
        }
    }, []);

    const extractSpreadsheetId = (url: string): string | null => {
        const match = url.match(/\/d\/([^/]+)/);
        return match ? match[1] : null;
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setSheetUrl(url);
        const id = extractSpreadsheetId(url);
        setExtractedId(id);
        setConnectionStatus('idle');
        setErrorMessage(null);
    };

    const copyEmail = () => {
        navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
        alert("Service Account Email copied to clipboard.");
    };

    const validateConnection = async (id: string) => {
        setConnectionStatus('checking');
        setErrorMessage(null);
        try {
            await GoogleSheetsService.fetchSurveyData(id);
            setConnectionStatus('connected');
        } catch (err: any) {
            setConnectionStatus('error');
            setErrorMessage(err.message || 'Access denied or invalid ID.');
        }
    };

    const handleSave = () => {
        if (extractedId) {
            localStorage.setItem('cna_system_spreadsheet_id', extractedId);
            validateConnection(extractedId);
            alert('Cloud Registry ID saved to system configuration.');
        }
    };

    return (
        <div className="flex-1 p-6 md:p-10 bg-[#F4F7F9] animate-fade-in font-['Inter']">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">System Configuration</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest">Environment & Integration Controls</p>
                </header>

                <section className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <GlobeAltIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Cloud Registry Integration</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect to DPM Google Sheets Terminal</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Account Recipient (DPM Cloud)</label>
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-emerald-800 leading-none mb-1">CNA Official Reader Account</p>
                                    <code className="text-xs font-mono text-emerald-600 font-bold">{SERVICE_ACCOUNT_EMAIL}</code>
                                </div>
                                <button onClick={copyEmail} className="p-2.5 bg-white hover:bg-emerald-100 rounded-lg shadow-sm border border-emerald-200 transition-all text-emerald-600">
                                    <ClipboardIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Sheets URL</label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={sheetUrl}
                                    onChange={handleUrlChange}
                                    placeholder="https://docs.google.com/spreadsheets/d/your-id/edit"
                                    className="flex-1 p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={!extractedId}
                                    className="px-6 py-3 bg-[#1A365D] hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
                                >
                                    <SaveIcon className="w-4 h-4" /> Save Configuration
                                </button>
                            </div>
                        </div>

                        {extractedId && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extracted Spreadsheet ID</span>
                                    <code className="text-xs font-mono text-blue-600 font-bold mt-1">{extractedId}</code>
                                </div>
                                <div className="flex items-center gap-3">
                                    {connectionStatus === 'checking' && (
                                        <div className="flex items-center gap-2">
                                            <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validating Terminal...</span>
                                        </div>
                                    )}
                                    {connectionStatus === 'connected' && (
                                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connection Active</span>
                                        </div>
                                    )}
                                    {connectionStatus === 'error' && (
                                        <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-rose-600" />
                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Authentication Failed</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {errorMessage && (
                            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-4 rounded-xl border border-rose-100 italic">
                                "{errorMessage}"
                            </p>
                        )}

                        <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-[0.2em] mb-2">Setup Instructions</h3>
                            <ul className="text-xs text-blue-700 leading-relaxed space-y-1 font-medium list-disc list-inside">
                                <li><strong>Step 1:</strong> Copy the "Official Reader Account" email shown above.</li>
                                <li><strong>Step 2:</strong> In your Google Sheet, click <strong>"Share"</strong>.</li>
                                <li><strong>Step 3:</strong> Paste the email and set role to <strong>"Viewer"</strong>.</li>
                                <li><strong>Step 4:</strong> Paste the URL of your sheet into the input above and click "Save".</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
