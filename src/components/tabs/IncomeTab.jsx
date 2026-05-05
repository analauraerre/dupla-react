import { useState } from 'react';
import { USERS, MONTHS_FULL } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';

export default function IncomeTab({ selMonth, incomeCategories, filtInc, totInc, fmt, addIncome, delInc }) {
  const { C, Sx } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ description: '', amount: '', user: 'Ana', incomeCategory: incomeCategories[0]?.name || '' });

  const submit = () => {
    if (!form.amount) return;
    addIncome(form);
    setForm({ description: '', amount: '', user: 'Ana', incomeCategory: incomeCategories[0]?.name || '' });
    setShowForm(false);
  };

  return (
    <div>
      <div style={Sx.ph}>
        <div>
          <div style={Sx.pt}>Ingresos</div>
          <div style={Sx.ps}>{fmt(totInc)} en {MONTHS_FULL[selMonth]}</div>
        </div>
        <button style={Sx.btn} onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancelar' : '+ Agregar'}</button>
      </div>

      {showForm && (
        <div style={Sx.fcard}>
          <div style={Sx.ft}>Nuevo ingreso</div>
          <div style={Sx.fgrid}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {incomeCategories.map(c => (
                <button key={c.name} onClick={() => setForm(p => ({ ...p, incomeCategory: c.name }))}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${form.incomeCategory === c.name ? c.color : C.border}`, background: form.incomeCategory === c.name ? c.bg : C.white, color: form.incomeCategory === c.name ? c.color : C.gray3, fontSize: 12, fontWeight: form.incomeCategory === c.name ? 700 : 500, cursor: 'pointer' }}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
            <input style={Sx.inp} placeholder="Descripción (opcional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <input style={Sx.inp} placeholder="Monto" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            <select style={Sx.inp} value={form.user} onChange={e => setForm(p => ({ ...p, user: e.target.value }))}>
              {USERS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <button style={Sx.btn} onClick={submit}>Guardar</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {USERS.map(u => {
          const ui = filtInc.filter(i => i.user === u).reduce((s, i) => s + i.amount, 0);
          return (
            <div key={u} style={{ flex: 1, background: C.white, borderRadius: 18, padding: '16px', textAlign: 'center', boxShadow: Sx.shadow }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{u === 'Ana' ? '👩' : '👨'}</div>
              <div style={{ fontSize: 12, color: C.gray3, fontWeight: 600 }}>{u}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.sage, marginTop: 4 }}>{fmt(ui)}</div>
            </div>
          );
        })}
      </div>

      {!filtInc.length && <div style={Sx.empty}>Sin ingresos este mes 💸</div>}
      {filtInc.map(i => {
        const icat = incomeCategories.find(c => c.name === (i.incomeCategory || '')) || { icon: '💰', color: C.sage, bg: C.sageL };
        return (
          <div key={i.id} style={Sx.erow}>
            <div style={{ ...Sx.dot, background: icat.bg, fontSize: 18 }}>{icat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: C.gray1 }}>{i.description || i.incomeCategory || 'Ingreso'}</div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                {i.incomeCategory && <span style={{ fontSize: 10, background: icat.bg, color: icat.color, padding: '1px 7px', borderRadius: 6, fontWeight: 600 }}>{icat.icon} {i.incomeCategory}</span>}
                <span style={{ fontSize: 11, color: C.gray3 }}>{i.user} · {MONTHS_FULL[i.month]}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.sage }}>+{fmt(i.amount)}</div>
              <button onClick={() => delInc(i.id)} style={Sx.xbtn}>×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
