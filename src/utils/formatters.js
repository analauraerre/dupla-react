import { CURRENCIES } from './constants';

export const fmt  = n => "$" + Number(n||0).toLocaleString("es-AR",{minimumFractionDigits:0});
export const fmtK = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${Math.round(n/1000)}k`:fmt(n);
export const fmtGoal = (n, cur) => {
  const c = CURRENCIES.find(x => x.id === (cur||"ARS")) || CURRENCIES[0];
  return `${c.symbol} ${Number(n||0).toLocaleString("es-AR",{minimumFractionDigits:0})}`;
};

export const today    = new Date();
export const todayStr = today.toISOString().split("T")[0];
