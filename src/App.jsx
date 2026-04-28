import { useState, useMemo, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import LoginScreen from './components/auth/LoginScreen';
import Header from './components/layout/Header';
import TabBar from './components/layout/TabBar';
import HomeTab from './components/tabs/HomeTab';
import IncomeTab from './components/tabs/IncomeTab';
import ExpensesTab from './components/tabs/ExpensesTab';
import BudgetTab from './components/tabs/BudgetTab';
import SavingsTab from './components/tabs/SavingsTab';
import ChartsTab from './components/tabs/ChartsTab';
import CardsTab from './components/tabs/CardsTab';

import { useGoogleSheets } from './hooks/useGoogleSheets';
import {
  C, SEED, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES,
  PAYMENT_METHODS_FIXED, MONTHS, MONTHS_FULL,
} from './utils/constants';
import { fmt, fmtK, today, todayStr } from './utils/formatters';
import { bKey, effectiveBudget } from './utils/budgets';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ── INNER APP (after auth) ─────────────────────────────────────────────────────
function DuplaApp({ token, userInfo, onLogout }) {
  const { load, save } = useGoogleSheets(token);

  // ── NAV ──
  const [tab, setTab]           = useState('home');
  const [showMore, setShowMore] = useState(false);
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear,  setSelYear]  = useState(today.getFullYear());

  // ── SYNC ──
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [lastSync, setLastSync] = useState(null);

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
  const getCat = useCallback(name => categories.find(c => c.name === name) || { icon: '📦', color: C.gray3, bg: C.gray6, name }, [categories]);

  const persist = useCallback(async (updates = {}) => {
    setSyncing(true);
    const state = {
      expenses, incomes, savingGoals, baseBudgets: base, budgetOverrides: overrides,
      categories, incomeCategories, incomeBaseBudgets: incomeBase, incomeBudgetOverrides: incomeOverrides,
      recurringExpenses: recurring, monthNotes: notes, creditCards, splits, savingsAccounts,
      ...updates
    };
    try { await save(state); setLastSync(new Date()); } catch (e) { console.error('Save error', e); }
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
    load().then(d => {
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
        setSavingsAccounts(d.savingsAccounts || []);
        setLastSync(new Date());
        if (auto.length) save({ ...d, expenses: finalExp });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── DERIVED ──
  const effBudgets    = useMemo(() => { const r = {}; categories.forEach(c => { r[c.name] = effectiveBudget(c.name, selMonth, selYear, base, overrides); }); return r; }, [categories, selMonth, selYear, base, overrides]);
  const effIncBudgets = useMemo(() => { const r = {}; incomeCategories.forEach(c => { r[c.name] = effectiveBudget(c.name, selMonth, selYear, incomeBase, incomeOverrides); }); return r; }, [incomeCategories, selMonth, selYear, incomeBase, incomeOverrides]);
  const filtExp     = useMemo(() => expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; }), [expenses, selMonth, selYear]);
  const filtInc     = useMemo(() => incomes.filter(i => i.month === selMonth && i.year === selYear), [incomes, selMonth, selYear]);
  const totExp      = filtExp.reduce((s, e) => s + e.amount, 0);
  const totInc      = filtInc.reduce((s, i) => s + i.amount, 0);
  const totSav      = useMemo(() => savingGoals.reduce((s, g) => s + g.contributions.filter(c => c.month === selMonth && c.year === selYear).reduce((a, c) => a + c.amount, 0), 0), [savingGoals, selMonth, selYear]);
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
  const saveBudget = (cat, val) => { const u = { ...overrides, [bKey(selYear, selMonth, cat)]: parseFloat(val) || 0 }; setOverrides(u); persist({ budgetOverrides: u }); };
  const saveIncBudget = (cat, val) => { const u = { ...incomeOverrides, [bKey(selYear, selMonth, cat)]: parseFloat(val) || 0 }; setIncomeOverrides(u); persist({ incomeBudgetOverrides: u }); };

  const addIncome = form => { const u = [...incomes, { ...form, id: Date.now(), amount: parseFloat(form.amount), month: selMonth, year: selYear }]; setIncomes(u); persist({ incomes: u }); };
  const addExpense = exp => { const u = [...expenses, exp]; setExpenses(u); persist({ expenses: u }); };
  const addIncomeQuick = inc => { const u = [...incomes, inc]; setIncomes(u); persist({ incomes: u }); };

  const addIncomeCategory = cat => {
    if (!cat.name.trim() || incomeCategories.find(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) return;
    const newCats = [...incomeCategories, { ...cat, name: cat.name.trim() }];
    const newBase = { ...incomeBase, [cat.name.trim()]: 0 };
    setIncomeCategories(newCats); setIncomeBase(newBase);
    persist({ incomeCategories: newCats, incomeBaseBudgets: newBase });
  };
  const deleteIncomeCategory = name => { const newCats = incomeCategories.filter(c => c.name !== name); setIncomeCategories(newCats); persist({ incomeCategories: newCats }); };
  const addCategory = cat => {
    if (!cat.name.trim() || categories.find(c => c.name.toLowerCase() === cat.name.trim().toLowerCase())) return;
    const u = [...categories, { ...cat, name: cat.name.trim() }]; setCategories(u); persist({ categories: u });
  };
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
  const deleteSavTx = (accId, txId) => { const u = savingsAccounts.map(a => a.id !== accId ? a : { ...a, transactions: a.transactions.filter(t => t.id !== txId) }); setSavingsAccounts(u); persist({ savingsAccounts: u }); };
  const saveSavAccName = (id, name) => { if (!name.trim()) return; const u = savingsAccounts.map(a => a.id !== id ? a : { ...a, name: name.trim() }); setSavingsAccounts(u); persist({ savingsAccounts: u }); };
  const getAccBalance = acc => acc.transactions.reduce((s, t) => s + t.amount, 0);

  const noteKey = `${selYear}-${selMonth}`;
  const updateNote = val => { const u = { ...notes, [noteKey]: val }; setNotes(u); return u; };
  const saveNote = () => persist({ monthNotes: notes });

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

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:C.gray6}}>
      <div style={{fontSize:52,marginBottom:16}}>👫</div>
      <div style={{fontSize:24,fontWeight:900,color:C.gray1,letterSpacing:'-1px'}}>Dupla</div>
      <div style={{fontSize:13,color:C.gray3,marginTop:8}}>Conectando con Google Sheets...</div>
    </div>
  );

  const shared = {
    selMonth, selYear, setSelMonth, setSelYear,
    categories, incomeCategories, expenses, incomes, savingGoals, creditCards, savingsAccounts,
    filtExp, filtInc, totExp, totInc, totSav, totBudget, balance,
    effBudgets, effIncBudgets, expByCat, incByCat, expByUser,
    annualData, daysInMonth, dayNow, projected, alerts, pieData, barData,
    getCat, fmt, fmtK, paymentMethods, notes, noteKey, overrides, incomeOverrides,
    persist, delExp, delInc, saveBudget, saveIncBudget,
    addExpense, addIncomeQuick, addIncome,
    addCategory, deleteCategory, addIncomeCategory, deleteIncomeCategory,
    addCard,
    addSavingsAccount, deleteSavingsAccount, addSavTx, deleteSavTx, saveSavAccName, getAccBalance,
    updateNote, saveNote, exportCSV, exportGSheets, exportToast, setTab,
  };

  const MorePanel = () => (
    <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:'16px 20px'}}>
      <div style={{fontSize:11,fontWeight:700,color:C.gray3,marginBottom:12,letterSpacing:1}}>ACCESOS RÁPIDOS</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        {[{id:'charts',icon:'◉',label:'Gráficos',desc:'Distribución y tendencias',color:C.sky,bg:C.skyL},{id:'cards',icon:'💳',label:'Tarjetas',desc:'Movimientos y cuotas',color:C.lavender,bg:C.lavL}].map(item=>(
          <button key={item.id} onClick={()=>{setTab(item.id);setShowMore(false);}} style={{background:item.bg,borderRadius:16,padding:'14px',border:'none',cursor:'pointer',textAlign:'left'}}>
            <div style={{fontSize:22,marginBottom:6}}>{item.icon}</div>
            <div style={{fontWeight:700,fontSize:14,color:C.gray1}}>{item.label}</div>
            <div style={{fontSize:11,color:C.gray3,marginTop:2}}>{item.desc}</div>
          </button>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:C.gray3,marginBottom:10,letterSpacing:1}}>CONFIGURACIÓN</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <button onClick={exportCSV} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:C.gray6,borderRadius:12,border:'none',cursor:'pointer',textAlign:'left'}}>
          <span style={{fontSize:18}}>⬇</span>
          <div><div style={{fontWeight:600,fontSize:13,color:C.gray1}}>Exportar a CSV</div><div style={{fontSize:11,color:C.gray3}}>Descargar todos los datos</div></div>
        </button>
        <button onClick={exportGSheets} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:C.gray6,borderRadius:12,border:'none',cursor:'pointer',textAlign:'left'}}>
          <span style={{fontSize:18}}>📋</span>
          <div><div style={{fontWeight:600,fontSize:13,color:C.gray1}}>Copiar para Google Sheets</div><div style={{fontSize:11,color:C.gray3}}>Pegá directo en una hoja nueva</div></div>
        </button>
        <button onClick={onLogout} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:C.gray6,borderRadius:12,border:'none',cursor:'pointer',textAlign:'left'}}>
          <span style={{fontSize:18}}>🚪</span>
          <div><div style={{fontWeight:600,fontSize:13,color:C.gray1}}>Cerrar sesión</div><div style={{fontSize:11,color:C.gray3}}>{userInfo?.email}</div></div>
        </button>
        {exportToast&&<div style={{background:C.sage,color:C.white,borderRadius:10,padding:'8px 14px',fontSize:13,fontWeight:600,textAlign:'center'}}>{exportToast}</div>}
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",background:C.gray6,minHeight:'100vh',maxWidth:520,margin:'0 auto',paddingBottom:80}}>
      <Header selMonth={selMonth} selYear={selYear} setSelMonth={setSelMonth} setSelYear={setSelYear} syncing={syncing} lastSync={lastSync} alerts={alerts} userInfo={userInfo} onLogout={onLogout}/>
      <TabBar tab={tab} setTab={setTab} showMore={showMore} setShowMore={setShowMore}/>
      {showMore && <MorePanel/>}
      <div style={{padding:'18px 16px 0'}}>
        {tab==='home'     && <HomeTab     {...shared}/>}
        {tab==='income'   && <IncomeTab   {...shared}/>}
        {tab==='expenses' && <ExpensesTab {...shared}/>}
        {tab==='budget'   && <BudgetTab   {...shared}/>}
        {tab==='savings'  && <SavingsTab  {...shared}/>}
        {tab==='charts'   && <ChartsTab   {...shared}/>}
        {tab==='cards'    && <CardsTab    {...shared}/>}
      </div>
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [token,    setToken]    = useState(() => localStorage.getItem('dupla_token') || null);
  const [userInfo, setUserInfo] = useState(() => { try { return JSON.parse(localStorage.getItem('dupla_user') || 'null'); } catch { return null; } });

  const handleLogin = async (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('dupla_token', accessToken);
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      const info = await res.json();
      setUserInfo(info); localStorage.setItem('dupla_user', JSON.stringify(info));
    } catch {}
  };

  const handleLogout = () => {
    setToken(null); setUserInfo(null);
    localStorage.removeItem('dupla_token');
    localStorage.removeItem('dupla_user');
    localStorage.removeItem('dupla_sheet_id');
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID || ''}>
      {!token ? <LoginScreen onLogin={handleLogin}/> : <DuplaApp token={token} userInfo={userInfo} onLogout={handleLogout}/>}
    </GoogleOAuthProvider>
  );
}
