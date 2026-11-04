// The care route, ported from tbph-core.js (route) and Home.dc.html (origin), with the
// owner's fixes: text shorter than two characters matches nothing (Q4; the prototype's
// "a" returned 82 rows), two letters match only the start of a word (4 Nov 2026), an
// emptied field doesn't reuse an old location fix (Q4), and the referral note shows only
// when no confirmed X-ray site exists at all (Q13, README:293).
import { offers, type Place, type Service } from './facility.ts';
import { km, matchPlace, type GazEntry, type Point } from './geo.ts';
import { contains, norm } from './text.ts';

/** Where the route starts: the visitor's location, a matched city or province, or unmatched text. */
export type Origin =
  | (Point & { gps: true })
  | (Point & { gps?: false; prov: string; label: string })
  | { text: string; label: string };

export function isPoint(origin: Origin): origin is Extract<Origin, Point> {
  return 'lat' in origin;
}

export interface OriginInput {
  /** The field's text. */
  text: string;
  /** A location fix held in memory, never stored. */
  gps: Point | null;
  /** "My location" in every language, which the field shows after a fix. */
  myLocation: readonly string[];
}

export function resolveOrigin({ text, gps, myLocation }: OriginInput, gaz: readonly GazEntry[]): Origin | null {
  const typed = text.trim();
  const isMine = myLocation.includes(typed);
  // The prototype also used the fix when the field was empty, so clearing it still
  // routed from the old location (fixed, Q4).
  if (gps && isMine) return { lat: gps.lat, lng: gps.lng, gps: true };
  if (!typed || isMine) return null;
  const g = matchPlace(typed, gaz);
  return g ? { lat: g.lat, lng: g.lng, prov: g.prov, label: g.label } : { text: typed, label: typed };
}

export interface Candidate {
  p: Place;
  /** km from the origin, when both have coordinates. */
  d: number | null;
}

export interface Stop {
  k: Service;
  /** `far`: nothing within 10 km, nearest in the province. `noXray`: no confirmed X-ray site, nearest centers instead. */
  mode: 'ok' | 'far' | 'noXray';
  items: Candidate[];
  /** Places offering this service in the pool. */
  total: number;
}

export interface Route {
  stops: Stop[];
  nearest: number | null;
  /** Nothing matched the origin at all. */
  empty: boolean;
  prov: string;
}

const NEAR_KM = 10;
const PER_STOP = 3;

export function route(places: readonly Place[], origin: Origin, services: readonly Service[]): Route {
  const point = isPoint(origin) ? origin : null;
  const t = 'text' in origin ? norm(origin.text) : '';
  let prov = point && 'prov' in origin ? origin.prov : '';
  const rank = ({ p }: Candidate) => {
    const c = p.ckey;
    const pv = p.pkey;
    if (c && (c === t || t.includes(c) || contains(c, t))) return 0;
    if (pv && (contains(pv, t) || t.includes(pv))) return 1;
    return 2;
  };
  const all: Candidate[] = places.map((p) => ({ p, d: point && p.lat !== null && p.lng !== null ? km(point, p as Point) : null }));
  const pool = point
    ? all.filter((x) => x.d !== null).sort((a, b) => a.d! - b.d!)
    : t.length >= 2 // Q4: one letter used to match almost every city
      ? all.filter((x) => rank(x) < 2).sort((a, b) => rank(a) - rank(b) || a.p.name.localeCompare(b.p.name))
      : [];
  if (point && !prov && pool[0]) prov = pool[0].p.prov;

  const stops = services.map((k): Stop => {
    const offering = pool.filter((x) => offers(x.p, k));
    const near = point ? offering.filter((x) => x.d! <= NEAR_KM) : offering;
    // Q13: the referral note only when there's no confirmed X-ray site at all. The
    // prototype also showed it when none was within 10 km.
    if (k === 'xray' && !offering.length) return { k, mode: 'noXray', items: pool.slice(0, PER_STOP), total: 0 };
    if (point && !near.length) {
      const inProvince = offering.filter((x) => x.p.prov === prov);
      return { k, mode: 'far', items: (inProvince.length ? inProvince : offering).slice(0, PER_STOP), total: offering.length };
    }
    return { k, mode: 'ok', items: offering.slice(0, PER_STOP), total: offering.length };
  });

  const distances = stops.flatMap((s) => s.items.map((x) => x.d)).filter((d): d is number => d !== null);
  return { stops, nearest: distances.length ? Math.min(...distances) : null, empty: pool.length === 0, prov };
}
