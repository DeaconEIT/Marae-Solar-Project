# Muriwai Solar — Trust Analytics Dashboard

A desktop-first dashboard for the Trust to analyse Muriwai's solar +
battery performance: how much is generated, how much is used on-site vs
exported to the grid, and what that's worth under different export-rate
scenarios — the numbers needed for an energy deal (PPA / export tariff)
negotiation.

This is **not** the community wall-screen app — that's a different,
glanceable, whānau-facing tool. This one is for people reading tables and
modelling numbers.

## Running it

```bash
npm install
npm run dev
```

Opens on a local port (Vite prints the URL). It fetches
`public/muriwai_standard_30min.csv` on load and every 5 minutes after
(`POLL_INTERVAL_MS` in `src/data/useTrustData.js`) — this is a
periodically-refreshed report, not a live feed.

## The data pipeline

This project follows the standard data shape Trust Tairāwhiti asked for —
see `docs/muriwai-data-schema.pdf` — so that every marae's inverter brand
converts into the **same** shape and the dashboard never has to change:

```
readings(site, timestamp, generation_kwh, consumption_kwh,
         grid_import_kwh, grid_export_kwh)
```

```
raw Solarman Excel export
        │  scripts/build_standard_csv.py   (Muriwai/Solarman importer)
        ▼
public/muriwai_readings_5min_clean.csv     full 5-min resolution
public/muriwai_standard_30min.csv          30-min standard format ← dashboard reads this
        │  src/data/loadReadings.js        (parses CSV, rolls up to daily + hourly)
        ▼
   the dashboard screens
```

### ⚠️ The CSVs committed to this repo are synthetic, not real

This app is deployed publicly (GitHub Pages) — publishing the marae's real,
granular energy-use data there would expose actual occupancy/usage
patterns, which is a genuine privacy concern, not just an abstraction.

So `public/muriwai_readings_5min_clean.csv` and
`public/muriwai_standard_30min.csv` in this repo are **generated fake
data** (`scripts/generate_synthetic_data.py`) — a simple model (a daylight
bell curve for generation, a base-load-plus-morning/evening-peak curve for
consumption, both with random day-to-day variation) shaped to look like
real output, not derived from or fitted to the real Muriwai readings. The
sidebar shows an "Illustrative data" notice for exactly this reason —
don't remove it from the public build.

```bash
python scripts/generate_synthetic_data.py public --days 14 --seed 42
```

**For real internal Trust analysis**, run the real pipeline locally and
don't commit its output:

```bash
pip install openpyxl   # once
python scripts/build_standard_csv.py ~/Downloads public
```

Then create a `.env.local` (gitignored, never committed) containing
`VITE_ILLUSTRATIVE_DATA=false` to turn off the "illustrative data" banner
for that local session — see `.env` for the default and
`src/components/Sidebar.jsx` for where it's read. **Do not `git add` the
real CSVs or push that `.env.local` change** — regenerate the synthetic
files (command above) before committing anything to `public/`.

Quirks the real importer handles (see the comment block at the top of
`scripts/build_standard_csv.py` for the full explanation):
- **Feed-in sign flip** — the raw export stores feed-in/export power as
  *negative*; the importer flips it to a positive `grid_export_w`.
- **W → kWh** — energy = power(W) × interval(hours) ÷ 1000, and daily/
  interval totals are the *sum* of these, matching how Solarman derives
  its own daily figures.
- **Gaps** — missing 5-min intervals are left missing, not fabricated,
  and reported to stderr when the importer runs.

### What's real vs. a placeholder (when running the real pipeline)

- **Real**: every `*_kwh` figure — generation, consumption, grid import,
  grid export, at 5-min and rolled-up-to-30-min resolution.
- **Not real / a modelling input**: import and export tariffs ($/kWh).
  There's no confirmed export rate yet — that's the thing being
  negotiated — so the Deal Modelling screen treats both rates as
  adjustable inputs rather than assuming a number. The default import
  rate ($0.32) is a placeholder; swap in the marae's real power bill
  rate when confirmed.

## Screens

- **Overview** — KPI row (generation, export, self-use, import, best/
  worst day) + a stacked bar chart of every day on record, split into
  self-used vs exported.
- **Generation & export** — the same daily chart at a larger scale, plus
  an hourly generation-vs-load profile (from the most recent full day)
  showing *when* export happens — relevant to time-of-use or PPA timing
  terms.
- **Deal modelling** — adjustable import-rate and export-rate inputs,
  computing the three project cost formulas directly from the metered
  data:
  1. `cost of grid power = grid_import_kwh × import_rate`
  2. `value of exports = grid_export_kwh × export_rate`
  3. `avoided-cost value of self-use = (generation_kwh − grid_export_kwh) × import_rate`
- **Raw data** — the full daily table, sortable by column, with a CSV
  export button for pulling the numbers into the Trust's own spreadsheet.

## Once the Pi is running

The dashboard's only real dependency is the standard CSV shape above.
Once the Raspberry Pi at the marae is polling the inverter/BMS directly
over Modbus, it (or a small per-supplier importer, same pattern as
`scripts/build_standard_csv.py`) should write readings in this same
shape — `src/data/loadReadings.js` doesn't need to change, and neither
does any screen. The suggested single-table DB shape from the spec
(`readings(site, timestamp, generation_kwh, consumption_kwh,
grid_import_kwh, grid_export_kwh)`, primary key `(site, timestamp)`) is
what a future backend should target.

## Structure

- `src/theme/tokens.js` — colours, fonts, spacing
- `src/data/loadReadings.js` — parses the standard CSV, rolls up to daily
  + hourly (site-agnostic — doesn't change when a second marae is added)
- `src/data/useTrustData.js` — wires the loader into React (poll + sample
  fallback)
- `src/lib/metrics.js` / `src/lib/csv.js` — derived-number helpers and
  CSV export
- `src/components/` — Sidebar, KpiCard, DataTable, chart components
- `src/screens/` — one file per screen (Overview, Generation, DealModel,
  RawData)
- `scripts/build_standard_csv.py` — the real Muriwai/Solarman importer
  (local/internal use only — don't commit its output to `public/`)
- `scripts/generate_synthetic_data.py` — produces the fake-but-realistic
  CSVs actually committed to `public/` for the public build
- `.env` — sets the "illustrative data" banner on by default; see the
  comment inside it for how to turn it off locally
