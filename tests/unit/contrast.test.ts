// Step 13: the colour tokens keep their contrast (WCAG 2.2 AA). Pairs from README "Design
// tokens" and AUDIT-v6 §2, read from tokens.css, so a token change can't quietly drop below.
// Translucent tints are composited over the background they sit on.
// Step 15.2 (V7): every pair is checked in both colour schemes. Dark is the light tokens with
// the dark block's values over them, so a translucent background is composited over the dark
// surface it sits on, and the tokens with no dark value (Film, the text on fills) keep theirs.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTokens, type Tokens } from './css-tokens.ts';

const { light, dark } = readTokens('src/styles/tokens.css');
const LIGHT = light;
const DARK = { ...light, ...dark };
const SCHEMES: [string, Tokens][] = [['light', LIGHT], ['dark', DARK]];

type Rgb = [number, number, number];

// Leaflet's white zoom buttons, attribution and popups (leaflet.css), and the lightest the
// map's tiles get. The map keeps these colours in dark mode (V7): no token has them.
const MAP_WHITE = '#FFFFFF';

/** A token's colour, or a hex colour written out (MAP_WHITE), over `under`. */
function color(T: Tokens, name: string, under: Rgb = [255, 255, 255]): Rgb {
  const value = name.startsWith('#') ? name : T[name];
  if (!value) throw new Error(`no token --${name}`);
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
  if (!value.startsWith('rgba(')) throw new Error(`--${name} is not a colour: ${value}`);
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

/**
 * Contrast of `fg` on `layers`: the background, then what it sits on, and so on down. A
 * translucent background with nothing named under it sits on the surface.
 */
function contrast(T: Tokens, fg: string, ...layers: string[]): number {
  const stack = layers.length === 1 ? [...layers, 'surface'] : layers;
  const back = stack.reduceRight<Rgb>((under, name) => color(T, name, under), [255, 255, 255]);
  const [hi, lo] = [luminance(color(T, fg, back)), luminance(back)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

type Pair = [string, ...string[]];
const named = (pairs: Pair[]) => pairs.map((p): [string, Pair] => [`${p[0]} on ${p.slice(1).join(' over ')}`, p]);

// [text, background, what a translucent background sits on …]
const TEXT: Pair[] = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['ink', 'row-hover'],
  ['secondary', 'surface'],
  ['secondary', 'canvas'],
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
  // The primary button's hover, with the owner's dark value (V16).
  ['on-teal', 'teal-hover'],
  // The info disc and the skip link fill with --ink-fill since dark mode (step 15.2; the same
  // colour as --ink in light), and so do the selected segment and the current language in
  // light. In dark those two take Ink with Surface text (V17, below).
  ['on-ink', 'ink-fill'],
  ['paper', 'ink-fill'],
  ['tb-red', 'surface'],
  ['tb-red', 'canvas'],
  ['on-film', 'film'],
  ['film-muted', 'film'],
  ['tb-red-on-film', 'film'],
  ['teal-on-film', 'film'],
  // Added with dark mode: Teal as ink (✓ marks, icons, link hover, chart labels) on the page
  // and on panels; text on the header, tab bar and Home sheet glass, over what they first sit
  // on; and the urgent screen's fixed colours.
  ['teal-ink', 'surface'],
  ['teal-ink', 'canvas'],
  ['ink', 'header-glass-bg', 'canvas'],
  ['ink', 'header-glass-bg', 'map-ground'],
  ['tb-red', 'header-glass-bg', 'map-ground'],
  ['ink', 'tabbar-glass-bg', 'canvas'],
  ['teal-deep', 'teal-tint-14', 'tabbar-glass-bg', 'canvas'],
  ['ink', 'sheet-glass-bg', 'map-ground'],
  ['secondary', 'sheet-glass-bg', 'map-ground'],
  ['tb-red', 'sheet-glass-bg', 'map-ground'],
  ['teal-deep', 'teal-tint-13', 'sheet-glass-bg', 'map-ground'],
  ['call-911-text', 'on-film'],
  ['call-911-text', 'call-911-hover'],
  ['on-film', 'film-soft', 'film'],
  ['on-film', 'film-soft-hover', 'film'],
];

// Paper 2 has no dark value (theme.css has none): nothing on screen uses it, which a test
// below keeps true, so these pairs exist in light only.
const TEXT_LIGHT_ONLY: Pair[] = [
  ['ink', 'paper-2'],
  ['secondary', 'paper-2'],
];

// Controls, chart marks and icons: 3:1 (WCAG 1.4.11).
const NON_TEXT: Pair[] = [
  ['control-edge', 'surface'],
  ['control-edge', 'separator'],
  ['teal', 'surface'],
  ['tb-red', 'surface'],
  ['chevron', 'surface'],
  ['dot', 'canvas'],
  ['dot', 'surface'],
  ['dot-on-film', 'film'],
  // Added with dark mode: the switch's knob, white on its Teal track (it was --surface), and
  // the route, its stops and "you are here" on the page.
  ['on-teal', 'teal'],
  ['teal', 'canvas'],
  ['tb-red', 'canvas'],
  // The focus ring inside the map, on its white controls and popups (places.css): the map's
  // own ink, which has no dark value.
  ['map-popup-text', MAP_WHITE],
];

describe.each(SCHEMES)('token contrast, %s', (_, T) => {
  it.each(named(TEXT))('text %s: at least 4.5:1', (_, [fg, ...layers]) => {
    expect(contrast(T, fg, ...layers)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(named(NON_TEXT))('%s: at least 3:1', (_, [fg, ...layers]) => {
    expect(contrast(T, fg, ...layers)).toBeGreaterThanOrEqual(3);
  });
});

describe('token contrast, light only', () => {
  it.each(named(TEXT_LIGHT_ONLY))('text %s: at least 4.5:1', (_, [fg, ...layers]) => {
    expect(contrast(LIGHT, fg, ...layers)).toBeGreaterThanOrEqual(4.5);
  });

  it('paper-2 and field, which have no dark value, are on no page', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));
    const users = files('src').filter((file) => file !== join('src', 'styles', 'tokens.css') && /--(paper-2|field)\b/.test(readFileSync(file, 'utf8')));
    expect(users).toEqual([]);
  });

  it("matches the README's stated ratios", () => {
    expect(contrast(LIGHT, 'ink', 'canvas').toFixed(1)).toBe('14.7');
    expect(contrast(LIGHT, 'muted', 'surface').toFixed(1)).toBe('6.3');
    expect(contrast(LIGHT, 'tb-red', 'canvas').toFixed(1)).toBe('5.2');
    expect(contrast(LIGHT, 'teal-deep', 'teal-tint-13').toFixed(1)).toBe('7.1');
  });
});

/** `T` with the 16% TB red that fills d2's gap (panels.ts gap, primitives.ts ts(): fo 0.16) as --gap. */
function withGap(T: Tokens): Tokens {
  const [r, g, b] = color(T, 'tb-red');
  return { ...T, gap: `rgba(${r}, ${g}, ${b}, 0.16)` };
}

// Where the design's dark values (theme.css, DotStory.dc.html's applyScheme) fell short of AA
// where they're used, and the owner's answers of 11 November 2026 (docs/decisions.md, V16 to
// V19). V16, the primary hover, is a TEXT pair above.
describe('dark values the owner decided on', () => {
  it('V17: a selected segment and the current language take an Ink fill with Surface text in dark (ink-fill was 2.05:1 on the surface); light keeps ink-fill', () => {
    expect(contrast(DARK, 'surface', 'ink')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK, 'ink', 'surface')).toBeGreaterThanOrEqual(3);
    expect(contrast(DARK, 'ink', 'header-glass-bg', 'canvas')).toBeGreaterThanOrEqual(3);
    expect(contrast(LIGHT, 'ink-fill', 'surface')).toBeGreaterThanOrEqual(3);
    expect(contrast(LIGHT, 'ink-fill', 'header-glass-bg', 'canvas')).toBeGreaterThanOrEqual(3);
  });

  it("V18: over the Places map, which stays light (V7), the bars turn solid in dark (on the glass, the current tab's label was 3.09:1)", () => {
    expect(contrast(DARK, 'teal-deep', 'teal-tint-14', 'surface')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK, 'ink', 'surface')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(LIGHT, 'teal-deep', 'teal-tint-14', 'tabbar-glass-bg', MAP_WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  // V19: accepted as they are. Pinned, so a change to any shows here.
  it("d2's \"Missed\" label (TB red, 15px bold) on its 16% TB red gap is 4.42:1, and 4.48:1 in light: under 4.5:1 in both", () => {
    expect(contrast(withGap(DARK), 'tb-red', 'gap', 'surface').toFixed(2)).toBe('4.42');
    expect(contrast(withGap(LIGHT), 'tb-red', 'gap', 'surface').toFixed(2)).toBe('4.48');
  });

  it('under 3:1 in dark only, each state also given in text: done against to go in progress and stop lines, and the dot story\'s died against fell-ill dots', () => {
    expect(contrast(DARK, 'teal', 'track').toFixed(2)).toBe('1.98');
    expect(contrast(DARK, 'ink', 'dot').toFixed(2)).toBe('2.50');
    expect(contrast(LIGHT, 'teal', 'track')).toBeGreaterThanOrEqual(3);
    expect(contrast(LIGHT, 'ink', 'dot')).toBeGreaterThanOrEqual(3);
  });

  it("d7's \"Not evaluated\" (dot) and \"Treatment failed\" (muted) swatches are 1.17:1 apart, and 1.80:1 in light; the legend gives each value", () => {
    expect(contrast(DARK, 'dot', 'muted').toFixed(2)).toBe('1.17');
    expect(contrast(LIGHT, 'dot', 'muted').toFixed(2)).toBe('1.80');
  });
});
