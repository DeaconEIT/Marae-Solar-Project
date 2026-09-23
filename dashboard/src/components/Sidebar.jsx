import { color, font } from '../theme/tokens';
import { IconGrid, IconBars, IconHandshake, IconTable, IconDot } from './icons';

export const SCREENS = [
  { id: 'overview', label: 'Overview', Icon: IconGrid },
  { id: 'generation', label: 'Generation & export', Icon: IconBars },
  { id: 'deals', label: 'Deal modelling', Icon: IconHandshake },
  { id: 'raw', label: 'Raw data', Icon: IconTable },
];

export default function Sidebar({ screen, onChange, isLive, lastDate }) {
  return (
    <aside
      className="sidebar"
      style={{
        borderRight: `1px solid ${color.panelBorder}`,
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        background: color.panel,
      }}
    >
      <div>
        <div style={{ fontFamily: font.ui, fontSize: 10.5, letterSpacing: '0.12em', color: color.lilac, textTransform: 'uppercase' }}>
          Muriwai Trust
        </div>
        <div style={{ fontFamily: font.display, fontSize: 19, fontWeight: 600, color: color.cream, marginTop: 2 }}>
          Solar analytics
        </div>
        <p style={{ fontFamily: font.ui, fontSize: 12.5, color: color.lilac, marginTop: 8, lineHeight: 1.55 }}>
          What the sun made, what the marae used, and what's left over to put
          into a deal.
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SCREENS.map((item) => {
          const active = screen === item.id;
          const { Icon } = item;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                border: 'none',
                borderRadius: 8,
                background: active ? color.panelAlt : 'transparent',
                color: active ? color.cream : color.lilac,
                fontFamily: font.ui,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Icon />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', fontFamily: font.ui, fontSize: 12.5, color: color.lilac }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconDot color={isLive ? color.flax : color.lilac} className={isLive ? 'pulse-dot' : undefined} />
          {isLive ? 'Data file connected' : 'Using bundled sample'}
        </div>
        {lastDate && <div style={{ marginTop: 3 }}>Latest reading: {lastDate}</div>}
      </div>
    </aside>
  );
}
