import React from 'react';
import { DocumentIcon, DocumentArrowUpIcon } from '../icons';

const ResourceItem: React.FC<{ title: string, description: string }> = ({ title, description }) => (
    <div className="group flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <DocumentIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <div>
                <p className="font-black text-slate-900 uppercase text-xs tracking-widest mb-1">{title}</p>
                <p className="text-xs text-slate-500 font-medium">{description}</p>
            </div>
        </div>
        <button
            disabled
            className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 opacity-50 cursor-not-allowed"
        >
            Download
        </button>
    </div>
);

export const CnaResources: React.FC = () => {
    return (
        <div className="max-w-[900px] mx-auto space-y-10">
            <header className="border-b border-slate-100 pb-6 text-center">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">National Resource Library</h2>
                 <p className="text-sm text-slate-500 mt-1 italic">Authorized templates for PNG Public Service CNA execution.</p>
            </header>

            <div className="space-y-4">
                <ResourceItem 
                    title="CNA Survey Master Template"
                    description="Pre-formatted Excel sheet with standard questionnaire codes (xlsx)."
                />
                <ResourceItem 
                    title="Strategic L&D Plan Template"
                    description="Official Word document template for annual planning (docx)."
                />
                <ResourceItem 
                    title="Individual Development Plan (IDP)"
                    description="Personalized growth path template for SPA integration (docx)."
                />
                 <ResourceItem 
                    title="SMART Objective Guide"
                    description="Best practices for formulating measurable L&D goals (pdf)."
                />
            </div>
        </div>
    );
};
