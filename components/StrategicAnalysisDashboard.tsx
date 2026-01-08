import React, { useMemo } from 'react';
import { OfficerRecord, EstablishmentRecord, GradingGroup } from '../types';
import { XIcon, ChartBarSquareIcon } from './icons';
import { ChartComponent } from './charts';

interface DashboardProps {
    cnaData: OfficerRecord[];
    establishmentData: EstablishmentRecord[];
    agencyName: string;
    onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 truncate mt-1">{title}</h3>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
    </div>
);

export const StrategicAnalysisDashboard: React.FC<DashboardProps> = ({ cnaData, establishmentData, agencyName, onClose }) => {

    const analysis = useMemo(() => {
        if (!cnaData || cnaData.length === 0) return null;

        const totalStaff = cnaData.length;

        // Enhanced Gender Distribution
        let maleCount = 0;
        let femaleCount = 0;
        let unknownCount = 0;

        const establishmentMap = new Map<string, EstablishmentRecord>();
        establishmentData.forEach(e => {
            const key = `${(e.occupant || '').trim().toLowerCase()}|${(e.division || '').trim().toLowerCase()}`;
            if(key !== '|') establishmentMap.set(key, e);
        });

        cnaData.forEach(officer => {
            if (officer.gender === 'Male') {
                maleCount++;
            } else if (officer.gender === 'Female') {
                femaleCount++;
            } else {
                // Gender not in CNA, try finding in establishment data
                const key = `${(officer.name || '').trim().toLowerCase()}|${(officer.division || '').trim().toLowerCase()}`;
                const establishmentRecord = establishmentMap.get(key);
                if (establishmentRecord?.gen === 'M') {
                    maleCount++;
                } else if (establishmentRecord?.gen === 'F') {
                    femaleCount++;
                } else {
                    unknownCount++;
                }
            }
        });

        const femalePercentage = totalStaff > 0 ? (femaleCount / totalStaff) * 100 : 0;
        const malePercentage = totalStaff > 0 ? (maleCount / totalStaff) * 100 : 0;
        const unknownPercentage = totalStaff > 0 ? (unknownCount / totalStaff) * 100 : 0;

        const gradingGroupCounts = cnaData.reduce((acc, o) => {
            const group = o.gradingGroup || 'Other';
            acc[group] = (acc[group] || 0) + 1;
            return acc;
        }, {} as Record<GradingGroup | 'Other', number>);

        const avgExperience = cnaData.reduce((sum, o) => sum + (o.yearsOfExperience || 0), 0) / cnaData.filter(o => o.yearsOfExperience).length;

        return {
            totalStaff,
            femalePercentage,
            malePercentage,
            unknownPercentage,
            femaleCount,
            maleCount,
            unknownCount,
            gradingGroupCounts,
            avgExperience,
        };
    }, [cnaData, establishmentData]);

    if (!analysis) {
        return (
             <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center p-4" aria-modal="true" role="dialog">
                <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl p-6 text-center">
                    <p className="text-slate-700 dark:text-slate-300">Not enough data to generate the Strategic Analysis Dashboard.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Close</button>
                </div>
            </div>
        );
    }

    const { gradingGroupCounts, avgExperience, totalStaff, maleCount, femaleCount, unknownCount, malePercentage, femalePercentage, unknownPercentage } = analysis;

    const gradingGroupChartData = {
        labels: Object.keys(gradingGroupCounts),
        datasets: [{
            label: 'Officers by Grading Group',
            data: Object.values(gradingGroupCounts),
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'],
        }]
    };
    
    const genderDistChartData = {
        labels: [`Male (${malePercentage.toFixed(0)}%)`, `Female (${femalePercentage.toFixed(0)}%)`, `Unknown`],
        datasets: [{
            label: 'Gender Distribution',
            data: [maleCount, femaleCount, unknownCount],
            backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(107, 114, 128, 0.7)'],
            borderColor: ['#3B82F6', '#EC4899', '#6B7280'],
            borderWidth: 2,
        }]
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-300 dark:border-slate-700/50 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartBarSquareIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Strategic Analysis for {agencyName}</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close dashboard">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>
                 <main className="overflow-y-auto p-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
                        <StatCard title="CNA Participants" value={totalStaff} description="Officers who submitted data" />
                        <StatCard title="Male Participants" value={maleCount} description={`${malePercentage.toFixed(0)}% of participants`} />
                        <StatCard title="Female Participants" value={femaleCount} description={`${femalePercentage.toFixed(0)}% of participants`} />
                        <StatCard title="Gender Unknown" value={unknownCount} description={`${unknownPercentage.toFixed(0)}% of participants`} />
                        <StatCard title="Average Experience" value={`${avgExperience.toFixed(1)} Yrs`} description="Across all participants" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Workforce Distribution by Grade</h2>
                            <div className="relative h-80">
                                <ChartComponent
                                    type="bar"
                                    data={gradingGroupChartData}
                                    options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Gender Distribution</h2>
                            <div className="relative h-80">
                                <ChartComponent
                                    type="doughnut"
                                    data={genderDistChartData}
                                    options={{ maintainAspectRatio: false }}
                                />
                            </div>
                        </div>
                    </div>
                 </main>
            </div>
        </div>
    );
};