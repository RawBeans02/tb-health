// The Data page's twenty chart panels (README:238–240), ported from Data.dc.html. Prerendered
// at a default width, then laid out again at the panel's real width in the browser (D13), so
// labels stay their true size. Statistics are built in (D12): no fetch, nothing to fail.
import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import claims from '../../data/claims.json' with { type: 'json' };
import stats from '../../data/tb-ph-data.json' with { type: 'json' };
import { buildPanels, type ChartStrings, type Panel, type PanelState } from '../lib/charts/panels.ts';
import type { Chart, Table } from '../lib/charts/primitives.ts';
import type { Lang } from '../lib/i18n.ts';

interface Props {
  lang: Lang;
  tx: ChartStrings;
  /** "Back to top" (dataPage.top). */
  top: string;
  regions: PanelState['regions'];
}

// The prerendered width: the chart area of a 1280px window (Data.dc.html cw at vw 1280).
const DEFAULT_WIDTH = 928;

export default function DataCharts({ lang, tx, top, regions }: Props) {
  const [cw, setCw] = useState(DEFAULT_WIDTH);
  const [pyr, setPyr] = useState('est');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const measure = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = measure.current;
    if (!el) return;
    const update = () => setCw(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Once the charts are drawn at their real width, the page below them has moved: say so,
  // once, so a deep link or a restored reading place can be applied again (audit B6).
  const announced = useRef(false);
  useEffect(() => {
    if (announced.current || cw === DEFAULT_WIDTH || !measure.current) return;
    if (Math.round(measure.current.getBoundingClientRect().width) !== cw) return;
    announced.current = true;
    document.dispatchEvent(new CustomEvent('tbph:charts-ready'));
  }, [cw]);

  const panels = buildPanels(stats, lang, cw, cw >= 640, { pyr, setPyr, regions, claims }, tx);

  return (
    <>
      <svg class="chart-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <pattern id="dhatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#FFFFFF" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#7A8C97" stroke-width="3" />
          </pattern>
        </defs>
      </svg>
      {panels.map((p, i) => (
        <PanelView key={p.id} p={p} title={tx[`${p.id}_title` as keyof ChartStrings]} tx={tx} top={top} open={!!open[p.id]} toggle={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} measure={i === 0 ? measure : undefined} />
      ))}
    </>
  );
}

function PanelView({ p, title, tx, top, open, toggle, measure }: { p: Panel; title: string; tx: ChartStrings; top: string; open: boolean; toggle: () => void; measure?: { current: HTMLDivElement | null } }) {
  return (
    <section id={p.id} class="panel" data-anchor aria-labelledby={`${p.id}-h`}>
      {measure && <div class="panel-measure" ref={measure} aria-hidden="true" />}
      <h2 id={`${p.id}-h`}>{title}</h2>
      {p.takeaway && <p class="panel-takeaway">{p.takeaway}</p>}
      {p.toggle && p.toggle.length > 0 && (
        <div class="segmented panel-toggle" role="group" aria-label={title}>
          {p.toggle.map((o) => (
            <button key={o.label} type="button" aria-pressed={o.on ? 'true' : 'false'} onClick={o.pick}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {p.stats && p.stats.length > 0 && (
        <ul class="panel-stats" role="list">
          {p.stats.map((s) => (
            <li key={s.l}>
              <span class="stat-value">{s.v}</span>
              <span class="stat-label">
                <span>{s.l}</span>
                {s.s && <span class="stat-sub">{s.s}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {p.claimRows && p.claimRows.length > 0 && (
        <ul class="panel-claims" role="list">
          {p.claimRows.map((r) => (
            <li key={r.text}>
              <p>{r.text}</p>
              <p class="panel-meta">
                {r.meta} <Links list={r.src} />
              </p>
            </li>
          ))}
        </ul>
      )}
      {(p.svgs ?? []).map((g, i) => (
        <ChartFigure key={i} g={g} />
      ))}
      {p.caption && <p class="panel-caption">{p.caption}</p>}
      <p class="panel-source">
        {p.source} <Links list={p.srcLinks ?? []} />
      </p>
      <div class="panel-actions">
        <button type="button" class="btn btn--soft" aria-expanded={open ? 'true' : 'false'} aria-controls={`${p.id}-t`} onClick={toggle}>
          {open ? tx.common_13 : tx.common_14}
        </button>
        {p.link2 && (
          <a class="panel-link" href={p.link2.href}>
            {p.link2.label}
          </a>
        )}
        <a class="panel-link" href="#top" data-to-top>
          {top}
        </a>
      </div>
      {open && (
        <div id={`${p.id}-t`} class="panel-tables">
          {(p.tables ?? []).map((t) => (
            <DataTable key={t.caption} t={t} />
          ))}
        </div>
      )}
    </section>
  );
}

function Links({ list }: { list: readonly { name: string; url: string; sep?: string }[] }) {
  return (
    <>
      {list.map((x, i) => (
        <Fragment key={x.url + i}>
          <a href={x.url}>{x.name}</a>
          {x.sep ?? (i < list.length - 1 ? '; ' : '')}
        </Fragment>
      ))}
    </>
  );
}

function ChartFigure({ g }: { g: Chart }) {
  return (
    <figure class="chart">
      {g.title && <h3>{g.title}</h3>}
      <svg viewBox={g.vb} width={g.w} height={g.h} role="img" aria-label={g.alt}>
        {g.rects.map((r, i) => (
          <rect key={`r${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} stroke={r.stroke} stroke-width={r.sw} />
        ))}
        {g.paths.map((p, i) => (
          <path key={`p${i}`} d={p.d} fill={p.fill} fill-opacity={p.fo} stroke={p.stroke} stroke-width={p.sw} stroke-dasharray={p.dash} stroke-linejoin="round" stroke-linecap="round" />
        ))}
        {g.circles.map((c, i) => (
          <circle key={`c${i}`} cx={c.x} cy={c.y} r={c.r} fill={c.fill} />
        ))}
        <g aria-hidden="true">
          {g.texts.map((t, i) => (
            <text key={`t${i}`} x={t.x} y={t.y} text-anchor={t.anchor} dominant-baseline={t.baseline} font-size={t.fs} font-weight={t.fw} fill={t.fill}>
              {t.s}
            </text>
          ))}
        </g>
      </svg>
    </figure>
  );
}

function DataTable({ t }: { t: Table }) {
  return (
    <div class="dtable-scroll" role="region" aria-label={t.caption} tabindex={0}>
      <div class={`dtable dtable--n${t.n}`} role="table" aria-label={t.caption}>
        <p aria-hidden="true">{t.caption}</p>
        <div role="row">
          {t.cols.map((h) => (
            <span key={h.s} role="columnheader" class={h.al === 'right' ? 'is-right' : undefined}>
              {h.s}
            </span>
          ))}
        </div>
        {t.rows.map((row, i) => (
          <div key={i} role="row">
            {row.cells.map((c, j) => (
              <span key={j} role="cell" class={c.al === 'right' ? 'is-right' : undefined}>
                {c.s}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
