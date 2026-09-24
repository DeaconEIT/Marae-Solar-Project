// Shared design tokens. Palette rebuilt around kōkōwai (red ochre), pango
// (black) and mā (white) — the traditional three-colour set seen in
// kōwhaiwhai and tukutuku panels — rather than the earlier purple/gold
// "Dawn" scheme. Restyled for a desktop analytics tool: tighter radii,
// denser spacing, tabular numerals — built for reading tables and charts,
// not for a glanceable hero screen.
//
// Dark theme, with real elevation: background and panel are two distinct,
// clearly different near-blacks (not both flat black), so cards read as
// surfaces sitting above the page. Flat colours throughout — no gradients,
// no glow, no translucent glass overlays.
//
// Only three hues in play — red, black, white — so the two data series
// that need telling apart (self-used vs exported, etc.) are red vs white/
// cream rather than reaching for an unrelated gold/green, with a second,
// darker red for negative/lowest-value accents.
//
// Note on names: `cream`, `lilac`, `sun`, `ochre`, `flax` are the original
// "Dawn" palette's token names, repurposed here for the red/black/white
// scheme — kept so both this app and the community screen can share this
// file's shape even though the exact values and roles now differ.
//
// Values are CSS custom properties, not hex literals, so the light/dark
// toggle (see ThemeToggle + App.jsx) can flip every colour at once by
// setting `data-theme` on <html> — see the variable definitions and both
// palettes in index.css. `black`/`white` here always mean "whichever pole
// contrasts with the current background", so self-used/positive stays
// legible in both themes without a second code path.

export const color = {
  bg: 'var(--bg)', // page background

  sun: 'var(--sun)', // kōkōwai red — primary accent (exported, highlights)
  ochre: 'var(--ochre)', // deeper red — negative/lowest-value accent
  flax: 'var(--flax)', // secondary data colour (self-used, positive)
  cream: 'var(--cream)', // primary text ink
  lilac: 'var(--lilac)', // secondary/muted text

  panel: 'var(--panel)', // card surface — distinct from bg for real elevation
  panelAlt: 'var(--panel-alt)', // flat, striped rows / hover states
  panelBorder: 'var(--panel-border)', // flat border colour
  panelBorderStrong: 'var(--panel-border-strong)',

  positive: 'var(--positive)',
  negative: 'var(--negative)',
};

export const font = {
  display: `'Fraunces', Georgia, serif`, // headings/titles
  number: `'Space Grotesk', 'Inter', system-ui, sans-serif`, // KPI values, table figures
  ui: `'Inter', system-ui, sans-serif`,
  tabularNums: { fontVariantNumeric: 'tabular-nums' },
};

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  pill: '999px',
};

export const space = (n) => `${n * 4}px`;

export const shadow = {
  panel: '0 4px 16px rgba(0, 0, 0, 0.25)',
};
