import { C, MONTHS_FULL } from '../../utils/constants';
import { today } from '../../utils/formatters';

export default function Header({ selMonth, selYear, setSelMonth, setSelYear, syncing, lastSync, alerts, userInfo, onLogout }) {
  return (
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '14px 20px 10px', position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 900, color: C.coral, letterSpacing: '-0.5px' }}>👫 Dupla</div>
          <div style={{ fontSize: 11, color: C.gray3 }}>
            {userInfo?.name || userInfo?.email || 'Mi cuenta'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {alerts.length > 0 && (
            <div style={{ background: C.coralL, color: C.coral, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
              {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}
            </div>
          )}
          <div
            style={{ width: 8, height: 8, borderRadius: '50%', background: syncing ? C.gold : lastSync ? C.sage : C.gray4 }}
            title={syncing ? 'Guardando...' : lastSync ? 'Sincronizado' : 'Sin datos'}
          />
          {userInfo?.picture
            ? <img src={userInfo.picture} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' }} onClick={onLogout} title="Cerrar sesión" />
            : <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, color: C.gray3, cursor: 'pointer' }}>Salir</button>
          }
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <button
          style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); } else setSelMonth(m => m - 1); }}
        >‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.gray1, minWidth: 130, textAlign: 'center' }}>
          {MONTHS_FULL[selMonth]} {selYear}
        </span>
        <button
          style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); } else setSelMonth(m => m + 1); }}
        >›</button>
        {(selMonth !== today.getMonth() || selYear !== today.getFullYear()) && (
          <button
            onClick={() => { setSelMonth(today.getMonth()); setSelYear(today.getFullYear()); }}
            style={{ padding: '3px 10px', borderRadius: 10, border: `1px solid ${C.coral}`, background: C.coralL, color: C.coral, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >Hoy</button>
        )}
      </div>
    </div>
  );
}
