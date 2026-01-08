import React from 'react';
import { AgencyType } from '../types';
import { SparklesIcon, BookOpenIcon, BriefcaseIcon, UsersIcon, ComputerDesktopIcon, ScaleIcon, ChatBubbleLeftRightIcon, GlobeAltIcon, LightBulbIcon, ChartBarSquareIcon } from './icons';

interface DashboardProps {
  agencyType: AgencyType;
  setAgencyType: (type: AgencyType) => void;
  agencyName: string;
  setAgencyName: (name: string) => void;
  onSelectCategory: (category: string) => void;
  onGeneratePlan: () => void;
  onShowAutomatedLndReport: () => void;
  onShowProjectionReport: () => void;
}

const AgencyFilter: React.FC<{
  agencyType: AgencyType;
  setAgencyType: (type: AgencyType) => void;
  agencyName: string;
  setAgencyName: (name: string) => void;
}> = ({ agencyType, setAgencyType, agencyName, setAgencyName }) => {
  const types: AgencyType[] = ["All Agencies", "National Agency", "National Department", "Provincial Administration", "Provincial Health Authority", "Local Level Government", "Other"];
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as AgencyType;
      setAgencyType(newType);
      if (newType === 'All Agencies') {
          setAgencyName('');
      }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded-md w-full lg:w-auto">
        <select
            id="agency-type-selector"
            value={agencyType}
            onChange={handleTypeChange}
            className="block w-full lg:w-auto pl-3 pr-10 py-2 text-sm border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md shadow-sm min-h-[44px]"
        >
            {types.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        {agencyType !== 'All Agencies' && (
             <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder={`Enter name of ${agencyType}...`}
                className="block w-full lg:w-64 pl-3 pr-3 py-2 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md shadow-sm animate-fade-in min-h-[44px]"
             />
        )}
    </div>
  );
};


const trainingCategories = [
    { name: "Core Public Service Competencies", icon: BookOpenIcon, color: "text-blue-500" },
    { name: "Technical & Functional Skills", icon: BriefcaseIcon, color: "text-teal-500" },
    { name: "Leadership & Management Development", icon: UsersIcon, color: "text-purple-500" },
    { name: "ICT & Digital Transformation", icon: ComputerDesktopIcon, color: "text-sky-500" },
    { name: "Public Policy & Governance", icon: ScaleIcon, color: "text-amber-500" },
    { name: "Soft Skills & Personal Effectiveness", icon: ChatBubbleLeftRightIcon, color: "text-indigo-500" },
    { name: "Cross-Cutting & Global Priorities", icon: GlobeAltIcon, color: "text-rose-500" }
];

const CategoryButton: React.FC<{
    category: { name: string, icon: React.ElementType, color: string },
    onClick: () => void
}> = ({ category, onClick }) => {
    const Icon = category.icon;
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center p-6 md:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 transform md:hover:-translate-y-1 min-h-[140px] md:min-h-[180px] w-full"
        >
            <Icon className={`w-10 h-10 md:w-12 md:h-12 mb-3 md:mb-4 ${category.color} transition-colors duration-300`} />
            <span className="text-center text-xs md:text-sm font-bold md:font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 uppercase tracking-tight">
                {category.name}
            </span>
        </button>
    );
};

export const TrainingPathwaysDashboard: React.FC<DashboardProps> = ({ agencyType, setAgencyType, agencyName, setAgencyName, onSelectCategory, onGeneratePlan, onShowAutomatedLndReport, onShowProjectionReport }) => {
    return (
        <div className="bg-[#F4F7F9] dark:bg-gray-900/50 flex-1 min-h-screen pt-[60px] md:pt-[76px]">
             <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-full mx-auto py-6 md:py-8 px-4 md:px-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <h1 className="text-xl md:text-3xl font-black leading-tight text-slate-900 dark:text-white uppercase tracking-tighter">
                                Training Pathways Dashboard
                            </h1>
                            <p className="mt-1 md:mt-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Select a category to view tailored training pathways or generate a consolidated plan.
                            </p>
                        </div>
                        <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
                            <AgencyFilter agencyType={agencyType} setAgencyType={setAgencyType} agencyName={agencyName} setAgencyName={setAgencyName} />
                             <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                                <button
                                    onClick={onShowProjectionReport}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-[10px] md:text-xs uppercase tracking-widest min-h-[44px]"
                                >
                                    <ChartBarSquareIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Competency Projection</span>
                                    <span className="sm:hidden">Projection</span>
                                </button>
                                <button
                                    onClick={onShowAutomatedLndReport}
                                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-[10px] md:text-xs uppercase tracking-widest min-h-[44px]"
                                >
                                    <LightBulbIcon className="w-5 h-5" />
                                    <span className="hidden sm:inline">Automated L&D</span>
                                    <span className="sm:hidden">Auto L&D</span>
                                </button>
                                <button
                                    onClick={onGeneratePlan}
                                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-[10px] md:text-xs uppercase tracking-widest min-h-[44px]"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Generate Plan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="p-4 md:p-10">
                {/* Responsive grid: 1 column on mobile, growing to 4 on large screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-full overflow-hidden">
                   {trainingCategories.map(category => (
                        <CategoryButton
                            key={category.name}
                            category={category}
                            onClick={() => onSelectCategory(category.name)}
                        />
                   ))}
                </div>
            </main>
        </div>
    );
};