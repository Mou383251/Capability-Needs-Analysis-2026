import React, { useState } from 'react';

interface ReportContextInputsProps {
    organizationalContext: string;
    onSetOrganizationalContext: (context: string) => void;
    strategicDocumentContext: string;
    onSetStrategicDocumentContext: (context: string) => void;
    assessmentProcessContext: string;
    onSetAssessmentProcessContext: (context: string) => void;
    capacityAnalysisContext: string;
    onSetCapacityAnalysisContext: (context: string) => void;
    cnaCommunicationContext: string;
    onSetCnaCommunicationContext: (context: string) => void;
}

type ContextTab = 'org' | 'strategic' | 'assessment' | 'capacity' | 'comm';

const TABS: { id: ContextTab, label: string }[] = [
    { id: 'org', label: 'Organizational' },
    { id: 'strategic', label: 'Strategic Docs' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'comm', label: 'Communication' },
];

export const ReportContextInputs: React.FC<ReportContextInputsProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ContextTab>('org');

    const renderTextarea = () => {
        switch (activeTab) {
            case 'org':
                return {
                    value: props.organizationalContext,
                    onChange: props.onSetOrganizationalContext,
                    placeholder: "Describe the current and future capacity of your organization, sourcing information from the organizational establishment data. Detail current staff strengths, weaknesses, and overall capacity.",
                    description: "This information will be used in the 'Organizational Context' section of the consolidated report. Source information from the organizational establishment data to describe current staff, strengths, and overall capacity."
                };
            case 'strategic':
                 return {
                    value: props.strategicDocumentContext,
                    onChange: props.onSetStrategicDocumentContext,
                    placeholder: "Describe the strategic and HR documents used...",
                    description: "Used in the Methodology section and supports the evidence base for the capacity analysis."
                };
            case 'assessment':
                 return {
                    value: props.assessmentProcessContext,
                    onChange: props.onSetAssessmentProcessContext,
                    placeholder: "Summarize the assessment process conducted...",
                    description: "Used in the Assessment Participation Summary and supports interpretation of response reliability."
                };
            case 'capacity':
                 return {
                    value: props.capacityAnalysisContext,
                    onChange: props.onSetCapacityAnalysisContext,
                    placeholder: "Confirm if individual, team, division, and organizational capacity ratings are finalized...",
                    description: "Drives the Visual Analysis Section and Gap Matrix Table in the Consolidated Strategic Plan Report."
                };
            case 'comm':
                 return {
                    value: props.cnaCommunicationContext,
                    onChange: props.onSetCnaCommunicationContext,
                    placeholder: "Describe how the CNA process was communicated...",
                    description: "This information will be summarised under Stakeholder Engagement & Communication Efforts."
                };
            default:
                return { value: '', onChange: () => {}, placeholder: '', description: '' };
        }
    };

    const currentTextarea = renderTextarea();

    return (
        <div className="bg-white text-slate-800 p-8 rounded-[16px] shadow-sm border border-slate-100 flex flex-col h-full">
            <h3 className="text-lg font-black text-[#1A1A40] uppercase tracking-widest mb-6 border-b pb-4">Report Context Settings</h3>
            <div className="mb-6">
                <nav className="flex space-x-2 overflow-x-auto pb-2" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                                activeTab === tab.id
                                ? 'bg-[#1A1A40] text-white shadow-lg'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-grow flex flex-col">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{currentTextarea.description}</p>
                <textarea
                    className="w-full flex-grow p-4 text-sm border border-slate-200 bg-slate-50 text-slate-800 rounded-xl shadow-inner focus:ring-2 focus:ring-[#1A1A40] focus:bg-white transition-all min-h-[260px] placeholder:text-slate-300 outline-none"
                    placeholder={currentTextarea.placeholder}
                    value={currentTextarea.value}
                    onChange={(e) => currentTextarea.onChange(e.target.value)}
                />
            </div>
        </div>
    );
};