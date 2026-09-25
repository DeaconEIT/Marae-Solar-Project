"""
Generates synthetic (fake, but realistically-shaped) readings in the
project's standard CSV format, so the dashboard can be published publicly
without exposing the marae's real, granular energy-use data (which reveals
occupancy/usage patterns — a genuine privacy concern for a live household/
community site, not just an abstraction).

This does NOT read any real export files — every number here is generated
from a simple model (a daylight bell curve for generation, a base-load +
morning/evening-peak curve for consumption, both with random day-to-day
variation), not derived from or fitted to the actual Muriwai readings.

Usage:
    python scripts/generate_synthetic_data.py [out_dir] [--days N] [--seed N]

Writes the same two files scripts/build_standard_csv.py produces, in the
same shape, so the dashboard can't tell the difference:
    <out_dir>/muriwai_readings_5min_clean.csv
    <out_dir>/muriwai_standard_30min.csv
"""

import csv
import math
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

SITE = "Muriwai 5kW + Batteries"
CAPACITY_KW = 5.0
DAYLIGHT_START = 6
DAYLIGHT_END = 20
START_DATE = datetime(2026, 9, 1)


def daylight_fraction(hour):
    """0 outside daylight hours, a smooth bell shape peaking at midday within them."""
    if hour < DAYLIGHT_START or hour > DAYLIGHT_END:
        return 0.0
    span = DAYLIGHT_END - DAYLIGHT_START
    x = (hour - DAYLIGHT_START) / span  # 0..1 across the daylight window
    return math.sin(math.pi * x) ** 1.3


def consumption_kw(hour, rng):
    """Base load with a morning and evening bump, roughly household/community shaped."""
    base = 0.18
    morning = 0.35 * math.exp(-((hour - 7.5) ** 2) / (2 * 1.2**2))
    evening = 0.65 * math.exp(-((hour - 18.5) ** 2) / (2 * 1.8**2))
    noise = rng.uniform(-0.03, 0.05)
    return max(0.05, base + morning + evening + noise)


def main():
    args = sys.argv[1:]
    out_dir = Path(__file__).resolve().parent.parent / "public"
    days = 14
    seed = 42
    positional = []
    i = 0
    while i < len(args):
        if args[i] == "--days":
            days = int(args[i + 1])
            i += 2
        elif args[i] == "--seed":
            seed = int(args[i + 1])
            i += 2
        else:
            positional.append(args[i])
            i += 1
    if positional:
        out_dir = Path(positional[0])
    out_dir.mkdir(parents=True, exist_ok=True)

    rng = random.Random(seed)

    rows_5min = []
    for day in range(days):
        date = START_DATE + timedelta(days=day)
        # A per-day "weather factor" so some days are sunnier than others.
        # Tuned so a 5kW array tops out around ~20kWh on the best days —
        # realistic for spring, not nameplate-capacity-all-day fiction.
        weather = rng.uniform(0.15, 0.55)
        activity = rng.uniform(0.7, 1.6)  # day-to-day variation in site use
        steps_per_day = 24 * 60 // 5
        for step in range(steps_per_day):
            ts = date + timedelta(minutes=5 * step)
            hour = ts.hour + ts.minute / 60

            gen_kw = CAPACITY_KW * weather * daylight_fraction(hour)
            gen_kw *= 1 + rng.uniform(-0.06, 0.06)  # cloud flicker
            gen_kw = max(0.0, gen_kw)

            cons_kw = consumption_kw(hour, rng) * activity

            surplus = gen_kw - cons_kw
            export_kw = max(0.0, surplus)
            import_kw = max(0.0, -surplus)

            factor = 5 / 60  # kW -> kWh over a 5-min interval
            rows_5min.append({
                "timestamp": ts,
                "generation_kwh": round(gen_kw * factor, 5),
                "consumption_kwh": round(cons_kw * factor, 5),
                "grid_import_kwh": round(import_kw * factor, 5),
                "grid_export_kwh": round(export_kw * factor, 5),
            })

    clean_path = out_dir / "muriwai_readings_5min_clean.csv"
    with open(clean_path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow([
            "timestamp", "site", "generation_w", "consumption_w", "grid_import_w",
            "grid_export_w", "battery_soc_pct", "generation_kwh", "consumption_kwh",
            "grid_import_kwh", "grid_export_kwh",
        ])
        for r in rows_5min:
            factor = 5 / 60
            writer.writerow([
                r["timestamp"].strftime("%Y-%m-%dT%H:%M:00+12:00"),
                SITE,
                round(r["generation_kwh"] / factor * 1000),
                round(r["consumption_kwh"] / factor * 1000),
                round(r["grid_import_kwh"] / factor * 1000),
                round(r["grid_export_kwh"] / factor * 1000),
                "",  # battery_soc_pct — not modelled here, left blank
                r["generation_kwh"], r["consumption_kwh"],
                r["grid_import_kwh"], r["grid_export_kwh"],
            ])

    # Roll up to the 30-min standard format the dashboard actually reads.
    buckets = {}
    for r in rows_5min:
        bucket_minute = 0 if r["timestamp"].minute < 30 else 30
        bucket_ts = r["timestamp"].replace(minute=bucket_minute, second=0, microsecond=0)
        b = buckets.setdefault(bucket_ts, {"generation_kwh": 0.0, "consumption_kwh": 0.0, "grid_import_kwh": 0.0, "grid_export_kwh": 0.0})
        b["generation_kwh"] += r["generation_kwh"]
        b["consumption_kwh"] += r["consumption_kwh"]
        b["grid_import_kwh"] += r["grid_import_kwh"]
        b["grid_export_kwh"] += r["grid_export_kwh"]

    standard_path = out_dir / "muriwai_standard_30min.csv"
    with open(standard_path, "w", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["site", "timestamp", "generation_kwh", "consumption_kwh", "grid_import_kwh", "grid_export_kwh"])
        for ts in sorted(buckets):
            b = buckets[ts]
            writer.writerow([
                SITE, ts.strftime("%Y-%m-%dT%H:%M:00+12:00"),
                round(b["generation_kwh"], 3), round(b["consumption_kwh"], 3),
                round(b["grid_import_kwh"], 3), round(b["grid_export_kwh"], 3),
            ])

    print(f"Wrote {len(rows_5min)} rows -> {clean_path}")
    print(f"Wrote {len(buckets)} rows -> {standard_path}")


if __name__ == "__main__":
    main()
