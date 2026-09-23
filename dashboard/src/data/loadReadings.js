// Loads the project's "standard format" — muriwai_standard_30min.csv — and
// turns it into daily rollups + an hourly profile for the dashboard.
//
// This file is deliberately site-agnostic: it reads the four project
// metrics (generation_kwh, consumption_kwh, grid_import_kwh, grid_export_kwh)
// keyed by site + timestamp, exactly the shape every supplier's importer
// produces (see docs/muriwai-data-schema.pdf and scripts/build_standard_csv.py).
// When a second marae's data lands in the same CSV, this code doesn't change.

const CSV_URL = './muriwai_standard_30min.csv';

function parseCsv(text) {
  // The exporter writes \r\n line endings; split on both so the last column
  // doesn't pick up a trailing \r.
  const [headerLine, ...lines] = text.trim().split(/\r\n|\n/);
  const headers = headerLine.split(',');
  return lines.filter(Boolean).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Rolls 30-min rows up into one row per calendar day (NZ local date, which
// the +12:00 offset in each timestamp already reflects).
function rollUpDaily(rows) {
  const byDate = new Map();
  for (const row of rows) {
    const date = row.timestamp.slice(0, 10); // YYYY-MM-DD, local per the +12:00 offset
    const bucket = byDate.get(date) ?? {
      date,
      generationKwh: 0,
      consumptionKwh: 0,
      gridImportKwh: 0,
      gridExportKwh: 0,
    };
    bucket.generationKwh += toNum(row.generation_kwh);
    bucket.consumptionKwh += toNum(row.consumption_kwh);
    bucket.gridImportKwh += toNum(row.grid_import_kwh);
    bucket.gridExportKwh += toNum(row.grid_export_kwh);
    byDate.set(date, bucket);
  }
  return [...byDate.values()]
    .map((d) => ({
      date: d.date,
      generationKwh: round(d.generationKwh),
      consumptionKwh: round(d.consumptionKwh),
      gridImportKwh: round(d.gridImportKwh),
      gridExportKwh: round(d.gridExportKwh),
      selfUsedKwh: round(Math.max(0, d.generationKwh - d.gridExportKwh)),
      selfSuffPct: d.consumptionKwh > 0 ? Math.round((1 - d.gridImportKwh / d.consumptionKwh) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Hourly generation/load profile for the most recent day that has close to
// full-day coverage (used to show WHEN export happens, not a daily average).
function hourlyProfile(rows) {
  const byDate = new Map();
  for (const row of rows) {
    const date = row.timestamp.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(row);
  }
  const fullDayDates = [...byDate.entries()]
    .filter(([, dayRows]) => dayRows.length >= 40) // 48 = a complete day at 30-min steps
    .map(([date]) => date)
    .sort();
  const targetDate = fullDayDates[fullDayDates.length - 1] ?? [...byDate.keys()].sort().pop();
  const dayRows = (byDate.get(targetDate) ?? []).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const hours = [...new Set(dayRows.map((r) => Number(r.timestamp.slice(11, 13))))].sort((a, b) => a - b);
  const genByHour = Object.fromEntries(hours.map((h) => [h, []]));
  const useByHour = Object.fromEntries(hours.map((h) => [h, []]));
  for (const row of dayRows) {
    const h = Number(row.timestamp.slice(11, 13));
    // kWh over a 30-min bucket -> average kW for that bucket
    genByHour[h].push(toNum(row.generation_kwh) * 2);
    useByHour[h].push(toNum(row.consumption_kwh) * 2);
  }
  const avg = (arr) => (arr.length ? round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  return {
    date: targetDate,
    hours,
    genKw: hours.map((h) => avg(genByHour[h])),
    useKw: hours.map((h) => avg(useByHour[h])),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export async function loadReadings() {
  const res = await fetch(CSV_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  const daily = rollUpDaily(rows);

  const totals = daily.reduce(
    (acc, d) => ({
      generationKwh: acc.generationKwh + d.generationKwh,
      consumptionKwh: acc.consumptionKwh + d.consumptionKwh,
      gridImportKwh: acc.gridImportKwh + d.gridImportKwh,
      gridExportKwh: acc.gridExportKwh + d.gridExportKwh,
      selfUsedKwh: acc.selfUsedKwh + d.selfUsedKwh,
    }),
    { generationKwh: 0, consumptionKwh: 0, gridImportKwh: 0, gridExportKwh: 0, selfUsedKwh: 0 }
  );
  for (const k in totals) totals[k] = round(totals[k]);

  const bestDay = daily.reduce((a, b) => (b.generationKwh > (a?.generationKwh ?? -1) ? b : a), null);
  const worstDay = daily.reduce((a, b) => (a === null || b.generationKwh < a.generationKwh ? b : a), null);

  return {
    site: rows[0]?.site ?? 'Muriwai 5kW + Batteries',
    daily,
    totals,
    avgDailyGenerationKwh: daily.length ? round(totals.generationKwh / daily.length) : 0,
    bestDay,
    worstDay,
    hourlyProfile: hourlyProfile(rows),
  };
}
