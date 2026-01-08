
import { OfficerRecord, UrgencyLevel, TrainingRecord, CapabilityRating, PerformanceRatingLevel, CurrentScoreCategory, EstablishmentRecord, AgencyType, GapTag } from '../types';
import { getGradingGroup } from './helpers';

// Make XLSX available from the global scope (loaded via script tag)
declare const XLSX: any;

/**
 * Universal Header Mapping Dictionary
 * Maps standard application fields to possible Excel column names (fuzzy matching).
 */
const HEADER_MAPPING: Record<keyof Omit<OfficerRecord, 'capabilityRatings' | 'performanceRatingLevel' | 'misalignmentFlag' | 'gradingGroup' | 'gapTag' | 'gapTagReason'>, string[]> = {
    email: ['email address', 'e-mail', 'email', 'user email', 'electronic mail'],
    name: ['full name', 'officer name', 'name', 'occupant', 'i1', 'employee name', 'staff name', 'fullname'],
    position: ['job title', 'position', 'role', 'designation', 'i4', 'post title', 'functional role'],
    positionNumber: ['position no.', 'position no', 'position number', 'pos no.', 'pos no', 'position id', 'post number', 'establishment id'],
    division: ['business unit', 'division', 'department', 'directorate', 'division/section', 'i6', 'branch', 'section', 'unit'],
    grade: ['position grade', 'job grade', 'grade', 'level', 'classification', 'i5', 'ps grade', 'salary level'],
    spaRating: ['spa rating', 'performance rating', 'spa score', 'most attained spa rating', 'spa', 'i12', 'performance score'],
    technicalCapabilityGaps: ['technical capability gaps', 'technical gaps', 'skill gaps', 'functional gaps'],
    leadershipCapabilityGaps: ['leadership capability gaps', 'leadership gaps', 'management gaps'],
    ictSkills: ['ict skills', 'it skills', 'digital literacy', 'computing skills'],
    trainingHistory: ['training history', 'completed training', 'past courses', 'learning records'],
    trainingPreferences: ['training preferences', 'learning preferences', 'desired training', 'interest areas'],
    urgency: ['urgency level', 'urgency', 'priority', 'status urgency'],
    nextTrainingDueDate: ['next training due date', 'training due date', 'next training due', 'target review date'],
    age: ['age', 'i2', 'years of age'],
    gender: ['gender', 'sex', 'm/f'],
    dateOfBirth: ['date of birth', 'dob', 'i3', 'birthdate'],
    jobQualification: ['job qualification', 'qualification', 'highest qualification', 'i8', 'i11', 'attained degree', 'credentials'],
    commencementDate: ['commencement date', 'start date', 'i10', 'entry date', 'appointment date'],
    yearsOfExperience: ['years of experience', 'experience', 'i9', 'service length', 'tenure'],
    employmentStatus: ['employment status', 'status', 'i7', 'contract type'],
    fileNumber: ['file number', 'filenumber', 'pf number', 'personnel file'],
    lifecycleStage: ['lifecycle stage', 'lifecycle', 'career phase'],
    retirementEligibilityDate: ['retirement eligibility date', 'retirement date', 'exit date'],
    promotionEligibilityStatus: ['promotion eligibility status', 'promotion status', 'ready for promo'],
    tnaProcessExists: ['h1', 'tna exists'],
    tnaAssessmentMethods: ['h3', 'tna methods'],
    tnaProcessDocumented: ['h4', 'tna documented'],
    tnaDesiredCourses: ['h7', 'future training'],
    tnaInterestedTopics: ['h8', 'learning topics'],
    tnaPriorities: ['h9', 'top training needs'],
};

/**
 * Robust Fuzzy Header Matcher
 */
const findHeader = (headers: string[], possibleNames: string[]): string | null => {
    const trimmedHeaders = headers.map(h => String(h || '').trim().toLowerCase());
    
    // 1. Try Exact Matches
    for (const name of possibleNames) {
        const foundIndex = trimmedHeaders.indexOf(name.toLowerCase());
        if (foundIndex > -1) return headers[foundIndex];
    }

    // 2. Try Partial/Fuzzy Matches using regex boundaries
    for (const name of possibleNames) {
        const escapedName = name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        const regex = new RegExp(`\\b${escapedName}\\b`, 'i');
        const foundIndex = headers.findIndex(h => regex.test(String(h || '').trim()));
        if (foundIndex > -1) return headers[foundIndex];
    }

    // 3. Fallback to includes
    for (const name of possibleNames) {
        const lowerName = name.toLowerCase();
        const foundIndex = trimmedHeaders.findIndex(h => h.includes(lowerName));
        if (foundIndex > -1) return headers[foundIndex];
    }

    return null;
};

const parseArrayString = (value: any): string[] => {
    if (typeof value !== 'string' || !value.trim()) return [];
    return value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
};

const parseBoolean = (value: any): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lowerVal = value.trim().toLowerCase();
        if (['yes', 'true', '1', 'y', 't'].includes(lowerVal)) return true;
        if (['no', 'false', '0', 'n', 'f'].includes(lowerVal)) return false;
    }
    return undefined;
};

const parseTrainingHistory = (value: any): TrainingRecord[] => {
    if (typeof value !== 'string' || !value.trim()) return [];
    const records: TrainingRecord[] = [];
    const entries = value.split(',');
    const regex = /(.*) \((....-..-..)\)/;

    for (const entry of entries) {
        const match = entry.trim().match(regex);
        if (match) {
            records.push({ courseName: match[1].trim(), completionDate: match[2].trim() });
        } else {
            records.push({ courseName: entry.trim(), completionDate: 'N/A' });
        }
    }
    return records;
};

const getPerformanceRatingLevel = (spaRating: string): PerformanceRatingLevel => {
    const rating = parseInt(spaRating, 10);
    if (isNaN(rating)) return 'At Required Level'; // Default for PNG
    switch (rating) {
        case 5: return 'Well Above Required';
        case 4: return 'Above Required';
        case 3: return 'At Required Level';
        case 2: return 'Below Required Level';
        case 1: return 'Well Below Required Level';
        default: return 'Not Rated';
    }
};

const getCurrentScoreCategory = (score: number): CurrentScoreCategory => {
    if (score >= 8) return 'High';
    if (score >= 5) return 'Moderate';
    return 'Low';
};

/**
 * Core Logic Engine: Automated Skill vs. Qualification Tagging
 */
const assessGapTag = (officer: OfficerRecord): { tag: GapTag, reason: string } => {
    const attainedQual = (officer.jobQualification || '').toLowerCase();
    const gradeNum = parseInt(officer.grade.match(/\d+/)?.[0] || '0');
    const allRatings = officer.capabilityRatings;
    const avgScore = allRatings.length > 0 ? allRatings.reduce((s, r) => s + r.currentScore, 0) / allRatings.length : 10;
    
    // 1. Qualification Requirements (PNG PS Standard Heuristics)
    const needsDegree = gradeNum >= 14 && !attainedQual.includes('degree') && !attainedQual.includes('bachelor');
    const needsMasters = gradeNum >= 18 && !attainedQual.includes('masters') && !attainedQual.includes('post');
    const hasQualGap = needsDegree || needsMasters;

    // 2. Skill Requirements
    const hasSkillGap = avgScore < 6.5 || officer.technicalCapabilityGaps.length > 0;

    if (hasQualGap && hasSkillGap) return { tag: '[CRITICAL_GAP]', reason: 'Lacks required formal credential for grade and demonstrates low functional competency.' };
    if (hasQualGap) return { tag: '[QUAL_GAP]', reason: `Attained qualification (${attainedQual || 'None'}) does not meet minimum requirement for Grade ${officer.grade}.` };
    if (hasSkillGap) return { tag: '[SKILL_GAP]', reason: 'Meets qualification standards but requires functional upskilling in core capability domains.' };
    
    return { tag: '[ALIGNED]', reason: 'Meets both academic requirements and functional competency standards.' };
};

const processParsedData = (jsonData: any[], headers: string[], agencyType: AgencyType): { data: OfficerRecord[], preview: any[], headers: string[] } => {
    if (jsonData.length === 0) {
        throw new Error('The imported data is empty or contains no data rows.');
    }

    const resolvedHeaders: Partial<Record<keyof Omit<OfficerRecord, 'capabilityRatings' | 'performanceRatingLevel' | 'misalignmentFlag' | 'gradingGroup' | 'gapTag' | 'gapTagReason'>, string>> = {};
    for (const key in HEADER_MAPPING) {
        const headerKey = key as keyof typeof HEADER_MAPPING;
        const found = findHeader(headers, HEADER_MAPPING[headerKey]);
        if (found) {
            resolvedHeaders[headerKey] = found;
        }
    }
    
    const ratingHeaderRegex = /^([A-G][0-9]{1,2}|H[256])/i;
    const ratingHeaderMappings: { header: string, code: string }[] = [];
    headers.forEach(h => {
        const headerStr = String(h || '').trim();
        const match = headerStr.match(ratingHeaderRegex);
        if (match) {
            ratingHeaderMappings.push({ header: h, code: match[0].toUpperCase() });
        }
    });

    const officerRecords: OfficerRecord[] = jsonData.map((row) => {
        const get = (key: keyof typeof HEADER_MAPPING) => row[resolvedHeaders[key]!] ?? '';

        const urgencyValue = String(get('urgency') || 'Low').trim();
        const urgency = Object.values(UrgencyLevel).includes(urgencyValue as UrgencyLevel) 
            ? (urgencyValue as UrgencyLevel) 
            : UrgencyLevel.Low;
        
        const spaRating = String(get('spaRating')).trim();
        const grade = String(get('grade')).trim();
        const performanceRatingLevel = getPerformanceRatingLevel(spaRating);
        const gradingGroup = getGradingGroup(grade, agencyType);

        const capabilityRatings: CapabilityRating[] = [];
        ratingHeaderMappings.forEach(({ header, code }) => {
            const currentScoreValue = row[header];
            if (currentScoreValue !== null && currentScoreValue !== undefined && String(currentScoreValue).trim() !== '') {
                const currentScore = parseFloat(String(currentScoreValue));
                if (!isNaN(currentScore) && currentScore >= 0 && currentScore <= 10) {
                    const gapScore = 10 - currentScore;
                    let gapCategory: 'No Gap' | 'Minor Gap' | 'Moderate Gap' | 'Critical Gap';
                    if (gapScore <= 1) gapCategory = 'No Gap';
                    else if (gapScore === 2) gapCategory = 'Minor Gap';
                    else if (gapScore >= 3 && gapScore <= 5) gapCategory = 'Moderate Gap';
                    else gapCategory = 'Critical Gap';
                    
                    const currentScoreCategory = getCurrentScoreCategory(currentScore);
                    capabilityRatings.push({
                        questionCode: code,
                        currentScore,
                        realisticScore: 10,
                        gapScore,
                        gapCategory,
                        currentScoreCategory,
                    });
                }
            }
        });

        const spaRatingNum = parseInt(spaRating, 10);
        const avgCapabilityScore = capabilityRatings.length > 0
            ? capabilityRatings.reduce((sum, r) => sum + r.currentScore, 0) / capabilityRatings.length
            : -1;

        let misalignmentFlag: string | undefined = undefined;
        if (avgCapabilityScore !== -1 && !isNaN(spaRatingNum)) {
            if ((spaRatingNum === 4 || spaRatingNum === 5) && avgCapabilityScore < 5) {
                misalignmentFlag = "High performer, low self-assessed capability.";
            } else if ((spaRatingNum === 1 || spaRatingNum === 2) && avgCapabilityScore > 7) {
                misalignmentFlag = "Skilled staff underperforming.";
            }
        }

        const officer: OfficerRecord = {
            email: String(get('email')).trim(),
            name: String(get('name')).trim(),
            position: String(get('position')).trim(),
            division: String(get('division')).trim(),
            grade,
            gradingGroup,
            positionNumber: String(get('positionNumber')).trim() || undefined,
            spaRating,
            performanceRatingLevel,
            capabilityRatings,
            misalignmentFlag,
            technicalCapabilityGaps: parseArrayString(get('technicalCapabilityGaps')),
            leadershipCapabilityGaps: parseArrayString(get('leadershipCapabilityGaps')),
            ictSkills: parseArrayString(get('ictSkills')),
            trainingHistory: parseTrainingHistory(get('trainingHistory')),
            trainingPreferences: parseArrayString(get('trainingPreferences')),
            urgency,
            nextTrainingDueDate: String(get('nextTrainingDueDate')).trim() || undefined,
            age: parseInt(get('age'), 10) || undefined,
            gender: String(get('gender')).toLowerCase().startsWith('m') ? 'Male' : String(get('gender')).toLowerCase().startsWith('f') ? 'Female' : undefined,
            dateOfBirth: String(get('dateOfBirth')).trim() || undefined,
            jobQualification: String(get('jobQualification')).trim() || undefined,
            commencementDate: String(get('commencementDate')).trim() || undefined,
            yearsOfExperience: parseInt(get('yearsOfExperience'), 10) || undefined,
            employmentStatus: String(get('employmentStatus')).trim() || undefined,
            fileNumber: String(get('fileNumber')).trim() || undefined,
            lifecycleStage: String(get('lifecycleStage')).trim() as any || undefined,
            retirementEligibilityDate: String(get('retirementEligibilityDate')).trim() || undefined,
            promotionEligibilityStatus: String(get('promotionEligibilityStatus')).trim() as any || undefined,
            tnaProcessExists: parseBoolean(get('tnaProcessExists')),
            tnaAssessmentMethods: parseArrayString(get('tnaAssessmentMethods')),
            tnaProcessDocumented: parseBoolean(get('tnaProcessDocumented')),
            tnaDesiredCourses: String(get('tnaDesiredCourses')).trim() || undefined,
            tnaInterestedTopics: parseArrayString(get('tnaInterestedTopics')),
            tnaPriorities: String(get('tnaPriorities')).trim() || undefined,
        };

        // Automated Gap Analysis Tagging
        const gapAnalysis = assessGapTag(officer);
        officer.gapTag = gapAnalysis.tag;
        officer.gapTagReason = gapAnalysis.reason;

        return officer;
    });

    return { data: officerRecords, preview: jsonData.slice(0, 60), headers };
};

const ESTABLISHMENT_HEADER_MAPPING: Record<keyof EstablishmentRecord, string[]> = {
    positionNumber: ['position number', 'position no.', 'pos no', 'establishment no', 'post id'],
    division: ['division', 'department', 'business unit', 'description', 'descriptions', 'cost center'],
    grade: ['grade', 'level', 'classification', 'class', 'salary grade'],
    designation: ['designation', 'position title', 'position', 'job title', 'role'],
    occupant: ['occupant', 'name', 'incumbent', 'staff name'],
    status: ['status', 'employment status', 'vacancy status'],
    gen: ['gen', 'gender', 'sex']
};

export const parseCnaFile = (file: File, agencyType: AgencyType): Promise<{ data: OfficerRecord[], preview: any[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                let allRows: any[] = [];
                let commonHeaders: string[] = [];

                workbook.SheetNames.forEach((sheetName, index) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const sheetRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    const sheetHeaders = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
                    
                    if (index === 0) commonHeaders = sheetHeaders;
                    allRows = [...allRows, ...sheetRows];
                });

                resolve(processParsedData(allRows, commonHeaders, agencyType));
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
};

export const parseEstablishmentFile = (file: File, agencyType: AgencyType): Promise<{ data: EstablishmentRecord[] }> => {
     return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                let allRecords: EstablishmentRecord[] = [];

                workbook.SheetNames.forEach((sheetName) => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];
                    
                    if (jsonData.length > 0) {
                        const { data: sheetRecords } = processEstablishmentJson(jsonData, headers, agencyType);
                        allRecords = [...allRecords, ...sheetRecords];
                    }
                });
                
                resolve({ data: allRecords });
            } catch (err) { reject(err); }
        };
        reader.readAsArrayBuffer(file);
    });
};

const processEstablishmentJson = (jsonData: any[], headers: string[], agencyType: AgencyType): { data: EstablishmentRecord[] } => {
    const resolvedHeaders: Partial<Record<keyof EstablishmentRecord, string>> = {};
    for (const key in ESTABLISHMENT_HEADER_MAPPING) {
        const headerKey = key as keyof EstablishmentRecord;
        const found = findHeader(headers, ESTABLISHMENT_HEADER_MAPPING[headerKey]);
        if (found) resolvedHeaders[headerKey] = found;
    }
    
    const establishmentRecords: EstablishmentRecord[] = jsonData.map(row => {
        const get = (key: keyof EstablishmentRecord) => row[resolvedHeaders[key]!] ?? '';
        const occupant = String(get('occupant')).trim();
        const isVacant = occupant.toLowerCase().includes('vacant') || occupant === '' || occupant.includes('***');
        
        return {
            positionNumber: String(get('positionNumber')).trim(),
            division: String(get('division')).trim(),
            grade: String(get('grade')).trim(),
            designation: String(get('designation')).trim(),
            occupant: isVacant ? 'VACANT' : occupant,
            status: isVacant ? 'Vacant' : (['Confirmed', 'Probation', 'Other'].includes(String(get('status'))) ? String(get('status')) as any : 'Confirmed'),
            gen: String(get('gen')).trim().toUpperCase() as any,
        };
    }).filter(r => r.positionNumber);
    
    return { data: establishmentRecords };
};

export const parsePastedData = (pastedText: string, agencyType: AgencyType): Promise<{ data: OfficerRecord[], preview: any[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
        const rows = pastedText.split('\n').map(row => row.split('\t'));
        if (rows.length < 2) return reject(new Error('Pasted data must contain at least a header row.'));
        const headers = rows[0].map(h => h.trim());
        const jsonData = rows.slice(1).map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => { obj[header] = row[index] || ''; });
            return obj;
        });
        resolve(processParsedData(jsonData, headers, agencyType));
    });
};
