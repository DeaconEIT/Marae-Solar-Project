// Turns the daily[] rows into a downloadable CSV — for analysts who want to
// pull the numbers into their own spreadsheet/model rather than read charts.

const COLUMNS = [
  ['date', 'Date'],
  ['generationKwh', 'Generation (kWh)'],
  ['consumptionKwh', 'Consumption (kWh)'],
  ['gridExportKwh', 'Grid export (kWh)'],
  ['gridImportKwh', 'Grid import (kWh)'],
  ['selfUsedKwh', 'Solar used on-site (kWh)'],
  ['selfSuffPct', 'Self-sufficiency (%)'],
];

export function dailyToCsv(daily) {
  const header = COLUMNS.map(([, label]) => label).join(',');
  const rows = daily.map((row) => COLUMNS.map(([key]) => row[key]).join(','));
  return [header, ...rows].join('\n');
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
