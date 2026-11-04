// Outbound links and Home's URL state, ported from tbph-core.js (dirUrl) and Home.dc.html
// (run, componentDidMount), with the owner's privacy rules for URLs (Q4).
import type { Place, Service } from './facility.ts';
import { matchPlace, type GazEntry } from './geo.ts';
import { isPoint, type Origin } from './route.ts';

export type TravelMode = 'transit' | 'walking' | 'driving';

/**
 * Google Maps directions. The destination is the coordinates only when the place is
 * precisely located; otherwise its name and address, so nobody is routed to a city centre.
 */
export function directionsUrl(place: Place, mode: TravelMode): string {
  const destination = place.precise
    ? `${place.lat},${place.lng}`
    : [place.raw, place.rawStreet, place.city, place.prov, 'Philippines'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
}

export type Need = 'all' | Service;

export const NEEDS: readonly Need[] = ['all', 'xray', 'test', 'meds'];

export function isNeed(value: unknown): value is Need {
  return NEEDS.includes(value as Need);
}

/**
 * What Home writes to its URL after a route (Q4): `near` only for a matched city or
 * province, as its gazetteer label, never typed text such as an address; `loc=gps` as a
 * flag only, never coordinates.
 */
export function homeQuery(need: Need, origin: Origin): Record<string, string | undefined> {
  const matched = isPoint(origin) && !('gps' in origin && origin.gps);
  return {
    need,
    near: matched && 'label' in origin ? origin.label : undefined,
    loc: isPoint(origin) && 'gps' in origin && origin.gps ? 'gps' : undefined,
  };
}

export interface HomeParams {
  need: Need;
  /** A known city or province to plan from, or null. */
  near: GazEntry | null;
  /** `?loc=gps`: show "Use my location"; the browser is asked only on a tap (Q4). */
  locGps: boolean;
}

/** Reads Home's incoming query. Unknown `need` values and unmatched `near` text are ignored. */
export function readHomeParams(search: string, gaz: readonly GazEntry[]): HomeParams {
  const params = new URLSearchParams(search);
  const need = params.get('need');
  const near = (params.get('near') ?? '').slice(0, 100);
  return {
    need: isNeed(need) ? need : 'all',
    near: near ? matchPlace(near, gaz) : null,
    locGps: params.get('loc') === 'gps',
  };
}
