import React, { useState } from 'react';
import type { JSX } from 'react'; 
import { SpinnerIcon } from './icons';
import { verifyCredentials } from '../utils/auth';

/**
 * PNG National Crest Component
 * Displays the PNG Crest image within a high-end executive ring.
 */
const PNGNationalCrest = () => (
    <div className="flex justify-center mb-8">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-slate-50 p-2 overflow-hidden ring-8 ring-white/50 relative group">
            {/* Background design */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white"></div>
            
            {/* Real PNG Crest Image Replacement - Path updated to /Logo/PNG Crest.png */}
            <img 
                src="/Logo/PNG Crest.png" 
                alt="National Crest of Papua New Guinea" 
                className="w-full h-full object-contain relative z-10 p-1"
            />
        </div>
    </div>
);

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const isValid = await verifyCredentials(username, password);
            if (isValid) {
                onLoginSuccess();
            } else {
                setError('Authentication failed. Please verify your Operator ID and Access Key.');
            }
        } catch (err) {
            setError('System connection error. Please contact DPM IT support.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F4F7F9] font-sans p-6 relative overflow-hidden">
            
            {/* 1. NATIONAL CREST WATERMARK - Path updated to /Logo/PNG Crest.png */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                    src="/Logo/PNG Crest.png" 
                    alt="National Watermark" 
                    className="w-[80%] max-w-[800px] object-contain opacity-[0.08] grayscale" 
                />
            </div>

            {/* 2. BACKGROUND GRID LAYER */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#1A365D]/5 pointer-events-none z-0">
                <svg width="100%" height="100%" className="opacity-10">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A365D" strokeWidth="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* 3. MAIN CONTENT CARD */}
            <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[32px] p-12 animate-fade-in z-10 border border-white/50">
                <PNGNationalCrest />
                
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-black text-[#1A365D] uppercase tracking-tighter leading-tight">
                        CNAS Central Access
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
                        National Public Service Portal
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl text-center leading-relaxed animate-pulse">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Operator Identity
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="DPM-OP-XXXX"
                      className="w-full py-3.5 px-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A365D] focus:bg-white transition-all shadow-inner font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Encryption Key
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full py-3.5 px-5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A365D] focus:bg-white transition-all shadow-inner font-semibold"
                    />
                  </div>
                    
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-[#1A365D] hover:bg-[#25255a] text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl transition-all transform active:scale-[0.98] shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none mt-4"
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon className="w-5 h-5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : "Verify Security Clearance"}
                  </button>
                </form>
            </div>

            {/* GLOBAL INSTITUTIONAL FOOTER */}
            <div className="absolute bottom-10 left-0 right-0 text-center space-y-2 px-6 z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Department of Personnel Management
                </p>
                <p className="text-[8px] font-bold text-slate-400 opacity-60 uppercase tracking-widest">
                    &copy; 2026 National Public Service of Papua New Guinea • Secure Protocol V2
                </p>
            </div>
        </div>
    );
};