export function contrastFg(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#222222';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45 ? '#222222' : '#FFFFFF';
}

export function makeSx(C) {
  return {
    shadow: '0 4px 12px rgba(0,0,0,0.06)',
    shadowSm: '0 1px 2px rgba(0,0,0,0.04)',
    card: { background: C.white, borderRadius: 14, padding: '16px', marginBottom: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: `0.5px solid ${C.border}` },
    ct: { fontSize: 17, fontWeight: 500, color: C.gray1, marginBottom: 12, letterSpacing: '-0.3px' },
    ph: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    pt: { fontSize: 22, fontWeight: 500, color: C.gray1, letterSpacing: '-0.5px' },
    ps: { fontSize: 13, color: C.gray3, marginTop: 2 },
    btn: { background: C.coral, color: contrastFg(C.coral), border: 'none', borderRadius: 10,
      padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
    btnSec: { background: C.gray6, color: C.gray1, border: `0.5px solid ${C.border}`, borderRadius: 10,
      padding: '10px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
    btnGhost: { background: 'none', color: C.coral, border: 'none', borderRadius: 10,
      padding: '8px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    inp: { padding: '11px 14px', border: `0.5px solid ${C.border}`, borderRadius: 10,
      fontSize: 14, outline: 'none', color: C.gray1, background: C.white,
      width: '100%', boxSizing: 'border-box', fontWeight: 400 },
    fcard: { background: C.white, borderRadius: 14, padding: 16, marginBottom: 16,
      border: `0.5px solid ${C.coral}`, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
    ft: { fontSize: 15, fontWeight: 500, color: C.gray1, marginBottom: 12 },
    fgrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 },
    erow: { background: C.white, borderRadius: 14, padding: '14px 16px', marginBottom: 8,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)', border: `0.5px solid ${C.border}` },
    txrow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: `0.5px solid ${C.gray5}` },
    dot: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0 },
    xbtn: { width: 26, height: 26, borderRadius: '50%', border: `0.5px solid ${C.border}`,
      background: C.white, cursor: 'pointer', fontSize: 16, color: C.gray3,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    empty: { textAlign: 'center', padding: '40px 20px', color: C.gray3, fontSize: 15,
      background: C.white, borderRadius: 14, marginBottom: 12,
      border: `0.5px solid ${C.border}` },
    chipRow: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    pill: (color, bg) => ({ fontSize: 11, background: bg, color: contrastFg(bg),
      padding: '2px 8px', borderRadius: 6, fontWeight: 500,
      border: `0.5px solid ${color}44` }),
  };
}
