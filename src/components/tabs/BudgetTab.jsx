import { useState } from 'react';
import { MONTHS_FULL, PALETTE, ICON_OPTIONS } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';
import { bKey } from '../../utils/budgets';

export default function BudgetTab({
  selMonth, selYear, categories, incomeCategories,
  filtInc, totInc, totExp, totBudget, expByCat, incByCat,
  effBudgets, effIncBudgets, overrides, incomeOverrides,
  fmt, saveBudget, saveIncBudget, exchangeRate,
  addCategory, deleteCategory, addIncomeCategory, deleteIncomeCategory,
}) {
  const { C, Sx } = useTheme();
  const [catFilter,      setCatFilter]      = useState('egresos'); // 'egresos' | 'ingresos'
  const [selectedCat,    setSelectedCat]    = useState(null);
  const [editVal,        setEditVal]        = useState('');
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCat,         setNewCat]         = useState({ name: '', icon: '⭐', color: C.sage, bg: C.sageL });
  const [newIncCat,      setNewIncCat]      = useState({ name: '', icon: '💰', color: C.sage, bg: C.sageL });
  const [showIconPick,   setShowIconPick]   = useState(false);

  const totIncBudget = Object.values(effIncBudgets).reduce((a, b) => a + b, 0);

  const chipStyle = (active, activeColor, activeBg) => ({
    padding: '8px 20px',
    borderRadius: 999,
    border: `0.5px solid ${active ? activeColor : C.border}`,
    background: active ? activeBg : C.gray6,
    color: active ? activeColor : C.gray2,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  });

  const selectCat = (name, currentVal) => {
    if (selectedCat === name) {
      setSelectedCat(null);
      setEditVal('');
    } else {
      setSelectedCat(name);
      setEditVal(String(currentVal));
    }
  };

  const saveEgresoBudget = () => {
    if (!selectedCat) return;
    saveBudget(selectedCat, editVal);
    setSelectedCat(null);
    setEditVal('');
  };

  const saveIngresoBudget = () => {
    if (!selectedCat) return;
    saveIncBudget(selectedCat, editVal);
    setSelectedCat(null);
    setEditVal('');
  };

  const annualBudgetARS = totBudget * 12;
  const annualBudgetUSD = Math.round(annualBudgetARS / (exchangeRate || 1100));

  return (
    <div>
      {/* Header verde con proyección anual */}
      <div style={{ background: C.coral, borderRadius: 14, padding: '18px 16px 20px', marginBottom: 14 }}>
        {/* Top row */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>Presupuesto mensual</div>
          <div style={{ fontSize: 30, fontWeight: 500, color: '#fff', letterSpacing: '-1px', lineHeight: 1.1 }}>{fmt(totBudget)}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{MONTHS_FULL[selMonth]} {selYear}</div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', marginBottom: 14 }} />

        {/* Proyección anual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Anual (ARS)</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#fff' }}>{fmt(annualBudgetARS)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Anual (USD)</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: '#fff' }}>USD {annualBudgetUSD.toLocaleString('es-AR')}</div>
          </div>
        </div>
      </div>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{ background: C.coralL, borderRadius: 10, padding: '12px 14px', border: `0.5px solid ${C.coral}44` }}>
          <div style={{ fontSize: 11, color: C.coral, fontWeight: 500, marginBottom: 3 }}>PRESUPUESTO</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: C.coral }}>{fmt(totBudget)}</div>
        </div>
        <div style={{ background: C.roseL, borderRadius: 10, padding: '12px 14px', border: `0.5px solid ${C.rose}44` }}>
          <div style={{ fontSize: 11, color: C.rose, fontWeight: 500, marginBottom: 3 }}>GASTADO</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: C.rose }}>{fmt(totExp)}</div>
        </div>
      </div>

      {/* Filtros chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={() => { setCatFilter('egresos'); setSelectedCat(null); }} style={chipStyle(catFilter === 'egresos', C.rose, C.roseL)}>
          Egresos
        </button>
        <button onClick={() => { setCatFilter('ingresos'); setSelectedCat(null); }} style={chipStyle(catFilter === 'ingresos', C.sage, C.sageL)}>
          Ingresos
        </button>
      </div>

      {/* Lista de categorías */}
      {catFilter === 'egresos' && (
        <>
          {/* Botón / formulario nueva categoría — arriba */}
          {!showNewCatForm ? (
            <button
              onClick={() => setShowNewCatForm(true)}
              style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `0.5px dashed ${C.border}`, background: 'transparent', color: C.gray3, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 10 }}
            >
              + Categoría de egreso
            </button>
          ) : (
            <div style={{ ...Sx.fcard, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={Sx.ft}>Nueva categoría</div>
                <button onClick={() => { setShowNewCatForm(false); setNewCat({ name: '', icon: '⭐', color: C.sage, bg: C.sageL }); }} style={{ ...Sx.xbtn, fontSize: 18 }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button onClick={() => setShowIconPick(v => !v)} style={{ width: 46, height: 46, borderRadius: 10, border: `0.5px solid ${C.border}`, background: newCat.bg, fontSize: 22, cursor: 'pointer', flexShrink: 0 }}>{newCat.icon}</button>
                <input style={{ ...Sx.inp, flex: 1 }} placeholder="Nombre" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} />
              </div>
              {showIconPick && (
                <div style={{ background: C.gray6, borderRadius: 10, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => { setNewCat(p => ({ ...p, icon: ic })); setShowIconPick(false); }} style={{ width: 36, height: 36, borderRadius: 8, border: `0.5px solid ${newCat.icon === ic ? C.coral : C.border}`, background: newCat.icon === ic ? C.coralL : C.white, fontSize: 18, cursor: 'pointer' }}>{ic}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {PALETTE.map(col => (
                  <button key={col} onClick={() => setNewCat(p => ({ ...p, color: col, bg: col + '22' }))} style={{ width: 26, height: 26, borderRadius: '50%', background: col, border: newCat.color === col ? `3px solid ${C.gray1}` : `3px solid ${C.white}`, cursor: 'pointer' }} />
                ))}
              </div>
              <button style={{ ...Sx.btn, width: '100%' }} onClick={() => { if (newCat.name.trim()) { addCategory(newCat); setNewCat({ name: '', icon: '⭐', color: C.sage, bg: C.sageL }); setShowNewCatForm(false); } }}>
                + Agregar categoría
              </button>
            </div>
          )}

          {categories.map(cat => {
            const sp  = expByCat[cat.name] || 0;
            const bu  = effBudgets[cat.name] || 0;
            const pct = bu ? Math.min((sp / bu) * 100, 100) : 0;
            const over = sp > bu && bu > 0;
            const isSelected = selectedCat === cat.name;

            return (
              <div key={cat.name} style={{ marginBottom: 8 }}>
                {/* Row */}
                <div
                  onClick={() => selectCat(cat.name, bu)}
                  style={{
                    background: C.white,
                    borderRadius: isSelected ? '10px 10px 0 0' : 10,
                    padding: '14px 16px',
                    border: `0.5px solid ${isSelected ? C.coral : C.border}`,
                    cursor: 'pointer',
                    boxShadow: Sx.shadowSm,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{cat.name}</div>
                      <div style={{ fontSize: 11, color: C.gray3, marginTop: 1 }}>{bu ? `${Math.round(pct)}% gastado` : 'Sin presupuesto'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: over ? C.rose : C.gray1 }}>{fmt(sp)}</div>
                      <div style={{ fontSize: 11, color: C.gray3 }}>/ {fmt(bu)}</div>
                    </div>
                  </div>
                  {bu > 0 && (
                    <div style={{ height: 4, background: C.gray5, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: over ? C.rose : cat.color, borderRadius: 4 }} />
                    </div>
                  )}
                </div>

                {/* Editor inline */}
                {isSelected && (
                  <div style={{
                    background: C.white,
                    borderRadius: '0 0 10px 10px',
                    padding: '14px 16px',
                    border: `0.5px solid ${C.coral}`,
                    borderTop: `0.5px solid ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray2 }}>Presupuesto mensual</div>
                      <button onClick={() => { setSelectedCat(null); setEditVal(''); }} style={{ ...Sx.xbtn, fontSize: 18 }}>✕</button>
                    </div>
                    <input
                      autoFocus
                      type="text" inputMode="numeric"
                      value={editVal}
                      onChange={e => setEditVal(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => { if (e.key === 'Enter') saveEgresoBudget(); }}
                      style={{ ...Sx.inp, marginBottom: 10 }}
                      placeholder="Nuevo presupuesto"
                    />
                    <button onClick={saveEgresoBudget} style={{ ...Sx.btn, width: '100%' }}>Guardar</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón nueva categoría — abajo también */}
          {!showNewCatForm && (
            <button
              onClick={() => setShowNewCatForm(true)}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: `0.5px dashed ${C.border}`, background: 'transparent', color: C.gray3, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}
            >
              + Categoría de egreso
            </button>
          )}
        </>
      )}

      {catFilter === 'ingresos' && (
        <>
          {incomeCategories.map(cat => {
            const actual  = incByCat[cat.name] || 0;
            const planned = effIncBudgets[cat.name] || 0;
            const pct     = planned ? Math.min((actual / planned) * 100, 100) : 0;
            const isSelected = selectedCat === cat.name;

            return (
              <div key={cat.name} style={{ marginBottom: 8 }}>
                {/* Row */}
                <div
                  onClick={() => selectCat(cat.name, planned)}
                  style={{
                    background: C.white,
                    borderRadius: isSelected ? '10px 10px 0 0' : 10,
                    padding: '14px 16px',
                    border: `0.5px solid ${isSelected ? C.sage : C.border}`,
                    cursor: 'pointer',
                    boxShadow: Sx.shadowSm,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{cat.name}</div>
                      <div style={{ fontSize: 11, color: C.gray3, marginTop: 1 }}>{planned ? `${Math.round(pct)}% recibido` : 'Sin presupuesto'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.sage }}>{fmt(actual)}</div>
                      <div style={{ fontSize: 11, color: C.gray3 }}>/ {fmt(planned)}</div>
                    </div>
                  </div>
                  {planned > 0 && (
                    <div style={{ height: 4, background: C.gray5, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: 4 }} />
                    </div>
                  )}
                </div>

                {/* Editor inline */}
                {isSelected && (
                  <div style={{
                    background: C.white,
                    borderRadius: '0 0 10px 10px',
                    padding: '14px 16px',
                    border: `0.5px solid ${C.sage}`,
                    borderTop: `0.5px solid ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray2 }}>Presupuesto mensual</div>
                      <button onClick={() => { setSelectedCat(null); setEditVal(''); }} style={{ ...Sx.xbtn, fontSize: 18 }}>✕</button>
                    </div>
                    <input
                      autoFocus
                      type="text" inputMode="numeric"
                      value={editVal}
                      onChange={e => setEditVal(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => { if (e.key === 'Enter') saveIngresoBudget(); }}
                      style={{ ...Sx.inp, marginBottom: 10 }}
                      placeholder="Nuevo presupuesto"
                    />
                    <button onClick={saveIngresoBudget} style={{ ...Sx.btn, width: '100%', background: C.sage }}>Guardar</button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Botón nueva categoría ingreso */}
          <div style={{ ...Sx.fcard, marginTop: 8 }}>
            <div style={Sx.ft}>Nueva categoría de ingreso</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input style={{ ...Sx.inp, width: 46, textAlign: 'center', fontSize: 20, padding: '6px' }} value={newIncCat.icon} onChange={e => setNewIncCat(p => ({ ...p, icon: e.target.value }))} />
              <input style={{ ...Sx.inp, flex: 1 }} placeholder="Nombre" value={newIncCat.name} onChange={e => setNewIncCat(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {PALETTE.map(col => (
                <button key={col} onClick={() => setNewIncCat(p => ({ ...p, color: col, bg: col + '22' }))} style={{ width: 24, height: 24, borderRadius: '50%', background: col, border: newIncCat.color === col ? `3px solid ${C.gray1}` : `3px solid ${C.white}`, cursor: 'pointer' }} />
              ))}
            </div>
            <button style={{ ...Sx.btn, background: C.sage, width: '100%' }} onClick={() => { if (newIncCat.name.trim()) { addIncomeCategory(newIncCat); setNewIncCat({ name: '', icon: '💰', color: C.sage, bg: C.sageL }); } }}>
              + Agregar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
