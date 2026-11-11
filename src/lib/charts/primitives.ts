// Chart primitives, ported from Data.dc.html (G, ts, rows, hbars, pyramid, monthly, stack,
// bullets, tbl, fstack). Pure functions of data, language and width: they return shapes and
// labels, which src/islands/DataCharts.tsx draws as SVG. The prototype's layout numbers are
// kept as they are, so the charts match it at every width (D13). A colour is a token's name
// (panels.ts COLORS), 'none' or a hatch pattern's url(#id).

/* eslint-disable @typescript-eslint/no-explicit-any -- option shapes are the prototype's, set by src/lib/charts/panels.ts. */
export type Opts = Record<string, any>;

export interface Chart {
  vb: string;
  w: number;
  h: number;
  alt: string;
  title: string;
  rects: { x: number; y: number; w: number; h: number; fill: string; stroke: string; sw: number }[];
  paths: { d: string; fill: string; fo: number; stroke: string; sw: number; dash: string }[];
  circles: { x: number; y: number; r: number; fill: string }[];
  texts: { x: number; y: number; anchor: 'start' | 'middle' | 'end'; baseline: 'central' | 'alphabetic'; s: string; fs: number; fw: number; fill: string }[];
  /** The side gutters a time series used (not drawn; for tests). */
  pad?: { left: number; right: number };
}

/**
 * About how wide `text` is in Atkinson Hyperlegible Next at `fs` px, from character classes
 * measured in the browser (digits 0.62em, commas and stops 0.25em). It errs wide on letters,
 * so a chart that uses it to make room for a label leaves enough (audit B39).
 */
export function textWidth(text: string, fs: number, bold = false): number {
  let em = 0;
  for (const ch of text) em += /\d/.test(ch) ? 0.62 : ch === ' ' ? 0.27 : /[.,:;'’|!()]/.test(ch) ? 0.25 : /[A-Z]/.test(ch) ? 0.7 : /[a-z]/.test(ch) ? 0.56 : 0.6;
  return em * fs * (bold ? 1.06 : 1);
}

export interface Table {
  caption: string;
  /** Number of columns. */
  n: number;
  cols: { s: string; al: 'left' | 'right' }[];
  rows: { cells: { s: string; al: 'left' | 'right' }[] }[];
}

export function fmt(n: number | string): string { return Number(n).toLocaleString('en-US'); }
export function r1(n: number): number { return Math.round(n * 10) / 10; }
/**
 * A chart under construction: shapes in viewBox units, plus labels. Labels are SVG <text>
 * (x, y, anchor, baseline), not the prototype's absolutely positioned HTML spans, because
 * prerendered style attributes would break the CSP; the chart is laid out at its real width,
 * so they render at their real size.
 */
export function G(w: number, h: number, alt: string) {
  const r = (n: number) => r1(n);
  const g: Pick<Chart, 'rects' | 'paths' | 'circles' | 'texts'> = { rects: [], paths: [], circles: [], texts: [] };
  return {
    rect: (x: number, y: number, wd: number, ht: number, fill?: string, stroke?: string, sw?: number) =>
      g.rects.push({ x: r(x), y: r(y), w: r(Math.max(0, wd)), h: r(Math.max(0, ht)), fill: fill || 'none', stroke: stroke || 'none', sw: sw || 0 }),
    path: (d: string, o: { fill?: string; fo?: number; stroke?: string; sw?: number; dash?: string }) =>
      g.paths.push({ d, fill: o.fill || 'none', fo: o.fo == null ? 1 : o.fo, stroke: o.stroke || 'none', sw: o.sw || 0, dash: o.dash || 'none' }),
    line: (x1: number, y1: number, x2: number, y2: number, stroke: string, sw?: number, dash?: string) =>
      g.paths.push({ d: `M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}`, fill: 'none', fo: 1, stroke, sw: sw || 1, dash: dash || 'none' }),
    dot: (x: number, y: number, rad: number, fill: string) => g.circles.push({ x: r(x), y: r(y), r: rad, fill }),
    text: (x: number, y: number, s: string | number, o: { a?: 'end' | 'middle'; b?: 'auto'; fs?: number; fw?: number; fill?: string } = {}) =>
      g.texts.push({
        x: r(x),
        y: r(y),
        anchor: o.a === 'end' ? 'end' : o.a === 'middle' ? 'middle' : 'start',
        // The prototype centred labels on y (translate -50%), or sat them on it (b: 'auto').
        baseline: o.b === 'auto' ? 'alphabetic' : 'central',
        s: String(s),
        fs: o.fs || 14,
        fw: o.fw || 400,
        fill: o.fill || 'ink',
      }),
    done: (title?: string): Chart => ({ vb: `0 0 ${Math.round(w)} ${Math.round(h)}`, w: Math.round(w), h: Math.round(h), alt, title: title || '', ...g }),
  };
}

export function pathOf(xs: number[], ys: number[]): string { return xs.map((x: any, i: number) => (i ? 'L' : 'M') + r1(x) + ' ' + r1(ys[i])).join(''); }

/** An axis label centred on its gridline, or held at the chart's edge where centring would cut it off (B50). */
function axisAnchor(x: number, text: string, fs: number, w: number): { x: number; a: 'middle' | undefined | 'end' } {
  const half = textWidth(text, fs) / 2;
  if (x - half < 0) return { x: Math.max(0, x - half), a: undefined };
  if (x + half > w) return { x: Math.min(w, x + half), a: 'end' };
  return { x, a: 'middle' };
}

/**
 * Keeps axis labels apart, left to right: true when a label placed at `at` starts 4px or more
 * after the last one kept. The others are dropped; their gridlines stay (B78).
 */
function axisSpacer(fs: number) {
  let end = -Infinity;
  return (at: { x: number; a: 'middle' | undefined | 'end' }, text: string) => {
    const tw = textWidth(text, fs), start = at.a === 'middle' ? at.x - tw / 2 : at.a === 'end' ? at.x - tw : at.x;
    if (start < end + 4) return false;
    end = start + tw;
    return true;
  };
}

/** Words on as many lines as `max` px needs (by textWidth); one line when they fit. */
export function wrapText(text: string, fs: number, max: number): string[] {
  if (textWidth(text, fs) <= max) return [text];
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, fs) > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  return [...lines, line];
}

export function ts(o: Opts): Chart {
  const w = o.w, h = o.h || 300, th = o.th, fs = 15, T = 20, B = 38, n = o.years.length;
  // The prototype's gutters (66, 170), widened only for a label that wouldn't fit them: the
  // end labels on the right (Filipino, mostly) or a wide tick label on the left (B39).
  const ends = o.series.flatMap((s: any) => [textWidth(String(s.label ?? ''), fs, true), textWidth(String(s.sub ?? ''), 14)]);
  const ticks = o.ticks.map((v: any) => textWidth(String(o.tf(v)), 14));
  // Room needed: the label and its 14px (right) or 10px (left) gap. Widened only when that
  // beats the prototype's gutter by more than 1px, so labels that fit keep its geometry.
  const baseR = o.R || 170, needR = Math.ceil(Math.max(0, ...ends)) + 14, needL = Math.ceil(Math.max(0, ...ticks)) + 10;
  const R = needR > baseR + 1 ? needR : baseR, L = needL > 67 ? needL : 66;
  const x = (i: number) => L + i / (n - 1) * (w - L - R), y = (v: number) => T + (1 - v / o.yMax) * (h - T - B), idx = [...Array(n).keys()];
  const S = G(w, h, o.alt);
  o.ticks.forEach((v: any) => { S.line(L, y(v), w - R + 12, y(v), v === 0 ? th.base : th.rule, 1); S.text(L - 10, y(v), o.tf(v), { a: 'end', fs: 14, fill: th.muted }); });
  const area = (up: number[], lo: number[], color: string, fo: number) => S.path(pathOf(idx.map(x), up.map(y)) + idx.slice().reverse().map((i: any) => 'L' + r1(x(i)) + ' ' + r1(y(lo[i]))).join('') + 'Z', { fill: color, fo });
  if (o.band) area(o.band.hi, o.band.lo, o.band.color, 0.2);
  if (o.gap) { area(o.gap.upper, o.gap.lower, o.gap.color, 0.16); const gi = o.gap.at; S.text(x(gi), (y(o.gap.upper[gi]) + y(o.gap.lower[gi])) / 2, o.gap.label, { a: 'middle', fs, fw: 700, fill: o.gap.ink }); }
  o.years.forEach((yr: any, i: number) => { if (i === 0 || i === n - 1 || yr % 5 === 0) { S.line(x(i), h - B, x(i), h - B + 5, th.muted, 1); S.text(x(i), h - B + 20, yr, { a: 'middle', fs: 14, fill: th.muted }); } });
  o.series.forEach((s: any) => { S.path(pathOf(idx.map(x), s.vals.map(y)), { stroke: s.color, sw: 3 }); S.dot(x(n - 1), y(s.vals[n - 1]), 5, s.color); });
  o.series.forEach((s: any) => { const yy = y(s.vals[n - 1]) + (s.dy || 0); S.text(x(n - 1) + 14, yy - 9, s.label, { fs, fw: 700, fill: s.ink || th.ink }); S.text(x(n - 1) + 14, yy + 10, s.sub, { fs: 14, fill: s.ink || th.ink }); });
  (o.notes || []).forEach((nt: any) => { const xx = x(nt.i), yy = y(nt.v); S.dot(xx, yy, 4.5, nt.color || th.ink); S.text(xx, yy + (nt.below ? 22 : -18), nt.text, { a: 'middle', fs: 14, fw: 700, fill: th.ink }); });
  return { ...S.done(o.title), pad: { left: L, right: R } };
}
export function rows(o: Opts): Chart {
  const th = o.th, fs = 14, rowH = 26, barH = 12, top = o.legend ? 34 : 4, L = 50, R = 78, n = o.years.length, h = top + n * rowH + 6;
  const S = G(o.w, h, o.alt), x = (v: number) => L + v / o.max * (o.w - L - R);
  if (o.legend) { let lx = 0; o.legend.forEach((it: any) => { S.rect(lx, 8, 18, 12, it.fill, it.stroke, it.sw); S.text(lx + 26, 14, it.label, { fs, fill: th.ink }); lx += 26 + it.label.length * 7.6 + 22; }); }
  o.years.forEach((yr: any, i: number) => {
    const cy = top + i * rowH + rowH / 2;
    S.text(0, cy, yr, { fs, fill: th.muted });
    if (o.outer) S.rect(L, cy - barH / 2, x(o.outer[i]) - L, barH, 'none', th.ink, 1.25);
    S.rect(L, cy - barH / 2, x(o.vals[i]) - L, barH, o.color);
    let end = x(o.outer ? o.outer[i] : o.vals[i]);
    if (o.lo) { const a = x(o.lo[i]), b = x(o.hi[i]); S.line(a, cy, b, cy, th.ink, 1.5); S.line(a, cy - 5, a, cy + 5, th.ink, 1.5); S.line(b, cy - 5, b, cy + 5, th.ink, 1.5); end = Math.max(end, b); }
    S.text(end + 7, cy, o.valText(i), { fs, fw: 700, fill: th.ink });
  });
  S.line(L, top, L, top + n * rowH, th.base, 1);
  return S.done(o.title);
}
export function hbars(o: Opts): Chart {
  const th = o.th, fs = 15, above = o.w < 560, L = above ? 0 : (o.labelW || 170), R = o.R || 96;
  const rowH = above ? 52 : (o.rowH || 36), barH = 16, top = 6, n = o.rows.length, axisH = o.axis ? 30 : 0, h = top + n * rowH + axisH + 4;
  const S = G(o.w, h, o.alt), x = (v: number) => L + v / o.max * (o.w - L - R);
  const fits = axisSpacer(13);
  if (o.axis) o.axis.forEach((v: any) => { const label = o.af ? o.af(v) : fmt(v), at = axisAnchor(x(v), label, 13, o.w); S.line(x(v), top, x(v), top + n * rowH, th.rule, 1); if (fits(at, label)) S.text(at.x, top + n * rowH + 18, label, { a: at.a, fs: 13, fill: th.muted }); });
  o.rows.forEach((rw: any, i: number) => {
    const y0 = top + i * rowH, by = above ? y0 + 26 : y0 + (rowH - barH) / 2, cy = by + barH / 2;
    if (above) S.text(0, y0 + 11, rw.label, { fs: 15, fw: rw.bold ? 700 : 400, fill: th.ink });
    else S.text(L - 12, cy, rw.label, { a: 'end', fs, fw: rw.bold ? 700 : 400, fill: th.ink });
    S.rect(L, by, x(rw.v) - L, barH, rw.color || th.dot);
    let end = x(rw.v);
    if (rw.lo != null) { const a = x(rw.lo), b = x(rw.hi); S.line(a, cy, b, cy, th.ink, 1.5); S.line(a, cy - 6, a, cy + 6, th.ink, 1.5); S.line(b, cy - 6, b, cy + 6, th.ink, 1.5); end = Math.max(end, b); }
    S.text(end + 8, cy, rw.text, { fs, fw: rw.bold ? 700 : 400, fill: th.ink });
  });
  if (o.ref) { const rx = x(o.ref.v); S.line(rx, top - 2, rx, top + n * rowH, th.ink, 1.5, '5 4'); }
  S.line(L, top, L, top + n * rowH, th.base, 1);
  return S.done(o.title);
}
export function pyramid(o: Opts): Chart {
  const th = o.th, small = o.w < 560, fs = small ? 13 : 15, mid = small ? 52 : 76, valW = small ? 50 : 68;
  const cx = o.w / 2, bw = (o.w - mid) / 2 - valW, rowH = small ? 26 : 30, barH = rowH - 8, top = 32, n = o.groups.length, h = top + n * rowH + 4;
  const S = G(o.w, h, o.alt);
  S.text(cx - mid / 2 - 2, 12, o.men, { a: 'end', fs: 15, fw: 700, fill: th.ink });
  S.text(cx + mid / 2 + 2, 12, o.women, { fs: 15, fw: 700, fill: th.ink });
  o.groups.slice().reverse().forEach((g: any, i: number) => {
    const y0 = top + i * rowH + 4, cy = y0 + barH / 2, wm = g.m / o.max * bw, wf = g.f / o.max * bw;
    S.rect(cx - mid / 2 - wm, y0, wm, barH, th.ink);
    S.rect(cx + mid / 2, y0, wf, barH, th.dot);
    S.text(cx, cy, g.label, { a: 'middle', fs, fill: th.muted });
    S.text(cx - mid / 2 - wm - 6, cy, fmt(g.m), { a: 'end', fs, fill: th.ink });
    S.text(cx + mid / 2 + wf + 6, cy, fmt(g.f), { fs, fill: th.ink });
  });
  return S.done();
}
export function monthly(o: Opts): Chart {
  const th = o.th, small = o.w < 560, fs = small ? 13 : 14, L = 50, R = 6, top = 36, rowH = small ? 44 : 58, gapY = 14, n = o.rows.length, h = top + n * (rowH + gapY) + 18;
  const S = G(o.w, h, o.alt), colW = (o.w - L - R) / 12, bw = Math.max(3, colW * 0.7);
  S.rect(0, 6, 24, 14, 'url(#dhatch)', th.dot, 1); S.text(32, 13, o.provLabel, { fs, fill: th.ink });
  o.rows.forEach((rw: any, i: number) => {
    const y0 = top + i * (rowH + gapY), base = y0 + rowH;
    S.text(0, base - 2, rw.year, { b: 'auto', fs, fill: th.muted });
    S.line(L, base, o.w - R, base, th.rule, 1);
    rw.vals.forEach((v: any, m: number) => {
      if (v == null) return;
      const bh = v / o.max * rowH, bx = L + m * colW + (colW - bw) / 2, isMin = rw.year === o.min.year && m === o.min.month;
      S.rect(bx, base - bh, bw, bh, rw.prov ? 'url(#dhatch)' : (isMin ? th.coral : th.dot), rw.prov ? th.dot : 'none', rw.prov ? 1 : 0);
      if (isMin) { S.line(bx + bw / 2, y0 + 12, bx + bw / 2, base - bh - 3, th.ink, 1.25); S.text(bx + bw / 2 + 6, y0 + 4, o.min.label, { fs, fw: 700, fill: th.ink }); }
    });
  });
  // The month labels sit where the prototype has them; the chart runs 2px further, so their
  // descenders ("Apr") stay inside it (B76's probe).
  [0, 3, 6, 9].forEach((m: any) => S.text(L + m * colW + colW / 2, h - 4, o.months[m], { a: 'middle', b: 'auto', fs: 13, fill: th.muted }));
  return S.done();
}
export function stack(o: Opts): Chart {
  const th = o.th, narrow = o.w < 420, barH = 46, top = 4, lineH = narrow ? 48 : 28, listTop = top + barH + 22, h = listTop + o.segs.length * lineH;
  const S = G(o.w, h, o.alt);
  let x = 0;
  o.segs.forEach((s: any) => { const sw = s.v / 100 * o.w; S.rect(x, top, sw, barH, s.color); x += sw; });
  S.text(14, top + barH / 2, o.segs[0].v.toFixed(1) + '%', { fs: 18, fw: 700, fill: 'on-teal' });
  o.segs.forEach((s: any, i: number) => { const yy = listTop + i * lineH + 10, val = s.v.toFixed(1) + '%' + (s.n != null ? ' (' + fmt(s.n) + ')' : ''); S.rect(0, yy - 7, 14, 14, s.color); if (narrow) { S.text(24, yy, s.label, { fs: 15, fill: th.ink }); S.text(24, yy + 20, val, { fs: 15, fw: 700, fill: th.ink }); } else S.text(24, yy, s.label + ': ' + val, { fs: 15, fill: th.ink }); });
  return S.done(o.title);
}
export function bullets(o: Opts): Chart {
  // A value that doesn't fit beside its label goes on the line below it, and that item grows
  // by a line (B78). Measured with the plain estimate: for these bold strings the bold one runs
  // about 6% wide (getComputedTextLength: "TB rate per 100,000" 153.6, "2024: 625" 80.1),
  // which moved the value where it fits (B81).
  const th = o.th, itemH = 112, lineH = 22;
  const own = o.items.map((it: any) => textWidth(it.label, 16) + 12 + textWidth(it.now, 16) > o.w);
  const h = o.items.length * itemH + own.filter(Boolean).length * lineH;
  const S = G(o.w, h, o.alt);
  let y0 = 0;
  o.items.forEach((it: any, k: number) => {
    const extra = own[k] ? lineH : 0, by = y0 + 50 + extra, bh = 18, x = (v: number) => v / it.max * o.w;
    S.text(0, y0 + 10, it.label, { fs: 16, fw: 700, fill: th.ink });
    S.text(o.w, y0 + 10 + extra, it.now, { a: 'end', fs: 16, fw: 700, fill: th.ink });
    S.rect(0, by, o.w, bh, 'separator');
    S.rect(0, by, x(it.v), bh, th.coral);
    it.marks.forEach((m: any) => { const mx = x(m.v), tw = m.text.length * 8.2, x0 = mx + 6 + tw <= o.w ? mx + 6 : (mx - 6 - tw >= 0 ? mx - 6 - tw : 0); S.line(mx, by - 8, mx, by + bh + 8, th.ink, 2.5); S.text(x0, m.below ? by + bh + 20 : by - 16, m.text, { fs: 14, fw: 700, fill: th.ink }); });
    y0 += itemH + extra;
  });
  return S.done();
}
export function tbl(caption: string, cols: string[], rows: (string | number | null)[][]): Table {
  // Column widths come from a class per column count (.dtable--n2 …): no inline grid templates.
  // A missing value is an en dash, as the v8 pack's empty table cells are (V8).
  const al = (i: number) => (i ? 'right' : 'left') as 'left' | 'right';
  return { caption, n: cols.length, cols: cols.map((s: any, i: number) => ({ s, al: al(i) })), rows: rows.map((r) => ({ cells: r.map((s: any, i: number) => ({ s: s == null ? '–' : String(s), al: al(i) })) })) };
}

export function fstack(o: Opts): Chart {
  // Legend labels wrap only when they'd run past the chart (Filipino on a phone, B50); each
  // extra line adds 18px above the bars.
  const legend = o.legend.map((it: any) => ({ ...it, lines: wrapText(it.label, 15, o.w - 24) }));
  const legendH = legend.reduce((sum: number, it: any) => sum + 24 + (it.lines.length - 1) * 18, 0);
  const th = o.th, fs = 14, rowH = 34, barH = 18, L0 = 52, R = 96, n = o.rows.length, top = legendH + 10, h = top + n * rowH + 28;
  const S = G(o.w, h, o.alt), x = (v: number) => L0 + v / o.max * (o.w - L0 - R);
  let yy = 10;
  legend.forEach((it: any) => {
    S.rect(0, yy - 7, 16, 14, it.fill, it.stroke, it.sw);
    it.lines.forEach((line: string, k: number) => S.text(24, yy + k * 18, line, { fs: 15, fill: th.ink }));
    yy += 24 + (it.lines.length - 1) * 18;
  });
  const fits = axisSpacer(13);
  o.axis.forEach((v: any) => { const label = o.af(v), at = axisAnchor(x(v), label, 13, o.w); S.line(x(v), top, x(v), top + n * rowH, th.rule, 1); if (fits(at, label)) S.text(at.x, top + n * rowH + 16, label, { a: at.a, fs: 13, fill: th.muted }); });
  o.rows.forEach((r: any, i: number) => {
    const cy = top + i * rowH + rowH / 2; let x0 = L0;
    S.text(0, cy, r.label, { fs, fill: th.muted });
    r.segs.forEach((sg: any) => { if (!sg.v) return; const wd = x(sg.v) - L0; S.rect(x0, cy - barH / 2, wd, barH, sg.fill, sg.stroke, sg.sw); x0 += wd; });
    if (r.note) S.text(x0 + 8, cy, r.note, { fs, fw: 700, fill: th.ink });
  });
  S.line(L0, top, L0, top + n * rowH, th.base, 1);
  return S.done(o.title);
}
