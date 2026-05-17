import {
  AppDataSchema,
  CURRENT_SCHEMA_VERSION,
  createDefaultAppData,
} from './schemas.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isVersionedPayload(value) {
  return isObject(value) && 'schemaVersion' in value && 'data' in value;
}

function normalizeLegacyData(rawData) {
  const base = isObject(rawData) ? rawData : {};
  return {
    ...base,
    categories: base.categories,
    incomeCategories: base.incomeCategories,
    expenses: base.expenses,
    incomes: base.incomes,
    savingGoals: base.savingGoals,
    recurringExpenses: base.recurringExpenses,
    monthNotes: base.monthNotes,
    creditCards: base.creditCards,
    splits: base.splits,
    savingsAccounts: Array.isArray(base.savingsAccounts)
      ? base.savingsAccounts.map(account => ({
          ...account,
          currency: account.currency || 'ARS',
          transactions: Array.isArray(account.transactions) ? account.transactions : [],
        }))
      : base.savingsAccounts,
  };
}

function migrateToCurrent(rawPayload) {
  if (!isVersionedPayload(rawPayload)) {
    return {
      data: normalizeLegacyData(rawPayload),
      fromVersion: 0,
      migrated: true,
    };
  }

  if (rawPayload.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return {
      data: normalizeLegacyData(rawPayload.data),
      fromVersion: CURRENT_SCHEMA_VERSION,
      migrated: false,
    };
  }

  return {
    data: normalizeLegacyData(rawPayload.data),
    fromVersion: Number(rawPayload.schemaVersion) || 0,
    migrated: true,
    unsupportedVersion: rawPayload.schemaVersion,
  };
}

export function toVersionedPayload(appData) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    data: AppDataSchema.parse(appData),
    savedAt: new Date().toISOString(),
  };
}

export function parsePersistedAppData(rawPayload) {
  const migration = migrateToCurrent(rawPayload);
  const parsed = AppDataSchema.safeParse(migration.data);

  if (!parsed.success) {
    return {
      ok: false,
      data: createDefaultAppData(),
      migrated: false,
      fromVersion: migration.fromVersion,
      issues: parsed.error.issues,
      error: parsed.error,
    };
  }

  return {
    ok: true,
    data: parsed.data,
    migrated: migration.migrated,
    fromVersion: migration.fromVersion,
    issues: [],
    unsupportedVersion: migration.unsupportedVersion,
  };
}
