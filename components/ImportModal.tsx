import React, { useState, useMemo } from 'react';
import { XIcon, DocumentArrowUpIcon, SpinnerIcon, CheckCircleIcon, ArrowRightIcon, GlobeAltIcon, ClipboardIcon, SparklesIcon, ExclamationTriangleIcon } from './icons';
import { OfficerRecord, AgencyType, EstablishmentRecord } from '../types';
import { parseCnaFile, parsePastedData, parseEstablishmentFile } from '../utils/import';
import { GoogleGenAI, Type } from "@google/genai";
import { GoogleSheetsService } from '../services/GoogleSheetsService';

interface ImportModalProps {
    onImport: (
        data: OfficerRecord[], 
        agencyType: AgencyType, 
        agencyName: string, 
        establishmentData?: EstablishmentRecord[], 
        corporatePlanContext?: string
    ) => void;
    onClose: () => void;
}

const SERVICE_ACCOUNT_EMAIL = 'cna-survey-reader@gen-lang-client-0479675963.iam.gserviceaccount.com';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
    const [step, setStep] = useState<'upload' | 'mapping'>('upload');
    const [activeTab, setActiveTab] = useState<'file' | 'paste' | 'google'>('file');
    const [cnaFile, setCnaFile] = useState<File | null>(null);
    const [establishmentFile, setEstablishmentFile] = useState<File | null>(null);
    const [corporatePlanFile, setCorporatePlanFile] = useState<File | null>(null);
    const [pastedData, setPastedData] = useState('');
    const [googleSheetInput, setGoogleSheetInput] = useState('');
    const [agencyType, setAgencyType] = useState<AgencyType>('National Agency');
    const [agencyName, setAgencyName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [corporatePlanSummary, setCorporatePlanSummary] = useState<string | null>(null);
    
    const [importedCnaResult, setImportedCnaResult] = useState<{ data: OfficerRecord[], headers: string[] } | null>(null);
    const [importedEstablishmentResult, setImportedEstablishmentResult] = useState<{ data: EstablishmentRecord[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const extractSpreadsheetId = (input: string): string => {
        const regex = /\/d\/([a-zA-Z0-9-_]+)/;
        const match = input.match(regex);
        return match ? match[1] : input.trim();
    };

    const processCorporatePlanPdf = async (file: File) => {
        if (!process.env.API_KEY) {
            setError("Security Gate: API key not configured for Document Intelligence.");
            return;
        }

        // Lower limit to prevent RPC payload timeouts
        if (file.size > 10 * 1024 * 1024) {
            setError("Strategic Document too large (Limit: 10MB). Please compress or use a summary version.");
            setCorporatePlanFile(null);
            return;
        }
        
        setIsProcessingPdf(true);
        setError(null);

        try {
            /* Correct initialization as per guidelines */
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const base64Data = await fileToBase64(file);

            const schema = {
                type: Type.OBJECT,
                properties: {
                    strategic_goals: {
                        type: Type.OBJECT,
                        properties: {
                            vision: { type: Type.STRING },
                            mission: { type: Type.STRING },
                            values: { type: Type.ARRAY, items: { type: Type.STRING } },
                            objectives: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["vision", "mission", "objectives"]
                    },
                    training_needs: { type: Type.STRING },
                    financial_context: { type: Type.STRING },
                    risk_assessment: { type: Type.STRING },
                    personnel_establishment: { type: Type.STRING },
                    full_document_context: { type: Type.STRING }
                },
                required: ["strategic_goals", "training_needs", "financial_context", "risk_assessment", "personnel_establishment", "full_document_context"]
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview', 
                contents: { 
                    parts: [
                        { inlineData: { mimeType: 'application/pdf', data: base64Data } },
                        { text: "Extract strategic data buckets. Return strictly JSON." }
                    ] 
                },
                config: {
                    systemInstruction: "You are a Strategic Data Architect. Extract objectives, training needs, and risk profiles from the PDF.",
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });

            /* Accessing .text property directly instead of text() method */
            setCorporatePlanSummary(response.text?.trim() || '');
        } catch (e: any) {
            console.error("PDF Scan Error:", e);
            setError("Document Analysis Failure. This usually happens with complex PDFs or network timeouts. Try a smaller version.");
            setCorporatePlanFile(null);
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const handleCorporatePlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCorporatePlanFile(file);
            processCorporatePlanPdf(file);
        }
    };

    // Added handleCompleteImport to resolve the missing function name error and finalize the ingestion process.
    const handleCompleteImport = () => {
        if (importedCnaResult) {
            onImport(
                importedCnaResult.data,
                agencyType,
                agencyName,
                importedEstablishmentResult?.data,
                corporatePlanSummary || undefined
            );
        }
    };

    const handleProceedToMapping = async () => {
        if (!agencyName.trim()) {
            setError("Institutional name is required.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            let processedCna: any = null;
            let processedEst: any = null;

            if (activeTab === 'file' && cnaFile) {
                processedCna = await parseCnaFile(cnaFile, agencyType);
            } else if (activeTab === 'paste' && pastedData.trim()) {
                processedCna = await parsePastedData(pastedData, agencyType);
            } else if (activeTab === 'google' && googleSheetInput.trim()) {
                const sheetId = extractSpreadsheetId(googleSheetInput);
                const sheetData = await GoogleSheetsService.fetchSurveyData(sheetId);
                
                if (!sheetData || sheetData.length === 0) {
                    throw new Error("Cloud registry returned no valid records.");
                }
                
                const headers = Object.keys(sheetData[0]);
                const tsvString = `${headers.join('\t')}\n${sheetData.map((r: any) => Object.values(r).join('\t')).join('\n')}`;
                processedCna = await parsePastedData(tsvString, agencyType);
            } else {
                throw new Error("No source data provided.");
            }

            if (establishmentFile) {
                processedEst = await parseEstablishmentFile(establishmentFile, agencyType);
            }

            setImportedCnaResult(processedCna);
            setImportedEstablishmentResult(processedEst);
            setStep('mapping');

        } catch (err: any) {
            console.error("Ingestion Error:", err);
            setError(err.message || "Failed to process data sources.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center p-8 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter">Universal Ingestion</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Synchronization Hub</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all shadow-sm">
                        <XIcon className="w-8 h-8" />
                    </button>
                </header>
                
                <main className="p-10 overflow-y-auto">
                    {step === 'upload' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">1. Institutional Profile</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select 
                                        value={agencyType} 
                                        onChange={(e) => setAgencyType(e.target.value as AgencyType)}
                                        className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-[#1A365D]"
                                    >
                                        <option value="National Department">National Department</option>
                                        <option value="Provincial Administration">Provincial Administration</option>
                                        <option value="Provincial Health Authority">Provincial Health Authority</option>
                                        <option value="Other">Other Authority</option>
                                    </select>
                                    <input 
                                        type="text" 
                                        value={agencyName} 
                                        onChange={(e) => setAgencyName(e.target.value)}
                                        className="w-full p-3.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-[#1A365D]"
                                        placeholder="Authority Name (e.g. DPM)"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">2. CNA Data Feed</h3>
                                <div className="flex space-x-6 mb-4 border-b border-slate-100">
                                    <button onClick={() => setActiveTab('file')} className={`text-[10px] font-black pb-3 uppercase tracking-widest transition-all ${activeTab === 'file' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Local File</button>
                                    <button onClick={() => setActiveTab('paste')} className={`text-[10px] font-black pb-3 uppercase tracking-widest transition-all ${activeTab === 'paste' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Direct Paste</button>
                                    <button onClick={() => setActiveTab('google')} className={`text-[10px] font-black pb-3 uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'google' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                        <GlobeAltIcon className="w-3 h-3" /> Cloud Terminal
                                    </button>
                                </div>

                                {activeTab === 'file' && (
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/30 hover:border-blue-300 transition-colors">
                                        <input type="file" accept=".xlsx,.csv" onChange={(e) => handleFileChange(e, setCnaFile)} className="hidden" id="cna-file-upload" />
                                        <label htmlFor="cna-file-upload" className="cursor-pointer flex flex-col items-center">
                                            <DocumentArrowUpIcon className="w-10 h-10 text-slate-300 mb-2" />
                                            <span className="text-sm font-bold text-slate-500">{cnaFile ? cnaFile.name : "Attach CNA Registry (XLSX/CSV)"}</span>
                                        </label>
                                    </div>
                                )}

                                {activeTab === 'paste' && (
                                    <textarea value={pastedData} onChange={(e) => setPastedData(e.target.value)} className="w-full h-32 p-4 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:bg-white transition-all outline-none" placeholder="Paste registry rows here..." />
                                )}

                                {activeTab === 'google' && (
                                    <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                                        <input 
                                            type="text"
                                            value={googleSheetInput}
                                            onChange={(e) => setGoogleSheetInput(e.target.value)}
                                            placeholder="Google Sheet URL..."
                                            className="w-full p-3.5 border border-emerald-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">3. Establishment Register</h3>
                                    <div className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between shadow-sm hover:border-blue-200 transition-all">
                                        <span className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{establishmentFile ? establishmentFile.name : "Attach Register"}</span>
                                        <input type="file" accept=".xlsx,.csv" onChange={(e) => handleFileChange(e, setEstablishmentFile)} className="hidden" id="est-file-upload" />
                                        <label htmlFor="est-file-upload" className="cursor-pointer px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-[#1A365D] hover:bg-blue-600 hover:text-white transition-all">Select</label>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">4. Strategic Plan Scan</h3>
                                    <div className={`border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm transition-all ${corporatePlanSummary ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}>
                                        <div className="flex items-center gap-3">
                                            {isProcessingPdf ? <SpinnerIcon className="w-5 h-5 text-amber-600 animate-spin" /> : corporatePlanSummary ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> : <div className="w-5 h-5 border-2 border-slate-200 rounded-full"></div>}
                                            <span className="text-xs font-bold text-slate-500 truncate max-w-[150px]">{corporatePlanFile ? corporatePlanFile.name : "Attach PDF Plan"}</span>
                                        </div>
                                        <input type="file" accept=".pdf" onChange={handleCorporatePlanChange} className="hidden" id="cp-file-upload" disabled={isProcessingPdf} />
                                        <label htmlFor="cp-file-upload" className={`cursor-pointer px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-[#1A365D] ${isProcessingPdf ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-600 hover:text-white transition-all'}`}>Scan</label>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in py-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Data Harmonized</h4>
                            <p className="text-sm text-slate-500 max-w-md">Verified {importedCnaResult?.data.length} records. Metadata ready for generation.</p>
                        </div>
                    )}
                </main>
                
                <footer className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50 rounded-b-[32px]">
                    <button onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                    {step === 'upload' ? (
                        <button 
                            onClick={handleProceedToMapping} 
                            disabled={isProcessing || isProcessingPdf || (!cnaFile && !pastedData && !googleSheetInput)}
                            className="flex items-center gap-3 px-10 py-3 bg-[#1A365D] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all disabled:bg-slate-200"
                        >
                            {isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <><ArrowRightIcon className="w-5 h-5" /><span>Analyze Schema</span></>}
                        </button>
                    ) : (
                        <button onClick={handleCompleteImport} className="flex items-center gap-3 px-12 py-3 bg-[#2AAA52] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] transition-all">
                            <CheckCircleIcon className="w-5 h-5" /><span>Finish Ingestion</span>
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};
