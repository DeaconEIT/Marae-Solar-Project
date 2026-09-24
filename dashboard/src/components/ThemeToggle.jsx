import { color, font, radius } from '../theme/tokens';
import { IconSun, IconMoon } from './icons';

// Flips the `data-theme` attribute on <html>, which every colour in
// theme/tokens.js resolves through (see index.css) — no component needs
// to know the theme itself. Not persisted (no localStorage in this app),
// so it resets to dark on reload; that's an accepted tradeoff, not a bug.
export default function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onToggle(isLight ? 'dark' : 'light')}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        border: `1px solid ${color.panelBorder}`,
        borderRadius: radius.sm,
        background: 'transparent',
        color: color.cream,
        fontFamily: font.ui,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {isLight ? <IconMoon /> : <IconSun />}
      {isLight ? 'Dark mode' : 'Light mode'}
    </button>
  );
}
