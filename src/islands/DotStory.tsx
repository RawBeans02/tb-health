// The dot story's stage (DotStory.dc.html, README:236): a sticky canvas beside (or above) the
// text beats, which Data.astro prerenders. Scrolling a beat's text past the trigger line
// moves the field to that beat; under reduced motion it jumps straight to the end state
// (README:39). The numbers are built in (D12) and come in as props.
import { useEffect, useRef, useState } from 'preact/hooks';
import { fill } from '../content/types.ts';
import type { DotStageStrings } from '../content/dotstory.ts';
import { beatAt, triggerLine, type StoryData } from '../lib/dotstory.ts';
import type { Lang } from '../lib/i18n.ts';
import { DotStage } from './dotStage.ts';

interface Props {
  lang: Lang;
  d: StoryData;
  tx: DotStageStrings;
}

export default function DotStory({ lang, d, tx }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const box = stage.current!;
    const engine = new DotStage(canvas.current!, d, tx);
    const beats = [...(box.closest('.story')?.querySelectorAll<HTMLElement>('[data-beat]') ?? [])];
    let current = 0;
    let measured = false;

    const check = () => {
      if (!measured || beats.length < 2) return;
      const tops = beats.map((el) => el.getBoundingClientRect().top);
      if (tops.at(-1)! - tops[0] < 40) return; // not laid out yet
      // The breakpoints are em media queries (audit B2): compare in px at the 16px default.
      const width = (innerWidth * 16) / parseFloat(getComputedStyle(document.documentElement).fontSize);
      const b = beatAt(tops, triggerLine(lang, width, innerHeight, box.clientHeight));
      if (b === current) return;
      current = b;
      setBeat(b);
      engine.go(b, false);
    };
    const resize = () => {
      engine.resize(box.clientWidth, box.clientHeight);
      measured = true;
      check();
    };
    let scrollFrame = 0;
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(() => ((scrollFrame = 0), check()));
    };
    const snap = () => engine.go(current, true);
    const recolour = () => {
      engine.readColors();
      snap();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(box);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const scheme = matchMedia('(prefers-color-scheme: dark)');
    motion.addEventListener('change', snap);
    scheme.addEventListener('change', recolour);
    void document.fonts?.ready.then(() => engine.kick());

    return () => {
      observer.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      motion.removeEventListener('change', snap);
      scheme.removeEventListener('change', recolour);
      cancelAnimationFrame(scrollFrame);
      engine.destroy();
    };
  }, []);

  const labels = [tx.label1, tx.label2, tx.label3, tx.label4, tx.label5, tx.label6];
  const label = fill(labels[beat], {
    n: String(d.n),
    missed: String(d.missed),
    died: String(d.died),
    rate: d.sea[0].rate.toLocaleString('en-US'),
    ph: d.ph.toFixed(1),
    world: Math.abs(d.world).toFixed(1),
  });

  return (
    <div class="story-stage" ref={stage}>
      <canvas ref={canvas} role="img" aria-label={label} />
      {beat <= 3 && (
        <div class="story-legend" aria-hidden="true">
          <span>
            <span class="story-swatch" />
            {tx.ill}
          </span>
          {beat >= 2 && (
            <span>
              <span class="story-swatch story-swatch--missed" />
              {tx.missed}
            </span>
          )}
          {beat === 3 && (
            <span>
              <span class="story-swatch story-swatch--died" />
              {tx.died}
            </span>
          )}
          <span class="story-unit">{tx.unit}</span>
        </div>
      )}
    </div>
  );
}
