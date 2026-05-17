import { useState, useEffect, useRef } from 'react';
import { USERS, MONTHS_FULL } from '../../utils/constants';
import { useTheme, contrastFg } from '../../hooks/useTheme';
import { todayStr } from '../../utils/formatters';
import PieChartSVG from '../charts/PieChartSVG';
import { ExpandContainer, MotionPressable, FloatingLayer } from '../../motion/index.js';
import { ACCORDION_CLEAR_DELAY } from '../../motion/motionPolicy.js';

// ── Helpers ────────────────────────────────────────────────────────────────
// Avatar color por posición en USERS — extensible a más usuarios después
function avatarColor(C, name) {
  const palette = [C.peach, C.coral, C.sage, C.lavender];
  const idx = USERS.indexOf(name);
  return palette[idx] ?? C.gray3;
}

function Avatar({ C, name, size = 28 }) {
  const bg = avatarColor(C, name);
  const initial = (name?.[0] || '?').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: contrastFg(bg),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 500, flexShrink: 0,
      letterSpacing: '-0.2px',
    }}>{initial}</div>
  );
}

// Label small caps reutilizable
const Label = ({ C, children, htmlFor }) => {
  const style = {
    fontSize: 11, color: C.gray4, fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '1.5px',
    marginBottom: 6, display: 'block',
  };
  return htmlFor
    ? <label htmlFor={htmlFor} style={style}>{children}</label>
    : <div style={style}>{children}</div>;
};

// Format integer with es-AR thousand separators
const fmtInt = n => Math.round(n).toLocaleString('es-AR');

// ── Component ──────────────────────────────────────────────────────────────
export default function HomeTab({
  selMonth, prevMonth,
  categories, incomeCategories, creditCards,
  filtExp, filtInc, totExp, totExpPrevMonth, expByUser,
  getCat, fmt,
  addExpense, addIncomeQuick, setTab,
  editExpense, editIncome,
}) {
  const { C, Sx } = useTheme();

  // ── Form state ───────────────────────────────────────────────────────────
  const [mode,        setMode]        = useState('expense'); // 'expense' | 'income'
  const [amount,      setAmount]      = useState('');         // string sin formato (solo dígitos)
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState(categories[0]?.name || '');
  const [incCategory, setIncCategory] = useState(incomeCategories[0]?.name || '');
  const [payment,     setPayment]     = useState('Efectivo'); // 'Efectivo' | 'Débito' | 'Tarjeta'
  const [paidBy,      setPaidBy]      = useState(USERS[0]);
  const [date,        setDate]        = useState(todayStr);
  const [paidByOpen,  setPaidByOpen]  = useState(false);

  // ── Edit recent state ────────────────────────────────────────────────────
  const [editingRecent, setEditingRecent] = useState(null); // `e-${id}` | `i-${id}` | null
  const [editRecentForm, setEditRecentForm] = useState(null);
  const [closingRecentKey, setClosingRecentKey] = useState(null);
  const recentCloseTimerRef = useRef(null);

  const openRecentEdit = (m) => {
    const key = m._type === 'expense' ? `e-${m.id}` : `i-${m.id}`;
    clearTimeout(recentCloseTimerRef.current);
    if (editingRecent === key) {
      setClosingRecentKey(key);
      setEditingRecent(null);
      recentCloseTimerRef.current = setTimeout(() => {
        setEditRecentForm(null);
        setClosingRecentKey(null);
      }, ACCORDION_CLEAR_DELAY);
      return;
    }
    setClosingRecentKey(null);
    setEditingRecent(key);
    setEditRecentForm({ ...m });
  };

  const closeRecentEdit = () => {
    clearTimeout(recentCloseTimerRef.current);
    setClosingRecentKey(editingRecent);
    setEditingRecent(null);
    recentCloseTimerRef.current = setTimeout(() => {
      setEditRecentForm(null);
      setClosingRecentKey(null);
    }, ACCORDION_CLEAR_DELAY);
  };

  const saveRecentEdit = () => {
    if (!editRecentForm) return;
    if (editRecentForm._type === 'expense') editExpense(editRecentForm.id, editRecentForm);
    else editIncome(editRecentForm.id, editRecentForm);
    closeRecentEdit();
  };

  // ── Toast + highlight state ──────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { kind, label, amount } | null
  const [highlightId, setHighlightId] = useState(null);
  const toastTimerRef     = useRef(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(toastTimerRef.current);
    clearTimeout(highlightTimerRef.current);
    clearTimeout(recentCloseTimerRef.current);
  }, []);

  const amountNum = parseInt(amount || '0', 10);
  const isExpanded = amountNum > 0;

  const onAmountChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAmount(digits);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (amountNum <= 0) return;

    const id = Date.now();
    if (mode === 'expense') {
      // If payment is a creditCard id, look up the name; otherwise use as-is
      const cardMatch = creditCards.find(c => c.id === payment);
      const pm = cardMatch ? cardMatch.name : payment;
      addExpense({
        id,
        description: description.trim(),
        amount: amountNum,
        category,
        user: paidBy,
        date,
        tags: [],
        paymentMethod: pm,
        installments: 1,
      });
    } else {
      const d = new Date(date);
      addIncomeQuick({
        id,
        description: description.trim(),
        amount: amountNum,
        user: paidBy,
        incomeCategory: incCategory,
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    // Toast
    const detail = description.trim()
      || (mode === 'expense' ? category : incCategory)
      || (mode === 'expense' ? 'gasto' : 'ingreso');
    setToast({ kind: mode, label: detail, amount: amountNum });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);

    // Highlight
    setHighlightId(id);
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightId(null), 2500);

    // Reset form (mantener mode + paidBy + date para flujo rápido)
    setAmount('');
    setDescription('');
  };

  // ── Delta vs mes anterior ────────────────────────────────────────────────
  let deltaPct = null;
  if (totExpPrevMonth > 0 && totExp > 0) {
    deltaPct = Math.round(((totExp - totExpPrevMonth) / totExpPrevMonth) * 100);
    if (deltaPct === 0) deltaPct = null;
  }
  const prevMonthName = MONTHS_FULL[prevMonth]?.toLowerCase() || '';

  // ── Recent movements (combinados, ordenados, top 5) ──────────────────────
  const recents = [
    ...filtExp.map(e => ({ ...e, _type: 'expense', _ts: new Date(e.date + 'T00:00:00').getTime() + (e.id % 1000) })),
    ...filtInc.map(i => ({ ...i, _type: 'income',  _ts: i.id })),
  ].sort((a, b) => b._ts - a._ts).slice(0, 5);

  // ── Render ───────────────────────────────────────────────────────────────
  const greeting = `Hola, ${USERS.join(' & ')}`;

  return (
    <div style={{ position: 'relative' }}>

      {/* ─ Toast (fixed top) ─────────────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-ui="toast"
          data-component="feedback-toast"
          data-variant="success"
          data-surface="floating"
          data-motion="slide-in"
          style={{
            position: 'fixed', top: 18, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
          background: C.white,
          border: `0.5px solid ${C.border}`,
          borderLeft: `3px solid ${C.sage}`,
          borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          minWidth: 260, maxWidth: 'calc(100vw - 32px)',
          animation: 'dp-toast-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: C.sage, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, flexShrink: 0,
          }}>✓</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.gray1 }}>Listo, lo sumamos</div>
            <div style={{ fontSize: 11, color: C.gray3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {toast.label} · ${fmtInt(toast.amount)}
            </div>
          </div>
        </div>
      )}

      {/* ─ Welcome banner verde ──────────────────────────────────────────── */}
      <section
        data-ui="hero"
        data-component="home-hero"
        data-surface="base"
        data-motion="entrance"
        style={{
          background: C.coral,
          color: '#fff',
          borderRadius: 14,
          padding: '20px 18px 28px',
          marginBottom: 0,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.2px' }}>
          {greeting}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 500,
          color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase', letterSpacing: '1.5px',
          marginTop: 14, marginBottom: 4,
        }}>
          Total gastado este mes
        </div>
        <div style={{
          fontSize: 32, fontWeight: 500, color: '#fff',
          letterSpacing: '-1.5px', lineHeight: 1.05,
        }}>
          ${fmtInt(totExp)}
        </div>
        {deltaPct !== null && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
            {deltaPct > 0 ? '↑' : '↓'} {Math.abs(deltaPct)}% vs {prevMonthName}
          </div>
        )}
      </section>

      {/* ─ Floating white card with form ────────────────────────────────── */}
      <div
        data-ui="card"
        data-component="entry-card"
        data-state={isExpanded ? 'expanded' : 'collapsed'}
        data-motion="expand"
        style={{
          background: C.white,
          borderRadius: 14,
          padding: '18px',
          marginTop: -16,
          marginBottom: 20,
          border: `0.5px solid ${C.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          position: 'relative', zIndex: 1,
        }}
      >

        {/* Toggle Egreso/Ingreso */}
        <div style={{
          display: 'flex',
          background: C.gray6,
          borderRadius: 10,
          padding: 3, gap: 3,
          marginBottom: 18,
        }}>
          {[
            { id: 'expense', label: '↓ Egreso' },
            { id: 'income',  label: '↑ Ingreso' },
          ].map(opt => {
            const active = mode === opt.id;
            return (
              <button key={opt.id} onClick={() => setMode(opt.id)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: active ? C.white : 'transparent',
                  color: active ? C.gray1 : C.gray3,
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Amount hero */}
        <div style={{ textAlign: 'center', marginBottom: isExpanded ? 22 : 14 }}>
          <Label C={C} htmlFor="home-amount">{isExpanded ? 'Monto' : '¿Cuánto gastaste?'}</Label>
          <div style={{
            display: 'inline-flex', alignItems: 'baseline',
            borderBottom: `2px solid ${mode === 'expense' ? C.rose : C.sage}`,
            padding: '0 8px 4px',
            minWidth: 200,
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 28, color: C.gray4, marginRight: 6, fontWeight: 400 }}>$</span>
            <input
              id="home-amount"
              type="text"
              inputMode="numeric"
              value={amount ? fmtInt(amountNum) : ''}
              onChange={onAmountChange}
              placeholder="0"
              data-ui="amount-input"
              data-component="amount-hero"
              data-testid="amount-input"
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: 36, fontWeight: 500, color: C.gray1,
                textAlign: 'center', width: '100%', maxWidth: 240,
                padding: 0, letterSpacing: '-1px',
                fontFamily: 'inherit',
              }}
            />
          </div>
          {!isExpanded && (
            <div style={{ fontSize: 12, color: C.gray4, marginTop: 8 }}>
              Tocá para escribir el monto
            </div>
          )}
        </div>

        {/* Expanded fields */}
        <ExpandContainer expanded={isExpanded}>
          <div>

            {/* Descripción */}
            <div style={{ marginBottom: 16 }}>
              <Label C={C} htmlFor="home-description">Descripción</Label>
              <input
                id="home-description"
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ej: compra del finde"
                style={{ ...Sx.inp }}
              />
            </div>

            {/* Categorías */}
            <div style={{ marginBottom: 16 }}>
              <Label C={C}>{mode === 'expense' ? 'Categoría' : 'Origen'}</Label>
              <div style={{
                display: 'flex', gap: 6, overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                {(mode === 'expense' ? categories : incomeCategories).map(c => {
                  const active = (mode === 'expense' ? category : incCategory) === c.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => mode === 'expense' ? setCategory(c.name) : setIncCategory(c.name)}
                      style={{
                        flexShrink: 0,
                        padding: '8px 14px',
                        borderRadius: 9999,
                        border: `0.5px solid ${active ? C.peach : C.border}`,
                        background: active ? C.peachL : C.white,
                        color: active ? C.peachD : C.gray2,
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                      {c.icon} {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forma de pago — solo en expense */}
            {mode === 'expense' && (
              <div style={{ marginBottom: 16 }}>
                <Label C={C}>Forma de pago</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { id: 'Efectivo', label: 'Efectivo', icon: '💵' },
                    { id: 'Débito',   label: 'Débito',   icon: '🏦' },
                    ...creditCards.map(card => ({ id: card.id, label: card.name, icon: '💳' })),
                  ].map(pm => {
                    const active = payment === pm.id;
                    return (
                      <button key={pm.id}
                        onClick={() => setPayment(pm.id)}
                        style={{
                          padding: '9px 14px',
                          borderRadius: 9999,
                          border: `0.5px solid ${active ? C.coral : C.border}`,
                          background: active ? C.coralL : C.white,
                          color: active ? C.sky : C.gray2,
                          fontSize: 13, fontWeight: 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}>
                        {pm.icon} {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quién pagó + Fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>

              {/* Quién pagó */}
              <div>
                <Label C={C}>{mode === 'expense' ? 'Pagó' : 'Cobra'}</Label>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setPaidByOpen(v => !v)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `0.5px solid ${C.border}`,
                      background: C.white,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, fontWeight: 500, color: C.gray1,
                    }}>
                    <Avatar C={C} name={paidBy} size={22} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{paidBy}</span>
                    <span style={{ color: C.gray4, fontSize: 10 }}>▾</span>
                  </button>
                  {paidByOpen && (
                    <>
                      <div
                        onClick={() => setPaidByOpen(false)}
                        aria-hidden="true"
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                      />
                      <FloatingLayer style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: C.white, borderRadius: 10,
                        border: `0.5px solid ${C.border}`,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        padding: 4, zIndex: 41,
                      }}>
                        {USERS.map(u => (
                          <button key={u}
                            onClick={() => { setPaidBy(u); setPaidByOpen(false); }}
                            style={{
                              width: '100%', padding: '8px 10px', border: 'none',
                              background: paidBy === u ? C.gray6 : 'transparent',
                              borderRadius: 8, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 8,
                              fontSize: 13, fontWeight: 500, color: C.gray1,
                              textAlign: 'left',
                            }}>
                            <Avatar C={C} name={u} size={22} />
                            {u}
                          </button>
                        ))}
                      </FloatingLayer>
                    </>
                  )}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <Label C={C}>Fecha</Label>
                <div style={{
                  border: `0.5px solid ${C.border}`,
                  borderRadius: 10,
                  background: C.white,
                  padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 14 }}>📅</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.gray1, flex: 1 }}>
                    {date === todayStr ? 'Hoy' : new Date(date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ color: C.gray4, fontSize: 10 }}>▾</span>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{
                      position: 'absolute', inset: 0,
                      opacity: 0, cursor: 'pointer',
                      width: '100%', height: '100%',
                      border: 'none', background: 'transparent',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <MotionPressable
              as="button"
              onClick={handleSubmit}
              scaleVariant="press"
              data-ui="cta"
              data-component="submit-entry"
              data-variant={mode}
              data-testid="submit-expense"
              style={{
                width: '100%',
                padding: '13px',
                background: C.coral,
                color: contrastFg(C.coral),
                border: 'none',
                borderRadius: 10,
                fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {mode === 'expense' ? 'Guardar gasto' : 'Guardar ingreso'}
            </MotionPressable>
          </div>
        </ExpandContainer>
      </div>

      {/* ─ Quién gastó qué ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 15, fontWeight: 500, color: C.gray1,
          marginBottom: 10, letterSpacing: '-0.2px',
        }}>
          Quién gastó qué
        </div>
        <div data-ui="grid" data-component="user-expense-grid" data-layout="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {USERS.map(u => {
            const amt = expByUser[u] || 0;
            const pct = totExp > 0 ? Math.round((amt / totExp) * 100) : 0;
            const color = avatarColor(C, u);
            return (
              <div key={u} data-ui="stat-card" data-component="user-expense-card" data-variant={`user-${u.toLowerCase()}`} style={{
                background: C.white,
                borderRadius: 14,
                padding: '14px',
                border: `0.5px solid ${C.border}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Avatar C={C} name={u} size={28} />
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.gray1 }}>{u}</div>
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 500, color: C.gray1,
                  letterSpacing: '-0.6px', marginBottom: 10, lineHeight: 1,
                }}>
                  ${fmtInt(amt)}
                </div>
                <div style={{
                  height: 5, background: C.gray5,
                  borderRadius: 4, overflow: 'hidden', marginBottom: 6,
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: color, transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ fontSize: 11, color: C.gray4, fontWeight: 500 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─ Movimientos recientes ────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <div style={{
            fontSize: 15, fontWeight: 500, color: C.gray1,
            letterSpacing: '-0.2px',
          }}>
            Movimientos recientes
          </div>
          <button
            onClick={() => setTab('movements')}
            aria-label="Ver todos los movimientos"
            style={{
              background: 'none', border: 'none',
              color: C.coral, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', padding: 0,
            }}
          >
            Ver todos ›
          </button>
        </div>

        {recents.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 14, border: `0.5px solid ${C.border}`, textAlign: 'center', padding: '28px 16px', color: C.gray3, fontSize: 14 }}>
            Todavía no registraron movimientos este mes
          </div>
        ) : (
          <ul data-ui="list" data-component="recent-movements" style={{ listStyle: 'none', padding: 0 }}>
          {recents.map((m) => {
          const key = m._type === 'expense' ? `e-${m.id}` : `i-${m.id}`;
          const isExp = m._type === 'expense';
          const cat = isExp ? getCat(m.category) : null;
          const isHL = m.id === highlightId;
          const label = m.description || (isExp ? m.category : (m.incomeCategory || 'Ingreso'));
          const userColor = avatarColor(C, m.user);
          const isEditing = editingRecent === key;

          return (
            <li
              key={key}
              data-ui="list-item"
              data-component="movement-row"
              data-variant={isExp ? 'expense' : 'income'}
              data-state={isEditing ? 'editing' : isHL ? 'highlighted' : 'default'}
              data-motion="accordion"
              style={{ marginBottom: 6 }}
            >
              {/* Row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: isHL ? C.coralL : C.white,
                borderRadius: isEditing ? '12px 12px 0 0' : 12,
                border: `0.5px solid ${isEditing ? C.coral : C.border}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'background 0.4s ease',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: isExp ? C.peachL : C.coralL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {isExp ? (cat?.icon || '🛒') : '💰'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: C.gray1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: userColor, color: contrastFg(userColor),
                      fontSize: 8, fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{m.user?.[0] || '?'}</div>
                    <div style={{ fontSize: 11, color: C.gray3 }}>
                      {m.user}
                      {isExp && m.date ? ` · ${formatRelative(m.date)}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: isExp ? C.rose : C.sage, flexShrink: 0 }}>
                  {isExp ? '-' : '+'}${fmtInt(m.amount)}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); openRecentEdit(m); }}
                  aria-label={`Editar ${isExp ? 'gasto' : 'ingreso'}: ${label}`}
                  aria-expanded={isEditing}
                  style={{ background: isEditing ? C.coralL : C.gray6, border: `0.5px solid ${isEditing ? C.coral : C.border}`, borderRadius: 7, cursor: 'pointer', color: isEditing ? C.coral : C.gray3, fontSize: 13, padding: '5px 8px', flexShrink: 0, lineHeight: 1 }}
                >✏</button>
              </div>

              {/* Inline editor */}
              <ExpandContainer expanded={isEditing}>
                {(isEditing || closingRecentKey === key) && editRecentForm && (
                  <div style={{
                    background: C.white,
                    borderRadius: '0 0 12px 12px',
                    padding: '14px 16px',
                    border: `0.5px solid ${C.coral}`,
                    borderTop: `0.5px solid ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray2 }}>Editar {isExp ? 'gasto' : 'ingreso'}</div>
                      <button onClick={closeRecentEdit} aria-label="Cerrar editor" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray3, fontSize: 18, lineHeight: 1 }}>✕</button>
                    </div>

                    {/* Monto */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Monto</div>
                      <input type="text" inputMode="numeric"
                        value={editRecentForm.amount}
                        onChange={e => setEditRecentForm(f => ({ ...f, amount: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 }))}
                        style={{ ...Sx.inp }} />
                    </div>

                    {/* Descripción */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Descripción</div>
                      <input type="text"
                        value={editRecentForm.description || ''}
                        onChange={e => setEditRecentForm(f => ({ ...f, description: e.target.value }))}
                        style={{ ...Sx.inp }} />
                    </div>

                    {/* Categoría */}
                    {isExp ? (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Categoría</div>
                        <select value={editRecentForm.category}
                          onChange={e => setEditRecentForm(f => ({ ...f, category: e.target.value }))}
                          style={{ ...Sx.inp, cursor: 'pointer' }}>
                          {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Origen</div>
                        <select value={editRecentForm.incomeCategory || ''}
                          onChange={e => setEditRecentForm(f => ({ ...f, incomeCategory: e.target.value }))}
                          style={{ ...Sx.inp, cursor: 'pointer' }}>
                          {incomeCategories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Fecha */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Fecha</div>
                      <input
                        type="date"
                        value={isExp
                          ? (editRecentForm.date || '')
                          : `${editRecentForm.year ?? new Date().getFullYear()}-${String((editRecentForm.month ?? new Date().getMonth()) + 1).padStart(2, '0')}-01`
                        }
                        onChange={e => {
                          const d = new Date(e.target.value + 'T00:00:00');
                          if (isExp) {
                            setEditRecentForm(f => ({ ...f, date: e.target.value }));
                          } else {
                            setEditRecentForm(f => ({ ...f, date: e.target.value, month: d.getMonth(), year: d.getFullYear() }));
                          }
                        }}
                        style={{ ...Sx.inp }}
                      />
                    </div>

                    <button onClick={saveRecentEdit}
                      style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: C.coral, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      Guardar
                    </button>
                  </div>
                )}
              </ExpandContainer>
            </li>
          );
        })}
          </ul>
        )}
      </div>

      {/* ─ Pie chart de categorías (al final) ──────────────────────────────── */}
      {filtExp.length > 0 && (() => {
        const pieChartData = filtExp.map(e => {
          const cat = getCat(e.category);
          return { ...cat, value: e.amount };
        }).reduce((acc, item) => {
          const existing = acc.find(x => x.name === item.name);
          if (existing) {
            existing.value += item.value;
          } else {
            acc.push(item);
          }
          return acc;
        }, []).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

        return (
          <div style={{
            background: C.white,
            borderRadius: 14,
            padding: '16px 14px',
            marginTop: 20,
            marginBottom: 8,
            border: `0.5px solid ${C.border}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.gray1, marginBottom: 12, letterSpacing: '-0.2px' }}>
              Gastos por categoría
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <PieChartSVG data={pieChartData} size={140} />
            </div>
            <div style={{ marginTop: 12 }}>
              {pieChartData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: C.gray2 }}>{d.icon} {d.name}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.gray1, minWidth: 60, textAlign: 'right' }}>{fmt(d.value)}</div>
                  <div style={{ fontSize: 12, color: C.gray3, minWidth: 36, textAlign: 'right' }}>{totExp ? Math.round((d.value / totExp) * 100) : 0}%</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.gray3, textAlign: 'center', paddingTop: 8, borderTop: `0.5px solid ${C.gray5}`, marginTop: 8 }}>
              {MONTHS_FULL[selMonth]} · {filtExp.length} {filtExp.length === 1 ? 'gasto' : 'gastos'}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// Format relative date for movement rows
function formatRelative(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today0 - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  if (diffDays > 1 && diffDays < 7) return `hace ${diffDays} días`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
