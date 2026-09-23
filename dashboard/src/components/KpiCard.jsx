import { color, font, radius } from '../theme/tokens';

// A single stat block for the KPI row. Adds a plain-language `hint` under
// the number — not just what it's called, but what it means — plus an
// optional icon so the row reads as more than a grid of identical boxes.
export default function KpiCard({ label, value, unit, sub, hint, Icon, accent = color.cream }) {
  return (
    <div
      className="kpi-card"
      style={{
        border: `1px solid ${color.panelBorder}`,
        borderRadius: radius.md,
        padding: '16px 18px',
        background: color.panel,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: color.lilac }}>
        {Icon && <Icon style={{ color: accent, flexShrink: 0 }} />}
        <div style={{ fontFamily: font.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.01em' }}>{label}</div>
      </div>

      <div
        style={{
          fontFamily: font.number,
          fontSize: 28,
          fontWeight: 700,
          color: accent,
          marginTop: 8,
          lineHeight: 1.15,
          ...font.tabularNums,
        }}
      >
        {value}
        {unit && <span style={{ fontSize: 15, marginLeft: 4, color: color.lilac, fontFamily: font.ui, fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontFamily: font.ui, fontSize: 12.5, color: color.lilac, marginTop: 4 }}>{sub}</div>}
      {hint && (
        <div style={{ fontFamily: font.ui, fontSize: 12, color: color.lilac, marginTop: 8, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
