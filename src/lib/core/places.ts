// The Places list's filters and sorting, ported from Places.dc.html (filtered). Filters are
// held in memory only, never written to the URL (D20).
import { offers, type Place, type Service } from './facility.ts';
import { km, type Point } from './geo.ts';
import { norm } from './text.ts';

export type Sector = '' | 'gov' | 'priv';

export interface PlaceFilters {
  /** Words that must all appear in the name, city or province. */
  q: string;
  svc: '' | Service;
  region: string;
  prov: string;
  sector: Sector;
}

export const NO_FILTERS: PlaceFilters = { q: '', svc: '', region: '', prov: '', sector: '' };

export interface Listed {
  p: Place;
  d: number | null;
}

/**
 * The places to list. With the X-ray filter and no confirmed X-ray site among the other
 * matches, it lists those matches instead and says so (`noXray`). Sorted by distance when
 * there's an origin and the switch is on; places without coordinates go last.
 */
export function filterPlaces(list: readonly Place[], f: PlaceFilters, origin: Point | null, byDistance: boolean): { rows: Listed[]; noXray: boolean } {
  const tokens = norm(f.q).split(' ').filter(Boolean);
  const base = list.filter(
    (p) =>
      (!f.region || p.code === f.region) &&
      (!f.prov || p.prov === f.prov) &&
      (!f.sector || (f.sector === 'gov') === p.gov) &&
      tokens.every((t) => p.key.includes(t)),
  );
  const svc = f.svc;
  let shown = svc ? base.filter((p) => offers(p, svc)) : base;
  let noXray = false;
  if (svc === 'xray' && !shown.length && base.length) {
    noXray = true;
    shown = base;
  }
  const rows = shown.map((p) => ({ p, d: origin && p.lat !== null && p.lng !== null ? km(origin, { lat: p.lat, lng: p.lng }) : null }));
  if (origin && byDistance) rows.sort((a, b) => Number(a.d === null) - Number(b.d === null) || (a.d ?? 0) - (b.d ?? 0));
  return { rows, noXray };
}

/** Regions in the list, by name. */
export function regionOptions(list: readonly Place[]): { code: string; name: string }[] {
  const byCode = new Map<string, string>();
  for (const p of list) if (!byCode.has(p.code)) byCode.set(p.code, p.region || p.code);
  return [...byCode].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
}

/** Provinces and cities, within a region when one is chosen. */
export function provinceOptions(list: readonly Place[], region: string): string[] {
  return [...new Set(list.filter((p) => !region || p.code === region).map((p) => p.prov).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

/** Filters counted on the "Filters (n)" button: search, region, province and type (not the service). */
export function activeFilters(f: PlaceFilters): number {
  return [f.q.trim(), f.region, f.prov, f.sector].filter(Boolean).length;
}
