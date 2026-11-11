// Step 15.2, dark mode (V7): tokens.css keeps every light value it had before dark mode
// (9075def), byte for byte, and takes its dark values from design/v8/theme.css, token by token.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readTokens } from './css-tokens.ts';

const tokens = readTokens('src/styles/tokens.css');
// theme.css's tokens, by their names after --tb-.
const unprefixed = (all: Record<string, string>) => Object.fromEntries(Object.entries(all).map(([name, value]) => [name.replace(/^tb-/, ''), value]));
const v8 = readTokens('design/v8/theme.css');
const theme = { light: unprefixed(v8.light), dark: unprefixed(v8.dark) };

// tokens.css's :root at 9075def, the commit before dark mode.
const AT_9075DEF: Record<string, string> = {
  canvas: '#F1F3F4',
  surface: '#FFFFFF',
  ink: '#14212B',
  secondary: '#3F4B53',
  muted: '#56626A',
  'control-edge': '#7A858C',
  separator: '#E3E6E8',
  track: '#DADDE0',
  'link-underline': '#9AA3A8',
  chevron: '#8A949A',
  'row-hover': '#F6F8F8',
  grabber: '#C3C9CD',
  scrim: 'rgba(20, 33, 43, 0.32)',
  teal: '#1E6B70',
  'teal-deep': '#175458',
  'teal-tint-13': 'rgba(30, 107, 112, 0.13)',
  'teal-tint-22': 'rgba(30, 107, 112, 0.22)',
  'teal-tint-14': 'rgba(30, 107, 112, 0.14)',
  'on-teal': '#FFFFFF',
  'on-ink': '#FFFFFF',
  'tb-red': '#C42032',
  'map-ground': '#DCE6E5',
  film: '#0E1A22',
  'film-muted': '#A9B4BA',
  'film-rule': '#33434D',
  dot: '#7A8C97',
  'dot-on-film': '#8FA1AC',
  'tb-red-on-film': '#F0646C',
  'teal-on-film': '#6FB5B9',
  'paper-2': '#E8E4DA',
  'on-film': '#FFFFFF',
  'map-popup-link': '#175458',
  'map-popup-text': '#14212B',
  paper: '#F2F0EA',
  field: '#FBFAF6',
  rule: '#D9D5CB',
  'glass-blur': 'blur(24px) saturate(1.5)',
  'glass-blur-sheet': 'blur(28px) saturate(1.5)',
  'header-glass-bg': 'rgba(255, 255, 255, 0.72)',
  'header-glass-edge': 'rgba(20, 33, 43, 0.12)',
  'tabbar-glass-bg': 'rgba(255, 255, 255, 0.68)',
  'tabbar-glass-edge': 'rgba(255, 255, 255, 0.7)',
  'tabbar-shadow': '0 10px 30px rgba(20, 33, 43, 0.16)',
  'sheet-glass-bg': 'rgba(255, 255, 255, 0.64)',
  'sheet-glass-edge': 'rgba(255, 255, 255, 0.75)',
  'sheet-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 20px 50px rgba(20, 33, 43, 0.16)',
  'font-body': 'var(--font-atkinson)',
  'font-wordmark': 'var(--font-newsreader)',
  'text-h1': 'clamp(2.125rem, 1.7rem + 1.8vw, 2.875rem)',
  'text-h2-route': 'clamp(1.5rem, 1.3rem + 0.9vw, 1.875rem)',
  'text-h2-nomatch': 'clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)',
  'text-h3-stop': 'clamp(1.25rem, 1.15rem + 0.4vw, 1.4375rem)',
  'text-20': 'max(20px, 1.25rem)',
  'text-19': 'max(19px, 1.1875rem)',
  'text-18': 'max(18px, 1.125rem)',
  'text-17': 'max(17px, 1.0625rem)',
  'text-16': 'max(16px, 1rem)',
  'text-15': 'max(15px, 0.9375rem)',
  'text-14': 'max(14px, 0.875rem)',
  'radius-sheet': '30px',
  'radius-tab': '26px',
  'radius-group': '18px',
  'radius-input': '16px',
  'radius-chip': '8px',
  'radius-capsule': '999px',
  'radius-track': '3px',
  'radius-toggle': '6px',
  'radius-skip': '4px',
  'space-4': '4px',
  'space-8': '8px',
  'space-12': '12px',
  'space-16': '16px',
  'space-24': '24px',
  'space-32': '32px',
  'space-48': '48px',
  'space-72': '72px',
  'space-112': '112px',
  container: '1120px',
  'container-wide': '1280px',
  reading: '760px',
  'reading-check': '640px',
  'tabbar-h': '70px',
  'focus-ring': '3px solid var(--ink)',
  'focus-ring-on-film': '3px solid var(--paper)',
};

// Tokens added with dark mode. Their light values are the ones the rules they replace had, so
// light mode is unchanged: a role that was one token in light and is two in theme.css (Ink and
// Ink as a fill; Teal, Teal as ink, its text and its hover), and the urgent Film screen's fixed
// colours (check.css had the soft buttons' as literals).
const ADDED: Record<string, string> = {
  'ink-fill': AT_9075DEF.ink,
  'teal-ink': AT_9075DEF.teal,
  'teal-hover': AT_9075DEF['teal-deep'],
  'call-911-text': AT_9075DEF['tb-red'],
  'call-911-hover': AT_9075DEF.canvas,
  'film-soft': 'rgba(255, 255, 255, 0.16)',
  'film-soft-hover': 'rgba(255, 255, 255, 0.26)',
};

// Each token with a dark value, and the theme.css token with the same light value and role.
const THEME: Record<string, string> = {
  canvas: 'canvas',
  surface: 'surface',
  ink: 'ink',
  'ink-fill': 'ink-fill',
  secondary: 'secondary',
  muted: 'muted',
  'control-edge': 'control',
  separator: 'separator',
  track: 'track',
  'link-underline': 'underline',
  chevron: 'chevron',
  'row-hover': 'row-hover',
  grabber: 'rule2',
  scrim: 'scrim-32',
  teal: 'accent',
  'teal-ink': 'accent-ink',
  'teal-deep': 'accent-text',
  'teal-tint-13': 'tint-13',
  'teal-tint-14': 'tint-14',
  'teal-tint-22': 'tint-22',
  'tb-red': 'red',
  'map-ground': 'map-ground',
  dot: 'dot',
  rule: 'rule',
  'header-glass-bg': 'glass-72',
  'header-glass-edge': 'shadow-12',
  'tabbar-glass-bg': 'glass-68',
  'tabbar-glass-edge': 'glass-70',
  'sheet-glass-bg': 'glass-64',
  'sheet-glass-edge': 'glass-75',
};
// Dark values the owner chose over theme.css's (docs/decisions.md): the theme.css token each one
// follows for its light value and role, and the owner's dark value.
const OWNER: Record<string, [string, string]> = {
  'teal-hover': ['accent-hover', '#288287'], // V16: white text at 4.5:1 or more (theme.css: #2A878C)
};
// Shadows are whole values here; theme.css has their colours.
const SHADOWS: Record<string, string[]> = { 'tabbar-shadow': ['shadow-16'], 'sheet-shadow': ['glass-85', 'shadow-16'] };
// theme.css tokens the site has no use for: no v8 page uses them either. (Film's soft buttons
// have their light values, but keep them in dark mode, V7: they're --film-soft*.)
const UNUSED = ['glass-hi-16', 'glass-hi-26'];

/** One spelling for a colour: hex in capitals, rgba() without spaces or trailing zeros. */
function norm(value: string): string {
  return value
    .trim()
    .replace(/rgba\(([^)]*)\)/gi, (_, args: string) => `rgba(${args.split(',').map((a) => String(parseFloat(a))).join(',')})`)
    .replace(/#[0-9a-f]{6}\b/gi, (hex) => hex.toUpperCase());
}

describe('light values (step 15.2)', () => {
  it('every token keeps its value from before dark mode, byte for byte', () => {
    expect(Object.fromEntries(Object.keys(AT_9075DEF).map((name) => [name, tokens.light[name]]))).toEqual(AT_9075DEF);
  });

  it('the tokens dark mode added have the light values of the ones they split from', () => {
    expect(Object.fromEntries(Object.keys(ADDED).map((name) => [name, tokens.light[name]]))).toEqual(ADDED);
    expect(Object.keys(tokens.light).sort()).toEqual([...Object.keys(AT_9075DEF), ...Object.keys(ADDED)].sort());
  });
});

describe('dark values from design/v8/theme.css (V7)', () => {
  it('apply on screen only, so a dark system setting prints light', () => {
    expect(tokens.darkQuery).toBe('screen and (prefers-color-scheme: dark)');
  });

  it('every theme.css token is ported or known to be unused', () => {
    const ported = new Set([...Object.values(THEME), ...Object.values(OWNER).map(([tb]) => tb), ...Object.values(SHADOWS).flat(), ...UNUSED]);
    expect(Object.keys(theme.light).filter((name) => !ported.has(name))).toEqual([]);
    expect(Object.keys(theme.dark).sort()).toEqual(Object.keys(theme.light).sort());
  });

  it.each(Object.entries(THEME))('--%s is --tb-%s: the same light value, and its dark value', (name, tb) => {
    expect(norm(tokens.light[name])).toBe(norm(theme.light[tb]));
    expect(norm(tokens.dark[name])).toBe(norm(theme.dark[tb]));
  });

  it.each(Object.entries(OWNER))("--%s keeps theme.css's light value and takes the owner's dark value", (name, [tb, dark]) => {
    expect(norm(tokens.light[name])).toBe(norm(theme.light[tb]));
    expect(norm(tokens.dark[name])).toBe(norm(dark));
  });

  it.each(Object.entries(SHADOWS))('--%s takes the dark colours of --tb-%s', (name, parts) => {
    let light = norm(tokens.light[name]);
    for (const tb of parts) expect(light).toContain(norm(theme.light[tb]));
    for (const tb of parts) light = light.replace(norm(theme.light[tb]), norm(theme.dark[tb]));
    expect(norm(tokens.dark[name])).toBe(light);
  });

  it('only those tokens change in dark mode: the Film screen, the map popups and the rest keep theirs', () => {
    expect(Object.keys(tokens.dark).sort()).toEqual([...Object.keys(THEME), ...Object.keys(OWNER), ...Object.keys(SHADOWS)].sort());
  });

  it('the dot story canvas gets the applyScheme palette (DotStory.dc.html)', () => {
    const story = readFileSync('design/v8/DotStory.dc.html', 'utf8');
    const dark = /dark \? \{ canvas: '([^']+)', ink: '([^']+)', dot: '([^']+)', muted: '([^']+)', sep: '([^']+)', red: '([^']+)' \}/.exec(story);
    expect(dark?.slice(1)).toEqual(['canvas', 'ink', 'dot', 'muted', 'separator', 'tb-red'].map((name) => tokens.dark[name]));
  });
});
