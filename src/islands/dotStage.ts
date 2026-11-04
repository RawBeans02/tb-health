// The dot story's canvas (DotStory.dc.html): draws the field and moves it between beats.
// Layout and targets are pure (src/lib/dotstory.ts); this owns the canvas, the clock and the
// colours, which come from the design tokens so a dark theme can swap them.
import type { DotStageStrings } from '../content/dotstory.ts';
import { computeLayout, ease, hexRgb, overlays, progress, seedDots, target, type Kind, type Layout, type Look, type Palette, type StoryData } from '../lib/dotstory.ts';

interface Dot extends Look {
  kind: Kind;
  delay: number;
  f: Look | null;
  t: Look | null;
}

type Overlays = ReturnType<typeof overlays>;

const DURATION = 1400;
/** Milliseconds each overlay takes to fade fully in or out. */
const SPEED: Overlays = { day: 300, bars: 500, slope: 1100 };
const TAU = 6.2832;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export class DotStage {
  private ctx: CanvasRenderingContext2D | null = null;
  private L: Layout | null = null;
  private W = 0;
  private H = 0;
  private dots: Dot[];
  private ov: Overlays = { day: 0, bars: 0, slope: 0 };
  private ovT: Overlays = { day: 0, bars: 0, slope: 0 };
  private t0 = 0;
  private dur = 0;
  private lastT = 0;
  private raf = 0;
  private beat = 0;
  private started = false;
  private P!: Palette;
  private css!: Record<'canvas' | 'ink' | 'muted' | 'rule' | 'red' | 'dot' | 'family', string>;

  constructor(
    private canvas: HTMLCanvasElement,
    private d: StoryData,
    private tx: DotStageStrings,
  ) {
    const { kind, delay } = seedDots(d);
    this.readColors();
    this.dots = kind.map((k, i) => ({ kind: k, delay: delay[i], x: 0, y: 0, r: 0, h: 0, a: 0, c: [...this.P.dot], f: null, t: null }));
  }

  /** Reads the tokens again (on load, and when the colour scheme changes). */
  readColors() {
    const style = getComputedStyle(this.canvas);
    const probe = this.canvas.getContext('2d');
    // The canvas writes any opaque CSS colour back as #rrggbb, whatever form the token takes.
    const v = (name: string) => {
      const value = style.getPropertyValue(name).trim();
      if (!probe) return value;
      probe.fillStyle = '#000000';
      probe.fillStyle = value;
      return String(probe.fillStyle);
    };
    this.css = { canvas: v('--canvas'), ink: v('--ink'), muted: v('--muted'), rule: v('--separator'), red: v('--tb-red'), dot: v('--dot'), family: style.fontFamily };
    this.P = { dot: hexRgb(this.css.dot), red: hexRgb(this.css.red), ink: hexRgb(this.css.ink) };
  }

  /** Fits the canvas to its box (CSS pixels) and lays the field out again. */
  resize(W: number, H: number) {
    if (W < 10 || H < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    this.ctx = this.canvas.getContext('2d');
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W;
    this.H = H;
    this.L = computeLayout(W, H, this.d);
    if (this.started) return this.go(this.beat, true);
    // First layout: the dots grow in where they stand.
    this.started = true;
    this.dots.forEach((dot, i) => {
      const p = this.L!.field[i];
      Object.assign(dot, { x: p.x, y: p.y, r: 0, a: 0 });
    });
    this.go(this.beat, false);
  }

  /** Moves to `beat`, animated unless `instant`, the user prefers reduced motion, or the tab is hidden. */
  go(beat: number, instant: boolean) {
    this.beat = beat;
    const L = this.L;
    if (!L) return;
    const now = instant || reduced() || document.hidden;
    this.dots.forEach((dot, i) => {
      dot.f = { x: dot.x, y: dot.y, r: dot.r, h: dot.h, a: dot.a, c: [...dot.c] };
      dot.t = target(beat, i, dot.kind, L, this.P);
      if (now) this.apply(dot, 1);
    });
    this.ovT = overlays(beat);
    if (now) this.ov = { ...this.ovT };
    this.t0 = performance.now();
    this.dur = now ? 0 : DURATION;
    this.lastT = 0;
    this.kick();
  }

  kick() {
    if (!this.raf) this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private apply(dot: Dot, p: number) {
    const f = dot.f!;
    const t = dot.t!;
    dot.x = f.x + (t.x - f.x) * p;
    dot.y = f.y + (t.y - f.y) * p;
    dot.r = f.r + (t.r - f.r) * p;
    dot.h = f.h + (t.h - f.h) * p;
    dot.a = f.a + (t.a - f.a) * p;
    for (let k = 0; k < 3; k++) dot.c[k] = f.c[k] + (t.c[k] - f.c[k]) * p;
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (!this.ctx || !this.L) return;
    const dt = this.lastT ? Math.min(50, now - this.lastT) : 16;
    this.lastT = now;
    let busy = false;
    const dur = this.dur;
    const el = now - this.t0;
    if (dur > 0) {
      for (const dot of this.dots) {
        if (!dot.t) continue;
        const p = progress(el, dur, dot.delay);
        if (p < 1) busy = true;
        this.apply(dot, ease(p));
      }
    }
    for (const k of Object.keys(this.ovT) as (keyof Overlays)[]) {
      const tv = this.ovT[k];
      let v = this.ov[k];
      if (v === tv) continue;
      // Bars and slope wait for the dots to be mostly in place before they fade in.
      const wait = k !== 'day' && tv > v && dur > 0 && el < dur * 0.55;
      if (!wait) {
        const step = dt / SPEED[k];
        v = tv > v ? Math.min(tv, v + step) : Math.max(tv, v - step);
        this.ov[k] = v;
      }
      if (v !== tv) busy = true;
    }
    this.draw();
    if (busy) this.kick();
    else this.lastT = 0;
  };

  private font(weight: number, px: number) {
    return `${weight} ${px}px ${this.css.family}`;
  }

  private draw() {
    const ctx = this.ctx!;
    const ov = this.ov;
    ctx.clearRect(0, 0, this.W, this.H);
    if (ov.bars > 0.005) this.drawBars(ctx, ov.bars);
    for (const dot of this.dots) {
      if (dot.a < 0.01 || dot.r < 0.25) continue;
      ctx.globalAlpha = dot.a;
      ctx.fillStyle = `rgb(${dot.c[0] | 0},${dot.c[1] | 0},${dot.c[2] | 0})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, TAU);
      ctx.fill();
      if (dot.h > 0.01) {
        // Hollow: a ring, cut out in the stage colour.
        const sw = Math.max(1.6, dot.r * 0.34);
        const ir = (dot.r - sw) * dot.h;
        if (ir > 0.3) {
          ctx.fillStyle = this.css.canvas;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, ir, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    if (ov.day > 0.005) this.drawDay(ctx, ov.day);
    if (ov.bars > 0.005) this.drawBarLabels(ctx, ov.bars);
    if (ov.slope > 0.005) this.drawSlope(ctx, ov.slope);
    ctx.globalAlpha = 1;
  }

  /** Beat 2: a capsule round the first two dots, "One day ≈ 2 dots". */
  private drawDay(ctx: CanvasRenderingContext2D, a: number) {
    const [p0, p1] = this.L!.field;
    if (!p1) return;
    const r = p0.r;
    const pad = Math.max(4, r * 0.6);
    const x = p0.x - r - pad;
    const y = p0.y - r - pad;
    const w = p1.x - p0.x + 2 * (r + pad);
    const h = 2 * (r + pad);
    ctx.globalAlpha = a;
    ctx.strokeStyle = this.css.ink;
    ctx.lineWidth = 1.5;
    capsule(ctx, x, y, w, h, h / 2);
    ctx.stroke();
    ctx.fillStyle = this.css.ink;
    ctx.font = this.font(700, 14);
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText(this.tx.day, x, y - 6);
    ctx.globalAlpha = 1;
  }

  /** Beat 5: the other countries' bars and the baseline; the Philippines' bar is the dots. */
  private drawBars(ctx: CanvasRenderingContext2D, a: number) {
    const B = this.L!.bars;
    ctx.globalAlpha = a;
    ctx.fillStyle = this.css.dot;
    B.rows.forEach((r, k) => {
      if (k > 0) ctx.fillRect(B.x0, r.y, r.w, B.barH);
    });
    ctx.fillStyle = this.css.ink;
    ctx.fillRect(B.x0 - 1, B.top, 1, B.rows.length * B.rowH);
    ctx.globalAlpha = 1;
  }

  private drawBarLabels(ctx: CanvasRenderingContext2D, a: number) {
    const B = this.L!.bars;
    ctx.globalAlpha = a;
    ctx.textBaseline = 'middle';
    ctx.font = this.font(400, 14);
    ctx.fillStyle = this.css.muted;
    ctx.textAlign = 'left';
    ctx.fillText(this.tx.rate, B.padL, B.titleY);
    B.rows.forEach((r, k) => {
      const cy = r.y + B.barH / 2;
      ctx.fillStyle = this.css.ink;
      ctx.font = this.font(k === 0 ? 700 : 400, B.fs);
      ctx.textAlign = 'right';
      ctx.fillText(k === 0 ? this.tx.ph : r.name, B.x0 - 10, cy);
      ctx.textAlign = 'left';
      ctx.fillText(r.rate.toLocaleString('en-US'), B.x0 + r.w + 8, cy);
    });
    ctx.globalAlpha = 1;
  }

  /** Beat 6: the Philippines and the world, indexed to 2015 = 100. */
  private drawSlope(ctx: CanvasRenderingContext2D, a: number) {
    const S = this.L!.slope;
    const d = this.d;
    const y = (v: number) => S.yb - ((v - 80) / 40) * (S.yb - S.yt);
    ctx.globalAlpha = Math.min(1, a * 2.5);
    ctx.fillStyle = this.css.muted;
    ctx.font = this.font(400, 14);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.tx.index, S.padL, S.titleY);
    ctx.strokeStyle = this.css.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(S.x1 - 10, y(100));
    ctx.lineTo(S.x2 + 10, y(100));
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('2015', S.x1, S.yb + 14);
    ctx.fillText('2024', S.x2, S.yb + 14);
    const q = Math.max(0, Math.min(1, a));
    const line = (v: number, colour: string) => {
      const x2 = S.x1 + (S.x2 - S.x1) * q;
      const y2 = y(100) + (y(v) - y(100)) * q;
      ctx.strokeStyle = colour;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(S.x1, y(100));
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(S.x1, y(100), 4.5, 0, TAU);
      ctx.fill();
      if (q > 0.98) {
        ctx.beginPath();
        ctx.arc(S.x2, y(v), 4.5, 0, TAU);
        ctx.fill();
      }
    };
    const vP = 100 + d.ph;
    const vW = 100 + d.world;
    line(vW, this.css.ink);
    line(vP, this.css.red);
    if (q > 0.9) {
      ctx.globalAlpha = Math.min(1, (q - 0.9) * 10);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const lx = S.x2 + 14;
      const o = S.fs * 0.62;
      ctx.font = this.font(700, S.fs);
      ctx.fillStyle = this.css.red;
      ctx.fillText(this.tx.ph, lx, y(vP) - o);
      ctx.font = this.font(400, S.fs);
      ctx.fillText(`+${d.ph.toFixed(1)}%`, lx, y(vP) + o);
      ctx.font = this.font(700, S.fs);
      ctx.fillStyle = this.css.ink;
      ctx.fillText(this.tx.world, lx, y(vW) - o);
      ctx.font = this.font(400, S.fs);
      ctx.fillText(`−${Math.abs(d.world).toFixed(1)}%`, lx, y(vW) + o);
    }
    ctx.globalAlpha = 1;
  }
}

function capsule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
