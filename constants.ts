
export const INITIAL_CNA_DATASET: any[] = [];
export const STRATEGIC_CONTEXT_DEFAULT = "To be updated with organization specific context.";

export const AI_TALENT_SEGMENTATION_REPORT_PROMPT_INSTRUCTIONS = `
Act as a Strategic Human Capital Analyst for the PNG Public Service.
Generate a high-fidelity 'Talent Segmentation Report' using the International 9-Box Grid Standard.

**DEEP SCAN MISSION:**
Analyze the provided CNA dataset and Establishment Register to create a 'Prescriptive Action Plan' for key employees.

**PRESCRIPTIVE LOGIC (10:20:70 Rule):**
1. **Top Talent (Stars):** IF Eligible (Gate Check: Permanent Status AND 2+ Years Service), assign 'Formal Training - Overseas (10%)'. 
2. **Key Contributors:** Assign 'Peer Mentorship (20%)' to facilitate institutional knowledge transfer.
3. **Future Leaders:** Identify their next higher grade vacant position from the Register and list as 'Target Succession Role'.
4. **Disqualified / Ineligible:** If an officer in a high-potential segment has < 2 years tenure or Non-Permanent status, DOWNGRADE the suggestion to 'In-House Coaching / On-the-Job (70%)'.

**ELIGIBILITY GATE:**
- Mandatory: 24 months permanent service is the threshold for any overseas nomination.

**OUTPUT REQUIREMENTS:**
1. **Executive Summary:** Overview of talent density.
2. **Strategic Insight:** Rationale for the current segmentation.
3. **Prescriptive Actions:** An array of specific objects for highlighted employees following the rules above.

**TONE:** Official, authoritative, data-driven.
`;

export const INFORMAL_TRAINING_TYPES_CONTEXT = `
- Job rotation
- Stretch assignments
- Peer coaching
- Internal mentoring
- Communities of practice
- Project shadowing
- Task diversification
`;

export const PERFORMANCE_APPRAISAL_COMPETENCIES_CONTEXT = `
Analyze competency against the PNG National Performance Framework focusing on:
- Strategic Alignment
- Leadership
- Public Finance Management
- ICT & Digital Literacy
- Ethical Conduct
`;

export const SDG_ALIGNMENT_CONTEXT = `
Align recommendations with UN Sustainable Development Goals, particularly:
- Goal 5: Gender Equality
- Goal 8: Decent Work and Economic Growth
- Goal 16: Peace, Justice and Strong Institutions
`;

export const MTDP4_ALIGNMENT_CONTEXT = `
Ensure consistency with Medium Term Development Plan IV (MTDP IV) Strategic Priority Areas.
`;

export const AI_LEARNING_INTERPRETATION_GUIDE = `
Prioritize 70% Experiential and 20% Social learning pathways to ensure sustainable capacity building within the PNG context.
`;

export const AI_INDIVIDUAL_DEVELOPMENT_PLAN_PROMPT_INSTRUCTIONS = `
You are a career development specialist. Generate a personalized growth plan for the officer based on their workforce lifecycle stage and identified capability gaps. Use the 70:20:10 model.
`;

export const AI_FIVE_YEAR_PLAN_PROMPT_INSTRUCTIONS = `
Act as a workforce planning strategist. Generate a 5-year strategic roadmap for capability development, identifying long-term targets and necessary interventions.
`;

export const AI_COMPETENCY_REPORT_PROMPT_INSTRUCTIONS = `
Analyze workforce proficiency across core competency domains. Highlight areas of high risk and potential for leadership transition.
`;

export const AI_GAP_ANALYSIS_REPORT_PROMPT_INSTRUCTIONS = `
Conduct a thorough gap analysis, distinguishing between academic qualification needs and functional skill deficiencies.
`;

export const AI_STRATEGIC_RECOMMENDATIONS_REPORT_PROMPT_INSTRUCTIONS = `
Provide high-level strategic advice for organizational restructuring and human capital investment alignment.
`;

export const AI_TALENT_CARD_REPORT_PROMPT_INSTRUCTIONS = `
Generate a concise talent diagnostic summary for individual personnel, focusing on performance trajectory and growth potential.
`;

export const AI_WORKFORCE_SNAPSHOT_PROMPT_INSTRUCTIONS = `
Generate a high-level strategic snapshot of the current workforce strength, risks, and alignment with national priorities.
`;

export const AI_DETAILED_CAPABILITY_REPORT_PROMPT_INSTRUCTIONS = `
Perform a granular, item-level analysis of all capability questionnaire responses to pinpoint specific operational bottlenecks.
`;

export const AI_JOB_GROUP_TRAINING_NEEDS_PROMPT_INSTRUCTIONS = `
Categorize and analyze training needs by functional job groups to support specialized professional development pathways.
`;

export const AI_ANNUAL_TRAINING_PLAN_PROMPT_INSTRUCTIONS = `
Construct a detailed annual training operational plan, including prioritization, quarterly scheduling, and resource allocation suggestions.
`;

export const AI_CONSOLIDATED_STRATEGIC_PLAN_PROMPT_INSTRUCTIONS = `
Synthesize all organizational findings into a single consolidated strategic plan for senior executive review.
`;

export const AI_TRAINING_CATEGORY_PROMPT_INSTRUCTIONS = `
Provide a deep-dive analysis into the "{CATEGORY_NAME}" training domain, mapping it to all grades of the public service.
`;

export const AI_TRAINING_PLAN_PROMPT_INSTRUCTIONS = `
General training plan generation prompt for broad capability uplift initiatives.
`;

export const AI_AUTOMATED_LND_RECOMMENDATIONS_PROMPT_INSTRUCTIONS = `
Automate the generation of personalized 70:20:10 learning solutions based on individual officer capability gaps.
`;

export const AI_ELIGIBLE_OFFICERS_REPORT_PROMPT_INSTRUCTIONS = `
Identify and list officers eligible for nomination to formal training based on tenure, performance, and status criteria.
`;

export const AI_KRA_ALIGNMENT_REPORT_PROMPT_INSTRUCTIONS = `
Evaluate organizational alignment with defined Key Result Areas (KRAs) and identify strategic staffing risks.
`;

export const AI_AUTOMATED_ELIGIBILITY_FORM_PROMPT_INSTRUCTIONS = `
Automatically populate the standard eligibility verification form using register and survey data.
`;

export const AI_AUTOMATED_ESTABLISHMENT_SUMMARY_PROMPT_INSTRUCTIONS = `
Aggregate register data to provide an accurate summary of staff on strength vs authorized ceiling.
`;

export const AI_ORGANISATIONAL_STRUCTURE_REPORT_PROMPT_INSTRUCTIONS = `
Analyze the reporting hierarchy to identify potential functional duplications or structural inefficiencies.
`;

export const AI_AUTOMATED_DESIRED_EXPERIENCE_PROMPT_INSTRUCTIONS = `
Analyze career paths to suggest high-impact experiential work assignments for targeted job groups.
`;

export const AI_AUTOMATED_JOB_GROUP_KNOWLEDGE_PROMPT_INSTRUCTIONS = `
Identify educational and academic knowledge improvement programs for specialized functional groups.
`;

export const AI_AUTOMATED_INDIVIDUAL_LND_PLANS_PROMPT_INSTRUCTIONS = `
Bulk generate individual development plans for the entire workforce based on aggregated gap data.
`;

export const AI_AUTOMATED_INDIVIDUAL_PLANS_V2_PROMPT_INSTRUCTIONS = `
Generate high-fidelity individual plans using the version 2 reporting schema.
`;

export const AI_ORGANISATIONAL_ESTABLISHMENT_REPORT_PROMPT_INSTRUCTIONS = `
Generate a formal organizational establishment report with detailed personnel breakdowns by division.
`;

export const AI_QUALIFICATION_COMPARISON_PROMPT_INSTRUCTIONS = `
Audit officer credentials against position requirements to identify academic gaps or overqualification.
`;

export const AI_SUCCESSION_PLAN_REPORT_PROMPT_INSTRUCTIONS = `
Construct a leadership succession roadmap, identifying potential candidates for critical senior roles.
`;

export const AI_GESI_ANALYSIS_REPORT_PROMPT_INSTRUCTIONS = `
Evaluate organizational health against Gender Equity and Social Inclusion (GESI) benchmarks.
`;
