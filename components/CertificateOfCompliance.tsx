import React, { useMemo } from 'react';
import type { JSX } from 'react'; 
import { XIcon, HomeIcon, PrinterIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToDocx, ReportData } from '../utils/export';
import { exportOfficialReport } from '../utils/pdfExport';
import { OfficerRecord } from '../types';

interface ReportProps {
  data: OfficerRecord[];
  agencyName: string;
  onClose: () => void;
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

const GoldSeal: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative shrink-0 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-18 h-18 md:w-20 md:h-20 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="goldFoil" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style={{ stopColor: '#FFF4CC' }} />
                    <stop offset="60%" style={{ stopColor: '#D4AF37' }} />
                    <stop offset="100%" style={{ stopColor: '#996515' }} />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#goldFoil)" stroke="#8B4513" strokeWidth="0.5" />
            <text x="50" y="52" textAnchor="middle" fill="#5C4033" fontSize="7" fontWeight="900" className="uppercase tracking-[0.2em] font-serif">Official</text>
            <text x="50" y="62" textAnchor="middle" fill="#5C4033" fontSize="9" fontWeight="900" className="uppercase tracking-widest font-serif">Seal</text>
        </svg>
    </div>
);

export const CertificateOfCompliance: React.FC<ReportProps> = ({ data, agencyName, onClose }) => {
    
    const issuanceDateString = useMemo(() => {
        const now = new Date();
        const day = now.getDate();
        const month = now.toLocaleString('en-GB', { month: 'long' });
        const year = now.getFullYear();
        const suffix = getOrdinalSuffix(day);
        return `${day}${suffix} ${month} ${year}`;
    }, []);

    const certificateId = useMemo(() => {
        return `CNA-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}-2026`;
    }, []);

    const handleExport = async (format: string) => {
        if (format === 'pdf' || format === 'print') {
            await exportOfficialReport('certificate-a4-frame', 'Certificate_of_Compliance');
        } else if (format === 'docx') {
            const reportData: ReportData = {
                title: `Certificate of Compliance - ${agencyName}`,
                sections: [{
                    title: 'Capability Needs Analysis (CNA) Certification',
                    content: [
                        `INDEPENDENT STATE OF PAPUA NEW GUINEA`,
                        `DEPARTMENT OF PERSONNEL MANAGEMENT`,
                        `Certificate ID: ${certificateId}`,
                        `Recipient Agency: ${agencyName}`,
                        `Issued ${issuanceDateString}`,
                        `Signatory: Ms. Taies Sansan, Secretary DPM`
                    ]
                }]
            };
            exportToDocx(reportData);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center overflow-auto animate-fade-in font-['Inter']" aria-modal="true" role="dialog">
            
            <header className="w-full flex justify-between items-center p-4 bg-slate-800 border-b border-white/5 shrink-0 no-print sticky top-0 z-[60]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 border-r border-slate-600 pr-6">
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-all rounded-lg hover:bg-white/5"><HomeIcon className="w-5 h-5" /></button>
                    </div>
                    <div>
                        <h1 className="text-white text-sm font-black uppercase tracking-widest leading-none">Compliance Terminal</h1>
                        <p className="text-[#2AAA52] text-[10px] font-black uppercase tracking-[0.2em] mt-1">High-Fidelity Instrument</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                        <PrinterIcon className="w-4 h-4" /> Download Printable PDF
                    </button>
                    <ExportMenu onExport={(format) => handleExport(format)} />
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-all">
                        <XIcon className="w-7 h-7" />
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full flex items-center justify-center p-12 bg-slate-900 print:bg-white print:p-0">
                <div id="certificate-a4-frame" className="high-fidelity-report a4-landscape shadow-2xl relative bg-white" 
                     style={{ display: 'flex', flexDirection: 'column' }}>
                    
                    {/* BORDERS */}
                    <div className="absolute inset-[8mm] border-[1px] border-slate-200 pointer-events-none z-10"></div>
                    <div className="absolute inset-[10mm] border-[4px] border-double border-[#1A365D] pointer-events-none z-10"></div>
                    
                    {/* 1. OFFICIAL WATERMARK (80% Size, 55% Opacity) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <img 
                            src="/PNG Crest.png" 
                            alt="" 
                            className="w-[80%] max-w-[700px] object-contain opacity-[0.55] grayscale" 
                        />
                    </div>

                    <div className="flex-1 flex flex-col justify-between items-center m-[15mm] relative z-20 text-center">
                        {/* TOP LOGO SECTION */}
                        <div className="w-full flex flex-col items-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2 shadow-sm border border-slate-100 mb-3">
                                <img 
                                    src="/PNG Crest.png" 
                                    alt="PNG National Crest" 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h3 className="font-serif text-[#1A365D] uppercase tracking-[0.5em] text-[8pt] leading-tight mb-0.5">
                                INDEPENDENT STATE OF PAPUA NEW GUINEA
                            </h3>
                            <h4 className="font-black text-[#1A365D] uppercase tracking-[0.2em] text-[10pt]">
                                DEPARTMENT OF PERSONNEL MANAGEMENT
                            </h4>
                        </div>

                        {/* CONTENT SECTION */}
                        <div className="w-full px-8 flex-1 flex flex-col justify-center">
                            <h1 className="font-serif font-black text-[#1A365D] tracking-tight uppercase border-b-[6px] border-double border-[#1A365D] pb-2 px-12 mb-6 text-[32pt] inline-block mx-auto">
                                CERTIFICATE OF COMPLIANCE
                            </h1>
                            <p className="font-serif italic text-slate-800 text-[14pt] leading-relaxed max-w-4xl mx-auto mb-6 bg-white/60 backdrop-blur-[1px] rounded-lg">
                                This strategic credential is formally presented to the Agency for complying with the Capability Needs Analysis (CNA) requirements.
                            </p>
                            <h2 className="text-[#1A365D] uppercase tracking-tighter leading-tight font-black" 
                                style={{ fontSize: '30pt' }}>
                                {agencyName}
                            </h2>
                        </div>

                        {/* SIGNATURE SECTION */}
                        <div className="w-full flex flex-col items-center mb-4">
                            <div className="h-12 w-80 flex items-center justify-center mb-0">
                                <span style={{ fontFamily: "'Brush Script MT', cursive" }} className="text-[38pt] text-[#1A365D] transform -rotate-1 select-none">
                                    Taies Sansan
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-48 border-t border-slate-400 mb-1"></div>
                                <p className="font-black text-slate-900 uppercase tracking-[0.2em] text-[11pt] mb-0.5">Ms. Taies Sansan</p>
                                <p className="text-[8pt] text-slate-600 font-bold uppercase tracking-widest">Secretary, Department of Personnel Management</p>
                                <p className="text-[10pt] font-serif italic text-slate-800 mt-4 px-10 border-t border-slate-100 pt-2">
                                    Issued {issuanceDateString}
                                </p>
                            </div>
                        </div>

                        {/* FOOTER STRIPE */}
                        <div className="w-full shrink-0">
                            <div className="w-full flex justify-between items-end px-2 mb-1">
                                <p style={{ fontSize: '7pt' }} className="font-black text-slate-500 uppercase tracking-widest">
                                    CERTIFICATE ID: {certificateId}
                                </p>
                                <p style={{ fontSize: '7pt' }} className="font-black text-slate-500 uppercase tracking-widest">
                                    CNA SYSTEM VALIDATED
                                </p>
                            </div>
                            <div className="w-full h-8 bg-[#1A365D] flex items-center justify-center shadow-lg">
                                <span className="text-[7pt] font-black text-white uppercase tracking-[0.5em] opacity-90">
                                    National Personnel Matrix Authentication
                                </span>
                            </div>
                        </div>

                        <div className="absolute top-0 right-0">
                            <GoldSeal className="opacity-100" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};