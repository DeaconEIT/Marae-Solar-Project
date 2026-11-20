// Loads interval energy plus the original Sigenergy power recording.
// The legacy CSV filename is retained; interval_seconds is the actual duration.
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

// Sum only the recorded intervals by the calendar date in the workbook.
function rollUpDaily(rows) {
  const byDate = new Map();
  for (const row of rows) {
    const date = row.timestamp.slice(0, 10);
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

function round(n) {
  return Math.round(n * 100) / 100;
}

export async function loadReadings() {
  const [res, recordingRes] = await Promise.all([
    fetch(CSV_URL, { cache: 'no-store' }),
    fetch('./sigenergy-recording.json', { cache: 'no-store' }),
  ]);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!recordingRes.ok) throw new Error('Recording unavailable');
  const recording = await recordingRes.json();
  const rows = parseCsv(await res.text());
  if (!rows.length || !recording.samples?.length) throw new Error('No recorded readings');
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
    recording,
    hourlyProfile: {
      date: recording.start.slice(0, 10),
      hours: recording.samples.map((s) => s.timestamp.slice(11, 19)),
      genKw: recording.samples.map((s) => s.solarKw),
      useKw: recording.samples.map((s) => s.loadKw),
    },
  };
}
