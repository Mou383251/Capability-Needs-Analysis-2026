import React from 'react';
import { ScaleIcon, UsersIcon, GlobeAltIcon, CheckCircleIcon, SparklesIcon } from '../icons';

const StandardCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#059669] rounded-full"></div>
            {title}
        </h3>
        <div className="text-sm text-slate-600 leading-relaxed font-medium">
            {children}
        </div>
    </div>
);

const Blockquote: React.FC<{ source: string; children: React.ReactNode }> = ({ source, children }) => (
    <div className="bg-slate-50 border-l-[6px] border-indigo-600 p-8 rounded-r-xl shadow-inner mb-6 relative overflow-hidden">
        <p className="text-lg italic text-slate-700 leading-relaxed font-serif relative z-10">
            "{children}"
        </p>
        <p className="mt-4 text-[11px] font-black text-indigo-600 uppercase tracking-widest">— {source}</p>
    </div>
);

const PrincipleCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ElementType }> = ({ title, children, icon: Icon }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full hover:border-[#059669] transition-all group">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <h4 className="font-black text-slate-900 uppercase tracking-tight text-xs mb-2">{title}</h4>
        <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
            {children}
        </p>
    </div>
);

export const GesiOverview: React.FC = () => {
    return (
        <div className="space-y-12">
            {/* Background & Importance Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <StandardCard title="Purpose">
                    <p>
                        The National Public Service GESI Policy aims to promote a public service that is inclusive, equitable, and representative of the diverse PNG population. It ensures that every public servant has the opportunity to contribute and grow regardless of their gender or background.
                    </p>
                </StandardCard>
                <StandardCard title="Background">
                    <p>
                        Upholding the principles of equality as enshrined in the National Constitution, this policy provides a clear framework for agencies to mainstream GESI into their operational and strategic DNA, addressing historical systemic barriers.
                    </p>
                </StandardCard>
            </section>

            {/* Constitutional & Human Rights Callouts */}
            <section>
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Constitutional Foundations</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Blockquote source="Section 55, PNG Constitution">
                        All citizens have the same rights, privileges, obligations and duties irrespective of race, tribe, place of origin, political opinion, colour, creed, religion or sex.
                    </Blockquote>
                    <Blockquote source="Article 1, UDHR">
                        All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.
                    </Blockquote>
                </div>
            </section>

            {/* Guiding Principles Grid */}
            <section>
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Guiding Principles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <PrincipleCard title="Equity" icon={ScaleIcon}>
                        Fairness and justice in the distribution of benefits and responsibilities between women and men.
                    </PrincipleCard>
                    <PrincipleCard title="Social Inclusion" icon={UsersIcon}>
                        Improving the terms of participation in society for people who are disadvantaged.
                    </PrincipleCard>
                    <PrincipleCard title="Participation" icon={GlobeAltIcon}>
                        Ensuring all staff have the opportunity to engage in decision-making processes.
                    </PrincipleCard>
                    <PrincipleCard title="Non-Discrimination" icon={CheckCircleIcon}>
                        Guaranteeing that rights are exercised without distinction of any kind.
                    </PrincipleCard>
                    <PrincipleCard title="Accountability" icon={SparklesIcon}>
                        Maintaining responsibility for GESI outcomes at every level of leadership.
                    </PrincipleCard>
                </div>
            </section>
        </div>
    );
};
