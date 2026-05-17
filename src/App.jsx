import { useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import LoginScreen   from './components/auth/LoginScreen';
import SplashScreen  from './components/SplashScreen';
import Header        from './components/layout/Header';
import { DuplaLogo } from './components/DuplaLogo';
import TabBar        from './components/layout/TabBar';
import HomeTab       from './components/tabs/HomeTab';
import MovimientosTab from './components/tabs/MovimientosTab';
import BudgetTab     from './components/tabs/BudgetTab';
import SavingsTab    from './components/tabs/SavingsTab';
import ChartsTab     from './components/tabs/ChartsTab';
import CardsTab      from './components/tabs/CardsTab';

import { useDuplaData } from './hooks/useDuplaData.js';
import { useTheme }     from './hooks/useTheme';
import { fmt, fmtK }   from './utils/formatters';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ── MÁS PANEL ─────────────────────────────────────────────────────────────────
// Standalone component so React can track its identity across renders.
function MasPanel({
  themeId, setThemeId, THEME_LIST,
  fontScale, setFontScale,
  setTab,
  billingDayOfMonth, saveBillingDay,
  userNames, saveUserNames,
  exchangeRate, saveExchangeRate,
  exportCSV, exportGSheets, exportToast,
  onLogout, userInfo,
  getSheetId, setManualSheetId,
}) {
  const [sheetInput, setSheetInput] = useState(() => getSheetId() || '');
  const { C, Sx } = useTheme();

  return (
    <div>
      {/* Subheader */}
      <div style={{ background: C.coral, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#fff', letterSpacing: '-0.3px' }}>Más</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Configuración y datos</div>
      </div>

      {/* ── VISUALES ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Visuales</div>
      <div style={{ ...Sx.fcard, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tema</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {THEME_LIST.map(t => {
            const active = t.id === themeId;
            return (
              <button key={t.id} onClick={() => setThemeId(t.id)} title={t.name}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
                  border: `0.5px solid ${active ? C.coral : C.border}`,
                  background: active ? C.coralL : C.gray6, cursor: 'pointer' }}>
                <span style={{ fontSize: 22 }}>{t.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: active ? C.coral : C.gray2 }}>{t.name}</span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: C.gray3, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tamaño de texto</div>
        <div style={{ display: 'flex', background: C.gray6, borderRadius: 10, padding: 3, gap: 3 }}>
          {[{ label: 'Normal', value: 1 }, { label: 'Grande', value: 1.2 }].map(opt => {
            const active = Math.abs(fontScale - opt.value) < 0.05;
            return (
              <button key={opt.value} onClick={() => setFontScale(opt.value)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                  fontSize: opt.value === 1 ? 13 : 15, fontWeight: 500,
                  background: active ? C.white : 'transparent',
                  color: active ? C.coral : C.gray3,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', cursor: 'pointer' }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VISTAS ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Vistas</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'charts', icon: '◉', label: 'Gráficos',  desc: 'Distribución y tendencias', color: C.sky,      bg: C.skyL },
          { id: 'cards',  icon: '💳', label: 'Tarjetas',  desc: 'Movimientos y cuotas',      color: C.lavender, bg: C.lavL },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{ background: item.bg, borderRadius: 12, padding: '14px', border: `0.5px solid ${item.color}44`, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: C.gray3, marginTop: 2 }}>{item.desc}</div>
          </button>
        ))}
      </div>

      {/* ── CONFIGURACIÓN ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Configuración</div>

      <div style={{ ...Sx.fcard, marginBottom: 10 }}>
        <div style={Sx.ft}>Ciclo de facturación</div>
        <div style={{ fontSize: 12, color: C.gray3, marginBottom: 10 }}>Día del mes que comienza el ciclo</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="text" inputMode="numeric" value={billingDayOfMonth}
            onChange={e => saveBillingDay(Math.max(1, Math.min(31, parseInt(e.target.value.replace(/\D/g, ''), 10) || 27)))}
            style={{ ...Sx.inp, fontSize: 14, textAlign: 'center' }} />
          <div style={{ ...Sx.inp, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray6, color: C.gray2 }}>
            día {billingDayOfMonth}
          </div>
        </div>
      </div>

      <div style={{ ...Sx.fcard, marginBottom: 10 }}>
        <div style={Sx.ft}>Nombres de usuarios</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {userNames.map((name, idx) => (
            <div key={idx}>
              <div style={{ fontSize: 11, color: C.gray3, marginBottom: 4, fontWeight: 500 }}>Usuario {idx + 1}</div>
              <input type="text" value={name}
                onChange={e => saveUserNames([...userNames.slice(0, idx), e.target.value, ...userNames.slice(idx + 1)])}
                style={{ ...Sx.inp }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...Sx.fcard, marginBottom: 20 }}>
        <div style={Sx.ft}>Tasa de cambio USD/ARS</div>
        <div style={{ fontSize: 12, color: C.gray3, marginBottom: 10 }}>Usa esto para calcular presupuestos anuales en dólares</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input type="text" inputMode="numeric" value={exchangeRate}
            onChange={e => saveExchangeRate(e.target.value.replace(/\D/g, '') || '1100')}
            style={{ ...Sx.inp, fontSize: 14, textAlign: 'center' }} />
          <div style={{ ...Sx.inp, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray6, color: C.gray2 }}>
            1 USD = {exchangeRate} ARS
          </div>
        </div>
      </div>

      {/* ── DATOS ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Datos</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
        {[
          { onClick: exportCSV,     icon: '⬇',  title: 'Exportar a CSV',            sub: 'Descargar todos los datos' },
          { onClick: exportGSheets, icon: '📋',  title: 'Copiar para Google Sheets', sub: 'Pegá directo en una hoja nueva' },
        ].map(item => (
          <button key={item.title} onClick={item.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
              background: C.white, borderRadius: 12, border: `0.5px solid ${C.border}`,
              cursor: 'pointer', textAlign: 'left', width: '100%' }}>
            <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>{item.title}</div>
              {item.sub && <div style={{ fontSize: 11, color: C.gray3, marginTop: 1 }}>{item.sub}</div>}
            </div>
            <span style={{ marginLeft: 'auto', color: C.gray4, fontSize: 14 }}>›</span>
          </button>
        ))}
        {exportToast && (
          <div style={{ background: C.sageL, color: C.sage, borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 500, textAlign: 'center', border: `0.5px solid ${C.sage}44` }}>
            {exportToast}
          </div>
        )}
      </div>

      {/* ── VINCULAR SHEET ── */}
      <div style={{ fontSize: 13, fontWeight: 500, color: C.gray3, marginBottom: 10, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Google Sheet</div>
      <div style={{ ...Sx.fcard, marginBottom: 20 }}>
        <div style={Sx.ft}>Vincular hoja de cálculo</div>
        <div style={{ fontSize: 12, color: C.gray3, marginBottom: 10, lineHeight: 1.5 }}>
          Pegá el link de compartir de Google Sheets. Dejalo vacío para usar tu propio Sheet.
        </div>
        <input
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={sheetInput}
          onChange={e => setSheetInput(e.target.value)}
          style={{ ...Sx.inp, marginBottom: 6, fontSize: 12 }}
        />
        {sheetInput && (() => {
          const match = sheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
          return match
            ? <div style={{ fontSize: 11, color: C.sage, marginBottom: 10 }}>ID detectado: {match[1]}</div>
            : <div style={{ fontSize: 11, color: C.rose, marginBottom: 10 }}>URL no reconocida</div>;
        })()}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const match = sheetInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
              const id = match ? match[1] : sheetInput.trim();
              setManualSheetId(id);
              window.location.reload();
            }}
            style={{ ...Sx.btn, flex: 1, fontSize: 13 }}>
            Aplicar
          </button>
          <button
            onClick={() => { setSheetInput(''); setManualSheetId(''); window.location.reload(); }}
            style={{ ...Sx.btn, flex: 1, fontSize: 13, background: C.gray4 }}>
            Resetear
          </button>
        </div>
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
          background: C.white, borderRadius: 12, border: `0.5px solid ${C.border}`,
          cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>↩</span>
        <div>
          <div style={{ fontWeight: 500, fontSize: 14, color: C.gray1 }}>Cerrar sesión</div>
          {userInfo?.email && <div style={{ fontSize: 11, color: C.gray3, marginTop: 1 }}>{userInfo.email}</div>}
        </div>
        <span style={{ marginLeft: 'auto', color: C.gray4, fontSize: 14 }}>›</span>
      </button>
    </div>
  );
}

// ── INNER APP (after auth) ─────────────────────────────────────────────────────
function DuplaApp({ token, userInfo, onLogout, showSplash }) {
  const { C, themeId, setThemeId, THEME_LIST, fontScale, setFontScale } = useTheme();

  // UI-only navigation state — not part of domain data
  const [tab, setTab] = useState('home');

  const data = useDuplaData({ token, userId: userInfo?.sub, onLogout });

  // getCat: display helper that merges domain data with theme colors for the fallback
  const getCat = useCallback(
    name => data.categories.find(c => c.name === name) || { icon: '📦', color: C.gray3, bg: C.gray6, name },
    [data.categories, C]
  );

  if (data.loading || showSplash) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, gap: 0 }}>
      <DuplaLogo size={60} />
      <div style={{ marginTop: 16, fontSize: 28, fontWeight: 500, color: C.gray1, letterSpacing: '-0.6px' }}>dupla</div>
      {data.loading && <div style={{ marginTop: 6, fontSize: 13, color: C.gray3 }}>Conectando…</div>}
      <div style={{ marginTop: 44, display: 'flex', gap: 7 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.coral, animation: `dupla-pulse 1.1s ${i * 0.18}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  );

  // Compose the shared prop bag for all tabs.
  // This surface is intentionally stable — tabs depend on it.
  const shared = { ...data, getCat, fmt, fmtK, setTab };

  return (
    <div style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", background: C.bg || '#FAFAF9', minHeight: '100vh', maxWidth: 520, margin: '0 auto' }}>
      <Header
        selMonth={data.selMonth} selYear={data.selYear}
        setSelMonth={data.setSelMonth} setSelYear={data.setSelYear}
        syncing={data.syncing} lastSync={data.lastSync}
        alerts={data.alerts} userInfo={userInfo}
        onLogout={onLogout} setTab={setTab}
      />
      {data.syncError && (
        <div style={{ margin: '12px 16px 0', padding: '10px 12px', borderRadius: 10, background: C.roseL, color: C.rose, border: `0.5px solid ${C.rose}44`, fontSize: 12, lineHeight: 1.4 }}>
          {data.syncError}
        </div>
      )}
      <div style={{ padding: '16px 16px 0', paddingBottom: 96 }}>
        <div style={{ zoom: fontScale }}>
          {tab === 'home'      && <HomeTab       {...shared} />}
          {tab === 'movements' && <MovimientosTab {...shared} />}
          {tab === 'budget'    && <BudgetTab      {...shared} />}
          {tab === 'savings'   && <SavingsTab     {...shared} />}
          {tab === 'charts'    && <ChartsTab      {...shared} />}
          {tab === 'cards'     && <CardsTab       {...shared} />}
          {tab === 'mas'       && (
            <MasPanel
              themeId={themeId} setThemeId={setThemeId} THEME_LIST={THEME_LIST}
              fontScale={fontScale} setFontScale={setFontScale}
              setTab={setTab}
              billingDayOfMonth={data.billingDayOfMonth} saveBillingDay={data.saveBillingDay}
              userNames={data.userNames} saveUserNames={data.saveUserNames}
              exchangeRate={data.exchangeRate} saveExchangeRate={data.saveExchangeRate}
              exportCSV={data.exportCSV} exportGSheets={data.exportGSheets} exportToast={data.exportToast}
              onLogout={onLogout} userInfo={userInfo}
              getSheetId={data.getSheetId} setManualSheetId={data.setManualSheetId}
            />
          )}
        </div>
      </div>
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [token,      setToken]      = useState(() => localStorage.getItem('dupla_token') || null);
  const [userInfo,   setUserInfo]   = useState(() => { try { return JSON.parse(localStorage.getItem('dupla_user') || 'null'); } catch { return null; } });
  const [showSplash, setShowSplash] = useState(true);

  const handleLogin = useCallback(async (accessToken) => {
    setToken(accessToken);
    localStorage.setItem('dupla_token', accessToken);
    try {
      const res  = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
      const info = await res.json();
      setUserInfo(info);
      localStorage.setItem('dupla_user', JSON.stringify(info));
    } catch (error) {
      console.warn('[Dupla] Could not load Google profile', error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    const sub = userInfo?.sub;
    setToken(null); setUserInfo(null);
    localStorage.removeItem('dupla_token');
    localStorage.removeItem('dupla_user');
    localStorage.removeItem('dupla_sheet_id'); // legacy key
    if (sub) localStorage.removeItem(`dupla_sheet_id_${sub}`);
  }, [userInfo]);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID || ''}>
      {!token
        ? <LoginScreen onLogin={handleLogin} />
        : <DuplaApp token={token} userInfo={userInfo} onLogout={handleLogout} showSplash={showSplash} />
      }
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </GoogleOAuthProvider>
  );
}
