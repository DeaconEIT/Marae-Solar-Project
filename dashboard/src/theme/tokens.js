// Shared design tokens. Same "Dawn" palette as the marae's community screen
// (this is still Muriwai's colour identity), restyled for a desktop
// analytics tool: tighter radii, denser spacing, tabular numerals — built
// for reading tables and charts, not for a glanceable hero screen.
//
// Dark theme, but with real elevation: background and panel are two
// distinct, clearly different greys (not both near-black), so cards read
// as surfaces sitting above the page rather than everything blurring into
// one dark mass. Flat colours throughout — no gradients, no glow, no
// translucent glass overlays.
//
// Note on names: `cream` and `lilac` are the "Dawn" palette's names from
// the original dark community-screen app, repurposed here as the primary
// ink and secondary/muted text colours — kept so both apps can share this
// file's shape even though the exact values differ.

export const color = {
  bg: '#17171b', // page background — dark grey, not black

  sun: '#e0a850',
  ochre: '#d08259', // kōkōwai [first-draft]
  flax: '#6cb490', // flax green — used for positive/export figures
  cream: '#f0efec', // primary text ink (near-white, not pure white)
  lilac: '#9d9da5', // secondary/muted text

  panel: '#232329', // card surface — clearly lighter than bg for real elevation
  panelAlt: '#2c2c33', // flat, striped rows / hover states
  panelBorder: '#39393f', // flat border colour
  panelBorderStrong: '#4d4d55',

  positive: '#6cb490',
  negative: '#d08259',
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
