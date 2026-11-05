// The Data page's twenty panels (ported from Data.dc.html build()), built from the real data
// files at the widths the layouts switch on.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { charts } from '../../src/content/charts.ts';
import { pick } from '../../src/content/types.ts';
import { buildPanels, HATCHES, type PanelState } from '../../src/lib/charts/panels.ts';
import { textWidth, wrapText } from '../../src/lib/charts/primitives.ts';

const data = JSON.parse(readFileSync('data/tb-ph-data.json', 'utf8'));
const claims = JSON.parse(readFileSync('data/claims.json', 'utf8'));
const state = (patch: Partial<PanelState> = {}): PanelState => ({
  pyr: 'est',
  setPyr: () => {},
  regions: { n: 93, sample: true, names: { NCR: 'NCR & Rizal' }, counts: { NCR: 40, CAR: 12 } },
  claims,
  ...patch,
});
const ids = Array.from({ length: 20 }, (_, i) => `d${i + 1}`);

describe('buildPanels', () => {
  for (const lang of ['en', 'fil'] as const) {
    for (const [w, wide] of [
      [640, true],
      [560, true],
      [420, false],
    ] as const) {
      it(`${lang} at ${w}px: twenty panels, each with a table and labelled charts, no NaN`, () => {
        const panels = buildPanels(data, lang, w, wide, state(), pick(charts, lang));
        expect(panels.map((p) => p.id).sort()).toEqual([...ids].sort());
        for (const p of panels) {
          expect(p.tables?.length, `${p.id} tables`).toBeGreaterThan(0);
          for (const svg of p.svgs ?? []) {
            expect(svg.alt, `${p.id} alt`).toBeTruthy();
            expect(JSON.stringify(svg), `${p.id} NaN`).not.toMatch(/NaN|undefined/);
            expect(svg.w).toBeLessThanOrEqual(w);
          }
        }
      });
    }
  }

  it('every table has a column template in data.css (no inline grid templates under the CSP)', () => {
    const css = readFileSync('src/styles/data.css', 'utf8');
    for (const lang of ['en', 'fil'] as const) {
      for (const p of buildPanels(data, lang, 640, true, state(), pick(charts, lang))) {
        for (const t of p.tables ?? []) expect(css, `${p.id}: .dtable--n${t.n}`).toContain(`.dtable--n${t.n} [role='row']`);
      }
    }
  });

  it('d5 shows estimates or notifications as the toggle says', () => {
    const est = buildPanels(data, 'en', 640, true, state({ pyr: 'est' }), pick(charts, 'en')).find((p) => p.id === 'd5')!;
    const not = buildPanels(data, 'en', 640, true, state({ pyr: 'not' }), pick(charts, 'en')).find((p) => p.id === 'd5')!;
    expect(est.toggle?.map((o) => o.on)).toEqual([true, false]);
    expect(not.toggle?.map((o) => o.on)).toEqual([false, true]);
    expect(JSON.stringify(est.svgs)).not.toBe(JSON.stringify(not.svgs));
  });

  it('d14 counts clinics per region from the prepared list, with the sample note', () => {
    const d14 = buildPanels(data, 'en', 640, true, state(), pick(charts, 'en')).find((p) => p.id === 'd14')!;
    expect(d14.caption).toContain('Sample list: 93 clinics from 2 regions');
  });
});

describe('hatch patterns (audit B21)', () => {
  it('every url(#id) a chart fills with has its pattern', () => {
    for (const lang of ['en', 'fil'] as const) {
      for (const [w, wide] of [[928, true], [320, false]] as const) {
        const used = new Set([...JSON.stringify(buildPanels(data, lang, w, wide, state(), pick(charts, lang))).matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1]));
        expect(used.size).toBeGreaterThan(0);
        for (const id of used) expect(HATCHES, `#${id}`).toHaveProperty(id);
      }
    }
  });
});

describe('room for chart labels (audit B39)', () => {
  // Where a text's ink ends, by the same estimate the charts use to make room.
  const extent = (t: { x: number; anchor: string; s: string; fs: number; fw: number }) => {
    const width = textWidth(t.s, t.fs, t.fw >= 700);
    return t.anchor === 'end' ? [t.x - width, t.x] : t.anchor === 'middle' ? [t.x - width / 2, t.x + width / 2] : [t.x, t.x + width];
  };
  const series = (lang: 'en' | 'fil', w: number) => buildPanels(data, lang, w, true, state(), pick(charts, lang)).flatMap((p) => (p.svgs ?? []).filter((c) => c.pad).map((c) => ({ id: p.id, c })));

  it("keeps the prototype's gutters in English, except d16's wide axis label", () => {
    for (const w of [928, 640]) {
      for (const { id, c } of series('en', w)) {
        expect(c.pad!.right, `${id} right`).toBe(170);
        if (id !== 'd16') expect(c.pad!.left, `${id} left`).toBe(66);
      }
    }
  });

  it('ends every time-series label inside its chart, in English and Filipino', () => {
    for (const lang of ['en', 'fil'] as const) {
      for (const w of [928, 640]) {
        for (const { id, c } of series(lang, w)) {
          for (const t of c.texts) {
            const [from, to] = extent(t);
            expect(from, `${lang} ${w} ${id} "${t.s}"`).toBeGreaterThanOrEqual(0);
            expect(to, `${lang} ${w} ${id} "${t.s}"`).toBeLessThanOrEqual(c.w);
          }
        }
      }
    }
  });
});

describe('chart labels on a phone (audit B50)', () => {
  const narrow = (lang: 'en' | 'fil', w: number) => buildPanels(data, lang, w, false, state(), pick(charts, lang));

  it('wraps only what would not fit', () => {
    expect(wrapText('Short label', 15, 300)).toEqual(['Short label']);
    const lines = wrapText('2025: inaasahan, hindi pa natatanggap ang lahat', 15, 200);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(textWidth(line, 15)).toBeLessThanOrEqual(200);
  });

  it('keeps every axis label on narrow bar charts inside the chart (d6, d16, d17)', () => {
    for (const lang of ['en', 'fil'] as const) {
      for (const w of [290, 360]) {
        for (const p of narrow(lang, w).filter((p) => ['d6', 'd16', 'd17'].includes(p.id))) {
          for (const c of p.svgs ?? []) {
            for (const t of c.texts.filter((t) => t.fs === 13)) {
              const width = textWidth(t.s, t.fs);
              const from = t.anchor === 'middle' ? t.x - width / 2 : t.anchor === 'end' ? t.x - width : t.x;
              expect(from, `${lang} ${w} ${p.id} "${t.s}"`).toBeGreaterThanOrEqual(0);
              expect(from + width, `${lang} ${w} ${p.id} "${t.s}"`).toBeLessThanOrEqual(c.w + 0.5);
            }
          }
        }
      }
    }
  });

  it("wraps d17's Filipino legend on a phone, and keeps the English one on one line per item", () => {
    const legendLines = (lang: 'en' | 'fil', w: number) => {
      const c = buildPanels(data, lang, w, w >= 640, state(), pick(charts, lang)).find((p) => p.id === 'd17')!.svgs![0];
      return c.texts.filter((t) => t.x === 24).length;
    };
    expect(legendLines('en', 928)).toBe(4);
    expect(legendLines('fil', 290)).toBeGreaterThan(4);
  });
});

describe('no overlapping chart text on a phone (audit B78)', () => {
  const narrow = (lang: 'en' | 'fil', w: number) => buildPanels(data, lang, w, false, state(), pick(charts, lang));
  const span = (t: { s: string; fs: number; x: number; anchor?: string; fw?: number }) => {
    const width = textWidth(t.s, t.fs, (t.fw ?? 400) >= 700);
    const from = t.anchor === 'middle' ? t.x - width / 2 : t.anchor === 'end' ? t.x - width : t.x;
    return [from, from + width];
  };

  it('drops an axis label that would start within 4px of the last one, and keeps every gridline (d6, d17)', () => {
    for (const lang of ['en', 'fil'] as const) {
      for (const w of [290, 360]) {
        for (const p of narrow(lang, w).filter((p) => ['d6', 'd17'].includes(p.id))) {
          const c = p.svgs![0];
          const axis = c.texts.filter((t) => t.fs === 13).map(span).sort((a, b) => a[0] - b[0]);
          for (let i = 1; i < axis.length; i++) expect(axis[i][0], `${lang} ${w} ${p.id}`).toBeGreaterThanOrEqual(axis[i - 1][1] + 4);
        }
      }
    }
    // d17 at 290px: two labels left, five gridlines still drawn.
    const d17 = narrow('en', 290).find((p) => p.id === 'd17')!.svgs![0];
    expect(d17.texts.filter((t) => t.fs === 13).map((t) => t.s)).toEqual(['US$0M', 'US$100M']);
  });

  it("puts a bullet's value on its own line when it doesn't fit beside its label (d15)", () => {
    const d15 = (lang: 'en' | 'fil', w: number) => narrow(lang, w).find((p) => p.id === 'd15')!.svgs![0];
    const own = (lang: 'en' | 'fil', w: number) => {
      const c = d15(lang, w);
      const values = c.texts.filter((t) => t.anchor === 'end' && t.fw === 700);
      const labels = c.texts.filter((t) => t.x === 0 && t.fs === 16);
      return values.map((v, i) => v.y > labels[i].y);
    };
    expect(own('en', 290)).toEqual([false, false]);
    expect(own('fil', 290)).toEqual([true, false]);
    expect(d15('fil', 290).h).toBe(d15('en', 290).h + 22);
  });
});

