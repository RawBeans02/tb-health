// The dot story's numbers, layout and per-beat targets (DotStory.dc.html), kept pure so they
// can be tested. One dot is 1,000 people who fell ill with TB in 2024; later beats recolour
// the same field (pack §2), then pour it into the Philippines' bar and fade it for the slope.
// D14: missed dots are scattered through the field, and the old coral is TB red.

export interface StoryData {
  /** Dots: estimated cases ÷ 1,000. */
  n: number;
  /** Hollow dots: people never found (not reached) ÷ 1,000. */
  missed: number;
  /** Ink dots: estimated deaths ÷ 1,000. */
  died: number;
  /** Southeast Asian TB rates per 100,000, the Philippines first. */
  sea: { name: string; iso: string; rate: number }[];
  /** Change in the TB rate since 2015, in percent. */
  ph: number;
  world: number;
}

/**
 * The counts the beat copy states in words ("about 724,000", "179,000", "37,000"). A WHO
 * refresh that moves them fails the build until the copy is updated too (PLAN §4.4, Q11).
 */
export const COPY_COUNTS = { n: 724, missed: 179, died: 37 } as const;

interface Stats {
  headline_2024: { estimated_cases: number; not_reached: number; estimated_deaths: number; incidence_rate_change_since_2015_pct: number };
  global_comparison: {
    southeast_asia_rates: { country: string; iso3: string; rate_per_100k: number }[];
    global_2024: { rate_change_since_2015_pct: number };
  };
}

export function storyData(stats: Stats): StoryData {
  const h = stats.headline_2024;
  const g = stats.global_comparison;
  const d: StoryData = {
    n: Math.round(h.estimated_cases / 1000),
    missed: Math.round(h.not_reached / 1000),
    died: Math.round(h.estimated_deaths / 1000),
    sea: g.southeast_asia_rates.map((c) => ({ name: c.country, iso: c.iso3, rate: c.rate_per_100k })),
    ph: h.incidence_rate_change_since_2015_pct,
    world: g.global_2024.rate_change_since_2015_pct,
  };
  const { n, missed, died } = COPY_COUNTS;
  if (d.n !== n || d.missed !== missed || d.died !== died) {
    throw new Error(`Dot story: the copy says ${n}/${missed}/${died} thousand, the data ${d.n}/${d.missed}/${d.died}. Update the beat copy with the data (Q11).`);
  }
  if (d.sea[0]?.iso !== 'PHL') throw new Error('Dot story: southeast_asia_rates[0] must be the Philippines (the bar the dots pour into).');
  return d;
}

/** The prototype's seeded generator (mulberry32), so every visit draws the same field. */
function generator(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** What a dot stands for: fell ill (and was found), never found, or died. */
export const KIND = { ill: 0, missed: 1, died: 2 } as const;
export type Kind = (typeof KIND)[keyof typeof KIND];

/**
 * Each dot's kind and start delay (0–1). Missed and died dots are picked from a seeded
 * shuffle, so they sit scattered through the field (D14).
 */
export function seedDots(d: Pick<StoryData, 'n' | 'missed' | 'died'>): { kind: Kind[]; delay: number[] } {
  const rnd = generator(724179037);
  const order = Array.from({ length: d.n }, (_, i) => i);
  for (let i = d.n - 1; i > 0; i--) {
    const k = Math.floor(rnd() * (i + 1));
    [order[i], order[k]] = [order[k], order[i]];
  }
  const delay = Array.from({ length: d.n }, () => rnd());
  const kind = Array<Kind>(d.n).fill(KIND.ill);
  for (let j = 0; j < d.missed; j++) kind[order[j]] = KIND.missed;
  for (let j = d.missed; j < d.missed + d.died; j++) kind[order[j]] = KIND.died;
  return { kind, delay };
}

export interface Point {
  x: number;
  y: number;
  r: number;
}

export interface BarRow {
  name: string;
  rate: number;
  y: number;
  w: number;
}

export interface Layout {
  /** One cell per dot, in reading order. */
  field: (Point & { c: number; rw: number })[];
  /** Where each dot sits inside the Philippines' bar (beats 5–6). */
  bar: Point[];
  bars: { rows: BarRow[]; x0: number; barH: number; rowH: number; top: number; padL: number; titleY: number; fs: number };
  slope: { x1: number; x2: number; yt: number; yb: number; fs: number; padL: number; titleY: number };
}

/** Lays the field, the bars and the slope out in a stage of W × H CSS pixels. */
export function computeLayout(W: number, H: number, d: Pick<StoryData, 'n' | 'sea'>): Layout {
  const n = d.n;
  const roomy = W >= 520;
  const padL = roomy ? 32 : 20;
  const padR = roomy ? 48 : 20;
  const padT = 46;
  const padB = roomy ? 84 : 62;
  const aw = W - padL - padR;
  const ah = Math.max(60, H - padT - padB);
  let best = { s: 0, cols: 1, rows: n };
  for (let cols = 8; cols <= 110; cols++) {
    const rows = Math.ceil(n / cols);
    const s = Math.min(aw / cols, ah / rows);
    if (s > best.s) best = { s, cols, rows };
  }
  const s = Math.min(best.s, 34);
  const { cols, rows } = best;
  const ox = padL + (aw - cols * s) / 2 + s / 2;
  const oy = padT + (ah - rows * s) / 2 + s / 2;
  const r = s * 0.36;
  const field = Array.from({ length: n }, (_, i) => {
    const c = i % cols;
    const rw = Math.floor(i / cols);
    return { x: ox + c * s, y: oy + rw * s, r, c, rw };
  });

  const nb = d.sea.length;
  const fs = roomy ? 15 : 13;
  const top = padT + 10;
  const bottom = H - (roomy ? 40 : 24);
  const rowH = Math.min(roomy ? 46 : 32, (bottom - top) / nb);
  const barH = Math.max(8, Math.round(rowH * 0.62));
  const labelW = roomy ? 132 : 96;
  const valW = 44;
  const x0 = padL + labelW;
  const maxW = Math.max(40, W - padR - valW - x0);
  const rows2 = d.sea.map((c, k) => ({ name: c.name, rate: c.rate, y: top + k * rowH + (rowH - barH) / 2, w: (c.rate / 700) * maxW }));
  // The field pours into the Philippines' bar column by column, as tight as the bar allows.
  const p0 = rows2[0];
  const rr = Math.max(2, Math.round(barH / Math.sqrt((p0.w * barH) / n)));
  const bc = Math.ceil(n / rr);
  const sx = p0.w / bc;
  const sy = barH / rr;
  const br = Math.max(0.9, Math.min(sx, sy) * 0.56);
  const order = field.map((_, i) => i).sort((a, b) => field[a].c - field[b].c || field[a].rw - field[b].rw);
  const bar: Point[] = new Array(n);
  order.forEach((i, j) => {
    bar[i] = { x: x0 + (Math.floor(j / rr) + 0.5) * sx, y: p0.y + ((j % rr) + 0.5) * sy, r: br };
  });

  const slope = { x1: padL + 28, x2: W - padR - (roomy ? 150 : 106), yt: padT + 40, yb: H - padB + 6, fs: roomy ? 16 : 14, padL, titleY: padT - 14 };
  return { field, bar, bars: { rows: rows2, x0, barH, rowH, top, padL, titleY: padT - 14, fs }, slope };
}

export type RGB = [number, number, number];

/** The canvas colours, read from the design tokens so a dark theme can swap them. */
export interface Palette {
  dot: RGB;
  red: RGB;
  ink: RGB;
}

/** How one dot looks: position, radius, hollowness (0–1), opacity and colour. */
export interface Look extends Point {
  h: number;
  a: number;
  c: RGB;
}

/**
 * Where dot `i` goes on beat index `beat` (0–5 for the pack's beats 1–6). Indexes 0–3 recolour
 * the field, 4 pours it into the Philippines' bar, 5 fades it out for the slope.
 */
export function target(beat: number, i: number, kind: Kind, L: Layout, P: Palette): Look {
  if (beat <= 3) {
    const p = L.field[i];
    let c = P.dot;
    let h = 0;
    if (beat >= 2 && kind === KIND.missed) {
      c = P.red;
      h = 1;
    }
    if (beat >= 3 && kind === KIND.died) c = P.ink;
    return { x: p.x, y: p.y, r: p.r, h, a: 1, c };
  }
  const b = L.bar[i];
  return { x: b.x, y: b.y, r: beat === 4 ? b.r : b.r * 0.6, h: 0, a: beat === 4 ? 1 : 0, c: P.red };
}

/** Which overlay each beat index shows: the "one day" capsule, the bar chart or the slope. */
export function overlays(beat: number) {
  return { day: beat === 1 ? 1 : 0, bars: beat === 4 ? 1 : 0, slope: beat === 5 ? 1 : 0 };
}

/** Cubic ease in and out. */
export function ease(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

/** A dot's eased progress `el` ms into a move of `dur` ms: each starts after its delay share. */
export function progress(el: number, dur: number, delay: number): number {
  const p = (el - delay * dur * 0.4) / (dur * 0.6);
  return p <= 0 ? 0 : p >= 1 ? 1 : p;
}

export function hexRgb(hex: string): RGB {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) throw new Error(`Dot story: ${hex} is not a #rrggbb colour`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** Room the phone tab bar takes at the bottom (the prototype's 66px), below the desktop nav breakpoint. */
export function navRoom(lang: 'en' | 'fil', vw: number): number {
  return vw < (lang === 'fil' ? 1180 : 1000) ? 66 : 0;
}

/**
 * The line a beat's text must cross for its beat to start, in px from the top of the window:
 * 62% down beside a wide stage, or 60% into the room left under a stacked one.
 */
export function triggerLine(lang: 'en' | 'fil', vw: number, vh: number, stageH: number): number {
  return vw >= 960 ? vh * 0.62 : 65 + stageH + (vh - 65 - navRoom(lang, vw) - stageH) * 0.6;
}

/** The current beat index: the last one whose text top is above the trigger line. */
export function beatAt(tops: readonly number[], line: number): number {
  let b = 0;
  tops.forEach((top, i) => {
    if (i > 0 && top < line) b = i;
  });
  return b;
}
