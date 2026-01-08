import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-10">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6 border-b border-slate-100 pb-4">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

export const CnaAnalysisGuide: React.FC = () => {
    return (
        <div className="max-w-[1000px] mx-auto">
            <Section title="Data Interpretation Standards">
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-8">
                    Once you import your data, the diagnostic system automates the synthesis. Here's a guide to interpreting the key metrics used across all national reports:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">Average Capability Score</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">The mean score for a specific skill or across an entire division. A low average indicates a widespread development need within that functional unit.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-3">Gap Score & Percentage</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">The delta between the desired proficiency (10) and the current self-assessment. This is the primary trigger for intervention priorities.</p>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-4">Intervention Prioritization Matrix</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100">
                            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                            <span className="text-sm font-bold text-slate-700 w-32">Critical Gap</span>
                            <span className="text-xs text-slate-500">Score 1-4. Requires immediate formal training (10% component).</span>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100">
                            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                            <span className="text-sm font-bold text-slate-700 w-32">Moderate Gap</span>
                            <span className="text-xs text-slate-500">Score 5-7. Requires structured mentoring or targeted workshops.</span>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                            <span className="text-sm font-bold text-slate-700 w-32">Minor Gap</span>
                            <span className="text-xs text-slate-500">Score 8-9. Addressed via coaching or on-the-job practice.</span>
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Strategic Compliance Checklist">
                <div className="bg-indigo-600 p-8 rounded-[24px] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -mr-24"></div>
                    <ul className="space-y-4 text-sm font-medium">
                        <li className="flex items-start gap-3">
                            <div className="mt-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</div>
                            <span>Cross-reference quantitative scores with qualitative training preferences.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</div>
                            <span>Ensure interventions are tailored to the specific grade level and job group.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="mt-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✓</div>
                            <span>Identify 'SMEs' (High Scorers) to act as mentors for low-scoring peers.</span>
                        </li>
                    </ul>
                </div>
            </Section>
        </div>
    );
};
