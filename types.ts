
export type GradingGroup = 'Junior Officer' | 'Senior Officer' | 'Manager' | 'Senior Management' | 'Other';

export enum UrgencyLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type WorkforceLifecycleStage = 'Recruitment/Entry' | 'Early Career' | 'Career Progression' | 'Leadership Track' | 'Exit/Retirement Prep';

export type AgencyType = "All Agencies" | "National Agency" | "National Department" | "Provincial Administration" | "Provincial Health Authority" | "Local Level Government" | "Other";

export interface TrainingRecord {
  courseName: string;
  completionDate: string;
}

export type CurrentScoreCategory = 'Low' | 'Moderate' | 'High';

export type GapTag = '[QUAL_GAP]' | '[SKILL_GAP]' | '[CRITICAL_GAP]' | '[ALIGNED]';

export interface CapabilityRating {
  questionCode: string;
  currentScore: number;
  realisticScore: 10;
  gapScore: number;
  gapCategory: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap';
  currentScoreCategory: CurrentScoreCategory;
}

export type PerformanceRatingLevel = 'Well Above Required' | 'Above Required' | 'At Required Level' | 'Below Required Level' | 'Well Below Required Level' | 'Not Rated';

export interface OfficerRecord {
  email: string;
  name: string;
  position: string;
  division: string;
  grade: string;
  gradingGroup?: GradingGroup;
  positionNumber?: string;
  spaRating: string;
  performanceRatingLevel: PerformanceRatingLevel;
  capabilityRatings: CapabilityRating[];
  technicalCapabilityGaps: string[];
  leadershipCapabilityGaps: string[];
  ictSkills: string[];
  trainingHistory: TrainingRecord[];
  trainingPreferences: string[];
  urgency: UrgencyLevel;
  nextTrainingDueDate?: string;
  misalignmentFlag?: string;
  age?: number;
  gender?: 'Male' | 'Female';
  dateOfBirth?: string;
  jobQualification?: string;
  commencementDate?: string;
  yearsOfExperience?: number;
  employmentStatus?: string;
  fileNumber?: string;
  lifecycleStage?: WorkforceLifecycleStage;
  retirementEligibilityDate?: string;
  promotionEligibilityStatus?: 'Eligible' | 'Needs Development' | 'Ineligible';
  tnaProcessExists?: boolean;
  tnaAssessmentMethods?: string[];
  tnaProcessDocumented?: boolean;
  tnaDesiredCourses?: string;
  tnaInterestedTopics?: string[];
  tnaPriorities?: string;
  gapTag?: GapTag;
  gapTagReason?: string;
}

export interface TrainingPathwayMilestone {
    year: number;
    competencyHeading: string;
    learningObjectives: string[];
    recommendedModule: string;
    evidenceTag: string; // e.g. [REF-A1]
    verificationStatus: 'Strategically Aligned' | 'Priority Gap' | 'Succession Critical';
}

export interface AiTrainingPathwayReport {
    officerName: string;
    officerId: string;
    executiveRationale: string;
    pathwayTimeline: TrainingPathwayMilestone[];
    evidenceRegistry: { tag: string; sourceDescription: string; metricValue: string }[];
}

export interface StructuredCorporatePlan {
    strategic_goals: {
        vision: string;
        mission: string;
        values: string[];
        objectives: string[];
    };
    training_needs: string;
    financial_context: string;
    risk_assessment: string;
    personnel_establishment: string;
    full_document_context: string;
}

export interface AiLearningSolution {
  experiential70: string;
  social20: string;
  formal10: string;
}

export interface PrescriptiveAction {
    officerName: string;
    segment: string;
    primaryAction: string;
    successionTarget?: string;
    rationale: string;
}

export interface AiTalentSegmentationReport {
    executiveSummary: string;
    strategicInsight: string;
    prescriptiveActions: PrescriptiveAction[];
    stats: {
        unrealized: number;
        futureLeaders: number;
        stars: number;
        inconsistent: number;
        key: number;
        achievers: number;
        risk: number;
        solid: number;
        experts: number;
        core: string;
        hiPo: string;
        atRisk: string;
    };
}

export interface AiReportSummary {
    totalGapsDetected: number;
    criticalGapsCount: number;
    staffCategoryDistribution: { category: string; count: number }[];
    topImprovementAreas: { area: string; reason: string }[];
    concludingIntervention: string;
}

export interface SuccessionCandidate {
    roleOrPosition: string;
    potentialSuccessors: string[];
    readinessLevel: 'Ready Now' | '1-2 Years' | '3-5 Years' | 'Long-term' | string;
    developmentNeeds: string;
    estimatedTimeline: string;
}

export interface CapabilityItemAnalysis {
    questionCode: string;
    questionText: string;
    capabilityCategory: string;
    averageCurrentRating: number;
    realisticRating: number;
    averageGapScore: number;
    gapCategory: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap';
    suggestedLearningMethod: string;
    responseCount: number;
    totalOfficers: number;
}

export interface EstablishmentRecord {
  positionNumber: string;
  division: string;
  grade: string;
  designation: string;
  occupant: string;
  status: 'Confirmed' | 'Vacant' | 'Probation' | 'Other' | string;
  gen: 'M' | 'F' | '';
}

export const QUESTION_TEXT_MAPPING: Record<string, string> = {
    'A1': 'Understanding of the Organization’s Corporate Plan',
    'A2': 'Understanding contribution towards the Organization’s Corporate Objective(s)',
    'A3': 'Understanding how the Corporate Plan aligns with the MTDP IV',
    'B1': 'Knowledge of the Code of Conduct and Values',
    'B2': 'Knowledge of GESI Policy',
    'B3': 'Personal commitment to ethics and integrity',
    'C1': 'Ability to lead and motivate others',
    'C2': 'Experience in strategic decision making',
    'C3': 'Commitment to mentorship and development',
    'D1': 'Performance appraisal and setting KPIs',
    'D2': 'Regular performance reporting and monitoring',
    'E1': 'ICT skills (e.g., word processing, email, internet)',
    'E2': 'Knowledge of digital tools and automation',
    'F1': 'Public Finance Management Knowledge (PFMA)',
    'F2': 'Knowledge of Procurement and Asset Management',
    'G1': 'Effective communication with stakeholders',
    'G2': 'Stakeholder engagement and management',
    'H2': 'Quality of available training programs',
    'H5': 'Alignment of training with job requirements',
    'H6': 'Effectiveness of past training attended'
};

export interface LndFrameworkItem {
    capabilityCategory: string;
    descriptionAndKRA: string;
    develop70: string;
    help20: string;
    formal10: string;
    whoToAttend: string;
    when: string;
    provider: string;
    budget: string;
}

export interface AiLndFrameworkReport {
    executiveSummary: string;
    frameworkPlan: LndFrameworkItem[];
    inductionProgramPlan?: any[];
    skillsAndCompetencyPlan?: any[];
    inCountryShortTermPlan?: any[];
    overseasLongTermPlan?: any[];
}

export interface TrainingNeedCategory {
    category: 'Qualifications & Experience' | 'Skills' | 'Knowledge' | string;
    needs: any[];
}

export interface AiIndividualDevelopmentPlan {
    officerStatus: string;
    age: number;
    lifecycleStage?: string;
    retirementWarning?: string;
    performanceCategory: 'Excellent' | 'Satisfactory' | 'Unsatisfactory' | string;
    promotionPotential: 'Overdue for Promotion' | 'Promotion Now' | 'Needs Development' | 'Not Promotable' | string;
    plan: TrainingNeedCategory[];
}

export interface EmployeeTrainingPlan {
    division: string;
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    proposedCourse: string;
    institution: string;
    fundingSource: string;
    trainingYear: number;
    // Added rationale to fix type errors in FiveYearPlanReport mapping
    rationale: string;
}

export interface AiFiveYearPlan {
    executiveSummary: string;
    trainingPlan: EmployeeTrainingPlan[];
    summary: AiReportSummary;
    successionPlan: SuccessionCandidate[];
}

export interface AiGapAnalysisReport {
    executiveSummary: string;
    prioritizedGaps: any[];
    successionPlan: SuccessionCandidate[];
}

export interface SpaSummary {
    performanceRating: string;
    performanceCategory: PerformanceRatingLevel;
    explanation: string;
}

export interface CapabilityAnalysisItem {
    domain: string;
    currentScore: number;
    gapScore: number;
    learningSolution: AiLearningSolution;
    sdgAlignment: any[];
}

export interface AiProgressionAnalysis {
    currentPositionSkills: string[];
    missingCurrentSkills: string[];
    nextPositionSkills: string[];
    progressionSummary: string;
}

export interface AiTalentCardReport {
    introduction: string;
    employeeId: string;
    division: string;
    spaSummary: SpaSummary;
    capabilityAnalysis: CapabilityAnalysisItem[];
    progressionAnalysis: AiProgressionAnalysis;
    summary: AiReportSummary;
}

export interface AiWorkforceSnapshotReport {
    executiveSummary: string;
    strategicAlignmentInsights: {
        summary: string;
        gesiFocus: string;
        shrmFocus: string;
    };
}

export interface AiDetailedCapabilityReport {
    executiveSummary: string;
    capabilityBreakdown: CapabilityItemAnalysis[];
    summary: AiReportSummary;
    successionPlan: SuccessionCandidate[];
}

export type EligibleOfficerStatus = 'Confirmed' | 'Vacant' | 'Displaced' | 'Acting' | 'Unattached' | 'Probation' | 'Other';

export interface EligibleOfficer {
    id: string;
    branch: string;
    positionNumber: string;
    grade: string;
    designation: string;
    occupant: string;
    status: EligibleOfficerStatus;
    cnaSubmission: 'Yes' | 'No';
    beenSentForStudies: 'Yes' | 'No';
    attendedFurtherTraining: 'Yes' | 'No';
    studiedWhere: string;
    courseDetails: string;
    notes: string;
    trainingQuarters: string;
    trainingYear: number[];
}

export type JobGroupType = '1️⃣ Senior Executive Managers' | '2️⃣ Middle Managers' | '3️⃣ All Line Staff';
export type FundingSourceType = 'TBD' | 'Internal Budget' | 'External' | 'Donor' | 'Other';

export interface DesiredExperienceRecord {
    id: string;
    jobGroup: JobGroupType;
    desiredWorkExperience: string;
    institution: string;
    location: string;
    duration: string;
    fundingSource: FundingSourceType;
    years: number[];
}

export type ThematicProgrammeArea = string;
export type OrgStructure = string;

export interface KraRecord {
    id: string;
    name: string;
    description: string;
    thematicProgrammeArea: ThematicProgrammeArea;
    divisions: string[];
    priorityJobGroups: JobGroupType[];
}

export interface KraJobGroupExample {
    kraArea: string;
    jobExamples: string;
}

export interface KraJobGroupExample {
    kraArea: string;
    jobExamples: string;
}

export interface KraPlanningRecord {
    id: string;
    kraName: string;
    division: string;
    jobGroup: JobGroupType;
    positionTitle: string;
    location: string;
    year: number;
    remarks: string;
}

export type JobGroup = 'Senior Executive Managers' | 'Supervisors' | 'Administration' | 'Finance' | 'Economics' | 'ICT Officers' | 'Field Officers' | 'Executive Secretaries' | 'Support Staff';

export interface JobGroupTrainingNeed {
    jobGroup: JobGroup;
    description: string;
    identifiedNeeds: {
        skill: string;
        rationale: string;
        recommendedYear: number;
    }[];
}

export interface AiJobGroupTrainingNeedsReport {
    executiveSummary: string;
    jobGroupNeeds: JobGroupTrainingNeed[];
    summary: AiReportSummary;
    successionPlan?: SuccessionCandidate[];
}

export type FundingSource = 'Internal Budget' | 'Donor Funded' | 'GoPNG' | 'Other (Specify)';

export interface AnnualTrainingPlanItem {
    division: string;
    fundingSource: string;
    trainingArea: string;
    targetAudience: string;
    deliveryMethod: 'Workshop' | 'Mentoring' | 'On-the-Job' | 'E-Learning' | 'Secondment' | string;
    priority: 'High' | 'Medium' | 'Low' | string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | string;
    estimatedCost: string;
    rationale: string;
}

export interface AiAnnualTrainingPlan {
    executiveSummary: string;
    year: number;
    trainingPlan: AnnualTrainingPlanItem[];
    summary: AiReportSummary;
    successionPlan: SuccessionCandidate[];
}

export interface TrainingFeedback {
    usefulness: 'Very Useful' | 'Useful' | 'Not Useful' | '';
    suggestions: string;
    postTrainingSkillScore: number | '';
    additionalSkillsIdentified: string;
}

export interface TrainingNeedItem {
    proposedCourse: string;
    feedback?: TrainingFeedback;
}

export interface TrainingPathway {
    grade: 'Junior Officer' | 'Senior Officer' | 'Manager' | 'Senior Management' | string;
    description: string;
    recommendedCourses: {
        title: string;
        rationale: string;
        deliveryMethod: string;
    }[];
}

export interface AiTrainingPathwayReport {
    executiveSummary: string;
    pathwaysByGrade: TrainingPathway[];
}

export interface TrainingPlanItem {
    trainingArea: string;
    targetAudience: 'Junior Officer' | 'Senior Officer' | 'Manager' | 'Senior Management' | 'All Staff' | string;
    deliveryMethod: 'Workshop' | 'Mentoring' | 'On-the-Job' | 'E-Learning' | 'Secondment' | string;
    priority: 'High' | 'Medium' | 'Low' | string;
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | string;
    year: number;
    estimatedCost: string;
    rationale: string;
}

export interface AiTrainingPlan {
    executiveSummary: string;
    trainingPlan: TrainingPlanItem[];
}

export type OfficerStatusType = 'Confirmed' | 'Acting' | 'Contract' | 'Probation' | 'Other';
export type LndFormFundingSource = 'Department' | 'GoPNG' | 'Donor' | 'Self-funded';
export type AgeGroupType = '<30' | '30–40' | '41–50' | '>50';
export type PerfLevelType = 'Excellent (86–100%)' | 'Satisfactory (70–85%)' | 'Marginal (50–69%)' | 'Unsatisfactory (0–49%)';
export type PromotionPotentialType = 'Overdue for Promotion' | 'Promotion Now' | 'Needs Development' | 'Not Promotable';
export type TrainingNeedStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';

export interface LndTrainingNeed {
    id: string;
    perceivedArea: string;
    jobRequirement: string;
    proposedCourse: string;
    institution: string;
    fundingSource: string;
    yearOfCommencement: number | '';
    remarks: string;
    status: TrainingNeedStatus;
    priority: TaskPriority;
    learningSolution?: AiLearningSolution;
    gapType?: 'Skill' | 'Qualification';
}

export interface IndividualLndPlanRecord {
    id: string;
    organizationName: string;
    division: string;
    officerName: string;
    positionNumber: string;
    designation: string;
    dateOfBirth: string;
    officerStatus: string;
    highestQualification: string;
    commencementDate: string;
    gradeLevel: string;
    trainingNeeds: {
        longTerm: LndTrainingNeed[];
        shortTerm: LndTrainingNeed[];
    };
    knowledgeChecklist: Record<string, boolean>;
    otherKnowledge: string[];
    ageGroup: string;
    performanceLevel: string;
    promotionPotential: string;
}

export interface LearningRecommendation {
    skillArea: string;
    questionCode: string;
    rating: number;
    category: 'Low' | 'Fair' | 'High';
    recommendation: AiLearningSolution;
}

export interface OfficerAutomatedLndPlan {
    officerName: string;
    officerPosition: string;
    learningRecommendations: LearningRecommendation[];
}

export interface AiAutomatedLndReport {
    executiveSummary: string;
    officerPlans: OfficerAutomatedLndPlan[];
}

export interface LearningInterventions {
    formal10: string;
    social20: string;
    experiential70: string;
}

export interface CompetencyProjection {
    totalRatings: number;
    lowCount: number;
    fairCount: number;
    highCount: number;
    perQuestionAnalysis: any[];
}

export interface CorporatePlanAnalysis {
    averageScore: number;
    classification: 'Low' | 'Average' | 'High';
    topParticipants: any[];
    totalRespondents: number;
    highCount: number;
    averageCount: number;
    lowCount: number;
    lowUnderstandingOfficers: any[];
}

export type JobGroupKnowledgeType = 'Senior Executive Managers' | 'Senior/Middle Managers' | 'Supervisors' | 'All Line Staff' | 'Executive Secretaries';
export type DurationType = 'Less than 6 months' | '6 to 12 months' | '1 to 2 years' | 'More than 2 years';
export type FundingSourceKnowledgeType = 'Department' | 'GoPNG' | 'Donor Agency' | 'Self-funded' | 'Other';

export interface JobGroupKnowledgeRecord {
    id: string;
    jobGroup: JobGroupKnowledgeType;
    educationalProgramme: string;
    institution: string;
    location: string;
    duration: DurationType;
    fundingSource: FundingSourceKnowledgeType;
    years: number[];
}

export interface KraThematicMapping {
    orgStructure: string;
    thematicProgrammeArea: string;
}

export interface HierarchyNode {
    name: string;
    level: string;
    manager: string;
    staffCount: number;
    cnaParticipationRate: number;
    notes?: string;
    children: HierarchyNode[];
}

export interface AiOrganisationalStructureReport {
    executiveSummary: string;
    adaptedHierarchy: HierarchyNode[];
    functionalDuplications: any[];
    structuralGaps: any[];
    recommendations: string[];
}

export interface IndividualLndPlan {
    id: string;
    officer: {
        positionNumber: string;
        division: string;
        grade: string;
        designation: string;
        occupant: string;
        status: string;
    };
    age: number;
    performanceCategory: string;
    promotionPotential: string;
    trainingNeeds: any;
    coreCompetencies: any[];
}

export interface AiOrganisationalEstablishmentReport {
    executiveSummary: string;
    establishmentByDivision: any[];
    summaryStats: {
        totalPositions: number;
        frozenPositions: number;
        filledPositions: number;
        vacantPositions: number;
        averageAge: number;
        averageYearsOfService: number;
    };
    observationsAndRecommendations: string;
}

export interface QualificationComparisonRecord {
    officerId: string;
    officerName: string;
    division: string;
    positionTitle: string;
    positionNumber: string;
    jobRequiredQualification: string;
    officerAttainedQualification: string;
    qualificationMatchStatus: 'Match' | 'Gap' | 'Overqualified' | 'N/A';
    qualificationGapDescription: string;
    recommendationCategory: 'Training' | 'Upskilling' | 'Qualified' | 'Overqualified' | 'Review' | string;
    remarks: string;
}

export interface AiQualificationComparisonReport {
    executiveSummary: string;
    comparisonTable: QualificationComparisonRecord[];
}

export interface AiSuccessionPlanReport {
    executiveSummary: string;
    successionPlan: SuccessionCandidate[];
}

export interface GesiGap {
    description: string;
    type: '[SKILL GAP]' | '[QUALIFICATION GAP]' | '[LEADERSHIP_EQUITY_GAP]';
    riskImplication: string;
    learningSolution: AiLearningSolution;
}

export interface AiGesiAnalysisReport {
    executiveSummary: string;
    equityStats: {
        femaleSeniorityRate: string;
        disabilityInclusionLevel: string;
        overallGesiAwareness: string;
    };
    identifiedGapsAndRisks: GesiGap[];
    successfulBenchmarks: string[];
}

export interface AiEligibleOfficersReport {
    executiveSummary: string;
    eligibleOfficers: {
        branch: string;
        positionNumber: string;
        grade: string;
        designation: string;
        occupant: string;
        status: string;
        cnaSubmission: string;
        beenSentForStudies: string;
        studiedWhere: string;
        courseDetails: string;
        trainingYear: number[];
    }[];
    summary: AiReportSummary;
}
