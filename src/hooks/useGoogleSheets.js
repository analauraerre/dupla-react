import { useCallback, useRef } from 'react';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API  = 'https://www.googleapis.com/drive/v3/files';
const SPREADSHEET_NAME = 'Dupla - Finanzas';
const RANGE = 'Sheet1!A1';

/**
 * Finds or creates the "Dupla - Finanzas" spreadsheet in the user's Drive.
 * Returns the spreadsheet ID.
 */
async function findOrCreateSpreadsheet(token) {
  // Search for existing spreadsheet
  const q = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchRes = await fetch(`${DRIVE_API}?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title: SPREADSHEET_NAME },
      sheets: [{ properties: { title: 'Sheet1' } }]
    })
  });
  const createData = await createRes.json();
  return createData.spreadsheetId;
}

/**
 * Loads app data from the spreadsheet cell A1 (stored as JSON string).
 */
async function loadFromSheet(token, spreadsheetId) {
  const res = await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${RANGE}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const raw = data.values?.[0]?.[0];
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Saves app data to spreadsheet cell A1 as a JSON string.
 */
async function saveToSheet(token, spreadsheetId, appData) {
  await fetch(
    `${SHEETS_API}/${spreadsheetId}/values/${RANGE}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        range: RANGE,
        majorDimension: 'ROWS',
        values: [[JSON.stringify(appData)]]
      })
    }
  );
}

/**
 * Custom hook that exposes load/save operations for Google Sheets.
 * Handles spreadsheet ID caching in localStorage.
 */
export function useGoogleSheets(token) {
  const sheetIdRef = useRef(localStorage.getItem('dupla_sheet_id') || null);

  const ensureSheet = useCallback(async () => {
    if (!token) throw new Error('No token');
    if (!sheetIdRef.current) {
      const id = await findOrCreateSpreadsheet(token);
      sheetIdRef.current = id;
      localStorage.setItem('dupla_sheet_id', id);
    }
    return sheetIdRef.current;
  }, [token]);

  const load = useCallback(async () => {
    const id = await ensureSheet();
    return loadFromSheet(token, id);
  }, [token, ensureSheet]);

  const save = useCallback(async (appData) => {
    const id = await ensureSheet();
    return saveToSheet(token, id, appData);
  }, [token, ensureSheet]);

  const resetSheetId = useCallback(() => {
    sheetIdRef.current = null;
    localStorage.removeItem('dupla_sheet_id');
  }, []);

  return { load, save, resetSheetId };
}
