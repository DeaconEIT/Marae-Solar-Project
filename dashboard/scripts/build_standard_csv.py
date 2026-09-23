"""
Muriwai/Solarman importer — converts the raw Solarman "Detailed Data" Excel
exports into the project's standard CSV shape (see docs/muriwai-data-schema.pdf).

This is the FIRST of what should be several per-supplier importers, each
producing the same agnostic shape so the database and dashboard never need
to change when another marae/brand of inverter is added:

    readings(site, timestamp, generation_kwh, consumption_kwh,
             grid_import_kwh, grid_export_kwh)

Quirks handled here (see the schema doc for the full explanation):
  - FEED-IN is stored NEGATIVE in the raw Solarman export — flipped to a
    positive grid_export_w here.
  - W -> kWh: energy = power(W) x interval(hours) / 1000. Interval/daily
    totals are the SUM of these 5-min energies, not an average — this is
    how Solarman derives its own daily figures too.
  - GAPS: the raw export drops some 5-min intervals (a full day should
    have 288). Gaps are left as missing rows (not fabricated) and
    reported to stderr, not silently interpolated.

Usage:
    python scripts/build_standard_csv.py [export_dir] [out_dir]

  export_dir  Folder with the portal's "*Detailed Data*.xlsx" exports
              (default: ~/Downloads). All matching files are concatenated
              and de-duplicated by (site, timestamp).
  out_dir     Where to write the two CSVs (default: public/)

Writes:
  <out_dir>/muriwai_readings_5min_clean.csv   — full 5-min resolution
  <out_dir>/muriwai_standard_30min.csv        — 30-min aggregates, the
                                                 "standard format" the
                                                 dashboard reads
"""

import csv
import sys
from datetime import datetime, timedelta
from pathlib import Path

from openpyxl import load_workbook

INTERVAL_MIN = 5


def find(export_dir, needle):
    matches = sorted(Path(export_dir).glob(f"*{needle}*.xlsx"))
    if not matches:
        sys.exit(f"No file matching '*{needle}*.xlsx' in {export_dir}")
    return matches


def rows_from(path):
    wb = load_workbook(path, data_only=True)
    ws = wb["Sheet1"]
    headers = [c.value for c in ws[1]]
    return [dict(zip(headers, r)) for r in ws.iter_rows(min_row=2, values_only=True)]


def f(v):
    return 0.0 if v in (None, "") else float(v)


def to_iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:00+12:00")


def main():
    args = sys.argv[1:]
    export_dir = Path(args[0]) if len(args) > 0 else Path.home() / "Downloads"
    out_dir = Path(args[1]) if len(args) > 1 else Path(__file__).resolve().parent.parent / "public"
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = []
    for path in find(export_dir, "Detailed Data"):
        raw.extend(rows_from(path))

    # De-dupe by (site, timestamp) — a later file's row wins.
    by_key = {}
    for r in raw:
        site = r["Plant Name"]
        ts = datetime.strptime(r["Updated Time"], "%Y/%m/%d %H:%M")
        by_key[(site, ts)] = r
    keys_sorted = sorted(by_key)

    clean_rows = []
    for site, ts in keys_sorted:
        r = by_key[(site, ts)]
        generation_w = f(r["Production Power(W)"])
        consumption_w = f(r["Consumption Power(W)"])
        grid_import_w = f(r["Purchasing Power(W)"])
        grid_export_w = abs(f(r["Feed-in Power(W)"]))  # flip: stored negative in raw export
        battery_soc_pct = f(r["SoC(%)"])

        factor = INTERVAL_MIN / 60 / 1000  # W -> kWh for a 5-min interval
        clean_rows.append({
            "timestamp": to_iso(ts),
            "site": site,
            "generation_w": generation_w,
            "consumption_w": consumption_w,
            "grid_import_w": grid_import_w,
            "grid_export_w": grid_export_w,
            "battery_soc_pct": battery_soc_pct,
            "generation_kwh": round(generation_w * factor, 5),
            "consumption_kwh": round(consumption_w * factor, 5),
            "grid_import_kwh": round(grid_import_w * factor, 5),
            "grid_export_kwh": round(grid_export_w * factor, 5),
            "_ts": ts,
            "_site": site,
        })

    # Flag gaps (missing 5-min intervals) per site, reported not fabricated.
    by_site = {}
    for row in clean_rows:
        by_site.setdefault(row["_site"], []).append(row["_ts"])
    gap_count = 0
    for site, timestamps in by_site.items():
        for prev, cur in zip(timestamps, timestamps[1:]):
            gap = (cur - prev) - timedelta(minutes=INTERVAL_MIN)
            if gap > timedelta(0):
                gap_count += 1
    if gap_count:
        print(f"NOTE: {gap_count} gap(s) in 5-min readings (missing intervals, not fabricated) — see spans below.", file=sys.stderr)
        for site, timestamps in by_site.items():
            span_start = timestamps[0].date()
            span_end = timestamps[-1].date()
            print(f"  {site}: data spans {span_start} to {span_end}", file=sys.stderr)

    clean_csv_path = out_dir / "muriwai_readings_5min_clean.csv"
    with open(clean_csv_path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow([
            "timestamp", "site", "generation_w", "consumption_w", "grid_import_w",
            "grid_export_w", "battery_soc_pct", "generation_kwh", "consumption_kwh",
            "grid_import_kwh", "grid_export_kwh",
        ])
        for row in clean_rows:
            writer.writerow([
                row["timestamp"], row["site"], row["generation_w"], row["consumption_w"],
                row["grid_import_w"], row["grid_export_w"], row["battery_soc_pct"],
                row["generation_kwh"], row["consumption_kwh"], row["grid_import_kwh"],
                row["grid_export_kwh"],
            ])

    # 30-min standard aggregate: bucket = interval start, SUM of the 5-min
    # energies falling in [bucket, bucket+30min).
    def bucket_start(ts):
        floored_minute = 0 if ts.minute < 30 else 30
        return ts.replace(minute=floored_minute, second=0, microsecond=0)

    buckets = {}
    for row in clean_rows:
        key = (row["_site"], bucket_start(row["_ts"]))
        b = buckets.setdefault(key, {"generation_kwh": 0.0, "consumption_kwh": 0.0, "grid_import_kwh": 0.0, "grid_export_kwh": 0.0})
        b["generation_kwh"] += row["generation_kwh"]
        b["consumption_kwh"] += row["consumption_kwh"]
        b["grid_import_kwh"] += row["grid_import_kwh"]
        b["grid_export_kwh"] += row["grid_export_kwh"]

    standard_csv_path = out_dir / "muriwai_standard_30min.csv"
    with open(standard_csv_path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["site", "timestamp", "generation_kwh", "consumption_kwh", "grid_import_kwh", "grid_export_kwh"])
        for (site, ts) in sorted(buckets, key=lambda k: (k[0], k[1])):
            b = buckets[(site, ts)]
            writer.writerow([
                site, to_iso(ts),
                round(b["generation_kwh"], 3), round(b["consumption_kwh"], 3),
                round(b["grid_import_kwh"], 3), round(b["grid_export_kwh"], 3),
            ])

    print(f"Wrote {len(clean_rows)} rows -> {clean_csv_path}")
    print(f"Wrote {len(buckets)} rows -> {standard_csv_path}")


if __name__ == "__main__":
    main()
