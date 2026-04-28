import { useState } from 'react';
import { C, Sx } from '../../utils/constants';

export default function CardsTab({ creditCards, expenses, selMonth, selYear, fmt, addCard }) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard,     setNewCard]     = useState({ name: '', limit: '' });

  const submit = () => {
    if (!newCard.name.trim()) return;
    addCard({ name: newCard.name.trim(), limit: parseFloat(newCard.limit) || 0 });
    setNewCard({ name: '', limit: '' }); setShowAddCard(false);
  };

  return (
    <div>
      <div style={Sx.ph}>
        <div>
          <div style={Sx.pt}>Tarjetas</div>
          <div style={Sx.ps}>{creditCards.length} registrada{creditCards.length !== 1 ? 's' : ''}</div>
        </div>
        <button style={Sx.btn} onClick={() => setShowAddCard(v => !v)}>{showAddCard ? 'Cancelar' : '+ Agregar'}</button>
      </div>

      {showAddCard && (
        <div style={Sx.fcard}>
          <div style={Sx.ft}>Nueva tarjeta</div>
          <div style={Sx.fgrid}>
            <input style={Sx.inp} placeholder="Nombre (ej: Visa Santander)" value={newCard.name} onChange={e => setNewCard(p => ({ ...p, name: e.target.value }))} />
            <input style={Sx.inp} placeholder="Límite (opcional)" type="number" value={newCard.limit} onChange={e => setNewCard(p => ({ ...p, limit: e.target.value }))} />
          </div>
          <button style={Sx.btn} onClick={submit}>Guardar</button>
        </div>
      )}

      {!creditCards.length && <div style={Sx.empty}>Sin tarjetas registradas 💳<br /><span style={{ fontSize: 13, color: C.gray3 }}>Agregá una para ver sus movimientos</span></div>}

      {creditCards.map(card => {
        const cardExp = expenses.filter(e => e.paymentMethod === card.name);
        const thisMonth = cardExp.filter(e => { const d = new Date(e.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; }).reduce((s, e) => s + e.amount, 0);
        const installmentThisMonth = cardExp.filter(e => (e.installments || 1) > 1).reduce((s, e) => {
          const start = new Date(e.date);
          const startM = start.getFullYear() * 12 + start.getMonth();
          const curM = selYear * 12 + selMonth;
          const n = curM - startM;
          return s + (n >= 0 && n < (e.installments || 1) ? e.amount / (e.installments || 1) : 0);
        }, 0);

        return (
          <div key={card.id} style={{ ...Sx.erow, flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: C.lavL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💳</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.gray1 }}>{card.name}</div>
                {card.limit > 0 && (
                  <div style={{ fontSize: 12, color: C.gray3 }}>
                    Límite: {fmt(card.limit)} · Disponible: <span style={{ color: card.limit - thisMonth > 0 ? C.sage : C.coral, fontWeight: 600 }}>{fmt(Math.max(card.limit - thisMonth, 0))}</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: C.lavender }}>{fmt(thisMonth)}</div>
                <div style={{ fontSize: 11, color: C.gray3 }}>este mes</div>
              </div>
            </div>

            {installmentThisMonth > 0 && (
              <div style={{ background: C.lavL, borderRadius: 12, padding: '10px 14px', width: '100%' }}>
                <div style={{ fontSize: 12, color: C.lavender, fontWeight: 600 }}>Cuotas que vencen este mes: {fmt(Math.round(installmentThisMonth))}</div>
              </div>
            )}

            {cardExp.filter(e => { const d = new Date(e.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; }).length > 0 && (
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.gray3, marginBottom: 6, letterSpacing: 0.5 }}>MOVIMIENTOS DEL MES</div>
                {cardExp.filter(e => { const d = new Date(e.date); return d.getMonth() === selMonth && d.getFullYear() === selYear; }).sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
                  <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.gray5}` }}>
                    <div>
                      <div style={{ fontSize: 13, color: C.gray1 }}>{e.description || e.category}</div>
                      <div style={{ fontSize: 11, color: C.gray3 }}>{new Date(e.date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}{(e.installments || 1) > 1 ? ` · ${e.installments}x` : ''}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.lavender }}>{fmt(e.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
