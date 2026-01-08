import React, { useMemo } from 'react';
import { OfficerRecord, EstablishmentRecord, QUESTION_TEXT_MAPPING } from '../types';
import { XIcon, ChartBarSquareIcon, ExclamationTriangleIcon } from './icons';
import { ChartComponent } from './charts';

interface ReportProps {
  cnaData: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate mt-1">{title}</h3>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
);

export const CnaOrganizationalInsights: React.FC<ReportProps> = ({ cnaData, establishmentData, onClose }) => {
    
    const analysis = useMemo(() => {
        if (!cnaData || cnaData.length === 0 || !establishmentData || establishmentData.length === 0) {
            return null;
        }

        const totalParticipants = cnaData.length;
        const totalStaff = establishmentData.filter(e => e.status !== 'Vacant' && e.occupant && !e.occupant.toLowerCase().includes('vacant')).length;
        const participationCoverage = totalStaff > 0 ? (totalParticipants / totalStaff) * 100 : 0;

        const sectionNames: Record<string, string> = {
            A: 'Section A: Strategic Alignment',
            B: 'Section B: Operational Effectiveness & Values',
            C: 'Section C: Leadership & Development',
            D: 'Section D: Performance Management',
            E: 'Section E: ICT Capability',
            F: 'Section F: Public Finance Management',
            G: 'Section G: Communication & Stakeholder Engagement',
            H: 'Section H: Training Needs Analysis'
        };

        const questionCodesBySection: Record<string, string[]> = {};
        Object.keys(QUESTION_TEXT_MAPPING).forEach(code => {
            const section = code.charAt(0).toUpperCase();
            if (!questionCodesBySection[section]) {
                questionCodesBySection[section] = [];
            }
            questionCodesBySection[section].push(code);
        });

        const allRatings = cnaData.flatMap(o => o.capabilityRatings);
        const allRatedSections = [...new Set(allRatings.map(r => r.questionCode.charAt(0).toUpperCase()))];
        const expectedSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // H contains non-numeric
        const missingSections = expectedSections.filter(s => !allRatedSections.includes(s));
        
        const sectionAverages = Object.entries(questionCodesBySection)
            .filter(([section]) => expectedSections.includes(section)) // Only include main sections
            .map(([section, codes]) => {
                const sectionRatings = allRatings
                    .filter(r => codes.includes(r.questionCode))
                    .map(r => r.currentScore);
                
                const average = sectionRatings.length > 0 
                    ? sectionRatings.reduce((sum, score) => sum + score, 0) / sectionRatings.length 
                    : 0;

                return {
                    section: sectionNames[section] || `Section ${section}`,
                    average: average,
                };
            })
            .sort((a,b) => a.section.localeCompare(b.section));

        return {
            totalParticipants,
            totalStaff,
            participationCoverage,
            sectionAverages,
            missingSections,
        };

    }, [cnaData, establishmentData]);

    const renderContent = () => {
        if (!analysis) {
             return (
                <div className="text-center p-8">
                    <p className="text-lg text-slate-500">No data available for analysis. Please import both CNA and Establishment data.</p>
                </div>
            );
        }
        
        const { totalParticipants, totalStaff, participationCoverage, sectionAverages, missingSections } = analysis;

        const chartData = {
            labels: sectionAverages.map(s => s.section.replace('Section ', '')),
            datasets: [{
                label: 'Average Score (out of 10)',
                data: sectionAverages.map(s => s.average),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            }]
        };

        return (
            <div className="space-y-6">
                {missingSections.length > 0 && (
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg flex items-start gap-3 border border-yellow-300 dark:border-yellow-700">
                        <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold">Missing Data Sections</h4>
                            <p className="text-sm">Data for the following sections was not found in the imported CNA file: <strong>{missingSections.join(', ')}</strong>. The section scores chart will not include them.</p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Participants (CNA)" value={totalParticipants} />
                    <StatCard title="Total Staff (Establishment)" value={totalStaff} />
                    <StatCard title="Participation Coverage" value={`${participationCoverage.toFixed(1)}%`} />
                </div>

                <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Average Scores by CNA Section</h2>
                    <div className="relative h-96">
                        <ChartComponent
                            type="bar"
                            data={chartData}
                            options={{
                                maintainAspectRatio: false,
                                scales: { y: { beginAtZero: true, max: 10 } },
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-300 dark:border-slate-700/50 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartBarSquareIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CNA Organizational Insights</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close dashboard">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                 <main className="overflow-y-auto p-6">
                   {renderContent()}
                </main>
            </div>
        </div>
    );
};