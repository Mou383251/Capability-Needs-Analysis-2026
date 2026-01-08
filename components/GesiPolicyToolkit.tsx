import React, { useState } from 'react';
import { GesiAnimatedBanner } from './gesi/GesiAnimatedBanner';
import { GesiOverview } from './gesi/GesiOverview';
import { GesiPolicyNavigator } from './gesi/GesiPolicyNavigator';
import { GesiTrainingToolkit } from './gesi/GesiTrainingToolkit';
import { GesiRolesMap } from './gesi/GesiRolesMap';
import { GesiDashboard } from './gesi/GesiDashboard';
import { GesiLeadership } from './gesi/GesiLeadership';
import { GesiResources } from './gesi/GesiResources';
import { GesiComplianceTool } from './gesi/GesiComplianceTool';

type GesiTab = 
    | 'overview' 
    | 'navigator' 
    | 'training' 
    | 'roles' 
    | 'dashboard' 
    | 'leadership' 
    | 'resources' 
    | 'compliance';

const TABS: { id: GesiTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'navigator', label: 'Policy Navigator' },
    { id: 'training', label: 'Training Toolkit' },
    { id: 'roles', label: 'Roles & Responsibilities' },
    { id: 'dashboard', label: 'GESI Dashboard' },
    { id: 'leadership', label: 'Leadership & Values' },
    { id: 'resources', label: 'Resources' },
    { id: 'compliance', label: 'Compliance Checker' },
];

interface GesiPolicyToolkitProps {
    onShowGesiAnalysis: () => void;
}

export const GesiPolicyToolkit: React.FC<GesiPolicyToolkitProps> = ({ onShowGesiAnalysis }) => {
    const [activeTab, setActiveTab] = useState<GesiTab>('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <GesiOverview />;
            case 'navigator': return <GesiPolicyNavigator />;
            case 'training': return <GesiTrainingToolkit />;
            case 'roles': return <GesiRolesMap />;
            case 'dashboard': return <GesiDashboard onAnalyzeGaps={onShowGesiAnalysis} />;
            case 'leadership': return <GesiLeadership />;
            case 'resources': return <GesiResources />;
            case 'compliance': return <GesiComplianceTool />;
            default: return null;
        }
    };
    
    return (
        <div className="bg-[#F8FAFC] flex-1 flex flex-col h-full overflow-hidden font-['Inter',_sans-serif]">
            {/* Header - Sticky */}
            <header className="bg-white border-b border-slate-200 flex-shrink-0 z-20 shadow-sm sticky top-0">
                <div className="max-w-[1400px] mx-auto py-6 px-8">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        National Public Service GESI Policy Toolkit
                    </h1>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
                        Strategic Alignment for Gender Equity & Social Inclusion
                    </p>
                </div>
                
                {/* Sub-Navigation Bar */}
                <div className="border-t border-slate-100">
                    <div className="max-w-[1400px] mx-auto px-8">
                        <nav className="flex space-x-8 overflow-x-auto no-scrollbar" aria-label="Tabs">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-[3px] font-bold text-[12px] uppercase tracking-[0.05em] transition-all duration-300 ${
                                        activeTab === tab.id
                                        ? 'border-[#059669] text-slate-900' // Emerald-600
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
            
            <GesiAnimatedBanner />

            {/* Main Content Area - Internal styled scrollbar */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
                <div className="max-w-[1200px] mx-auto p-10 animate-fade-in space-y-12">
                    {renderContent()}
                    
                    {/* Property Disclaimer Footer */}
                    <footer className="pt-10 pb-6 text-center border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Property of the Department of Personnel Management (DPM) • Official GESI Resource
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
};
