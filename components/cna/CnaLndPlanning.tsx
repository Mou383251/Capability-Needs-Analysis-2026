import React from 'react';

export const CnaLndPlanning: React.FC = () => {
    return (
        <div className="space-y-12">
            <header className="border-b border-slate-100 pb-6">
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Strategic L&D Formulation</h2>
                 <p className="text-sm text-slate-500 mt-1">Applying the 70:20:10 Blended Learning Framework.</p>
            </header>

            <p className="text-sm text-slate-600 leading-relaxed font-medium max-w-[800px]">
                An effective L&D plan uses a blended learning approach. The 70:20:10 model is a powerful framework for this, suggesting that learning is most effective when it comes from a mix of experience, social interaction, and formal education.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col hover:border-blue-500 transition-colors">
                    <span className="text-5xl font-black text-blue-100 mb-4">70%</span>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4">Experiential Learning</h3>
                    <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">Learning through doing. This is the foundation of institutional development.</p>
                    <ul className="space-y-3 mt-auto">
                        {['Stretch assignments', 'On-the-job training', 'Job rotation', 'Project leadership'].map(i => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div> {i}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col hover:border-emerald-500 transition-colors">
                    <span className="text-5xl font-black text-emerald-100 mb-4">20%</span>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4">Social Learning</h3>
                    <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">Learning from others through interaction and observation.</p>
                    <ul className="space-y-3 mt-auto">
                        {['Mentoring programs', 'Peer-to-peer coaching', 'Communities of practice', 'Networks'].map(i => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div> {i}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm flex flex-col hover:border-indigo-500 transition-colors">
                    <span className="text-5xl font-black text-indigo-100 mb-4">10%</span>
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-4">Formal Study</h3>
                    <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">Structured learning events and academic pursuits.</p>
                    <ul className="space-y-3 mt-auto">
                        {['SILAG Workshops', 'Tertiary Degrees', 'E-learning modules', 'Certifications'].map(i => (
                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <div className="w-1 h-1 bg-indigo-500 rounded-full"></div> {i}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                 <h4 className="font-bold text-indigo-900 text-sm mb-2">Automated Planning Integration</h4>
                 <p className="text-xs text-indigo-800 leading-relaxed">This application's AI-powered reports, such as the 'Automated L&D Recommendations', automatically suggest 70:20:10 interventions for identified gaps, providing a strong starting point for your strategic L&D plan.</p>
            </div>
        </div>
    );
};
