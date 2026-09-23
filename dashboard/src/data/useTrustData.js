// Data layer — reads the project's standard format (see
// muriwai-data-schema.pdf and src/data/loadReadings.js), which every
// supplier's importer produces:
//
//   readings(site, timestamp, generation_kwh, consumption_kwh,
//            grid_import_kwh, grid_export_kwh)
//
// Today that CSV is built by scripts/build_standard_csv.py from the
// Solarman portal's Excel exports (see README). Once the Pi is online with
// its own Modbus reader, it should write the same standard CSV/DB row
// shape directly — this dashboard doesn't change.
//
// loadReadings() does the parsing + daily/hourly rollups; this hook just
// wires it into React with a poll + sample fallback.

import { useEffect, useRef, useState } from 'react';
import { loadReadings } from './loadReadings';

export const POLL_INTERVAL_MS = 5 * 60 * 1000; // periodic report, not a live feed

export const SAMPLE = {
  site: 'Muriwai 5kW + Batteries (sample)',
  daily: [
    { date: '2026-09-01', generationKwh: 13.1, consumptionKwh: 17.5, gridImportKwh: 7.7, gridExportKwh: 5.0, selfUsedKwh: 8.1, selfSuffPct: 56 },
    { date: '2026-09-02', generationKwh: 18.6, consumptionKwh: 12.9, gridImportKwh: 1.3, gridExportKwh: 4.0, selfUsedKwh: 14.6, selfSuffPct: 90 },
    { date: '2026-09-03', generationKwh: 18.2, consumptionKwh: 3.2, gridImportKwh: 0.5, gridExportKwh: 15.0, selfUsedKwh: 3.2, selfSuffPct: 84 },
  ],
  totals: { generationKwh: 49.9, consumptionKwh: 33.6, gridImportKwh: 9.5, gridExportKwh: 24.0, selfUsedKwh: 25.9 },
  avgDailyGenerationKwh: 16.6,
  bestDay: { date: '2026-09-02', generationKwh: 18.6, consumptionKwh: 12.9, gridImportKwh: 1.3, gridExportKwh: 4.0, selfUsedKwh: 14.6, selfSuffPct: 90 },
  worstDay: { date: '2026-09-01', generationKwh: 13.1, consumptionKwh: 17.5, gridImportKwh: 7.7, gridExportKwh: 5.0, selfUsedKwh: 8.1, selfSuffPct: 56 },
  hourlyProfile: {
    date: '2026-09-02',
    hours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    genKw: [0.36, 1.87, 2.59, 3.09, 2.97, 2.88, 2.29, 1.45, 0.76, 0.51, 0.2, 0.01, 0, 0, 0],
    useKw: [0.15, 0.15, 0.12, 0.11, 0.12, 0.44, 0.72, 1.26, 1.15, 1.04, 1.13, 1.07, 1.01, 1.01, 0.36],
  },
};

export function useTrustData() {
  const [data, setData] = useState(SAMPLE);
  const [isLive, setIsLive] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function load() {
      try {
        const readings = await loadReadings();
        if (mounted.current) {
          setData(readings);
          setIsLive(true);
        }
      } catch (err) {
        if (mounted.current) setIsLive(false);
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  return { data, isLive };
}
