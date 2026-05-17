// Pure installment function — no React dependencies.
// Single source of truth for cuota computation: no persisted expansion needed.
export function cuotaDelMes(gasto, mes, anio) {
  const cuotas = parseInt(gasto.cuotas) || 1;
  const monto  = parseFloat(gasto.monto) || 0;

  if (cuotas === 1) {
    const d = new Date(gasto.fecha + 'T00:00:00');
    return d.getMonth() === mes && d.getFullYear() === anio ? monto : 0;
  }

  const start    = new Date(gasto.fecha + 'T00:00:00');
  const startIdx = start.getFullYear() * 12 + start.getMonth();
  const targetIdx = anio * 12 + mes;
  const n = targetIdx - startIdx;

  return (n >= 0 && n < cuotas) ? monto / cuotas : 0;
}
