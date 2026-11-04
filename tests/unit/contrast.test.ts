// Step 13: the colour tokens keep their contrast (WCAG 2.2 AA). Pairs from README "Design
// tokens" and AUDIT-v6 §2, read from tokens.css, so a token change can't quietly drop below.
// Translucent tints are composited over the background they sit on.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const tokens = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6}|rgba\([^)]+\))/g)].map((m) => [m[1], m[2]]));

type Rgb = [number, number, number];

function color(name: string, under: Rgb = [255, 255, 255]): Rgb {
  const value = tokens[name];
  if (!value) throw new Error(`no token --${name}`);
  if (value.startsWith('#')) return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
  const [r, g, b, a] = value.match(/[\d.]+/g)!.map(Number);
  return [r, g, b].map((c, i) => c * a + under[i] * (1 - a)) as Rgb;
}

function luminance(c: Rgb): number {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast of `fg` on `bg`; `over` is what a translucent `bg` sits on. */
function contrast(fg: string, bg: string, over = 'surface'): number {
  const back = color(bg, color(over));
  const [hi, lo] = [luminance(color(fg, back)), luminance(back)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// [text, background, what a translucent background sits on]
const TEXT: [string, string, string?][] = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['ink', 'row-hover'],
  ['ink', 'paper-2'],
  ['secondary', 'surface'],
  ['secondary', 'canvas'],
  ['secondary', 'paper-2'],
  ['muted', 'surface'],
  ['muted', 'canvas'],
  ['muted', 'row-hover'],
  ['teal-deep', 'surface'],
  ['teal-deep', 'canvas'],
  ['teal-deep', 'row-hover'],
  ['teal-deep', 'teal-tint-13', 'surface'],
  ['teal-deep', 'teal-tint-13', 'canvas'],
  ['teal-deep', 'teal-tint-22', 'surface'],
  ['teal-deep', 'teal-tint-14', 'surface'],
  ['on-teal', 'teal'],
  ['on-ink', 'ink'],
  ['paper', 'ink'],
  ['tb-red', 'surface'],
  ['tb-red', 'canvas'],
  ['on-film', 'film'],
  ['film-muted', 'film'],
  ['tb-red-on-film', 'film'],
  ['teal-on-film', 'film'],
];

// Controls, chart marks and icons: 3:1 (WCAG 1.4.11).
const NON_TEXT: [string, string][] = [
  ['control-edge', 'surface'],
  ['control-edge', 'separator'],
  ['teal', 'surface'],
  ['tb-red', 'surface'],
  ['chevron', 'surface'],
  ['dot', 'canvas'],
  ['dot', 'surface'],
  ['dot-on-film', 'film'],
];

describe('token contrast', () => {
  it.each(TEXT)('text %s on %s (over %s): at least 4.5:1', (fg, bg, over) => {
    expect(contrast(fg, bg, over)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT)('%s on %s: at least 3:1', (fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  it("matches the README's stated ratios", () => {
    expect(contrast('ink', 'canvas').toFixed(1)).toBe('14.7');
    expect(contrast('muted', 'surface').toFixed(1)).toBe('6.3');
    expect(contrast('tb-red', 'canvas').toFixed(1)).toBe('5.2');
    expect(contrast('teal-deep', 'teal-tint-13').toFixed(1)).toBe('7.1');
  });
});
