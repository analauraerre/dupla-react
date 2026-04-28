export default function AreaChartSVG({ data, height = 130 }) {
  if (!data || !data.length) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.Egresos || 0, d.Ingresos || 0)), 1);
  const W = 300, H = height;
  const pad = { l: 4, r: 4, t: 6, b: 20 };
  const chartW = W - pad.l - pad.r, chartH = H - pad.t - pad.b;
  const px = i => pad.l + i * (chartW / (data.length - 1 || 1));
  const py = v => pad.t + chartH * (1 - v / maxVal);
  const areaPath = (key) => {
    if (data.length < 2) return '';
    const pts = data.map((d, i) => `${px(i)},${py(d[key] || 0)}`).join(' L');
    const last = data.length - 1;
    return `M${px(0)},${py(data[0][key] || 0)} L${pts} L${px(last)},${pad.t + chartH} L${px(0)},${pad.t + chartH} Z`;
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BA08A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5BA08A" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF7867" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF7867" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath('Ingresos')} fill="url(#gI)" />
      <path d={areaPath('Egresos')} fill="url(#gE)" />
      {data.length >= 2 && <polyline points={data.map((d, i) => `${px(i)},${py(d.Ingresos || 0)}`).join(' ')} fill="none" stroke="#5BA08A" strokeWidth={2} />}
      {data.length >= 2 && <polyline points={data.map((d, i) => `${px(i)},${py(d.Egresos || 0)}`).join(' ')} fill="none" stroke="#FF7867" strokeWidth={2} />}
      {data.map((d, i) => <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="#B0B0B0">{d.name}</text>)}
    </svg>
  );
}
