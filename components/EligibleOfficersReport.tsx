import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { OfficerRecord, AgencyType, EstablishmentRecord, StructuredCorporatePlan } from '../types';
import { XIcon, SparklesIcon, ClipboardDocumentListIcon, CheckCircleIcon, ExclamationTriangleIcon, ScaleIcon, PrinterIcon, BriefcaseIcon, UsersIcon, AcademicCapIcon } from './icons';
import { ExportMenu } from './ExportMenu';
import { exportToPdf, exportToDocx, exportToXlsx, ReportData } from '../utils/export';

interface ReportProps {
  data: OfficerRecord[];
  establishmentData: EstablishmentRecord[];
  agencyType: AgencyType;
  agencyName: string;
  corporatePlanContext: string;
  onClose: () => void;
}

const aiEligibleOfficersReportSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING },
        eligibleOfficers: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    path70: { type: Type.STRING, description: "70% Experiential: Workplace project or stretch assignment." },
                    path20: { type: Type.STRING, description: "20% Social: Mentoring or coaching alignment." },
                    path10: { type: Type.STRING, description: "10% Formal: Classroom training for high-priority gaps." },
                    formalBudgetPGK: { type: Type.STRING, description: "Estimated cost in Kina for formal component." },
                    strategicRationale: { type: Type.STRING },
                    locationPreference: { type: Type.STRING, description: "Suggested location for formal training (In-Country or Overseas)." }
                },
                required: ["name", "path70", "path20", "path10", "formalBudgetPGK", "strategicRationale", "locationPreference"]
            }
        }
    },
    required: ["executiveSummary", "eligibleOfficers"],
};

export const EligibleOfficersReport: React.FC<ReportProps> = ({ data, agencyName, corporatePlanContext, onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const authKey = useMemo(() => Math.random().toString(36).substring(7).toUpperCase(), []);

    // --- Strict 3-Gate Triangulation Logic ---
    const calculateTenure = (commencementDate?: string): number => {
        if (!commencementDate) return 0;
        const start = new Date(commencementDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - start.getTime());
        return parseFloat((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
    };

    const complianceResults = useMemo(() => {
        return data.map(officer => {
            const tenureYears = calculateTenure(officer.commencementDate);
            const status = (officer.employmentStatus || "").toLowerCase();
            
            // Gate 1: Employment Status Check (Strict Filter)
            const isNonPermanent = status.includes('casual') || status.includes('short-term') || status.includes('contractual') || status === 'other';
            
            // Gate 2: Tenure Check (730 days / 24 Months)
            const insufficientTenure = tenureYears < 2.0;

            // Gate 3: Verification
            const isEligible = !isNonPermanent && !insufficientTenure;
            
            let reason = "Compliance Standard Met";
            if (isNonPermanent) reason = "Gate 1 Fail: Non-Permanent Status";
            else if (insufficientTenure) reason = "Gate 2 Fail: Tenure < 24 Months";

            return {
                ...officer,
                tenureYears,
                isEligible,
                complianceReason: reason
            };
        });
    }, [data]);

    const stats = useMemo(() => {
        const total = complianceResults.length;
        const eligible = complianceResults.filter(r => r.isEligible).length;
        const disqualified = total - eligible;
        return { total, eligible, disqualified };
    }, [complianceResults]);

    useEffect(() => {
        const generateStrategicPlan = async () => {
            if (!process.env.API_KEY) {
                setError("API key not configured.");
                setLoading(false);
                return;
            }

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                // Only analyze officers who passed the mandatory gates
                const eligiblePersonnel = complianceResults
                    .filter(r => r.isEligible)
                    .map(o => ({
                        name: o.name,
                        position: o.position,
                        grade: o.grade,
                        gaps: o.technicalCapabilityGaps,
                        qual: o.jobQualification
                    }));

                if (eligiblePersonnel.length === 0) {
                    setReport({
                        executiveSummary: "Audit complete. No personnel currently meet the mandatory 2-year permanent tenure requirement for training nomination.",
                        eligibleOfficers: []
                    });
                    setLoading(false);
                    return;
                }

                let strategicContext = "";
                try {
                    const parsed = JSON.parse(corporatePlanContext) as StructuredCorporatePlan;
                    strategicContext = `Strategic Objectives: ${parsed.strategic_goals.objectives.join(', ')}. Priority Needs: ${parsed.training_needs}`;
                } catch (e) {
                    strategicContext = corporatePlanContext || "Public Service Excellence and MTDP IV Alignment.";
                }

                const prompt = `
                Perform a Deep Scan for the 'Eligible Officers Report' for ${agencyName}.
                
                **USER DIRECTIVE:**
                Apply the 70:20:10 Learning Framework to all training recommendations.
                
                **Deep Scan Command:** 
                > Scan the Corporate Plan and CNA data. Identify only the top 10% of training needs that require Formal In-Country or Overseas classroom training. For all other needs, suggest experiential (70%) or mentorship (20%) solutions. Filter all results by the strict 2-year permanent service rule.

                **70:20:10 FRAMEWORK INSTRUCTIONS:**
                1. 70% (Experiential): Recommend 1 specific workplace project or stretch assignment for EVERY officer in the eligible list.
                2. 20% (Social): Recommend mentoring or coaching based on seniority and functional roles.
                3. 10% (Formal): Reserve formal classroom training (In-country or Overseas) ONLY for high-priority gaps aligned with: ${strategicContext}.
                
                **ELIGIBLE CANDIDATE LIST (PASSED TENURE/STATUS GATES):**
                ${JSON.stringify(eligiblePersonnel)}

                **CONSTRAINTS:**
                - Tone: Official, Professional HR Auditor.
                - Budget: Calculate estimated Formal training budget in PNG Kina (PGK).
                - Output: Strictly JSON.
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: aiEligibleOfficersReportSchema,
                    },
                });

                setReport(JSON.parse(response.text.trim()));
            } catch (e) {
                console.error(e);
                setError("AI synthesis of training pathways failed.");
            } finally {
                setLoading(false);
            }
        };

        generateStrategicPlan();
    }, [complianceResults, agencyName, corporatePlanContext]);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx') => {
        if (!report) return;
        const reportData: ReportData = {
            title: `Official Eligibility Report - ${agencyName}`,
            sections: [
                { title: "Executive Compliance Summary", content: [report.executiveSummary] },
                { 
                    title: "70:20:10 Development Matrix", 
                    content: [{
                        type: 'table',
                        headers: ['Officer', 'Position', 'Tenure', 'Formal (10%)', 'Social (20%)', 'Work (70%)', 'Placement'],
                        rows: complianceResults.filter(r => r.isEligible).map(r => {
                            const rec = report.eligibleOfficers.find((o: any) => o.name === r.name);
                            return [
                                r.name, r.position, `${r.tenureYears} Yrs`,
                                rec?.path10 || 'N/A', rec?.path20 || 'N/A', rec?.path70 || 'N/A', rec?.strategicRationale || 'N/A'
                            ];
                        })
                    }],
                    orientation: 'landscape'
                }
            ]
        };
        if (format === 'pdf') exportToPdf(reportData);
        else if (format === 'xlsx') exportToXlsx(reportData);
        else if (format === 'docx') exportToDocx(reportData);
    };

    if (loading) return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
            <div className="text-center">
                <ScaleIcon className="w-16 h-16 text-blue-400 animate-pulse mx-auto mb-4" />
                <p className="font-black text-white uppercase tracking-[0.3em] text-xs">Triangulating Official Gates...</p>
                <p className="text-[10px] text-blue-300 uppercase tracking-widest mt-2 font-bold">Applying 70:20:10 framework</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-50 z-50 flex justify-center items-start overflow-y-auto font-serif">
            <div className="max-w-6xl w-full bg-white shadow-2xl border-t-8 border-blue-900 p-12 my-12 mx-4 relative min-h-[90vh]">
                
                {/* Official Header */}
                <div className="flex justify-between items-start mb-10 border-b-2 border-slate-100 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <ClipboardDocumentListIcon className="w-8 h-8 text-blue-900" />
                            <h1 className="text-4xl font-black text-blue-900 tracking-tighter uppercase font-serif">Eligible Officers Report</h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Strategic Human Capital Realignment | {agencyName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3 no-print">
                        <div className="flex gap-2">
                             <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-blue-900 transition-all"><PrinterIcon className="w-6 h-6" /></button>
                             <ExportMenu onExport={handleExport as any} />
                             <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-xl transition-all"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="bg-blue-900 text-white px-5 py-2 text-center rounded-lg shadow-lg">
                            <p className="text-[9px] uppercase font-black tracking-widest opacity-60">Learning Model</p>
                            <p className="text-2xl font-bold tracking-tighter">70 : 20 : 10</p>
                        </div>
                    </div>
                </div>

                {/* 70:20:10 Framework Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="border-2 border-slate-100 p-6 rounded-2xl bg-slate-50/50 hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-2 mb-3">
                            <BriefcaseIcon className="w-5 h-5 text-blue-800" />
                            <h3 className="text-blue-900 font-black text-xs uppercase tracking-widest">70% Experiential</h3>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">On-the-job projects, stretch assignments, and specialized task rotations for all verified personnel.</p>
                    </div>
                    <div className="border-2 border-slate-100 p-6 rounded-2xl bg-slate-50/50 hover:border-emerald-200 transition-all group">
                        <div className="flex items-center gap-2 mb-3">
                            <UsersIcon className="w-5 h-5 text-emerald-800" />
                            <h3 className="text-emerald-900 font-black text-xs uppercase tracking-widest">20% Social</h3>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">Internal mentorship and peer coaching links based on Establishment seniority levels.</p>
                    </div>
                    <div className="border-2 border-blue-900 p-6 rounded-2xl bg-blue-50/80 shadow-md transform hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <AcademicCapIcon className="w-5 h-5 text-blue-900" />
                            <h3 className="text-blue-900 font-black text-xs uppercase tracking-widest">10% Formal</h3>
                        </div>
                        <p className="text-[11px] text-blue-900 leading-relaxed font-bold">In-country or Overseas classroom training reserved for strategic, high-priority gaps.</p>
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 italic font-medium text-slate-700 leading-relaxed text-md mb-12 relative font-serif">
                    <span className="absolute top-2 left-4 text-4xl text-blue-200 opacity-50">"</span>
                    {report?.executiveSummary}
                    <span className="absolute bottom-0 right-4 text-4xl text-blue-200 opacity-50">"</span>
                </div>

                {/* Main Personnel Register */}
                <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                            <tr className="bg-blue-900 text-white uppercase text-[10px] tracking-[0.2em] font-black">
                                <th className="p-6">Officer Identity</th>
                                <th className="p-6 text-center">Status / Tenure</th>
                                <th className="p-6">70:20:10 Roadmap</th>
                                <th className="p-6 text-right">Formal Placement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-50 font-sans">
                            {complianceResults.map((officer, idx) => {
                                const rec = report?.eligibleOfficers.find((o: any) => o.name === officer.name);
                                return (
                                    <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${!officer.isEligible ? 'bg-slate-50/30 grayscale opacity-60' : ''}`}>
                                        <td className="p-6">
                                            <p className="font-black text-slate-900 text-[14px] font-serif">{officer.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">{officer.position} • Grade {officer.grade}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                {officer.isEligible ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full border border-emerald-100 tracking-widest shadow-sm">
                                                        <CheckCircleIcon className="w-3 h-3 inline mr-1" /> Eligible
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[9px] font-black uppercase rounded-full border border-rose-100 tracking-widest shadow-sm">
                                                        <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" /> Disqualified
                                                    </span>
                                                )}
                                                <p className="text-[10px] text-slate-500 font-bold mt-1">{officer.tenureYears} Years Served</p>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">{officer.complianceReason}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {officer.isEligible && rec ? (
                                                <div className="space-y-4 max-w-sm">
                                                    <div className="flex gap-3">
                                                        <div className="w-1 bg-blue-900 shrink-0"></div>
                                                        <p className="text-slate-700 leading-tight">
                                                            <span className="text-[9px] font-black uppercase text-blue-900 block mb-0.5">10% Formal Pathway</span>
                                                            <span className="font-bold text-blue-900">{rec.path10}</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="w-1 bg-emerald-600 shrink-0"></div>
                                                        <p className="text-slate-600 leading-tight">
                                                            <span className="text-[9px] font-black uppercase text-emerald-600 block mb-0.5">20% Social/Mentorship</span>
                                                            {rec.path20}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="w-1 bg-slate-300 shrink-0"></div>
                                                        <p className="text-slate-600 leading-tight">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">70% Workplace Tasking</span>
                                                            {rec.path70}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 border-2 border-dashed border-slate-100 rounded-xl text-center italic text-slate-400 text-xs font-medium">
                                                    Pathway Generation Deferred
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-right align-top">
                                            {officer.isEligible && rec ? (
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-black text-blue-900 uppercase tracking-tighter">{rec.locationPreference || 'Sector-Specific'}</p>
                                                    <p className="text-[11px] font-black text-slate-900">{rec.formalBudgetPGK}</p>
                                                    <div className="pt-2">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Strategic Placement</span>
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase truncate max-w-[120px] inline-block">{rec.strategicRationale}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-slate-200 font-black text-xl">K 0.00</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Official Footer/Sign-off */}
                <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-200 flex justify-between items-end text-[10px] text-slate-400 uppercase tracking-[0.2em] font-sans">
                    <div className="space-y-1">
                        <p className="font-black text-slate-500">Official Personnel Audit Record</p>
                        <p>Department of Personnel Management</p>
                        <p>Independent State of Papua New Guinea</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="font-black text-blue-900">Authentication Key: {authKey}</p>
                        <p>Generated: {new Date().toLocaleDateString()}</p>
                        <p className="opacity-60 italic">Confidential National Document</p>
                    </div>
                </div>

                {/* Aesthetic Seal Overlay */}
                <div className="absolute top-12 right-12 opacity-5 pointer-events-none">
                    <ScaleIcon className="w-64 h-64 text-blue-900 rotate-[-15deg]" />
                </div>
            </div>
        </div>
    );
};
