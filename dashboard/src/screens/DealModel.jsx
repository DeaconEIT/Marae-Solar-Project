import { useState } from 'react';
import { color, font, space, radius } from '../theme/tokens';
import KpiCard from '../components/KpiCard';
import { IconArrow, IconLeaf, IconHandshake } from '../components/icons';
import { exportSharePct, periodLabel } from '../lib/metrics';

const nzd = (n) => `$${n.toLocaleString('en-NZ', { maximumFractionDigits: 0 })}`;

// The three cost formulas from the project's data spec:
//   1. cost of grid power              = grid_import_kwh x import_rate
//   2. value of exports                = grid_export_kwh x export_rate
//   3. avoided-cost value of self-use  = (generation_kwh - grid_export_kwh) x import_rate
// Rates are illustrative inputs until the marae's real tariff/deal is confirmed.
export default function DealModel({ data }) {
  const { daily, totals } = data;
  const days = daily.length || 1;
  const [importRate, setImportRate] = useState(0.32);
  const [exportRate, setExportRate] = useState(0.12);

  const gridCost = totals.gridImportKwh * importRate;
  const exportValue = totals.gridExportKwh * exportRate;
  const avoidedCostValue = (totals.generationKwh - totals.gridExportKwh) * importRate;

  const annualExportKwh = (totals.gridExportKwh / days) * 365;
  const annualExportValue = annualExportKwh * exportRate;
  const exportPct = exportSharePct(totals);

  return (
    <div style={{ padding: space(6), maxWidth: 780 }}>
      <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, color: color.cream, margin: '0 0 10px' }}>
        Deal modelling
      </h1>
      <p style={{ fontFamily: font.ui, fontSize: 14.5, color: color.lilac, marginTop: 0, marginBottom: space(6), lineHeight: 1.6 }}>
        Model potential revenue from a power purchase agreement (PPA) or export
        tariff, using metered data from {periodLabel(daily)}. Rates below
        are illustrative inputs — adjust to match what's on the table in a
        negotiation, or the marae's real power bill once confirmed.
      </p>

      <div
        style={{
          border: `1px solid ${color.panelBorder}`,
          borderRadius: radius.md,
          padding: space(5),
          background: color.panel,
          marginBottom: space(7),
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: space(6),
        }}
      >
        <RateInput label="Import rate ($/kWh)" value={importRate} onChange={setImportRate} accent={color.lilac} />
        <RateInput label="Proposed export rate ($/kWh)" value={exportRate} onChange={setExportRate} accent={color.sun} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: space(4) }}>
        <KpiCard
          label="Cost of grid power"
          value={nzd(gridCost)}
          sub={`${totals.gridImportKwh} kWh imported × $${importRate.toFixed(2)}`}
          accent={color.lilac}
          Icon={(p) => <IconArrow direction="down" {...p} />}
          hint="What the marae paid to buy power from the grid, over this period."
        />
        <KpiCard
          label="Value of exports"
          value={nzd(exportValue)}
          sub={`${totals.gridExportKwh} kWh exported × $${exportRate.toFixed(2)}`}
          accent={color.sun}
          Icon={(p) => <IconArrow direction="up" {...p} />}
          hint="What the exported surplus would be worth at the rate above — a live 'what if', not a bill."
        />
        <KpiCard
          label="Avoided cost, self-use"
          value={nzd(avoidedCostValue)}
          sub={`(generation − exports) × $${importRate.toFixed(2)}`}
          accent={color.flax}
          Icon={IconLeaf}
          hint="Money already saved by using solar on-site instead of buying that power."
        />
      </div>

      <div style={{ marginBottom: space(6) }}>
        <KpiCard
          label={`Projected annual export revenue, at $${exportRate.toFixed(2)}/kWh`}
          value={nzd(annualExportValue)}
          sub={`extrapolated from a ${days}-day average (${Math.round(annualExportKwh)} kWh/yr)`}
          accent={color.sun}
          Icon={IconHandshake}
          hint="If this rate held all year: a rough yearly figure to bring to a negotiation, not a guarantee."
        />
      </div>

      <p
        style={{
          fontFamily: font.ui,
          fontSize: 15,
          color: color.cream,
          lineHeight: 1.65,
          maxWidth: 620,
          marginBottom: space(8),
          padding: '14px 18px',
          borderLeft: `3px solid ${color.sun}`,
          background: color.panelAlt,
          borderRadius: '0 8px 8px 0',
        }}
      >
        In short: at these rates, the marae is already saving about{' '}
        <strong style={{ color: color.flax }}>{nzd(avoidedCostValue)}</strong> by using its own solar, and could
        earn roughly <strong style={{ color: color.sun }}>{nzd(annualExportValue)}/year</strong> more by selling
        the surplus — worth testing against whatever rate a retailer actually offers.
      </p>

      <section>
        <div style={{ fontFamily: font.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', color: color.lilac, textTransform: 'uppercase', marginBottom: 12 }}>
          Where the generation goes
        </div>
        <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', border: `1px solid ${color.panelBorder}` }}>
          <div style={{ width: `${100 - exportPct}%`, background: color.flax }} title={`Used on-site: ${100 - exportPct}%`} />
          <div style={{ width: `${exportPct}%`, background: color.sun }} title={`Exported: ${exportPct}%`} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontFamily: font.ui, fontSize: 13, color: color.lilac, marginTop: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color.flax, display: 'inline-block' }} />
            Used on-site — {100 - exportPct}%
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color.sun, display: 'inline-block' }} />
            Exported — {exportPct}%, this is the negotiable surplus
          </span>
        </div>
      </section>
    </div>
  );
}

function RateInput({ label, value, onChange, accent }) {
  return (
    <div>
      <label style={{ fontFamily: font.ui, fontSize: 13.5, fontWeight: 600, color: color.cream, display: 'block', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="range"
          min="0"
          max="0.40"
          step="0.01"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: accent }}
        />
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          style={{
            width: 84,
            padding: '7px 9px',
            borderRadius: 6,
            border: `1px solid ${color.panelBorderStrong}`,
            background: color.bg,
            color: color.cream,
            fontFamily: font.number,
            fontWeight: 700,
            fontSize: 15,
            ...font.tabularNums,
          }}
        />
      </div>
    </div>
  );
}
