import React, { useState } from 'react';
import { ChevronDownIcon } from '../icons';

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => (
    <div className={`border-b border-slate-100 last:border-b-0 transition-all ${isOpen ? 'bg-emerald-50/20' : ''}`}>
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition-colors"
            aria-expanded={isOpen}
        >
            <span className={`text-sm font-black uppercase tracking-tight transition-colors ${isOpen ? 'text-[#059669]' : 'text-slate-900'}`}>{title}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isOpen ? 'bg-[#059669] text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                <ChevronDownIcon className="w-5 h-5" />
            </div>
        </button>
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
                <div className="px-6 pb-8 text-sm text-slate-600 leading-relaxed font-medium">
                    <div className="prose prose-slate prose-sm max-w-none">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const policyContent: Record<string, React.ReactNode> = {
    'Executive Summary': <p>The GESI Policy provides a comprehensive framework for mainstreaming gender equity and social inclusion across the PNG public service to improve performance, service delivery, and national development outcomes.</p>,
    'Definitions & Acronyms': (
        <ul className="space-y-2 list-none p-0">
            <li className="flex gap-2"><strong>GESI:</strong> Gender Equity and Social Inclusion.</li>
            <li className="flex gap-2"><strong>Mainstreaming:</strong> Integrating GESI perspectives into all policies, programs, and organizational practices.</li>
            <li className="flex gap-2"><strong>Discrimination:</strong> Any distinction, exclusion or restriction made on the basis of sex, disability, or other status.</li>
        </ul>
    ),
    'Importance and Benefits of GESI': <p>A diverse and inclusive public service is more innovative, effective, and better equipped to serve all citizens. It enhances staff morale, reduces corruption, and strengthens good governance.</p>,
    'Internal Mainstreaming Strategies': <p>Focuses on creating an equitable workplace through fair recruitment, promotion, performance management, flexible work arrangements, and zero tolerance for harassment and discrimination.</p>,
    'External Mainstreaming Strategies': <p>Ensures that all government policies, projects, and services are designed and delivered in a way that benefits men, women, persons with disabilities, and all social groups equitably.</p>,
    'GESI Roles & Responsibilities': <p>Outlines the specific duties of Departmental Heads, HR Managers, GESI Focal Points, and all public servants in implementing and monitoring the GESI Policy.</p>,
    'Leadership & Values': <p>Links GESI implementation to the PNG Public Service Leadership Capability Framework, emphasizing values like integrity, respect, and accountability.</p>,
    'Action Plan': <p>Details the specific, measurable, achievable, relevant, and time-bound (SMART) actions that agencies must undertake to institutionalize GESI.</p>,
};

export const GesiPolicyNavigator: React.FC = () => {
    const [openItem, setOpenItem] = useState<string | null>('Executive Summary');

    const handleToggle = (title: string) => {
        setOpenItem(openItem === title ? null : title);
    };

    return (
        <div className="max-w-[900px] mx-auto bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
            {Object.entries(policyContent).map(([title, content]) => (
                <AccordionItem 
                    key={title} 
                    title={title}
                    isOpen={openItem === title}
                    onToggle={() => handleToggle(title)}
                >
                    {content}
                </AccordionItem>
            ))}
        </div>
    );
};
