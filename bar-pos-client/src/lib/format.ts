export function formatMoney(value: number): string {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  if (Number.isInteger(safe)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(safe);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}
