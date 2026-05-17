import { useState, useMemo, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import LoginScreen from './components/auth/LoginScreen';
import SplashScreen from './components/SplashScreen';
import Header from './components/layout/Header';
import { DuplaLogo } from './components/DuplaLogo';
import TabBar from './components/layout/TabBar';
import HomeTab from './components/tabs/HomeTab';
import MovimientosTab from './components/tabs/MovimientosTab';
import BudgetTab from './components/tabs/BudgetTab';
import SavingsTab from './components/tabs/SavingsTab';
import ChartsTab from './components/tabs/ChartsTab';
import CardsTab from './components/tabs/CardsTab';

import { useGoogleSheets } from './hooks/useGoogleSheets';
import { useTheme } from './hooks/useTheme';
import {
  SEED, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES,
  PAYMENT_METHODS_FIXED, MONTHS, MONTHS_FULL,
} from './utils/constants';
import { fmt, fmtK, today, todayStr } from './utils/formatters';
import { bKey, effectiveBudget } from './utils/budgets';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ── MÁS PANEL — standalone so React can track its identity across renders ────────
function MasPanel({
  themeId, setThemeId, THEME_LIST,
  fontScale, setFontScale,
  setTab,
  billingDayOfMonth, saveBillingDay,
  userNames, saveUserNames,
  exchangeRate, saveExchangeRate,
  exportCSV, exportGSheets, exportToast,
  onLogout, userInfo,
  getSheetId, setManualSheetId,
}) {
  const [sheetInput, setSheetInput] = useState(() => getSheetId() || '');
  const { C, Sx } = useTheme();
  return (
    <div>
      {/* Subheader */}
      <div style={{ background: C.coral, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#fff', letterSpacing: '-0.3px' }}>Más</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Configuración y datos</div>
      </div>

      {/* ── VISUALES ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Visuales</div>
      <div style={{ ...Sx.fcard, marginBottom: 20 }}>
        {/* Tema */}
        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {THEME_LIST.map(t => {
            const active = t.id === themeId;
            return (
              <button key={t.id} onClick={() => setThemeId(t.id)} title={t.name}
                style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 10,
                  border: `0.5px solid ${active ? C.coral : C.border}`,
                  background: active ? C.coralL : C.gray6,
                  cursor: 'pointer' }}>
                <span style={{ fontSize: 22 }}>{t.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: active ? C.coral : C.gray2 }}>{t.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tamaño de texto */}
        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tamaño de texto</div>
        <div style={{ display: 'flex', background: C.gray6, borderRadius: 10, padding: 3, gap: 3 }}>
          {[{ label: 'Normal', value: 1 }, { label: 'Grande', value: 1.2 }].map(opt => {
            const active = Math.abs(fontScale - opt.value) < 0.05;
            return (
              <button key={opt.value} onClick={() => setFontScale(opt.value)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                  fontSize: opt.value === 1 ? 13 : 15, fontWeight: 500,
                  background: active ? C.white : 'transparent',
                  color: active ? C.coral : C.gray3,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer' }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VISTAS ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Vistas</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'charts', icon: '◉', label: 'Gráficos',  desc: 'Distribución y tendencias', color: C.sky,      bg: C.skyL },
          { id: 'cards',  icon: '💳', label: 'Tarjetas',  desc: 'Movimientos y cuotas',      color: C.lavender, bg: C.lavL },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{ background: item.bg, borderRadius: 12, padding: '14px', border: `0.5px solid ${item.color}44`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>{item.desc}</div>
          </button>
        ))}
      </div>

      {/* ── CONFIGURACIÓN ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Configuración</div>

      {/* Ciclo de facturación */}
      <div style={{ ...Sx.fcard, marginBottom: 10 }}>
        <div style={Sx.ft}>Ciclo de facturación</div>
        <div style={{ fontSize: 12, color: C.gray3, marginBottom: 10 }}>Día del mes que comienza el ciclo</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="text" inputMode="numeric" value={billingDayOfMonth}
            onChange={e => saveBillingDay(Math.max(1, Math.min(31, parseInt(e.target.value.replace(/\D/g, ''), 10) || 27)))}
            style={{ ...Sx.inp, fontSize: 14, textAlign: 'center' }} />
          <div style={{ ...Sx.inp, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray6, color: C.gray2 }}>
            día {billingDayOfMonth}
          </div>
        </div>
      </div>

      {/* Nombres de usuarios */}
      <div style={{ ...Sx.fcard, marginBottom: 10 }}>
        <div style={Sx.ft}>Nombres de usuarios</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {userNames.map((name, idx) => (
            <div key={idx}>
              <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Usuario {idx + 1}</div>
              <input type="text" value={name}
                onChange={e => saveUserNames([...userNames.slice(0, idx), e.target.value, ...userNames.slice(idx + 1)])}
                style={{ ...Sx.inp }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tasa de cambio */}
      <div style={{ ...Sx.fcard, marginBottom: 20 }}>
        <div style={Sx.ft}>Tasa de cambio USD/ARS</div>
        <div style={{ fontSize: 12, color: C.gray3, marginBottom: 10 }}>Usa esto para calcular presupuestos anuales en dólares</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="text" inputMode="numeric" value={exchangeRate}
            onChange={e => saveExchangeRate(e.target.value.replace(/\D/g, '') || '1100')}
            style={{ ...Sx.inp, fontSize: 14, textAlign: 'center' }} />
          <div style={{ ...Sx.inp, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray6, color: C.gray2 }}>
            1 USD = {exchangeRate} ARS
          </div>
        </div>
      </div>

      {/* ── DATOS ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Datos</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {[
          { onClick: exportCSV,     icon: '⬇',  title: 'Exportar a CSV',            sub: 'Descargar todos los datos' },
          { onClick: exportGSheets, icon: '📋',  title: 'Copiar para Google Sheets', sub: 'Pegá directo en una hoja nueva' },
        ].map(item => (
          <button key={item.title} onClick={item.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
              background: C.white, borderRadius: 12, border: `0.5px solid ${C.border}`,
              cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{item.title}</div>
              {item.sub && <div style={{ fontSize: 11, color: C.gray3, marginTop: 1 }}>{item.sub}</div>}
            </div>
            <span style={{ marginLeft: 'auto', color: C.gray4, fontSize: 14 }}>›</span>
          </button>
        ))}
        {exportToast && (
          <div style={{ background: C.sageL, color: C.sage, borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 500, textAlign: 'center', border: `0.5px solid ${C.sage}44` }}>{exportToast}</div>
        )}
      </div>

      {/* ── VINCULAR SHEET ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Google Sheet</div>
      <div style={{ ...Sx.fcard, marginBottom: 20 }}>
        <div style={Sx.ft}>Vincular hoja de cálculo</div>
        <div style={{ fontSize: 12, color: C.gray3, marginBottom: 10, lineHeight: 1.5 }}>
          Pegá el link de compartir de Google Sheets. Dejalo vacío para usar tu propio Sheet.
        </div>
        <input
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={sheetInput}
          onChange={e => setSheetInput(e.target.value)}
          style={{ ...Sx.inp, marginBottom: 6, fontSize: 12 }}
        />
        {sheetInput && (() => {
          const match = sheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
          return match
            ? <div style={{ fontSize: 11, color: C.sage, marginBottom: 10 }}>ID detectado: {match[1]}</div>
            : <div style={{ fontSize: 11, color: C.rose, marginBottom: 10 }}>URL no reconocida</div>;
        })()}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const match = sheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
              const id = match ? match[1] : sheetInput.trim();
              setManualSheetId(id);
              window.location.reload();
            }}
            style={{ ...Sx.btn, flex: 1, fontSize: 13 }}>
            Aplicar
          </button>
          <button
            onClick={() => { setSheetInput(''); setManualSheetId(''); window.location.reload(); }}
            style={{ ...Sx.btn, flex: 1, fontSize: 13, background: C.gray4 }}>
            Resetear
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
          background: C.white, borderRadius: 12, border: `0.5px solid ${C.border}`,
          cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>↩</span>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>Cerrar sesión</div>
          {userInfo?.email && <div style={{ fontSize: 11, color: C.gray3, marginTop: 1 }}>{userInfo.email}</div>}
        </div>
        <span style={{ marginLeft: 'auto', color: C.gray4, fontSize: 14 }}>›</span>
      </button>
    </div>
  );
}

// ── INNER APP (after auth) ─────────────────────────────────────────────────────
function DuplaApp({ token, userInfo, onLogout, showSplash }) {
  const { C, themeId, setThemeId, THEME_LIST, fontScale, setFontScale } = useTheme();
  const { load, save, setManualSheetId, getSheetId } = useGoogleSheets(token, userInfo?.sub);

  // ── NAV ──
  const [tab, setTab]     = useState('home');
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear,  setSelYear]  = useState(today.getFullYear());

  // ── SYNC ──
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState('');

  // ── SETTINGS ──
  const [billingDayOfMonth, setBillingDayOfMonth] = useState(() => {
    const stored = localStorage.getItem('dupla_billing_day');
    // Si el valor guardado era el viejo default (27), lo reseteamos a 1
    if (!stored || stored === '27') { localStorage.setItem('dupla_billing_day', '1'); return 1; }
    return parseInt(stored, 10);
  });
  const [userNames, setUserNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dupla_user_names') || '["Ana","Fabio"]'); } catch { return ['Ana', 'Fabio']; }
  });
  const [exchangeRate, setExchangeRate] = useState(() => parseFloat(localStorage.getItem('dupla_exchange_rate') || '1100'));

  // ── DATA ──
  const [expenses,          setExpenses]          = useState([]);
  const [incomes,           setIncomes]           = useState([]);
  const [savingGoals,       setSavingGoals]       = useState([]);
  const [base,              setBase]              = useState(SEED.baseBudgets);
  const [overrides,         setOverrides]         = useState({});
  const [categories,        setCategories]        = useState(DEFAULT_CATEGORIES);
  const [incomeCategories,  setIncomeCategories]  = useState(DEFAULT_INCOME_CATEGORIES);
  const [incomeBase,        setIncomeBase]        = useState(SEED.incomeBaseBudgets);
  const [incomeOverrides,   setIncomeOverrides]   = useState({});
  const [recurring,         setRecurring]         = useState([]);
  const [notes,             setNotes]             = useState({});
  const [creditCards,       setCreditCards]       = useState([]);
  const [splits,            setSplits]            = useState([]);
  const [savingsAccounts,   setSavingsAccounts]   = useState([]);

  // ── HELPERS ──
  const paymentMethods = useMemo(() => [...PAYMENT_METHODS_FIXED, ...creditCards.map(c => c.name)], [creditCards]);
  const getCat = useCallback(name => categories.find(c => c.name === name) || { icon: '📦', color: C.gray3, bg: C.gray6, name }, [categories, C]);

  // Save settings to localStorage
  const saveBillingDay = (day) => {
    setBillingDayOfMonth(day);
    localStorage.setItem('dupla_billing_day', String(day));
  };
  const saveUserNames = (names) => {
    setUserNames(names);
    localStorage.setItem('dupla_user_names', JSON.stringify(names));
  };
  const saveExchangeRate = (rate) => {
    const num = parseFloat(rate) || 1100;
    setExchangeRate(num);
    localStorage.setItem('dupla_exchange_rate', String(num));
  };

  const persist = useCallback(async (updates = {}) => {
    setSyncing(true);
    setSyncError('');
    const state = {
      expenses, incomes, savingGoals, baseBudgets: base, budgetOverrides: overrides,
      categories, incomeCategories, incomeBaseBudgets: incomeBase, incomeBudgetOverrides: incomeOverrides,
      recurringExpenses: recurring, monthNotes: notes, creditCards, splits, savingsAccounts,
      ...updates
    };
    try {
      await save(state);
      setLastSync(new Date());
    } catch (e) {
      console.error('[Dupla] Save error', e);
      setSyncError('No pudimos guardar los cambios. Revisá tu conexión y volvé a intentar.');
    }
    setSyncing(false);
  }, [expenses, incomes, savingGoals, base, overrides, categories, incomeCategories, incomeBase, incomeOverrides, recurring, notes, creditCards, splits, savingsAccounts, save]);

  const applyRecurring = useCallback((rec, exp) => {
    const toAdd = [];
    const m = today.getMonth(), y = today.getFullYear(), d = today.getDate();
    rec.filter(r => r.active).forEach(r => {
      if ((r.dayOfMonth || 1) > d) return;
      const already = exp.some(e => {
        const dt = new Date(e.date);
        return e.description === r.description && dt.getMonth() === m && dt.getFullYear() === y;
      });
      if (!already) toAdd.push({
        ...r, id: Date.now() + Math.random(),
        date: `${y}-${String(m + 1).padStart(2, '0')}-${String(r.dayOfMonth || 1).padStart(2, '0')}`,
        tags: [], installments: 1
      });
    });
    return toAdd;
  }, []);

  // ── LOAD ──
  useEffect(() => {
    load().then(result => {
      if (!result.ok) {
        console.warn('[Dupla] Invalid persisted data, using safe defaults', result.issues || result.error);
        setSyncError('Los datos guardados no tienen el formato esperado. Cargamos una base segura sin sobrescribir tu Sheet.');
      }

      const d = result.data;
      if (d && d.expenses) {
        const rec = d.recurringExpenses || [];
        const exp = d.expenses || [];
        const auto = applyRecurring(rec, exp);
        const finalExp = auto.length ? [...exp, ...auto] : exp;
        setExpenses(finalExp); setIncomes(d.incomes || []); setSavingGoals(d.savingGoals || []);
        setBase(d.baseBudgets || SEED.baseBudgets); setOverrides(d.budgetOverrides || {});
        setCategories(d.categories || DEFAULT_CATEGORIES); setRecurring(rec);
        setIncomeCategories(d.incomeCategories || DEFAULT_INCOME_CATEGORIES);
        setIncomeBase(d.incomeBaseBudgets || SEED.incomeBaseBudgets);
        setIncomeOverrides(d.incomeBudgetOverrides || {});
        setNotes(d.monthNotes || {}); setCreditCards(d.creditCards || []); setSplits(d.splits || []);
        // Normalize: accounts without currency default to 'ARS'
        setSavingsAccounts((d.savingsAccounts || []).map(a => ({ ...a, currency: a.currency || 'ARS' })));
        setLastSync(new Date());
        if (result.ok && (auto.length || result.migrated)) {
          save({ ...d, expenses: finalExp }).catch(error => {
            console.error('[Dupla] Migration save error', error);
            setSyncError('Los datos cargaron bien, pero no pudimos guardar la migración automática.');
          });
        }
      }
      setLoading(false);
    }).catch((err) => {
      if (err?.message === 'AUTH_EXPIRED') {
        onLogout();
      }
      if (err?.message !== 'AUTH_EXPIRED') {
        console.error('[Dupla] Load error', err);
        setSyncError('No pudimos conectar con Google Sheets. Revisá tu conexión o iniciá sesión nuevamente.');
      }
      setLoading(false);
    });
  }, [applyRecurring, load, onLogout, save]);

  // ── DERIVED ──
  const effBudgets    = useMemo(() => { const r = {}; categories.forEach(c => { r[c.name] = effectiveBudget(c.name, selMonth, selYear, base, overrides); }); return r; }, [categories, selMonth, selYear, base, overrides]);
  const effIncBudgets = useMemo(() => { const r = {}; incomeCategories.forEach(c => { r[c.name] = effectiveBudget(c.name, selMonth, selYear, incomeBase, incomeOverrides); }); return r; }, [incomeCategories, selMonth, selYear, incomeBase, incomeOverrides]);
  // filtExp: siempre por mes calendario (día real de la fecha del gasto)
  const filtExp     = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  }), [expenses, selMonth, selYear]);
  const filtInc     = useMemo(() => incomes.filter(i => i.month === selMonth && i.year === selYear), [incomes, selMonth, selYear]);
  // Previous month totals (for delta indicator on home)
  const prevMonth   = selMonth === 0 ? 11 : selMonth - 1;
  const prevYear    = selMonth === 0 ? selYear - 1 : selYear;
  const totExpPrevMonth = useMemo(() => expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  }).reduce((s, e) => s + e.amount, 0), [expenses, prevMonth, prevYear]);
  const totExp      = filtExp.reduce((s, e) => s + e.amount, 0);
  const totInc      = filtInc.reduce((s, i) => s + i.amount, 0);
  const totSav      = useMemo(() => savingGoals.reduce((s, g) => s + g.contributions.filter(c => c.month === selMonth && c.year === selYear).reduce((a, c) => a + c.amount, 0), 0), [savingGoals, selMonth, selYear]);
  // Total balance in ARS savings accounts
  const savingsTotal = useMemo(() => savingsAccounts.filter(a => a.currency === 'ARS').reduce((s, a) => s + a.transactions.reduce((t, tx) => t + tx.amount, 0), 0), [savingsAccounts]);
  const balance     = totInc - totExp - totSav;
  const totBudget   = Object.values(effBudgets).reduce((a, b) => a + b, 0);
  const expByCat    = useMemo(() => { const m = {}; filtExp.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; }); return m; }, [filtExp]);
  const incByCat    = useMemo(() => { const m = {}; filtInc.forEach(i => { const k = i.incomeCategory || 'Sin categoría'; m[k] = (m[k] || 0) + i.amount; }); return m; }, [filtInc]);
  const expByUser   = useMemo(() => { const m = {}; filtExp.forEach(e => { m[e.user] = (m[e.user] || 0) + e.amount; }); return m; }, [filtExp]);
  const annualData  = useMemo(() => Array.from({ length: 12 }, (_, mo) => ({
    name: MONTHS[mo], mo,
    Egresos:  expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === mo && d.getFullYear() === selYear; }).reduce((s, e) => s + e.amount, 0),
    Ingresos: incomes.filter(i => i.month === mo && i.year === selYear).reduce((s, i) => s + i.amount, 0),
  })), [expenses, incomes, selYear]);
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const dayNow      = selMonth === today.getMonth() && selYear === today.getFullYear() ? today.getDate() : daysInMonth;
  const projected   = dayNow > 0 ? Math.round((totExp / dayNow) * daysInMonth) : 0;
  const alerts      = useMemo(() => categories.filter(c => { const sp = expByCat[c.name] || 0; const bu = effBudgets[c.name] || 0; return bu > 0 && sp / bu >= 0.8; }).map(c => ({ ...c, spent: expByCat[c.name] || 0, budget: effBudgets[c.name], pct: Math.round(((expByCat[c.name] || 0) / effBudgets[c.name]) * 100) })), [categories, expByCat, effBudgets]);
  const pieData     = useMemo(() => categories.filter(c => expByCat[c.name] > 0).map(c => ({ name: c.name, value: expByCat[c.name], color: c.color, icon: c.icon })).sort((a, b) => b.value - a.value), [categories, expByCat]);
  const barData     = useMemo(() => categories.filter(c => expByCat[c.name] > 0 || effBudgets[c.name] > 0).map(c => ({ name: c.name.substring(0, 7), Gastado: expByCat[c.name] || 0, Presupuesto: effBudgets[c.name] || 0 })), [categories, expByCat, effBudgets]);

  // ── ACTIONS ──
  const delExp = id => { const u = expenses.filter(e => e.id !== id); setExpenses(u); persist({ expenses: u }); };
  const delInc = id => { const u = incomes.filter(i => i.id !== id); setIncomes(u); persist({ incomes: u }); };
  const editExpense = (id, updates) => { const u = expenses.map(e => e.id === id ? { ...e, ...updates } : e); setExpenses(u); persist({ expenses: u }); };
  const editIncome = (id, updates) => { const u = incomes.map(i => i.id === id ? { ...i, ...updates } : i); setIncomes(u); persist({ incomes: u }); };
  const saveBudget    = (cat, val) => { const u = { ...overrides,       [bKey(selYear, selMonth, cat)]: parseFloat(val) || 0 }; setOverrides(u);       persist({ budgetOverrides: u }); };
  const saveIncBudget = (cat, val) => { const u = { ...incomeOverrides, [bKey(selYear, selMonth, cat)]: parseFloat(val) || 0 }; setIncomeOverrides(u); persist({ incomeBudgetOverrides: u }); };

  const addIncome     = form  => { const u = [...incomes, { ...form, id: Date.now(), amount: parseFloat(form.amount), month: selMonth, year: selYear }]; setIncomes(u); persist({ incomes: u }); };
  const addExpense    = exp   => { const u = [...expenses, exp]; setExpenses(u); persist({ expenses: u }); };
  const addIncomeQuick = inc  => { const u = [...incomes, inc]; setIncomes(u); persist({ incomes: u }); };

  const addIncomeCategory = cat => {
    if (!cat.name.trim() || incomeCategories.find(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) return;
    const newCats = [...incomeCategories, { ...cat, name: cat.name.trim() }];
    const newBase = { ...incomeBase, [cat.name.trim()]: 0 };
    setIncomeCategories(newCats); setIncomeBase(newBase);
    persist({ incomeCategories: newCats, incomeBaseBudgets: newBase });
  };
  const deleteIncomeCategory = name => { const u = incomeCategories.filter(c => c.name !== name); setIncomeCategories(u); persist({ incomeCategories: u }); };
  const addCategory    = cat  => { if (!cat.name.trim() || categories.find(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) return; const u = [...categories, { ...cat, name: cat.name.trim() }]; setCategories(u); persist({ categories: u }); };
  const deleteCategory = name => { const u = categories.filter(c => c.name !== name); setCategories(u); persist({ categories: u }); };

  const addCard = card => { const u = [...creditCards, { id: Date.now(), ...card }]; setCreditCards(u); persist({ creditCards: u }); };

  const addSavingsAccount = form => {
    if (!form.name.trim()) return;
    const u = [...savingsAccounts, { id: Date.now(), name: form.name.trim(), currency: form.currency, transactions: [] }];
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  };
  const deleteSavingsAccount = id => { const u = savingsAccounts.filter(a => a.id !== id); setSavingsAccounts(u); persist({ savingsAccounts: u }); };
  const addSavTx = (accId, txForm) => {
    const amt = parseFloat(txForm.amount);
    if (!amt || amt <= 0) return;
    const finalAmt = txForm.type === 'sub' ? -amt : amt;
    const u = savingsAccounts.map(a => a.id !== accId ? a : { ...a, transactions: [...a.transactions, { id: Date.now(), amount: finalAmt, note: txForm.note || '', date: todayStr }] });
    setSavingsAccounts(u); persist({ savingsAccounts: u });
  };
  const deleteSavTx    = (accId, txId) => { const u = savingsAccounts.map(a => a.id !== accId ? a : { ...a, transactions: a.transactions.filter(t => t.id !== txId) }); setSavingsAccounts(u); persist({ savingsAccounts: u }); };
  const saveSavAccName     = (id, name)     => { if (!name.trim()) return; const u = savingsAccounts.map(a => a.id !== id ? a : { ...a, name: name.trim() }); setSavingsAccounts(u); persist({ savingsAccounts: u }); };
  const saveSavAccCurrency = (id, currency) => { const u = savingsAccounts.map(a => a.id !== id ? a : { ...a, currency }); setSavingsAccounts(u); persist({ savingsAccounts: u }); };
  const getAccBalance  = acc => acc.transactions.reduce((s, t) => s + t.amount, 0);

  const noteKey  = `${selYear}-${selMonth}`;
  const updateNote = val => { const u = { ...notes, [noteKey]: val }; setNotes(u); return u; };
  const saveNote   = () => persist({ monthNotes: notes });

  // ── EXPORT ──
  const [exportToast, setExportToast] = useState('');
  const exportCSV = () => {
    const esc = v => String(v ?? '').replace(/"/g, '""');
    const row = arr => arr.map(c => `"${esc(c)}"`).join(',') + '\n';
    let csv = '﻿';
    csv += 'DUPLA\n\n=== EGRESOS ===\n' + row(['Fecha','Descripción','Categoría','Medio de pago','Cuotas','Persona','Monto']);
    [...expenses].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(e => csv += row([e.date,e.description,e.category,e.paymentMethod||'Efectivo',e.installments||1,e.user,e.amount]));
    csv += '\n=== INGRESOS ===\n' + row(['Mes','Año','Descripción','Persona','Monto']);
    incomes.forEach(i => csv += row([MONTHS_FULL[i.month],i.year,i.description,i.user,i.amount]));
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {href:url, download:'dupla.csv'}).click();
    URL.revokeObjectURL(url);
  };
  const exportGSheets = () => {
    const t = '\t', nl = '\n';
    const row = arr => arr.join(t) + nl;
    let tsv = 'EGRESOS' + nl + row(['Fecha','Descripción','Categoría','Medio de pago','Cuotas','Persona','Monto']);
    [...expenses].sort((a,b) => new Date(a.date)-new Date(b.date)).forEach(e => tsv += row([e.date,e.description||'',e.category,e.paymentMethod||'Efectivo',e.installments||1,e.user,e.amount]));
    tsv += nl + 'INGRESOS' + nl + row(['Mes','Año','Descripción','Persona','Monto']);
    incomes.forEach(i => tsv += row([MONTHS_FULL[i.month],i.year,i.description||'',i.user,i.amount]));
    navigator.clipboard.writeText(tsv).then(() => { setExportToast('✓ Copiado — pegá en Google Sheets'); setTimeout(() => setExportToast(''), 3000); }).catch(() => { setExportToast('No se pudo copiar'); setTimeout(() => setExportToast(''), 3000); });
  };

  if (loading || showSplash) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:C.bg,gap:0}}>
      <DuplaLogo size={60} />
      <div style={{marginTop:16,fontSize:28,fontWeight:500,color:C.gray1,letterSpacing:'-0.6px'}}>dupla</div>
      {loading && <div style={{marginTop:6,fontSize:13,color:C.gray3}}>Conectando…</div>}
      <div style={{marginTop:44,display:'flex',gap:7}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:6,height:6,borderRadius:'50%',background:C.coral,animation:`dupla-pulse 1.1s ${i*0.18}s ease-in-out infinite`}}/>
        ))}
      </div>
    </div>
  );

  const shared = {
    selMonth, selYear, setSelMonth, setSelYear,
    billingDayOfMonth, saveBillingDay, userNames, saveUserNames, exchangeRate, saveExchangeRate,
    categories, incomeCategories, expenses, incomes, savingGoals, creditCards, savingsAccounts,
    filtExp, filtInc, totExp, totInc, totSav, totBudget, balance, savingsTotal, totExpPrevMonth, prevMonth, prevYear,
    effBudgets, effIncBudgets, expByCat, incByCat, expByUser,
    annualData, daysInMonth, dayNow, projected, alerts, pieData, barData,
    getCat, fmt, fmtK, paymentMethods, notes, noteKey, overrides, incomeOverrides,
    persist, delExp, delInc, editExpense, editIncome, saveBudget, saveIncBudget,
    addExpense, addIncomeQuick, addIncome,
    addCategory, deleteCategory, addIncomeCategory, deleteIncomeCategory,
    addCard,
    addSavingsAccount, deleteSavingsAccount, addSavTx, deleteSavTx, saveSavAccName, saveSavAccCurrency, getAccBalance,
    updateNote, saveNote, exportCSV, exportGSheets, exportToast, setTab,
  };

  return (
    <div style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", background: C.gray6, minHeight: '100vh', maxWidth: 520, margin: '0 auto' }}>
      <Header selMonth={selMonth} selYear={selYear} setSelMonth={setSelMonth} setSelYear={setSelYear} syncing={syncing} lastSync={lastSync} alerts={alerts} userInfo={userInfo} onLogout={onLogout} setTab={setTab} />
      {syncError && (
        <div style={{ margin: '12px 16px 0', padding: '10px 12px', borderRadius: 10, background: C.roseL, color: C.rose, border: `0.5px solid ${C.rose}44`, fontSize: 12, lineHeight: 1.4 }}>
          {syncError}
        </div>
      )}
      <div style={{ padding: '16px 16px 0', paddingBottom: 96 }}>
        <div style={{ zoom: fontScale }}>
          {tab === 'home'      && <HomeTab      {...shared} />}
          {tab === 'movements' && <MovimientosTab {...shared} />}
          {tab === 'budget'    && <BudgetTab    {...shared} />}
          {tab === 'savings'   && <SavingsTab   {...shared} />}
          {tab === 'charts'    && <ChartsTab    {...shared} />}
          {tab === 'cards'     && <CardsTab     {...shared} />}
          {tab === 'mas'       && <MasPanel
            themeId={themeId} setThemeId={setThemeId} THEME_LIST={THEME_LIST}
            fontScale={fontScale} setFontScale={setFontScale}
            setTab={setTab}
            billingDayOfMonth={billingDayOfMonth} saveBillingDay={saveBillingDay}
            userNames={userNames} saveUserNames={saveUserNames}
            exchangeRate={exchangeRate} saveExchangeRate={saveExchangeRate}
            exportCSV={exportCSV} exportGSheets={exportGSheets} exportToast={exportToast}
            onLogout={onLogout} userInfo={userInfo}
            getSheetId={getSheetId} setManualSheetId={setManualSheetId}
          />}
        </div>
      </div>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [token,      setToken]      = useState(() => localStorage.getItem('dupla_token') || null);
  const [userInfo,   setUserInfo]   = useState(() => { try { return JSON.parse(localStorage.getItem('dupla_user') || 'null'); } catch { return null; } });
  const [showSplash, setShowSplash] = useState(true);

  const handleLogin = useCallback(async (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('dupla_token', accessToken);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      const info = await res.json();
      setUserInfo(info); localStorage.setItem('dupla_user', JSON.stringify(info));
    } catch (error) {
      console.warn('[Dupla] Could not load Google profile', error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    const sub = userInfo?.sub;
    setToken(null); setUserInfo(null);
    localStorage.removeItem('dupla_token');
    localStorage.removeItem('dupla_user');
    localStorage.removeItem('dupla_sheet_id'); // legacy key
    if (sub) localStorage.removeItem(`dupla_sheet_id_${sub}`);
  }, [userInfo]);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID || ''}>
      {/* Splash siempre encima — la pantalla real renderiza debajo desde el inicio */}
      {!token
        ? <LoginScreen onLogin={handleLogin} />
        : <DuplaApp token={token} userInfo={userInfo} onLogout={handleLogout} showSplash={showSplash} />
      }
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </GoogleOAuthProvider>
  );
}
