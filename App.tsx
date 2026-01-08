/**
 * PNG National CNA Application
 * Integrated with 80% Background Crest Watermark
 */

import React, { useState, useEffect, useMemo } from 'react';

// FIX: Explicitly importing JSX types
import type { JSX } from 'react'; 

// Static Report & Component Imports
import { AutomatedOrganisationalAnalysisReport } from './components/AiAnalysisReport';
import { FiveYearPlanReport } from './components/FiveYearPlanReport';
import { CompetencyDomainReport } from './components/CompetencyDomainReport';
import { CapabilityGapAnalysisReport } from './components/CapabilityGapAnalysisReport';
import { TalentSegmentationReport } from './components/TalentSegmentationReport';
import { StrategicRecommendationsReport } from './components/StrategicRecommendationsReport';
import { WorkforceSnapshotReport } from './components/WorkforceSnapshotReport';
import { DetailedCapabilityBreakdownReport } from './components/DetailedCapabilityBreakdownReport';
import { EligibleOfficersReport } from './components/EligibleOfficersReport';
import { AnnualTrainingPlanReport } from './components/AnnualTrainingPlanReport';
import { ConsolidatedStrategicPlanReport } from './components/ConsolidatedStrategicPlanReport';
import { SuccessionPlanReport } from './components/SuccessionPlanReport';
import { GesiAnalysisReport } from './components/GesiAnalysisReport';
import { DevelopmentPathwaysReport } from './components/DevelopmentPathwaysReport';
import { CnaEvidenceMasterTable } from './components/CnaEvidenceMasterTable';
import { ConsolidatedLifecyclePlanReport } from './components/ConsolidatedLifecyclePlanReport';
import { TrainingPathwaysReport } from './components/TrainingPathwaysReport';

// Types & Data
import { OfficerRecord, AgencyType, EstablishmentRecord, GradingGroup, UrgencyLevel, QUESTION_TEXT_MAPPING } from './types';
import { INITIAL_CNA_DATASET } from './constants';
import { ESTABLISHMENT_DATA } from './data/establishment';

// UI Components
import { Sidebar } from './components/Sidebar';
import { OrganisationalDashboard } from './components/OrganisationalDashboard';
import { DivisionGroup } from './components/DivisionGroup';
import { ImportModal } from './components/ImportModal';
import { UserGuideModal } from './components/UserGuideModal';
import { CnaPolicyToolkit } from './components/CnaPolicyToolkit';
import { LndAiAssistantModal } from './components/LndAiAssistantModal';
import { IndividualDevelopmentProfile } from './components/IndividualDevelopmentProfile';
import { GesiPolicyToolkit } from './components/GesiPolicyToolkit';
import { LoginPage } from './components/LoginPage';
import { PowerBiModal } from './components/PowerBiModal';
import { WelcomeModal } from './components/WelcomeModal';
// REMOVED: GlobalNavigation Import
import { TrainingPathwaysDashboard } from './components/TrainingPathwaysDashboard';
import { TrainingCategoryModal } from './components/TrainingCategoryModal';
import { CompetencyProjectionReport } from './components/CompetencyProjectionReport';
import { ItemLevelAnalysisReport } from './components/ItemLevelAnalysisReport';
import { CertificateOfCompliance } from './components/CertificateOfCompliance';
import { SystemSettings } from './components/SystemSettings';
import { SurveyInsights } from './components/SurveyInsights';
import { ArrowDownTrayIcon, ClipboardDocumentListIcon } from './components/icons';
import { exportToXlsx, ReportData } from './utils/export';

// Configuration
type View = 'organisational' | 'individual' | 'pathways' | 'gesi' | 'cna' | 'settings' | 'survey-insights';
type OrgTab = 'diagnostic' | 'overview' | 'divisional';

const VIEW_SEQUENCE: { view: View; tab?: OrgTab }[] = [
    { view: 'organisational', tab: 'diagnostic' },
    { view: 'organisational', tab: 'overview' },
    { view: 'organisational', tab: 'divisional' },
    { view: 'individual' },
    { view: 'pathways' },
    { view: 'survey-insights' },
    { view: 'gesi' },
    { view: 'cna' },
    { view: 'settings' },
];

const deDuplicateOfficers = (officers: OfficerRecord[]): OfficerRecord[] => {
    const uniqueOfficersMap = new Map<string, OfficerRecord>();
    const unidentifiedResponses: OfficerRecord[] = [];
    officers.forEach(officer => {
        const email = (officer.email || '').trim().toLowerCase();
        const name = (officer.name || '').trim().toLowerCase();
        const pos = (officer.position || '').trim().toLowerCase();
        const key = email || (name && pos ? `${name}-${pos}` : null);
        if (key && key !== '-') uniqueOfficersMap.set(key, officer);
        else unidentifiedResponses.push(officer);
    });
    return [...Array.from(uniqueOfficersMap.values()), ...unidentifiedResponses];
};

const App: React.FC = () => {
    // Auth State
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => sessionStorage.getItem('isCnaAppLoggedIn') === 'true');

    // Navigation & UI State
    const [showWelcome, setShowWelcome] = useState<boolean>(false);
    const [currentView, setCurrentView] = useState<View>('organisational');
    const [activeOrgTab, setActiveOrgTab] = useState<OrgTab>('diagnostic');
    const [history, setHistory] = useState<{ view: View; tab?: OrgTab }[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => { if (isLoggedIn) setShowWelcome(true); }, [isLoggedIn]);
    
    const getFromStorage = <T,>(key: string, defaultValue: T): T => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) return JSON.parse(saved);
        } catch (error) { console.error(`Storage Error:`, error); }
        return defaultValue;
    };

    // Data State
    const [officerData, setOfficerData] = useState<OfficerRecord[]>(() => deDuplicateOfficers(getFromStorage(OFFICER_DATA_KEY, INITIAL_CNA_DATASET)));
    const [rawResponseCount, setRawResponseCount] = useState<number>(() => getFromStorage(RAW_RESPONSE_COUNT_KEY, officerData.length));
    const [establishmentData, setEstablishmentData] = useState<EstablishmentRecord[]>(() => getFromStorage(ESTABLISHMENT_DATA_KEY, ESTABLISHMENT_DATA));
    const [agencyType, setAgencyType] = useState<AgencyType>(() => getFromStorage(AGENCY_TYPE_KEY, 'National Agency'));
    const [agencyName, setAgencyName] = useState<string>(() => getFromStorage(AGENCY_NAME_KEY, 'Department of Personnel Management'));
    const [corporatePlanContext, setCorporatePlanContext] = useState<string>(() => getFromStorage(CORP_PLAN_CONTEXT_KEY, ''));
    const [gradingGroupFilter, setGradingGroupFilter] = useState<GradingGroup | 'All'>('All');
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'All'>('All');
    
    // Modal Visibility State
    const [showImportModal, setShowImportModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showLndAiAssistant, setShowLndAiAssistant] = useState(false);
    const [showPowerBiModal, setShowPowerBiModal] = useState(false);
    const [showAiAnalysis, setShowAiAnalysis] = useState(false);
    const [showFiveYearPlan, setShowFiveYearPlan] = useState(false);
    const [showCompetencyReport, setShowCompetencyReport] = useState(false);
    const [showGapAnalysis, setShowGapAnalysis] = useState(false);
    const [showTalentSegmentation, setShowTalentSegmentation] = useState(false);
    const [showStrategicRecs, setShowStrategicRecs] = useState(false);
    const [showWorkforceSnapshot, setShowWorkforceSnapshot] = useState(false);
    const [showDetailedCapability, setShowDetailedCapability] = useState(false);
    const [showEligibleOfficers, setShowEligibleOfficers] = useState(false);
    const [showAnnualPlan, setShowAnnualPlan] = useState(false);
    const [showConsolidatedPlan, setShowConsolidatedPlan] = useState(false);
    const [showSuccessionPlan, setShowSuccessionPlan] = useState(false);
    const [showGesiAnalysis, setShowGesiAnalysis] = useState(false);
    const [showItemLevelAnalysis, setShowItemLevelAnalysis] = useState(false);
    const [showComplianceCertificate, setShowComplianceCertificate] = useState(false);
    const [showDevelopmentPathways, setShowDevelopmentPathways] = useState(false);
    const [showEvidenceMasterTable, setShowEvidenceMasterTable] = useState(false);
    const [showConsolidatedLifecycle, setShowConsolidatedLifecycle] = useState(false);

    const [showTrainingCategory, setShowTrainingCategory] = useState<string | null>(null);
    const [showProjectionReport, setShowProjectionReport] = useState(false);
    const [selectedOfficerForLndPlan, setSelectedOfficerForLndPlan] = useState<OfficerRecord | null>(null);
    const [selectedOfficerForPathway, setSelectedOfficerForPathway] = useState<OfficerRecord | null>(null);

    // Handlers
    const handleNavigate = (view: View, tab?: OrgTab) => {
        setHistory(prev => [...prev, { view: currentView, tab: activeOrgTab }]);
        setCurrentView(view);
        if (tab) setActiveOrgTab(tab);
    };

    const handleHome = () => handleNavigate('organisational', 'diagnostic');

    // Breadcrumb logic removed as it was only used for the deleted Header

    const updateAndStore = <T,>(setter: any, key: string) => (newValue: T | ((prevState: T) => T)) => {
        setter((prev: T) => {
            const val = newValue instanceof Function ? newValue(prev) : newValue;
            localStorage.setItem(key, JSON.stringify(val));
            return val;
        });
    };
    
    const handleSetOfficerData = updateAndStore(setOfficerData, OFFICER_DATA_KEY);
    const handleSetRawCount = updateAndStore(setRawResponseCount, RAW_RESPONSE_COUNT_KEY);
    const handleSetAgencyType = updateAndStore(setAgencyType, AGENCY_TYPE_KEY);
    const handleSetAgencyName = updateAndStore(setAgencyName, AGENCY_NAME_KEY);
    const handleSetEstablishmentData = updateAndStore(setEstablishmentData, ESTABLISHMENT_DATA_KEY);
    const handleSetCorpPlanContext = updateAndStore(setCorporatePlanContext, CORP_PLAN_CONTEXT_KEY);
    
    const handleImport = (newData: OfficerRecord[], newType: AgencyType, newName: string, newEst?: EstablishmentRecord[], cp?: string) => {
        handleSetRawCount(newData.length);
        handleSetOfficerData(deDuplicateOfficers(newData));
        handleSetAgencyType(newType);
        handleSetAgencyName(newName);
        if (newEst) handleSetEstablishmentData(newEst);
        if (cp) handleSetCorpPlanContext(cp);
        setShowImportModal(false);
    };

    const handleExportAllParticipants = () => {
        const kpiCodes = Object.keys(QUESTION_TEXT_MAPPING);
        const headers = ['Source ID', 'Name', 'Division', 'Position', 'Grade', 'SPA Rating', ...kpiCodes];
        const rows = officerData.map(o => [o.email || '-', o.name, o.division, o.position, o.grade, o.spaRating, ...kpiCodes.map(c => o.capabilityRatings.find(r => r.questionCode === c)?.currentScore || '')]);
        exportToXlsx({ title: 'Consolidated Report', sections: [{ title: 'Dataset', content: [{ type: 'table', headers, rows }], orientation: 'landscape' }] });
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'organisational':
                return (
                    <OrganisationalDashboard 
                        data={officerData}
                        rawResponseCount={rawResponseCount}
                        establishmentData={establishmentData}
                        agencyType={agencyType}
                        agencyName={agencyName}
                        activeTab={activeOrgTab}
                        onSetActiveTab={setActiveOrgTab}
                        onShowAiAnalysis={() => setShowAiAnalysis(true)}
                        onShowFiveYearPlan={() => setShowFiveYearPlan(true)}
                        onShowCompetencyReport={() => setShowCompetencyReport(true)}
                        onShowGapAnalysis={() => setShowGapAnalysis(true)}
                        onShowTalentSegmentation={() => setShowTalentSegmentation(true)}
                        onShowStrategicRecs={() => setShowStrategicRecs(true)}
                        onShowWorkforceSnapshot={() => setShowWorkforceSnapshot(true)}
                        onShowDetailedCapability={() => setShowDetailedCapability(true)}
                        onShowEligibleOfficers={() => setShowEligibleOfficers(true)}
                        onShowAnnualPlan={() => setShowAnnualPlan(true)}
                        onShowConsolidatedPlan={() => setShowConsolidatedPlan(true)}
                        onShowSuccessionPlan={() => setShowSuccessionPlan(true)}
                        onShowGesiAnalysis={() => setShowGesiAnalysis(true)}
                        onShowItemLevelAnalysis={() => setShowItemLevelAnalysis(true)}
                        onShowComplianceCertificate={() => setShowComplianceCertificate(true)}
                        onShowDevelopmentPathways={() => setShowDevelopmentPathways(true)}
                        onShowEvidenceMasterTable={() => setShowEvidenceMasterTable(true)}
                    />
                );
            case 'individual':
                const filtered = officerData.filter(o => (gradingGroupFilter === 'All' || o.gradingGroup === gradingGroupFilter) && (urgencyFilter === 'All' || o.urgency === urgencyFilter));
                const grouped = filtered.reduce((acc, o) => { const d = o.division || 'Unassigned'; if (!acc[d]) acc[d] = []; acc[d].push(o); return acc; }, {} as Record<string, OfficerRecord[]>);
                return (
                    <div className="flex-1 flex flex-col bg-transparent">
                        <header className="p-4 md:p-6 bg-white/80 backdrop-blur-sm border-b border-[#E0E4E8] shadow-sm z-10 no-print">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-xl font-black text-[#2C3E50] uppercase">Individual Operations</h1>
                                    <p className="text-[10px] font-bold text-[#1A365D]/60 uppercase tracking-widest">Monitoring & Development</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowConsolidatedLifecycle(true)} className="h-9 px-4 bg-[#2AAA52] text-white rounded-lg text-[10px] font-black uppercase">Consolidated Plan</button>
                                    <button onClick={handleExportAllParticipants} className="h-9 px-4 bg-[#1A365D] text-white rounded-lg text-[10px] font-bold uppercase">Export Report</button>
                                </div>
                            </div>
                        </header>
                        <div className="p-6 space-y-6">
                            {Object.entries(grouped).map(([name, officers]) => <DivisionGroup key={name} divisionName={name} officers={officers} onViewSummary={setSelectedOfficerForLndPlan} onSuggestTraining={setSelectedOfficerForPathway} loadingSuggestionsFor={null} />)}
                        </div>
                    </div>
                );
            case 'pathways': return <TrainingPathwaysDashboard agencyType={agencyType} setAgencyType={handleSetAgencyType} agencyName={agencyName} setAgencyName={handleSetAgencyName} onSelectCategory={setShowTrainingCategory} onGeneratePlan={() => setShowAnnualPlan(true)} onShowAutomatedLndReport={() => {}} onShowProjectionReport={() => setShowProjectionReport(true)} />;
            case 'survey-insights': return <SurveyInsights />;
            case 'gesi': return <GesiPolicyToolkit onShowGesiAnalysis={() => setShowGesiAnalysis(true)} />;
            case 'cna': return <CnaPolicyToolkit />;
            case 'settings': return <SystemSettings />;
            default: return null;
        }
    };
    
    // Auth Check
    if (!isLoggedIn) return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;

    return (
        <div className="flex h-screen bg-[#F4F7F9] overflow-hidden relative">
            
            {/* 1. BACKGROUND CREST (80% SIZE VISIBILITY) */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
                <img 
                    src="/PNG Crest.png" 
                    alt="National Crest Watermark" 
                    className="w-[80%] max-w-[1200px] object-contain opacity-[0.06] grayscale"
                />
            </div>

            {/* 2. SIDEBAR NAVIGATION */}
            <div className="no-print shrink-0 z-50 relative">
                <Sidebar 
                    currentView={currentView} 
                    setCurrentView={handleNavigate} 
                    onImportClick={() => setShowImportModal(true)} 
                    onHelpClick={() => setShowHelpModal(true)} 
                    onShowLndAiAssistant={() => setShowLndAiAssistant(true)} 
                    onLogout={() => setIsLoggedIn(false)} 
                    onShowPowerBi={() => setShowPowerBiModal(true)} 
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>
            
            {/* 3. CONTENT AREA - Navigation Header completely removed */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-transparent">
                <main className="flex-1 overflow-y-auto relative bg-transparent custom-scrollbar">
                    <div className="relative z-20 min-h-full">
                        {renderCurrentView()}
                    </div>
                </main>
            </div>

            {/* MODALS */}
            {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} onViewPolicy={() => { setShowWelcome(false); handleNavigate('cna'); }} />}
            {showImportModal && <ImportModal onImport={handleImport} onClose={() => setShowImportModal(false)} />}
            {showHelpModal && <UserGuideModal onClose={() => setShowHelpModal(false)} />}
            {showAiAnalysis && <AutomatedOrganisationalAnalysisReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} corporatePlanContext={corporatePlanContext} onClose={() => setShowAiAnalysis(false)} />}
            {selectedOfficerForLndPlan && <IndividualDevelopmentProfile officer={selectedOfficerForLndPlan} agencyName={agencyName} onClose={() => setSelectedOfficerForLndPlan(null)} />}
            {selectedOfficerForPathway && <TrainingPathwaysReport officer={selectedOfficerForPathway} agencyName={agencyName} onClose={() => setSelectedOfficerForPathway(null)} />}
            {showFiveYearPlan && <FiveYearPlanReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowFiveYearPlan(false)} />}
            {showCompetencyReport && <CompetencyDomainReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowCompetencyReport(false)} />}
            {showGapAnalysis && <CapabilityGapAnalysisReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowGapAnalysis(false)} />}
            {showTalentSegmentation && <TalentSegmentationReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowTalentSegmentation(false)} />}
            {showStrategicRecs && <StrategicRecommendationsReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowStrategicRecs(false)} />}
            {showConsolidatedPlan && <ConsolidatedStrategicPlanReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowConsolidatedPlan(false)} />}
            {showWorkforceSnapshot && <WorkforceSnapshotReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowWorkforceSnapshot(false)} />}
            {showDetailedCapability && <DetailedCapabilityBreakdownReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowDetailedCapability(false)} />}
            {showEligibleOfficers && <EligibleOfficersReport data={officerData} establishmentData={establishmentData} agencyType={agencyType} agencyName={agencyName} corporatePlanContext={corporatePlanContext} onClose={() => setShowEligibleOfficers(false)} />}
            {showAnnualPlan && <AnnualTrainingPlanReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowAnnualPlan(false)} />}
            {showLndAiAssistant && <LndAiAssistantModal onClose={() => setShowLndAiAssistant(false)} />}
            {showSuccessionPlan && <SuccessionPlanReport data={officerData} establishmentData={establishmentData} agencyName={agencyName} onClose={() => setShowSuccessionPlan(false)} />}
            {showGesiAnalysis && <GesiAnalysisReport data={officerData} establishmentData={establishmentData} agencyName={agencyName} onClose={() => setShowGesiAnalysis(false)} />}
            {showPowerBiModal && <PowerBiModal data={officerData} onClose={() => setShowPowerBiModal(false)} />}
            {showTrainingCategory && <TrainingCategoryModal data={officerData} categoryName={showTrainingCategory} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowTrainingCategory(null)} />}
            {showProjectionReport && <CompetencyProjectionReport data={officerData} onClose={() => setShowProjectionReport(false)} />}
            {showItemLevelAnalysis && <ItemLevelAnalysisReport data={officerData} agencyType={agencyType} agencyName={agencyName} onClose={() => setShowItemLevelAnalysis(false)} />}
            {showComplianceCertificate && <CertificateOfCompliance data={officerData} agencyName={agencyName} onClose={() => setShowComplianceCertificate(false)} />}
            {showDevelopmentPathways && <DevelopmentPathwaysReport data={officerData} agencyName={agencyName} onClose={() => setShowDevelopmentPathways(false)} />}
            {showEvidenceMasterTable && <CnaEvidenceMasterTable data={officerData} establishmentData={establishmentData} agencyName={agencyName} onClose={() => setShowEvidenceMasterTable(false)} />}
            {showConsolidatedLifecycle && <ConsolidatedLifecyclePlanReport data={officerData} agencyName={agencyName} onClose={() => setShowConsolidatedLifecycle(false)} />}
        </div>
    );
};

// Storage Keys
const OFFICER_DATA_KEY = 'cna_officerData';
const RAW_RESPONSE_COUNT_KEY = 'cna_rawResponseCount';
const ESTABLISHMENT_DATA_KEY = 'cna_establishmentData';
const AGENCY_TYPE_KEY = 'cna_agencyType';
const AGENCY_NAME_KEY = 'cna_agencyName';
const CORP_PLAN_CONTEXT_KEY = 'cna_corpPlanContext';

export default App;