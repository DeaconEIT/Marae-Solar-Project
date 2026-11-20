import csv
import importlib.util
import io
import json
from contextlib import redirect_stdout
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('import_sigenergy', Path(__file__).with_name('import_sigenergy.py'))
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class ImportTests(unittest.TestCase):
    def convert(self, samples):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder)
            with patch.object(importer, 'read_samples', return_value=samples), redirect_stdout(io.StringIO()):
                importer.convert(Path('recording.xlsx'), output)
            with (output / 'muriwai_standard_30min.csv').open(encoding='utf-8') as stream:
                rows = list(csv.DictReader(stream))
            metadata = json.loads((output / 'sigenergy-recording.json').read_text())
            return rows, metadata

    def sample(self, second, solar=6, load=2, grid=-4):
        return {'timestamp': f'2026-11-20T11:45:{second:02}',
                'solarKw': solar, 'loadKw': load, 'gridKw': grid}

    def test_constant_power_uses_elapsed_time_without_extra_last_interval(self):
        rows, metadata = self.convert([self.sample(0), self.sample(10), self.sample(20)])
        self.assertEqual(len(rows), 2)
        self.assertEqual(metadata['durationSeconds'], 20)
        self.assertAlmostEqual(sum(float(r['generation_kwh']) for r in rows), 6 * 20 / 3600)
        self.assertAlmostEqual(sum(float(r['grid_export_kwh']) for r in rows), 4 * 20 / 3600)
        self.assertEqual(sum(float(r['grid_import_kwh']) for r in rows), 0)

    def test_varying_power_is_trapezoidal(self):
        rows, _ = self.convert([self.sample(0, solar=0), self.sample(10, solar=12)])
        self.assertAlmostEqual(float(rows[0]['generation_kwh']), 6 * 10 / 3600)

    def test_signed_grid_crossing_splits_import_and_export(self):
        rows, _ = self.convert([self.sample(0, grid=4), self.sample(10, grid=-4)])
        self.assertAlmostEqual(float(rows[0]['grid_import_kwh']), 10 / 3600)
        self.assertAlmostEqual(float(rows[0]['grid_export_kwh']), 10 / 3600)

    def test_gaps_and_duplicate_timestamps_stop_import(self):
        for second in [0, 40]:
            with self.subTest(second=second), self.assertRaises(ValueError):
                self.convert([self.sample(0), self.sample(second)])


if __name__ == '__main__':
    unittest.main()
