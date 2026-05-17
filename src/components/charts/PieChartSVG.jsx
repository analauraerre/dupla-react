export default function PieChartSVG({ data, size = 200, strokeColor = '#ffffff' }) {
  if (!data || !data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.22;
  const initialAngle = -Math.PI / 2;
  const slices = data.reduce((acc, d) => {
    const angle = acc.nextAngle;
    const sweep = (d.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const endAngle = angle + sweep;
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + inner * Math.cos(angle), yi1 = cy + inner * Math.sin(angle);
    const xi2 = cx + inner * Math.cos(endAngle), yi2 = cy + inner * Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    acc.items.push({ ...d, path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${inner},${inner} 0 ${large},0 ${xi1},${yi1} Z` });
    acc.nextAngle = endAngle;
    return acc;
  }, { items: [], nextAngle: initialAngle }).items;
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke={strokeColor} strokeWidth={2} />)}
    </svg>
  );
}
