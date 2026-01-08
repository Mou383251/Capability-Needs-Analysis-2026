import React from 'react';
import { UsersIcon, ChartPieIcon, DocumentArrowUpIcon, QuestionMarkCircleIcon, SparklesIcon, ScaleIcon, BookOpenIcon, ArrowLeftOnRectangleIcon, AcademicCapIcon, PresentationChartLineIcon, XIcon, Cog6ToothIcon, GlobeAltIcon } from './icons';

type View = 'organisational' | 'individual' | 'pathways' | 'gesi' | 'cna' | 'settings' | 'survey-insights';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onImportClick: () => void;
  onHelpClick: () => void;
  onShowLndAiAssistant: () => void;
  onLogout: () => void;
  onShowPowerBi: () => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PNG National Emblem Component
 * Optimized: Increased size to 85% for better visibility and enforced centering.
 */
const PNGNationalEmblem = () => (
    <div className="flex items-center justify-center w-full h-full">
        <img 
            src="/Logo/PNG Crest.png" 
            alt="PNG National Crest" 
            className="w-[85%] h-[85%] object-contain drop-shadow-md"
        />
    </div>
);

const NavItemGroup: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4 last:mb-0">
        {title && <h3 className="px-3 text-[9px] font-black uppercase text-white/40 tracking-[0.2em] mb-2 mt-2">{title}</h3>}
        <div className="space-y-1">
            {children}
        </div>
    </div>
);

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 rounded-lg min-h-[38px] group ${
        isActive
            ? 'bg-[#2AAA52] text-white shadow-lg'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        }`}
    >
        <Icon className={`w-4 h-4 mr-3 flex-shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
        <span className="truncate">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, 
    setCurrentView, 
    onImportClick, 
    onHelpClick, 
    onShowLndAiAssistant, 
    onLogout, 
    onShowPowerBi, 
    isOpen, 
    onClose 
}) => {
  return (
    <>
        {/* Mobile Overlay Backdrop */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-500"
                onClick={onClose}
            />
        )}
        
        {/* Sidebar Container */}
        <aside className={`fixed top-0 left-0 h-screen w-60 z-50 transition-transform duration-300 transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.3)] border-r border-white/10 bg-[#1A1A40]/80 backdrop-blur-xl`}>
            
            {/* Header / Logo Section */}
            <div className="flex flex-col items-center px-5 py-8 shrink-0 border-b border-white/10">
                <div className="flex items-center justify-center w-full mb-4 relative">
                    <div className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
                        <PNGNationalEmblem />
                    </div>
                    {/* Absolute positioned Close Button for Mobile */}
                    <button onClick={onClose} className="md:hidden absolute right-0 p-1.5 text-white/40 hover:text-white transition-colors" aria-label="Close menu">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="w-full text-center">
                    <h1 className="text-[12px] font-black text-white leading-none uppercase tracking-widest">CNAS Portal</h1>
                    <p className="text-[9px] font-bold text-[#2AAA52] uppercase tracking-[0.2em] mt-1.5">National Personnel Matrix</p>
                </div>
            </div>
            
            {/* Navigation Elements */}
            <nav className="flex-grow overflow-y-auto no-scrollbar px-3 py-6 custom-scrollbar">
                <NavItemGroup title="Operational Desk">
                    <NavItem
                        icon={ChartPieIcon}
                        label="Organisational"
                        isActive={currentView === 'organisational'}
                        onClick={() => { setCurrentView('organisational'); onClose(); }}
                    />
                    <NavItem
                        icon={UsersIcon}
                        label="Individual"
                        isActive={currentView === 'individual'}
                        onClick={() => { setCurrentView('individual'); onClose(); }}
                    />
                    <NavItem
                        icon={AcademicCapIcon}
                        label="Pathways"
                        isActive={currentView === 'pathways'}
                        onClick={() => { setCurrentView('pathways'); onClose(); }}
                    />
                </NavItemGroup>

                <NavItemGroup title="Digital Insights">
                     <NavItem
                        icon={GlobeAltIcon}
                        label="Cloud Insights"
                        isActive={currentView === 'survey-insights'}
                        onClick={() => { setCurrentView('survey-insights'); onClose(); }}
                    />
                </NavItemGroup>

                <NavItemGroup title="Policy Governance">
                    <NavItem
                        icon={ScaleIcon}
                        label="GESI Framework"
                        isActive={currentView === 'gesi'}
                        onClick={() => { setCurrentView('gesi'); onClose(); }}
                    />
                    <NavItem
                        icon={BookOpenIcon}
                        label="CNA Guidelines"
                        isActive={currentView === 'cna'}
                        onClick={() => { setCurrentView('cna'); onClose(); }}
                    />
                </NavItemGroup>

                <NavItemGroup title="Intelligence">
                    <NavItem
                        icon={DocumentArrowUpIcon}
                        label="Data Import"
                        isActive={false}
                        onClick={() => { onImportClick(); onClose(); }}
                    />
                    <NavItem
                        icon={PresentationChartLineIcon}
                        label="Power BI Analytics"
                        isActive={false}
                        onClick={() => { onShowPowerBi(); onClose(); }}
                    />
                     <NavItem
                        icon={Cog6ToothIcon}
                        label="Portal Settings"
                        isActive={currentView === 'settings'}
                        onClick={() => { setCurrentView('settings'); onClose(); }}
                    />
                </NavItemGroup>
                
                <NavItemGroup title="Support & Security">
                    <NavItem
                        icon={QuestionMarkCircleIcon}
                        label="Help Desk"
                        isActive={false}
                        onClick={() => { onHelpClick(); onClose(); }}
                    />
                    <NavItem
                        icon={SparklesIcon}
                        label="L&D AI Assistant"
                        isActive={false}
                        onClick={() => { onShowLndAiAssistant(); onClose(); }}
                    />
                    <NavItem
                        icon={ArrowLeftOnRectangleIcon}
                        label="Secure Logout"
                        isActive={false}
                        onClick={() => { onLogout(); onClose(); }}
                    />
                </NavItemGroup>
            </nav>

            {/* Footer Institutional Tag */}
            <div className="shrink-0 p-6 border-t border-white/10 bg-black/20">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] text-center leading-relaxed">
                    DPM PNG &copy; 2026 <br/>
                    <span className="text-[#2AAA52]">Authenticated Access</span>
                </p>
            </div>
        </aside>

        <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar {
                width: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `}} />
    </>
  );
};