import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { DuplaLogo } from './DuplaLogo';

export default function SplashScreen({ onDone }) {
  const { C } = useTheme();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1300);
    const t2 = setTimeout(() => onDone(), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: C.bg,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.4s ease',
      gap: 0,
    }}>
      {/* Logo */}
      <div style={{ animation: 'dupla-rise 0.55s cubic-bezier(0.34,1.4,0.64,1) forwards', opacity: 0 }}>
        <DuplaLogo size={68} />
      </div>

      {/* Wordmark */}
      <div style={{
        marginTop: 18,
        fontFamily: "'Inter', sans-serif",
        fontSize: 30, fontWeight: 500, color: C.gray1, letterSpacing: '-0.8px',
        animation: 'dupla-rise 0.55s 0.12s cubic-bezier(0.34,1.4,0.64,1) forwards',
        opacity: 0,
      }}>
        dupla
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8, fontSize: 14, color: C.gray3, letterSpacing: '0.1px',
        animation: 'dupla-rise 0.5s 0.24s ease forwards',
        opacity: 0,
      }}>
        Finanzas en pareja
      </div>

      {/* Loading dots */}
      <div style={{ marginTop: 52, display: 'flex', gap: 7 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: C.coral,
            animation: `dupla-pulse 1.1s ${i * 0.18}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
