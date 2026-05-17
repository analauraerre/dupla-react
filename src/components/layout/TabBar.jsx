import { useTheme } from '../../hooks/useTheme';

const TABS = [
  { id: 'home',      label: 'Inicio',   icon: '✦' },
  { id: 'movements', label: 'Movim.',   icon: '↕' },
  { id: 'budget',    label: 'Presup.',  icon: '◎' },
  { id: 'savings',   label: 'Ahorros',  icon: '◆' },
  { id: 'mas',       label: 'Más',      icon: '⚙' },
];

// 'charts' and 'cards' are sub-tabs of 'mas'
const MAS_GROUP = ['mas', 'charts', 'cards'];

export default function TabBar({ tab, setTab }) {
  const { C } = useTheme();

  return (
    <nav
      data-ui="bottom-nav"
      data-component="tab-bar"
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        background: C.white,
        borderTop: `1px solid ${C.border}`,
        padding: '0 2px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {TABS.map(t => {
        const active = t.id === 'mas' ? MAS_GROUP.includes(tab) : tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-ui="tab-item"
            data-component={`tab-${t.id}`}
            data-state={active ? 'active' : 'inactive'}
            data-testid={`tab-${t.id}`}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              padding: '10px 2px 8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 9.5,
              color: active ? C.coral : C.gray4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontWeight: active ? 700 : 500,
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: C.coral,
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <span style={{ fontSize: 15 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
