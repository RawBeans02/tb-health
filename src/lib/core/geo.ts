// Distance, the places gazetteer and place matching, ported from tbph-core.js
// (km, gazetteer, matchPlace, dist). No geocoding: typed places match only cities and
// provinces that appear in the facility list.
import type { Place } from './facility.ts';
import { isArea, norm, placeText } from './text.ts';

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
  // The lookups rankPlaces built above came before the abbreviations: the next match builds them again.
  indexes.delete(entries);
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

/** "Metro Manila" in typed text, however it's spaced or punctuated. */
const METRO_MANILA = /metro\W*manila/i;

/**
 * The best gazetteer entry for typed text, or null for the text route (route.ts).
 *
 * The text is read as an address first: it is cut at 200 characters; a listed abbreviation then reads
 * as its place's name, also inside longer text and with dots ("Cubao, QC", "Q.C."), but without "City"
 * inside a longer part that goes on after it ("CDO Foodsphere, Valenzuela" is Valenzuela); "Sta." and
 * "Sto." read as "Santa" and "Santo"; and a region, the country or a ZIP code at the end of the text or
 * of a comma part doesn't count ("…, Metro Manila", "…, Calabarzon Region", "…, Region 4A", "…, Batangas
 * Philippines", "…, Quezon 4301", "…, 4100 Cavite"), nor "Caraga" as the last of three or more parts
 * right after a town ("…, Bunawan, Caraga" is Bunawan). Then, in order:
 *  - a label typed in full ("Rizal, Cagayan", "Batangas Province"); an abbreviation typed alone reads as
 *    its place's name ("QC" is "Quezon City");
 *  - a name. Cities win ties (README:291): a city, also without "City" ("Cebu" finds Cebu City,
 *    "Quezon" Quezon City); a town; a province ("Isabela"), also without "Province" ("Rizal"
 *    finds Province of Rizal); last, a town named like a province elsewhere ("Isabela" in
 *    Basilan, about 1,100 km from Isabela province). Of two towns that tie, the one spelled as
 *    typed ("Sta. Ana" is Sta. Ana, Cagayan, not Santa Ana, Pampanga);
 *  - a prefix of a name or label;
 *  - a name with the kind it asks for: "Isabela City", "Province of Rizal", "Mountain Prov.", "Lungsod
 *    ng Quezon"; of two towns, the one spelled as typed ("Sto. Tomas City" is Sto. Tomas, Batangas);
 *  - a place named in longer text, as a barangay, street or landmark comes with it, from the top:
 *     - a town or city whose province comes right after its name, also after "City" ("Rizal
 *       Park, Tuguegarao, Cagayan", "San Fernando City, Pampanga"); and, before ", Manila" as the
 *       metro area, a town or city within 25 km of the City of Manila named as a whole part
 *       ("Makati, Manila", "Brgy. San Isidro, Marikina, Manila"); a whole part further back, or
 *       one with "Metro Manila" or "NCR" typed ("Pasig, Santa Lucia, Metro Manila" is Pasig), ranks
 *       as a town with its province elsewhere in the text;
 *     - a town by its label with its province, a hair higher at the end of the text ("Lipa City
 *       District Hospital, Nasugbu, Batangas" is Nasugbu), also by its first name when the list
 *       adds a second in brackets ("San Fernando, Banton, Romblon" is Banton (Jones)); a city by its
 *       label ("Puerto Princesa City", "Tuguegarao City, Cagayan"), within one comma part and not
 *       before "of" when the label is its "<name> City" ("Quezon, City of Calamba" is Calamba); a
 *       Manila district typed with "Manila" at the end ("Dagupan Health Center, Tondo, Manila");
 *     - a town or city found by "<name> City" (next) with its province elsewhere in the text, just
 *       below a town typed with its province ("Bago City District Hospital, Calatrava, Negros
 *       Occidental" is Calatrava);
 *     - "<name> City" or "City of <name>": a city by its name ("Tuguegarao City Hospital"), or a
 *       town the list writes without "City" ("Brgy. Sunrise, Isabela City"), within one comma
 *       part and not "<name> City of …" ("San Miguel City of Manila" is Manila). When another
 *       entry is named "<name> City", the town only with its province after it ("San Fernando
 *       City, Pampanga" is Pampanga's, not La Union's). Also a town by its label without a
 *       province ("Maria Aurora City Hall");
 *     - a town or city by its name with its province elsewhere in the text ("Claveria … Misamis
 *       Oriental"; "Antipas, Cotabato": North Cotabato's towns also answer to "Cotabato", but not
 *       inside "South Cotabato" or "Cotabato City"), just below a town typed with its province;
 *     - a province or city group named in full ("Nueva Vizcaya", "Taguig City"; one named like a
 *       town, such as Isabela, only by its name) or as the address's last part, also without
 *       "City", "Province of" or "City of" and with a qualifier ("Brgy. San Jose, Batangas", "…,
 *       Rizal", "…, Manila", "…, Manila City", "…, Taguig", "…, Province of Batangas", "…, Mountain
 *       Prov.", "…, Lalawigan ng Quezon"; "Quezon Avenue" is still Quezon City). A province the list
 *       names "… Province" (Cebu, Iloilo, Mountain) is found by its bare name inside longer text
 *       only before "Provincial" or "Prov." ("Mountain Provincial Hospital"; "Mountain View" isn't
 *       Mountain Province), and as the last part only when no city answers to it ("…, Cebu" is Cebu
 *       City). With "Metro Manila" or "NCR" typed, a province a city also answers to isn't the last
 *       part ("Diliman, Quezon, Metro Manila" is Quezon City). A town that stands for its province
 *       ("…, Leyte") ranks as that province; a province that is the whole last part wins a tie with
 *       one named before it ("Biliran, Bohol" is Bohol);
 *     - a name; last, a Manila district by its own name ("Brgy. 105, Ermita": the list writes
 *       "Ermita, Manila").
 *    Among these: a street's or a barangay's name ranks lower, within its own comma part, and no
 *    higher than a town's bare name ("123 Mabini St., Malate, Manila" is Malate; "Brgy. Santo
 *    Niño, Tuguegarao City" is Tuguegarao; "Brgy. Cebu City, Aguinaldo" is Aguinaldo), but not where
 *    the same name is the whole last part ("Bulacan St., San Roque, Bulacan" is Bulacan); in
 *    "<barangay>, <town>" the town that is the whole last part, also as "City of <town>", wins a
 *    tie ("San Isidro, Tanauan" is Tanauan, not San Isidro, Bohol), and so does a town the list
 *    writes with a second name in brackets, by its first name, a hair below a town of that name
 *    ("Bagumbayan, Santa Praxedes" is Sta. Praxedes (Langangan); "…, Valencia" is Valencia,
 *    Bohol); "Sta."/"Sto." alone isn't the town of Santa or Santo ("Brgy. Sta. Isabel"); and a
 *    name found only by reading "Sta." as "Santa" (or the reverse) ranks a hair below one spelled
 *    as typed, less than the last part's edge ("San Isidro, Santa Lucia" is Sta. Lucia).
 *    A name doesn't count when every mention of it is inside a longer place's name in the text
 *    ("Bataan" in "Brgy. Poblacion, New Bataan", "Leyte" in "Southern Leyte"), when a namesake is
 *    found by its label with its province ("Maasin City Hall, Maasin, Southern Leyte"), or when a
 *    namesake's province is named and its own isn't ("SM City Pampanga, San Fernando City" is
 *    Pampanga), not as a street's or barangay's name nor as a whole part before the last ("Isabela,
 *    Roxas City" is Roxas City). A province's name counts as naming a town's province only outside
 *    another place named in full ("Rizal (Marcos), Palawan" says nothing about Aborlan, Palawan, nor
 *    "Cebu City" about San Francisco, Cebu) and, when the address's last part names another
 *    province, outside a street's or barangay's name ("Brgy. Quezon, Dolores, Eastern Samar" is
 *    Eastern Samar, not Dolores, Quezon);
 *  - a name containing the text.
 * Below the names, ties go to a town or city, then a province, then a town named like a province
 * elsewhere; then to the label order. When the text says "Metro Manila" and the best is below a
 * province's bare name (70: part of a name, or a name ranked down as a street's or barangay's) or
 * only the start of a name, the text is read again with "Manila" for "Metro Manila" ("Cubao, Metro
 * Manila" is the City of Manila, "Brgy. Malate, Metro Manila" Malate), unless the first reading's
 * place is within 30 km of that one ("Quezon Ave., Metro Manila" stays Quezon City).
 */
export function matchPlace(text: string, gaz: readonly GazEntry[]): GazEntry | null {
  const best = rankPlaces(text, gaz);
  if (METRO_MANILA.test(text) && (!best || best.score < 70 || (best.score >= 80 && best.score < 100))) {
    const manila = rankPlaces(text.replace(new RegExp(METRO_MANILA.source, 'gi'), 'Manila'), gaz);
    // Not when the first reading's place is near it already: "Quezon Ave., Metro Manila" stays Quezon City.
    if (manila && (manila.score >= 70 || manila.score > (best?.score ?? 0)) && !(best && km(best.g, manila.g) <= 30)) return manila.g;
  }
  return best?.g ?? null;
}

const KINDS: [RegExp, GazEntry['kind']][] = [
  [/^(?:city of|lungsod ng|lungsod) (.+)$/, 'city'],
  [/^(.+) city$/, 'city'],
  [/^(?:province of|prov of|lalawigan ng|probinsya ng|probinsiya ng) (.+)$/, 'prov'],
  [/^(.+) (?:province|prov)$/, 'prov'],
];

/** "Isabela City", "Lungsod ng Quezon", "Rizal Province", "Province of Rizal", "Mountain Prov.": the name and the kind it asks for. */
function qualified(t: string): { name: string; kind: GazEntry['kind'] } | null {
  for (const [pattern, kind] of KINDS) {
    const m = pattern.exec(t);
    if (m) return { name: m[1], kind };
  }
  return null;
}

/** A name of the entry, not its label: "San Antonio, Quezon City" isn't San Antonio, Quezon asked for as a city. */
const isName = (g: GazEntry, t: string) => g.key === t || g.key2 === t || g.aka.includes(t);

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
  /** Each abbreviation's place name: "qc" → "Quezon City". */
  abbreviations: Map<string, string>;
  /** The names of the towns and cities that stand for their province ("leyte", "quezon city"). */
  standing: Set<string>;
}

const indexes = new WeakMap<readonly GazEntry[], GazIndex>();

function indexOf(gaz: readonly GazEntry[]): GazIndex {
  let index = indexes.get(gaz);
  if (!index) {
    const provinces = new Map<string, string[]>();
    for (const p of gaz) if (p.kind === 'prov') for (const k of new Set([p.key, p.key2])) provinces.set(k, [...(provinces.get(k) ?? []), p.name]);
    index = {
      provinces,
      towns: new Set(gaz.filter((x) => x.kind === 'city').map((x) => x.key2)),
      keys: new Set(gaz.map((x) => x.key)),
      abbreviations: new Map(gaz.flatMap((g) => g.aka.map((a): [string, string] => [a, g.name]))),
      standing: new Set(gaz.filter((g) => g.kind === 'city' && g.name === g.prov).map((g) => g.key)),
    };
    indexes.set(gaz, index);
  }
  return index;
}

/**
 * An address or landmark is short; longer text is cut, so matching stays fast. A listed abbreviation
 * is read as its place's name after the cut, so the text read can be a few times longer (still well
 * under a millisecond).
 */
const MAX_TEXT = 200;

/** A place found in the text: its score, where it was found, and how. */
interface Found {
  g: GazEntry;
  score: number;
  /**
   * Where the street and barangay words are read around it: the place its name is the whole last
   * part ("Bulacan St., San Roque, Bulacan"), else the first place its name fits in the text.
   */
  at: Span | null;
  /** Every place its name (or "<name> City") appears in the text. */
  all: Span[];
  /** Every place it fits: it is inside a longer place's name only if all of these are. */
  fit: Span[];
  /** Found as "<name> City" or "City of <name>". */
  city?: true;
  /** A town found by its label with its province. */
  full?: true;
  /** Its province is named in the text, not as a street's or barangay's name (provNamed() fills it in). */
  provNamed?: boolean;
}

function rankPlaces(input: string, gaz: readonly GazEntry[]): { g: GazEntry; score: number } | null {
  const { provinces, towns, keys, abbreviations, standing } = indexOf(gaz);
  // An abbreviation reads as its place's name, also in longer text and with dots: "Cubao, QC" and "Q.C."
  // are Quezon City. Inside a longer part that goes on after it, its place's name without "City", which
  // ranks as a bare name: "CDO Foodsphere, Valenzuela" is Valenzuela, "QC Hall" still Quezon City.
  const cut = input.slice(0, MAX_TEXT);
  const text = abbreviations.size
    ? cut.replace(/[A-Za-z]+(?:\.[A-Za-z]+)*\.?/g, (w, off: number, s: string) => {
        const name = abbreviations.get(w.replace(/\./g, '').toLowerCase());
        if (!name) return w;
        const from = s.lastIndexOf(',', off) + 1;
        const to = s.indexOf(',', off) < 0 ? s.length : s.indexOf(',', off);
        // What follows it in its own comma part: nothing, a region or ZIP, or a province ("Lapasan CDO, Misamis
        // Oriental", "Bulua CDO Misamis Oriental" are Cagayan de Oro City).
        const rest = s.slice(off + w.length, to);
        const after = placeKey(placeText(rest));
        const alone = placeText(s.slice(from, to)).replace(/^\d{4} /, '') === norm(w) || !after || isArea(rest) || provinces.has(after);
        return alone ? name : name.replace(/^City of /, '').replace(/ City$/, '');
      })
    : cut;
  // "…, Brgy. Consuelo, Bunawan, Caraga": the region after a town, as the last of three or more parts, not
  // the town of Caraga ("Purok 2, Brgy. Poblacion, Caraga" and "Poblacion, Caraga" are still the town).
  const commaParts = text.split(',').map((part) => placeKey(part)).filter(Boolean);
  const caragaRegion =
    commaParts.length >= 3 &&
    commaParts[commaParts.length - 1] === 'caraga' &&
    towns.has(commaParts[commaParts.length - 2].replace(/^city of /, '').replace(/ city$/, '')) &&
    // "Purok 2, San Jose, Caraga": after a purok or sitio, the part before Caraga is the barangay.
    !/^(?:purok|prk|sitio|zone)\b/.test(commaParts[commaParts.length - 3]);
  const typed = caragaRegion ? placeText(text).replace(/ caraga$/, '') : placeText(text);
  const t = placeKey(typed);
  if (t.length < 2) return null;
  const spans = spansIn(t);
  const q = qualified(t);
  const words = t.split(' ');
  const typedWords = typed.split(' ');
  // The address's parts, each without a region, the country or a ZIP code ("…, Batangas 4200", "…, 4100 Cavite").
  const parts = text
    .split(',')
    .map((part) => placeKey(placeText(part)).replace(/^\d{4} /, ''))
    .filter((part) => part && !isArea(part));
  if (caragaRegion) parts.pop();
  // The last part, after a comma, names the province ("Brgy. San Jose, Batangas") or the town ("San Isidro, Tanauan").
  const last = parts.length > 1 && t.endsWith(` ${parts[parts.length - 1]}`) ? parts[parts.length - 1] : '';
  const lastAsks = last ? qualified(last) : null;
  // Where the commas fall, as word counts: "City" belongs to a name only in its own part ("San Miguel, City of Manila").
  const commas: number[] = [];
  for (const part of text.split(',').map((p) => placeKey(p)).filter(Boolean)) commas.push((commas[commas.length - 1] ?? 0) + part.split(' ').length);
  const oneSide = ([a, b]: Span) => !commas.some((k) => a < k && k < b);
  // A town named like a province elsewhere: "Isabela, Basilan"; "San Juan, Abra" beside San Juan City.
  const shadowed = (g: GazEntry) => g.kind === 'city' && (provinces.get(g.key) ?? []).some((name) => name !== g.prov);
  const tie = (g: GazEntry) => (g.kind === 'prov' ? 0 : shadowed(g) ? -1 : 1);
  /**
   * The names of g's province that say more than g's own name: not "San Juan City" for San Juan. North
   * Cotabato's towns also answer to "Cotabato" (pspans skips it in "South Cotabato" and "Cotabato City").
   */
  const provNames = (g: GazEntry) => {
    const prov = placeKey(g.prov);
    return [prov, prov.replace(/^(city|province) of /, '').replace(/ (city|province)$/, ''), ...(prov.startsWith('north ') ? [prov.slice(6)] : [])].filter(
      (name) => name && name !== g.key && name !== g.key2,
    );
  };
  /** Where a province's name appears in the text: "Cotabato" not inside "South/North Cotabato", "Cotabato City" or "City of Cotabato". */
  const pspans = (name: string) =>
    spans(name).filter(([a, b]) => name !== 'cotabato' || (words[a - 1] !== 'south' && words[a - 1] !== 'north' && words[a - 1] !== 'of' && words[b] !== 'city'));
  /** A street's or a barangay's name, within its own comma part, as adjust() reads it: "Mabini St.", "Brgy. Quezon". */
  const asStreetOrBarangay = ([a, b]: Span) => (STREET.has(words[b]) && oneSide([b - 1, b + 1])) || (a > 0 && BARANGAY.has(words[a - 1]) && oneSide([a - 1, a + 1]));
  /**
   * Whether a province or city group is the address's last part, also by its name without "City",
   * "Province of" or "City of" ("…, Rizal", "…, Manila", "…, Taguig") and with a qualifier ("…,
   * Province of Batangas", "…, Lalawigan ng Quezon", "…, Mountain Prov.", "…, Manila City"); but not by
   * the bare name of a province the list calls "… Province" when a city answers to it ("…, Cebu" is
   * Cebu City, "…, Iloilo" Iloilo City).
   */
  const isLast = (g: GazEntry) =>
    g.key === last ||
    (g.key2 === last && !(g.key.endsWith(' province') && towns.has(g.key2))) ||
    (lastAsks?.kind === 'prov' && isName(g, lastAsks.name)) ||
    (lastAsks?.kind === 'city' && g.key !== g.key2 && !/(^province of | province$)/.test(g.key) && g.key2 === lastAsks.name);
  /** Metro Manila typed: then a province a city also answers to isn't the last part ("Diliman, Quezon, Metro Manila" is Quezon City). */
  const metroTyped = /metro\W*manila|\bncr\b/i.test(input);
  // The places named in full: a town by its label with its province, a city by its name with "City". A
  // province's name inside one ("Palawan" in "Rizal (Marcos), Palawan", "Cebu" in "Cebu City") names
  // that place's province, not another town's. Looked up once, when first needed.
  let namedInFullOnce: { g: GazEntry; at: Span[] }[] | undefined;
  const namedInFull = () =>
    (namedInFullOnce ??= gaz
      .filter((x) => x.kind === 'city' && (x.full !== x.key || isCity(x)) && t.includes(x.key))
      .map((x) => ({ g: x, at: [...(x.full !== x.key ? spans(x.full) : []), ...(isCity(x) ? spans(x.key) : [])] })));

  /** A place named in longer text: how it was found, or null. */
  const inText = (g: GazEntry): Omit<Found, 'g'> | null => {
    // Each way below names the place with its name without "City" in it, but a Manila district by its own
    // name, and a town the list writes with a second name in brackets by its first ("Banton (Jones)").
    const district = g.kind === 'city' && g.name.includes(', ') ? placeKey(g.name.split(', ')[0]) : '';
    const alias = g.kind === 'city' && g.name.includes('(') ? placeKey(g.name.replace(/\s*\([^)]*\)/g, '')) : '';
    if (!t.includes(g.key2) && !(district && t.includes(district)) && !(alias && t.includes(alias))) return null;
    const hit = (name: string, score: number, fits: (at: Span) => boolean = () => true) => {
      const all = spans(name);
      const fit = all.filter(fits);
      const lastPart = last ? fit.find(([a, b]) => b === words.length && words.slice(a, b).join(' ') === last) : undefined;
      return fit.length ? { score, at: lastPart ?? fit[0], all, fit } : null;
    };
    // A town's label, or a province named in full ("Taguig City", "Nueva Vizcaya") as d5a9d05 had it,
    // but a province named like a town (Isabela, Aurora, Quirino) only by its name, below. A town's
    // label with its province, and a city's full name ("Tuguegarao City, Cagayan", "Quezon City"),
    // rank above a city found by "<name> City" alone; a town that stands for its province ranks as it.
    // A city whose label is its "<name> City" only within one comma part and not before "of", as by its
    // name: "Quezon, City of Calamba" is Calamba.
    if (g.kind === 'city' || g.full !== g.key2 || !towns.has(g.key2)) {
      const standsFor = g.kind === 'city' && g.name === g.prov && g.key === g.key2;
      const score = 75 + (g.kind === 'prov' || standsFor ? 0 : g.full !== g.key ? 1 : tie(g));
      const ownName = (at: Span) => oneSide(at) && words[at[1]] !== 'of';
      const byLabel = hit(g.full, g.kind === 'city' && (g.full !== g.key || isCity(g)) ? 77 : score, isCity(g) && g.full === g.key ? ownName : undefined);
      if (byLabel) return g.kind === 'city' && g.full !== g.key ? { ...byLabel, full: true } : byLabel;
      // A town with a second name in brackets, by its first name and its province, ending a part:
      // "San Fernando, Banton, Romblon" is Banton (Jones).
      const byAlias = alias && g.prov && g.prov !== g.name ? hit(`${alias} ${placeKey(g.prov)}`, 77, ([, b]) => b === words.length || commas.includes(b)) : null;
      if (byAlias) return { ...byAlias, full: true };
      // Or by its first name alone as the whole last part, a hair below a town of that name: "Bagumbayan,
      // Santa Praxedes" is Sta. Praxedes (Langangan); "…, Valencia" is still Valencia, Bohol.
      const byAliasLast = alias && last === alias ? hit(alias, 69.9 + tie(g), ([, b]) => b === words.length) : null;
      if (byAliasLast) return byAliasLast;
      const byName = isCity(g) ? hit(g.key, score, ownName) : null;
      if (byName) return byName;
      // A Manila district typed with "Manila" at the end, as its label: "Dagupan Health Center, Tondo, Manila" is Tondo.
      const byDistrict = district ? hit(g.key2, 77, ([, b]) => b === words.length) : null;
      if (byDistrict) return { ...byDistrict, full: true };
    }
    // A province or city group as the address's last part (isLast); with Metro Manila typed, not a province
    // a city also answers to.
    if (g.kind === 'prov' && last && isLast(g) && !(metroTyped && !/\bcity\b/.test(g.key) && gaz.some((c) => isCity(c) && c.key2 === g.key2))) {
      const at: Span = [words.length - last.split(' ').length, words.length];
      return { score: 75, at, all: [at], fit: [at] };
    }
    // "Isabela City": a town the list writes without "City", as its label, unless a place is named so;
    // then only when the town's province comes after it ("San Fernando City, Pampanga"; not "Isabela
    // St., Quezon City"). It sits on the name, so a longer name around it wins ("Maria Aurora City
    // Hall" isn't Aurora); "San Miguel City of Manila" is Manila.
    if (g.kind === 'city' && g.key === g.key2) {
      const n = g.key.split(' ').length;
      const before = spans(`${g.key} city`).filter((at) => oneSide(at) && words[at[1]] !== 'of');
      const after = spans(`city of ${g.key}`).filter(oneSide);
      const named = [...before, ...after];
      const free = !keys.has(`${g.key} city`) && !keys.has(`city of ${g.key}`);
      const provinceAfter = () => provNames(g).some((name) => pspans(name).some(([a, b]) => !STREET.has(words[b]) && named.some(([, d]) => a >= d)));
      if (named.length && (free || (g.prov && g.prov !== g.name && provinceAfter()))) {
        const fit = [...before.map(([a]): Span => [a, a + n]), ...after.map(([, b]): Span => [b - n, b])];
        return { score: 76, at: fit[0], all: named, fit, city: true };
      }
    }
    // A name; "Santa"/"Santo" alone only where typed so ("Sta. Isabel" isn't the town of Santa). A
    // province the list calls "… Province" only before "Provincial" or "Prov." ("Mountain Provincial
    // Hospital", "Paracelis, Mountain Prov."; "Mountain View" isn't Mountain Province).
    const provinceWord = g.kind === 'prov' && g.key.endsWith(' province');
    if (g.key2.length >= 4) {
      const byName = hit(
        g.key2,
        70 + tie(g),
        ([first, end]) => (!provinceWord || words[end] === 'provincial' || words[end] === 'prov') && (!/^sant[ao]$/.test(g.key2) || typedWords[first] === g.key2),
      );
      if (byName) return byName;
    }
    // Last, a Manila district by its own name: "Brgy. 105, Ermita" is Ermita, Manila.
    return district.length >= 4 ? hit(district, 69) : null;
  };

  /** How the text around a place found in it moves its score. */
  const adjust = (g: GazEntry, { score, at, all, fit, city, full }: Omit<Found, 'g'>): number => {
    const where = at!;
    let by = 0;
    // A town typed by its label with its province at the end of the text wins a tie with a city found by
    // its name elsewhere: "Lipa City District Hospital, Nasugbu, Batangas" is Nasugbu.
    if (full && fit.some(([, b]) => b === words.length)) by += 0.25;
    // A town or city whose province is named elsewhere in the text: just below a town typed with its
    // province ("Claveria … Misamis Oriental"), above it right before its province ("Rizal Park,
    // Tuguegarao, Cagayan", "San Fernando City, Pampanga"), and a city or town found by "<name> City"
    // just below a town typed with its province ("Bago City District Hospital, Calatrava, Negros
    // Occidental" is Calatrava) but above a namesake whose province isn't named ("Pangasinan Provincial
    // Hospital, San Carlos City" is Pangasinan's San Carlos City). For a town found by its bare name,
    // not the province's name inside another place named in full ("Aborlan District Hospital, Taytay,
    // Palawan", "San Francisco, Cebu City"); nor, when the last part names another province, a street's
    // or barangay's ("Brgy. Quezon, Dolores, Eastern Samar").
    if (g.kind === 'city' && g.prov && g.prov !== g.name && (score < 72 || score === 76)) {
      const names = provNames(g);
      const otherLast = !!last && !names.includes(last) && (provinces.has(last) || standing.has(last));
      const outside = names
        .flatMap((name) => pspans(name))
        .filter(([a, b]) => b <= where[0] || a >= where[1])
        .filter(([a, b]) => score >= 75 || !namedInFull().some((x) => x.g !== g && x.at.some(([c, d]) => c <= a && b <= d)))
        .filter((s) => !otherLast || !asStreetOrBarangay(s));
      if (outside.length) {
        const next = outside.some(([a]) => all.some(([, b]) => a === b || (words[b] === 'city' && a === b + 1)));
        by = (next ? 78 : score < 75 ? 75.5 : 76.75) - score;
      }
    }
    // "Makati, Manila", "Brgy. 1, Navotas, Manila": Manila as the metro area. A town or city within 25 km of
    // the City of Manila, named as a whole part before it, ranks as if typed before its own province.
    // Also with "Metro Manila" or "NCR" typed, a Manila district too: "Quezon, Santo Niño, Metro Manila" is Quezon City.
    const metroLast = last === 'manila';
    if ((metroLast || metroTyped) && g.key2 !== 'manila' && (g.kind === 'city' || /\bcity\b/.test(g.key))) {
      const lastStart = metroLast ? words.length - 1 : words.length;
      const metro = gaz.find((p) => p.kind === 'prov' && p.key2 === 'manila');
      if (
        metro &&
        (g.prov !== metro.name || !metroLast) &&
        km(g, metro) <= 25 &&
        all.some(([a, b]) => (a === 0 || commas.includes(a)) && (commas.includes(b) || b === words.length) && b <= lastStart)
      )
        by = Math.max(by, (metroLast && all.some(([, b]) => b === lastStart) ? 78 : 75.5) - score);
    }
    // A name found only by reading "Sta." as "Santa" (or the reverse) ranks a hair below one spelled as
    // typed (0.1, less than the last part's 0.25 below), but still above the province ("SANTA ANA RURAL
    // HEALTH UNIT, Cagayan" is Sta. Ana, Cagayan); for "<name> City", its name without "City".
    const label = ` ${norm(g.label)} `;
    const typedNames = city ? all.map(([a, b]): Span => (words[a] === 'city' && words[a + 1] === 'of' ? [a + 2, b] : [a, b - 1])) : all;
    if (/\bsant[ao]\b/.test(words.slice(where[0], where[1]).join(' ')) && !typedNames.some(([a, b]) => label.includes(` ${typedWords.slice(a, b).join(' ')} `))) by -= 0.1;
    // A street's or a barangay's name ranks below the places named in the text, within its own part,
    // and no higher than a town's bare name: "123 Mabini St., Malate, Manila" is Malate; "Brgy. Santo
    // Niño, Tuguegarao City" is Tuguegarao; "Brgy. Cebu City, Aguinaldo" is Aguinaldo. Alone, "Quezon
    // Avenue" still finds Quezon City.
    const street = STREET.has(words[where[1]]) && oneSide([where[1] - 1, where[1] + 1]);
    const barangay = where[0] > 0 && BARANGAY.has(words[where[0] - 1]) && oneSide([where[0] - 1, where[0] + 1]);
    if (street) by -= 5;
    if (barangay) by -= 5;
    if ((street || barangay) && score + by > 71) by = 71 - score;
    // In "<barangay>, <town>", the town that is the whole last part, also as "City of <town>", wins a
    // tie over a name before it: "San Isidro, Tanauan" is Tanauan, not San Isidro, Bohol. A province
    // that is the whole last part wins a tie with a province-level name before it: "Biliran, Bohol" is Bohol.
    if (g.kind === 'prov' && last && fit.some(([a, b]) => b === words.length && words.slice(a, b).join(' ') === last)) by += 0.1;
    if (g.kind === 'city' && last) {
      if (fit.some(([a, b]) => b === words.length && words.slice(a, b).join(' ') === last)) by += 0.25;
      else if (lastAsks?.kind === 'city' && lastAsks.name === g.key2 && (city ? all : fit).some(([, b]) => b === words.length)) by += 0.25;
    }
    return by;
  };

  const found: Found[] = [];
  for (const g of gaz) {
    let named: Omit<Found, 'g'> | null = null;
    let score = 0;
    if (g.aka.includes(t) || (g.full === t && g.full !== g.key)) score = 105;
    else if (g.key === t || g.key2 === t) score = g.kind === 'prov' ? (g.key === t ? 102 : 101) : isCity(g) ? 104 : shadowed(g) ? 100 : 103;
    // Typing on past a town's name into its province's picks that town.
    else if (g.full.startsWith(t) || g.key2.startsWith(t)) score = 80 + (g.kind === 'city' && t.length > g.key.length ? 1 : tie(g));
    else if (q && isName(g, q.name)) score = g.kind === q.kind ? 78 + (isCity(g) ? 1 : 0) : 77;
    else {
      named = inText(g);
      if (named) score = named.score;
      else if (t.length >= 3 && g.key.includes(t)) score = 60 + tie(g);
    }
    if (!score) continue;
    // Of two towns that tie by name, the one spelled as typed: "Sta. Ana" is Sta. Ana, Cagayan, not Santa
    // Ana, Pampanga; also asked for with "City": "Sto. Tomas City" is Sto. Tomas, Batangas.
    if (score >= 100 && score < 105 && g.kind === 'city' && norm(g.name) === typed) score += 0.5;
    if (q && score >= 77 && score < 80 && g.kind === 'city' && norm(g.name) === qualified(typed)?.name) score += 0.5;
    const f: Found = { g, score, at: null, all: [], fit: [] };
    if (named) {
      Object.assign(f, named);
      f.score = score + adjust(g, named);
    }
    found.push(f);
  }

  // A name doesn't count where every mention of it is inside a longer place's name in the text:
  // "Bataan" in "Brgy. Poblacion, New Bataan", "Leyte" in "Southern Leyte", "Santa" in "…, Santa
  // Barbara". Namesakes found as "<name> City" tie ("Cauayan City": Isabela's and Negros
  // Occidental's), and a town found as "<name> City" isn't inside its namesake "<name> City".
  const insideLonger = (f: Found, [s, e]: Span) =>
    found.some((o) => o !== f && !(o.city && f.city && o.g.key === f.g.key) && o.all.some(([a, b]) => a <= s && b >= e && b - a > e - s && !(f.city && f.all.some(([c, d]) => c === a && d === b))));
  /**
   * Whether a town found in the text has its province named there: not as a street's or barangay's
   * name, nor as a whole part before the last ("Isabela, Roxas City" names a barangay, not Isabela).
   */
  const wholePart = ([a, b]: Span) => (a === 0 || commas.includes(a)) && commas.includes(b) && b < words.length;
  const provNamed = (f: Found) =>
    (f.provNamed ??=
      !!f.at && f.g.kind === 'city' && !!f.g.prov && f.g.prov !== f.g.name && provNames(f.g).some((name) => pspans(name).some((at) => !asStreetOrBarangay(at) && !wholePart(at))));
  const drops = (f: Found) =>
    f.at !== null &&
    // A namesake of a town found by its label with its province: "Maasin City Hall, Maasin, Southern Leyte".
    ((!f.full && found.some((o) => o !== f && o.full && o.g.key2 === f.g.key2)) ||
      // A town or city whose province isn't named while a namesake's is: "SM City Pampanga, San Fernando City".
      (f.g.kind === 'city' && !provNamed(f) && !(f.g.full === f.g.key && spans(f.g.full).length) && found.some((o) => o !== f && o.g.key2 === f.g.key2 && provNamed(o))) ||
      f.fit.every((at) => insideLonger(f, at)));
  let best: { g: GazEntry; score: number } | null = null;
  for (const f of found) if (f.score > (best?.score ?? 0) && !drops(f)) best = { g: f.g, score: f.score };
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
