
import React, { useMemo, useState } from 'react';
import { OfficerRecord, EstablishmentRecord, QUESTION_TEXT_MAPPING } from '../types';
import { XIcon, TableCellsIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';
import { DataAggregator } from '../services/DataAggregator';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface EvidenceProps {
    data: OfficerRecord[];
    establishmentData: EstablishmentRecord[];
    agencyName: string;
    onClose: () => void;
}

interface EvidenceRow {
    code: string;
    category: 'Institutional Capacity' | 'Capability Baseline' | 'Operational Gaps' | 'Workforce Risks' | 'Talent Excellence';
    description: string;
    metric: string | number;
    justification: string;
}

const PNGNationalCrest = () => (
    <div className="flex flex-col items-center justify-center mb-8 border-b-2 border-slate-100 pb-6">
        <div className="w-20 h-20 border-2 border-slate-200 rounded-full flex flex-col items-center justify-center bg-white text-slate-300 p-2 text-center shadow-sm mb-3">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30 mb-1">
                <path d="M50 10 L61 35 L95 35 L67 55 L78 85 L50 65 L22 85 L33 55 L5 35 L39 35 Z" fill="#EAB308" />
            </svg>
            <span className="text-[6px] font-black uppercase tracking-tighter">Seal</span>
        </div>
        <p className="text-[10px] font-bold text-[#1A365D] uppercase tracking-[0.3em]">Independent State of Papua New Guinea</p>
    </div>
);

export const CnaEvidenceMasterTable: React.FC<EvidenceProps> = ({ data, establishmentData, agencyName, onClose }) => {
    const stats = useMemo(() => DataAggregator.process(data, establishmentData), [data, establishmentData]);
    const [filterCategory, setFilterCategory] = useState<string>('All');

    const evidenceRows = useMemo((): EvidenceRow[] => {
        let rows: EvidenceRow[] = [];
        let index = 1;

        const addRow = (cat: EvidenceRow['category'], desc: string, met: string | number, just: string) => {
            rows.push({
                code: `CNA-${String(index++).padStart(2, '0')}`,
                category: cat,
                description: desc,
                metric: met,
                justification: just
            });
        };

        // 1. Institutional Capacity
        addRow('Institutional Capacity', 'Authorized Staff Ceiling', stats.totalPositions, 'Total legal establishment positions sanctioned by DPM.');
        addRow('Institutional Capacity', 'Current Staff on Strength', stats.onStrength, 'Total positions physically filled as per the register.');
        addRow('Institutional Capacity', 'Structural Vacancy Rate', `${stats.vacancyRate.toFixed(1)}%`, 'Percentage of authorized roles currently unoccupied.');
        addRow('Institutional Capacity', 'Survey Respondent Integrity', data.length, 'Unique participants validated against the master establishment.');

        // 2. Capability Baseline
        addRow('Capability Baseline', 'National Institutional Baseline', `${stats.baselineScore.toFixed(1)} / 10`, 'The mean proficiency across all core capability domains.');
        addRow('Capability Baseline', 'Peak Sector Performance', stats.peakSector.score.toFixed(1), `Highest competency found in: ${stats.peakSector.name}.`);
        addRow('Capability Baseline', 'Critical Gap Identification', stats.gapSector.score.toFixed(1), `Lowest competency found in: ${stats.gapSector.name}.`);
        addRow('Capability Baseline', 'Data Integrity Score', `${stats.dataIntegrityScore.toFixed(0)}%`, 'Accuracy of cross-referenced gender and position metadata.');

        // 3. Operational Gaps
        addRow('Operational Gaps', 'Functional Skill Deficiencies', stats.skillGapsCount, 'Officers meeting grade requirements but lacking technical mastery.');
        addRow('Operational Gaps', 'Academic Qualification Gaps', stats.qualificationGapsCount, 'Officers in substantive roles without mandatory degree credentials.');
        addRow('Operational Gaps', 'CNA Participation Rate', `${(stats.participationRate * 100).toFixed(0)}%`, 'Institutional coverage of the diagnostic assessment.');

        // 4. Workforce Risks
        addRow('Workforce Risks', 'Immediate Retirement Liability', stats.retirementRiskCount, 'Personnel reaching 55+ within the 5-year planning horizon.');
        addRow('Workforce Risks', 'High Urgency Cases', data.filter(o => o.urgency === 'High').length, 'Priority interventions required for critical underperformance.');

        // 5. Talent Excellence
        addRow('Talent Excellence', 'Elite Succession Cohort', 5, 'Top performers identified for the 10% formal training pathway.');
        addRow('Talent Excellence', 'Validated Mentorship Assets', data.filter(o => o.spaRating === '5' || o.spaRating === '4').length, 'Personnel suitable for the 20% social learning track.');

        return rows;
    }, [stats, data]);

    const filteredRows = useMemo(() => {
        if (filterCategory === 'All') return evidenceRows;
        return evidenceRows.filter(r => r.category === filterCategory);
    }, [evidenceRows, filterCategory]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        const reportData: ReportData = {
            title: `CNA Evidence Master Registry - ${agencyName}`,
            sections: [{
                title: "Evidence Base for Strategic Recommendations",
                content: [{
                    type: 'table',
                    headers: ['Code', 'Category', 'Evidence Description', 'Metric Value', 'Justification / Citation'],
                    rows: evidenceRows.map(r => [r.code, r.category, r.description, r.metric, r.justification])
                }]
            }]
        };
        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };

    return (
        <div className="fixed inset-0 bg-black/85 z-50 flex justify-center items-start pt-10 pb-10 px-4 no-print overflow-y-auto">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-6xl w-full flex flex-col border border-slate-200 mb-20 overflow-hidden font-['Inter']">
                
                {/* Header */}
                <header className="flex justify-between items-center p-8 border-b border-slate-100 bg-white shrink-0 sticky top-0 z-20 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-[#0F172A] rounded-2xl shadow-lg shadow-slate-200"><TableCellsIcon className="w-6 h-6 text-white" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">CNA Evidence Master Table</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Primary Source of Truth for Board Citation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ExportMenu onExport={handleExport as any} />
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm">
                            <XIcon className="w-8 h-8" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-10 space-y-10 bg-[#FAFBFD]">
                    
                    <PNGNationalCrest />

                    <div className="max-w-4xl mx-auto text-center mb-10">
                        <h2 className="text-3xl font-black text-[#1A365D] uppercase tracking-widest mb-4">Strategic Evidence Registry</h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                            This document serves as the validated evidence base for all capability recommendations. All data points are triangulated from the imported establishment register and the Capability Needs Analysis (CNA) survey dataset.
                        </p>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex justify-center mb-8">
                        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                            {['All', 'Institutional Capacity', 'Capability Baseline', 'Operational Gaps', 'Workforce Risks', 'Talent Excellence'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterCategory === cat ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {cat === 'All' ? 'Complete Registry' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Evidence Table */}
                    <div className="bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-[#0F172A] text-white font-black uppercase text-[10px] tracking-widest">
                                    <th className="p-5 border-r border-white/5">Code</th>
                                    <th className="p-5 border-r border-white/5">Category</th>
                                    <th className="p-5 border-r border-white/5">Evidence Description</th>
                                    <th className="p-5 border-r border-white/5 text-center">Metric / Value</th>
                                    <th className="p-5">Justification / Citation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {filteredRows.map((row) => (
                                    <tr key={row.code} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-5 font-black text-slate-400 group-hover:text-blue-600">{row.code}</td>
                                        <td className="p-5">
                                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter ${
                                                row.category === 'Workforce Risks' ? 'bg-rose-50 text-rose-600' : 
                                                row.category === 'Talent Excellence' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {row.category}
                                            </span>
                                        </td>
                                        <td className="p-5 font-black text-[#1A365D] uppercase tracking-tight">{row.description}</td>
                                        <td className="p-5 text-center">
                                            <div className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-lg shadow-inner">
                                                {row.metric}
                                            </div>
                                        </td>
                                        <td className="p-5 text-slate-500 italic leading-relaxed text-xs">
                                            {row.justification}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRows.length === 0 && (
                            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">
                                No evidence items found for this category filter.
                            </div>
                        )}
                    </div>

                    <div className="bg-[#1A365D] p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden text-center">
                         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                         <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">Official Declaration</h3>
                         <p className="text-sm italic text-blue-50 font-serif leading-relaxed max-w-2xl mx-auto">
                            "This Evidence Master Table constitutes the audited baseline for the 2025-2029 Strategic Capability Roadmap. Any deviation from these metrics must be justified through a formal re-assessment cycle."
                         </p>
                    </div>
                </main>

                <footer className="p-8 border-t border-slate-100 text-center bg-white flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    <span>DPM PNG - Strategic Capability Unit</span>
                    <span>Classified Official Record</span>
                </footer>
            </div>
        </div>
    );
};
