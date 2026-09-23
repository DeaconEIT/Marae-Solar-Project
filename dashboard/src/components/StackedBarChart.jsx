import { color, font } from '../theme/tokens';
import { formatDate } from '../lib/metrics';

// Stacked daily bars: self-used solar (flax) + exported solar (sun) = harvested.
// Plain inline SVG — real data, one bar per day on hand, no chart library.
export default function StackedBarChart({ daily, height = 220 }) {
  if (!daily.length) return null;

  const leftAxisW = 34;
  const width = Math.max(daily.length * 42, 320) + leftAxisW;
  const plotW = width - leftAxisW;
  const maxVal = Math.max(...daily.map((d) => d.generationKwh), 1);
  const barW = (plotW / daily.length) * 0.55;
  const gap = plotW / daily.length;
  const chartH = height - 30; // leave room for x-axis labels

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Daily solar harvested, split into self-used and exported">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1={leftAxisW}
            x2={width}
            y1={chartH - chartH * f}
            y2={chartH - chartH * f}
            stroke={color.panelBorder}
            strokeWidth="1"
          />
          <text x={leftAxisW - 6} y={chartH - chartH * f + 4} textAnchor="end" fontFamily={font.ui} fontSize="10.5" fill={color.lilac}>
            {Math.round(maxVal * f)}
          </text>
        </g>
      ))}
      {daily.map((d, i) => {
        const x = leftAxisW + i * gap + (gap - barW) / 2;
        const selfH = (d.selfUsedKwh / maxVal) * chartH;
        const exportH = (d.gridExportKwh / maxVal) * chartH;
        return (
          <g key={d.date}>
            <title>{`${formatDate(d.date)}: ${d.generationKwh} kWh generated (${d.selfUsedKwh} used on-site, ${d.gridExportKwh} exported)`}</title>
            <rect x={x} y={chartH - selfH} width={barW} height={selfH} fill={color.flax} rx="1.5" />
            <rect x={x} y={chartH - selfH - exportH} width={barW} height={exportH} fill={color.sun} rx="1.5" />
            <text
              x={x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              fontFamily={font.ui}
              fontSize="11"
              fill={color.lilac}
            >
              {formatDate(d.date).replace(' ', '')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
