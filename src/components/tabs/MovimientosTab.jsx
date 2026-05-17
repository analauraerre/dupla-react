import { useState, useRef } from 'react';
import { MONTHS_FULL } from '../../utils/constants';
import { useTheme } from '../../hooks/useTheme';
import { ExpandContainer, HorizontalPager } from '../../motion/index.js';
import { ACCORDION_CLEAR_DELAY } from '../../motion/motionPolicy.js';

export default function MovimientosTab({
  filtExp, filtInc, getCat, fmt, delExp, delInc, editExpense, editIncome,
  incomeCategories, categories, selMonth, userNames,
}) {
  const { C, Sx } = useTheme();
  const [userFilter,  setUserFilter]  = useState('todos');
  const [selectedId,  setSelectedId]  = useState(null);
  const [editForm,    setEditForm]    = useState(null);
  const [closingKey,  setClosingKey]  = useState(null);
  const closeTimerRef = useRef(null);

  const allMovements = [
    ...filtExp.map(e => ({ ...e, _type: 'egreso',  _sortDate: new Date(e.date + 'T00:00:00') })),
    ...filtInc.map(i => ({ ...i, _type: 'ingreso', _sortDate: new Date(i.year, i.month, 15) })),
  ].sort((a, b) => b._sortDate - a._sortDate);

  const tabs = ['todos', ...userNames];
  const activeIndex = Math.max(0, tabs.indexOf(userFilter));

  // Count shown items for the header (uses current filter)
  const shownCount = userFilter === 'todos'
    ? allMovements.length
    : allMovements.filter(m => m.user === userFilter).length;

  const totInc = filtInc.reduce((s, i) => s + i.amount, 0);
  const totExp = filtExp.reduce((s, e) => s + e.amount, 0);

  const selectItem = (m) => {
    const key = m._type === 'egreso' ? `e-${m.id}` : `i-${m.id}`;
    clearTimeout(closeTimerRef.current);
    if (selectedId === key) {
      setClosingKey(key);
      setSelectedId(null);
      closeTimerRef.current = setTimeout(() => {
        setEditForm(null);
        setClosingKey(null);
      }, ACCORDION_CLEAR_DELAY);
    } else {
      setClosingKey(null);
      setSelectedId(key);
      setEditForm({ ...m });
    }
  };

  const closeEditor = () => {
    clearTimeout(closeTimerRef.current);
    setClosingKey(selectedId);
    setSelectedId(null);
    closeTimerRef.current = setTimeout(() => {
      setEditForm(null);
      setClosingKey(null);
    }, ACCORDION_CLEAR_DELAY);
  };

  const saveEdit = () => {
    if (!editForm) return;
    if (editForm._type === 'egreso') editExpense(editForm.id, editForm);
    else editIncome(editForm.id, editForm);
    closeEditor();
  };

  const handleDelete = () => {
    if (!editForm) return;
    if (editForm._type === 'egreso') delExp(editForm.id);
    else delInc(editForm.id);
    closeEditor();
  };

  const switchTab = (name) => {
    if (selectedId) closeEditor();
    setUserFilter(name);
  };

  const chipStyle = (active, activeColor, activeBg) => ({
    padding: '8px 16px',
    borderRadius: 999,
    border: `0.5px solid ${active ? activeColor : C.border}`,
    background: active ? activeBg : C.gray6,
    color: active ? activeColor : C.gray2,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  // Shared list renderer — closure has full access to state and handlers
  const renderList = (movements) => (
    <>
      {!movements.length && (
        <div style={Sx.empty}>Sin movimientos este mes</div>
      )}
      <ul data-ui="list" data-component="movements-list" style={{ listStyle: 'none', padding: 0 }}>
        {movements.map(m => {
          const key = m._type === 'egreso' ? `e-${m.id}` : `i-${m.id}`;
          const isSelected = selectedId === key;

          let icon, title, subtitle, amountStr, amountColor;

          if (m._type === 'egreso') {
            const cat = getCat(m.category);
            icon = <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>;
            title = m.description || m.category;
            subtitle = `${m.user} · ${new Date(m.date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;
            amountStr = `-${fmt(m.amount)}`;
            amountColor = C.rose;
          } else {
            const icat = incomeCategories.find(c => c.name === (m.incomeCategory || '')) || { icon: '💰', color: C.sage, bg: C.sageL };
            icon = <div style={{ width: 40, height: 40, borderRadius: 10, background: icat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icat.icon}</div>;
            title = m.description || m.incomeCategory || 'Ingreso';
            subtitle = `${m.user} · ${MONTHS_FULL[m.month]}`;
            amountStr = `+${fmt(m.amount)}`;
            amountColor = C.sage;
          }

          return (
            <li
              key={key}
              data-ui="list-item"
              data-component="movement-row"
              data-variant={m._type}
              data-state={isSelected ? 'selected' : 'default'}
              style={{ marginBottom: 8 }}
            >
              <div
                onClick={() => selectItem(m)}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && selectItem(m)}
                aria-expanded={isSelected}
                style={{
                  background: C.white,
                  borderRadius: isSelected ? '10px 10px 0 0' : 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: `0.5px solid ${isSelected ? C.coral : C.border}`,
                  cursor: 'pointer',
                  boxShadow: Sx.shadowSm,
                }}
              >
                {icon}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                  <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>{subtitle}</div>
                </div>
                <div style={{ fontWeight: 500, fontSize: 15, color: amountColor, flexShrink: 0 }}>{amountStr}</div>
              </div>

              <ExpandContainer expanded={isSelected}>
                {(isSelected || closingKey === key) && editForm && (
                  <div style={{
                    background: C.white,
                    borderRadius: '0 0 10px 10px',
                    padding: '14px 16px',
                    border: `0.5px solid ${C.coral}`,
                    borderTop: `0.5px solid ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray2 }}>
                        Editar {editForm._type === 'egreso' ? 'gasto' : 'ingreso'}
                      </div>
                      <button onClick={closeEditor} aria-label="Cerrar editor" style={{ ...Sx.xbtn, fontSize: 18 }}>✕</button>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Monto</div>
                      <input
                        type="text" inputMode="numeric"
                        value={editForm.amount}
                        onChange={e => setEditForm({ ...editForm, amount: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0 })}
                        style={{ ...Sx.inp }}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Descripción</div>
                      <input
                        type="text"
                        value={editForm.description || ''}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        style={{ ...Sx.inp }}
                      />
                    </div>

                    {editForm._type === 'egreso' ? (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Categoría</div>
                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ ...Sx.inp, cursor: 'pointer' }}>
                          {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Origen</div>
                        <select value={editForm.incomeCategory || ''} onChange={e => setEditForm({ ...editForm, incomeCategory: e.target.value })} style={{ ...Sx.inp, cursor: 'pointer' }}>
                          {incomeCategories.map(cat => <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>)}
                        </select>
                      </div>
                    )}

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Fecha</div>
                      <input
                        type="date"
                        value={editForm._type === 'egreso'
                          ? (editForm.date || '')
                          : `${editForm.year ?? new Date().getFullYear()}-${String((editForm.month ?? new Date().getMonth()) + 1).padStart(2, '0')}-01`
                        }
                        onChange={e => {
                          const d = new Date(e.target.value + 'T00:00:00');
                          if (editForm._type === 'egreso') {
                            setEditForm({ ...editForm, date: e.target.value });
                          } else {
                            setEditForm({ ...editForm, date: e.target.value, month: d.getMonth(), year: d.getFullYear() });
                          }
                        }}
                        style={{ ...Sx.inp }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleDelete} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: C.peachL, color: C.rose, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Eliminar
                      </button>
                      <button onClick={saveEdit} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: C.coral, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </ExpandContainer>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <div>
      {/* Header */}
      <div
        data-ui="summary-header"
        data-component="movements-summary"
        style={{ background: C.coral, borderRadius: 14, padding: '18px 16px 20px', marginBottom: 14 }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>Movimientos</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{MONTHS_FULL[selMonth]} · {shownCount} registros</div>
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', marginBottom: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Ingresos</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', letterSpacing: '-0.5px' }}>+{fmt(totInc)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Egresos</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', letterSpacing: '-0.5px' }}>-{fmt(totExp)}</div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div
        role="group"
        aria-label="Filtrar por usuario"
        style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}
      >
        <button onClick={() => switchTab('todos')} aria-pressed={userFilter === 'todos'} style={chipStyle(userFilter === 'todos', C.coral, C.coralL)}>
          Todos
        </button>
        {userNames.map(name => (
          <button key={name} onClick={() => switchTab(name)} aria-pressed={userFilter === name} style={chipStyle(userFilter === name, C.sage, C.sageL)}>
            {name}
          </button>
        ))}
      </div>

      {/* Sliding panels — one per user tab, always in DOM */}
      <HorizontalPager activeIndex={activeIndex}>
        <div>{renderList(allMovements)}</div>
        {userNames.map(name => (
          <div key={name}>{renderList(allMovements.filter(m => m.user === name))}</div>
        ))}
      </HorizontalPager>
    </div>
  );
}
