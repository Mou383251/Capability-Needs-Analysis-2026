
import React from 'react';
import { SuccessionCandidate, GapTag } from '../types';

interface SuccessionPlanningTableProps {
    candidates: SuccessionCandidate[];
}

const GapIcon: React.FC<{ type: string }> = ({ type }) => {
    if (type.includes('QUAL')) return (
        <span title="Qualification Gap: Needs Academic Credential" className="w-5 h-5 rounded-md bg-[#1A365D] text-white flex items-center justify-center text-[10px] font-black shrink-0">Q</span>
    );
    if (type.includes('SKILL')) return (
        <span title="Skill Gap: Needs Workshop/Mentoring" className="w-5 h-5 rounded-md bg-[#2AAA52] text-white flex items-center justify-center text-[10px] font-black shrink-0">S</span>
    );
    return null;
};

export const SuccessionPlanningTable: React.FC<SuccessionPlanningTableProps> = ({ candidates }) => {
    return (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-[16px] shadow-sm">
            <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-[#1A365D] text-white">
                    <tr>
                        <th className="p-4 uppercase tracking-widest font-black">Target Role / Position</th>
                        <th className="p-4 uppercase tracking-widest font-black">Identified Successor(s)</th>
                        <th className="p-4 uppercase tracking-widest font-black text-center">Readiness</th>
                        <th className="p-4 uppercase tracking-widest font-black">Development Needs / Actions</th>
                        <th className="p-4 uppercase tracking-widest font-black text-center">Timeline</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {candidates.map((plan, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-bold text-slate-800 dark:text-white">{plan.roleOrPosition}</td>
                            <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{plan.potentialSuccessors.join(', ')}</td>
                            <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    plan.readinessLevel === 'Ready Now' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                                }`}>
                                    {plan.readinessLevel}
                                </span>
                            </td>
                            <td className="p-4 leading-relaxed font-semibold text-slate-600 dark:text-slate-400 whitespace-normal min-w-[200px]">
                                <div className="flex items-start gap-3">
                                    {plan.developmentNeeds.includes('[QUAL') && <GapIcon type="QUAL" />}
                                    {plan.developmentNeeds.includes('[SKILL') && <GapIcon type="SKILL" />}
                                    <span>{plan.developmentNeeds}</span>
                                </div>
                            </td>
                            <td className="p-4 text-center font-black text-[#1A365D] dark:text-blue-400 whitespace-nowrap">{plan.estimatedTimeline}</td>
                        </tr>
                    ))}
                    {candidates.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest italic">
                                No succession candidates identified in current assessment
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
