import React, { useState } from 'react';
import { OfficerRecord } from '../types';
import { StaffCard } from './StaffCard';
import { ChevronDownIcon } from './icons';

interface DivisionGroupProps {
  divisionName: string;
  officers: OfficerRecord[];
  onViewSummary: (officer: OfficerRecord) => void;
  onSuggestTraining: (officer: OfficerRecord) => void;
  loadingSuggestionsFor: string | null;
}

export const DivisionGroup: React.FC<DivisionGroupProps> = ({ divisionName, officers, onViewSummary, onSuggestTraining, loadingSuggestionsFor }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => setIsOpen(!isOpen);

  const highUrgencyCount = officers.filter(o => o.urgency === 'High').length;

  return (
    <div className="bg-transparent mb-12 overflow-hidden rounded-[20px] shadow-sm border border-slate-100">
      <button
        onClick={toggleOpen}
        className="w-full flex justify-between items-center p-8 bg-[#1A1A40] text-left hover:bg-[#25255a] transition-all duration-300 rounded-t-[20px] shadow-lg group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-8">
            <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-blue-400 transition-colors">{divisionName}</h2>
                <div className="flex items-center gap-4 mt-3">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">
                        {officers.length} Officer{officers.length !== 1 && 's'} Enrolled
                    </span>
                    {highUrgencyCount > 0 && (
                         <span className="px-3 py-1 text-[10px] font-black uppercase text-white bg-rose-600 rounded-full tracking-[0.2em] shadow-lg shadow-rose-900/30 animate-pulse">
                            {highUrgencyCount} Priority Cases
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
            <ChevronDownIcon
            className={`w-7 h-7 text-white/40 transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
            />
        </div>
      </button>
      <div
        className={`transition-all duration-700 ease-in-out bg-[#F8FAFC] border-x border-b border-slate-200/50 rounded-b-[20px] ${isOpen ? 'max-h-[30000px] opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ transitionProperty: 'max-height, opacity' }}
      >
        <div className="p-10 space-y-10">
          {officers.map(officer => (
            <StaffCard 
              key={officer.email} 
              officer={officer} 
              onViewSummary={onViewSummary}
              onSuggestTraining={onSuggestTraining}
              isLoadingSuggestions={loadingSuggestionsFor === officer.email}
            />
          ))}
        </div>
      </div>
    </div>
  );
};