// Home's route planner (README:155–198), ported from Home.dc.html. It owns all of <main>
// so an in-place language switch (PLAN §4.2) can re-render it while a location fix is held.
// Owner fixes: location only on a tap, including ?loc=gps links (Q4); the URL keeps only a
// matched place or a gps flag (Q4); the initial URL is applied once, so "Try again" never
// re-prompts or overwrites the field (Q4); a failed load shows an error, never the sample (Q6).
import { Fragment, type RefObject } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { care } from '../content/care.ts';
import type { home } from '../content/home.ts';
import { fill } from '../content/types.ts';
import { loadFacilities, type Dataset } from '../lib/core/data.ts';
import { SERVICES, type Service } from '../lib/core/facility.ts';
import { distanceLabel, type Point } from '../lib/core/geo.ts';
import { homeQuery, readHomeParams, type Need } from '../lib/core/links.ts';
import { locate } from '../lib/core/locate.ts';
import { isPoint, resolveOrigin, route, type Origin, type Route } from '../lib/core/route.ts';
import { href, isLang, type Lang } from '../lib/i18n.ts';
import { FacilityRow, LocationField } from '../ui/controls.tsx';
import { InfoLine, LinkRow, statusLabel } from '../ui/parts.tsx';

export type PlannerStrings = Record<keyof typeof home | keyof typeof care, string>;

interface Props {
  lang: Lang;
  strings: Record<Lang, PlannerStrings>;
  sources: readonly { name: string; url: string }[];
  /** False when the site launches without Check (Q9): the "Not sure yet?" link goes. */
  withCheck: boolean;
}

interface Result {
  origin: Origin;
  route: Route;
  need: Need;
}

type Load = 'loading' | 'ready' | 'error';

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scrolls `el` into view when it's above 70px or below 60% of the window (the prototype's rule). */
function intoView(el: HTMLElement) {
  const top = el.getBoundingClientRect().top;
  if (top < 70 || top > innerHeight * 0.6) {
    scrollTo({ top: Math.max(0, top + scrollY - 90), behavior: reducedMotion() ? 'instant' : 'smooth' });
  }
}

export default function Planner(props: Props) {
  const [lang, setLang] = useState<Lang>(props.lang);
  const t = props.strings[lang];
  const [data, setData] = useState<Dataset | null>(null);
  const [load, setLoad] = useState<Load>('loading');
  const [from, setFrom] = useState('');
  const [gps, setGps] = useState<Point | null>(null);
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState<'' | 'none' | 'denied'>('');
  const [need, setNeed] = useState<Need>('all');
  const [result, setResult] = useState<Result | null>(null);
  const [waiting, setWaiting] = useState(false); // submitted before the list arrived
  const [retried, setRetried] = useState(false);
  const [drawn, setDrawn] = useState(true);
  const fromRef = useRef<HTMLInputElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);
  // After "Try again" (audit B8): the loading line, then the field (or the route, when a
  // submit was waiting), or "Try again" again if it fails.
  const statusRef = useRef<HTMLParagraphElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const retrying = useRef(false);
  const initial = useRef<ReturnType<typeof readHomeParams> | null>(null);
  const myLocation = useMemo(() => [props.strings.en.myLoc, props.strings.fil.myLoc], [props.strings]);

  function fetchList() {
    setLoad('loading');
    loadFacilities().then(
      (dataset) => {
        setData(dataset);
        setLoad('ready');
      },
      () => setLoad('error'),
    );
  }

  // First load: the need from the URL straight away; `near` once the list can match it.
  useEffect(() => {
    const need = new URLSearchParams(location.search).get('need');
    if (need === 'all' || need === 'xray' || need === 'test' || need === 'meds') setNeed(need);
    fetchList();
  }, []);

  useEffect(() => {
    if (!data) return;
    setWaiting(false);
    if (!initial.current) {
      initial.current = readHomeParams(location.search, data.gaz);
      const near = initial.current.near;
      // Not over something the reader typed while a failed load waited for "Try again".
      if (near && !from.trim()) {
        setFrom(near.label);
        run({ text: near.label, focus: true, animate: true });
        return;
      }
      // ?loc=gps only shows "Use my location"; the browser asks when it's tapped (Q4).
    }
    if (waiting) {
      setWaiting(false);
      run({ focus: true, animate: true });
    }
  }, [data]);

  useEffect(() => {
    if (!retrying.current) return;
    if (load === 'loading') {
      statusRef.current?.focus();
      return;
    }
    retrying.current = false;
    if (load === 'error') retryRef.current?.focus();
    else if (!waiting) fromRef.current?.focus(); // a waiting submit focuses its route instead
  }, [load]);

  // While a location fix is held, the language switches in place so the fix isn't lost.
  useEffect(() => {
    const html = document.documentElement;
    if (gps) html.dataset.langSwitch = 'inplace';
    else delete html.dataset.langSwitch;
  }, [gps]);

  useEffect(() => {
    const onLang = (event: Event) => {
      const next = (event as CustomEvent<{ lang?: unknown }>).detail?.lang;
      if (!isLang(next)) return;
      setFrom((value) => (value === props.strings[lang].myLoc ? props.strings[next].myLoc : value));
      setLang(next);
    };
    document.addEventListener('tbph:lang', onLang);
    return () => document.removeEventListener('tbph:lang', onLang);
  }, [lang]);

  // After a new result: move focus to its heading, and start the draw-in.
  useEffect(() => {
    if (focusNext.current && headRef.current) {
      focusNext.current = false;
      intoView(headRef.current);
      headRef.current.focus({ preventScroll: true });
    }
    if (!drawn) {
      // Two frames, so the undrawn state is painted before the transition starts.
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
      return () => cancelAnimationFrame(id);
    }
  }, [result, drawn]);

  function writeUrl(query: Record<string, string | undefined>) {
    const params = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const search = params.toString();
    history.replaceState(history.state, '', location.pathname + (search ? `?${search}` : '') + location.hash);
  }

  // A submit (or a location fix) before the list is there is kept and runs once it loads,
  // as in the prototype; the loading line or the error comes into view, and on an error
  // focus goes to "Try again" (audit B16).
  const revealPending = useRef(false);
  useEffect(() => {
    if (!revealPending.current) return;
    revealPending.current = false;
    const box = document.querySelector<HTMLElement>('#route .results-error, #route .results-status');
    if (box) intoView(box);
    if (load === 'error') retryRef.current?.focus({ preventScroll: true });
  });

  function run(options: { text?: string; fix?: Point | null; needOverride?: Need; focus: boolean; animate: boolean }) {
    const currentNeed = options.needOverride ?? need;
    if (!data) {
      setWaiting(true);
      revealPending.current = options.focus;
      return;
    }
    const origin = resolveOrigin({ text: options.text ?? from, gps: options.fix === undefined ? gps : options.fix, myLocation }, data.gaz);
    if (!origin) {
      setMsg('none');
      setResult(null);
      writeUrl({ need: currentNeed, near: undefined, loc: undefined });
      fromRef.current?.focus();
      return;
    }
    const services: readonly Service[] = currentNeed === 'all' ? SERVICES : [currentNeed];
    setMsg('');
    focusNext.current = options.focus;
    setDrawn(!(options.animate && !reducedMotion()));
    setResult({ origin, route: route(data.list, origin, services), need: currentNeed });
    writeUrl(homeQuery(currentNeed, origin));
  }

  function onSubmit(event: Event) {
    event.preventDefault();
    run({ focus: true, animate: true });
  }

  function pickNeed(next: Need) {
    setNeed(next);
    if (result) run({ needOverride: next, focus: false, animate: false });
    else writeUrl({ need: next });
  }

  function useLocation() {
    setLocating(true);
    setMsg('');
    locate().then(
      (fix) => {
        setLocating(false);
        setGps(fix);
        setFrom(t.myLoc);
        run({ text: t.myLoc, fix, focus: true, animate: true });
      },
      () => {
        setLocating(false);
        setGps(null);
        setMsg('denied');
        fromRef.current?.focus();
      },
    );
  }

  // The prototype showed nothing while "Try again" reloaded; now it shows the loading line.
  const loading = load === 'loading' && (waiting || retried);
  const showResults = loading || load === 'error' || !!result;

  return (
    <>
      <section id="planner" class="planner" data-anchor>
        <div class="planner-map" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path class="map-streets" d="M-5 30 L105 21 M-5 63 L105 76 M14 -5 L20 105 M57 -5 L51 105 M92 -5 L88 105" />
            <path class="map-casing" d="M80 -10 L80 20 L30 40 L30 68 L74 86 L74 110" />
            <path class="map-route" d="M80 -10 L80 20 L30 40 L30 68 L74 86 L74 110" />
          </svg>
          <span class="map-dot map-dot--you" />
          <span class="map-dot map-dot--1" />
          <span class="map-dot map-dot--2" />
          <span class="map-dot map-dot--3" />
        </div>
        <div class="planner-inner">
          <form class="planner-sheet" onSubmit={onSubmit} noValidate>
            <div class="planner-block">
              <h1 class="h1">{t.h1}</h1>
              <p class="planner-lede">{t.lede}</p>
            </div>

            <LocationField
              id="from"
              label={t.fromLabel}
              placeholder={t.fromPh}
              value={from}
              onInput={(value) => {
                setFrom(value);
                setMsg('');
              }}
              inputRef={fromRef}
              gaz={data?.gaz ?? null}
              locLabel={t.useLoc}
              locating={locating}
              onLocate={useLocation}
              invalid={msg === 'none'}
              message={msg ? { text: msg === 'none' ? t.noLoc : t.denied, error: msg === 'none' } : null}
              note={t.locNote}
            />

            <fieldset>
              <legend>{t.need}</legend>
              <div class="group">
                <label class={`choice choice--all${need === 'all' ? ' is-on' : ''}`} data-choice>
                  <input type="radio" name="need" value="all" checked={need === 'all'} onChange={() => pickNeed('all')} />
                  <span class="choice-glyph" aria-hidden="true">
                    <span class="route-glyph">
                      <span class="dot" />
                      <span class="bar" />
                      <span class="dot" />
                      <span class="bar" />
                      <span class="dot" />
                    </span>
                  </span>
                  <span class="choice-text">
                    <span>{t.optAll}</span>
                    <span class="choice-check" aria-hidden="true">
                      {need === 'all' ? '✓' : ''}
                    </span>
                  </span>
                </label>
                {SERVICES.map((k, i) => (
                  <label key={k} class={`choice${need === k ? ' is-on' : ''}${need === k || need === 'all' ? ' is-included' : ''}`} data-choice>
                    <input type="radio" name="need" value={k} checked={need === k} onChange={() => pickNeed(k)} />
                    <span class="choice-glyph" aria-hidden="true">
                      <span class="num-disc">{i + 1}</span>
                    </span>
                    <span class="choice-text">
                      <span>{t[`svc_${k}`]}</span>
                      <span class="choice-check" aria-hidden="true">
                        {need === k ? '✓' : ''}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div class="planner-actions">
              <button type="submit" class="btn btn--primary">
                {t.go}
              </button>
              {props.withCheck && (
                <a class="text-link" href={href('check', lang)}>
                  {t.optNotSure}
                </a>
              )}
            </div>
          </form>
        </div>
      </section>

      {showResults && (
        <div id="route" class="results" data-anchor>
          <div class="results-inner">
            {loading && (
              <p ref={statusRef} class="results-status" role="status" tabIndex={-1}>
                {t.loading}
              </p>
            )}
            {load === 'error' && (
              <div class="results-error" role="alert">
                <p>{t.failed}</p>
                <button
                  ref={retryRef}
                  type="button"
                  class="btn btn--soft btn--md"
                  onClick={() => {
                    setRetried(true);
                    retrying.current = true;
                    fetchList();
                  }}
                >
                  {t.retry}
                </button>
              </div>
            )}
            {load !== 'error' && result && data && <RouteView result={result} data={data} lang={lang} t={t} sources={props.sources} drawn={drawn} headRef={headRef} />}
          </div>
        </div>
      )}

      <section class="reassure" aria-label={t.reassureLabel}>
        <div class="reassure-inner">
          <ul class="group" role="list">
            <li>{t.reassure1}</li>
            <li>{t.reassure2}</li>
            <li>{t.reassure3}</li>
          </ul>
          <p class="teaser">
            {t.teaser} <a href={href('data', lang)}>{t.teaserLink}</a>
          </p>
        </div>
      </section>
    </>
  );
}

interface RouteViewProps {
  result: Result;
  data: Dataset;
  lang: Lang;
  t: PlannerStrings;
  sources: Props['sources'];
  drawn: boolean;
  headRef: RefObject<HTMLHeadingElement | null>;
}

function RouteView({ result, data, lang, t, sources, drawn, headRef }: RouteViewProps) {
  const { origin, route: r, need } = result;
  const fromGps = isPoint(origin) && 'gps' in origin && origin.gps === true;

  if (r.empty) {
    return (
      <div class="no-match">
        <h2 class="h2" ref={headRef} tabindex={-1}>
          {t.noMatch}
        </h2>
        <p>{t.noLoc}</p>
      </div>
    );
  }

  const single = need !== 'all';
  const showDistance = (d: number | null, precise: boolean) => {
    const label = distanceLabel(d, precise && fromGps);
    return label ? (label.approx ? fill(t.about, { km: label.km }) : label.km) : '';
  };
  const nearest = r.stops
    .flatMap((s) => s.items)
    .filter((x) => x.d !== null)
    .sort((a, b) => a.d! - b.d!)[0];
  const heading = single
    ? t[`stopTitle_${need as Service}`]
    : t.routeOf + (nearest ? ` ${fill(t.nearest, { distance: showDistance(nearest.d, nearest.p.precise) })}` : '');
  // Links into Places keep a matched place or the gps flag (Q4); place links carry only id and stop (Q4a).
  const placesQuery = homeQuery(need, origin);

  return (
    <section class="route" aria-labelledby="route-h" data-drawn={drawn ? 'true' : 'false'}>
      <h2 id="route-h" class="route-heading" ref={headRef} tabindex={-1}>
        {heading}
      </h2>
      <ol class="route-steps" role="list">
        <li class="route-step route-step--origin" data-i="0">
          <span class="rail" aria-hidden="true" />
          <span class="rail-fill" aria-hidden="true" />
          <span class="you-dot" aria-hidden="true" />
          <p class="route-origin">{fromGps || !('label' in origin) ? t.myLoc : origin.label}</p>
        </li>
        {r.stops.map((stop, i) => {
          const n = SERVICES.indexOf(stop.k) + 1;
          return (
            <li key={stop.k} class="route-step" data-i={String(i + 1)}>
              <span class="rail" aria-hidden="true" />
              <span class="rail-fill" aria-hidden="true" />
              <span class="stop-disc" aria-hidden="true">
                {n}
              </span>
              <div class="stop-body">
                {!single && (
                  <h3 class="stop-title">
                    <span class="visually-hidden">{n}. </span>
                    {t[`stopTitle_${stop.k}`]}
                  </h3>
                )}
                <p class="stop-text">{t[`stopText_${stop.k}`]}</p>
                {stop.mode !== 'ok' && <InfoLine>{stop.mode === 'far' ? t.far : t.noXray}</InfoLine>}
                <ul class="group" role="list">
                  {stop.items.map(({ p, d }) => (
                    <FacilityRow
                      key={p.id}
                      place={p}
                      href={href('place', lang, { id: p.id, query: { stop: single ? undefined : String(n) } })}
                      distance={d === null ? '' : showDistance(d, p.precise)}
                      chips={[{ status: p.svc[stop.k], label: statusLabel(t, p.svc[stop.k]) }]}
                      heading="h4"
                      t={t}
                    />
                  ))}
                  <li class="link-row-item">
                    <LinkRow href={href('places', lang, { query: { svc: stop.k, near: placesQuery.near, loc: placesQuery.loc } })}>{t.seeMore}</LinkRow>
                  </li>
                </ul>
              </div>
            </li>
          );
        })}
        <li class="route-step route-step--end">
          <span class="end-ring" aria-hidden="true" />
          <div class="end-body">
            <h3 class="bring-title">{t.bringTitle}</h3>
            <ul class="group bring" role="list">
              <li>{t.bring1}</li>
              <li>{t.bring2}</li>
              <li>{t.bring3}</li>
              <li>{t.bring4}</li>
              <li>{t.bring5}</li>
            </ul>
          </div>
        </li>
      </ol>
      <div class="route-notes">
        <p>{t.rule}</p>
        {data.sample && <p>{t.approxPins}</p>}
        <p>{t.dataNote}</p>
        <p>
          {t.sources}{' '}
          {sources.map((s, i) => (
            <Fragment key={s.url}>
              <a href={s.url}>{s.name}</a>
              {i < sources.length - 1 ? '; ' : ''}
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
