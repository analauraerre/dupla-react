import { useState } from 'react';
import { USERS } from '../../utils/constants';
import { useTheme } from '../../context/ThemeContext';

export default function ExpensesTab({ filtExp, totExp, expByUser, getCat, fmt, delExp, setTab }) {
  const { C, Sx } = useTheme();
  const [expFilter, setExpFilter] = useState('Todos');

  return (
    <div>
      <div style={Sx.ph}>
        <div>
          <div style={Sx.pt}>Egresos</div>
          <div style={Sx.ps}>{fmt(totExp)} · {filtExp.length} movimientos</div>
        </div>
        <button style={Sx.btn} onClick={() => setTab('home')}>+ Agregar</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['Todos', 'Ana', 'Fabio'].map(f => (
          <button key={f} onClick={() => setExpFilter(f)}
            style={{ flex: 1, padding: '9px 0', borderRadius: 24, border: `1.5px solid ${expFilter === f ? C.coral : C.border}`, background: expFilter === f ? C.coralL : C.white, color: expFilter === f ? C.coral : C.gray3, fontSize: 13, fontWeight: expFilter === f ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {f === 'Ana' ? '👩' : f === 'Fabio' ? '👨' : '👥'} {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {USERS.map(u => (
          <div key={u} style={{ flex: 1, background: C.white, borderRadius: 16, padding: '12px 14px', boxShadow: Sx.shadow, opacity: expFilter !== 'Todos' && expFilter !== u ? 0.4 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{u === 'Ana' ? '👩' : '👨'}</span>
              <div>
                <div style={{ fontSize: 11, color: C.gray3, fontWeight: 600 }}>{u}</div>
                <div style={{ fontSize: 17, fontWeight: 500, color: C.rose }}>{fmt(expByUser[u] || 0)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(() => {
        const shown = filtExp.filter(e => expFilter === 'Todos' || e.user === expFilter);
        if (!shown.length) return <div style={Sx.empty}>Sin egresos{expFilter !== 'Todos' ? ` de ${expFilter}` : ''} este mes 📭</div>;
        return [...shown].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
          const cat = getCat(e.category);
          const isCardPay = !['Efectivo', 'Débito'].includes(e.paymentMethod || 'Efectivo');
          const hasCuotas = (e.installments || 1) > 1;
          return (
            <div key={e.id} style={Sx.erow}>
              <div style={{ ...Sx.dot, background: cat.bg, fontSize: 18 }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: C.gray1 }}>{e.description}</div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, background: cat.bg, color: cat.color, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{cat.icon} {e.category}</span>
                  <span style={{ fontSize: 11, color: C.gray2, fontWeight: 600 }}>{e.user === 'Ana' ? '👩' : '👨'} {e.user}</span>
                  <span style={{ fontSize: 11, color: C.gray3 }}>{new Date(e.date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                  {isCardPay
                    ? <span style={{ fontSize: 10, background: C.lavL, color: C.lavender, padding: '1px 7px', borderRadius: 6, fontWeight: 600 }}>💳 {e.paymentMethod}{hasCuotas ? ` · ${e.installments}x` : ''}</span>
                    : <span style={{ fontSize: 10, background: C.sageL, color: C.sage, padding: '1px 7px', borderRadius: 6, fontWeight: 600 }}>{e.paymentMethod || 'Efectivo'}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontWeight: 500, fontSize: 16, color: C.rose }}>{fmt(e.amount)}</div>
                {hasCuotas && <div style={{ fontSize: 11, color: C.lavender }}>{fmt(e.amount / e.installments)}/mes</div>}
                <button onClick={() => delExp(e.id)} style={Sx.xbtn}>×</button>
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
