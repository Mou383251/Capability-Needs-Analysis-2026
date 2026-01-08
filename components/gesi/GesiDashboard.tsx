import React from 'react';
import { ChartComponent } from '../charts';
import { SparklesIcon, CheckCircleIcon } from '../icons';

interface GesiDashboardProps {
    onAnalyzeGaps: () => void;
}

const ChecklistCard: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
    <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 pb-4 border-b border-slate-50">{title}</h3>
        <ul className="space-y-4">
            {items.map((item, index) => (
                <li key={index} className="flex items-start gap-4 group">
                    <div className="mt-0.5">
                        <input id={`check-${title}-${index}`} type="checkbox" className="h-5 w-5 rounded-lg border-slate-200 text-[#059669] focus:ring-[#059669] transition-all cursor-pointer" />
                    </div>
                    <label htmlFor={`check-${title}-${index}`} className="text-sm text-slate-600 leading-tight font-medium cursor-pointer group-hover:text-slate-900 transition-colors">{item}</label>
                </li>
            ))}
        </ul>
    </div>
);

export const GesiDashboard: React.FC<GesiDashboardProps> = ({ onAnalyzeGaps }) => {
    const genderDistData = {
        labels: ['Male', 'Female'],
        datasets: [{
            label: 'Gender Distribution',
            data: [58, 42],
            backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(236, 72, 153, 0.7)'],
            borderColor: ['#3b82f6', '#ec4899'],
            borderWidth: 2,
        }]
    };

    const inclusionStatsData = {
        labels: ['Disability', 'HIV Status', 'Vuln. Youth'],
        datasets: [{
            label: 'Total Count',
            data: [12, 8, 25],
            backgroundColor: 'rgba(5, 150, 105, 0.7)', // Emerald-600
            borderColor: '#059669',
            borderWidth: 1,
        }]
    };

    return (
        <div className="space-y-8">
            {/* AI Analysis Prompt Card */}
            <div className="bg-[#1A365D] p-10 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Institutional GESI Intelligence</h2>
                        <p className="text-blue-100 font-medium leading-relaxed max-w-xl">
                            Run the AI-powered GESI Diagnostic to identify inclusion gaps, leadership equity imbalances, and strategic risks within your current workforce dataset.
                        </p>
                    </div>
                    <button
                        onClick={onAnalyzeGaps}
                        className="px-10 py-4 bg-[#059669] hover:bg-[#047857] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform hover:scale-105 flex items-center gap-3"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Run Diagnostic
                    </button>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Workforce Gender Distribution</h3>
                    <div className="h-64"><ChartComponent type="doughnut" data={genderDistData} /></div>
                </div>
                 <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Social Inclusion Metrics (Sample)</h3>
                    <div className="h-64"><ChartComponent type="bar" data={inclusionStatsData} /></div>
                </div>
            </div>

            {/* Checklists Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChecklistCard 
                    title="Phase 1: Compliance Foundations"
                    items={[
                        "GESI Action Plan developed and approved by Senior Management.",
                        "Direct budget allocation secured for GESI mainstreaming activities.",
                        "Agency GESI Focal Point appointed and functional.",
                        "Internal HR Policies reviewed for systemic GESI biases.",
                        "All staff completed the mandatory GESI Induction workshop."
                    ]}
                />
                 <ChecklistCard 
                    title="Phase 2: Reporting & Monitoring"
                    items={[
                        "Sex-disaggregated data collected for all core departmental programs.",
                        "Quarterly GESI performance report submitted to DPM GESI Desk.",
                        "Comprehensive GESI audit included in the Annual Corporate Review.",
                        "Workplace environment disability access audit completed.",
                        "GESI leadership benchmarks publicly communicated to all staff."
                    ]}
                />
            </div>
        </div>
    );
};
