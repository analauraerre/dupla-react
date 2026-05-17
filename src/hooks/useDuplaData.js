import { useState, useMemo, useEffect, useCallback, useRef } from 'react';

import { createSheetsRepository } from '../services/sheetsRepository.js';
import { cuotaDelMes }            from '../domain/cuotas.js';
import {
  computeExpByCategory, computeIncByCategory, computeExpByUser,
  computeAnnualData, computeAlerts, computePieData, computeBarData,
  computeProjected,
} from '../domain/reports/selectors.js';

import { SEED, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/constants.js';
import { fmt, fmtK, today, todayStr } from '../utils/formatters.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEDIO_PAGO_MAP = { efectivo: 'efectivo', debito: 'debito', débito: 'debito', debit: 'debito' };

function normalizeMedioPago(paymentMethod, tarjeta) {
  if (tarjeta) return 'tarjeta';
  const key = (paymentMethod || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return MEDIO_PAGO_MAP[key] || 'efectivo';
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const DEFAULT_EGR_BUDGET = SEED.baseBudgets;

function buildDefaultCategorias() {
  return [
    ...DEFAULT_CATEGORIES.map(c => ({
      id: crypto.randomUUID(), tipo: 'egreso',
      nombre: c.name, icono: c.icon, color: c.color, bg: c.bg,
      presupuesto_base: DEFAULT_EGR_BUDGET[c.name] || 0,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map(c => ({
      id: crypto.randomUUID(), tipo: 'ingreso',
      nombre: c.name, icono: c.icon, color: c.color, bg: c.bg,
      presupuesto_base: 0,
    })),
  ];
}

// ── Optimistic _rowIndex helper ────────────────────────────────────────────────

function nextRowIndex(arr) {
  return arr.reduce((max, x) => Math.max(max, x._rowIndex || 1), 1) + 1;
}

// ── Backward-compat mappers ────────────────────────────────────────────────────
// These let existing tabs keep using old field names (date, description, amount…).

function gastoToExpense(g, categoriasMap, tarjetasMap) {
  const cat = categoriasMap[g.categoria_id];
  const tar = tarjetasMap[g.tarjeta_id];
  return {
    id:            g.id,
    date:          g.fecha,
    description:   g.descripcion,
    category:      cat?.nombre || '',
    user:          g.persona,
    amount:        parseFloat(g.monto) || 0,
    paymentMethod: tar?.nombre || g.medio_pago,
    installments:  parseInt(g.cuotas) || 1,
    _rowIndex:     g._rowIndex,
  };
}

function ingresoToIncome(i, categoriasMap) {
  const cat = categoriasMap[i.categoria_id];
  const d   = new Date(i.fecha + 'T00:00:00');
  return {
    id:             i.id,
    fecha:          i.fecha,
    month:          d.getMonth(),
    year:           d.getFullYear(),
    description:    i.descripcion,
    incomeCategory: cat?.nombre || '',
    user:           i.persona,
    amount:         parseFloat(i.monto) || 0,
    _rowIndex:      i._rowIndex,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDuplaData({ token, userId, onLogout }) {
  // ── Repository (recreated only when token/userId changes) ─────────────────
  const repoRef = useRef(null);
  if (
    !repoRef.current ||
    repoRef.current._token  !== token ||
    repoRef.current._userId !== userId
  ) {
    repoRef.current = token
      ? { ...createSheetsRepository(token, userId), _token: token, _userId: userId }
      : null;
  }
  const repo = repoRef.current;

  // ── Sync state ────────────────────────────────────────────────────────────
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [lastSync,  setLastSync]  = useState(null);
  const [syncError, setSyncError] = useState('');

  // ── Nav ───────────────────────────────────────────────────────────────────
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear,  setSelYear]  = useState(today.getFullYear());

  // ── Settings (localStorage only, no Sheets) ───────────────────────────────
  const [billingDayOfMonth, setBillingDayOfMonth] = useState(() => {
    const s = localStorage.getItem('dupla_billing_day');
    return s ? parseInt(s, 10) : 1;
  });
  const [userNames, setUserNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dupla_user_names') || '["Ana","Fabio"]'); } catch { return ['Ana', 'Fabio']; }
  });
  const [exchangeRate, setExchangeRate] = useState(() =>
    parseFloat(localStorage.getItem('dupla_exchange_rate') || '1100')
  );

  // ── Raw data (new model) ──────────────────────────────────────────────────
  const [gastos,        setGastos]        = useState([]);
  const [ingresos,      setIngresos]      = useState([]);
  const [categorias,    setCategorias]    = useState([]);
  const [tarjetas,      setTarjetas]      = useState([]);
  const [recurrentes,   setRecurrentes]   = useState([]);
  const [cuentas,       setCuentas]       = useState([]);
  const [transacciones, setTransacciones] = useState([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!repo) return;
    try {
      const tabs = await repo.loadAll();
      const byName = Object.fromEntries(tabs.map(t => [t.tabName, t.rows]));

      let cats = byName.Categorias || [];

      // Seed categories on first run.
      if (cats.length === 0) {
        const defaults = buildDefaultCategorias();
        await repo.appendRows('Categorias', defaults);
        cats = defaults.map((c, i) => ({ ...c, _rowIndex: i + 2 }));
      }

      setGastos(byName.Gastos       || []);
      setIngresos(byName.Ingresos   || []);
      setCategorias(cats);
      setTarjetas(byName.Tarjetas   || []);
      setRecurrentes(byName.Recurrentes || []);
      setCuentas(byName.Cuentas     || []);
      setTransacciones(byName.Transacciones || []);
      setLastSync(new Date());
    } catch (err) {
      if (err?.message === 'AUTH_EXPIRED') { onLogout(); return; }
      console.error('[Dupla] Load error', err);
      setSyncError('No pudimos conectar con Google Sheets. Revisá tu conexión.');
    }
  }, [repo, onLogout]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setSyncError('');
    await loadData();
    setLoading(false);
  }, [loadData]);

  // ── Derived: indexes ──────────────────────────────────────────────────────
  const categoriasMap = useMemo(
    () => Object.fromEntries(categorias.map(c => [c.id, c])),
    [categorias]
  );
  const tarjetasMap = useMemo(
    () => Object.fromEntries(tarjetas.map(t => [t.id, t])),
    [tarjetas]
  );

  // ── Derived: backward-compat category arrays (old field names) ─────────────
  const categories = useMemo(
    () => categorias
      .filter(c => c.tipo === 'egreso')
      .map(c => ({ id: c.id, name: c.nombre, icon: c.icono, color: c.color, bg: c.bg, _rowIndex: c._rowIndex })),
    [categorias]
  );
  const incomeCategories = useMemo(
    () => categorias
      .filter(c => c.tipo === 'ingreso')
      .map(c => ({ id: c.id, name: c.nombre, icon: c.icono, color: c.color, bg: c.bg, _rowIndex: c._rowIndex })),
    [categorias]
  );

  // ── Derived: budgets (simple, no walk-back) ────────────────────────────────
  const effBudgets = useMemo(
    () => Object.fromEntries(
      categorias.filter(c => c.tipo === 'egreso').map(c => [c.nombre, parseFloat(c.presupuesto_base) || 0])
    ),
    [categorias]
  );
  const effIncBudgets = useMemo(
    () => Object.fromEntries(
      categorias.filter(c => c.tipo === 'ingreso').map(c => [c.nombre, parseFloat(c.presupuesto_base) || 0])
    ),
    [categorias]
  );

  // ── Derived: old-shape expense arrays ─────────────────────────────────────
  // `expenses` = all gastos mapped to old shape (full monto, not cuota).
  const expenses = useMemo(
    () => gastos.map(g => gastoToExpense(g, categoriasMap, tarjetasMap)),
    [gastos, categoriasMap, tarjetasMap]
  );

  // `filtExp` = gastos where cuotaDelMes > 0 in selected month, amount = cuota.
  const filtExp = useMemo(
    () => gastos.flatMap(g => {
      const amt = cuotaDelMes(g, selMonth, selYear);
      if (amt === 0) return [];
      const cat = categoriasMap[g.categoria_id];
      const tar = tarjetasMap[g.tarjeta_id];
      return [{
        id:            g.id,
        date:          g.fecha,
        description:   g.descripcion,
        category:      cat?.nombre || '',
        user:          g.persona,
        amount:        amt,
        paymentMethod: tar?.nombre || g.medio_pago,
        installments:  parseInt(g.cuotas) || 1,
        _rowIndex:     g._rowIndex,
      }];
    }),
    [gastos, selMonth, selYear, categoriasMap, tarjetasMap]
  );

  // `incomes` = all ingresos in old shape.
  const incomes = useMemo(
    () => ingresos.map(i => ingresoToIncome(i, categoriasMap)),
    [ingresos, categoriasMap]
  );

  // `filtInc` = ingresos for selected month/year.
  const filtInc = useMemo(
    () => ingresos.flatMap(i => {
      const d = new Date(i.fecha + 'T00:00:00');
      if (d.getMonth() !== selMonth || d.getFullYear() !== selYear) return [];
      return [ingresoToIncome(i, categoriasMap)];
    }),
    [ingresos, selMonth, selYear, categoriasMap]
  );

  // ── Derived: savings accounts (nested structure for SavingsTab) ────────────
  const savingsAccounts = useMemo(
    () => cuentas.map(c => ({
      id:       c.id,
      name:     c.nombre,
      currency: c.moneda || 'ARS',
      target:   parseFloat(c.target) || 0,
      _rowIndex: c._rowIndex,
      transactions: transacciones
        .filter(t => t.cuenta_id === c.id)
        .map(t => ({
          id:        t.id,
          amount:    parseFloat(t.monto) || 0,
          note:      t.nota,
          date:      t.fecha,
          _rowIndex: t._rowIndex,
        })),
    })),
    [cuentas, transacciones]
  );

  // ── Derived: credit cards (old shape) ──────────────────────────────────────
  const creditCards = useMemo(
    () => tarjetas.map(t => ({
      id:         t.id,
      name:       t.nombre,
      limit:      parseFloat(t.limite) || 0,
      closingDay: parseInt(t.dia_cierre) || 1,
      _rowIndex:  t._rowIndex,
    })),
    [tarjetas]
  );

  // ── Derived: recurrentes pendientes (not applied this month yet) ───────────
  const recurrentesPendientes = useMemo(() => {
    const applied = new Set(
      gastos
        .filter(g => {
          if (!g.recurrente_id) return false;
          const d = new Date(g.fecha + 'T00:00:00');
          return d.getMonth() === selMonth && d.getFullYear() === selYear;
        })
        .map(g => g.recurrente_id)
    );
    return recurrentes.filter(r => {
      if (r.activo !== 'true' && r.activo !== true) return false;
      const desde = new Date((r.desde || '2000-01-01') + 'T00:00:00');
      const desdeIdx = desde.getFullYear() * 12 + desde.getMonth();
      const selIdx   = selYear * 12 + selMonth;
      return selIdx >= desdeIdx && !applied.has(r.id);
    });
  }, [gastos, recurrentes, selMonth, selYear]);

  // ── Derived: totals ────────────────────────────────────────────────────────
  const totExp     = filtExp.reduce((s, e) => s + e.amount, 0);
  const totInc     = filtInc.reduce((s, i) => s + i.amount, 0);
  const balance    = totInc - totExp;
  const totBudget  = Object.values(effBudgets).reduce((a, b) => a + b, 0);

  const prevMonth = selMonth === 0 ? 11 : selMonth - 1;
  const prevYear  = selMonth === 0 ? selYear - 1 : selYear;
  const totExpPrevMonth = useMemo(() => {
    return gastos.reduce((s, g) => s + cuotaDelMes(g, prevMonth, prevYear), 0);
  }, [gastos, prevMonth, prevYear]);

  const savingsTotal = useMemo(
    () => savingsAccounts
      .filter(a => a.currency === 'ARS')
      .reduce((s, a) => s + a.transactions.reduce((t, tx) => t + tx.amount, 0), 0),
    [savingsAccounts]
  );

  // ── Derived: report selectors ──────────────────────────────────────────────
  const expByCat   = useMemo(() => computeExpByCategory(filtExp), [filtExp]);
  const incByCat   = useMemo(() => computeIncByCategory(filtInc), [filtInc]);
  const expByUser  = useMemo(() => computeExpByUser(filtExp),     [filtExp]);
  const annualData = useMemo(() => computeAnnualData(expenses, incomes, selYear), [expenses, incomes, selYear]);

  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const dayNow      = selMonth === today.getMonth() && selYear === today.getFullYear()
    ? today.getDate() : daysInMonth;
  const projected   = computeProjected(totExp, dayNow, daysInMonth);

  const alerts  = useMemo(() => computeAlerts(categories,  expByCat, effBudgets), [categories, expByCat, effBudgets]);
  const pieData = useMemo(() => computePieData(categories, expByCat),              [categories, expByCat]);
  const barData = useMemo(() => computeBarData(categories, expByCat, effBudgets), [categories, expByCat, effBudgets]);

  // ── Error wrapper for actions ──────────────────────────────────────────────
  async function withSync(label, fn) {
    setSyncing(true);
    try {
      await fn();
      setLastSync(new Date());
      setSyncError('');
    } catch (err) {
      if (err?.message === 'AUTH_EXPIRED') { onLogout(); return; }
      console.error(`[Dupla] ${label}`, err);
      setSyncError(`No se pudo ${label}. Revisá tu conexión y presioná Actualizar.`);
    } finally {
      setSyncing(false);
    }
  }

  // ── Actions: expenses ──────────────────────────────────────────────────────

  const addExpense = useCallback(async (form) => {
    // form is old-model shape from HomeTab:
    // { description, amount, category (name), user, date, paymentMethod, installments }
    const cat = categorias.find(c => c.nombre === form.category && c.tipo === 'egreso');
    const tar = tarjetas.find(t => t.nombre === form.paymentMethod);
    const gasto = {
      id:           crypto.randomUUID(),
      fecha:        form.date,
      descripcion:  form.description || '',
      categoria_id: cat?.id || '',
      persona:      form.user || '',
      monto:        String(form.amount || 0),
      medio_pago:   normalizeMedioPago(form.paymentMethod, tar),
      tarjeta_id:   tar?.id || '',
      cuotas:       String(form.installments || 1),
      recurrente_id: '',
      creado_en:    new Date().toISOString(),
    };
    const optimistic = { ...gasto, _rowIndex: nextRowIndex(gastos) };
    setGastos(prev => [...prev, optimistic]);
    await withSync('guardar el gasto', () => repo.appendRow('Gastos', gasto));
  }, [categorias, tarjetas, gastos, repo]);

  const editExpense = useCallback(async (id, updates) => {
    // updates is old-model shape from MovimientosTab/HomeTab
    const g = gastos.find(x => x.id === id);
    if (!g) return;
    const cat = categorias.find(c => c.nombre === updates.category && c.tipo === 'egreso');
    const tar = tarjetas.find(t => t.nombre === updates.paymentMethod);
    const updated = {
      ...g,
      descripcion:  updates.description ?? g.descripcion,
      categoria_id: cat?.id ?? g.categoria_id,
      persona:      updates.user ?? g.persona,
      medio_pago:   updates.paymentMethod !== undefined ? normalizeMedioPago(updates.paymentMethod, tar) : g.medio_pago,
      tarjeta_id:   tar?.id ?? g.tarjeta_id,
      // monto and cuotas are immutable for installment expenses
    };
    setGastos(prev => prev.map(x => x.id === id ? updated : x));
    await withSync('editar el gasto', () => repo.updateRow('Gastos', g._rowIndex, updated));
  }, [gastos, categorias, tarjetas, repo]);

  const delExp = useCallback(async (id) => {
    const g = gastos.find(x => x.id === id);
    if (!g) return;
    const deletedIdx = g._rowIndex;
    setGastos(prev =>
      prev
        .filter(x => x.id !== id)
        .map(x => x._rowIndex > deletedIdx ? { ...x, _rowIndex: x._rowIndex - 1 } : x)
    );
    await withSync('eliminar el gasto', () => repo.deleteRow('Gastos', deletedIdx));
  }, [gastos, repo]);

  // ── Actions: incomes ───────────────────────────────────────────────────────

  const addIncomeQuick = useCallback(async (form) => {
    // form is old-model shape from HomeTab:
    // { description, amount, user, incomeCategory (name), month, year }
    const cat    = categorias.find(c => c.nombre === form.incomeCategory && c.tipo === 'ingreso');
    const month  = form.month ?? today.getMonth();
    const year   = form.year  ?? today.getFullYear();
    const fecha  = `${year}-${String(month + 1).padStart(2, '0')}-15`;
    const ingreso = {
      id:           crypto.randomUUID(),
      fecha,
      descripcion:  form.description || '',
      categoria_id: cat?.id || '',
      persona:      form.user || '',
      monto:        String(form.amount || 0),
      creado_en:    new Date().toISOString(),
    };
    const optimistic = { ...ingreso, _rowIndex: nextRowIndex(ingresos) };
    setIngresos(prev => [...prev, optimistic]);
    await withSync('guardar el ingreso', () => repo.appendRow('Ingresos', ingreso));
  }, [categorias, ingresos, repo]);

  const addIncome = addIncomeQuick;

  const editIncome = useCallback(async (id, updates) => {
    const i = ingresos.find(x => x.id === id);
    if (!i) return;
    const cat = categorias.find(c => c.nombre === updates.incomeCategory && c.tipo === 'ingreso');
    const updated = {
      ...i,
      descripcion:  updates.description ?? i.descripcion,
      categoria_id: cat?.id ?? i.categoria_id,
      persona:      updates.user ?? i.persona,
    };
    setIngresos(prev => prev.map(x => x.id === id ? updated : x));
    await withSync('editar el ingreso', () => repo.updateRow('Ingresos', i._rowIndex, updated));
  }, [ingresos, categorias, repo]);

  const delInc = useCallback(async (id) => {
    const i = ingresos.find(x => x.id === id);
    if (!i) return;
    const deletedIdx = i._rowIndex;
    setIngresos(prev =>
      prev
        .filter(x => x.id !== id)
        .map(x => x._rowIndex > deletedIdx ? { ...x, _rowIndex: x._rowIndex - 1 } : x)
    );
    await withSync('eliminar el ingreso', () => repo.deleteRow('Ingresos', deletedIdx));
  }, [ingresos, repo]);

  // ── Actions: budgets ───────────────────────────────────────────────────────

  const saveBudget = useCallback(async (catName, val) => {
    const cat = categorias.find(c => c.nombre === catName);
    if (!cat) return;
    const updated = { ...cat, presupuesto_base: String(parseFloat(val) || 0) };
    setCategorias(prev => prev.map(c => c.id === cat.id ? updated : c));
    await withSync('guardar presupuesto', () => repo.updateRow('Categorias', cat._rowIndex, updated));
  }, [categorias, repo]);

  // Income budgets share the same Categorias tab — same action.
  const saveIncBudget = saveBudget;

  // ── Actions: categories ────────────────────────────────────────────────────

  const addCategory = useCallback(async ({ name, icon, color, bg }) => {
    if (!name.trim()) return;
    if (categorias.some(c => c.nombre.toLowerCase() === name.trim().toLowerCase())) return;
    const cat = {
      id:              crypto.randomUUID(),
      tipo:            'egreso',
      nombre:          name.trim(),
      icono:           icon || '📦',
      color:           color || '#78716C',
      bg:              bg || '#FAFAF9',
      presupuesto_base: '0',
    };
    setCategorias(prev => [...prev, { ...cat, _rowIndex: nextRowIndex(categorias) }]);
    await withSync('guardar la categoría', () => repo.appendRow('Categorias', cat));
  }, [categorias, repo]);

  const addIncomeCategory = useCallback(async ({ name, icon, color, bg }) => {
    if (!name.trim()) return;
    if (categorias.some(c => c.nombre.toLowerCase() === name.trim().toLowerCase())) return;
    const cat = {
      id:              crypto.randomUUID(),
      tipo:            'ingreso',
      nombre:          name.trim(),
      icono:           icon || '📦',
      color:           color || '#78716C',
      bg:              bg || '#FAFAF9',
      presupuesto_base: '0',
    };
    setCategorias(prev => [...prev, { ...cat, _rowIndex: nextRowIndex(categorias) }]);
    await withSync('guardar la categoría', () => repo.appendRow('Categorias', cat));
  }, [categorias, repo]);

  const deleteCategory = useCallback(async (name) => {
    const cat = categorias.find(c => c.nombre === name);
    if (!cat) return;
    const deletedIdx = cat._rowIndex;
    setCategorias(prev =>
      prev
        .filter(c => c.nombre !== name)
        .map(c => c._rowIndex > deletedIdx ? { ...c, _rowIndex: c._rowIndex - 1 } : c)
    );
    await withSync('eliminar la categoría', () => repo.deleteRow('Categorias', deletedIdx));
  }, [categorias, repo]);

  const deleteIncomeCategory = deleteCategory;

  // ── Actions: credit cards ──────────────────────────────────────────────────

  const addCard = useCallback(async ({ name, limit }) => {
    if (!name.trim()) return;
    const card = {
      id:         crypto.randomUUID(),
      nombre:     name.trim(),
      limite:     String(parseFloat(limit) || 0),
      dia_cierre: '1',
    };
    setTarjetas(prev => [...prev, { ...card, _rowIndex: nextRowIndex(tarjetas) }]);
    await withSync('guardar la tarjeta', () => repo.appendRow('Tarjetas', card));
  }, [tarjetas, repo]);

  // ── Actions: savings accounts ──────────────────────────────────────────────

  const addSavingsAccount = useCallback(async ({ name, currency }) => {
    if (!name.trim()) return;
    const cuenta = {
      id:     crypto.randomUUID(),
      nombre: name.trim(),
      moneda: currency || 'ARS',
      target: '0',
    };
    setCuentas(prev => [...prev, { ...cuenta, _rowIndex: nextRowIndex(cuentas) }]);
    await withSync('crear la cuenta', () => repo.appendRow('Cuentas', cuenta));
  }, [cuentas, repo]);

  const saveSavAccCurrency = useCallback(async (id, currency) => {
    const c = cuentas.find(x => x.id === id);
    if (!c) return;
    const updated = { ...c, moneda: currency };
    setCuentas(prev => prev.map(x => x.id === id ? updated : x));
    await withSync('cambiar moneda', () => repo.updateRow('Cuentas', c._rowIndex, updated));
  }, [cuentas, repo]);

  const saveSavAccName = useCallback(async (id, name) => {
    if (!name.trim()) return;
    const c = cuentas.find(x => x.id === id);
    if (!c) return;
    const updated = { ...c, nombre: name.trim() };
    setCuentas(prev => prev.map(x => x.id === id ? updated : x));
    await withSync('renombrar cuenta', () => repo.updateRow('Cuentas', c._rowIndex, updated));
  }, [cuentas, repo]);

  const deleteSavingsAccount = useCallback(async (id) => {
    const c = cuentas.find(x => x.id === id);
    if (!c) return;
    const deletedIdx = c._rowIndex;
    setCuentas(prev =>
      prev
        .filter(x => x.id !== id)
        .map(x => x._rowIndex > deletedIdx ? { ...x, _rowIndex: x._rowIndex - 1 } : x)
    );
    // Orphaned transacciones for this account remain in Sheets but won't be shown (no cuenta match).
    await withSync('eliminar la cuenta', () => repo.deleteRow('Cuentas', deletedIdx));
  }, [cuentas, repo]);

  const addSavTx = useCallback(async (accId, { type, amount, note }) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    const finalAmt = type === 'sub' ? -amt : amt;
    const tx = {
      id:        crypto.randomUUID(),
      cuenta_id: accId,
      fecha:     todayStr,
      monto:     String(finalAmt),
      nota:      note || '',
      creado_en: new Date().toISOString(),
    };
    setTransacciones(prev => [...prev, { ...tx, _rowIndex: nextRowIndex(transacciones) }]);
    await withSync('guardar el movimiento', () => repo.appendRow('Transacciones', tx));
  }, [transacciones, repo]);

  const deleteSavTx = useCallback(async (accId, txId) => {
    const tx = transacciones.find(t => t.id === txId && t.cuenta_id === accId);
    if (!tx) return;
    const deletedIdx = tx._rowIndex;
    setTransacciones(prev =>
      prev
        .filter(t => t.id !== txId)
        .map(t => t._rowIndex > deletedIdx ? { ...t, _rowIndex: t._rowIndex - 1 } : t)
    );
    await withSync('eliminar el movimiento', () => repo.deleteRow('Transacciones', deletedIdx));
  }, [transacciones, repo]);

  const getAccBalance = useCallback(
    (acc) => acc.transactions.reduce((s, t) => s + t.amount, 0),
    []
  );

  // ── Actions: recurrentes ───────────────────────────────────────────────────

  const applyRecurrente = useCallback(async (rec) => {
    const dia   = parseInt(rec.dia_del_mes) || 1;
    const fecha = `${selYear}-${String(selMonth + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const gasto = {
      id:           crypto.randomUUID(),
      fecha,
      descripcion:  rec.descripcion,
      categoria_id: rec.categoria_id,
      persona:      rec.persona,
      monto:        String(rec.monto),
      medio_pago:   rec.medio_pago,
      tarjeta_id:   rec.tarjeta_id || '',
      cuotas:       '1',
      recurrente_id: rec.id,
      creado_en:    new Date().toISOString(),
    };
    setGastos(prev => [...prev, { ...gasto, _rowIndex: nextRowIndex(gastos) }]);
    await withSync('aplicar recurrente', () => repo.appendRow('Gastos', gasto));
  }, [selMonth, selYear, gastos, repo]);

  // ── Settings savers (localStorage only) ───────────────────────────────────

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

  // ── Export (browser APIs — no domain logic) ────────────────────────────────
  const [exportToast, setExportToast] = useState('');

  const exportCSV = useCallback(() => {
    const esc = v => String(v ?? '').replace(/"/g, '""');
    const row = arr => arr.map(c => `"${esc(c)}"`).join(',') + '\n';
    let csv = '﻿';
    csv += 'DUPLA\n\n=== EGRESOS ===\n' + row(['Fecha','Descripción','Categoría','Medio de pago','Cuotas','Persona','Monto']);
    [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e =>
      csv += row([e.date, e.description, e.category, e.paymentMethod || 'Efectivo', e.installments || 1, e.user, e.amount])
    );
    csv += '\n=== INGRESOS ===\n' + row(['Fecha','Descripción','Categoría','Persona','Monto']);
    incomes.forEach(i => csv += row([i.fecha, i.description, i.incomeCategory, i.user, i.amount]));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: 'dupla.csv' }).click();
    URL.revokeObjectURL(url);
  }, [expenses, incomes]);

  const exportGSheets = useCallback(() => {
    const t = '\t', nl = '\n';
    const row = arr => arr.join(t) + nl;
    let tsv = 'EGRESOS' + nl + row(['Fecha','Descripción','Categoría','Medio de pago','Cuotas','Persona','Monto']);
    [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e =>
      tsv += row([e.date, e.description || '', e.category, e.paymentMethod || 'Efectivo', e.installments || 1, e.user, e.amount])
    );
    tsv += nl + 'INGRESOS' + nl + row(['Fecha','Descripción','Categoría','Persona','Monto']);
    incomes.forEach(i => tsv += row([i.fecha, i.description || '', i.incomeCategory, i.user, i.amount]));
    navigator.clipboard.writeText(tsv)
      .then(() => { setExportToast('✓ Copiado — pegá en Google Sheets'); setTimeout(() => setExportToast(''), 3000); })
      .catch(() => { setExportToast('No se pudo copiar');                  setTimeout(() => setExportToast(''), 3000); });
  }, [expenses, incomes]);

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    // sync
    loading, syncing, lastSync, syncError, refresh,
    // nav
    selMonth, selYear, setSelMonth, setSelYear,
    // settings
    billingDayOfMonth, saveBillingDay,
    userNames, saveUserNames,
    exchangeRate, saveExchangeRate,
    // raw new-model arrays (for future tab migration)
    gastos, ingresos, categorias, tarjetas, recurrentes, cuentas, transacciones,
    // backward-compat arrays (existing tabs keep working)
    expenses, incomes,
    categories, incomeCategories,
    creditCards, savingsAccounts,
    // derived
    filtExp, filtInc,
    effBudgets, effIncBudgets,
    totExp, totInc, totExpPrevMonth, balance, totBudget, savingsTotal,
    expByCat, incByCat, expByUser,
    annualData, daysInMonth, dayNow, projected,
    alerts, pieData, barData,
    prevMonth, prevYear,
    recurrentesPendientes,
    // actions: expenses
    addExpense, editExpense, delExp,
    // actions: incomes
    addIncome, addIncomeQuick, editIncome, delInc,
    // actions: budgets
    saveBudget, saveIncBudget,
    // actions: categories
    addCategory, deleteCategory,
    addIncomeCategory, deleteIncomeCategory,
    // actions: cards
    addCard,
    // actions: savings
    addSavingsAccount, deleteSavingsAccount,
    addSavTx, deleteSavTx, getAccBalance,
    saveSavAccCurrency, saveSavAccName,
    // actions: recurrentes
    applyRecurrente,
    // export
    exportCSV, exportGSheets, exportToast,
    // sheet management
    getSheetId:      () => repo?.getSheetId(),
    setManualSheetId: id => repo?.setManualSheetId(id),
    // utils forwarded for backward compat
    fmt, fmtK,
    // legacy no-ops (consumed by some tabs, no longer needed)
    persist: async () => {},
    overrides: {}, incomeOverrides: {},
    noteKey: '', notes: {},
    updateNote: () => {}, saveNote: async () => {},
  };
}
