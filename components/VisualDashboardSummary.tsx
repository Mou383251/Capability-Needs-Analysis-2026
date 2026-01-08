import React, { useMemo, useRef } from 'react';
import { OfficerRecord } from '../types';
import { XIcon, ChartPieIcon, UsersIcon, AcademicCapIcon, CalendarDaysIcon } from './icons';
import { ChartComponent } from './charts';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  onClose: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description?: string; icon: React.ElementType }> = ({ title, value, description, icon: Icon }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex items-start gap-4">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
    </div>
);

export const VisualDashboardSummary: React.FC<ReportProps> = ({ data, onClose }) => {
    const divisionChartRef = useRef<HTMLCanvasElement>(null);
    const gradingGroupChartRef = useRef<HTMLCanvasElement>(null);
    const performanceLevelChartRef = useRef<HTMLCanvasElement>(null);
    
    const analysis = useMemo(() => {
        if (!data || data.length === 0) return null;

        const calculateAvgGap = (officers: OfficerRecord[]): number => {
            const allRatings = officers.flatMap(o => o.capabilityRatings);
            if (allRatings.length === 0) return 0;
            const totalGap = allRatings.reduce((sum, r) => sum + r.gapScore, 0);
            return totalGap / allRatings.length;
        };

        const groupData = <T extends keyof OfficerRecord>(key: T, defaultValue: string) => {
            const officersByGroup: Record<string, OfficerRecord[]> = {};
            data.forEach(o => {
                const groupName = String(o[key] || defaultValue);
                if (!officersByGroup[groupName]) officersByGroup[groupName] = [];
                officersByGroup[groupName].push(o);
            });

            const avgGaps = Object.entries(officersByGroup).map(([groupName, officers]) => ({
                name: groupName,
                score: calculateAvgGap(officers)
            }));

            return avgGaps.sort((a, b) => b.score - a.score);
        };

        const gapsByDivision = groupData('division', 'Unassigned');
        const gapsByGradingGroup = groupData('gradingGroup', 'Other');
        const gapsByPerformanceLevel = groupData('performanceRatingLevel', 'Not Rated');

        return {
            gapsByDivision,
            gapsByGradingGroup,
            gapsByPerformanceLevel,
        };
    }, [data]);

    if (!analysis) {
        return (
             <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
                <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl p-6 text-center">
                    <p className="text-slate-700 dark:text-slate-300">No data available to generate a summary.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Close</button>
                </div>
            </div>
        );
    }

    const { gapsByDivision, gapsByGradingGroup, gapsByPerformanceLevel } = analysis;

    const divisionChartData = {
        labels: gapsByDivision.map(d => d.name),
        datasets: [{ label: 'Avg Gap Score', data: gapsByDivision.map(d => d.score), backgroundColor: 'rgba(59, 130, 246, 0.7)' }]
    };

    const gradingGroupChartData = {
        labels: gapsByGradingGroup.map(d => d.name),
        datasets: [{ label: 'Avg Gap Score', data: gapsByGradingGroup.map(d => d.score), backgroundColor: 'rgba(22, 163, 74, 0.7)' }]
    };
    
    const performanceLevelChartData = {
        labels: gapsByPerformanceLevel.map(d => d.name),
        datasets: [{ label: 'Avg Gap Score', data: gapsByPerformanceLevel.map(d => d.score), backgroundColor: 'rgba(217, 119, 6, 0.7)' }]
    };

    const chartOptions = {
        scales: { y: { beginAtZero: true, suggestedMax: 5 } },
        plugins: { legend: { display: false } },
        maintainAspectRatio: false
    };

    const getReportDataForExport = (): ReportData => {
        const getImageData = (ref: React.RefObject<HTMLCanvasElement>) => {
            if (ref.current) {
                return { type: 'image' as const, dataUrl: ref.current.toDataURL('image/png'), width: 500, height: 300 };
            }
            return 'Chart not available';
        };
        
        return {
            title: 'Visual Dashboard Summary - Capability Gaps',
            sections: [
                { title: 'Average Gap Score by Division', content: [getImageData(divisionChartRef)] },
                { title: 'Average Gap Score by Job Group', content: [getImageData(gradingGroupChartRef)] },
                { title: 'Average Gap Score by Performance Level', content: [getImageData(performanceLevelChartRef)] },
            ]
        };
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        try {
            const reportData = getReportDataForExport();
            if (format === 'pdf') exportToPdf(reportData);
            else if (format === 'docx') exportToDocx(reportData);
            else if (format === 'xlsx') exportToXlsx(reportData);
        } catch(e) {
            console.error("Export failed:", e);
            alert("Could not export report.");
        }
    };

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-slate-300 dark:border-slate-700/50 flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <ChartPieIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visual Dashboard: Capability Gap Analysis</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <ExportMenu onExport={(format) => handleExport(format as any)} />
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close dashboard">
                            <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>
                </header>
                 <main className="overflow-y-auto p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard icon={AcademicCapIcon} title="Highest Gap by Division" value={gapsByDivision[0]?.name || 'N/A'} description={`Avg Score: ${gapsByDivision[0]?.score.toFixed(2) || '0'}`} />
                        <StatCard icon={UsersIcon} title="Highest Gap by Job Group" value={gapsByGradingGroup[0]?.name || 'N/A'} description={`Avg Score: ${gapsByGradingGroup[0]?.score.toFixed(2) || '0'}`} />
                        <StatCard icon={CalendarDaysIcon} title="Highest Gap by Performance" value={gapsByPerformanceLevel[0]?.name || 'N/A'} description={`Avg Score: ${gapsByPerformanceLevel[0]?.score.toFixed(2) || '0'}`} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white/70 dark:bg-slate-800/40 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-center mb-2">Gaps by Job Group</h3>
                            <div className="relative h-80"><ChartComponent chartRef={gradingGroupChartRef} type="bar" data={gradingGroupChartData} options={chartOptions} /></div>
                        </div>
                        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-800/40 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                             <h3 className="font-semibold text-center mb-2">Gaps by Division</h3>
                            <div className="relative h-80"><ChartComponent chartRef={divisionChartRef} type="bar" data={divisionChartData} options={chartOptions} /></div>
                        </div>
                    </div>
                     <div className="bg-white/70 dark:bg-slate-800/40 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                         <h3 className="font-semibold text-center mb-2">Gaps by Performance Level</h3>
                        <div className="relative h-80"><ChartComponent chartRef={performanceLevelChartRef} type="horizontalBar" data={performanceLevelChartData} options={{ ...chartOptions, indexAxis: 'y' }} /></div>
                    </div>
                 </main>
            </div>
        </div>
    );
};
