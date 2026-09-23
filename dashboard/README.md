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

## Publishing it as a live website (GitHub Pages)

A workflow at `.github/workflows/deploy-dashboard.yml` builds this app and
publishes it to GitHub Pages automatically on every push to `main` that
touches `dashboard/`. It'll be live at:

```
https://deaconeit.github.io/Marae-Solar-Project/
```

**One-time setup an admin on the repo needs to do** (this account doesn't
have admin, so it can't be done from here): go to **Settings → Pages** on
the repo, and under **Build and deployment → Source**, choose
**GitHub Actions**. After that, the workflow above handles every future
deploy — nothing further to configure.

You can also trigger a deploy manually from the **Actions** tab
("Deploy dashboard to GitHub Pages" → **Run workflow**) once Pages is
enabled, without waiting for a push to `main`.

Note the published site only ever shows whatever's in
`public/muriwai_standard_30min.csv` at the time it was built — regenerate
that file (see below) and push to `main` to update the live numbers.

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

**The data is real** — both CSVs are built from a single actual Solarman
portal export for Muriwai, `Muriwai 5kW + Batteries-Detailed Data-20260914.xlsx`
(2026-09-01 to 2026-09-14, the last day partial — the file ends mid-afternoon).
The raw export itself has some missing 5-min intervals within that range;
the pipeline reports those gaps to stderr rather than filling them in.

Quirks handled by the importer (see the comment block at the top of
`scripts/build_standard_csv.py` for the full explanation):
- **Feed-in sign flip** — the raw export stores feed-in/export power as
  *negative*; the importer flips it to a positive `grid_export_w`.
- **W → kWh** — energy = power(W) × interval(hours) ÷ 1000, and daily/
  interval totals are the *sum* of these, matching how Solarman derives
  its own daily figures.
- **Gaps** — missing 5-min intervals are left missing, not fabricated,
  and reported to stderr when the importer runs.

### Regenerating the CSVs

When a fresh batch of `*Detailed Data*.xlsx` exports comes from the
Solarman portal (dropped in alongside older ones just extends the
history — rows are de-duplicated by site + timestamp):

```bash
pip install openpyxl   # once
python scripts/build_standard_csv.py ~/Downloads public
```

### What's real vs. a placeholder

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
  computing the three project cost formulas directly from real metered
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
- `scripts/build_standard_csv.py` — the Muriwai/Solarman importer;
  produces both CSVs in `public/`
