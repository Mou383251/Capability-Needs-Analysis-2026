const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * transformSheetData: 
 * Maps the first row as headers, trims values, and removes entirely empty rows.
 */
function transformSheetData(rows) {
  if (!rows || rows.length === 0) return [];

  // Sanitize headers from row 0
  const headers = rows[0].map(h => String(h || '').trim());
  
  return rows.slice(1)
    .filter(row => {
      // Gracefully handle empty rows: only include rows that have at least one non-empty cell
      return row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    })
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        const value = row[index];
        // Trim whitespace and handle missing values
        item[header] = (value !== undefined && value !== null) ? String(value).trim() : "";
      });
      return item;
    });
}

/**
 * Backend route to bypass CORS and securely fetch data via Service Account.
 */
app.post('/api/fetch-google-sheets', async (req, res) => {
  const { spreadsheetId } = req.body;

  if (!spreadsheetId) {
    return res.status(400).json({ success: false, error: 'Spreadsheet ID is required.' });
  }

  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set.');
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch data from 'Sheet1' (Assumes standard Google Form output tab name)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:Z', 
    });

    const data = transformSheetData(response.data.values);
    
    res.json({ success: true, data });

  } catch (error) {
    console.error("Google Sheets API Proxy Error:", error);
    
    const saEmail = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}').client_email || "[your-service-account-email]";

    if (error.code === 403 || error.message.toLowerCase().includes('permission')) {
      return res.status(403).json({
        success: false,
        error: `Please share your sheet with ${saEmail} as a Viewer.`
      });
    }

    if (error.code === 404 || error.message.toLowerCase().includes('not found')) {
      return res.status(404).json({
        success: false,
        error: "Spreadsheet not found. Please verify the URL or ID provided."
      });
    }

    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve data. Check permissions or Spreadsheet ID." 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CNA Backend Proxy running on port ${PORT}`);
});