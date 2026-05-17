import { useState, useMemo, useEffect, useCallback } from 'react';

import { useGoogleSheets } from './useGoogleSheets.js';
import { SEED, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, PAYMENT_METHODS_FIXED, MONTHS_FULL } from '../utils/constants.js';
import { fmt, fmtK, today, todayStr } from '../utils/formatters.js';

import {
  filterExpensesByMonth, filterIncomesByMonth,
  addExpense, editExpense, deleteExpense,
  addIncome, editIncome, deleteIncome,
  applyRecurring,
} from '../domain/movements/index.js';

import { computeEffBudgets, applyBudgetOverride } from '../domain/budgets/index.js';

import {
  addSavingsAccount, deleteSavingsAccount,
  addSavingsTx, deleteSavingsTx,
  renameSavingsAccount, setSavingsAccountCurrency,
  getAccountBalance, computeSavingsTotal, computeSavingGoalsTot,
} from '../domain/savings/index.js';

import {
  computeExpByCategory, computeIncByCategory, computeExpByUser,
  computeAnnualData, computeAlerts, computePieData, computeBarData,
  computeProjected,
} from '../domain/reports/selectors.js';

/**
 * Central coordinator hook.
 * Owns all financial state and exposes actions + derived data to the UI.
 * React is used only for state, lifecycle, and memoization — domain logic lives in pure modules.
 */
export function useDuplaData({ token, userId, onLogout }) {
  const { load, save, setManualSheetId, getSheetId } = useGoogleSheets(token, userId);

  // ── SYNC ──────────────────────────────────────────────────────────────────
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [lastSync,  setLastSync]  = useState(null);
  const [syncError, setSyncError] = useState('');

  // ── NAV ───────────────────────────────────────────────────────────────────
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear,  setSelYear]  = useState(today.getFullYear());

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  const [billingDayOfMonth, setBillingDayOfMonth] = useState(() => {
    const stored = localStorage.getItem('dupla_billing_day');
    if (!stored || stored === '27') { localStorage.setItem('dupla_billing_day', '1'); return 1; }
    return parseInt(stored, 10);
  });
  const [userNames, setUserNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dupla_user_names') || '["Ana","Fabio"]'); } catch { return ['Ana', 'Fabio']; }
  });
  const [exchangeRate, setExchangeRate] = useState(() =>
    parseFloat(localStorage.getItem('dupla_exchange_rate') || '1100')
  );

  // ── DATA ──────────────────────────────────────────────────────────────────
  const [expenses,         setExpenses]         = useState([]);
  const [incomes,          setIncomes]          = useState([]);
  const [savingGoals,      setSavingGoals]      = useState([]);
  const [base,             setBase]             = useState(SEED.baseBudgets);
  const [overrides,        setOverrides]        = useState({});
  const [categories,       setCategories]       = useState(DEFAULT_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(DEFAULT_INCOME_CATEGORIES);
  const [incomeBase,       setIncomeBase]       = useState(SEED.incomeBaseBudgets);
  const [incomeOverrides,  setIncomeOverrides]  = useState({});
  const [recurring,        setRecurring]        = useState([]);
  const [notes,            setNotes]            = useState({});
  const [creditCards,      setCreditCards]      = useState([]);
  const [splits,           setSplits]           = useState([]);
  const [savingsAccounts,  setSavingsAccounts]  = useState([]);

  // ── SETTINGS SAVERS ───────────────────────────────────────────────────────
  const saveBillingDay = useCallback(day => {
    setBillingDayOfMonth(day);
    localStorage.setItem('dupla_billing_day', String(day));
  }, []);

  const saveUserNames = useCallback(names => {
    setUserNames(names);
    localStorage.setItem('dupla_user_names', JSON.stringify(names));
  }, []);

  const saveExchangeRate = useCallback(rate => {
    const num = parseFloat(rate) || 1100;
    setExchangeRate(num);
    localStorage.setItem('dupla_exchange_rate', String(num));
  }, []);

  // ── PERSIST ───────────────────────────────────────────────────────────────
  const persist = useCallback(async (updates = {}) => {
    setSyncing(true);
    setSyncError('');
    const snapshot = {
      expenses, incomes, savingGoals,
      baseBudgets: base, budgetOverrides: overrides,
      categories, incomeCategories,
      incomeBaseBudgets: incomeBase, incomeBudgetOverrides: incomeOverrides,
      recurringExpenses: recurring, monthNotes: notes,
      creditCards, splits, savingsAccounts,
      ...updates,
    };
    try {
      await save(snapshot);
      setLastSync(new Date());
    } catch (e) {
      console.error('[Dupla] Save error', e);
      setSyncError('No pudimos guardar los cambios. Revisá tu conexión y volvé a intentar.');
    }
    setSyncing(false);
  }, [
    expenses, incomes, savingGoals, base, overrides,
    categories, incomeCategories, incomeBase, incomeOverrides,
    recurring, notes, creditCards, splits, savingsAccounts, save,
  ]);

  // ── LOAD ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    load().then(result => {
      if (!result.ok) {
        console.warn('[Dupla] Invalid persisted data', result.issues || result.error);
        setSyncError('Los datos guardados no tienen el formato esperado. Cargamos una base segura sin sobrescribir tu Sheet.');
      }
      const d = result.data;
      if (d && d.expenses) {
        const rec  = d.recurringExpenses || [];
        const exp  = d.expenses || [];
        const auto = applyRecurring(rec, exp, today);
        const finalExp = auto.length ? [...exp, ...auto] : exp;
        setExpenses(finalExp); setIncomes(d.incomes || []); setSavingGoals(d.savingGoals || []);
        setBase(d.baseBudgets || SEED.baseBudgets); setOverrides(d.budgetOverrides || {});
        setCategories(d.categories || DEFAULT_CATEGORIES); setRecurring(rec);
        setIncomeCategories(d.incomeCategories || DEFAULT_INCOME_CATEGORIES);
        setIncomeBase(d.incomeBaseBudgets || SEED.incomeBaseBudgets);
        setIncomeOverrides(d.incomeBudgetOverrides || {});
        setNotes(d.monthNotes || {}); setCreditCards(d.creditCards || []); setSplits(d.splits || []);
        setSavingsAccounts((d.savingsAccounts || []).map(a => ({ ...a, currency: a.currency || 'ARS' })));
        setLastSync(new Date());
        if (result.ok && (auto.length || result.migrated)) {
          save({ ...d, expenses: finalExp }).catch(err => {
            console.error('[Dupla] Migration save error', err);
            setSyncError('Los datos cargaron bien, pero no pudimos guardar la migración automática.');
          });
        }
      }
      setLoading(false);
    }).catch(err => {
      if (err?.message === 'AUTH_EXPIRED') { onLogout(); return; }
      console.error('[Dupla] Load error', err);
      setSyncError('No pudimos conectar con Google Sheets. Revisá tu conexión o iniciá sesión nuevamente.');
      setLoading(false);
    });
  }, [load, onLogout, save]);

  // ── DERIVED ───────────────────────────────────────────────────────────────
  const paymentMethods = useMemo(
    () => [...PAYMENT_METHODS_FIXED, ...creditCards.map(c => c.name)],
    [creditCards]
  );

  const effBudgets    = useMemo(() => computeEffBudgets(categories,       selMonth, selYear, base,       overrides),       [categories,       selMonth, selYear, base,       overrides]);
  const effIncBudgets = useMemo(() => computeEffBudgets(incomeCategories, selMonth, selYear, incomeBase, incomeOverrides), [incomeCategories, selMonth, selYear, incomeBase, incomeOverrides]);

  const filtExp = useMemo(() => filterExpensesByMonth(expenses, selMonth, selYear), [expenses, selMonth, selYear]);
  const filtInc = useMemo(() => filterIncomesByMonth(incomes,   selMonth, selYear), [incomes,  selMonth, selYear]);

  const prevMonth = selMonth === 0 ? 11 : selMonth - 1;
  const prevYear  = selMonth === 0 ? selYear - 1 : selYear;
  const totExpPrevMonth = useMemo(
    () => filterExpensesByMonth(expenses, prevMonth, prevYear).reduce((s, e) => s + e.amount, 0),
    [expenses, prevMonth, prevYear]
  );

  const totExp = filtExp.reduce((s, e) => s + e.amount, 0);
  const totInc = filtInc.reduce((s, i) => s + i.amount, 0);
  const totSav = useMemo(() => computeSavingGoalsTot(savingGoals, selMonth, selYear), [savingGoals, selMonth, selYear]);
  const savingsTotal = useMemo(() => computeSavingsTotal(savingsAccounts), [savingsAccounts]);
  const balance    = totInc - totExp - totSav;
  const totBudget  = Object.values(effBudgets).reduce((a, b) => a + b, 0);

  const expByCat  = useMemo(() => computeExpByCategory(filtExp), [filtExp]);
  const incByCat  = useMemo(() => computeIncByCategory(filtInc), [filtInc]);
  const expByUser = useMemo(() => computeExpByUser(filtExp),     [filtExp]);
  const annualData = useMemo(() => computeAnnualData(expenses, incomes, selYear), [expenses, incomes, selYear]);

  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const dayNow      = selMonth === today.getMonth() && selYear === today.getFullYear() ? today.getDate() : daysInMonth;
  const projected   = computeProjected(totExp, dayNow, daysInMonth);

  const alerts  = useMemo(() => computeAlerts(categories,  expByCat, effBudgets), [categories,  expByCat, effBudgets]);
  const pieData = useMemo(() => computePieData(categories, expByCat),              [categories,  expByCat]);
  const barData = useMemo(() => computeBarData(categories, expByCat, effBudgets), [categories,  expByCat, effBudgets]);

  const noteKey = `${selYear}-${selMonth}`;

  // ── ACTIONS: movements ────────────────────────────────────────────────────
  const delExp = useCallback(id => {
    const u = deleteExpense(expenses, id); setExpenses(u); persist({ expenses: u });
  }, [expenses, persist]);

  const delInc = useCallback(id => {
    const u = deleteIncome(incomes, id); setIncomes(u); persist({ incomes: u });
  }, [incomes, persist]);

  const editExpenseFn = useCallback((id, updates) => {
    const u = editExpense(expenses, id, updates); setExpenses(u); persist({ expenses: u });
  }, [expenses, persist]);

  const editIncomeFn = useCallback((id, updates) => {
    const u = editIncome(incomes, id, updates); setIncomes(u); persist({ incomes: u });
  }, [incomes, persist]);

  const addExpenseFn = useCallback(exp => {
    const u = addExpense(expenses, exp); setExpenses(u); persist({ expenses: u });
  }, [expenses, persist]);

  const addIncomeFn = useCallback(form => {
    const u = addIncome(incomes, form, selMonth, selYear); setIncomes(u); persist({ incomes: u });
  }, [incomes, selMonth, selYear, persist]);

  const addIncomeQuick = useCallback(inc => {
    const u = [...incomes, inc]; setIncomes(u); persist({ incomes: u });
  }, [incomes, persist]);

  // ── ACTIONS: budgets ──────────────────────────────────────────────────────
  const saveBudget = useCallback((cat, val) => {
    const u = applyBudgetOverride(overrides, selYear, selMonth, cat, val);
    setOverrides(u); persist({ budgetOverrides: u });
  }, [overrides, selYear, selMonth, persist]);

  const saveIncBudget = useCallback((cat, val) => {
    const u = applyBudgetOverride(incomeOverrides, selYear, selMonth, cat, val);
    setIncomeOverrides(u); persist({ incomeBudgetOverrides: u });
  }, [incomeOverrides, selYear, selMonth, persist]);

  // ── ACTIONS: categories ───────────────────────────────────────────────────
  const addCategory = useCallback(cat => {
    if (!cat.name.trim() || categories.find(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) return;
    const u = [...categories, { ...cat, name: cat.name.trim() }];
    setCategories(u); persist({ categories: u });
  }, [categories, persist]);

  const deleteCategory = useCallback(name => {
    const u = categories.filter(c => c.name !== name);
    setCategories(u); persist({ categories: u });
  }, [categories, persist]);

  const addIncomeCategory = useCallback(cat => {
    if (!cat.name.trim() || incomeCategories.find(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) return;
    const newCats = [...incomeCategories, { ...cat, name: cat.name.trim() }];
    const newBase = { ...incomeBase, [cat.name.trim()]: 0 };
    setIncomeCategories(newCats); setIncomeBase(newBase);
    persist({ incomeCategories: newCats, incomeBaseBudgets: newBase });
  }, [incomeCategories, incomeBase, persist]);

  const deleteIncomeCategory = useCallback(name => {
    const u = incomeCategories.filter(c => c.name !== name);
    setIncomeCategories(u); persist({ incomeCategories: u });
  }, [incomeCategories, persist]);

  // ── ACTIONS: cards ────────────────────────────────────────────────────────
  const addCard = useCallback(card => {
    const u = [...creditCards, { id: Date.now(), ...card }];
    setCreditCards(u); persist({ creditCards: u });
  }, [creditCards, persist]);

  // ── ACTIONS: savings accounts ─────────────────────────────────────────────
  const addSavingsAccountFn = useCallback(form => {
    const u = addSavingsAccount(savingsAccounts, form);
    if (u === savingsAccounts) return;
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  }, [savingsAccounts, persist]);

  const deleteSavingsAccountFn = useCallback(id => {
    const u = deleteSavingsAccount(savingsAccounts, id);
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  }, [savingsAccounts, persist]);

  const addSavTx = useCallback((accId, txForm) => {
    const u = addSavingsTx(savingsAccounts, accId, txForm, todayStr);
    if (u === savingsAccounts) return;
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  }, [savingsAccounts, persist]);

  const deleteSavTx = useCallback((accId, txId) => {
    const u = deleteSavingsTx(savingsAccounts, accId, txId);
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  }, [savingsAccounts, persist]);

  const saveSavAccName = useCallback((id, name) => {
    const u = renameSavingsAccount(savingsAccounts, id, name);
    if (u === savingsAccounts) return;
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  }, [savingsAccounts, persist]);

  const saveSavAccCurrency = useCallback((id, currency) => {
    const u = setSavingsAccountCurrency(savingsAccounts, id, currency);
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  }, [savingsAccounts, persist]);

  // ── ACTIONS: notes ────────────────────────────────────────────────────────
  const updateNote = useCallback(val => {
    const u = { ...notes, [noteKey]: val };
    setNotes(u);
    return u;
  }, [notes, noteKey]);

  const saveNote = useCallback(() => persist({ monthNotes: notes }), [persist, notes]);

  // ── EXPORT (browser APIs — not domain) ───────────────────────────────────
  const [exportToast, setExportToast] = useState('');

  const exportCSV = useCallback(() => {
    const esc = v => String(v ?? '').replace(/"/g, '""');
    const row = arr => arr.map(c => `"${esc(c)}"`).join(',') + '\n';
    let csv = '﻿';
    csv += 'DUPLA\n\n=== EGRESOS ===\n' + row(['Fecha', 'Descripción', 'Categoría', 'Medio de pago', 'Cuotas', 'Persona', 'Monto']);
    [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e =>
      csv += row([e.date, e.description, e.category, e.paymentMethod || 'Efectivo', e.installments || 1, e.user, e.amount])
    );
    csv += '\n=== INGRESOS ===\n' + row(['Mes', 'Año', 'Descripción', 'Persona', 'Monto']);
    incomes.forEach(i => csv += row([MONTHS_FULL[i.month], i.year, i.description, i.user, i.amount]));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: 'dupla.csv' }).click();
    URL.revokeObjectURL(url);
  }, [expenses, incomes]);

  const exportGSheets = useCallback(() => {
    const t = '\t', nl = '\n';
    const row = arr => arr.join(t) + nl;
    let tsv = 'EGRESOS' + nl + row(['Fecha', 'Descripción', 'Categoría', 'Medio de pago', 'Cuotas', 'Persona', 'Monto']);
    [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e =>
      tsv += row([e.date, e.description || '', e.category, e.paymentMethod || 'Efectivo', e.installments || 1, e.user, e.amount])
    );
    tsv += nl + 'INGRESOS' + nl + row(['Mes', 'Año', 'Descripción', 'Persona', 'Monto']);
    incomes.forEach(i => tsv += row([MONTHS_FULL[i.month], i.year, i.description || '', i.user, i.amount]));
    navigator.clipboard.writeText(tsv)
      .then(() => { setExportToast('✓ Copiado — pegá en Google Sheets'); setTimeout(() => setExportToast(''), 3000); })
      .catch(() => { setExportToast('No se pudo copiar'); setTimeout(() => setExportToast(''), 3000); });
  }, [expenses, incomes]);

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  return {
    // sync
    loading, syncing, lastSync, syncError,
    // nav
    selMonth, selYear, setSelMonth, setSelYear,
    // settings
    billingDayOfMonth, saveBillingDay,
    userNames, saveUserNames,
    exchangeRate, saveExchangeRate,
    // raw data (read-only for tabs)
    expenses, incomes, savingGoals, categories, incomeCategories,
    creditCards, savingsAccounts, overrides, incomeOverrides, notes,
    // derived
    paymentMethods,
    effBudgets, effIncBudgets,
    filtExp, filtInc,
    totExp, totInc, totSav, savingsTotal, totExpPrevMonth,
    balance, totBudget,
    expByCat, incByCat, expByUser,
    annualData, daysInMonth, dayNow, projected,
    alerts, pieData, barData,
    prevMonth, prevYear, noteKey,
    // actions: movements
    delExp, delInc,
    editExpense: editExpenseFn,
    editIncome: editIncomeFn,
    addExpense: addExpenseFn,
    addIncome: addIncomeFn,
    addIncomeQuick,
    // actions: budgets
    saveBudget, saveIncBudget,
    // actions: categories
    addCategory, deleteCategory,
    addIncomeCategory, deleteIncomeCategory,
    // actions: cards
    addCard,
    // actions: savings
    addSavingsAccount: addSavingsAccountFn,
    deleteSavingsAccount: deleteSavingsAccountFn,
    addSavTx, deleteSavTx,
    saveSavAccName, saveSavAccCurrency,
    getAccBalance: getAccountBalance,
    // actions: notes
    updateNote, saveNote,
    // export
    exportCSV, exportGSheets, exportToast,
    // sheet management
    getSheetId, setManualSheetId,
    // low-level persist (exposed for tabs that call it directly)
    persist,
    // utils forwarded for backward compat with shared object
    fmt, fmtK,
  };
}
