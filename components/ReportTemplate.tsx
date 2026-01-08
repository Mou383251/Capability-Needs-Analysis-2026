import React, { useMemo } from 'react';
import { XIcon, PrinterIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportOfficialReport } from '../utils/pdfExport';

interface ReportTemplateProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    onExport: (format: any) => void;
    loading?: boolean;
    children: React.ReactNode;
    orientation?: 'portrait' | 'landscape';
    agencyName?: string;
}

const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};

const getProfessionalDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('en-GB', { month: 'long' });
    const year = now.getFullYear();
    const suffix = getOrdinalSuffix(day);
    return `${day}${suffix} of ${month}, ${year}`;
};

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center justify-center pt-10">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="#EAB308" />
                <circle cx="50" cy="50" r="48" stroke="#1A365D" strokeWidth="0.5" strokeOpacity="0.2" />
            </svg>
        </div>
        <h3 className="font-serif text-[#1A365D] uppercase tracking-[0.6em] text-[7.5pt] leading-tight mb-0.5">
            INDEPENDENT STATE OF PAPUA NEW GUINEA
        </h3>
        <h4 className="font-black text-[#1A365D] uppercase tracking-[0.2em] text-[8.5pt]">
            DEPARTMENT OF PERSONNEL MANAGEMENT
        </h4>
    </div>
);

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ 
    title, 
    subtitle, 
    onClose, 
    onExport, 
    loading, 
    children,
    orientation = 'landscape',
    agencyName = 'The Agency'
}) => {
    const isLandscape = orientation === 'landscape';
    const reportId = useMemo(() => `a4-fragment-${Math.random().toString(36).substr(2, 9)}`, []);
    const auditId = useMemo(() => `CNA-REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}-2026`, []);
    const professionalDate = useMemo(() => getProfessionalDate(), []);
    
    const handleInternalExport = async (format: string) => {
        if (format === 'pdf' || format === 'print') {
            await exportOfficialReport(reportId, title);
        } else {
            onExport(format);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/98 z-50 flex flex-col items-center overflow-auto no-print animate-fade-in" aria-modal="true" role="dialog">
            {/* UI Controls */}
            <header className="w-full flex justify-between items-center p-4 bg-slate-800 border-b border-white/5 shrink-0 sticky top-0 z-[100] shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#1A365D] text-white rounded-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-white text-sm font-black uppercase tracking-widest">{title}</h1>
                        <p className="text-[#2AAA52] text-[9px] font-bold uppercase tracking-[0.2em]">Universal A4 Standard: Border-Free Frame</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleInternalExport('pdf')} 
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <PrinterIcon className="w-4 h-4" /> Download Printable PDF
                    </button>
                    <ExportMenu onExport={handleInternalExport} />
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-rose-600 rounded-lg transition-all">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full flex items-center justify-center p-12 bg-slate-900 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="mt-6 font-black text-emerald-500 uppercase tracking-[0.3em] text-xs animate-pulse">Standardizing Frame...</p>
                    </div>
                ) : (
                    <div 
                        id={reportId}
                        className={`high-fidelity-report ${isLandscape ? 'a4-landscape' : 'a4-portrait'} relative bg-white`}
                    >
                        <table className="report-page-table relative z-10">
                            <thead className="report-header-group">
                                <tr>
                                    <td>
                                        <div className="report-container-margins">
                                            {/* NO BORDERS - CLEAN SLATE HEADER */}
                                            <PNGNationalCrest />
                                            <div className="text-center py-8 border-b border-slate-100">
                                                <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-tighter leading-none mb-1 font-serif">
                                                    {title}
                                                </h2>
                                                <h3 className="text-[11pt] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight mt-2">
                                                    {subtitle || `Strategic Alignment with ${agencyName} Corporate Plan`}
                                                </h3>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </thead>

                            <tbody className="report-content-group">
                                <tr>
                                    <td className="report-body-cell">
                                        <div className="report-container-margins py-12 min-h-[120mm]">
                                            {children}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>

                            <tfoot className="report-footer-group">
                                <tr>
                                    <td>
                                        <div className="report-container-margins pt-12 pb-12">
                                            <div className="relative border-t-2 border-slate-100 pt-12">
                                                {/* Repeated Signature */}
                                                <div className="flex justify-between items-end mb-10">
                                                    <div className="text-center w-64">
                                                        <div className="h-10 flex items-center justify-center mb-0">
                                                            <span style={{ fontFamily: "'Brush Script MT', cursive" }} className="text-[28pt] text-[#1A365D] transform -rotate-1 select-none">
                                                                Taies Sansan
                                                            </span>
                                                        </div>
                                                        <div className="border-b-2 border-slate-300 w-full mb-1"></div>
                                                        <p className="text-[8pt] font-black uppercase text-slate-700 leading-none">Ms. Taies Sansan</p>
                                                        <p className="text-[7pt] font-bold text-slate-400 uppercase tracking-tight">Secretary, DPM</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10pt] font-serif italic text-slate-800">
                                                            Issued this {professionalDate}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end mb-1 px-1">
                                                    <p style={{ fontSize: '6.5pt' }} className="font-black text-slate-300 uppercase tracking-widest">
                                                        AUTH ID: {auditId}
                                                    </p>
                                                    <p style={{ fontSize: '6.5pt' }} className="font-black text-slate-300 uppercase tracking-widest">
                                                        VALIDATED CNA INSTRUMENT • 2026
                                                    </p>
                                                </div>

                                                <div className="w-full h-8 bg-[#1A365D] flex items-center justify-center shadow-lg rounded-sm overflow-hidden">
                                                    <span className="text-[7.5pt] font-black text-white uppercase tracking-[0.6em] opacity-90">
                                                        National Personnel Matrix Authentication
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};