import { color, font, space } from '../theme/tokens';
import KpiCard from '../components/KpiCard';
import StackedBarChart from '../components/StackedBarChart';
import { IconSun, IconLeaf, IconArrow, IconBars } from '../components/icons';
import { exportSharePct, selfConsumptionPct, periodLabel, formatDate } from '../lib/metrics';

export default function Overview({ data }) {
  const { site, daily, totals, avgDailyGenerationKwh, bestDay, worstDay } = data;
  const exportPct = exportSharePct(totals);
  const selfPct = selfConsumptionPct(totals);

  return (
    <div style={{ padding: space(6) }}>
      <div style={{ fontFamily: font.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: color.lilac, textTransform: 'uppercase' }}>
        {periodLabel(daily)} · {site}
      </div>
      <h1 style={{ fontFamily: font.display, fontSize: 32, fontWeight: 600, color: color.cream, margin: '6px 0 12px' }}>
        Generation &amp; export summary
      </h1>
      <p style={{ fontFamily: font.ui, fontSize: 15, color: color.lilac, marginTop: 0, marginBottom: 26, maxWidth: 620, lineHeight: 1.65 }}>
        In plain terms: the panels made <strong style={{ color: color.cream }}>{totals.generationKwh} kWh</strong> over
        this period. Most of that — <strong style={{ color: color.cream }}>{exportPct}%</strong> — went straight back
        to the grid because the marae wasn't using it at the time. That surplus is the thing worth putting a price on.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <KpiCard
          label="Total generation"
          value={totals.generationKwh}
          unit="kWh"
          accent={color.sun}
          Icon={IconSun}
          hint="All the solar power the panels made, added up."
        />
        <KpiCard
          label="Exported to grid"
          value={totals.gridExportKwh}
          unit="kWh"
          sub={`${exportPct}% of generation`}
          accent={color.sun}
          Icon={(p) => <IconArrow direction="up" {...p} />}
          hint="Sent to the grid because it wasn't needed on-site — this is the surplus a deal is about."
        />
        <KpiCard
          label="Used on-site"
          value={totals.selfUsedKwh}
          unit="kWh"
          sub={`${selfPct}% of generation`}
          accent={color.flax}
          Icon={IconLeaf}
          hint="Solar power the marae used itself, instead of paying to import it."
        />
        <KpiCard
          label="Imported from grid"
          value={totals.gridImportKwh}
          unit="kWh"
          accent={color.lilac}
          Icon={(p) => <IconArrow direction="down" {...p} />}
          hint="Bought from the grid when solar + battery weren't enough to cover use."
        />
        <KpiCard
          label="Avg daily generation"
          value={avgDailyGenerationKwh}
          unit="kWh"
          accent={color.cream}
          Icon={IconBars}
          hint="A typical day's output across this whole period."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
        <KpiCard
          label="Best day"
          value={bestDay.generationKwh}
          unit="kWh"
          sub={formatDate(bestDay.date)}
          accent={color.flax}
          hint="The sunniest, highest-output day on record."
        />
        <KpiCard
          label="Lowest day"
          value={worstDay.generationKwh}
          unit="kWh"
          sub={formatDate(worstDay.date)}
          accent={color.ochre}
          hint="The cloudiest day — useful for sizing what a worst case looks like."
        />
      </div>

      <div style={{ marginTop: space(9) }}>
        <div style={{ fontFamily: font.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', color: color.lilac, textTransform: 'uppercase', marginBottom: 6 }}>
          Daily generation — self-used vs exported
        </div>
        <p style={{ fontFamily: font.ui, fontSize: 13.5, color: color.lilac, marginTop: 0, marginBottom: 16, maxWidth: 560, lineHeight: 1.6 }}>
          Each bar is one day's total generation, split into what the marae used on-site
          (<span style={{ color: color.flax }}>green</span>) versus what was exported to the grid
          (<span style={{ color: color.sun }}>gold</span>). Hover a bar for the exact numbers.
        </p>
        <StackedBarChart daily={daily} />
      </div>
    </div>
  );
}
