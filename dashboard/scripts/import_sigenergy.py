"""Convert a Sigenergy XLSX recording into public dashboard data (stdlib only).

Energy is trapezoidally integrated between consecutive samples. No time before
the first or after the last sample is invented. Workbook times have no timezone;
they are preserved as recorded. Only measurement columns are published, excluding
the summary sheet's device serial number and network address.
"""
import argparse
import csv
import datetime as dt
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
HEADERS = ['Time', 'Solar (kW)', 'Grid (kW, + import / - export)',
           'House load (kW)', 'Battery power (kW, + charge)',
           'Battery SOC (%)', 'Plant output (kW)', 'EMS mode']


def read_samples(path):
    with zipfile.ZipFile(path) as book:
        strings = []
        if 'xl/sharedStrings.xml' in book.namelist():
            strings = [''.join(el.itertext()) for el in
                       ET.fromstring(book.read('xl/sharedStrings.xml'))]
        sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in sheet.findall('s:sheetData/s:row', NS):
            cells = {}
            for cell in row:
                value = cell.findtext('s:v', namespaces=NS)
                if cell.get('t') == 'inlineStr':
                    value = ''.join(cell.find('s:is', NS).itertext())
                elif cell.get('t') == 's':
                    value = strings[int(value)]
                cells[''.join(c for c in cell.get('r') if c.isalpha())] = value
            rows.append([cells.get(c) for c in 'ABCDEFGH'])
    if rows[0] != HEADERS:
        raise ValueError('Unexpected Sigenergy measurement columns')
    samples = []
    for row in rows[1:]:
        timestamp = (dt.datetime(1899, 12, 30) + dt.timedelta(days=float(row[0]))).replace(microsecond=0)
        numbers = list(map(float, row[1:]))
        if not all(math.isfinite(n) for n in numbers) or min(numbers[0], numbers[2]) < 0:
            raise ValueError('Invalid power reading')
        samples.append(dict(zip(['timestamp', 'solarKw', 'gridKw', 'loadKw',
                                 'batteryKw', 'batterySocPct', 'plantKw', 'emsMode'],
                                [timestamp.isoformat(), *numbers])))
    if len(samples) < 2:
        raise ValueError('At least two readings are needed')
    return samples


def convert(source, output):
    samples = read_samples(source)
    intervals = []
    for a, b in zip(samples, samples[1:]):
        seconds = (dt.datetime.fromisoformat(b['timestamp']) - dt.datetime.fromisoformat(a['timestamp'])).total_seconds()
        if seconds <= 0 or seconds > 30:
            raise ValueError('Duplicate, unordered, or missing samples; review recording before importing')
        hours = seconds / 3600
        # Separate signed grid power before integration, including a linear
        # crossing through zero when import changes to export (or vice versa).
        g0, g1 = a['gridKw'], b['gridKw']
        if g0 * g1 < 0:
            import_kwh = hours * max(g0, g1) ** 2 / (2 * abs(g1 - g0))
            export_kwh = hours * min(g0, g1) ** 2 / (2 * abs(g1 - g0))
        else:
            import_kwh = hours * (max(g0, 0) + max(g1, 0)) / 2
            export_kwh = hours * (max(-g0, 0) + max(-g1, 0)) / 2
        intervals.append({
            'site': 'Muriwai Marae · Sigenergy', 'timestamp': a['timestamp'],
            'generation_kwh': hours * (a['solarKw'] + b['solarKw']) / 2,
            'consumption_kwh': hours * (a['loadKw'] + b['loadKw']) / 2,
            'grid_import_kwh': import_kwh, 'grid_export_kwh': export_kwh,
            'interval_seconds': seconds,
        })
    output.mkdir(parents=True, exist_ok=True)
    with (output / 'muriwai_standard_30min.csv').open('w', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(intervals[0]))
        writer.writeheader()
        writer.writerows(intervals)
    recording = {
        'source': source.name, 'start': samples[0]['timestamp'], 'end': samples[-1]['timestamp'],
        'sampleCount': len(samples), 'durationSeconds': sum(r['interval_seconds'] for r in intervals),
        'partial': True, 'timezone': 'As recorded in workbook (timezone not supplied)',
        'integration': 'Trapezoidal integration between samples; no extrapolation',
        'samples': samples,
    }
    (output / 'sigenergy-recording.json').write_text(json.dumps(recording, indent=2) + '\n', encoding='utf-8')
    print(f"Imported {len(samples)} readings, {recording['durationSeconds']:g} seconds")
    print({key: round(sum(r[key] for r in intervals), 6) for key in
           ['generation_kwh', 'consumption_kwh', 'grid_import_kwh', 'grid_export_kwh']})


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook', type=Path)
    parser.add_argument('output', type=Path, nargs='?', default=Path('public'))
    args = parser.parse_args()
    convert(args.workbook, args.output)
