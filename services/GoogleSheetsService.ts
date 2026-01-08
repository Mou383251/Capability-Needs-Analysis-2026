import { transformSheetDataForCharts } from '../utils/chartUtils';

export class GoogleSheetsService {
    /**
     * fetchSurveyData
     * Communicates with the backend proxy to securely fetch Google Sheet data.
     * This avoids CORS "Failed to fetch" errors.
     */
    static async fetchSurveyData(spreadsheetId: string) {
        const PROXY_URL = '/api/fetch-google-sheets';
        
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ spreadsheetId }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Returns the specific error message from the backend (e.g. permission guidance)
                throw new Error(result.error || `Error ${response.status}: ${response.statusText}`);
            }

            if (!result.success) {
                throw new Error(result.error || 'Connection to Cloud Terminal failed.');
            }

            return result.data;
        } catch (error: any) {
            console.error("GoogleSheetsService Error:", error);
            throw error;
        }
    }

    /**
     * fetchAndTransformForChart
     * Helper to get data and immediately prepare it for visualization.
     */
    static async fetchAndTransformForChart(spreadsheetId: string, columnName: string) {
        const rawData = await this.fetchSurveyData(spreadsheetId);
        return transformSheetDataForCharts(rawData, columnName);
    }
}