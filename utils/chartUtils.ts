/**
 * transformSheetDataForCharts
 * Converts raw JSON rows from Google Sheets into a categorized frequency or distribution array.
 * 
 * @param rawData Array of objects (rows from the sheet)
 * @param columnName The exact header name to aggregate
 * @returns Array of { category: string, score: number }
 */
export const transformSheetDataForCharts = (
    rawData: any[], 
    columnName: string
): { category: string, score: number }[] => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return [];

    // 1. Identify if data is mostly numerical or categorical
    const samples = rawData
        .map(row => row[columnName])
        .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
        .slice(0, 10);

    const isNumerical = samples.length > 0 && samples.every(s => !isNaN(parseFloat(s)));

    if (isNumerical) {
        return calculateNumericalDistribution(rawData, columnName);
    } else {
        return calculateCategoricalFrequencies(rawData, columnName);
    }
};

/**
 * Counts occurrences of each unique string value.
 */
const calculateCategoricalFrequencies = (rawData: any[], columnName: string) => {
    const frequencyMap = rawData.reduce((acc: Map<string, number>, row: any) => {
        const rawValue = row[columnName];
        
        if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
            return acc;
        }

        const normalizedValue = String(rawValue).trim();
        acc.set(normalizedValue, (acc.get(normalizedValue) || 0) + 1);
        
        return acc;
    }, new Map<string, number>());

    return Array.from(frequencyMap.entries())
        .map(([category, score]) => ({ category, score }))
        .sort((a, b) => b.score - a.score);
};

/**
 * Groups numbers into logical buckets or keeps them as discrete values if range is small.
 */
const calculateNumericalDistribution = (rawData: any[], columnName: string) => {
    const values = rawData
        .map(row => parseFloat(row[columnName]))
        .filter(val => !isNaN(val));

    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // If range is small (e.g., 1-10 scale), treat as discrete categories
    if (max - min <= 10) {
        const counts: Record<string, number> = {};
        values.forEach(v => {
            const label = v.toString();
            counts[label] = (counts[label] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([category, score]) => ({ category, score }))
            .sort((a, b) => parseFloat(a.category) - parseFloat(b.category));
    }

    // Otherwise, bucket into 5 ranges
    const bucketSize = (max - min) / 5;
    const buckets: Record<string, number> = {};
    
    for (let i = 0; i < 5; i++) {
        const start = min + (i * bucketSize);
        const end = min + ((i + 1) * bucketSize);
        const label = `${start.toFixed(0)}-${end.toFixed(0)}`;
        buckets[label] = values.filter(v => v >= start && v < (i === 4 ? end + 1 : end)).length;
    }

    return Object.entries(buckets).map(([category, score]) => ({ category, score }));
};
