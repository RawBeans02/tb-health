// Places: the full list with filters and an optional map (README:202–211), ported from
// Places.dc.html. It owns <main> and always switches language in place, so filters and a
// location fix survive (PLAN §4.2). Owner fixes: location only on a tap, also for
// ?loc=gps links (Q4); place links carry only the id (Q4a); an emptied field doesn't reuse
// an old fix (Q4); a failed load offers "Try again", never the sample (Q6).
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { care } from '../content/care.ts';
import type { home } from '../content/home.ts';
import type { places } from '../content/places.ts';
import { fill } from '../content/types.ts';
import { loadFacilities, type Dataset } from '../lib/core/data.ts';
import { SERVICES, type Service } from '../lib/core/facility.ts';
import { distanceLabel, matchPlace, type Point } from '../lib/core/geo.ts';
import { isNeed } from '../lib/core/links.ts';
import { locate } from '../lib/core/locate.ts';
import { activeFilters, filterPlaces, NO_FILTERS, provinceOptions, regionOptions, type PlaceFilters, type Sector } from '../lib/core/places.ts';
import { isPoint, resolveOrigin } from '../lib/core/route.ts';
import { href, isLang, type Lang } from '../lib/i18n.ts';
import { BottomSheet, FacilityRow, LocationField, SegmentedControl, Select, Switch } from '../ui/controls.tsx';
import { InfoLine, statusLabel } from '../ui/parts.tsx';
import { createMap, loadLeaflet, type PlacesMap } from './placesMap.ts';

export type PlacesStrings = Record<keyof typeof places | keyof typeof care | keyof typeof home, string>;

interface Props {
  lang: Lang;
  strings: Record<Lang, PlacesStrings>;
}

const PAGE = 20;
const WIDE = '(min-width: 67.5em)'; // 1080px at the default text size, as in places.css
const number = (n: number) => n.toLocaleString('en-US');

/** Where the visitor came from, for "Back to your route". */
interface FromRoute {
  need: string;
  near: string;
  loc: boolean;
}

export default function Places(props: Props) {
  const [lang, setLang] = useState<Lang>(props.lang);
  const t = props.strings[lang];
  const [data, setData] = useState<Dataset | null>(null);
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filters, setFilters] = useState<PlaceFilters>(NO_FILTERS);
  const [from, setFrom] = useState('');
  const [gps, setGps] = useState<Point | null>(null);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const [byDistance, setByDistance] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [limit, setLimit] = useState(PAGE);
  const [sheet, setSheet] = useState<'closed' | 'open' | 'closing'>('closed');
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fromRoute, setFromRoute] = useState<FromRoute | null>(null);
  const filtersButton = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<PlacesMap | null>(null);
  const mapLoading = useRef(false);
  const initial = useRef<URLSearchParams | null>(null);
  // Focus that would be lost when a control unmounts (audit B8): the first row "Show more"
  // added, and the loading line, then the result, after "Try again".
  const listRef = useRef<HTMLUListElement>(null);
  const countRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const mapStatusRef = useRef<HTMLParagraphElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const mapRetryRef = useRef<HTMLButtonElement>(null);
  const firstNewRow = useRef<number | null>(null);
  const retrying = useRef<'' | 'list' | 'map'>('');
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    initial.current = params;
    const svc = params.get('svc');
    if (svc === 'xray' || svc === 'test' || svc === 'meds') setFilters((f) => ({ ...f, svc }));
    const need = params.get('need') ?? '';
    const near = params.get('near') ?? '';
    const loc = params.get('loc') === 'gps';
    if (need || near || loc) setFromRoute({ need: isNeed(need) ? need : '', near: '', loc });
    // Places holds filters and maybe a location fix, so the language always switches in place.
    document.documentElement.dataset.langSwitch = 'inplace';
    fetchList();
    const wide = matchMedia(WIDE);
    const onWide = () => wide.matches && setSheet('closed');
    wide.addEventListener('change', onWide);
    return () => {
      wide.removeEventListener('change', onWide);
      delete document.documentElement.dataset.langSwitch;
    };
  }, []);

  // The URL's place, once the list can match it (never free text, Q4). ?loc=gps only
  // leaves "Use my location" for the visitor to tap.
  useEffect(() => {
    if (!data || !initial.current) return;
    const near = initial.current.get('near');
    initial.current = null;
    const g = near ? matchPlace(near.slice(0, 100), data.gaz) : null;
    if (g) {
      setFrom((value) => value || g.label);
      setFromRoute((r) => (r ? { ...r, near: g.label } : r));
    }
  }, [data]);

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

  const origin = data ? resolveOrigin({ text: from, gps, myLocation }, data.gaz) : null;
  const point = origin && isPoint(origin) ? origin : null;
  const fromGps = !!point && 'gps' in point && point.gps === true;
  const { rows, noXray } = data ? filterPlaces(data.list, filters, point, byDistance) : { rows: [], noXray: false };
  const placeHref = (id: string) => href('place', lang, { id });

  // The map: Leaflet loads only when "Map" is chosen, and is removed when it isn't.
  useEffect(() => {
    if (view !== 'map' || !mapEl.current || mapState === 'error') return;
    if (mapRef.current) {
      mapRef.current.show(rows, point, placeHref, lang);
      return;
    }
    if (mapLoading.current) return;
    mapLoading.current = true;
    loadLeaflet().then(
      (L) => {
        mapLoading.current = false;
        if (!mapEl.current) return;
        mapRef.current = createMap(L, mapEl.current);
        setMapState('ready');
      },
      () => {
        mapLoading.current = false;
        setMapState('error');
      },
    );
  });
  useEffect(() => {
    if (firstNewRow.current === null) return;
    listRef.current?.children[firstNewRow.current]?.querySelector<HTMLElement>('a')?.focus();
    firstNewRow.current = null;
  }, [limit]);

  useEffect(() => {
    if (retrying.current !== 'list') return;
    if (load === 'loading') statusRef.current?.focus();
    else {
      retrying.current = '';
      (load === 'ready' ? countRef.current : retryRef.current)?.focus();
    }
  }, [load]);

  useEffect(() => {
    if (retrying.current !== 'map') return;
    if (mapState === 'loading') mapStatusRef.current?.focus();
    else {
      retrying.current = '';
      (mapState === 'ready' ? mapEl.current : mapRetryRef.current)?.focus();
    }
  }, [mapState]);

  useEffect(() => {
    if (view === 'map') return;
    mapRef.current?.destroy();
    mapRef.current = null;
  }, [view]);

  function update(patch: Partial<PlaceFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  }

  function useLocation() {
    setLocating(true);
    setDenied(false);
    locate().then(
      (fix) => {
        setLocating(false);
        setGps(fix);
        setFrom(t.myLoc);
        setByDistance(true);
      },
      () => {
        setLocating(false);
        setDenied(true);
        setGps(null);
      },
    );
  }

  const count = activeFilters(filters);
  const countLabel = data ? (rows.length === 1 ? t.countOne.replace('{n}', '1') : fill(t.count, { n: number(rows.length) })) : '';
  const shown = rows.slice(0, limit);
  const regions = data ? regionOptions(data.list) : [];
  const provinces = data ? provinceOptions(data.list, filters.region) : [];
  const showDistance = (d: number | null, precise: boolean) => {
    const label = distanceLabel(d, precise && fromGps);
    return label ? (label.approx ? fill(t.about, { km: label.km }) : label.km) : '';
  };

  const filterFields = (prefix: string) => (
    <>
      <div class="field">
        <label class="field-label" for={`${prefix}-q`}>
          {t.search}
        </label>
        <input id={`${prefix}-q`} class="text-input" type="search" value={filters.q} onInput={(e) => update({ q: e.currentTarget.value })} autocomplete="off" />
      </div>
      <Select
        id={`${prefix}-region`}
        label={t.region}
        value={filters.region}
        options={[{ value: '', label: t.allRegions }, ...regions.map((r) => ({ value: r.code, label: r.name }))]}
        onChange={(region) => update({ region, prov: '' })}
      />
      <Select
        id={`${prefix}-prov`}
        label={t.prov}
        value={filters.prov}
        options={[{ value: '', label: t.allProv }, ...provinces.map((p) => ({ value: p, label: p }))]}
        onChange={(prov) => update({ prov })}
      />
      <div class="field">
        <span class="field-label">{t.type}</span>
        <SegmentedControl<Sector>
          label={t.type}
          options={[
            { key: '', label: t.all },
            { key: 'gov', label: t.type_gov },
            { key: 'priv', label: t.type_priv },
          ]}
          value={filters.sector}
          onChange={(sector) => update({ sector })}
        />
      </div>
      {count > 0 && (
        <button type="button" class="clear-link" onClick={() => update(NO_FILTERS)}>
          {t.clear}
        </button>
      )}
    </>
  );

  return (
    <>
      <div ref={content} class="frame frame--back places">
        <section id="intro" class="places-intro" data-anchor>
          {fromRoute && (
            <a class="back-link" href={href('home', lang, { query: { need: fromRoute.need || undefined, near: fromRoute.near || undefined, loc: fromRoute.loc ? 'gps' : undefined } })}>
              <span aria-hidden="true">‹</span>
              <span>{t.backRoute}</span>
            </a>
          )}
          <h1 class="h1">{t.heading}</h1>
          <p class="places-lede">{t.intro}</p>
          <div class="offline-line">
            <InfoLine role="status">{t.offline}</InfoLine>
          </div>
        </section>

        <div class="places-layout">
          <aside class="filters-panel" aria-labelledby="flt-h">
            <h2 id="flt-h">{t.filters}</h2>
            {filterFields('panel')}
          </aside>

          <div id="results" class="places-results" data-anchor>
            <div role="search" class="places-search">
              <LocationField
                id="near"
                label={t.fromLabel}
                placeholder={t.fromPh}
                value={from}
                onInput={(value) => {
                  setFrom(value);
                  setLimit(PAGE);
                }}
                gaz={data?.gaz ?? null}
                locLabel={t.useLoc}
                locating={locating}
                onLocate={useLocation}
                message={denied ? { text: t.denied, error: false } : null}
              />
              <div class="field">
                <span class="field-label">{t.service}</span>
                <SegmentedControl<'' | Service>
                  class="segmented--quad"
                  label={t.service}
                  options={[{ key: '', label: t.all }, ...SERVICES.map((k) => ({ key: k, label: t[`seg_${k}`] }))]}
                  value={filters.svc}
                  onChange={(svc) => update({ svc })}
                />
              </div>
            </div>

            <div class="places-toolbar">
              <h2 ref={countRef} class="h2 tabular" aria-live="polite" tabIndex={-1}>
                {countLabel}
              </h2>
              <div class="places-tools">
                <button ref={filtersButton} type="button" class="btn btn--soft btn--md filters-button" aria-haspopup="dialog" onClick={() => setSheet('open')}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <path d="M4 7h16M7 12h10M10 17h4" />
                  </svg>
                  {count ? fill(t.filtersCount, { n: String(count) }) : t.filters}
                </button>
                <div class="view-toggle">
                  <SegmentedControl<'list' | 'map'>
                    label={t.view}
                    options={[
                      { key: 'list', label: t.list },
                      { key: 'map', label: t.map },
                    ]}
                    value={view}
                    onChange={setView}
                  />
                </div>
              </div>
            </div>

            {point && <Switch checked={byDistance} label={t.sortDist} onChange={setByDistance} />}

            {load === 'loading' && (
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
                    retrying.current = 'list';
                    fetchList();
                  }}
                >
                  {t.retry}
                </button>
              </div>
            )}
            {data && noXray && <InfoLine>{t.noXray}</InfoLine>}
            {data && rows.length === 0 && (
              <div class="empty-panel">
                <p>{t.empty}</p>
                <button type="button" class="btn btn--primary btn--sm" onClick={() => update(NO_FILTERS)}>
                  {t.clear}
                </button>
              </div>
            )}

            {view === 'map' && (
              <div class="map-block">
                <div class="map-frame">
                  <div ref={mapEl} class="map" role="region" aria-label={t.map} />
                  {mapState !== 'ready' && (
                    <div class="map-status" role="status">
                      <p ref={mapStatusRef} tabIndex={-1}>
                        {mapState === 'error' ? t.mapError : t.mapLoading}
                      </p>
                      {mapState === 'error' && (
                        <button
                          ref={mapRetryRef}
                          type="button"
                          class="btn btn--soft btn--md"
                          onClick={() => {
                            retrying.current = 'map';
                            setMapState('loading');
                          }}
                        >
                          {t.retry}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {data?.sample && <p class="footnote">{t.approxPins}</p>}
              </div>
            )}

            {view === 'list' && shown.length > 0 && (
              <ul ref={listRef} class="group" role="list">
                {shown.map(({ p, d }) => {
                  const keys = filters.svc ? [filters.svc] : SERVICES.filter((k) => p.svc[k] !== 'no');
                  return (
                    <FacilityRow
                      key={p.id}
                      place={p}
                      href={placeHref(p.id)}
                      distance={d === null ? '' : showDistance(d, p.precise)}
                      chips={keys.map((k) => ({ status: p.svc[k], label: statusLabel(t, p.svc[k]), prefix: filters.svc ? undefined : `${t[`svc_${k}`]}:` }))}
                      heading="h3"
                      t={t}
                    />
                  );
                })}
                {rows.length > shown.length && (
                  <li class="link-row-item">
                    <button
                      type="button"
                      class="link-row link-row--button"
                      onClick={() => {
                        firstNewRow.current = limit;
                        setLimit(limit + PAGE);
                      }}
                    >
                      {fill(t.more, { n: number(rows.length - shown.length) })}
                    </button>
                  </li>
                )}
              </ul>
            )}

            <div class="footnotes">
              <p>{t.rule}</p>
              <p>{t.dataNote}</p>
              {data?.sample && <p>{fill(t.sample, { n: String(data.list.length), r: String(data.regions) })}</p>}
            </div>
          </div>
        </div>
      </div>

      {sheet !== 'closed' && (
        <BottomSheet
          title={t.filters}
          subtitle={countLabel}
          doneLabel={t.done}
          closing={sheet === 'closing'}
          onClose={() => setSheet('closing')}
          onClosed={() => setSheet('closed')}
          returnFocus={filtersButton}
          background={content}
        >
          {filterFields('sheet')}
        </BottomSheet>
      )}
    </>
  );
}
