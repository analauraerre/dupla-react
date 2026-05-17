import { useCallback, useMemo } from 'react';
import { createGoogleSheetsRepository } from '../services/googleSheetsRepository';

/**
 * Custom hook that exposes load/save operations for Google Sheets.
 * Handles spreadsheet ID caching in localStorage.
 */
export function useGoogleSheets(token, userId) {
  const repository = useMemo(
    () => createGoogleSheetsRepository(token, userId),
    [token, userId],
  );

  const load = useCallback(async () => {
    return repository.loadAppData();
  }, [repository]);

  const save = useCallback(async (appData) => {
    return repository.saveAppData(appData);
  }, [repository]);

  const resetSheetId = useCallback(() => {
    repository.resetSheetId();
  }, [repository]);

  const setManualSheetId = useCallback((id) => {
    repository.setManualSheetId(id);
  }, [repository]);

  const getSheetId = useCallback(() => {
    return repository.getSheetId();
  }, [repository]);

  return { load, save, resetSheetId, setManualSheetId, getSheetId };
}
