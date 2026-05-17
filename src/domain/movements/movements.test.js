import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterExpensesByMonth,
  filterIncomesByMonth,
  addExpense,
  editExpense,
  deleteExpense,
  addIncome,
  editIncome,
  deleteIncome,
  applyRecurring,
} from './index.js';

// ── fixtures ──────────────────────────────────────────────────────────────────
const mkExp = (overrides = {}) => ({
  id: 1, description: 'Cafe', amount: 500,
  category: 'Restaurantes', user: 'Ana',
  date: '2026-05-10', tags: [], installments: 1,
  ...overrides,
});

const mkInc = (overrides = {}) => ({
  id: 10, description: 'Sueldo', amount: 100000,
  user: 'Fabio', month: 4, year: 2026,
  ...overrides,
});

// ── filterExpensesByMonth ─────────────────────────────────────────────────────
test('filterExpensesByMonth: keeps matching expenses', () => {
  const expenses = [
    mkExp({ date: '2026-05-10' }),
    mkExp({ id: 2, date: '2026-04-30' }),
    mkExp({ id: 3, date: '2026-05-01' }),
  ];
  const result = filterExpensesByMonth(expenses, 4, 2026); // month=4 => May
  assert.equal(result.length, 2);
  assert.equal(result.every(e => e.date.startsWith('2026-05')), true);
});

test('filterExpensesByMonth: returns empty when no match', () => {
  const result = filterExpensesByMonth([mkExp()], 0, 2025);
  assert.deepEqual(result, []);
});

// ── filterIncomesByMonth ──────────────────────────────────────────────────────
test('filterIncomesByMonth: filters by month+year correctly', () => {
  const incomes = [mkInc(), mkInc({ id: 11, month: 3, year: 2026 })];
  const result = filterIncomesByMonth(incomes, 4, 2026);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 10);
});

// ── addExpense / deleteExpense ────────────────────────────────────────────────
test('addExpense: appends without mutating original', () => {
  const original = [mkExp()];
  const newExp = mkExp({ id: 99, description: 'Almuerzo' });
  const result = addExpense(original, newExp);
  assert.equal(result.length, 2);
  assert.equal(original.length, 1);
  assert.equal(result[1].id, 99);
});

test('deleteExpense: removes by id without mutating original', () => {
  const expenses = [mkExp({ id: 1 }), mkExp({ id: 2 })];
  const result = deleteExpense(expenses, 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 2);
  assert.equal(expenses.length, 2);
});

// ── editExpense ───────────────────────────────────────────────────────────────
test('editExpense: updates only the target entry', () => {
  const expenses = [mkExp({ id: 1, amount: 100 }), mkExp({ id: 2, amount: 200 })];
  const result = editExpense(expenses, 1, { amount: 999, description: 'Nuevo' });
  assert.equal(result[0].amount, 999);
  assert.equal(result[0].description, 'Nuevo');
  assert.equal(result[1].amount, 200); // untouched
});

test('editExpense: returns same-length array when id exists', () => {
  const expenses = [mkExp({ id: 1 }), mkExp({ id: 2 })];
  assert.equal(editExpense(expenses, 1, { amount: 1 }).length, 2);
});

// ── addIncome / deleteIncome / editIncome ─────────────────────────────────────
test('addIncome: attaches selMonth/selYear and parses amount', () => {
  const result = addIncome([], { description: 'Freelance', amount: '5000', user: 'Ana' }, 2, 2026);
  assert.equal(result.length, 1);
  assert.equal(result[0].month, 2);
  assert.equal(result[0].year, 2026);
  assert.equal(result[0].amount, 5000);
});

test('deleteIncome: removes by id', () => {
  const result = deleteIncome([mkInc({ id: 10 }), mkInc({ id: 11 })], 10);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 11);
});

test('editIncome: merges updates onto target', () => {
  const incomes = [mkInc({ id: 10, amount: 1000 })];
  const result = editIncome(incomes, 10, { amount: 2000 });
  assert.equal(result[0].amount, 2000);
});

// ── applyRecurring ────────────────────────────────────────────────────────────
test('applyRecurring: adds expense when not yet present this month', () => {
  const recurring = [{
    id: 'r1', active: true, description: 'Gimnasio', amount: 3000,
    category: 'Salud', user: 'Ana', dayOfMonth: 1,
  }];
  const ref = new Date('2026-05-10');
  const result = applyRecurring(recurring, [], ref);
  assert.equal(result.length, 1);
  assert.equal(result[0].description, 'Gimnasio');
  assert.equal(result[0].date, '2026-05-01');
});

test('applyRecurring: skips if already recorded this month', () => {
  const recurring = [{ id: 'r1', active: true, description: 'Gimnasio', amount: 3000, category: 'Salud', user: 'Ana', dayOfMonth: 1 }];
  const existing  = [mkExp({ description: 'Gimnasio', date: '2026-05-01' })];
  const ref = new Date('2026-05-10');
  const result = applyRecurring(recurring, existing, ref);
  assert.equal(result.length, 0);
});

test('applyRecurring: skips inactive recurring expenses', () => {
  const recurring = [{ id: 'r1', active: false, description: 'Gym', amount: 500, dayOfMonth: 1 }];
  const result = applyRecurring(recurring, [], new Date('2026-05-10'));
  assert.equal(result.length, 0);
});

test('applyRecurring: skips if dayOfMonth is in the future relative to refDate', () => {
  const recurring = [{ id: 'r1', active: true, description: 'Gym', amount: 500, dayOfMonth: 20 }];
  const ref = new Date('2026-05-05'); // day 5, but recurring fires on day 20
  const result = applyRecurring(recurring, [], ref);
  assert.equal(result.length, 0);
});
