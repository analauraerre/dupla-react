import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addSavingsAccount,
  deleteSavingsAccount,
  addSavingsTx,
  deleteSavingsTx,
  renameSavingsAccount,
  setSavingsAccountCurrency,
  getAccountBalance,
  computeSavingsTotal,
  computeSavingGoalsTot,
} from './index.js';

// ── fixtures ──────────────────────────────────────────────────────────────────
const mkAcc = (overrides = {}) => ({
  id: 1, name: 'Caja ARS', currency: 'ARS', transactions: [], ...overrides,
});

const mkTx = (amount, overrides = {}) => ({
  id: Date.now() + Math.random(), amount, note: '', date: '2026-05-01', ...overrides,
});

// ── addSavingsAccount ─────────────────────────────────────────────────────────
test('addSavingsAccount: adds account with trimmed name', () => {
  const result = addSavingsAccount([], { name: '  Caja  ', currency: 'ARS' });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Caja');
  assert.deepEqual(result[0].transactions, []);
});

test('addSavingsAccount: rejects empty name, returns original array', () => {
  const original = [mkAcc()];
  const result = addSavingsAccount(original, { name: '   ', currency: 'ARS' });
  assert.equal(result, original);
});

// ── deleteSavingsAccount ──────────────────────────────────────────────────────
test('deleteSavingsAccount: removes by id', () => {
  const accounts = [mkAcc({ id: 1 }), mkAcc({ id: 2, name: 'Dólares', currency: 'USD' })];
  const result = deleteSavingsAccount(accounts, 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 2);
});

// ── addSavingsTx ──────────────────────────────────────────────────────────────
test('addSavingsTx: adds deposit (positive amount)', () => {
  const accounts = [mkAcc({ id: 1 })];
  const result = addSavingsTx(accounts, 1, { amount: '5000', type: 'add', note: 'Ahorro' }, '2026-05-01');
  assert.equal(result[0].transactions.length, 1);
  assert.equal(result[0].transactions[0].amount, 5000);
});

test('addSavingsTx: adds withdrawal (negative amount) for type=sub', () => {
  const accounts = [mkAcc({ id: 1 })];
  const result = addSavingsTx(accounts, 1, { amount: '1000', type: 'sub' }, '2026-05-01');
  assert.equal(result[0].transactions[0].amount, -1000);
});

test('addSavingsTx: rejects zero/negative amount, returns original', () => {
  const accounts = [mkAcc({ id: 1 })];
  const result = addSavingsTx(accounts, 1, { amount: '0', type: 'add' }, '2026-05-01');
  assert.equal(result, accounts);
});

test('addSavingsTx: only modifies the target account', () => {
  const accounts = [mkAcc({ id: 1 }), mkAcc({ id: 2, name: 'B' })];
  const result = addSavingsTx(accounts, 1, { amount: '100', type: 'add' }, '2026-05-01');
  assert.equal(result[1].transactions.length, 0);
});

// ── deleteSavingsTx ───────────────────────────────────────────────────────────
test('deleteSavingsTx: removes transaction from correct account', () => {
  const tx = mkTx(1000, { id: 99 });
  const accounts = [mkAcc({ id: 1, transactions: [tx] }), mkAcc({ id: 2, name: 'B' })];
  const result = deleteSavingsTx(accounts, 1, 99);
  assert.equal(result[0].transactions.length, 0);
  assert.equal(result[1].transactions.length, 0);
});

// ── renameSavingsAccount ──────────────────────────────────────────────────────
test('renameSavingsAccount: updates name with trim', () => {
  const accounts = [mkAcc({ id: 1, name: 'Vieja' })];
  const result = renameSavingsAccount(accounts, 1, ' Nueva ');
  assert.equal(result[0].name, 'Nueva');
});

test('renameSavingsAccount: ignores empty name, returns original', () => {
  const accounts = [mkAcc()];
  const result = renameSavingsAccount(accounts, 1, '  ');
  assert.equal(result, accounts);
});

// ── setSavingsAccountCurrency ─────────────────────────────────────────────────
test('setSavingsAccountCurrency: updates only target account', () => {
  const accounts = [mkAcc({ id: 1, currency: 'ARS' }), mkAcc({ id: 2, currency: 'ARS' })];
  const result = setSavingsAccountCurrency(accounts, 1, 'USD');
  assert.equal(result[0].currency, 'USD');
  assert.equal(result[1].currency, 'ARS');
});

// ── getAccountBalance ─────────────────────────────────────────────────────────
test('getAccountBalance: sums all transactions', () => {
  const acc = mkAcc({ transactions: [mkTx(5000), mkTx(-1000), mkTx(200)] });
  assert.equal(getAccountBalance(acc), 4200);
});

test('getAccountBalance: returns 0 for empty transactions', () => {
  assert.equal(getAccountBalance(mkAcc()), 0);
});

// ── computeSavingsTotal ───────────────────────────────────────────────────────
test('computeSavingsTotal: sums only ARS accounts', () => {
  const accounts = [
    mkAcc({ id: 1, currency: 'ARS', transactions: [mkTx(10000)] }),
    mkAcc({ id: 2, currency: 'USD', transactions: [mkTx(500)] }),
    mkAcc({ id: 3, currency: 'ARS', transactions: [mkTx(3000)] }),
  ];
  assert.equal(computeSavingsTotal(accounts), 13000);
});

// ── computeSavingGoalsTot ─────────────────────────────────────────────────────
test('computeSavingGoalsTot: sums contributions for given month/year', () => {
  const goals = [
    { id: 1, contributions: [
      { amount: 1000, month: 4, year: 2026 },
      { amount: 500,  month: 3, year: 2026 },
    ]},
    { id: 2, contributions: [
      { amount: 2000, month: 4, year: 2026 },
    ]},
  ];
  assert.equal(computeSavingGoalsTot(goals, 4, 2026), 3000);
});
