// Small hand-set of line icons, drawn to match this app's stroke weight and
// corner treatment rather than pulled from a generic icon set or emoji.
const common = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function IconSun(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
    </svg>
  );
}

export function IconFlow(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <path d="M4 6h5.5a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3H20" />
      <path d="M16.5 15.5 20 18l-3.5 2.5M7.5 8.5 4 6l3.5-2.5" />
    </svg>
  );
}

export function IconBars(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <path d="M5 20V11M12 20V4M19 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function IconLeaf(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <path d="M5 19c8.5 0 14-5.5 14-14-8.5 0-14 5.5-14 14Z" />
      <path d="M5 19c0-5 2.2-8.2 6-10.5" />
    </svg>
  );
}

export function IconBattery(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <rect x="3" y="7" width="15" height="10" rx="2" />
      <path d="M20 10.5v3" />
      <path d="M6 10.5v3.5" fill="currentColor" stroke="none" opacity="0.001" />
      <rect x="6" y="9.5" width="3.2" height="5" rx="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBook(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <path d="M4 5.5c2-1 5-1 8 0v13c-3-1-6-1-8 0Z" />
      <path d="M20 5.5c-2-1-5-1-8 0v13c3-1 6-1 8 0Z" />
    </svg>
  );
}

export function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.4" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.4" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.4" />
    </svg>
  );
}

export function IconTable(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.6" />
      <path d="M3.5 9.5h17M9.5 9.5v10" />
    </svg>
  );
}

export function IconHandshake(props) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" {...common} {...props}>
      <path d="M3 11.5 7 8l3.2 2.4a1.6 1.6 0 0 0 2.2-.3l.2-.3a1.6 1.6 0 0 0-.2-2.2L10 5.5" />
      <path d="M21 11.5 17 8l-2.5 1.9" />
      <path d="M3 11.5l4.5 5a1.8 1.8 0 0 0 2.6.1l.4-.4a1.5 1.5 0 0 0 2.2 0l.5-.5a1.5 1.5 0 0 0 2.2 0l.4-.4a1.6 1.6 0 0 0 .1-2.2" />
      <path d="M21 11.5l-4.5 5" />
    </svg>
  );
}

export function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" {...common} {...props}>
      <path d="M12 3.5v11.5M7.5 11l4.5 4.5L16.5 11" />
      <path d="M4 17.5v1.8a1.7 1.7 0 0 0 1.7 1.7h12.6a1.7 1.7 0 0 0 1.7-1.7v-1.8" />
    </svg>
  );
}

export function IconArrow({ direction = 'up', ...props }) {
  const d = direction === 'up' ? 'M6 16 16 6M16 6H8M16 6v8' : 'M6 6l10 10M16 16H8M16 16V8';
  return (
    <svg viewBox="0 0 22 22" width="14" height="14" stroke="currentColor" {...common} {...props}>
      <path d={d} />
    </svg>
  );
}

export function IconDot({ color: c = 'currentColor', size = 6, className }) {
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} aria-hidden="true" className={className}>
      <circle cx="4" cy="4" r="4" fill={c} />
    </svg>
  );
}
