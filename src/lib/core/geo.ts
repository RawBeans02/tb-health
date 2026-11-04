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
  /** Normalised abbreviations that also find it ("qc"), from data/place-abbreviations.json. */
  aka: string[];
  /** Shown in the field and written to the URL as `near`: "Bangued, Abra" or "Quezon City". */
  label: string;
  key: string;
  /** key without "city of" / "city", so "Baguio" finds "Baguio City". */
  key2: string;
  full: string;
}

export type GazBase = Pick<GazEntry, 'name' | 'prov' | 'kind' | 'lat' | 'lng'> & { aka?: string[] };

/**
 * One entry per city at the mean of its clinics' pins (owner decision, 4 Nov 2026; the
 * prototype used the first clinic's pin, so the nearest read "about 1 km"), plus one per
 * province at the mean of its cities, unless a city has the same name. Abbreviations
 * attach to the entry whose name they spell out. Sorted by label. Built by prepare-data.
 */
export function buildGazetteer(places: readonly Place[], abbreviations: Record<string, string> = {}): GazEntry[] {
  const cities = new Map<string, { name: string; prov: string; lat: number; lng: number; n: number }>();
  for (const p of places) {
    if (p.lat === null || p.lng === null || !p.city) continue;
    const id = `${p.city}|${p.prov}`;
    const sum = cities.get(id) ?? { name: p.city, prov: p.prov, lat: 0, lng: 0, n: 0 };
    sum.lat += p.lat;
    sum.lng += p.lng;
    sum.n += 1;
    cities.set(id, sum);
  }
  const out: GazBase[] = [...cities.values()].map((c) => ({ name: c.name, prov: c.prov, lat: c.lat / c.n, lng: c.lng / c.n, kind: 'city' }));
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
  const entries = fromCompact(out);
  for (const [abbreviation, target] of Object.entries(abbreviations)) {
    const t = norm(target).replace(/ city$/, '');
    const g = entries.find((e) => e.key2 === t) ?? entries.find((e) => e.key === norm(target));
    if (g && !g.aka.includes(norm(abbreviation))) g.aka.push(norm(abbreviation));
  }
  return entries;
}

/** Gazetteer entries from their compact form (facilities.json, gazetteer.json), sorted by label. */
export function fromCompact(entries: readonly GazBase[]): GazEntry[] {
  return entries.map(withKeys).sort((a, b) => a.label.localeCompare(b.label));
}

/** Adds the label and match keys. */
export function withKeys(g: GazBase): GazEntry {
  const key = norm(g.name);
  const label = g.kind === 'city' && g.prov && g.prov !== g.name && !g.name.includes(g.prov) ? `${g.name}, ${g.prov}` : g.name;
  return { ...g, aka: [...(g.aka ?? [])], label, key, key2: key.replace(/^city of /, '').replace(/ city$/, ''), full: norm(label) };
}

/** The best gazetteer entry for typed text: exact (or an abbreviation), then prefix, then contains. Cities win ties. */
export function matchPlace(text: string, gaz: readonly GazEntry[]): GazEntry | null {
  const t = norm(text);
  if (t.length < 2) return null;
  let best: GazEntry | null = null;
  let bestScore = 0;
  for (const g of gaz) {
    let score = 0;
    if (g.full === t || g.key === t || g.key2 === t || g.aka.includes(t)) score = 100;
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
  // Whole kilometres with a thousands separator, as the rest of the site writes numbers (B40).
  const whole = (n: number) => n.toLocaleString('en-US');
  if (precise) return { km: `${d < 10 ? d.toFixed(1) : whole(Math.round(d))} km`, approx: false };
  return { km: `${whole(Math.max(1, Math.round(d)))} km`, approx: true };
}
