// Chart primitives (ported from Data.dc.html) at the widths the layout switches on: 640,
// 560 and 420 (PLAN §5 step 9).
import { describe, expect, it } from 'vitest';
import { fmt, hbars, pyramid, rows, stack, tbl, ts } from '../../src/lib/charts/primitives.ts';

const th = { ink: '#14212B', muted: '#56626A', rule: '#E3E6E8', base: '#14212B', dot: '#7A8C97', coral: '#C42032', teal: '#1E6B70' };
const years = [2020, 2021, 2022, 2023, 2024];

describe('chart primitives', () => {
  it('formats numbers the way the prototype does', () => {
    expect(fmt(723900)).toBe('723,900');
  });

  it('time series: a line per series, ticks and year labels, in a viewBox the width of the panel', () => {
    for (const w of [640, 560, 420]) {
      const c = ts({ w, years, th, yMax: 100, ticks: [0, 50, 100], tf: String, series: [{ vals: [10, 20, 30, 40, 50], color: th.coral, label: '50', sub: 'per 100,000' }], alt: 'test' });
      expect(c.vb).toBe(`0 0 ${w} 300`);
      expect(c.paths.some((p) => p.stroke === th.coral && p.sw === 3)).toBe(true);
      expect(c.texts.map((t) => t.s)).toEqual(expect.arrayContaining(['2020', '2024', '50', 'per 100,000']));
      expect(c.alt).toBe('test');
    }
  });

  it('bars put labels above the bar under 560px, beside it from 560px', () => {
    const data = { th, max: 100, rows: [{ label: 'Alcohol', v: 40, text: '40' }], alt: 'a' };
    const wide = hbars({ ...data, w: 640 });
    const narrow = hbars({ ...data, w: 420 });
    expect(wide.texts[0]).toMatchObject({ s: 'Alcohol', anchor: 'end' });
    expect(narrow.texts[0]).toMatchObject({ s: 'Alcohol', anchor: 'start', x: 0 });
    expect(narrow.h).toBeGreaterThan(wide.h);
  });

  it('the pyramid and the stacked bar tighten at their small widths', () => {
    const groups = [{ label: '0-14', m: 10, f: 8 }];
    expect(pyramid({ w: 420, th, max: 10, groups, men: 'Men', women: 'Women', alt: 'p' }).texts[2].fs).toBe(13);
    expect(pyramid({ w: 640, th, max: 10, groups, men: 'Men', women: 'Women', alt: 'p' }).texts[2].fs).toBe(15);
    const segs = [{ v: 80, color: th.teal, label: 'Cured' }, { v: 20, color: th.dot, label: 'Other' }];
    expect(stack({ w: 400, th, segs, alt: 's' }).h).toBeGreaterThan(stack({ w: 640, th, segs, alt: 's' }).h);
  });

  it('year rows draw one bar per year with its value', () => {
    const c = rows({ w: 420, years, vals: [1, 2, 3, 4, 5], color: th.teal, max: 5, th, valText: (i: number) => `v${i}`, alt: 'r' });
    expect(c.rects).toHaveLength(5);
    expect(c.texts.filter((t) => t.s.startsWith('v'))).toHaveLength(5);
  });

  it('tables carry their column count and show a dash for missing values', () => {
    const table = tbl('Caption', ['Year', 'Cases'], [[2024, '1,000'], [2025, null]]);
    expect(table.n).toBe(2);
    expect(table.rows[1].cells.map((c) => c.s)).toEqual(['2025', '—']);
    expect(table.cols.map((c) => c.al)).toEqual(['left', 'right']);
  });
});
