// Step 15.3, phone feel: the mobile-native skill's "Never ship" table, checked on src/, with
// the brief's minimum (docs/step-15-fix-pass.md) and design/v8/theme.css's phone-feel rules.
// What only a phone can show (a press under a finger, the toolbar, the installed app's
// bounce) is on the owner's device list; tests/e2e/shell.spec.ts checks the computed styles.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTokens } from './css-tokens.ts';

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : /\.(css|astro|tsx?|m?js)$/.test(entry.name) ? [path] : [];
  });
}

const FILES = walk('src').sort();
const text = new Map(FILES.map((file) => [file, readFileSync(file, 'utf8')]));
const read = (file: string) => text.get(file) ?? readFileSync(file, 'utf8');

/** A style rule: its selectors, the at-rules around it (outermost first) and its declarations. */
type Rule = { file: string; selectors: string[]; at: string[]; decls: [string, string][] };

/** The style rules of a stylesheet, braces counted (src/styles has no nesting and no braces in strings). */
function parse(file: string): Rule[] {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  const rules: Rule[] = [];
  const open: string[] = [];
  let from = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      open.push(css.slice(from, i).trim());
      from = i + 1;
    } else if (css[i] === '}') {
      const prelude = open.pop();
      if (prelude === undefined) throw new Error(`${file}: an unmatched }`);
      if (!prelude.startsWith('@')) {
        const decls = css
          .slice(from, i)
          .split(';')
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d): [string, string] => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]);
        rules.push({ file, selectors: prelude.split(',').map((s) => s.trim().replace(/\s+/g, ' ')), at: open.filter((p) => p.startsWith('@')), decls });
      }
      from = i + 1;
    }
  }
  if (open.length) throw new Error(`${file}: ${open.length} unclosed blocks`);
  return rules;
}

const RULES = FILES.filter((f) => f.endsWith('.css')).flatMap(parse);
const where = (r: Rule) => `${r.file}: ${r.selectors.join(', ')}${r.at.length ? ` in ${r.at.join(' ')}` : ''}`;
const value = (r: Rule, property: string) => r.decls.filter(([p]) => p === property).map(([, v]) => v);
/** The rules with exactly these selectors, optionally only inside an at-rule matching `at`. */
const rulesFor = (selectors: string, at?: RegExp) => RULES.filter((r) => r.selectors.join(', ') === selectors && (!at || r.at.some((a) => at.test(a))));
/** The last value a rule gives `property`: the one the browser uses where it reads them all. */
const last = (r: Rule, property: string) => value(r, property).at(-1);
/** global.css's own top-level rule for `selectors`. */
const base = (selectors: string) => {
  const found = rulesFor(selectors).filter((r) => r.file === join('src', 'styles', 'global.css') && !r.at.length);
  if (found.length !== 1) throw new Error(`global.css: ${found.length} top-level ${selectors} rules, expected 1`);
  return found[0];
};

const HOVER_GATE = /^@media \(hover: hover\) and \(pointer: fine\)$/;
/** Leaflet's own stylesheet, which placesMap.ts loads with the map (outside src/). */
const LEAFLET_CSS = 'node_modules/leaflet/dist/leaflet.css';

describe('phone feel (step 15.3, mobile-native "Never ship")', () => {
  it('the walker reads every stylesheet', () => {
    expect(RULES.length).toBeGreaterThan(400);
    expect(new Set(RULES.map((r) => r.file)).size).toBe(FILES.filter((f) => f.endsWith('.css')).length);
  });

  it('never turns zoom off (user-scalable=no, maximum-scale)', () => {
    expect(FILES.filter((f) => /user-scalable|maximum-scale/i.test(read(f)))).toEqual([]);
    expect(read('src/layouts/BaseLayout.astro')).toContain('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
  });

  it('every :hover rule sits behind (hover: hover) and (pointer: fine), and no script fakes hover', () => {
    const hover = RULES.filter((r) => r.selectors.some((s) => s.includes(':hover')));
    expect(hover.length).toBeGreaterThan(20);
    expect(hover.filter((r) => !r.at.some((a) => HOVER_GATE.test(a))).map(where)).toEqual([]);
    expect(FILES.filter((f) => !f.endsWith('.css') && /:hover|onmouse(enter|over)|['"]mouse(enter|over)['"]/i.test(read(f)))).toEqual([]);
  });

  it('page shells and the bottom sheet follow the visible height (dvh)', () => {
    // No vh fallback: every browser the build targets has dvh and svh (Vite's baseline:
    // Safari and iOS 16.4, Chrome 111, Firefox 114), and Lightning CSS drops one anyway.
    for (const [selector, property, unit] of [
      ['body', 'min-height', '100dvh'],
      ['.page', 'min-height', '100dvh'],
      ['.sheet', 'max-height', '88dvh'],
    ] as const) {
      const [rule, ...more] = rulesFor(selector).filter((r) => value(r, property).length);
      expect(more, `${selector}: one rule sets ${property}`).toEqual([]);
      expect(value(rule, property), selector).toEqual([unit]);
    }
    // dvh nowhere else: it resizes while the page scrolls, wrong for a hero or a stage.
    expect(RULES.filter((r) => r.decls.some(([, v]) => /\bdvh\b|\d+dvh/.test(v))).map((r) => r.selectors.join(', ')).sort()).toEqual(['.page', '.sheet', 'body']);
    expect(FILES.filter((f) => /\d(lvh|dvh|svh)\b/.test(read(f)) && !f.endsWith('.css'))).toEqual([]);
    expect(RULES.filter((r) => r.decls.some(([, v]) => /\d+lvh/.test(v))).map(where)).toEqual([]);
  });

  it("the dot story's sticky stage takes the small viewport (svh) on phones and wide screens", () => {
    // Phones: --stage-h, with svh where supported (a custom property can't fall back line by line).
    const [phone] = rulesFor('.story', /^@supports \(height: 1svh\)$/);
    expect(value(phone, '--stage-h')).toEqual(['max(300px, min(52svh, 115vw))']);
    const [wide] = rulesFor('.story-stage', /^@media \(min-width: 60em\)$/);
    expect(value(wide, 'height')).toEqual(['calc(100svh - 65px - var(--nav-h))']);
    const [step] = rulesFor('.story-step').filter((r) => !r.at.length);
    expect(last(step, 'min-height')).toMatch(/100svh/);
  });

  it('every other height in vh is a content height, or has a dvh or svh line after it', () => {
    // Content, not a shell or anything pinned to the bottom: the loading list's placeholder
    // (B66), the map's clamp, the dot story's wide steps (90vh, as v8), the phone stage's
    // fallback before @supports.
    const CONTENT = ['.places-results:has(> .results-status)', '.map', '.story-step in @media (min-width: 60em)', '.story'];
    const bare = RULES.filter((r) => r.decls.some(([p, v]) => /^(min-|max-)?height$|^--stage-h$/.test(p) && /\d+vh\b/.test(v)))
      .filter((r) => !r.decls.some(([, v]) => /\d+(dvh|svh)\b/.test(v)))
      .map((r) => `${r.selectors.join(', ')}${r.at.length ? ` in ${r.at.join(' ')}` : ''}`);
    expect(bare.sort()).toEqual(CONTENT.sort());
  });

  it('no tap flash, and controls take a tap at once (touch-action: manipulation)', () => {
    expect(value(base('html'), '-webkit-tap-highlight-color')).toEqual(['transparent']);
    // Leaflet sets its own blue flash on the map's links.
    expect(value(rulesFor('.map a[href]')[0], '-webkit-tap-highlight-color')).toEqual(['transparent']);
    const manipulation = RULES.filter((r) => value(r, 'touch-action').includes('manipulation')).flatMap((r) => r.selectors);
    expect(manipulation).toEqual(expect.arrayContaining(['a', 'button', 'input', 'select', 'textarea', 'label', 'summary', "[role='button']", "[role='tab']", "[role='option']", "[role='switch']"]));
  });

  it('touch-action: none only on the Filters sheet’s drag strip, which takes every touch itself', () => {
    expect(RULES.filter((r) => value(r, 'touch-action').includes('none')).map(where)).toEqual(['src/styles/ui.css: .sheet-grab']);
  });

  it('on a touch screen one finger scrolls the page past the Places map (audit O9, V22)', () => {
    // Leaflet's one-finger drag is off where the main pointer is a finger, by capability.
    expect(read('src/islands/placesMap.ts')).toMatch(/L\.map\(el, \{[^}]*\bdragging: !matchMedia\('\(pointer: coarse\)'\)\.matches,/);
    // Leaflet's own CSS sets touch-action: none only with its drag handler's class, so without
    // it the map is pan-x pan-y: one finger pans the page, and pinches stay the map's. An
    // upgrade that changes this fails here.
    const leaflet = parse(LEAFLET_CSS).filter((r) => value(r, 'touch-action').length);
    expect(leaflet.map((r) => [r.selectors.join(', '), last(r, 'touch-action')])).toEqual([
      ['.leaflet-container.leaflet-touch-zoom', 'pan-x pan-y'],
      ['.leaflet-container.leaflet-touch-drag', 'pinch-zoom'],
      ['.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom', 'none'],
    ]);
  });

  it("Leaflet's own hover looks show only with a mouse, and its focus looks only for a keyboard (V22)", () => {
    const leaflet = parse(LEAFLET_CSS);
    const one = (selectors: string) => {
      const found = leaflet.filter((r) => r.selectors.join(', ') === selectors);
      if (found.length !== 1) throw new Error(`leaflet.css: ${found.length} ${selectors} rules, expected 1`);
      return found[0];
    };
    const places = join('src', 'styles', 'places.css');
    /** places.css's declarations for `selector`: top level, or behind the hover gate. */
    const ours = (selector: string, gated = false) =>
      rulesFor(selector)
        .filter((r) => r.file === places && (gated ? r.at.length === 1 && HOVER_GATE.test(r.at[0]) : !r.at.length))
        .flatMap((r) => r.decls);
    // Leaflet 1.9.4's hover rules, each with :focus, which a tap can give a link. A new one fails here.
    const MAP = [
      ['.leaflet-bar a', 'background-color', '.map .leaflet-bar a[href]:not(.leaflet-disabled)'],
      ['.leaflet-control-attribution a', 'text-decoration', '.map .leaflet-control-attribution a[href]'],
      ['.leaflet-container a.leaflet-popup-close-button', 'color', '.map .leaflet-popup a.leaflet-popup-close-button[href]'],
    ] as const;
    expect(leaflet.filter((r) => r.selectors.some((s) => s.includes(':hover'))).map((r) => r.selectors.join(', '))).toEqual(MAP.map(([s]) => `${s}:hover, ${s}:focus`));
    for (const [theirs, property, mine] of MAP) {
      const resting = last(one(theirs), property);
      const hovered = last(one(`${theirs}:hover, ${theirs}:focus`), property);
      expect(resting && hovered && resting !== hovered, theirs).toBeTruthy();
      // The resting look, restated above Leaflet's :hover and :focus; the hover look for a
      // mouse; the focus look for a keyboard. Leaflet's values, so a mouse sees no change.
      expect(ours(mine), mine).toEqual([[property, resting]]);
      expect(ours(`${mine}:hover`, true), `${mine}:hover`).toEqual([[property, hovered]]);
      expect(ours(`${mine}:focus-visible`), `${mine}:focus-visible`).toEqual([[property, hovered]]);
    }
  });

  it('a press shows at once, on :active (v8: 0.82), with the listener iOS needs for it', () => {
    const [pressed, ...more] = RULES.filter((r) => r.selectors.some((s) => s.endsWith(':active')));
    expect(more.map(where)).toEqual([]);
    expect(pressed.selectors).toEqual(['a:active', 'button:not(:disabled):active', 'summary:active', "[role='button']:active", "[role='tab']:active", '[data-choice]:active']);
    expect(pressed.at).toEqual([]);
    expect(value(pressed, 'opacity')).toEqual(['0.82']);
    expect(read('src/scripts/press.ts')).toContain("document.addEventListener('touchstart', () => {}, { passive: true });");
    expect(read('src/layouts/BaseLayout.astro')).toContain("import '../scripts/press.ts';");
  });

  it('no touchmove handler calls preventDefault: overscroll is CSS', () => {
    /** The brace-balanced block from the first { at or after `at`. */
    const block = (source: string, at: number) => {
      const start = source.indexOf('{', at);
      let depth = 0;
      for (let i = start; i < source.length; i++) {
        depth += source[i] === '{' ? 1 : source[i] === '}' ? -1 : 0;
        if (!depth) return source.slice(start, i + 1);
      }
      throw new Error('an unclosed block');
    };
    let handlers = 0;
    for (const file of FILES) {
      const source = read(file);
      expect(/addEventListener\(\s*['"]touchmove/.test(source), `${file}: a touchmove listener`).toBe(false);
      for (const m of source.matchAll(/function onTouch\w+\(/g)) {
        handlers++;
        expect(block(source, m.index), `${file}: ${m[0]}`).not.toContain('preventDefault');
      }
    }
    expect(handlers).toBe(4); // the Filters sheet's drag (src/ui/controls.tsx)
  });

  it('the installed app has no overscroll; the browser keeps its own', () => {
    const none = RULES.filter((r) => r.decls.some(([p, v]) => /^overscroll-behavior(-y)?$/.test(p) && v === 'none'));
    expect(none.map(where)).toEqual(['src/styles/global.css: html, body in @media (display-mode: standalone)']);
    // Inner scrollers stop at their ends instead of moving the page.
    expect(value(rulesFor('.sheet-body')[0], 'overscroll-behavior')).toEqual(['contain']);
  });

  it('user-select: none is on controls only, never on content people copy', () => {
    const CONTROL = /(^|[\s>])(button|summary)$|^\[role='(tab|switch)'\]$|^\[data-choice\]$|^\.tab-bar a$|^\.switch$/;
    const selectors = RULES.filter((r) => r.decls.some(([p, v]) => /^(-webkit-)?user-select$/.test(p) && v === 'none')).flatMap((r) => r.selectors);
    expect(selectors.filter((s) => !CONTROL.test(s))).toEqual([]);
    expect(selectors).toEqual(expect.arrayContaining(['button', 'summary', "[role='tab']", "[role='switch']", '[data-choice]', '.tab-bar a']));
  });

  it('text fields and menus are 16px or larger, so iOS never zooms into one', () => {
    const tokens = readTokens('src/styles/tokens.css').light;
    const px = (size: string): number => {
      const token = /^var\(--([\w-]+)\)$/.exec(size);
      if (token) return px(tokens[token[1]]);
      const floor = /^max\((\d+(?:\.\d+)?)px,/.exec(size) ?? /^(\d+(?:\.\d+)?)px$/.exec(size);
      if (!floor) throw new Error(`a font size this test can't read: ${size}`);
      return Number(floor[1]);
    };
    const fields = RULES.filter((r) => r.selectors.some((s) => /(^|[\s>])(input|select|textarea)(\[[^\]]*\])?$|\.text-input$/.test(s)));
    const sizes = fields.flatMap((r) => value(r, 'font-size').map((size) => [where(r), px(size)] as const));
    expect(sizes.length).toBeGreaterThanOrEqual(3); // .search input, .text-input, .select select
    expect(sizes.filter(([, n]) => n < 16)).toEqual([]);
    // The rest inherit (font: inherit) from the body's 18px.
    expect(px(last(base('body'), 'font-size')!)).toBe(18);
  });

  it('safe-area insets come with viewport-fit=cover, so they are not 0', () => {
    expect(RULES.some((r) => r.decls.some(([, v]) => v.includes('env(safe-area-inset-')))).toBe(true);
    expect(read('src/layouts/BaseLayout.astro')).toMatch(/name="viewport" content="[^"]*viewport-fit=cover/);
  });

  it('one theme-color per colour scheme', () => {
    const layout = read('src/layouts/BaseLayout.astro');
    expect(layout).toMatch(/name="theme-color" content=\{CANVAS\} media="\(prefers-color-scheme: light\)"/);
    expect(layout).toMatch(/name="theme-color" content=\{CANVAS_DARK\} media="\(prefers-color-scheme: dark\)"/);
  });

  it('no user-agent sniffing for touch: the one platform reading orders Install’s steps', () => {
    expect(FILES.filter((f) => /navigator\.userAgent|maxTouchPoints|ontouchstart['"]?\s+in\b/.test(read(f)))).toEqual(['src/scripts/prepaint.js']);
    expect(FILES.filter((f) => read(f).includes('data-platform'))).toEqual(['src/scripts/install-order.js', 'src/scripts/prepaint.js']);
  });
});
