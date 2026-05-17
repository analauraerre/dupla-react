import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePersistedAppData, toVersionedPayload } from './migrations.js';
import { CURRENT_SCHEMA_VERSION } from './schemas.js';
import { effectiveBudget } from '../utils/budgets.js';

test('loads legacy app data and marks it for migration', () => {
  const legacy = {
    expenses: [{ id: 1, description: 'Cafe', amount: '1200', category: 'Otros', user: 'Ana', date: '2026-05-01' }],
    incomes: [],
    savingsAccounts: [{ id: 2, name: 'Caja', transactions: [] }],
  };

  const result = parsePersistedAppData(legacy);

  assert.equal(result.ok, true);
  assert.equal(result.migrated, true);
  assert.equal(result.fromVersion, 0);
  assert.equal(result.data.expenses[0].amount, 1200);
  assert.equal(result.data.savingsAccounts[0].currency, 'ARS');
});

test('loads current versioned app data without migration', () => {
  const payload = toVersionedPayload({
    expenses: [],
    incomes: [{ id: 1, description: 'Sueldo', amount: 10, user: 'Ana', month: 4, year: 2026 }],
  });

  const result = parsePersistedAppData(payload);

  assert.equal(result.ok, true);
  assert.equal(result.migrated, false);
  assert.equal(result.fromVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(result.data.incomes[0].amount, 10);
});

test('falls back safely when persisted shape is unusable', () => {
  const result = parsePersistedAppData('not an object');

  assert.equal(result.ok, true);
  assert.equal(result.migrated, true);
  assert.deepEqual(result.data.expenses, []);
});

test('keeps budget override lookup compatible with existing keys', () => {
  const base = { Vivienda: 100 };
  const overrides = {
    '2026-3_Vivienda': 150,
  };

  assert.equal(effectiveBudget('Vivienda', 4, 2026, base, overrides), 150);
  assert.equal(effectiveBudget('Otros', 4, 2026, base, overrides), 0);
});
