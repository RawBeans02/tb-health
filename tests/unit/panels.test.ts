// The Data page's twenty panels (ported from Data.dc.html build()), built from the real data
// files at the widths the layouts switch on.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { charts } from '../../src/content/charts.ts';
import { pick } from '../../src/content/types.ts';
import { buildPanels, type PanelState } from '../../src/lib/charts/panels.ts';

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
