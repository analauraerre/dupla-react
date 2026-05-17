// Google Sheets repository — tabs as flat row storage, not as a database.
// Each public method is exactly 1 API call.

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API  = 'https://www.googleapis.com/drive/v3/files';
const SPREADSHEET_NAME = 'Dupla - Finanzas';

// Tab definitions — order matters for batchGet.
export const TAB_DEFS = [
  { name: 'Gastos',         headers: ['id','fecha','descripcion','categoria_id','persona','monto','medio_pago','tarjeta_id','cuotas','recurrente_id','creado_en'] },
  { name: 'Ingresos',       headers: ['id','fecha','descripcion','categoria_id','persona','monto','creado_en'] },
  { name: 'Categorias',     headers: ['id','tipo','nombre','icono','color','bg','presupuesto_base'] },
  { name: 'Tarjetas',       headers: ['id','nombre','limite','dia_cierre'] },
  { name: 'Recurrentes',    headers: ['id','descripcion','monto','categoria_id','persona','medio_pago','tarjeta_id','dia_del_mes','activo','desde'] },
  { name: 'Cuentas',        headers: ['id','nombre','moneda','target'] },
  { name: 'Transacciones',  headers: ['id','cuenta_id','fecha','monto','nota','creado_en'] },
];

// Derived from TAB_DEFS — single source of truth for column ranges.
const DATA_RANGES = TAB_DEFS.map(t => `${t.name}!A2:${colLetter(t.headers.length)}`);

const TAB_HEADERS = Object.fromEntries(TAB_DEFS.map(t => [t.name, t.headers]));

// ── Helpers ───────────────────────────────────────────────────────────────────

function colLetter(n) {
  return String.fromCharCode(64 + n);
}

async function apiFetch(url, options, context) {
  const res = await fetch(url, options);
  if (res.status === 401 || res.status === 403) throw new Error('AUTH_EXPIRED');
  if (!res.ok) throw new Error(`${context}_FAILED_${res.status}`);
  return res.json();
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function zipHeaders(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
  return obj;
}

function parseRows(rows, headers) {
  return (rows || []).map((row, i) => ({
    ...zipHeaders(headers, row),
    _rowIndex: i + 2,
  }));
}

// ── Spreadsheet discovery ──────────────────────────────────────────────────────

async function findOrCreateSpreadsheet(token) {
  const q = encodeURIComponent(
    `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  );
  const search = await apiFetch(
    `${DRIVE_API}?q=${q}&fields=files(id)`,
    { headers: authHeaders(token) },
    'DRIVE_SEARCH'
  );
  if (search.files?.length > 0) return search.files[0].id;

  const created = await apiFetch(SHEETS_API, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      properties: { title: SPREADSHEET_NAME },
      sheets: TAB_DEFS.map(t => ({ properties: { title: t.name } })),
    }),
  }, 'SHEET_CREATE');

  return created.spreadsheetId;
}

// ── Tab structure ──────────────────────────────────────────────────────────────

async function buildSheetIdMap(token, spreadsheetId) {
  const meta = await apiFetch(
    `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`,
    { headers: authHeaders(token) },
    'SHEET_META'
  );
  return Object.fromEntries(
    meta.sheets.map(s => [s.properties.title, s.properties.sheetId])
  );
}

async function ensureStructure(token, spreadsheetId, sheetIdMap) {
  const existing       = new Set(Object.keys(sheetIdMap));
  const missing        = TAB_DEFS.filter(t => !existing.has(t.name));
  const legacySheetId  = sheetIdMap['Sheet1'] ?? null;

  // Nothing to do — all tabs exist and no legacy sheet.
  if (missing.length === 0 && legacySheetId === null) return sheetIdMap;

  // One batchUpdate: create missing tabs + delete Sheet1 legacy (if present).
  // addSheet requests must come BEFORE deleteSheet so the spreadsheet never
  // has 0 sheets (Sheets API rejects that).
  const requests = [
    ...missing.map(t => ({ addSheet: { properties: { title: t.name } } })),
    ...(legacySheetId !== null ? [{ deleteSheet: { sheetId: legacySheetId } }] : []),
  ];

  const batchRes = await apiFetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ requests }),
  }, 'SETUP_TABS');

  // Update map: add new numeric IDs, remove deleted legacy.
  const updated = { ...sheetIdMap };
  missing.forEach((t, i) => {
    updated[t.name] = batchRes.replies[i].addSheet.properties.sheetId;
  });
  if (legacySheetId !== null) delete updated['Sheet1'];

  // Write column headers for newly created tabs.
  if (missing.length > 0) {
    await apiFetch(`${SHEETS_API}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        valueInputOption: 'RAW',
        data: missing.map(t => ({
          range: `${t.name}!A1:${colLetter(t.headers.length)}1`,
          values: [t.headers],
        })),
      }),
    }, 'WRITE_HEADERS');
  }

  return updated;
}

// ── Repository factory ─────────────────────────────────────────────────────────

export function createSheetsRepository(token, userId, storage = localStorage) {
  const storageKey = userId ? `dupla_sheet_id_${userId}` : 'dupla_sheet_id';
  let spreadsheetId = storage.getItem(storageKey) || null;
  let sheetIdMap    = null;  // { tabName: numericSheetId }
  let ready         = false;

  async function ensureReady() {
    if (!token) throw new Error('NO_TOKEN');
    if (ready) return spreadsheetId;

    spreadsheetId = spreadsheetId || await findOrCreateSpreadsheet(token);
    storage.setItem(storageKey, spreadsheetId);

    const raw = await buildSheetIdMap(token, spreadsheetId);
    sheetIdMap = await ensureStructure(token, spreadsheetId, raw);
    ready = true;
    return spreadsheetId;
  }

  return {
    getSheetId() { return spreadsheetId; },

    setManualSheetId(id) {
      spreadsheetId = id || null;
      ready = false;
      sheetIdMap = null;
      if (id) storage.setItem(storageKey, id);
      else storage.removeItem(storageKey);
    },

    // Returns array of parsed tab objects: { tabName, rows: [{...fields, _rowIndex}] }
    async loadAll() {
      const id = await ensureReady();
      const res = await apiFetch(
        `${SHEETS_API}/${id}/values:batchGet?${DATA_RANGES.map(r => `ranges=${encodeURIComponent(r)}`).join('&')}`,
        { headers: authHeaders(token) },
        'BATCH_GET'
      );
      return TAB_DEFS.map((t, i) => ({
        tabName: t.name,
        rows: parseRows(res.valueRanges?.[i]?.values, t.headers),
      }));
    },

    // Append a single row to a tab. obj keys must match TAB_HEADERS[tabName].
    async appendRow(tabName, obj) {
      const headers = TAB_HEADERS[tabName];
      const values  = headers.map(h => String(obj[h] ?? ''));
      await apiFetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ range: `${tabName}!A1`, majorDimension: 'ROWS', values: [values] }),
        },
        'APPEND_ROW'
      );
    },

    // Append multiple rows to a tab in one call.
    async appendRows(tabName, objArray) {
      if (!objArray.length) return;
      const headers = TAB_HEADERS[tabName];
      const values  = objArray.map(obj => headers.map(h => String(obj[h] ?? '')));
      await apiFetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ range: `${tabName}!A1`, majorDimension: 'ROWS', values }),
        },
        'APPEND_ROWS'
      );
    },

    // Update a single row in-place. rowIndex is 1-based (from _rowIndex).
    async updateRow(tabName, rowIndex, obj) {
      const headers = TAB_HEADERS[tabName];
      const endCol  = colLetter(headers.length);
      const range   = `${tabName}!A${rowIndex}:${endCol}${rowIndex}`;
      const values  = headers.map(h => String(obj[h] ?? ''));
      await apiFetch(
        `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify({ range, majorDimension: 'ROWS', values: [values] }),
        },
        'UPDATE_ROW'
      );
    },

    // Hard-delete a single row. rowIndex is 1-based (from _rowIndex).
    async deleteRow(tabName, rowIndex) {
      const numericId = sheetIdMap?.[tabName];
      if (numericId == null) throw new Error(`SHEET_ID_MISSING_${tabName}`);
      await apiFetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          requests: [{
            deleteDimension: {
              range: {
                sheetId:    numericId,
                dimension:  'ROWS',
                startIndex: rowIndex - 1,  // 0-based in API
                endIndex:   rowIndex,
              },
            },
          }],
        }),
      }, 'DELETE_ROW');
    },
  };
}
