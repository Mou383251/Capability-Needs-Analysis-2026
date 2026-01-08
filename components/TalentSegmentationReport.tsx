
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AiTalentSegmentationReport, AgencyType, PrescriptiveAction } from '../types';
import { AI_TALENT_SEGMENTATION_REPORT_PROMPT_INSTRUCTIONS } from '../constants';
import { XIcon, SparklesIcon, PresentationChartLineIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon, DocumentIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToDocx, exportToXlsx, ReportData } from '../utils/export';
import { exportOfficialReport } from '../utils/pdfExport';

interface ReportProps {
  data: OfficerRecord[];
  agencyType: AgencyType;
  agencyName: string;
  onClose: () => void;
}

const aiTalentSegmentationReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        strategicInsight: { type: Type.STRING },
        prescriptiveActions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    officerName: { type: Type.STRING },
                    segment: { type: Type.STRING },
                    primaryAction: { type: Type.STRING },
                    successionTarget: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                },
                required: ["officerName", "segment", "primaryAction", "rationale"]
            }
        }
    },
    required: ["executiveSummary", "strategicInsight", "prescriptiveActions"]
};

const Box = ({ title, color, count, highlight }: { title: string; color: string; count: number; highlight?: boolean }) => (
  <div className={`${color} p-4 border border-slate-300 dark:border-slate-600 flex flex-col justify-center items-center transition-all hover:scale-105 cursor-pointer relative shadow-sm h-full rounded-lg`}>
    <p className="text-[10px] uppercase font-black text-center leading-tight mb-2 opacity-80 tracking-widest">{title}</p>
    <p className={`text-3xl font-black ${highlight ? 'animate-pulse' : ''}`}>{count}</p>
  </div>
);

// Signatory section for official instruments
const BoardApprovalSection = () => (
    <div className="mt-16 border-t-2 border-slate-900 pt-12 pb-12">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] mb-12 text-center">Board Approval & Authorization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
                <div className="border-b border-slate-900 w-full mb-2 h-12"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Board Chairman</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Date: ____/____/2025</p>
            </div>
            <div className="flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-slate-200 rounded-full flex items-center justify-center bg-slate-50 mb-4 opacity-50">
                    <span className="text-[8px] font-black uppercase text-slate-400">Official Seal</span>
                </div>
                <div className="border-b border-slate-900 w-full mb-2 h-12"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Secretary of Department</p>
            </div>
            <div className="text-center">
                <div className="border-b border-slate-900 w-full mb-2 h-12"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Director Human Resources</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Audit Reference: PS-TNA-2025</p>
            </div>
        </div>
    </div>
);

// Action Plan Component for Talent Segments
export const TalentActionPlan = ({ actions }: { actions: PrescriptiveAction[] }) => {
  return (
    <div className="mt-12 border-t-4 border-slate-800 pt-10">
      <h3 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tighter flex items-center">
        <span className="bg-blue-900 text-white px-2 py-1 mr-3 rounded text-[10px] font-black tracking-widest">OFFICIAL</span>
        Prescriptive Strategic Action Plan
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Tier 1: The High Flyers */}
        <div className="space-y-4">
          <h4 className="text-blue-900 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-blue-900 pb-2">High Impact (Stars/Future Leaders)</h4>
          <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-900 shadow-sm">
            <p className="font-black text-blue-900 text-xs mb-3 uppercase tracking-tight">Strategy: Specialized Development</p>
            <div className="space-y-4">
                {actions.filter(a => a.segment === 'Top Talent' || a.segment === 'Future Leader').slice(0, 3).map((a, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white/50 p-2 rounded border border-blue-100">
                        <p className="font-bold text-blue-800">{a.officerName}</p>
                        <p className="mt-1 leading-tight">{a.primaryAction}</p>
                        {a.successionTarget && (
                            <p className="mt-2 text-[9px] font-black text-blue-600 flex items-center gap-1 uppercase tracking-tight">
                                <ArrowRightIcon className="w-3 h-3" /> Succession: {a.successionTarget}
                            </p>
                        )}
                    </div>
                ))}
                {actions.filter(a => a.segment === 'Top Talent' || a.segment === 'Future Leader').length === 0 && (
                    <p className="text-[10px] italic text-slate-400">No high-impact candidates currently eligible for formal tracks.</p>
                )}
            </div>
          </div>
        </div>

        {/* Tier 2: The Core Growth (Achievers/Key Contributors) */}
        <div className="space-y-4">
          <h4 className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-slate-400 pb-2">Capability Core (Achievers/Contributors)</h4>
          <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-400 shadow-sm">
            <p className="font-black text-slate-800 text-xs mb-3 uppercase tracking-tight">Strategy: Peer Mentorship</p>
             <div className="space-y-4">
                {actions.filter(a => a.segment === 'Key Contributor' || a.segment === 'High Achiever').slice(0, 3).map((a, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white/50 p-2 rounded border border-slate-200">
                        <p className="font-bold text-slate-800">{a.officerName}</p>
                        <p className="mt-1 leading-tight">{a.primaryAction}</p>
                    </div>
                ))}
                {actions.filter(a => a.segment === 'Key Contributor' || a.segment === 'High Achiever').length === 0 && (
                    <p className="text-[10px] italic text-slate-400">Core workforce currently performing at established standards.</p>
                )}
            </div>
          </div>
        </div>

        {/* Tier 3: The Support Base (Specialists/Solid Performers) */}
        <div className="space-y-4">
          <h4 className="text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-slate-200 pb-2">Stability Base (Specialists/Solid)</h4>
          <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-200 shadow-sm">
            <p className="font-black text-slate-800 text-xs mb-3 uppercase tracking-tight">Strategy: Experiential Uplift</p>
             <div className="space-y-4">
                {actions.filter(a => a.segment === 'Solid Performer' || a.segment === 'Specialist Expert').slice(0, 3).map((a, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white/50 p-2 rounded border border-slate-200">
                        <p className="font-bold text-slate-800">{a.officerName}</p>
                        <p className="mt-1 leading-tight">{a.primaryAction}</p>
                    </div>
                ))}
                {actions.filter(a => a.segment === 'Solid Performer' || a.segment === 'Specialist Expert').length === 0 && (
                    <p className="text-[10px] italic text-slate-400">Stability baseline maintained across functional units.</p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="mt-10 bg-slate-100 p-4 text-[10px] italic text-slate-500 border border-slate-200 rounded-lg flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
        <p>
          Note: Eligibility for Formal/Overseas training is gated by the strict 24-month permanent service rule. AI suggestions have been downgraded to 'In-House Coaching' where tenure requirements were not met.
        </p>
      </div>
    </div>
  );
};

export const TalentSegmentationReport: React.FC<ReportProps> = ({ data, agencyType, agencyName, onClose }) => {
    const [report, setReport] = useState<AiTalentSegmentationReport | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- Deterministic Clustering Logic (9-Box Calculation) ---
    const analytics = useMemo(() => {
        const grid = {
            stars: 0,         // High Perf, High Pot
            futureLeaders: 0,  // Mod Perf, High Pot
            unrealized: 0,     // Low Perf, High Pot
            achievers: 0,      // High Perf, Mod Pot
            key: 0,            // Mod Perf, Mod Pot
            inconsistent: 0,   // Low Perf, Mod Pot
            experts: 0,        // High Perf, Low Pot
            solid: 0,          // Mod Perf, Low Pot
            risk: 0            // Low Perf, Low Pot
        };

        const today = new Date();

        data.forEach(o => {
            // Calculate Tenure
            let tenureYears = 0;
            if (o.commencementDate) {
                const start = new Date(o.commencementDate);
                tenureYears = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            }

            // Determine Performance (X-Axis)
            const spa = parseInt(o.spaRating) || 0;
            const perf = spa >= 4 ? 'High' : spa === 3 ? 'Mod' : 'Low';

            // Determine Potential (Y-Axis)
            const avgPot = o.capabilityRatings.reduce((s, r) => s + r.currentScore, 0) / (o.capabilityRatings.length || 1);
            let pot = avgPot >= 8 ? 'High' : avgPot >= 5 ? 'Mod' : 'Low';

            // APPLY FILTERS: Casual or < 2 years cannot be stars/futureLeaders
            const isCasual = (o.employmentStatus || '').toLowerCase().includes('casual');
            const restricted = isCasual || tenureYears < 2.0;

            if (pot === 'High') {
                if (perf === 'High') {
                    if (restricted) grid.experts++; // Default to High Performance / Low Potential
                    else grid.stars++;
                } else if (perf === 'Mod') {
                    if (restricted) grid.solid++; // Default to Mod Performance / Low Potential
                    else grid.futureLeaders++;
                } else {
                    grid.unrealized++;
                }
            } else if (pot === 'Mod') {
                if (perf === 'High') grid.achievers++;
                else if (perf === 'Mod') grid.key++;
                else grid.inconsistent++;
            } else {
                if (perf === 'High') grid.experts++;
                else if (perf === 'Mod') grid.solid++;
                else grid.risk++;
            }
        });

        const total = data.length || 1;
        return {
            ...grid,
            core: (((grid.key + grid.solid + grid.achievers) / total) * 100).toFixed(1),
            hiPo: (((grid.stars + grid.futureLeaders) / total) * 100).toFixed(1),
            atRisk: (((grid.risk + grid.inconsistent) / total) * 100).toFixed(1)
        };
    }, [data]);

    useEffect(() => {
        const generateNarrative = async () => {
            if (!process.env.API_KEY) {
                setError("API key is not configured.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                // Prepare data for Deep Scan (tenure and eligibility markers)
                const deepScanInput = data.map(o => {
                    const spa = parseInt(o.spaRating) || 0;
                    const avgPot = o.capabilityRatings.reduce((s, r) => s + r.currentScore, 0) / (o.capabilityRatings.length || 1);
                    const start = o.commencementDate ? new Date(o.commencementDate) : null;
                    const tenureMonths = start ? (new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44) : 0;
                    
                    return {
                        name: o.name,
                        status: o.employmentStatus,
                        tenureMonths: tenureMonths.toFixed(0),
                        isPermanent: (o.employmentStatus || '').toLowerCase().includes('permanent') || (o.employmentStatus || '').toLowerCase().includes('confirmed'),
                        spaRating: spa,
                        avgPotential: avgPot.toFixed(1)
                    };
                });

                const prompt = `
                Perform a Deep Scan and Prescriptive Action Plan for ${agencyName}.
                
                **SCANNED WORKFORCE DATA (N=${data.length}):**
                ${JSON.stringify(deepScanInput)}
                
                **AGGREGATE STATS:**
                - Stars: ${analytics.stars}
                - Future Leaders: ${analytics.futureLeaders}
                - Key Contributors: ${analytics.key}
                - Specialist Experts: ${analytics.experts}
                - Talent at Risk: ${analytics.risk}
                
                Identify candidates for SUCCESSION tracks if they are 'Future Leaders'. Apply the 10:20:70 eligibility logic for all.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        systemInstruction: AI_TALENT_SEGMENTATION_REPORT_PROMPT_INSTRUCTIONS,
                        responseMimeType: "application/json",
                        responseSchema: aiTalentSegmentationReportSchema,
                    },
                });

                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error(e);
                setError("AI Engine failure during deep scan.");
            } finally {
                setLoading(false);
            }
        };

        generateNarrative();
    }, [analytics, agencyName, data]);

    // Enhanced export logic for official board report
    const handleOfficialExport = async () => {
        if (!report) return;
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `${agencyName.replace(/\s+/g, '_')}_Board_Ready_${dateStr}`;
        await exportOfficialReport('talent-report-content', filename);
    };

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        
        if (format === 'pdf') {
            handleOfficialExport();
        } else {
            const reportData: ReportData = {
                title: `Talent Segmentation Audit - ${agencyName}`,
                sections: [
                    { title: "Executive Talent Summary", content: [report.executiveSummary] },
                    { title: "Strategic 9-Box Insights", content: [report.strategicInsight] },
                    { 
                        title: "9-Box Grid Distribution", 
                        content: [{
                            type: 'table',
                            headers: ['Segment', 'Personnel Count'],
                            rows: [
                                ['Top Talent (Stars)', analytics.stars],
                                ['Future Leaders', analytics.futureLeaders],
                                ['High Achievers', analytics.achievers],
                                ['Key Contributors', analytics.key],
                                ['Specialist Experts', analytics.experts],
                                ['Solid Performers', analytics.solid],
                                ['Unrealized Potential', analytics.unrealized],
                                ['Inconsistent', analytics.inconsistent],
                                ['Risk / Low Performers', analytics.risk]
                            ]
                        }]
                    },
                    {
                        title: "Prescriptive Action Plan",
                        content: [{
                            type: 'table',
                            headers: ['Officer', 'Segment', 'Primary Action', 'Target Succession Role', 'Rationale'],
                            rows: report.prescriptiveActions.map(a => [a.officerName, a.segment, a.primaryAction, a.successionTarget || 'N/A', a.rationale])
                        }]
                    }
                ]
            };
            if (format === 'xlsx') exportToXlsx(reportData);
            else if (format === 'docx') exportToDocx(reportData);
        }
    };

    if (loading) return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="text-center">
                <PresentationChartLineIcon className="w-16 h-16 text-indigo-400 animate-pulse mx-auto mb-4" />
                <p className="font-black text-white uppercase tracking-[0.3em] text-xs text-center">Executing Deep Scan...</p>
                <p className="text-[10px] text-indigo-300 uppercase tracking-widest mt-2 font-bold text-center">Verifying Tenure & Mapping Successors</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start p-4 pt-12 animate-fade-in no-print overflow-y-auto">
            <div id="talent-report-content" className="bg-white rounded-[24px] shadow-2xl max-w-6xl w-full flex flex-col mb-12 border border-slate-200 font-sans text-slate-800">
                {/* Executive Summary Header */}
                <header className="flex justify-between items-end border-b-4 border-slate-800 p-10 bg-slate-50/50 rounded-t-[24px]">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none executive-header">Talent Segmentation</h1>
                        <p className="text-slate-500 uppercase tracking-widest text-[10px] font-black mt-3 italic">
                            Workforce Capability & Succession Analysis • {agencyName}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 no-print">
                         <div className="flex gap-2">
                            <button 
                                onClick={handleOfficialExport}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#1A365D] hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all"
                            >
                                <DocumentIcon className="w-4 h-4" />
                                <span>Export Official Board Report</span>
                            </button>
                            <ExportMenu onExport={handleExport as any} />
                            <button onClick={onClose} className="p-2 bg-white hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-200">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            Confidential | Internal Use Only
                        </div>
                    </div>
                </header>

                <main className="p-10 space-y-12">
                    <div className="grid grid-cols-12 gap-10">
                        {/* Left Side: The 9-Box Grid Visual */}
                        <div className="col-span-12 lg:col-span-8">
                            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase text-center tracking-[0.3em]">Performance vs. Potential Matrix</h3>
                            <div className="grid grid-cols-3 grid-rows-3 gap-3 h-[500px] border-l-4 border-b-4 border-slate-300 relative bg-slate-50 p-3 rounded-tr-2xl">
                                {/* Axis Labels */}
                                <div className="absolute -left-12 top-1/2 -rotate-90 font-black text-slate-400 text-[10px] tracking-[0.5em] uppercase whitespace-nowrap">Potential</div>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 font-black text-slate-400 text-[10px] tracking-[0.5em] uppercase whitespace-nowrap">Performance</div>

                                {/* Row 1 (High Potential) */}
                                <Box title="Unrealized Potential" color="bg-blue-50" count={analytics.unrealized} />
                                <Box title="Future Leader" color="bg-blue-100" count={analytics.futureLeaders} />
                                <Box title="Top Talent" color="bg-blue-900 text-white shadow-xl" count={analytics.stars} highlight />
                                
                                {/* Row 2 (Mod Potential) */}
                                <Box title="Inconsistent" color="bg-slate-50" count={analytics.inconsistent} />
                                <Box title="Key Contributor" color="bg-slate-100" count={analytics.key} />
                                <Box title="High Achiever" color="bg-blue-200" count={analytics.achievers} />

                                {/* Row 3 (Low Potential) */}
                                <Box title="Risk/Low Perf" color="bg-red-50 text-red-800" count={analytics.risk} />
                                <Box title="Solid Performer" color="bg-slate-50" count={analytics.solid} />
                                <Box title="Specialist Expert" color="bg-slate-200" count={analytics.experts} />
                            </div>
                        </div>

                        {/* Right Side: Segment Insights */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            <div className="bg-slate-900 text-white p-8 rounded-[24px] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16"></div>
                                <h4 className="text-blue-400 font-black uppercase text-[10px] mb-4 tracking-[0.2em] flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4" /> Strategic Insight
                                </h4>
                                <p className="text-sm leading-relaxed font-medium text-slate-300 italic">
                                    "{report?.strategicInsight}"
                                </p>
                            </div>

                            <div className="border border-slate-100 p-8 rounded-[24px] bg-slate-50 shadow-inner">
                                <h4 className="font-black text-slate-800 text-[10px] mb-6 uppercase tracking-widest border-b border-slate-200 pb-2">Key Segmentation Stats</h4>
                                <ul className="space-y-6">
                                    <li className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Core Workforce:</span> 
                                        <span className="text-xl font-black text-slate-900">{analytics.core}%</span>
                                    </li>
                                    <li className="flex justify-between items-center text-blue-700 font-bold">
                                        <span className="text-xs font-bold uppercase tracking-tight">High Potential Pool:</span> 
                                        <span className="text-xl font-black">{analytics.hiPo}%</span>
                                    </li>
                                    <li className="flex justify-between items-center text-red-600">
                                        <span className="text-xs font-bold uppercase tracking-tight">Talent at Risk:</span> 
                                        <span className="text-xl font-black">{analytics.atRisk}%</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <section className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Executive Narrative</h3>
                        <p className="text-lg text-slate-700 leading-relaxed font-serif font-medium">
                            {report?.executiveSummary}
                        </p>
                    </section>

                    {/* Prescriptive Action Footer */}
                    {report && <TalentActionPlan actions={report.prescriptiveActions} />}

                    {/* Signatory Section for Board Report */}
                    <BoardApprovalSection />
                </main>

                <footer className="p-8 border-t border-slate-100 text-center bg-slate-50 rounded-b-[24px]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Official National HR Audit Record • Property of the Department of Personnel Management</p>
                </footer>
            </div>
        </div>
    );
};
