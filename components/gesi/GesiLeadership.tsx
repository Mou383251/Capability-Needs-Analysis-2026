import React from 'react';

const values = [
    {
        name: "Honesty",
        description: "Being truthful and transparent in all dealings, especially when addressing GESI-related issues and reporting on progress."
    },
    {
        name: "Integrity",
        description: "Upholding ethical principles and ensuring that decisions are made fairly and without bias, promoting a merit-based system for all."
    },
    {
        name: "Accountability",
        description: "Taking ownership for GESI outcomes, being answerable for actions, and ensuring that the GESI Policy is implemented effectively."
    },
     {
        name: "Wisdom",
        description: "Applying knowledge and experience to make sound judgments that consider the diverse needs and perspectives of all staff and citizens."
    },
    {
        name: "Respect",
        description: "Treating every individual with dignity, valuing their contributions, and fostering a workplace free from harassment and discrimination."
    },
    {
        name: "Responsibility",
        description: "Actively carrying out duties to advance GESI, challenging non-inclusive behavior, and contributing to a positive and supportive work environment."
    }
];

const ValueCard: React.FC<{ name: string; description: string }> = ({ name, description }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-emerald-500 transition-colors group">
        <h3 className="font-black text-sm uppercase tracking-widest text-[#059669] mb-3 group-hover:scale-105 transition-transform origin-left">{name}</h3>
        <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{description}</p>
    </div>
);

export const GesiLeadership: React.FC = () => {
    return (
        <div className="space-y-10">
             <div className="max-w-[800px]">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Leadership Capability & GESI</h2>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    The successful implementation of the GESI Policy is underpinned by the values outlined in the Papua New Guinea Public Service Leadership Capability Framework. Leaders are expected to model these behaviors to foster an inclusive and equitable workforce culture.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {values.map(value => (
                    <ValueCard key={value.name} name={value.name} description={value.description} />
                ))}
            </div>
        </div>
    );
};
