# Muriwai Solar dashboard

React/Vite dashboard deployed to GitHub Pages from `dashboard/` in
deaconeit/Marae-Solar-Project. Run `npm install`, then `npm run dev` locally.
`npm run build` creates the production bundle.

## Actual Sigenergy recording

The published dashboard now uses measurements from `sigen_log_10min.xlsx`,
replacing the former synthetic dataset. The recording contains 60 samples
at 10-second spacing on 20 November 2026, 11:45:35–11:55:25 (590 seconds).
Times are preserved as recorded; the workbook does not specify a timezone.
This is a partial day, not a live feed. No annual revenue is extrapolated.
Tariff inputs remain illustrative, adjustable modelling assumptions.

To import a replacement workbook (Python standard library only):

```sh
python scripts/import_sigenergy.py /path/to/sigen_log_10min.xlsx public
```

The importer generates:

- `public/muriwai_standard_30min.csv`: interval energy with the original
  standard metric columns plus `interval_seconds`. Despite the legacy filename,
  this recording has 10-second intervals, not 30-minute buckets.
- `public/sigenergy-recording.json`: measurement samples and recording provenance,
  used for the power chart and recording notice. Device serial/network details
  from the summary sheet are excluded. The original workbook is not published.

Energy (kWh) is trapezoidally integrated from adjacent power (kW) samples over
their actual elapsed hours. Grid-positive means import; grid-negative means
export. Nothing is extrapolated before the first or after the last sample.
Non-increasing timestamps or gaps over 30 seconds stop import for review.
The workbook summary instead approximates ten minutes using average power;
small differences from those formulas are expected.

The page sums interval energy by recorded calendar date. The power chart shows
the original samples. Missing/failed data loads display a loading/error state,
never synthetic values. A failed refresh retains the last successful recording.
Generation minus exports is labelled on-site use using the existing model;
with battery activity it can include storage/losses rather than direct load.

The original Solarman importer and synthetic-data generator remain as utilities;
they are not the source for the current published recording. GitHub Actions builds
and deploys changes pushed to `main` under `dashboard/`.
