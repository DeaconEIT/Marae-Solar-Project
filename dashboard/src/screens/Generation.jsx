import { color, font, space } from '../theme/tokens';
import StackedBarChart from '../components/StackedBarChart';
import DualLineChart from '../components/DualLineChart';
import KpiCard from '../components/KpiCard';
import { IconSun, IconArrow } from '../components/icons';
import { formatDate } from '../lib/metrics';

export default function Generation({ data }) {
  const { daily, totals, hourlyProfile } = data;

  return (
    <div style={{ padding: space(6) }}>
      <h1 style={{ fontFamily: font.display, fontSize: 28, fontWeight: 600, color: color.cream, margin: '0 0 10px' }}>
        Generation &amp; export
      </h1>
      <p style={{ fontFamily: font.ui, fontSize: 14.5, color: color.lilac, marginTop: 0, marginBottom: 24, maxWidth: 600, lineHeight: 1.65 }}>
        A closer look at every day on record, plus when in the day surplus
        actually happens — the timing matters as much as the total when
        pricing an export deal, since some hours are worth more to a
        retailer than others.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: space(8) }}>
        <KpiCard label="Generated" value={totals.generationKwh} unit="kWh" accent={color.sun} Icon={IconSun} hint="Total solar output." />
        <KpiCard label="Consumed" value={totals.consumptionKwh} unit="kWh" hint="Total site load — everything the marae used." />
        <KpiCard
          label="Exported"
          value={totals.gridExportKwh}
          unit="kWh"
          accent={color.sun}
          Icon={(p) => <IconArrow direction="up" {...p} />}
          hint="Surplus solar sent to the grid."
        />
        <KpiCard
          label="Imported"
          value={totals.gridImportKwh}
          unit="kWh"
          accent={color.lilac}
          Icon={(p) => <IconArrow direction="down" {...p} />}
          hint="Grid power bought when solar wasn't enough."
        />
      </div>

      <section style={{ marginBottom: space(9) }}>
        <div style={{ fontFamily: font.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', color: color.lilac, textTransform: 'uppercase', marginBottom: 14 }}>
          Daily generation, every day on record
        </div>
        <StackedBarChart daily={daily} height={260} />
      </section>

      <section>
        <div style={{ fontFamily: font.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', color: color.lilac, textTransform: 'uppercase', marginBottom: 6 }}>
          When export happens — {formatDate(hourlyProfile.date)}
        </div>
        <p style={{ fontFamily: font.ui, fontSize: 13.5, color: color.lilac, marginTop: 0, marginBottom: 16, maxWidth: 600, lineHeight: 1.6 }}>
          One representative day's hourly profile (30-min readings averaged into
          kW), not an average across all days. Generation (red) peaks
          mid-morning to early afternoon while site load (dashed) stays low most
          of the day — <strong style={{ color: color.cream }}>the gap between the two lines is exportable surplus</strong>,
          and matters for any time-of-use or PPA rate negotiation.
        </p>
        <div
          style={{
            border: `1px solid ${color.panelBorder}`,
            borderRadius: 10,
            padding: space(4),
            background: color.panel,
          }}
        >
          <DualLineChart
            hours={hourlyProfile.hours}
            seriesA={hourlyProfile.genKw}
            seriesB={hourlyProfile.useKw}
            labelA="Generation (kW)"
            labelB="Site load (kW)"
          />
        </div>
      </section>
    </div>
  );
}
