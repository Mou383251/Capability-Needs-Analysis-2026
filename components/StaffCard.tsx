
import React from 'react';
import { OfficerRecord } from '../types';
import { UserCircleIcon, ExclamationTriangleIcon, SparklesIcon, SpinnerIcon, CalendarDaysIcon, AcademicCapIcon } from './icons';
import { UrgencyBadge, SPARatingBadge, GradingGroupBadge } from './Badges';

interface StaffCardProps {
  officer: OfficerRecord;
  onViewSummary: (officer: OfficerRecord) => void;
  onSuggestTraining: (officer: OfficerRecord) => void;
  isLoadingSuggestions: boolean;
}

export const StaffCard: React.FC<StaffCardProps> = ({ officer, onViewSummary, onSuggestTraining, isLoadingSuggestions }) => {
  const allRatings = officer.capabilityRatings;
  const avgCapabilityScore = allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r.currentScore, 0) / allRatings.length
    : 0;

  const scoreCurrent = avgCapabilityScore;
  const scoreGap = 10 - scoreCurrent;

  const isRetiringSoon = officer.age && officer.age >= 55;

  return (
    <div className="bg-[#FFFFFF] rounded-[20px] shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-10 flex flex-col transition-all hover:shadow-xl hover:translate-y-[-2px] relative overflow-hidden group">
        {isRetiringSoon && (
            <div className="absolute top-4 right-4 animate-pulse">
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-rose-200">Retirement Prep Stage</span>
            </div>
        )}
        
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-50">
                <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                        <UserCircleIcon className="w-10 h-10 text-slate-300 group-hover:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#1A1A40] uppercase tracking-tight">{officer.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{officer.position} — {officer.grade}</p>
                        <p className="text-[10px] font-black text-[#1A365D] uppercase mt-2">Lifecycle: <span className="text-blue-500">{officer.lifecycleStage || 'Assessment Track'}</span></p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="flex gap-2">
                        <GradingGroupBadge group={officer.gradingGroup} />
                        <UrgencyBadge level={officer.urgency} />
                    </div>
                    <SPARatingBadge rating={officer.spaRating} level={officer.performanceRatingLevel} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h4 className="text-[11px] font-black uppercase text-[#1A365D] tracking-[0.15em] mb-4 flex items-center gap-2">
                        <AcademicCapIcon className="w-4 h-4 text-blue-500" />
                        Career Development Focus
                    </h4>
                    <div className="space-y-4">
                        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-100">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Qualifications Check</p>
                             <p className="text-xs font-bold text-slate-700">{officer.jobQualification || 'Credentials Review Needed'}</p>
                        </div>
                        <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-100">
                             <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Skill Gap Intensity</p>
                             <p className="text-xs font-bold text-rose-600">{officer.technicalCapabilityGaps.length > 0 ? officer.technicalCapabilityGaps.join(', ') : 'Optimal Proficiency'}</p>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-[11px] font-black uppercase text-[#1A365D] tracking-[0.15em] mb-4">Intervention Pathway</h4>
                    <div className="space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            Based on the <strong>Workforce Lifecycle Model</strong>, this officer is currently on the <strong>{officer.lifecycleStage || 'Growth'} Pathway</strong>. Proposed interventions focus on {isRetiringSoon ? 'Knowledge Transfer' : 'Credential Upgrading'} to align with the National Establishment Register.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      
        <div className="mt-10 pt-8 border-t border-slate-50 flex flex-wrap gap-8 justify-between items-center">
            <div className="flex-grow max-w-sm">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Capability Integrity Score</h4>
                    <span className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest">
                        {scoreCurrent.toFixed(1)} / 10.0
                    </span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden border border-slate-100 p-0.5">
                    <div className="bg-[#1A365D] h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${scoreCurrent * 10}%` }}></div>
                </div>
            </div>
            <div className="flex gap-3">
                 <button 
                    onClick={() => onViewSummary(officer)} 
                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#1A365D] bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                    Lifecycle Plan
                </button>
                 <button 
                    onClick={() => onSuggestTraining(officer)} 
                    disabled={isLoadingSuggestions}
                    className="px-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#2AAA52] rounded-xl hover:bg-[#238C44] transition-all flex items-center gap-2 disabled:bg-slate-200 shadow-lg shadow-green-900/10"
                >
                    {isLoadingSuggestions ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                    <span>Progress Action</span>
                </button>
            </div>
        </div>
    </div>
  );
};
