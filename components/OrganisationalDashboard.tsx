import React, { useMemo, useState } from 'react';
import { OfficerRecord, EstablishmentRecord } from '../types';
import { SparklesIcon, ChevronDownIcon, ExclamationTriangleIcon, ArrowPathIcon, UsersIcon, CheckCircleIcon, ChartBarSquareIcon, TableCellsIcon, ClipboardDocumentListIcon, PresentationChartLineIcon, AcademicCapIcon, DocumentChartBarIcon, IdentificationIcon } from './icons';
import { ChartComponent } from './charts';
import { DataAggregator } from '../services/DataAggregator';
import { exportToJson } from '../utils/export';

type Tab = 'diagnostic' | 'overview' | 'divisional';

interface DashboardProps {
  data: OfficerRecord[];
  rawResponseCount: number;
  establishmentData: EstablishmentRecord[];
  agencyType: string;
  agencyName: string;
  activeTab: Tab;
  onSetActiveTab: (tab: Tab) => void;
  onShowAiAnalysis: () => void;
  onShowFiveYearPlan: () => void;
  onShowCompetencyReport: () => void;
  onShowGapAnalysis: () => void;
  onShowTalentSegmentation: () => void;
  onShowStrategicRecs: () => void;
  onShowWorkforceSnapshot: () => void;
  onShowDetailedCapability: () => void;
  onShowEligibleOfficers: () => void;
  onShowAnnualPlan: () => void;
  onShowConsolidatedPlan: () => void;
  onShowSuccessionPlan: () => void;
  onShowGesiAnalysis: () => void;
  onShowItemLevelAnalysis: () => void;
  onShowComplianceCertificate: () => void;
  onShowDevelopmentPathways: () => void;
  onShowEvidenceMasterTable: () => void;
}

const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    colorClass: string; 
    description?: string;
    warning?: boolean;
}> = ({ title, value, colorClass, description, warning }) => {
    const borderColor = colorClass.replace('bg-', 'border-');
    const textColor = colorClass.replace('bg-', 'text-');
    const lightBg = `${colorClass}/10`;

    return (
        <div className={`metric-card p-3 md:p-4 rounded-xl flex flex-col justify-center min-h-[110px] transition-all group overflow-hidden border-l-4 ${borderColor} ${lightBg} border-t-0 border-r-0 border-b-0 shadow-sm hover:shadow-md`}>
            <div className="flex items-start justify-between mb-1">
                <h3 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight whitespace-normal break-words line-clamp-2 w-full">{title}</h3>
                {warning ? (
                    <div className="animate-pulse flex-shrink-0 ml-1"><ExclamationTriangleIcon className="w-3 h-3 text-rose-500" /></div>
                ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${colorClass} shadow-sm flex-shrink-0 ml-1`}></div>
                )}
            </div>
            <p className={`text-base md:text-xl font-black ${textColor} tracking-tighter leading-none truncate`}>{value}</p>
            {description && (
                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-[0.1em] truncate group-hover:text-slate-600 transition-colors">
                    {description}
                </p>
            )}
        </div>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
    <div className={`metric-card p-4 md:p-6 rounded-xl flex flex-col border border-slate-100 bg-white shadow-sm ${className}`}>
         <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-slate-50 flex items-center gap-2">
             <div className="w-0.5 h-3.5 bg-[#0F172A] rounded-full"></div>
             {title}
         </h3>
         <div className="flex-grow relative min-h-0">{children}</div>
    </div>
);

const HubCard: React.FC<{ 
    title: string; 
    description: string; 
    icon: React.ElementType; 
    onClick: () => void; 
    colorClass: string 
}> = ({ title, description, icon: Icon, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className="flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all text-left group"
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${colorClass}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{description}</p>
    </button>
);

const Dropdown: React.FC<{ buttonContent: React.ReactNode; children: React.ReactNode; buttonClassName?: string }> = ({ buttonContent, children, buttonClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative inline-block text-left">
            <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-1.5 px-3 py-1.5 font-bold rounded-lg shadow-sm text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${buttonClassName || 'bg-white/5 text-white border border-white/20 hover:bg-white/10'}`}>
                {buttonContent}
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 md:w-72 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] py-2 overflow-y-auto max-h-[75vh] ring-1 ring-black/5 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

export const OrganisationalDashboard: React.FC<DashboardProps> = (props) => {
    const { 
        data, rawResponseCount, establishmentData, activeTab, onSetActiveTab, onShowAiAnalysis, 
        onShowFiveYearPlan, onShowCompetencyReport, onShowGapAnalysis, 
        onShowTalentSegmentation, onShowStrategicRecs, onShowWorkforceSnapshot, 
        onShowDetailedCapability, onShowEligibleOfficers, onShowAnnualPlan, 
        onShowConsolidatedPlan, onShowSuccessionPlan, onShowGesiAnalysis, onShowItemLevelAnalysis, 
        onShowComplianceCertificate, onShowDevelopmentPathways, onShowEvidenceMasterTable
    } = props;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [overviewSearch, setOverviewSearch] = useState('');

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const stats = useMemo(() => DataAggregator.process(data, establishmentData, rawResponseCount), [data, establishmentData, rawResponseCount]);

    const filteredEstablishment = useMemo(() => {
        if (!overviewSearch) return establishmentData;
        const search = overviewSearch.toLowerCase();
        return establishmentData.filter(pos => 
            (pos.positionNumber || '').toLowerCase().includes(search) ||
            (pos.designation || '').toLowerCase().includes(search) ||
            (pos.occupant || '').toLowerCase().includes(search)
        );
    }, [establishmentData, overviewSearch]);

    const handleCanvaExport = () => {
        const canvaPackage = {
            brandTheme: { primaryNavy: "#1A365D", secondaryGreen: "#2AAA52", accentAmber: "#EAB308", white: "#FFFFFF" },
            tableOfContents: [
                "1. Executive Foreword",
                "2. Strategic Framework",
                "3. Current State Assessment",
                "4. Future Capability Requirements",
                "5. Resource & Fiscal Planning",
                "6. Development Pathways (Elite Cohort)",
                "7. Execution & Monitoring"
            ],
            metadata: { agency: props.agencyName, generatedAt: new Date().toISOString(), instrumentReference: "DPM-CNA-2026" }
        };
        exportToJson(canvaPackage);
        alert("Canva-Ready Data Package Generated.");
    };

    const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
        <button
            onClick={onClick}
            className={`px-1 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b-2 transition-all duration-300 flex-shrink-0 ${
                isActive ? 'border-white text-white' : 'border-transparent text-white/40 hover:text-white/70'
            }`}
        >
            {children}
        </button>
    );

    const ReportItem: React.FC<{ onClick: () => void; children: React.ReactNode; variant?: 'action' }> = ({ onClick, children, variant }) => (
        <button onClick={onClick} className={`w-full text-left px-4 py-2 text-[9.5px] font-bold transition-all uppercase tracking-tight min-h-[38px] ${variant === 'action' ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            {children}
        </button>
    );

    const MenuHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="px-4 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mt-1 mb-1 bg-slate-50/50">
            {children}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col bg-[#F4F7F9] font-['Inter']">
            {/* STICKY DASHBOARD HEADER */}
            <header className="bg-[#1A1A40] border-b border-white/10 shadow-sm z-[50] shrink-0 sticky top-0">
                <div className="max-w-full mx-auto py-2.5 px-4 md:px-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="border-l-4 border-blue-500 pl-4 py-0.5">
                                <h1 className="text-xs md:text-sm font-black text-white tracking-tighter uppercase leading-none">CNA Strategic Dashboard</h1>
                                <p className="text-[7px] md:text-[8px] font-bold text-[#A0AEC0] uppercase tracking-[0.2em] mt-0.5">National Personnel Matrix</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             <button onClick={handleRefresh} className="p-1.5 text-white/40 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5" title="Sync Intelligence">
                                <ArrowPathIcon className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                             </button>
                             <div className="h-6 w-px bg-white/10"></div>
                             
                             {/* EXHAUSTIVE REPORT SUITE DROPDOWN */}
                             <Dropdown 
                                buttonClassName="bg-[#2AAA52] hover:bg-[#238C44] text-white px-5 shadow-lg shadow-green-900/20" 
                                buttonContent={<><SparklesIcon className="w-3.5 h-3.5" /><span className="inline">CNA Report Suite</span></>}
                             >
                                <MenuHeader>Strategic Synthesis</MenuHeader>
                                <ReportItem onClick={onShowAiAnalysis}>Organisational Analysis</ReportItem>
                                <ReportItem onClick={onShowConsolidatedPlan}>Consolidated Strategic Plan</ReportItem>
                                <ReportItem onClick={onShowWorkforceSnapshot}>Workforce Snapshot</ReportItem>
                                <ReportItem onClick={onShowStrategicRecs}>Strategic Recommendations</ReportItem>
                                <ReportItem onClick={onShowGesiAnalysis}>GESI Capability Analysis</ReportItem>
                                <ReportItem onClick={onShowDevelopmentPathways}>CNA Development Pathways</ReportItem>

                                <MenuHeader>Performance & Gaps</MenuHeader>
                                <ReportItem onClick={onShowGapAnalysis}>Capability Gap Analysis</ReportItem>
                                <ReportItem onClick={onShowCompetencyReport}>Competency Domain Report</ReportItem>
                                <ReportItem onClick={onShowDetailedCapability}>Detailed Item Breakdown</ReportItem>
                                <ReportItem onClick={onShowItemLevelAnalysis}>Granular Item Analysis</ReportItem>

                                <MenuHeader>Workforce Planning</MenuHeader>
                                <ReportItem onClick={onShowFiveYearPlan}>5-Year Strategic L&D Plan</ReportItem>
                                <ReportItem onClick={onShowAnnualPlan}>Annual Training Plan</ReportItem>
                                <ReportItem onClick={onShowSuccessionPlan}>Institutional Succession Plan</ReportItem>
                                <ReportItem onClick={onShowTalentSegmentation}>Talent Segmentation (9-Box)</ReportItem>

                                <MenuHeader>Compliance & Audit</MenuHeader>
                                <ReportItem onClick={onShowEligibleOfficers}>Eligible Officers Registry</ReportItem>
                                <ReportItem onClick={onShowEvidenceMasterTable}>Evidence Master Table</ReportItem>
                                <ReportItem onClick={onShowComplianceCertificate}>Certificate of Compliance</ReportItem>

                                <MenuHeader>Integrations</MenuHeader>
                                <ReportItem onClick={handleCanvaExport} variant="action">Export Canva Dataset (JSON)</ReportItem>
                            </Dropdown>
                        </div>
                    </div>
                </div>
                <div className="max-w-full mx-auto px-4 md:px-8 border-t border-white/5 bg-white/5">
                    <div className="flex gap-6 md:gap-10 overflow-x-auto no-scrollbar">
                        <TabButton isActive={activeTab === 'diagnostic'} onClick={() => onSetActiveTab('diagnostic')}>Diagnostic Summary</TabButton>
                        <TabButton isActive={activeTab === 'overview'} onClick={() => onSetActiveTab('overview')}>Register Overview</TabButton>
                        <TabButton isActive={activeTab === 'divisional'} onClick={() => onSetActiveTab('divisional')}>Staffing Projections</TabButton>
                    </div>
                </div>
            </header>

            {/* DASHBOARD BODY - USES PARENT SCROLL */}
            <div className="p-4 md:p-8 space-y-12 pb-20">
                {activeTab === 'diagnostic' && (
                    <div className="animate-fade-in flex flex-col gap-12">
                        {/* KPI GRID - 10 CARDS */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* CLUSTER 1: CAPACITY */}
                            <StatCard title="Authorized Ceiling" value={stats.totalPositions} colorClass="bg-slate-700" description="DPM Approved Posts" />
                            <StatCard title="On Strength" value={stats.onStrength} colorClass="bg-emerald-600" description="Current Occupants" />
                            <StatCard title="Structural Vacancy" value={`${stats.vacancyRate.toFixed(1)}%`} colorClass="bg-rose-600" description={`${stats.vacantPositions} Unfilled Roles`} />
                            
                            {/* CLUSTER 2: GESI */}
                            <StatCard title="Female Seniority" value={`${stats.gesiMetrics.femaleSeniorityRate.toFixed(1)}%`} colorClass="bg-emerald-500" description="Grades 13-20 Focus" />
                            <StatCard title="GESI Awareness" value={`${stats.gesiMetrics.gesiAwarenessScore.toFixed(1)} / 10`} colorClass="bg-teal-500" description="Institutional Knowledge" warning={stats.gesiMetrics.gesiAwarenessScore < 6} />
                            <StatCard title="Inclusion Baseline" value={stats.gesiMetrics.disabilityInclusionCount} colorClass="bg-indigo-500" description="Heuristic Baseline" />

                            {/* CLUSTER 3: DIAGNOSTIC INTEGRITY */}
                            <StatCard 
                                title="CNA Records" 
                                value={stats.totalResponses} 
                                colorClass="bg-indigo-600" 
                                description={`Audit: ${stats.totalResponses}`} 
                                warning={stats.totalResponses !== stats.cnaParticipants}
                            />
                            <StatCard title="CNA Participation" value={`${(stats.participationRate * 100).toFixed(0)}%`} colorClass="bg-blue-600" description="Response Coverage" warning={stats.participationRate < 0.7} />
                            <StatCard title="Institutional Baseline" value={`${stats.baselineScore.toFixed(1)}/10`} colorClass="bg-indigo-700" description="Avg Proficiency" />
                            <StatCard title="Lifecycle Risks" value={stats.retirementRiskCount} colorClass="bg-amber-600" description="Retiring in 5Y" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <ChartCard title="Strategic Capability Intensity (CNA) & 5Y Roadmap Projections" className="lg:col-span-12">
                                <div className="h-[350px] md:h-[450px]">
                                    <ChartComponent type="bar" data={{
                                        labels: Object.keys(stats.divisionStats),
                                        datasets: [
                                            { label: 'Authorized Ceiling', data: Object.values(stats.divisionStats).map((d: any) => d.ceiling), backgroundColor: '#e2e8f0', borderRadius: 4 },
                                            { label: 'Active Strength', data: Object.values(stats.divisionStats).map((d: any) => d.actual), backgroundColor: '#1A1A40', borderRadius: 4 },
                                            { label: 'Stabilization Priority (70/20 Focus)', data: Object.values(stats.divisionStats).map((d: any) => d.skillGaps), backgroundColor: '#3b82f6', borderRadius: 4 },
                                            { label: 'Elite Cohort Track (10% Formal)', data: Object.values(stats.divisionStats).map((d: any) => Math.min(d.actual, 5)), backgroundColor: '#2AAA52', borderRadius: 4 }
                                        ]
                                    }} options={{ 
                                        responsive: true, maintainAspectRatio: false,
                                        scales: { x: { stacked: false }, y: { beginAtZero: true } }
                                    }} />
                                </div>
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black text-[#1A365D] uppercase tracking-widest text-center italic">
                                        CNA STRATEGY FRAMEWORK: Stabilization prioritized in Years 1-2 (70:20 model) vs. Selective Elite Excellence (10% track).
                                    </p>
                                </div>
                            </ChartCard>
                        </div>

                        {/* INSTITUTIONAL STRATEGIC INTELLIGENCE HUB */}
                        <section className="bg-slate-100/50 p-8 md:p-12 rounded-[40px] border border-slate-200 shadow-inner space-y-10">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Institutional Intelligence Hub</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Verified 70:20:10 Strategic Pathways & Diagnostic Assets</p>
                                </div>
                                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Audit Ready</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Group 1: Synthesis */}
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-blue-500 pl-2">Strategic Synthesis</h5>
                                    <HubCard colorClass="bg-blue-600" icon={DocumentChartBarIcon} title="Organisational Analysis" description="Multimodal synthesis of baseline vs. corporate plan goals." onClick={onShowAiAnalysis} />
                                    <HubCard colorClass="bg-blue-500" icon={ChartBarSquareIcon} title="Strategic Plan" description="Consolidated strategic plan and leadership vision." onClick={onShowConsolidatedPlan} />
                                </div>

                                {/* Group 2: Capability */}
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-2">Capability Diagnostic</h5>
                                    <HubCard colorClass="bg-emerald-600" icon={AcademicCapIcon} title="Gap Analysis" description="Academic vs functional skill deficiency matrix." onClick={onShowGapAnalysis} />
                                    <HubCard colorClass="bg-emerald-500" icon={PresentationChartLineIcon} title="Competency Domains" description="Maturity mapping of institutional domains." onClick={onShowCompetencyReport} />
                                </div>

                                {/* Group 3: Workforce */}
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Workforce Planning</h5>
                                    <HubCard colorClass="bg-indigo-600" icon={UsersIcon} title="Succession Strategy" description="Risk monitor for leadership transition & retirement." onClick={onShowSuccessionPlan} />
                                    <HubCard colorClass="bg-indigo-500" icon={IdentificationIcon} title="Talent 9-Box" description="Performance vs potential segmentation matrix." onClick={onShowTalentSegmentation} />
                                </div>

                                {/* Group 4: Compliance */}
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-slate-700 pl-2">Compliance & Audit</h5>
                                    <HubCard colorClass="bg-slate-800" icon={ClipboardDocumentListIcon} title="Evidence Registry" description="Validated data base for audit and board citation." onClick={onShowEvidenceMasterTable} />
                                    <HubCard colorClass="bg-slate-700" icon={CheckCircleIcon} title="Compliance Cert" description="Official verification of CNA alignment standards." onClick={onShowComplianceCertificate} />
                                </div>
                            </div>
                        </section>
                    </div>
                )}
                {activeTab === 'overview' && (
                    <div className="animate-fade-in flex flex-col gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">National Establishment Register</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">CNA Compliance Audit</p>
                                </div>
                                <div className="w-full md:w-80 relative">
                                    <input 
                                        type="text" 
                                        placeholder="Search Position or Name..." 
                                        value={overviewSearch}
                                        onChange={(e) => setOverviewSearch(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    />
                                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                    <thead className="bg-[#0F172A] text-white">
                                        <tr>
                                            <th className="p-5 font-black uppercase tracking-widest">Position No.</th>
                                            <th className="p-5 font-black uppercase tracking-widest">Designation</th>
                                            <th className="p-5 font-black uppercase tracking-widest text-center">Grade</th>
                                            <th className="p-5 font-black uppercase tracking-widest">Occupant</th>
                                            <th className="p-5 font-black uppercase tracking-widest">Status</th>
                                            <th className="p-5 font-black uppercase tracking-widest text-center">CNA Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredEstablishment.map((pos, idx) => {
                                            const hasSubmitted = data.some(o => o.positionNumber === pos.positionNumber || (o.name === pos.occupant && pos.occupant !== 'VACANT'));
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-5 font-black text-slate-900">{pos.positionNumber}</td>
                                                    <td className="p-5 font-bold text-slate-700 uppercase tracking-tight">{pos.designation}</td>
                                                    <td className="p-5 font-bold text-slate-400 text-center">{pos.grade}</td>
                                                    <td className="p-5 font-black text-slate-900">{pos.occupant}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase ${
                                                            pos.status === 'Vacant' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                            {pos.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {hasSubmitted ? (
                                                            <div className="flex justify-center"><CheckCircleIcon className="w-5 h-5 text-emerald-500" /></div>
                                                        ) : pos.status === 'Vacant' ? (
                                                            <span className="text-slate-300 font-black">—</span>
                                                        ) : (
                                                            <span className="text-rose-500 font-black uppercase text-[9px] tracking-widest animate-pulse">Pending</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'divisional' && (
                    <div className="animate-fade-in flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                            {Object.entries(stats.divisionStats).map(([name, d]: [string, any]) => (
                                <div key={name} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group border-t-8 border-t-slate-900">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{name}</h3>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Capability Audit</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors"><UsersIcon className="w-6 h-6 text-slate-400 group-hover:text-blue-600" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">On Strength</p>
                                            <p className="text-2xl font-black text-slate-900">{d.actual} / {d.ceiling}</p>
                                            <div className="w-full bg-white h-2 rounded-full mt-4 overflow-hidden border border-slate-200">
                                                <div className="bg-[#1A365D] h-full transition-all duration-1000" style={{ width: `${(d.actual / d.ceiling) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 shadow-inner">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Critical Gaps</p>
                                            <p className="text-2xl font-black text-rose-600">{d.skillGaps + d.qualGaps}</p>
                                            <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight mt-3 italic">Prioritized for CNA Action</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
