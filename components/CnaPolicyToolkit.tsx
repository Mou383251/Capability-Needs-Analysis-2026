import React, { useState } from 'react';
import { CnaOverview } from './cna/CnaOverview';
import { CnaProcessGuide } from './cna/CnaProcessGuide';
import { CnaQuestionnaire } from './cna/CnaQuestionnaire';
import { CnaAnalysisGuide } from './cna/CnaAnalysisGuide';
import { CnaLndPlanning } from './cna/CnaLndPlanning';
import { CnaResources } from './cna/CnaResources';

type CnaTab = 'overview' | 'process' | 'questionnaire' | 'analysis' | 'planning' | 'resources';

const TABS: { id: CnaTab; label: string }[] = [
    { id: 'overview', label: 'CNA Overview' },
    { id: 'process', label: 'Process Guide' },
    { id: 'questionnaire', label: 'Questionnaire' },
    { id: 'analysis', label: 'Analysis Guide' },
    { id: 'planning', label: 'L&D Planning' },
    { id: 'resources', label: 'Resources' },
];

export const CnaPolicyToolkit: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CnaTab>('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <CnaOverview />;
            case 'process': return <CnaProcessGuide />;
            case 'questionnaire': return <CnaQuestionnaire />;
            case 'analysis': return <CnaAnalysisGuide />;
            case 'planning': return <CnaLndPlanning />;
            case 'resources': return <CnaResources />;
            default: return null;
        }
    };

    return (
        <div className="bg-[#F8FAFC] flex-1 flex flex-col h-full overflow-hidden font-['Inter',_sans-serif]">
            {/* Header - Sticky */}
            <header className="bg-white border-b border-slate-200 flex-shrink-0 z-20">
                <div className="max-w-[1200px] mx-auto py-6 px-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Capability Needs Analysis (CNA) Toolkit
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
                        A guide to conducting effective CNAs and translating data into strategic L&D plans
                    </p>
                </div>
                
                {/* Sub-Navigation Bar */}
                <div className="border-t border-slate-100">
                    <div className="max-w-[1200px] mx-auto px-8">
                        <nav className="flex space-x-10 overflow-x-auto no-scrollbar" aria-label="Tabs">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-[3px] font-bold text-[13px] uppercase tracking-[0.05em] transition-all duration-300 ${
                                        activeTab === tab.id
                                        ? 'border-[#2AAA52] text-slate-900'
                                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'
                                    }`}
                                    aria-current={activeTab === tab.id ? 'page' : undefined}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </header>
            
            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
                <div className="max-w-[1200px] mx-auto p-10 animate-fade-in">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};
