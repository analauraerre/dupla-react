import { useState } from 'react';
import { C, Sx, MONTHS, MONTHS_FULL, PALETTE, ICON_OPTIONS } from '../../utils/constants';
import PieChartSVG from '../charts/PieChartSVG';
import BarChartSVG from '../charts/BarChartSVG';
import LineChartSVG from '../charts/LineChartSVG';

export default function ChartsTab({
  selMonth, selYear, categories, expenses, incomes,
  filtExp, totExp, effBudgets, expByCat, pieData, barData,
  fmt, addCategory, deleteCategory,
}) {
  const [chartView,    setChartView]    = useState('pie');
  const [showCatMgr,  setShowCatMgr]   = useState(false);
  const [newCat,       setNewCat]       = useState({ name: '', icon: '⭐', color: C.sage, bg: C.sageL });
  const [showIconPick, setShowIconPick] = useState(false);
  const [delCat,       setDelCat]       = useState(null);

  const trendData = Array.from({ length: 6 }, (_, i) => {
    let mo = selMonth - 5 + i, yr = selYear;
    while (mo < 0) { mo += 12; yr--; }
    return {
      name: MONTHS[mo],
      Egresos:  expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === mo && d.getFullYear() === yr; }).reduce((s, e) => s + e.amount, 0),
      Ingresos: incomes.filter(i => i.month === mo && i.year === yr).reduce((s, i) => s + i.amount, 0),
    };
  });

  return (
    <div>
      <div style={Sx.ph}>
        <div><div style={Sx.pt}>Gráficos</div><div style={Sx.ps}>{MONTHS_FULL[selMonth]}</div></div>
        <button style={{ ...Sx.btn, background: C.gray6, color: C.gray2, border: `1px solid ${C.border}` }} onClick={() => setShowCatMgr(v => !v)}>{showCatMgr ? '✕ Cerrar' : '⚙ Categorías'}</button>
      </div>

      {showCatMgr && (
        <div style={{ ...Sx.fcard, border: `1.5px solid ${C.border}` }}>
          <div style={Sx.ft}>Gestionar categorías</div>
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

      <div style={Sx.chipRow}>
        {[{ id: 'pie', l: '🥧 Por rubro' }, { id: 'bar', l: '📊 vs Presupuesto' }, { id: 'trend', l: '📈 Tendencia' }].map(c => (
          <button key={c.id} onClick={() => setChartView(c.id)} style={{ padding: '8px 14px', borderRadius: 24, border: `1.5px solid ${chartView === c.id ? C.coral : C.border}`, background: chartView === c.id ? C.coralL : C.white, color: chartView === c.id ? C.coral : C.gray2, fontSize: 12, fontWeight: chartView === c.id ? 700 : 500, cursor: 'pointer' }}>{c.l}</button>
        ))}
      </div>

      {chartView === 'pie' && (
        <div style={Sx.card}>
          <div style={Sx.ct}>Distribución de egresos</div>
          {!pieData.length ? <div style={{ textAlign: 'center', color: C.gray3, padding: 16 }}>Sin datos este mes</div> : (
            <div>
              <PieChartSVG data={pieData} size={200} />
              <div style={{ marginTop: 12 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 14, color: C.gray2 }}>{d.icon} {d.name}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.gray1 }}>{fmt(d.value)}</div>
                    <div style={{ fontSize: 12, color: C.gray3, minWidth: 36, textAlign: 'right' }}>{totExp ? Math.round((d.value / totExp) * 100) : 0}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {chartView === 'bar' && (
        <div style={Sx.card}>
          <div style={Sx.ct}>Gastado vs Presupuesto</div>
          {!barData.length ? <div style={{ textAlign: 'center', color: C.gray3, padding: 16 }}>Sin datos</div> : (
            <div>
              <BarChartSVG data={barData} height={220} />
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, background: '#FF7867', borderRadius: 2 }} /><span style={{ fontSize: 11, color: C.gray3 }}>Gastado</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, background: '#E8E8E8', borderRadius: 2 }} /><span style={{ fontSize: 11, color: C.gray3 }}>Presupuesto</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {chartView === 'trend' && (
        <div style={Sx.card}>
          <div style={Sx.ct}>Últimos 6 meses</div>
          <LineChartSVG data={trendData} height={200} />
        </div>
      )}
    </div>
  );
}
