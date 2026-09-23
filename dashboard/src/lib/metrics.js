// Small pure-function helpers shared across screens — kept out of components
// so the "what does this number mean" logic lives in one place.

export function exportSharePct(totals) {
  if (!totals.generationKwh) return 0;
  return Math.round((totals.gridExportKwh / totals.generationKwh) * 100);
}

export function selfConsumptionPct(totals) {
  if (!totals.generationKwh) return 0;
  return Math.round((totals.selfUsedKwh / totals.generationKwh) * 100);
}

export function periodLabel(daily) {
  if (!daily.length) return '—';
  return daily.length === 1 ? formatDate(daily[0].date) : `${formatDate(daily[0].date)} to ${formatDate(daily[daily.length - 1].date)}`;
}

export function formatDate(dateStr) {
  // dateStr is "YYYY-MM-DD"
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
}
