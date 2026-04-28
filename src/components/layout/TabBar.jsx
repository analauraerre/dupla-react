import { C } from '../../utils/constants';

const TABS = [
  { id: 'home',     label: 'Inicio',   icon: '✦' },
  { id: 'income',   label: 'Ingresos', icon: '↑' },
  { id: 'expenses', label: 'Egresos',  icon: '↓' },
  { id: 'budget',   label: 'Presup.',  icon: '◎' },
  { id: 'savings',  label: 'Ahorros',  icon: '◆' },
];

export default function TabBar({ tab, setTab, showMore, setShowMore }) {
  return (
    <div style={{ display: 'flex', background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 2px' }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => { setTab(t.id); setShowMore(false); }}
          style={{
            flex: 1, minWidth: 48, padding: '9px 2px 7px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 9.5, color: tab === t.id && !showMore ? C.coral : C.gray3,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            borderBottom: `2px solid ${tab === t.id && !showMore ? C.coral : 'transparent'}`,
            fontWeight: tab === t.id && !showMore ? 700 : 500, whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 13 }}>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
      <button
        onClick={() => setShowMore(v => !v)}
        style={{
          flex: 1, minWidth: 44, padding: '9px 2px 7px', border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 9.5, color: showMore ? C.coral : C.gray3,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          borderBottom: `2px solid ${showMore ? C.coral : 'transparent'}`,
          fontWeight: showMore ? 700 : 500,
        }}
      >
        <span style={{ fontSize: 13 }}>⚙</span><span>Más</span>
      </button>
    </div>
  );
}
