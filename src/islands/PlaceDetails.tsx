// The place page (README:213–220), ported from Place.dc.html. Prerendered once per place and
// language (Q6) and hydrated for the actions. Its links carry only id and stop (Q4a); the
// stop motif is CSS keyed on html[data-stop], set before paint. A distance shows only from a
// typed `near` that matches a known city or province, never from GPS (Q4b).
import { useEffect, useState } from 'preact/hooks';
import type { care } from '../content/care.ts';
import type { place as placeStrings } from '../content/place.ts';
import { fill } from '../content/types.ts';
import { copyForSakay } from '../lib/core/clipboard.ts';
import { SERVICES, type Place } from '../lib/core/facility.ts';
import { distanceLabel, fromCompact, km, matchPlace, type GazBase } from '../lib/core/geo.ts';
import { directionsUrl } from '../lib/core/links.ts';
import { href, type Lang } from '../lib/i18n.ts';
import { Chip, InfoLine, SectorBadge, statusLabel } from '../ui/parts.tsx';

export type PlaceStrings = Record<keyof typeof care | keyof typeof placeStrings | 'nav_home', string>;

interface Props {
  place: Place;
  lang: Lang;
  t: PlaceStrings;
  /** Hours, phone, region, accreditation date: formatted at build time. */
  details: readonly { label: string; value: string }[];
  sample: boolean;
}

export default function PlaceDetails({ place: p, lang, t, details, sample }: Props) {
  const [copied, setCopied] = useState<'' | 'ok' | 'fail'>('');
  const [distance, setDistance] = useState('');

  // Q4b: a distance only from a typed `near` that the gazetteer knows.
  useEffect(() => {
    const near = new URLSearchParams(location.search).get('near')?.slice(0, 100);
    if (!near || p.lat === null || p.lng === null) return;
    fetch('/data/gazetteer.json')
      .then((response) => (response.ok ? (response.json() as Promise<GazBase[]>) : Promise.reject(new Error(String(response.status)))))
      .then((entries) => {
        const g = matchPlace(near, fromCompact(entries));
        const label = g ? distanceLabel(km(g, { lat: p.lat!, lng: p.lng! }), false) : null;
        if (label) setDistance(fill(t.about, { km: label.km }));
      })
      .catch(() => {
        // No distance; nothing else depends on it.
      });
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(''), 8000);
    return () => clearTimeout(id);
  }, [copied]);

  // Back to the route: the route lives in Home's address, so going back restores it.
  function onBack(event: MouseEvent) {
    if (!document.documentElement.hasAttribute('data-stop') || history.length < 2) return;
    try {
      const from = new URL(document.referrer);
      if (from.origin === location.origin && (from.pathname === '/' || from.pathname === '/fil')) {
        event.preventDefault();
        history.back();
      }
    } catch {
      // No usable referrer: follow the link to Home.
    }
  }

  const services = SERVICES.filter((k) => p.svc[k] !== 'no');

  return (
    <div class="place">
      <a class="back-link" href={href('home', lang)} onClick={onBack}>
        <span aria-hidden="true">‹</span>
        <span class="back-label back-label--home">{t.nav_home}</span>
        <span class="back-label back-label--route">{t.backRoute}</span>
      </a>

      <div class="offline-line">
        <InfoLine role="status">{t.offlinePlace}</InfoLine>
      </div>

      <div class="stop-panel">
        {[1, 2, 3].map((n) => (
          <p key={n} class="stop-label" data-n={n}>
            {fill(t.stopOf, { n: String(n), m: '3' })}
          </p>
        ))}
        <div class="motif" aria-hidden="true">
          <span class="motif-track" />
          <span class="motif-fill" />
          {SERVICES.map((k, i) => (
            <span key={k} class="motif-step" data-n={i + 1}>
              <span class="motif-disc">{i + 1}</span>
              <span class="motif-name">{t[`svc_${k}`]}</span>
            </span>
          ))}
        </div>
      </div>

      <div class="place-head">
        <h1 class="place-name">{p.name}</h1>
        <div class="place-meta">
          {distance && <span class="place-dist">{distance}</span>}
          <SectorBadge gov={p.gov} label={p.gov ? t.gov : t.priv} />
        </div>
        <p class="place-address">{p.address}</p>
      </div>

      <div class="place-actions">
        <a class="btn btn--primary place-commute" href={directionsUrl(p, 'transit')} target="_blank" rel="noopener" aria-label={`${t.commute}: ${p.name}`}>
          {t.commute}
        </a>
        <div class="place-more">
          <a class="btn btn--soft btn--md" href={directionsUrl(p, 'walking')} target="_blank" rel="noopener" aria-label={`${t.walk}: ${p.name}`}>
            {t.walk}
          </a>
          <a class="btn btn--soft btn--md" href={directionsUrl(p, 'driving')} target="_blank" rel="noopener" aria-label={`${t.drive}: ${p.name}`}>
            {t.drive}
          </a>
          <button type="button" class="btn btn--soft btn--md place-sakay" onClick={() => copyForSakay(`${p.name}, ${p.address}`).then((ok) => setCopied(ok ? 'ok' : 'fail'))}>
            {t.sakay}
          </button>
        </div>
        {p.tel && (
          <a class="place-call" href={p.tel} aria-label={`${t.call}: ${p.name}, ${p.first}`}>
            {t.call}
          </a>
        )}
        <p class="place-copied" role="status">
          {copied === 'ok' ? t.copied : copied === 'fail' ? `${t.copyFail} ${p.name}, ${p.address}` : ''}
        </p>
      </div>

      <section class="place-section" aria-labelledby="svc-h">
        <h2 id="svc-h" class="h2">
          {t.services}
        </h2>
        <ul class="group inset-group" role="list">
          {services.map((k) => (
            <li key={k}>
              <div class="service-row">
                <span class="service-name">{t[`svc_${k}`]}</span>
                <Chip status={p.svc[k]} label={statusLabel(t, p.svc[k])} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section class="place-section" aria-labelledby="det-h">
        <h2 id="det-h" class="h2">
          {t.details}
        </h2>
        <dl class="group inset-group">
          {details.map((d) => (
            <div key={d.label}>
              <div class="detail-row">
                <dt>{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <div class="footnotes">
        <p>{t.rule}</p>
        {sample && <p>{t.approxPins}</p>}
        <p>{t.dataNote}</p>
      </div>

      <ul class="group install-entry" role="list">
        <li>
          <a class="install-row" href={href('install', lang)}>
            <span>{t.install}</span>
            <span class="link-row-chevron" aria-hidden="true">
              ›
            </span>
          </a>
        </li>
      </ul>
    </div>
  );
}

