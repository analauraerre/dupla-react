// Pure selector/aggregation functions — no React dependencies.
// These replace the inline useMemo calculations that lived in App.jsx.

import { MONTHS } from '../../utils/constants.js';

export function computeExpByCategory(filtExp) {
  const map = {};
  filtExp.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
  return map;
}

export function computeIncByCategory(filtInc) {
  const map = {};
  filtInc.forEach(i => {
    const k = i.incomeCategory || 'Sin categoría';
    map[k] = (map[k] || 0) + i.amount;
  });
  return map;
}

export function computeExpByUser(filtExp) {
  const map = {};
  filtExp.forEach(e => { map[e.user] = (map[e.user] || 0) + e.amount; });
  return map;
}

export function computeAnnualData(expenses, incomes, year) {
  return Array.from({ length: 12 }, (_, mo) => ({
    name: MONTHS[mo],
    mo,
    Egresos: expenses
      .filter(e => { const d = new Date(e.date + 'T00:00:00'); return d.getMonth() === mo && d.getFullYear() === year; })
      .reduce((s, e) => s + e.amount, 0),
    Ingresos: incomes
      .filter(i => i.month === mo && i.year === year)
      .reduce((s, i) => s + i.amount, 0),
  }));
}

export function computeAlerts(categories, expByCat, effBudgets) {
  return categories
    .filter(c => {
      const spent = expByCat[c.name] || 0;
      const budget = effBudgets[c.name] || 0;
      return budget > 0 && spent / budget >= 0.8;
    })
    .map(c => ({
      ...c,
      spent: expByCat[c.name] || 0,
      budget: effBudgets[c.name],
      pct: Math.round(((expByCat[c.name] || 0) / effBudgets[c.name]) * 100),
    }));
}

export function computePieData(categories, expByCat) {
  return categories
    .filter(c => expByCat[c.name] > 0)
    .map(c => ({ name: c.name, value: expByCat[c.name], color: c.color, icon: c.icon }))
    .sort((a, b) => b.value - a.value);
}

export function computeBarData(categories, expByCat, effBudgets) {
  return categories
    .filter(c => expByCat[c.name] > 0 || effBudgets[c.name] > 0)
    .map(c => ({
      name: c.name.substring(0, 7),
      Gastado: expByCat[c.name] || 0,
      Presupuesto: effBudgets[c.name] || 0,
    }));
}

/** Linear projection of month-end spending based on daily rate so far. */
export function computeProjected(totExp, dayNow, daysInMonth) {
  return dayNow > 0 ? Math.round((totExp / dayNow) * daysInMonth) : 0;
}
