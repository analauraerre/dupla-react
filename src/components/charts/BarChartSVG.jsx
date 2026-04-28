export default function BarChartSVG({ data, height = 220 }) {
  if (!data || !data.length) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.Gastado || 0, d.Presupuesto || 0)), 1);
  const pad = { l: 40, r: 8, t: 10, b: 28 };
  const W = 300, H = height;
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b;
  const bw = Math.floor(chartW / data.length * 0.35);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.t + chartH * (1 - t);
        const val = Math.round(maxVal * t);
        return <g key={i}>
          <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E8E8E8" strokeWidth={1} />
          <text x={pad.l - 4} y={y + 4} textAnchor="end" fontSize={8} fill="#B0B0B0">{val >= 1000 ? `${Math.round(val / 1000)}k` : val}</text>
        </g>;
      })}
      {data.map((d, i) => {
        const slotW = chartW / data.length;
        const cx = pad.l + slotW * i + slotW / 2;
        const hG = Math.max(((d.Gastado || 0) / maxVal) * chartH, 0);
        const hP = Math.max(((d.Presupuesto || 0) / maxVal) * chartH, 0);
        return <g key={i}>
          <rect x={cx - bw - 1} y={pad.t + chartH - hP} width={bw} height={hP} fill="#E8E8E8" rx={3} />
          <rect x={cx + 1} y={pad.t + chartH - hG} width={bw} height={hG} fill="#FF7867" rx={3} />
          <text x={cx} y={H - 8} textAnchor="middle" fontSize={8} fill="#B0B0B0">{d.name}</text>
        </g>;
      })}
    </svg>
  );
}
