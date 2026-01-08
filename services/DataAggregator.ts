import { OfficerRecord, EstablishmentRecord, WorkforceLifecycleStage, QUESTION_TEXT_MAPPING } from '../types';

export interface Discrepancy {
    type: 'Gender Mismatch' | 'Data Missing' | 'Name Variation';
    officerName: string;
    positionNumber: string;
    details: string;
}

export interface AggregatedData {
    totalPositions: number; // Authorized Ceiling
    onStrength: number;     // Filled in Register
    vacantPositions: number; // Unfilled in Register
    filledPositions: number; // For snapshot consistency
    cnaParticipants: number; // Survey Respondents (Unique People)
    totalResponses: number;  // Raw Survey Records (imported total)
    vacancyRate: number;
    participationRate: number; // Unique Participants / OnStrength
    baselineScore: number;
    skillGapsCount: number;
    qualificationGapsCount: number;
    retirementRiskCount: number;
    dataIntegrityScore: number;
    gapSector: { name: string; score: number };
    peakSector: { name: string; score: number };
    divisionStats: Record<string, {
        ceiling: number;
        actual: number; // Filled positions from register
        filledByCna: number; // Participants who actually took the survey
        skillGaps: number;
        qualGaps: number;
    }>;
    lifecycleDistribution: Record<WorkforceLifecycleStage, number>;
    discrepancies: Discrepancy[];
    genderPillarAnalysis: Record<string, { maleAvg: number; femaleAvg: number; avg: number; maleCount: number; femaleCount: number }>;
    gesiMetrics: {
        femaleSeniorityRate: number;
        disabilityInclusionCount: number;
        gesiAwarenessScore: number;
    };
}

export class DataAggregator {
    static assessGapType(officer: OfficerRecord): 'Skill' | 'Qualification' | 'Aligned' {
        const attainedQual = (officer.jobQualification || '').toLowerCase();
        const gradeNum = parseInt(officer.grade.match(/\d+/)?.[0] || '0');
        
        const needsDegree = gradeNum >= 14 && !attainedQual.includes('degree') && !attainedQual.includes('bachelor');
        const needsMasters = gradeNum >= 18 && !attainedQual.includes('masters') && !attainedQual.includes('post');
        
        if (needsDegree || needsMasters) return 'Qualification';
        if (officer.capabilityRatings.some(r => r.currentScore < 7)) return 'Skill';

        return 'Aligned';
    }

    static process(officers: OfficerRecord[], establishment: EstablishmentRecord[], totalRawResponses?: number): AggregatedData {
        const totalPositions = establishment.length;
        const divisionStats: Record<string, any> = {};
        const establishmentLookup = new Map<string, EstablishmentRecord>();

        // GESI Specific Variables
        let seniorFemaleCount = 0;
        let seniorTotalCount = 0;
        let gesiAwarenessTotal = 0;
        let gesiAwarenessCount = 0;
        let inclusionMentions = 0;

        // 1. Initialize divisional stats from Establishment
        establishment.forEach(p => {
            if (!divisionStats[p.division]) {
                divisionStats[p.division] = { ceiling: 0, actual: 0, filledByCna: 0, skillGaps: 0, qualGaps: 0 };
            }
            divisionStats[p.division].ceiling++;
            
            const occ = (p.occupant || '').trim().toUpperCase();
            const isFilled = occ !== '' && occ !== 'VACANT' && !occ.includes('***');
            if (isFilled) divisionStats[p.division].actual++;

            if (p.positionNumber) establishmentLookup.set(p.positionNumber, p);

            // GESI Seniority Logic (Grades 13-20)
            const gradeNum = parseInt(p.grade.match(/\d+/)?.[0] || '0');
            if (gradeNum >= 13) {
                seniorTotalCount++;
                if (p.gen === 'F') seniorFemaleCount++;
            }
        });

        const onStrength = establishment.filter(p => {
            const occ = (p.occupant || '').trim().toUpperCase();
            return occ !== '' && occ !== 'VACANT' && !occ.includes('***');
        }).length;

        const vacantPositions = totalPositions - onStrength;
        const cnaParticipants = officers.length; // Unique count
        const totalResponses = totalRawResponses || cnaParticipants;
        const participationRate = onStrength > 0 ? (cnaParticipants / onStrength) : 0;

        let skillGapsTotal = 0;
        let qualGapsTotal = 0;
        let retirementRisk = 0;
        const discrepancies: Discrepancy[] = [];

        const lifecycleDistribution: Record<WorkforceLifecycleStage, number> = {
            'Recruitment/Entry': 0, 'Early Career': 0, 'Career Progression': 0, 'Leadership Track': 0, 'Exit/Retirement Prep': 0
        };

        const pillars = ['Strategic Alignment', 'Operational Effectiveness', 'Leadership', 'Performance Management', 'ICT Capability', 'Public Finance Management'];
        const pillarCodes = ['A', 'B', 'C', 'D', 'E', 'F'];
        const genderPillarAnalysis: Record<string, any> = {};
        pillars.forEach(p => genderPillarAnalysis[p] = { maleTotal: 0, femaleTotal: 0, maleCount: 0, femaleCount: 0, totalScore: 0, totalCount: 0 });

        // 2. Process CNA Survey Data
        officers.forEach(o => {
            const gapType = this.assessGapType(o);
            if (gapType === 'Skill') skillGapsTotal++;
            if (gapType === 'Qualification') qualGapsTotal++;
            
            if (divisionStats[o.division]) {
                divisionStats[o.division].filledByCna++;
                if (gapType === 'Skill') divisionStats[o.division].skillGaps++;
                if (gapType === 'Qualification') divisionStats[o.division].qualGaps++;
            }

            if (o.age && o.age >= 55) retirementRisk++;
            if (o.lifecycleStage) lifecycleDistribution[o.lifecycleStage]++;

            // GESI Awareness (Code B2) & Inclusion Mentions
            const b2Rating = o.capabilityRatings.find(r => r.questionCode === 'B2');
            if (b2Rating) {
                gesiAwarenessTotal += b2Rating.currentScore;
                gesiAwarenessCount++;
            }

            const trainingPrefs = o.trainingPreferences.join(' ').toLowerCase();
            if (trainingPrefs.includes('disability') || trainingPrefs.includes('inclusion')) {
                inclusionMentions++;
            }

            // Cross-validation
            if (o.positionNumber && establishmentLookup.has(o.positionNumber)) {
                const est = establishmentLookup.get(o.positionNumber)!;
                const estGender = est.gen === 'M' ? 'Male' : est.gen === 'F' ? 'Female' : undefined;
                if (o.gender && estGender && o.gender !== estGender) {
                    discrepancies.push({
                        type: 'Gender Mismatch',
                        officerName: o.name,
                        positionNumber: o.positionNumber,
                        details: `Survey: ${o.gender} vs Register: ${estGender}`
                    });
                }
            }

            // Pillar Scoring
            pillarCodes.forEach((code, idx) => {
                const pillarName = pillars[idx];
                const ratings = o.capabilityRatings.filter(r => r.questionCode.startsWith(code));
                if (ratings.length > 0) {
                    const avg = ratings.reduce((sum, r) => sum + r.currentScore, 0) / ratings.length;
                    genderPillarAnalysis[pillarName].totalScore += avg;
                    genderPillarAnalysis[pillarName].totalCount++;
                    if (o.gender === 'Male') {
                        genderPillarAnalysis[pillarName].maleTotal += avg;
                        genderPillarAnalysis[pillarName].maleCount++;
                    } else if (o.gender === 'Female') {
                        genderPillarAnalysis[pillarName].femaleTotal += avg;
                        genderPillarAnalysis[pillarName].femaleCount++;
                    }
                }
            });
        });

        // 3. Finalize Analytics
        const finalizedPillarAnalysis: Record<string, { maleAvg: number; femaleAvg: number; avg: number; maleCount: number; femaleCount: number }> = {};
        let totalCnaAvg = 0;
        let pCount = 0;

        Object.entries(genderPillarAnalysis).forEach(([pillar, stats]: [string, any]) => {
            const avg = stats.totalCount > 0 ? stats.totalScore / stats.totalCount : 0;
            finalizedPillarAnalysis[pillar] = {
                maleAvg: stats.maleCount > 0 ? stats.maleTotal / stats.maleCount : 0,
                femaleAvg: stats.femaleCount > 0 ? stats.femaleTotal / stats.femaleCount : 0,
                avg, maleCount: stats.maleCount, femaleCount: stats.femaleCount
            };
            if (avg > 0) { totalCnaAvg += avg; pCount++; }
        });

        const sortedPillars = Object.entries(finalizedPillarAnalysis)
            .filter(([, v]) => v.avg > 0)
            .sort((a, b) => a[1].avg - b[1].avg);

        const dataIntegrityScore = totalPositions > 0 ? ((totalPositions - discrepancies.length) / totalPositions) * 100 : 100;

        return {
            totalPositions, onStrength, vacantPositions, filledPositions: onStrength, cnaParticipants, totalResponses,
            vacancyRate: totalPositions > 0 ? (vacantPositions / totalPositions) * 100 : 0,
            participationRate,
            baselineScore: pCount > 0 ? totalCnaAvg / pCount : 0,
            skillGapsCount: skillGapsTotal, qualificationGapsCount: qualGapsTotal,
            retirementRiskCount: retirementRisk, dataIntegrityScore,
            gapSector: sortedPillars.length > 0 ? { name: sortedPillars[0][0], score: sortedPillars[0][1].avg } : { name: 'N/A', score: 0 },
            peakSector: sortedPillars.length > 0 ? { name: sortedPillars[sortedPillars.length - 1][0], score: sortedPillars[sortedPillars.length - 1][1].avg } : { name: 'N/A', score: 0 },
            divisionStats, lifecycleDistribution, discrepancies, genderPillarAnalysis: finalizedPillarAnalysis,
            gesiMetrics: {
                femaleSeniorityRate: seniorTotalCount > 0 ? (seniorFemaleCount / seniorTotalCount) * 100 : 0,
                disabilityInclusionCount: inclusionMentions,
                gesiAwarenessScore: gesiAwarenessCount > 0 ? gesiAwarenessTotal / gesiAwarenessCount : 0
            }
        };
    }
}