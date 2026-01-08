import React from 'react';
import { XIcon, BookOpenIcon, PresentationChartLineIcon } from './icons';

interface WelcomeModalProps {
    onClose: () => void;
    onViewPolicy: () => void;
}

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center justify-center mb-4">
        {/* Adjusted size from w-36 to w-28 for better vertical fit */}
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-50 p-2 overflow-hidden ring-4 ring-slate-100/30 relative group">
            <img 
                src="/Logo/PNG Crest.png" 
                alt="PNG National Crest" 
                className="w-[85%] h-[85%] object-contain drop-shadow-lg transition-transform duration-700 group-hover:scale-110"
            />
        </div>
        <div className="mt-4 text-center">
            <p className="text-[9px] font-black text-[#1A365D] uppercase tracking-[0.4em] leading-tight opacity-80">Independent State of</p>
            <p className="text-[14px] font-black text-[#1A365D] uppercase tracking-[0.2em] mt-1 font-serif">Papua New Guinea</p>
        </div>
    </div>
);

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onViewPolicy }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-['Inter',_sans-serif]">
            {/* Glassy Backdrop Overlay */}
            <div 
                className="absolute inset-0 bg-[#1A1A40]/60 backdrop-blur-[12px] transition-all duration-500 animate-fade-in" 
                onClick={onClose}
            ></div>
            
            {/* Modal Container: Added max-h-[90vh] and overflow-y-auto to ensure it fits the screen */}
            <div className="relative w-full max-w-[500px] max-h-[90vh] bg-white/95 border border-white/20 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[32px] overflow-y-auto flex flex-col animate-fade-in backdrop-blur-md custom-scrollbar">
                
                <div className="p-8 md:p-10 flex flex-col items-center text-center">
                    <PNGNationalCrest />

                    <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter mb-1 mt-2">
                        Strategic Diagnostic Portal
                    </h1>
                    <p className="text-[10px] font-black text-[#2AAA52] uppercase tracking-[0.3em] mb-6 border-b-2 border-emerald-500/20 pb-2">
                        CNA Intelligence Hub
                    </p>

                    <div className="space-y-4">
                        <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                            The <strong>National Capability Needs Analysis (CNA)</strong> system is active. Your access level allows for deep scanning, automated L&D plan generation, and board-level reporting.
                        </p>

                        <div className="py-4 px-6 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner">
                            <p className="text-[13px] text-slate-500 leading-relaxed italic font-serif">
                                "Empowering the public service through data-driven human capital realignment and strategic workforce planning."
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 w-full flex flex-col gap-3">
                        <button 
                            onClick={onClose}
                            className="w-full px-8 py-3.5 bg-[#1A365D] hover:bg-[#2AAA52] text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 group"
                        >
                            <PresentationChartLineIcon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                            ENTER OPERATIONAL DESK
                        </button>
                        
                        <button 
                            onClick={onViewPolicy}
                            className="w-full px-6 py-2 bg-transparent text-slate-400 hover:text-[#1A365D] rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <BookOpenIcon className="w-4 h-4" />
                            Review Compliance Framework
                        </button>
                    </div>
                </div>

                {/* Secure Footer Branding - More compact */}
                <div className="bg-slate-100/50 p-4 border-t border-slate-200/60 flex justify-center items-center shrink-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Official National Asset • DPM PNG
                    </p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
            `}} />
        </div>
    );
};