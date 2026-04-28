export const bKey = (y,m,cat) => `${y}-${m}_${cat}`;

export function effectiveBudget(cat, month, year, base, overrides) {
  for (let y = year, m = month;;) {
    if (overrides[bKey(y,m,cat)] !== undefined) return overrides[bKey(y,m,cat)];
    if (m === 0) { m = 11; y--; } else m--;
    if (y < 2020) break;
  }
  return base[cat] || 0;
}
