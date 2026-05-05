import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { todayStr } from '../../utils/formatters';

export default function SavingsTab({
  savingsAccounts, fmt, addSavingsAccount, deleteSavingsAccount,
  addSavTx, deleteSavTx, saveSavAccName, saveSavAccCurrency, getAccBalance,
}) {
  const { C, Sx } = useTheme();
  const [currFilter,   setCurrFilter]   = useState('todos'); // 'todos' | 'ARS' | 'USD'
  const [selectedId,   setSelectedId]   = useState(null);
  const [txType,       setTxType]       = useState('add'); // 'add' | 'sub'
  const [txAmount,     setTxAmount]     = useState('');
  const [txNote,       setTxNote]       = useState('');
  const [showNewForm,  setShowNewForm]  = useState(false);
  const [newAccForm,   setNewAccForm]   = useState({ name: '', currency: 'ARS' });

  const arsAccounts = savingsAccounts.filter(a => a.currency === 'ARS');
  const usdAccounts = savingsAccounts.filter(a => a.currency === 'USD');
  const arsTot = arsAccounts.reduce((s, a) => s + getAccBalance(a), 0);
  const usdTot = usdAccounts.reduce((s, a) => s + getAccBalance(a), 0);

  const shown = currFilter === 'todos'
    ? savingsAccounts
    : savingsAccounts.filter(a => a.currency === currFilter);

  const chipStyle = (active, activeColor, activeBg) => ({
    padding: '8px 16px',
    borderRadius: 999,
    border: `0.5px solid ${active ? activeColor : C.border}`,
    background: active ? activeBg : C.gray6,
    color: active ? activeColor : C.gray2,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  });

  const selectAcc = (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setTxAmount('');
      setTxNote('');
      setTxType('add');
    } else {
      setSelectedId(id);
      setTxAmount('');
      setTxNote('');
      setTxType('add');
    }
  };

  const handleSaveTx = (acc) => {
    const amt = parseFloat(txAmount);
    if (!amt || amt <= 0) return;
    addSavTx(acc.id, { amount: txAmount, note: txNote, type: txType });
    setTxAmount('');
    setTxNote('');
    setSelectedId(null);
  };

  const handleAddAccount = () => {
    if (!newAccForm.name.trim()) return;
    addSavingsAccount(newAccForm);
    setNewAccForm({ name: '', currency: 'ARS' });
    setShowNewForm(false);
  };

  return (
    <div>
      {/* Header verde con totales integrados */}
      <div style={{ background: C.coral, borderRadius: 14, padding: '18px 16px 20px', marginBottom: 14 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>Ahorros</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            Tu dinero guardado · {savingsAccounts.length} cuenta{savingsAccounts.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', marginBottom: 14 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Total ARS · {arsAccounts.length} {arsAccounts.length === 1 ? 'cuenta' : 'cuentas'}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', letterSpacing: '-0.5px' }}>{fmt(arsTot)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Total USD · {usdAccounts.length} {usdAccounts.length === 1 ? 'cuenta' : 'cuentas'}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', letterSpacing: '-0.5px' }}>US$ {Number(usdTot).toLocaleString('es-AR')}</div>
          </div>
        </div>
      </div>

      {/* Filtros chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={() => setCurrFilter('todos')} style={chipStyle(currFilter === 'todos', C.coral, C.coralL)}>Todos</button>
        <button onClick={() => setCurrFilter('ARS')} style={chipStyle(currFilter === 'ARS', C.sage, C.sageL)}>ARS</button>
        <button onClick={() => setCurrFilter('USD')} style={chipStyle(currFilter === 'USD', C.sky, C.skyL)}>USD</button>
      </div>

      {/* Lista de cuentas */}
      {!shown.length && (
        <div style={Sx.empty}>Sin cuentas de ahorro{currFilter !== 'todos' ? ` en ${currFilter}` : ''}</div>
      )}

      {shown.map(acc => {
        const bal         = getAccBalance(acc);
        const isARS       = acc.currency === 'ARS';
        const accentColor = isARS ? C.sage : C.sky;
        const accentLight = isARS ? C.sageL : C.skyL;
        const symbol      = isARS ? '💰' : '💵';
        const isSelected  = selectedId === acc.id;
        const recentTx    = [...acc.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

        return (
          <div key={acc.id} style={{ marginBottom: 8 }}>
            {/* Row */}
            <div
              onClick={() => selectAcc(acc.id)}
              style={{
                background: C.white,
                borderRadius: isSelected ? '10px 10px 0 0' : 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: `0.5px solid ${isSelected ? accentColor : C.border}`,
                cursor: 'pointer',
                boxShadow: Sx.shadowSm,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{symbol}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{acc.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: accentColor, background: accentLight, borderRadius: 4, padding: '1px 5px', letterSpacing: '0.5px', flexShrink: 0 }}>{acc.currency || 'ARS'}</div>
                </div>
                <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>{acc.transactions.length} movimiento{acc.transactions.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ fontWeight: 500, fontSize: 16, color: bal >= 0 ? accentColor : C.rose, flexShrink: 0 }}>
                {isARS ? fmt(bal) : `US$ ${Number(bal).toLocaleString('es-AR')}`}
              </div>
            </div>

            {/* Editor inline */}
            {isSelected && (
              <div style={{
                background: C.white,
                borderRadius: '0 0 10px 10px',
                padding: '14px 16px',
                border: `0.5px solid ${accentColor}`,
                borderTop: `0.5px solid ${C.border}`,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.gray2 }}>{acc.name}</div>
                  <button onClick={() => selectAcc(acc.id)} style={{ ...Sx.xbtn, fontSize: 18 }}>✕</button>
                </div>

                {/* Moneda — toggle ARS / USD */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.gray3, marginBottom: 6, fontWeight: 500 }}>Moneda de la cuenta</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: 'ARS', label: '$ Pesos ARS', color: C.sage, bg: C.sageL }, { id: 'USD', label: '$ Dólares USD', color: C.sky, bg: C.skyL }].map(opt => {
                      const active = acc.currency === opt.id;
                      return (
                        <button key={opt.id} onClick={(e) => { e.stopPropagation(); saveSavAccCurrency(acc.id, opt.id); }}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `0.5px solid ${active ? opt.color : C.border}`, background: active ? opt.bg : C.white, color: active ? opt.color : C.gray3, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggle tipo */}
                <div style={{ display: 'flex', background: C.gray6, borderRadius: 8, padding: 3, gap: 3, marginBottom: 12 }}>
                  {[{ id: 'add', label: '+ Sumar' }, { id: 'sub', label: '− Restar' }].map(opt => {
                    const active = txType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTxType(opt.id)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
                          fontSize: 13, fontWeight: 500,
                          background: active ? C.white : 'transparent',
                          color: active ? (opt.id === 'add' ? accentColor : C.rose) : C.gray3,
                          boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Monto */}
                <input
                  type="text" inputMode="numeric"
                  placeholder={isARS ? '$ 0' : 'US$ 0'}
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  style={{ ...Sx.inp, marginBottom: 8 }}
                />

                {/* Nota */}
                <input
                  type="text"
                  placeholder="Nota (opcional)"
                  value={txNote}
                  onChange={e => setTxNote(e.target.value)}
                  style={{ ...Sx.inp, marginBottom: 12 }}
                />

                {/* Botón guardar */}
                <button
                  onClick={() => handleSaveTx(acc)}
                  style={{ ...Sx.btn, width: '100%', background: txType === 'add' ? accentColor : C.rose, marginBottom: 14 }}
                >
                  Guardar
                </button>

                {/* Historial últimas 5 */}
                {recentTx.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: C.gray3, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Últimos movimientos</div>
                    {recentTx.map(tx => (
                      <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `0.5px solid ${C.gray5}` }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: tx.amount >= 0 ? accentColor : C.rose, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: C.gray1, fontWeight: 400 }}>{tx.note || 'Sin nota'}</div>
                          <div style={{ fontSize: 11, color: C.gray3 }}>{new Date(tx.date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: tx.amount >= 0 ? accentColor : C.rose }}>
                          {tx.amount >= 0 ? '+' : ''}{isARS ? fmt(tx.amount) : `US$ ${Number(tx.amount).toLocaleString('es-AR')}`}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteSavTx(acc.id, tx.id); }} style={Sx.xbtn}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Botón nueva cuenta */}
      {!showNewForm ? (
        <button
          onClick={() => setShowNewForm(true)}
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: `0.5px dashed ${C.border}`, background: 'transparent', color: C.gray3, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}
        >
          + Nueva cuenta
        </button>
      ) : (
        <div style={{ ...Sx.fcard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={Sx.ft}>Nueva cuenta de ahorro</div>
            <button onClick={() => { setShowNewForm(false); setNewAccForm({ name: '', currency: 'ARS' }); }} style={{ ...Sx.xbtn, fontSize: 18 }}>✕</button>
          </div>
          <input
            style={{ ...Sx.inp, marginBottom: 10 }}
            placeholder="Descripción (ej: Banco Galicia, Colchón...)"
            value={newAccForm.name}
            onChange={e => setNewAccForm(p => ({ ...p, name: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAddAccount(); }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[{ id: 'ARS', label: '$ Pesos' }, { id: 'USD', label: 'US$ Dólares' }].map(c => (
              <button
                key={c.id}
                onClick={() => setNewAccForm(p => ({ ...p, currency: c.id }))}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  border: `0.5px solid ${newAccForm.currency === c.id ? C.sage : C.border}`,
                  background: newAccForm.currency === c.id ? C.sageL : C.white,
                  color: newAccForm.currency === c.id ? C.sage : C.gray3,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button style={{ ...Sx.btn, width: '100%' }} onClick={handleAddAccount}>Crear cuenta</button>
        </div>
      )}
    </div>
  );
}
