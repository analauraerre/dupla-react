import { useState } from 'react';
import { MONTHS_FULL } from '../../utils/constants';
import { today } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';
import { DuplaLogo } from '../DuplaLogo';

export default function Header({ selMonth, selYear, setSelMonth, setSelYear, syncing, lastSync, userInfo, onLogout, setTab }) {
  const { C } = useTheme();
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div style={{
      background: C.white,
      borderBottom: `0.5px solid ${C.border}`,
      padding: '12px 18px',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Logo — clickeable */}
        <button onClick={() => setTab('home')}
          style={{ flex: '0 0 auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DuplaLogo size={26} />
        </button>

        {/* Month navigator */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button
            onClick={() => { if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); } else setSelMonth(m => m - 1); }}
            style={{ width: 30, height: 30, borderRadius: '50%', border: `0.5px solid ${C.border}`, background: C.gray6, cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray2 }}
          >‹</button>

          <span style={{ fontSize: 14, fontWeight: 500, color: C.gray1, minWidth: 120, textAlign: 'center', letterSpacing: '-0.2px' }}>
            {MONTHS_FULL[selMonth]} {selYear}
          </span>

          <button
            onClick={() => { if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); } else setSelMonth(m => m + 1); }}
            style={{ width: 30, height: 30, borderRadius: '50%', border: `0.5px solid ${C.border}`, background: C.gray6, cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gray2 }}
          >›</button>

          {(selMonth !== today.getMonth() || selYear !== today.getFullYear()) && (
            <button
              onClick={() => { setSelMonth(today.getMonth()); setSelYear(today.getFullYear()); }}
              style={{ padding: '4px 10px', borderRadius: 8, border: `0.5px solid ${C.coral}`, background: C.coralL, color: C.coral, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >Hoy</button>
          )}
        </div>

        {/* Right: sync dot + avatar */}
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          {/* Sync indicator */}
          {syncing ? (
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.gray5}`, borderTopColor: C.coral, animation: 'dupla-spin 0.7s linear infinite' }} />
          ) : (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: lastSync ? C.sage : C.gray4, transition: 'background 0.3s' }} title={lastSync ? 'Sincronizado' : 'Sin datos'} />
          )}

          {/* Avatar — abre panel */}
          {userInfo?.picture ? (
            <img
              src={userInfo.picture} alt="avatar"
              onClick={() => setShowPanel(v => !v)}
              style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', border: `0.5px solid ${C.border}` }}
            />
          ) : (
            <button
              onClick={() => setShowPanel(v => !v)}
              style={{ width: 30, height: 30, borderRadius: '50%', border: `0.5px solid ${C.border}`, background: C.gray6, cursor: 'pointer', fontSize: 13, color: C.gray3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >👤</button>
          )}

          {/* Panel de usuario */}
          {showPanel && (
            <>
              {/* Backdrop */}
              <div onClick={() => setShowPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />

              {/* Dropdown */}
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: C.white, borderRadius: 12,
                border: `0.5px solid ${C.border}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                padding: '14px', zIndex: 31,
                minWidth: 220,
                animation: 'dp-expand-in 0.18s cubic-bezier(0.16,1,0.3,1) forwards',
              }}>
                {/* Info usuario */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: `0.5px solid ${C.border}` }}>
                  {userInfo?.picture ? (
                    <img src={userInfo.picture} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', border: `0.5px solid ${C.border}` }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.coralL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.gray1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userInfo?.name || 'Usuario'}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userInfo?.email || ''}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <button
                  onClick={() => { setShowPanel(false); setTab('mas'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', marginBottom: 4, textAlign: 'left' }}
                >
                  <span style={{ fontSize: 15 }}>⚙️</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.gray1 }}>Configuración</span>
                </button>

                <button
                  onClick={() => { setShowPanel(false); onLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', background: C.roseL, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 15 }}>↩</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.rose }}>Cerrar sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
