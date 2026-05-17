import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExpByCategory,
  computeIncByCategory,
  computeExpByUser,
  computeAlerts,
  computePieData,
  computeProjected,
  computeAnnualData,
} from './selectors.js';

// ── fixtures ──────────────────────────────────────────────────────────────────
const mkExp = (cat, amount, user = 'Ana') => ({
  id: Math.random(), description: 'x', amount, category: cat,
  user, date: '2026-05-01', tags: [],
});

const mkInc = (cat, amount, month = 4, year = 2026) => ({
  id: Math.random(), description: 'y', amount, user: 'Ana',
  incomeCategory: cat, month, year,
});

// ── computeExpByCategory ──────────────────────────────────────────────────────
test('computeExpByCategory: aggregates amounts by category', () => {
  const filtExp = [
    mkExp('Supermercado', 1000),
    mkExp('Supermercado', 500),
    mkExp('Transporte', 300),
  ];
  const result = computeExpByCategory(filtExp);
  assert.equal(result['Supermercado'], 1500);
  assert.equal(result['Transporte'], 300);
});

test('computeExpByCategory: returns empty object for no expenses', () => {
  assert.deepEqual(computeExpByCategory([]), {});
});

// ── computeIncByCategory ──────────────────────────────────────────────────────
test('computeIncByCategory: groups by incomeCategory, defaults to "Sin categoría"', () => {
  const filtInc = [
    { id: 1, amount: 10000, incomeCategory: 'Sueldos' },
    { id: 2, amount: 2000 },  // no incomeCategory
  ];
  const result = computeIncByCategory(filtInc);
  assert.equal(result['Sueldos'], 10000);
  assert.equal(result['Sin categoría'], 2000);
});

// ── computeExpByUser ──────────────────────────────────────────────────────────
test('computeExpByUser: groups totals by user', () => {
  const filtExp = [
    mkExp('Otros', 1000, 'Ana'),
    mkExp('Otros', 500,  'Fabio'),
    mkExp('Otros', 300,  'Ana'),
  ];
  const result = computeExpByUser(filtExp);
  assert.equal(result['Ana'], 1300);
  assert.equal(result['Fabio'], 500);
});

// ── computeAlerts ─────────────────────────────────────────────────────────────
test('computeAlerts: returns categories at or above 80% of budget', () => {
  const categories = [
    { name: 'Vivienda', icon: '🏠', color: '#f00', bg: '#fee' },
    { name: 'Ropa',     icon: '👗', color: '#00f', bg: '#eef' },
  ];
  const expByCat  = { Vivienda: 900, Ropa: 100 };
  const effBudgets = { Vivienda: 1000, Ropa: 500 };
  const result = computeAlerts(categories, expByCat, effBudgets);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'Vivienda');
  assert.equal(result[0].pct, 90);
});

test('computeAlerts: ignores categories with zero budget', () => {
  const categories = [{ name: 'Otros', icon: '📦', color: '#ccc', bg: '#eee' }];
  const result = computeAlerts(categories, { Otros: 500 }, { Otros: 0 });
  assert.deepEqual(result, []);
});

// ── computePieData ────────────────────────────────────────────────────────────
test('computePieData: excludes zero-spend categories and sorts desc', () => {
  const categories = [
    { name: 'A', color: '#f00', icon: '🔴' },
    { name: 'B', color: '#0f0', icon: '🟢' },
    { name: 'C', color: '#00f', icon: '🔵' },
  ];
  const expByCat = { A: 200, B: 0, C: 500 };
  const result = computePieData(categories, expByCat);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'C'); // sorted desc
  assert.equal(result[1].name, 'A');
});

// ── computeProjected ─────────────────────────────────────────────────────────
test('computeProjected: extrapolates monthly spending from daily rate', () => {
  // 1000 spent in 10 days, 31-day month → projected 3100
  assert.equal(computeProjected(1000, 10, 31), 3100);
});

test('computeProjected: returns 0 when dayNow is 0', () => {
  assert.equal(computeProjected(1000, 0, 31), 0);
});

// ── computeAnnualData ─────────────────────────────────────────────────────────
test('computeAnnualData: returns 12 months with correct aggregates', () => {
  const expenses = [
    { id: 1, date: '2026-01-15', amount: 500 },
    { id: 2, date: '2026-01-20', amount: 300 },
    { id: 3, date: '2026-03-01', amount: 200 },
  ];
  const incomes = [
    { id: 10, month: 0, year: 2026, amount: 10000 },
  ];
  const result = computeAnnualData(expenses, incomes, 2026);
  assert.equal(result.length, 12);
  assert.equal(result[0].Egresos,  800);   // January
  assert.equal(result[0].Ingresos, 10000);
  assert.equal(result[2].Egresos,  200);   // March
  assert.equal(result[1].Egresos,  0);     // February
});
