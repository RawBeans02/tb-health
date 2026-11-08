// Distance, the places gazetteer and place matching, ported from tbph-core.js
// (km, gazetteer, matchPlace, dist). No geocoding: typed places match only cities and
// provinces that appear in the facility list.
import type { Place } from './facility.ts';
import { norm, placeText } from './text.ts';

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
  /** key without "city of" / "city" / "province of" / "province", so "Baguio" finds "Baguio City" and "Rizal" "Province of Rizal". */
  key2: string;
  full: string;
}

export type GazBase = Pick<GazEntry, 'name' | 'prov' | 'kind' | 'lat' | 'lng'> & { aka?: string[] };

/**
 * One entry per city at the mean of its clinics' pins (owner decision, 4 Nov 2026; the
 * prototype used the first clinic's pin, so the nearest read "about 1 km"), plus one per
 * province at the mean of its cities, unless a town in it has the province's name and so
 * its label: that town stands for both ("Leyte" in Leyte, "Bulacan" in Bulacan). A town
 * named like a province elsewhere ("Isabela, Basilan") has its own label and doesn't hide
 * that province. Abbreviations attach to the entry their target finds by name, with or
 * without "City". Sorted by label. Built by prepare-data.
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
  const labels = new Set(out.map((c) => withKeys(c).label));
  const provinces = new Map<string, { lat: number; lng: number; n: number }>();
  for (const c of out) {
    const sum = provinces.get(c.prov) ?? { lat: 0, lng: 0, n: 0 };
    sum.lat += c.lat;
    sum.lng += c.lng;
    sum.n += 1;
    provinces.set(c.prov, sum);
  }
  for (const [name, sum] of provinces) {
    if (name && !labels.has(name)) out.push({ name, prov: name, lat: sum.lat / sum.n, lng: sum.lng / sum.n, kind: 'prov' });
  }
  const entries = fromCompact(out);
  for (const [abbreviation, target] of Object.entries(abbreviations)) {
    // The entry matchPlace finds by the target's name (scores 100 and up), never by a prefix
    // or a place inside it, with or without a trailing "City".
    const found = [target, norm(target).replace(/ city$/, '')].map((name) => rankPlaces(name, entries)).find((r) => r && r.score >= 100);
    const aka = placeKey(abbreviation);
    if (found && !found.g.aka.includes(aka)) found.g.aka.push(aka);
  }
  return entries;
}

/** Gazetteer entries from their compact form (facilities.json, gazetteer.json), sorted by label. */
export function fromCompact(entries: readonly GazBase[]): GazEntry[] {
  const out = entries.map(withKeys);
  // A province whose name a city also answers to ("Batangas" finds Batangas City: cities win
  // ties) is labelled "Batangas Province", so its label, written to the URL as `near`, finds it.
  const cityNames = new Set(out.filter(isCity).map((g) => g.key2));
  return out
    .map((g) => (g.kind === 'prov' && cityNames.has(g.key) ? { ...g, label: `${g.name} Province`, full: placeKey(`${g.name} Province`) } : g))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** norm(), reading "Sta." and "Sto." as "Santa" and "Santo": the list writes both ("Sta. Rosa", "Santa Cruz"). */
export function placeKey(text: unknown): string {
  return norm(text).replace(/\bsta\b/g, 'santa').replace(/\bsto\b/g, 'santo');
}

/** Adds the label and match keys. */
export function withKeys(g: GazBase): GazEntry {
  const key = placeKey(g.name);
  const label = g.kind === 'city' && g.prov && g.prov !== g.name && !g.name.includes(g.prov) ? `${g.name}, ${g.prov}` : g.name;
  const key2 = key.replace(/^(city|province) of /, '').replace(/ (city|province)$/, '');
  return { ...g, aka: [...(g.aka ?? [])], label, key, key2, full: placeKey(label) };
}

/** A city by its name ("Quezon City", "City of Naga"); a town's name doesn't say. */
const isCity = (g: GazEntry) => g.kind === 'city' && g.key !== g.key2;

/**
 * The best gazetteer entry for typed text, or null for the text route (route.ts). In order:
 *  - an abbreviation, or a label typed in full ("Rizal, Cagayan", "Batangas Province");
 *  - a name. Cities win ties (README:291): a city, also without "City" ("Cebu" finds Cebu City,
 *    "Quezon" Quezon City); a town; a province ("Isabela"), also without "Province" ("Rizal"
 *    finds Province of Rizal); last, a town named like a province elsewhere ("Isabela" in
 *    Basilan, about 1,100 km from Isabela province, which used to win here);
 *  - a prefix of a name or label;
 *  - a name with the kind it asks for: "Isabela City", "Province of Rizal", "Lungsod ng Quezon";
 *  - a place named in longer text, as a barangay, street or landmark comes with it ("Brgy.
 *    Poblacion, Aurora, Zamboanga del Sur", "Bagumbayan, Taguig City", "Baguio General
 *    Hospital"): a town's label with its province, a town named with its province elsewhere in
 *    the text ("Claveria … Misamis Oriental"), a province or city group named in full ("Taguig
 *    City", "Nueva Vizcaya"; not one named like a town, such as Isabela), a province named as an
 *    address's last part even when a city answers to it ("Brgy. San Jose, Batangas" is Batangas
 *    Province; "Quezon Avenue" is still Quezon City), "<name> City" for a
 *    town the list writes without it ("Brgy. Sunrise, Isabela City"); then a name. A name inside
 *    a longer place's name in the text doesn't count ("Bataan" in "New Bataan", "Leyte" in
 *    "Southern Leyte"), a street's or a barangay's ranks lower ("Mabini St.", "Brgy. Santo
 *    Niño"), and "Sta."/"Sto." alone isn't the town of Santa or Santo ("Brgy. Sta. Isabel");
 *  - a name containing the text.
 * Below the names, ties go to a town or city, then a province, then a town named like a
 * province elsewhere; then to the label order. "Sta." and "Sto." read as "Santa" and "Santo"
 * (when the whole text is a name, of two that tie the one spelled as typed wins), and a region
 * or the country at the end ("Metro Manila", "Philippines") doesn't count.
 */
export function matchPlace(text: string, gaz: readonly GazEntry[]): GazEntry | null {
  return rankPlaces(text, gaz)?.g ?? null;
}

const KINDS: [RegExp, GazEntry['kind']][] = [
  [/^(?:city of|lungsod ng|lungsod) (.+)$/, 'city'],
  [/^(.+) city$/, 'city'],
  [/^(?:province of|lalawigan ng|probinsya ng|probinsiya ng) (.+)$/, 'prov'],
  [/^(.+) province$/, 'prov'],
];

/** "Isabela City", "Lungsod ng Quezon", "Rizal Province", "Province of Rizal": the name and the kind it asks for. */
function qualified(t: string): { name: string; kind: GazEntry['kind'] } | null {
  for (const [pattern, kind] of KINDS) {
    const m = pattern.exec(t);
    if (m) return { name: m[1], kind };
  }
  return null;
}

const isName = (g: GazEntry, t: string) => g.full === t || g.key === t || g.key2 === t || g.aka.includes(t);

/** A comma-separated part that is only a region or the country ("…, Batangas, Philippines"). */
const AREA_PART = /^(?:metro manila|ncr|philippines|pilipinas|ph)$/;

/** Words after a name that make it a street's: "Mabini St.", "Rizal Avenue". */
const STREET = new Set(['st', 'street', 'ave', 'avenue', 'blvd', 'boulevard', 'rd', 'road', 'hwy', 'highway', 'dr', 'drive', 'ln', 'lane', 'ext', 'extension']);

/** Words before a name that make it a barangay's or a sitio's: "Brgy. Santo Niño", "Sitio Mabini". */
const BARANGAY = new Set(['brgy', 'bgy', 'barangay', 'sitio', 'purok']);

type Span = [number, number];

/** For text `t`: every place a name appears in it as whole words, as its first word and the word after its last. */
function spansIn(t: string): (name: string) => Span[] {
  const padded = ` ${t} `;
  // The word that starts at each character of `padded` (after its space).
  const first = new Map<number, number>();
  let at = 0;
  t.split(' ').forEach((word, i) => {
    first.set(at, i);
    at += word.length + 1;
  });
  return (name) => {
    const out: Span[] = [];
    if (!name) return out;
    const n = name.split(' ').length;
    for (let i = padded.indexOf(` ${name} `); i >= 0; i = padded.indexOf(` ${name} `, i + 1)) out.push([first.get(i)!, first.get(i)! + n]);
    return out;
  };
}

/** What rankPlaces looks up in a gazetteer, built once per gazetteer (Places matches on every render). */
interface GazIndex {
  /** The provinces each name (with and without "Province") belongs to. */
  provinces: Map<string, string[]>;
  /** Towns' and cities' names without "City". */
  towns: Set<string>;
  /** Every entry's name. */
  keys: Set<string>;
}

const indexes = new WeakMap<readonly GazEntry[], GazIndex>();

function indexOf(gaz: readonly GazEntry[]): GazIndex {
  let index = indexes.get(gaz);
  if (!index) {
    const provinces = new Map<string, string[]>();
    for (const p of gaz) if (p.kind === 'prov') for (const k of new Set([p.key, p.key2])) provinces.set(k, [...(provinces.get(k) ?? []), p.name]);
    index = { provinces, towns: new Set(gaz.filter((x) => x.kind === 'city').map((x) => x.key2)), keys: new Set(gaz.map((x) => x.key)) };
    indexes.set(gaz, index);
  }
  return index;
}

/** An address or landmark is short; longer text is cut, so matching stays fast. */
const MAX_TEXT = 200;

function rankPlaces(input: string, gaz: readonly GazEntry[]): { g: GazEntry; score: number } | null {
  const text = input.slice(0, MAX_TEXT);
  const typed = placeText(text);
  const t = placeKey(typed);
  if (t.length < 2) return null;
  const spans = spansIn(t);
  const q = qualified(t);
  const { provinces, towns, keys } = indexOf(gaz);
  const words = t.split(' ');
  const typedWords = typed.split(' ');
  // The last part of an address, after a comma ("Brgy. San Jose, Batangas"), names a province.
  const parts = text.split(',').map((part) => placeKey(part)).filter((part) => part && !AREA_PART.test(part));
  const last = parts.length > 1 && t.endsWith(` ${parts[parts.length - 1]}`) ? parts[parts.length - 1] : '';
  // Where the commas fall, as word counts: "City" belongs to a name only in its own part ("San Miguel, City of Manila").
  const commas: number[] = [];
  for (const part of text.split(',').map((p) => placeKey(p)).filter(Boolean)) commas.push((commas[commas.length - 1] ?? 0) + part.split(' ').length);
  const oneSide = ([a, b]: Span) => !commas.some((k) => a < k && k < b);
  // A town named like a province elsewhere: "Isabela, Basilan"; "San Juan, Abra" beside San Juan City.
  const shadowed = (g: GazEntry) => g.kind === 'city' && (provinces.get(g.key) ?? []).some((name) => name !== g.prov);
  const tie = (g: GazEntry) => (g.kind === 'prov' ? 0 : shadowed(g) ? -1 : 1);

  /** A place named in longer text: its score, the first place that fits and every place its name appears. */
  const inText = (g: GazEntry): { score: number; at: Span; all: Span[]; city?: true } | null => {
    // Each way below names the place with its name without "City" in it.
    if (!t.includes(g.key2)) return null;
    const hit = (name: string, score: number, fits: (at: Span) => boolean = () => true) => {
      const all = spans(name);
      const at = all.find(fits);
      return at ? { score, at, all } : null;
    };
    // A town's label, or a province named in full ("Taguig City", "Nueva Vizcaya") as d5a9d05 had it,
    // but a province named like a town (Isabela, Aurora, Quirino) only by its name, below. A city
    // also by its name ("Tuguegarao City").
    if (g.kind === 'city' || g.full !== g.key2 || !towns.has(g.key2)) {
      const score = 75 + (g.kind === 'prov' ? 0 : g.full !== g.key ? 1 : tie(g));
      const found = hit(g.full, score) ?? (isCity(g) ? hit(g.key, score, oneSide) : null);
      if (found) return found;
    }
    // A province named as an address's last part, also one a city answers to ("…, Batangas") or a
    // town elsewhere is named like ("…, Aurora").
    if (g.kind === 'prov' && g.key === last) {
      const at: Span = [words.length - last.split(' ').length, words.length];
      return { score: 75, at, all: [at] };
    }
    // "Isabela City": a town the list writes without "City", as its label, unless a place is named so.
    // It sits on the name, so a longer name around it wins ("Maria Aurora City Hall" isn't Aurora).
    if (g.kind === 'city' && g.key === g.key2 && !keys.has(`${g.key} city`) && !keys.has(`city of ${g.key}`)) {
      const n = g.key.split(' ').length;
      const before = spans(`${g.key} city`).filter(oneSide);
      const after = spans(`city of ${g.key}`).filter(oneSide);
      const at: Span | undefined = before.length ? [before[0][0], before[0][0] + n] : after.length ? [after[0][1] - n, after[0][1]] : undefined;
      if (at) return { score: 76, at, all: [...before, ...after], city: true };
    }
    // A name; "Santa"/"Santo" alone only where typed so ("Sta. Isabel" isn't the town of Santa).
    if (g.key2.length >= 4) return hit(g.key2, 70 + tie(g), ([first]) => !/^sant[ao]$/.test(g.key2) || typedWords[first] === g.key2);
    return null;
  };

  const found: { g: GazEntry; score: number; at: Span | null; all: Span[]; city?: true }[] = [];
  for (const g of gaz) {
    let score = 0;
    let at: Span | null = null;
    let all: Span[] = [];
    let city: true | undefined;
    if (g.aka.includes(t) || (g.full === t && g.full !== g.key)) score = 105;
    else if (g.key === t || g.key2 === t) score = g.kind === 'prov' ? (g.key === t ? 102 : 101) : isCity(g) ? 104 : shadowed(g) ? 100 : 103;
    // Typing on past a town's name into its province's picks that town.
    else if (g.full.startsWith(t) || g.key2.startsWith(t)) score = 80 + (g.kind === 'city' && t.length > g.key.length ? 1 : tie(g));
    else if (q && isName(g, q.name)) score = g.kind === q.kind ? 78 + (isCity(g) ? 1 : 0) : 77;
    else {
      const named = inText(g);
      if (named) ({ score, at, all, city } = named);
      else if (t.length >= 3 && g.key.includes(t)) score = 60 + tie(g);
    }
    if (!score) continue;
    // Of two towns that tie by name, the one spelled as typed: "Sta. Ana" is Sta. Ana, Cagayan, not Santa Ana, Pampanga.
    if (score >= 100 && score < 105 && g.kind === 'city' && norm(g.name) === typed) score += 0.5;
    if (at) {
      const where: Span = at;
      // A town whose province is named elsewhere in the text counts as its label ("Claveria … Misamis
      // Oriental"), and above a namesake also found by its full name ("…, San Carlos City").
      if (g.kind === 'city' && g.prov && g.prov !== g.name && (score < 72 || score === 76)) {
        const prov = placeKey(g.prov);
        // Not a group named after the town itself: "San Juan City" says nothing more about San Juan.
        const names = [prov, prov.replace(/^(city|province) of /, '').replace(/ (city|province)$/, '')].filter((name) => name !== g.key && name !== g.key2);
        if (names.some((name) => spans(name).some(([a, b]) => b <= where[0] || a >= where[1]))) score = score < 75 ? 76 : 77;
      }
      // A name found only by reading "Sta." as "Santa" (or the reverse) ranks a hair below one spelled as typed.
      const label = ` ${norm(g.label)} `;
      if (/\bsant[ao]\b/.test(words.slice(where[0], where[1]).join(' ')) && !all.some(([a, b]) => label.includes(` ${typedWords.slice(a, b).join(' ')} `))) score -= 0.5;
      // A street's or a barangay's name ranks below the places named in the text: "123 Mabini St., Malate,
      // Manila" is Malate; "Brgy. Santo Niño, Tuguegarao City" is Tuguegarao. Alone, "Quezon Avenue"
      // still finds Quezon City.
      if (STREET.has(words[where[1]])) score -= 5;
      if (where[0] > 0 && BARANGAY.has(words[where[0] - 1])) score -= 5;
    }
    found.push({ g, score, at, all, city });
  }
  // A name inside a longer place's name, both in the text, doesn't count: "Bataan" in "Brgy.
  // Poblacion, New Bataan", "Leyte" in "Southern Leyte", "Santa" in "…, Santa Barbara".
  // Two namesakes found as "<name> City" ("Cauayan City": Isabela's and Negros Occidental's) tie.
  const inner = (f: (typeof found)[number]) =>
    f.at !== null &&
    found.some((o) => o !== f && !(o.city && f.city && o.g.key === f.g.key) && o.all.some(([a, b]) => a <= f.at![0] && b >= f.at![1] && b - a > f.at![1] - f.at![0]));
  let best: { g: GazEntry; score: number } | null = null;
  for (const f of found) if (f.score > (best?.score ?? 0) && !inner(f)) best = { g: f.g, score: f.score };
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
