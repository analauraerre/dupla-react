import { parsePersistedAppData, toVersionedPayload } from '../domain/migrations.js';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const SPREADSHEET_NAME = 'Dupla - Finanzas';
const RANGE = 'Sheet1!A1';

async function parseJsonResponse(response, context) {
  if (response.status === 401 || response.status === 403) {
    throw new Error('AUTH_EXPIRED');
  }

  if (!response.ok) {
    throw new Error(`${context}_FAILED_${response.status}`);
  }

  return response.json();
}

async function findOrCreateSpreadsheet(token) {
  const q = encodeURIComponent(`name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const searchRes = await fetch(`${DRIVE_API}?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const searchData = await parseJsonResponse(searchRes, 'DRIVE_SEARCH');

  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  const createRes = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title: SPREADSHEET_NAME },
      sheets: [{ properties: { title: 'Sheet1' } }],
    }),
  });
  const createData = await parseJsonResponse(createRes, 'SHEET_CREATE');
  return createData.spreadsheetId;
}

async function loadRawCell(token, spreadsheetId) {
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}/values/${RANGE}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonResponse(res, 'SHEET_LOAD');
  return data.values?.[0]?.[0] || null;
}

async function saveRawCell(token, spreadsheetId, payload) {
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}/values/${RANGE}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      range: RANGE,
      majorDimension: 'ROWS',
      values: [[JSON.stringify(payload)]],
    }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('AUTH_EXPIRED');
  }

  if (!res.ok) {
    throw new Error(`SHEET_SAVE_FAILED_${res.status}`);
  }
}

export function createGoogleSheetsRepository(token, userId, storage = localStorage) {
  const storageKey = userId ? `dupla_sheet_id_${userId}` : 'dupla_sheet_id';
  let spreadsheetId = storage.getItem(storageKey) || null;

  async function ensureSheet() {
    if (!token) throw new Error('NO_TOKEN');
    if (!spreadsheetId) {
      spreadsheetId = await findOrCreateSpreadsheet(token);
      storage.setItem(storageKey, spreadsheetId);
    }
    return spreadsheetId;
  }

  function getSheetId() { return spreadsheetId; }

  function setManualSheetId(id) {
    spreadsheetId = id || null;
    if (id) storage.setItem(storageKey, id);
    else storage.removeItem(storageKey);
  }

  return {
    getSheetId,
    setManualSheetId,
    async loadAppData() {
      const id = await ensureSheet();
      const raw = await loadRawCell(token, id);

      if (!raw) {
        return parsePersistedAppData(null);
      }

      try {
        return parsePersistedAppData(JSON.parse(raw));
      } catch (error) {
        return {
          ...parsePersistedAppData(null),
          ok: false,
          migrated: false,
          error,
          issues: [{ path: ['Sheet1!A1'], message: 'Invalid JSON stored in Google Sheets' }],
        };
      }
    },

    async saveAppData(appData) {
      const id = await ensureSheet();
      await saveRawCell(token, id, toVersionedPayload(appData));
    },

    resetSheetId() {
      spreadsheetId = null;
      storage.removeItem(storageKey);
    },
  };
}
