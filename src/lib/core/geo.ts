// Distance, the places gazetteer and place matching, ported from tbph-core.js
// (km, gazetteer, matchPlace, dist). No geocoding: typed places match only cities and
// provinces that appear in the facility list.
import type { Place } from './facility.ts';
import { norm } from './text.ts';

export interface Point {
  lat: number;
  lng: number;
}

/** Great-circle distance in km (haversine). */
export function km(a: Point, b: Point): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface GazEntry extends Point {
  name: string;
  prov: string;
  kind: 'city' | 'prov';
  /** Shown in the field and written to the URL as `near`: "Bangued, Abra" or "Quezon City". */
  label: string;
  key: string;
  /** key without "city of" / "city", so "Baguio" finds "Baguio City". */
  key2: string;
  full: string;
}

/**
 * One entry per city at its first facility's coordinates, plus one per province at the
 * average of its cities (unless a city has the same name). Sorted by label.
 */
export function buildGazetteer(places: readonly Place[]): GazEntry[] {
  const cities = new Map<string, GazBase>();
  for (const p of places) {
    if (p.lat === null || p.lng === null || !p.city) continue;
    const id = `${p.city}|${p.prov}`;
    if (!cities.has(id)) cities.set(id, { name: p.city, prov: p.prov, lat: p.lat, lng: p.lng, kind: 'city' });
  }
  const out = [...cities.values()];
  const provinces = new Map<string, { lat: number; lng: number; n: number }>();
  for (const c of out) {
    const sum = provinces.get(c.prov) ?? { lat: 0, lng: 0, n: 0 };
    sum.lat += c.lat;
    sum.lng += c.lng;
    sum.n += 1;
    provinces.set(c.prov, sum);
  }
  for (const [name, sum] of provinces) {
    if (name && !out.some((c) => c.name === name)) out.push({ name, prov: name, lat: sum.lat / sum.n, lng: sum.lng / sum.n, kind: 'prov' });
  }
  return out.map(withKeys).sort((a, b) => a.label.localeCompare(b.label));
}

export type GazBase = Pick<GazEntry, 'name' | 'prov' | 'kind' | 'lat' | 'lng'>;

/** Adds the label and match keys. Also rebuilds entries from public/data/gazetteer.json. */
export function withKeys(g: GazBase): GazEntry {
  const key = norm(g.name);
  const label = g.kind === 'city' && g.prov && g.prov !== g.name && !g.name.includes(g.prov) ? `${g.name}, ${g.prov}` : g.name;
  return { ...g, label, key, key2: key.replace(/^city of /, '').replace(/ city$/, ''), full: norm(label) };
}

/** The best gazetteer entry for typed text: exact, then prefix, then contains. Cities win ties. */
export function matchPlace(text: string, gaz: readonly GazEntry[]): GazEntry | null {
  const t = norm(text);
  if (t.length < 2) return null;
  let best: GazEntry | null = null;
  let bestScore = 0;
  for (const g of gaz) {
    let score = 0;
    if (g.full === t || g.key === t || g.key2 === t) score = 100;
    else if (g.full.startsWith(t) || g.key2.startsWith(t)) score = 80;
    else if (` ${t} `.includes(` ${g.full} `)) score = 75;
    else if (g.key2.length >= 4 && ` ${t} `.includes(` ${g.key2} `)) score = 70;
    else if (t.length >= 3 && g.key.includes(t)) score = 60;
    if (score && g.kind === 'city') score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return best;
}

/**
 * A distance for display. Exact ("2.4 km", rounded from 10 km) only when the place is
 * precisely located and the origin is the visitor's own location; otherwise approximate
 * ("about 3 km", at least 1). The caller adds "about" / "mga" from the dictionary.
 */
export function distanceLabel(d: number | null, precise: boolean): { km: string; approx: boolean } | null {
  if (d === null) return null;
  if (precise) return { km: `${d < 10 ? d.toFixed(1) : String(Math.round(d))} km`, approx: false };
  return { km: `${Math.max(1, Math.round(d))} km`, approx: true };
}
