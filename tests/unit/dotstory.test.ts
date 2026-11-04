// The dot story's numbers, layout and beats (DotStory.dc.html; pack §2; D14).
import { describe, expect, it } from 'vitest';
import stats from '../../data/tb-ph-data.json' with { type: 'json' };
import { beatAt, computeLayout, ease, hexRgb, KIND, navRoom, overlays, progress, seedDots, storyData, target, triggerLine, type Palette } from '../../src/lib/dotstory.ts';

const d = storyData(stats);
const P: Palette = { dot: hexRgb('#7A8C97'), red: hexRgb('#C42032'), ink: hexRgb('#14212B') };

describe('storyData', () => {
  it('counts the dots from headline_2024: 724 fell ill, 179 never found, 37 died', () => {
    expect([d.n, d.missed, d.died]).toEqual([724, 179, 37]);
    expect(d.sea[0]).toEqual({ name: 'Philippines', iso: 'PHL', rate: 625 });
    expect(d.sea).toHaveLength(11);
    expect([d.ph, d.world]).toEqual([13.6, -12.3]);
  });

  it('fails the build when the data no longer matches the numbers in the copy (Q11 tripwire)', () => {
    const moved = structuredClone(stats);
    moved.headline_2024.estimated_deaths = 41_000;
    expect(() => storyData(moved)).toThrow(/724\/179\/37.*724\/179\/41/);
  });

  it('needs the Philippines first in the Southeast Asia rates', () => {
    const moved = structuredClone(stats);
    moved.global_comparison.southeast_asia_rates.reverse();
    expect(() => storyData(moved)).toThrow(/Philippines/);
  });
});

describe('seedDots', () => {
  const { kind, delay } = seedDots(d);

  it('marks 179 missed and 37 died, the same way on every visit', () => {
    expect(kind.filter((k) => k === KIND.missed)).toHaveLength(179);
    expect(kind.filter((k) => k === KIND.died)).toHaveLength(37);
    expect(seedDots(d)).toEqual({ kind, delay });
    expect(delay.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('scatters them through the field rather than grouping them at the end (D14)', () => {
    const firstHalf = kind.slice(0, 362).filter((k) => k === KIND.missed).length;
    expect(firstHalf).toBeGreaterThan(60);
    expect(firstHalf).toBeLessThan(120);
  });
});

describe('computeLayout', () => {
  for (const [W, H] of [
    [390, 448],
    [747, 835],
    [320, 300],
  ]) {
    it(`fits every dot inside a ${W}×${H} stage without overlaps`, () => {
      const L = computeLayout(W, H, d);
      expect(L.field).toHaveLength(724);
      const r = L.field[0].r;
      expect(r).toBeLessThanOrEqual(34 * 0.36);
      for (const p of L.field) {
        expect(p.x - p.r).toBeGreaterThanOrEqual(0);
        expect(p.x + p.r).toBeLessThanOrEqual(W);
        expect(p.y - p.r).toBeGreaterThanOrEqual(46 - 0.01);
        expect(p.y + p.r).toBeLessThanOrEqual(H);
      }
      const spacing = Math.hypot(L.field[1].x - L.field[0].x, L.field[1].y - L.field[0].y);
      expect(spacing).toBeGreaterThan(2 * r);
    });
  }

  it("pours the field into the Philippines' bar, the longest", () => {
    const L = computeLayout(747, 835, d);
    const [ph, next] = L.bars.rows;
    expect(ph.w).toBeGreaterThan(next.w);
    for (const b of L.bar) {
      expect(b.x).toBeGreaterThanOrEqual(L.bars.x0);
      expect(b.x).toBeLessThanOrEqual(L.bars.x0 + ph.w);
      expect(b.y).toBeGreaterThanOrEqual(ph.y);
      expect(b.y).toBeLessThanOrEqual(ph.y + L.bars.barH);
    }
    expect(new Set(L.bar.map((b) => `${b.x},${b.y}`)).size).toBe(724);
  });
});

describe('target', () => {
  const L = computeLayout(747, 835, d);
  const { kind } = seedDots(d);
  const missed = kind.indexOf(KIND.missed);
  const died = kind.indexOf(KIND.died);

  it('recolours the same field: hollow TB red for the missed from beat 3, ink for the dead from beat 4', () => {
    expect(target(0, missed, KIND.missed, L, P)).toMatchObject({ c: P.dot, h: 0, a: 1 });
    expect(target(1, missed, KIND.missed, L, P)).toMatchObject({ c: P.dot, h: 0 });
    expect(target(2, missed, KIND.missed, L, P)).toMatchObject({ c: P.red, h: 1, x: L.field[missed].x });
    expect(target(2, died, KIND.died, L, P)).toMatchObject({ c: P.dot, h: 0 });
    expect(target(3, died, KIND.died, L, P)).toMatchObject({ c: P.ink, h: 0 });
    expect(target(3, missed, KIND.missed, L, P)).toMatchObject({ c: P.red, h: 1 });
  });

  it('moves every dot into the bar on beat 5 and fades it on beat 6', () => {
    expect(target(4, died, KIND.died, L, P)).toMatchObject({ x: L.bar[died].x, y: L.bar[died].y, a: 1, c: P.red });
    expect(target(5, died, KIND.died, L, P)).toMatchObject({ a: 0, r: L.bar[died].r * 0.6 });
  });

  it('shows one overlay per beat', () => {
    expect([0, 1, 2, 3, 4, 5].map(overlays)).toEqual([
      { day: 0, bars: 0, slope: 0 },
      { day: 1, bars: 0, slope: 0 },
      { day: 0, bars: 0, slope: 0 },
      { day: 0, bars: 0, slope: 0 },
      { day: 0, bars: 1, slope: 0 },
      { day: 0, bars: 0, slope: 1 },
    ]);
  });
});

describe('timing', () => {
  it('eases in and out, and starts each dot after its share of the delay', () => {
    expect([ease(0), ease(0.5), ease(1)]).toEqual([0, 0.5, 1]);
    expect(progress(0, 1400, 0)).toBe(0);
    expect(progress(840, 1400, 0)).toBe(1);
    expect(progress(560, 1400, 1)).toBe(0);
    expect(progress(1400, 1400, 1)).toBe(1);
  });
});

describe('beats', () => {
  it('reserves room for the tab bar below the desktop nav breakpoint, later in Filipino', () => {
    expect([navRoom('en', 999), navRoom('en', 1000), navRoom('fil', 1179), navRoom('fil', 1180)]).toEqual([66, 0, 66, 0]);
  });

  it('triggers 62% down beside a wide stage, or 60% into the room under a stacked one', () => {
    expect(triggerLine('en', 1280, 900, 835)).toBeCloseTo(558);
    expect(triggerLine('en', 390, 900, 448)).toBeCloseTo(65 + 448 + (900 - 65 - 66 - 448) * 0.6);
  });

  it('picks the last beat whose text has crossed the line', () => {
    expect(beatAt([200, 900, 1700], 558)).toBe(0);
    expect(beatAt([-700, 400, 1200], 558)).toBe(1);
    expect(beatAt([-1600, -800, 100], 558)).toBe(2);
  });
});

describe('hexRgb', () => {
  it('reads a token colour', () => {
    expect(hexRgb(' #C42032')).toEqual([196, 32, 50]);
    expect(() => hexRgb('rgb(1,2,3)')).toThrow();
  });
});
