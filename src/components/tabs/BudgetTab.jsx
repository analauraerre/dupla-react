import { useState } from 'react';
import { C, Sx, MONTHS_FULL, PALETTE, ICON_OPTIONS } from '../../utils/constants';
import { bKey } from '../../utils/budgets';

export default function BudgetTab({
  selMonth, selYear, categories, incomeCategories,
  filtInc, totInc, totExp, totBudget, expByCat, incByCat,
  effBudgets, effIncBudgets, overrides, incomeOverrides,
  fmt, saveBudget, saveIncBudget,
  addCategory, deleteCategory, addIncomeCategory, deleteIncomeCategory,
}) {
  const [editBudget,    setEditBudget]    = useState(null);
  const [editBudgetVal, setEditBudgetVal] = useState('');
  const [editIncBudget,    setEditIncBudget]    = useState(null);
  const [editIncBudgetVal, setEditIncBudgetVal] = useState('');
  const [showBudgetCatMgr, setShowBudgetCatMgr] = useState(false);
  const [showIncCatForm,   setShowIncCatForm]   = useState(false);
  const [newCat,       setNewCat]       = useState({ name: '', icon: '⭐', color: C.sage, bg: C.sageL });
  const [newIncCat,    setNewIncCat]    = useState({ name: '', icon: '💰', color: C.sage, bg: C.sageL });
  const [showIconPick, setShowIconPick] = useState(false);
  const [delCat,       setDelCat]       = useState(null);
  const [delIncCat,    setDelIncCat]    = useState(null);

  const totIncBudget = Object.values(effIncBudgets).reduce((a, b) => a + b, 0);
  const diff = totInc - totIncBudget;

  return (
    <div>
      <div style={Sx.ph}>
        <div>
          <div style={Sx.pt}>Presupuesto</div>
          <div style={Sx.ps}>{MONTHS_FULL[selMonth]} · {fmt(totBudget)}/mes</div>
        </div>
        <button style={{ ...Sx.btn, background: showBudgetCatMgr ? C.coral : C.gray6, color: showBudgetCatMgr ? C.white : C.gray2, border: `1px solid ${showBudgetCatMgr ? C.coral : C.border}` }}
          onClick={() => setShowBudgetCatMgr(v => !v)}>{showBudgetCatMgr ? '✕ Cerrar' : '⚙ Categorías'}</button>
      </div>

      {/* Category manager */}
      {showBudgetCatMgr && (
        <div style={{ ...Sx.fcard, border: `1.5px solid ${C.border}`, marginBottom: 14 }}>
          <div style={Sx.ft}>Gestionar categorías de egresos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {categories.map(cat => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: C.gray6, borderRadius: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.icon}</div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: C.gray1 }}>{cat.name}</div>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color }} />
                {delCat === cat.name ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { deleteCategory(cat.name); setDelCat(null); }} style={{ padding: '4px 10px', background: C.coral, color: C.white, border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>Sí</button>
                    <button onClick={() => setDelCat(null)} style={{ padding: '4px 10px', background: C.gray5, border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>No</button>
                  </div>
                ) : <button onClick={() => setDelCat(cat.name)} style={Sx.xbtn}>×</button>}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gray1, marginBottom: 10 }}>Nueva categoría</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button onClick={() => setShowIconPick(v => !v)} style={{ width: 46, height: 46, borderRadius: 14, border: `1.5px solid ${C.border}`, background: newCat.bg, fontSize: 22, cursor: 'pointer', flexShrink: 0 }}>{newCat.icon}</button>
              <input style={{ ...Sx.inp, flex: 1 }} placeholder="Nombre" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { addCategory(newCat); setNewCat({ name: '', icon: '⭐', color: C.sage, bg: C.sageL }); } }} />
            </div>
            {showIconPick && (<div style={{ background: C.gray6, borderRadius: 14, padding: 12, marginBottom: 10 }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{ICON_OPTIONS.map(ic => <button key={ic} onClick={() => { setNewCat(p => ({ ...p, icon: ic })); setShowIconPick(false); }} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${newCat.icon === ic ? C.coral : C.border}`, background: newCat.icon === ic ? C.coralL : C.white, fontSize: 20, cursor: 'pointer' }}>{ic}</button>)}</div></div>)}
            <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, color: C.gray3, marginBottom: 8, fontWeight: 600 }}>Color</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{PALETTE.map(col => <button key={col} onClick={() => setNewCat(p => ({ ...p, color: col, bg: col + '22' }))} style={{ width: 28, height: 28, borderRadius: '50%', background: col, border: newCat.color === col ? `3px solid ${C.gray1}` : `3px solid ${C.white}`, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }} />)}</div></div>
            <button style={{ ...Sx.btn, width: '100%' }} onClick={() => { addCategory(newCat); setNewCat({ name: '', icon: '⭐', color: C.sage, bg: C.sageL }); }}>+ Agregar categoría</button>
          </div>
        </div>
      )}

      <div style={{ background: C.coralL, borderRadius: 14, padding: '12px 16px', marginBottom: 14, border: `1px solid ${C.coralM}`, fontSize: 13, color: C.coral }}>
        ✏️ Modificar aplica a <strong>{MONTHS_FULL[selMonth]}</strong> y los meses siguientes.
      </div>

      {/* Overall progress */}
      <div style={{ background: C.white, borderRadius: 20, padding: '18px 20px', marginBottom: 14, boxShadow: Sx.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span style={{ color: C.gray3 }}>Ejecutado</span><span style={{ fontWeight: 700, color: totExp > totBudget ? C.coral : C.sage }}>{totBudget ? Math.round((totExp / totBudget) * 100) : 0}%</span></div>
        <div style={{ height: 10, background: C.gray5, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}><div style={{ width: `${Math.min((totExp / totBudget) * 100, 100)}%`, height: '100%', background: totExp > totBudget ? C.coral : C.sage, borderRadius: 8 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.gray3 }}><span>{fmt(totExp)} gastado</span><span>Quedan {fmt(Math.max(totBudget - totExp, 0))}</span></div>
      </div>

      {/* Per-category */}
      {categories.map(cat => {
        const sp = expByCat[cat.name] || 0, bu = effBudgets[cat.name] || 0;
        const hasOverride = overrides[bKey(selYear, selMonth, cat.name)] !== undefined;
        const pct = bu ? Math.min((sp / bu) * 100, 100) : 0, over = sp > bu && bu > 0, isEdit = editBudget === cat.name;
        return (
          <div key={cat.name} style={{ background: C.white, borderRadius: 16, padding: '16px 18px', marginBottom: 10, boxShadow: Sx.shadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontWeight: 700, fontSize: 15, color: C.gray1 }}>{cat.name}</span>{hasOverride && <span style={{ fontSize: 10, background: C.goldL, color: C.gold, padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>editado</span>}</div>
                  <div style={{ fontSize: 12, color: C.gray3, marginTop: 2 }}>Gastado: {fmt(sp)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isEdit ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input autoFocus style={{ ...Sx.inp, width: 100, padding: '6px 10px', margin: 0 }} value={editBudgetVal} onChange={e => setEditBudgetVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { saveBudget(cat.name, editBudgetVal); setEditBudget(null); } }} />
                    <button onClick={() => { saveBudget(cat.name, editBudgetVal); setEditBudget(null); }} style={{ ...Sx.btn, padding: '6px 12px', fontSize: 12 }}>OK</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontWeight: 800, fontSize: 16, color: over ? C.coral : C.gray1 }}>{fmt(bu)}</span>
                    <button onClick={() => { setEditBudget(cat.name); setEditBudgetVal(String(bu)); }} style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${C.border}`, background: C.gray6, cursor: 'pointer', fontSize: 14, color: C.gray3 }}>✎</button>
                  </>
                )}
              </div>
            </div>
            <div style={{ height: 7, background: C.gray5, borderRadius: 6 }}><div style={{ width: `${pct}%`, height: '100%', background: over ? C.coral : cat.color, borderRadius: 6 }} /></div>
            {over && <div style={{ fontSize: 12, color: C.coral, marginTop: 6, fontWeight: 600 }}>⚠ Excedido en {fmt(sp - bu)}</div>}
          </div>
        );
      })}

      {/* Income budget section */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gray1 }}>💰 Ingresos presupuestados</div>
          <button onClick={() => setShowIncCatForm(v => !v)} style={{ fontSize: 12, color: C.sage, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>{showIncCatForm ? '✕ Cerrar' : '⚙ Categorías'}</button>
        </div>

        {showIncCatForm && (
          <div style={{ ...Sx.fcard, border: `1.5px solid ${C.sageM}`, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sage, marginBottom: 10 }}>Categorías de ingresos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {incomeCategories.map(cat => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.gray6, borderRadius: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{cat.icon}</div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: C.gray1 }}>{cat.name}</div>
                  {delIncCat === cat.name ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { deleteIncomeCategory(cat.name); setDelIncCat(null); }} style={{ padding: '3px 8px', background: C.coral, color: C.white, border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>Sí</button>
                      <button onClick={() => setDelIncCat(null)} style={{ padding: '3px 8px', background: C.gray5, border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>No</button>
                    </div>
                  ) : <button onClick={() => setDelIncCat(cat.name)} style={Sx.xbtn}>×</button>}
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray1, marginBottom: 8 }}>Nueva categoría</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...Sx.inp, width: 46, textAlign: 'center', fontSize: 20, padding: '6px' }} value={newIncCat.icon} onChange={e => setNewIncCat(p => ({ ...p, icon: e.target.value }))} />
                <input style={{ ...Sx.inp, flex: 1 }} placeholder="Nombre" value={newIncCat.name} onChange={e => setNewIncCat(p => ({ ...p, name: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { addIncomeCategory(newIncCat); setNewIncCat({ name: '', icon: '💰', color: C.sage, bg: C.sageL }); } }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {PALETTE.map(col => <button key={col} onClick={() => setNewIncCat(p => ({ ...p, color: col, bg: col + '22' }))} style={{ width: 24, height: 24, borderRadius: '50%', background: col, border: newIncCat.color === col ? `3px solid ${C.gray1}` : `3px solid ${C.white}`, cursor: 'pointer' }} />)}
              </div>
              <button style={{ ...Sx.btn, background: C.sage, width: '100%' }} onClick={() => { addIncomeCategory(newIncCat); setNewIncCat({ name: '', icon: '💰', color: C.sage, bg: C.sageL }); }}>+ Agregar</button>
            </div>
          </div>
        )}

        {/* Income overall */}
        <div style={{ background: C.white, borderRadius: 20, padding: '16px 20px', marginBottom: 12, boxShadow: Sx.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: C.gray3 }}>Real vs presupuestado</span>
            <span style={{ fontWeight: 700, color: diff >= 0 ? C.sage : C.coral }}>{diff >= 0 ? '+' : ''}{fmt(diff)}</span>
          </div>
          <div style={{ height: 10, background: C.gray5, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${totIncBudget ? Math.min((totInc / totIncBudget) * 100, 100) : 0}%`, height: '100%', background: diff >= 0 ? C.sage : C.coral, borderRadius: 8 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.gray3 }}>
            <span>{fmt(totInc)} recibido</span><span>de {fmt(totIncBudget)} estimado</span>
          </div>
        </div>

        {incomeCategories.map(cat => {
          const actual = incByCat[cat.name] || 0;
          const planned = effIncBudgets[cat.name] || 0;
          const hasOvr = incomeOverrides[bKey(selYear, selMonth, cat.name)] !== undefined;
          const isEditI = editIncBudget === cat.name;
          const surplus = actual - planned;
          const pct = planned ? Math.min((actual / planned) * 100, 100) : 0;
          return (
            <div key={cat.name} style={{ background: C.white, borderRadius: 16, padding: '14px 18px', marginBottom: 10, boxShadow: Sx.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.gray1 }}>{cat.name}</span>
                      {hasOvr && <span style={{ fontSize: 10, background: C.goldL, color: C.gold, padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>editado</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray3, marginTop: 1 }}>Recibido: {fmt(actual)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isEditI ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input autoFocus style={{ ...Sx.inp, width: 100, padding: '6px 10px', margin: 0 }} value={editIncBudgetVal} onChange={e => setEditIncBudgetVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { saveIncBudget(cat.name, editIncBudgetVal); setEditIncBudget(null); } }} />
                      <button onClick={() => { saveIncBudget(cat.name, editIncBudgetVal); setEditIncBudget(null); }} style={{ ...Sx.btn, padding: '6px 12px', fontSize: 12 }}>OK</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 800, fontSize: 15, color: C.gray1 }}>{fmt(planned)}</span>
                      <button onClick={() => { setEditIncBudget(cat.name); setEditIncBudgetVal(String(planned)); }} style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${C.border}`, background: C.gray6, cursor: 'pointer', fontSize: 14, color: C.gray3 }}>✎</button>
                    </>
                  )}
                </div>
              </div>
              {planned > 0 && (
                <>
                  <div style={{ height: 6, background: C.gray5, borderRadius: 6 }}><div style={{ width: `${pct}%`, height: '100%', background: cat.color, borderRadius: 6 }} /></div>
                  <div style={{ fontSize: 12, marginTop: 5, color: surplus >= 0 ? C.sage : C.coral, fontWeight: 600 }}>
                    {surplus >= 0 ? `✓ +${fmt(surplus)} sobre lo esperado` : `⏳ Faltan ${fmt(-surplus)} para la meta`}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
