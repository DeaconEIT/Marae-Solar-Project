import { color, font } from '../theme/tokens';

// Two overlaid lines (generation vs use, by hour) — shows WHEN surplus/export
// happens in the day, which is what a time-of-use or PPA conversation needs.
export default function DualLineChart({ hours, seriesA, seriesB, labelA, labelB, width = 640, height = 220 }) {
  const leftAxisW = 30;
  const plotW = width - leftAxisW;
  const max = Math.max(...seriesA, ...seriesB, 0.1);
  const chartH = height - 30;
  const stepX = plotW / (hours.length - 1 || 1);

  const toPoints = (series) =>
    series.map((v, i) => [leftAxisW + i * stepX, chartH - (v / max) * chartH]);

  const toPath = (points) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');

  const pointsA = toPoints(seriesA);
  const pointsB = toPoints(seriesB);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={`${labelA} vs ${labelB} by hour`}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={leftAxisW} x2={width} y1={chartH - chartH * f} y2={chartH - chartH * f} stroke={color.panelBorder} strokeWidth="1" />
            <text x={leftAxisW - 6} y={chartH - chartH * f + 4} textAnchor="end" fontFamily={font.ui} fontSize="10.5" fill={color.lilac}>
              {(max * f).toFixed(1)}
            </text>
          </g>
        ))}
        <path d={toPath(pointsA)} fill="none" stroke={color.sun} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(pointsB)} fill="none" stroke={color.lilac} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
        {hours.map((h, i) => (
          i % 2 === 0 && (
            <text key={h} x={leftAxisW + i * stepX} y={height - 8} textAnchor="middle" fontFamily={font.ui} fontSize="11" fill={color.lilac}>
              {h}:00
            </text>
          )
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 18, marginTop: 6, fontFamily: font.ui, fontSize: 13, color: color.lilac, fontWeight: 500 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 3, background: color.sun, display: 'inline-block', borderRadius: 2 }} />
          {labelA}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 0, display: 'inline-block', borderTop: `3px dashed ${color.lilac}` }} />
          {labelB}
        </span>
      </div>
    </div>
  );
}
