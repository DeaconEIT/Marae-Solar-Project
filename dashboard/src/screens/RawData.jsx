import { color, font, space, radius } from '../theme/tokens';
import DataTable from '../components/DataTable';
import { IconDownload } from '../components/icons';
import { dailyToCsv, downloadCsv } from '../lib/csv';

const COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'generationKwh', label: 'Generation (kWh)' },
  { key: 'consumptionKwh', label: 'Consumption (kWh)' },
  { key: 'gridExportKwh', label: 'Exported (kWh)' },
  { key: 'gridImportKwh', label: 'Imported (kWh)' },
  { key: 'selfSuffPct', label: 'Self-suff. (%)' },
];

export default function RawData({ data }) {
  const { daily } = data;

  function handleExport() {
    downloadCsv(`muriwai-solar-daily-${daily[0]?.date}-to-${daily[daily.length - 1]?.date}.csv`, dailyToCsv(daily));
  }

  return (
    <div style={{ padding: space(6) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, color: color.cream, margin: 0 }}>
            Raw daily data
          </h1>
          <p style={{ fontFamily: font.ui, fontSize: 13.5, color: color.lilac, margin: '6px 0 0' }}>
            {daily.length} days, rolled up from the 30-min standard readings. Click a column to sort.
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 14px',
            borderRadius: radius.sm,
            border: `1px solid ${color.panelBorderStrong}`,
            background: color.panelAlt,
            color: color.cream,
            fontFamily: font.ui,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <IconDownload />
          Export CSV
        </button>
      </div>

      <div
        style={{
          fontFamily: font.ui,
          fontSize: 13.5,
          color: color.lilac,
          background: color.panelAlt,
          border: `1px solid ${color.panelBorder}`,
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 18,
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: color.cream }}>Reading this table:</strong> Generation is everything the
        panels made that day. Exported + Consumption − Imported ≈ Generation (small rounding gaps are
        normal). Self-suff. % is the share of that day's use that didn't need a grid import.
      </div>

      <DataTable columns={COLUMNS} rows={daily} />
    </div>
  );
}
