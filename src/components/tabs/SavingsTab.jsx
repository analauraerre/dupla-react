import { useState } from 'react';
import { C, Sx } from '../../utils/constants';
import { todayStr } from '../../utils/formatters';

export default function SavingsTab({ savingsAccounts, fmt, addSavingsAccount, deleteSavingsAccount, addSavTx, deleteSavTx, saveSavAccName, getAccBalance }) {
  const [savAccForm,   setSavAccForm]   = useState({ name: '', currency: 'ARS' });
  const [showSavForm,  setShowSavForm]  = useState(false);
  const [savTxForm,    setSavTxForm]    = useState({ amount: '', note: '', type: 'add' });
  const [showSavTx,    setShowSavTx]    = useState(null);
  const [editSavAcc,   setEditSavAcc]   = useState(null);
  const [editSavName,  setEditSavName]  = useState('');
  const [delSavAcc,    setDelSavAcc]    = useState(null);
  const [expandSavAcc, setExpandSavAcc] = useState(null);

  const arsTot = savingsAccounts.filter(a => a.currency === 'ARS').reduce((s, a) => s + getAccBalance(a), 0);
  const usdTot = savingsAccounts.filter(a => a.currency === 'USD').reduce((s, a) => s + getAccBalance(a), 0);

  const AccountCard = ({ acc, accentColor, accentLight, symbol }) => {
    const bal = getAccBalance(acc);
    const isExpanded = expandSavAcc === acc.id;
    const isEditing  = editSavAcc === acc.id;
    const showTx     = showSavTx === acc.id;

    return (
      <div style={{ background: C.white, borderRadius: 18, marginBottom: 12, boxShadow: Sx.shadow, overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8, flex: 1, marginRight: 8 }}>
                <input autoFocus style={{ ...Sx.inp, flex: 1, padding: '6px 10px' }} value={editSavName} onChange={e => setEditSavName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { saveSavAccName(acc.id, editSavName); setEditSavAcc(null); } }} />
                <button onClick={() => { saveSavAccName(acc.id, editSavName); setEditSavAcc(null); }} style={{ ...Sx.btn, padding: '6px 14px', fontSize: 12 }}>OK</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{symbol === '$' ? '💰' : '💵'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.gray1 }}>{acc.name}</div>
                  <div style={{ fontSize: 12, color: C.gray3 }}>{acc.transactions.length} movimiento{acc.transactions.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: bal >= 0 ? accentColor : C.coral }}>
                  {symbol !== '$' ? `${symbol} ` : ''}{symbol === '$' ? fmt(bal) : Number(bal).toLocaleString('es-AR')}
                </div>
              </div>
              <button onClick={() => { setEditSavAcc(acc.id); setEditSavName(acc.name); }} style={Sx.xbtn}>✎</button>
              {delSavAcc === acc.id ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { deleteSavingsAccount(acc.id); setDelSavAcc(null); }} style={{ padding: '3px 8px', background: C.coral, color: C.white, border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>Sí</button>
                  <button onClick={() => setDelSavAcc(null)} style={{ padding: '3px 8px', background: C.gray5, border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>No</button>
                </div>
              ) : <button onClick={() => setDelSavAcc(acc.id)} style={Sx.xbtn}>×</button>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setShowSavTx(showTx && savTxForm.type === 'add' ? null : acc.id); setSavTxForm({ amount: '', note: '', type: 'add' }); }} style={{ flex: 1, padding: '8px 0', background: accentLight, color: accentColor, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Sumar</button>
            <button onClick={() => { setShowSavTx(showTx && savTxForm.type === 'sub' ? null : acc.id); setSavTxForm({ amount: '', note: '', type: 'sub' }); }} style={{ flex: 1, padding: '8px 0', background: C.coralL, color: C.coral, border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>− Restar</button>
            <button onClick={() => setExpandSavAcc(isExpanded ? null : acc.id)} style={{ padding: '8px 12px', background: C.gray6, color: C.gray2, border: 'none', borderRadius: 12, fontSize: 13, cursor: 'pointer' }}>{isExpanded ? '▲' : '▼'}</button>
          </div>
        </div>

        {showTx && (
          <div style={{ padding: '0 18px 16px' }}>
            <div style={{ background: savTxForm.type === 'add' ? accentLight : C.coralL, borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: savTxForm.type === 'add' ? accentColor : C.coral, marginBottom: 10 }}>
                {savTxForm.type === 'add' ? 'SUMAR A' : 'RESTAR DE'} {acc.name.toUpperCase()}
              </div>
              <input style={{ ...Sx.inp, marginBottom: 10, fontSize: 20, fontWeight: 700, textAlign: 'center' }} type="number" placeholder={`${symbol} 0`} value={savTxForm.amount} onChange={e => setSavTxForm(p => ({ ...p, amount: e.target.value }))} />
              <input style={{ ...Sx.inp, marginBottom: 10, fontSize: 13 }} placeholder="Nota (opcional)" value={savTxForm.note} onChange={e => setSavTxForm(p => ({ ...p, note: e.target.value }))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { addSavTx(acc.id, savTxForm); setShowSavTx(null); setSavTxForm({ amount: '', note: '', type: 'add' }); }} style={{ ...Sx.btn, background: savTxForm.type === 'add' ? accentColor : C.coral }}>Guardar</button>
                <button onClick={() => setShowSavTx(null)} style={{ ...Sx.btn, background: C.gray5, color: C.gray2 }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div style={{ borderTop: `1px solid ${C.gray5}`, padding: '12px 18px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray3, marginBottom: 10 }}>HISTORIAL</div>
            {!acc.transactions.length && <div style={{ fontSize: 13, color: C.gray3, textAlign: 'center', padding: '8px 0' }}>Sin movimientos todavía</div>}
            {[...acc.transactions].sort((a, b) => b.date.localeCompare(a.date)).map(tx => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.gray5}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.amount >= 0 ? accentColor : C.coral, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.gray1, fontWeight: 500 }}>{tx.note || 'Sin nota'}</div>
                  <div style={{ fontSize: 11, color: C.gray3 }}>{new Date(tx.date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: tx.amount >= 0 ? accentColor : C.coral }}>
                  {tx.amount >= 0 ? '+' : ''}{symbol !== '$' ? `${symbol} ${Number(tx.amount).toLocaleString('es-AR')}` : fmt(tx.amount)}
                </div>
                <button onClick={() => deleteSavTx(acc.id, tx.id)} style={Sx.xbtn}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={Sx.ph}>
        <div><div style={Sx.pt}>Ahorros</div><div style={Sx.ps}>Tu dinero guardado</div></div>
        <button style={Sx.btn} onClick={() => setShowSavForm(v => !v)}>{showSavForm ? 'Cancelar' : '+ Agregar'}</button>
      </div>

      {showSavForm && (
        <div style={Sx.fcard}>
          <div style={Sx.ft}>Nuevo bolsillo de ahorro</div>
          <div style={Sx.fgrid}>
            <input style={Sx.inp} placeholder="Descripción (ej: Banco Galicia, Colchón...)" value={savAccForm.name} onChange={e => setSavAccForm(p => ({ ...p, name: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { addSavingsAccount(savAccForm); setSavAccForm({ name: '', currency: 'ARS' }); setShowSavForm(false); } }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ id: 'ARS', label: '$ Pesos' }, { id: 'USD', label: 'US$ Dólares' }].map(c => (
                <button key={c.id} onClick={() => setSavAccForm(p => ({ ...p, currency: c.id }))} style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: `1.5px solid ${savAccForm.currency === c.id ? C.sage : C.border}`, background: savAccForm.currency === c.id ? C.sageL : C.white, color: savAccForm.currency === c.id ? C.sage : C.gray3, fontSize: 14, fontWeight: savAccForm.currency === c.id ? 700 : 500, cursor: 'pointer' }}>{c.label}</button>
              ))}
            </div>
          </div>
          <button style={Sx.btn} onClick={() => { addSavingsAccount(savAccForm); setSavAccForm({ name: '', currency: 'ARS' }); setShowSavForm(false); }}>Crear bolsillo</button>
        </div>
      )}

      {/* Totals */}
      {savingsAccounts.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          {arsTot > 0 && (
            <div style={{ flex: 1, background: C.sageL, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.sageM}` }}>
              <div style={{ fontSize: 11, color: C.sage, fontWeight: 700, marginBottom: 4 }}>TOTAL PESOS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.sage }}>{fmt(arsTot)}</div>
            </div>
          )}
          {usdTot > 0 && (
            <div style={{ flex: 1, background: C.skyL, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.sky}44` }}>
              <div style={{ fontSize: 11, color: C.sky, fontWeight: 700, marginBottom: 4 }}>TOTAL USD</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.sky }}>US$ {Number(usdTot).toLocaleString('es-AR')}</div>
            </div>
          )}
        </div>
      )}

      {!savingsAccounts.length && <div style={Sx.empty}>Sin bolsillos todavía 🐷<br /><span style={{ fontSize: 13 }}>Agregá uno para empezar a registrar</span></div>}

      {/* ARS section */}
      {savingsAccounts.some(a => a.currency === 'ARS') && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gray3, marginBottom: 10, letterSpacing: 1 }}>$ PESOS</div>
          {savingsAccounts.filter(a => a.currency === 'ARS').map(acc => (
            <AccountCard key={acc.id} acc={acc} accentColor={C.sage} accentLight={C.sageL} symbol="$" />
          ))}
        </div>
      )}

      {/* USD section */}
      {savingsAccounts.some(a => a.currency === 'USD') && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gray3, marginBottom: 10, letterSpacing: 1 }}>US$ DÓLARES</div>
          {savingsAccounts.filter(a => a.currency === 'USD').map(acc => (
            <AccountCard key={acc.id} acc={acc} accentColor={C.sky} accentLight={C.skyL} symbol="US$" />
          ))}
        </div>
      )}
    </div>
  );
}
