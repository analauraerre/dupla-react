export default function LineChartSVG({ data, height = 200 }) {
  if (!data || !data.length) return null;
  const vals = [...data.map(d => d.Egresos || 0), ...data.map(d => d.Ingresos || 0)];
  const maxVal = Math.max(...vals, 1);
  const pad = { l: 36, r: 8, t: 10, b: 24 };
  const W = 300, H = height;
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b;
  const px = i => pad.l + i * (chartW / (data.length - 1));
  const py = v => pad.t + chartH * (1 - v / maxVal);
  const line = (key, color) => {
    const pts = data.map((d, i) => `${px(i)},${py(d[key] || 0)}`).join(' ');
    return <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />;
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {[0, 0.5, 1].map((t, i) => {
        const y = pad.t + chartH * (1 - t);
        return <g key={i}>
          <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E8E8E8" strokeWidth={1} />
          <text x={pad.l - 4} y={y + 4} textAnchor="end" fontSize={8} fill="#B0B0B0">
            {Math.round(maxVal * t) >= 1000 ? `${Math.round(maxVal * t / 1000)}k` : Math.round(maxVal * t)}
          </text>
        </g>;
      })}
      {line('Ingresos', '#5BA08A')}
      {line('Egresos', '#FF7867')}
      {data.map((d, i) => <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize={8} fill="#B0B0B0">{d.name}</text>)}
      <g><rect x={pad.l} y={H - 18} width={8} height={8} fill="#5BA08A" rx={2} /><text x={pad.l + 10} y={H - 11} fontSize={9} fill="#767676">Ingresos</text></g>
      <g><rect x={pad.l + 60} y={H - 18} width={8} height={8} fill="#FF7867" rx={2} /><text x={pad.l + 72} y={H - 11} fontSize={9} fill="#767676">Egresos</text></g>
    </svg>
  );
}
