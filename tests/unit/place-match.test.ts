// Typed places (geo.ts matchPlace and buildGazetteer), on a small synthetic list and on the
// committed full list: a typed province name plans from the province, cities still win ties,
// a name inside a longer place's name doesn't count, and a barangay, street or landmark typed
// with a place still finds that place. Synthetic clinic rows only; no real people anywhere.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { prepare, type FacilityRow, type Place } from '../../src/lib/core/facility.ts';
import { buildGazetteer, fromCompact, km, matchPlace, withKeys, type GazEntry } from '../../src/lib/core/geo.ts';

let count = 0;
/** A synthetic clinic in `city`, `prov`, pinned at an approximate town centre. */
function clinic(city: string, prov: string, lat: number, lng: number): Place {
  count += 1;
  const row: FacilityRow = {
    id: `SYN-${count}`,
    name: `SYNTHETIC TEST CLINIC ${count}`,
    sector: 'Government',
    city_municipality: city,
    province_or_city_group: prov,
    region_code: 'R1',
    svc_chest_xray: 'unknown',
    svc_tb_test: 'yes',
    svc_free_tb_medicines: 'yes',
    lat,
    lng,
    geo_precision: 'city',
  };
  return prepare(row);
}

// Shaped like PhilHealth's list: towns named like provinces elsewhere, a province with a
// same-named town inside (Leyte), cities named like their province (Batangas City, Quezon
// City), "Province of Rizal", "Cebu Province" beside Cebu City, longer names that contain
// shorter places (New Bataan, Southern Leyte, Del Carmen), and "Sta." beside "Santa".
const list = [
  clinic('Ilagan', 'Isabela', 17.15, 121.89),
  clinic('Aurora', 'Isabela', 16.99, 121.64),
  clinic('Quirino', 'Isabela', 17.14, 121.74),
  clinic('Isabela', 'Basilan', 6.7, 121.97),
  clinic('Lamitan', 'Basilan', 6.65, 122.13),
  clinic('Isabela', 'Negros Occidental', 10.2, 122.99),
  clinic('Baler', 'Aurora', 15.76, 121.56),
  clinic('Cabarroguis', 'Quirino', 16.51, 121.52),
  clinic('Rizal', 'Cagayan', 17.85, 121.35),
  clinic('Tuguegarao City', 'Cagayan', 17.61, 121.73),
  clinic('Sta. Ana', 'Cagayan', 18.47, 122.15),
  clinic('Antipolo', 'Province of Rizal', 14.59, 121.18),
  clinic('Leyte', 'Leyte', 11.37, 124.48),
  clinic('Palo', 'Leyte', 11.16, 124.99),
  clinic('Maasin City', 'Southern Leyte', 10.13, 124.84),
  clinic('Cebu City', 'Cebu City', 10.32, 123.89),
  clinic('Danao', 'Cebu Province', 10.52, 124.03),
  clinic('Carmen', 'Cebu Province', 10.59, 124.02),
  clinic('Quezon City', 'Quezon City', 14.65, 121.05),
  clinic('Lucena City', 'Quezon', 13.94, 121.62),
  clinic('Quezon', 'Nueva Ecija', 15.55, 120.81),
  clinic('Batangas City', 'Batangas', 13.76, 121.06),
  clinic('Nasugbu', 'Batangas', 14.07, 120.63),
  clinic('Mabini', 'Batangas', 13.76, 120.94),
  clinic('Malate, Manila', 'City of Manila', 14.57, 120.99),
  clinic('Bangued', 'Abra', 17.6, 120.62),
  clinic('Santa', 'Ilocos Sur', 17.49, 120.43),
  clinic('Santa Ana', 'Pampanga', 15.09, 120.77),
  clinic('Santa Cruz', 'Zambales', 15.77, 119.91),
  clinic('Sta. Cruz', 'Laguna', 14.28, 121.42),
  clinic('Sta. Rosa', 'Laguna', 14.31, 121.11),
  clinic('Mariveles', 'Bataan', 14.43, 120.49),
  clinic('New Bataan', 'Davao de Oro', 7.55, 126.14),
  clinic('Abra del Ilog', 'Occidental Mindoro', 13.44, 120.73),
  clinic('Del Carmen', 'Surigao del Norte', 9.87, 126.03),
  clinic('Santa Monica (Sapao)', 'Surigao del Norte', 10.02, 126.04),
  // A city group, and barangay names that are towns elsewhere (the review of e992bb1).
  clinic('Taguig', 'Taguig City', 14.52, 121.05),
  clinic('Bagumbayan', 'Sultan Kudarat', 6.53, 124.56),
  clinic('San Isidro', 'Bohol', 10.03, 124.32),
  clinic('Claveria', 'Cagayan', 18.61, 121.08),
  clinic('Claveria', 'Misamis Oriental', 8.61, 124.89),
  clinic('Gingoog City', 'Misamis Oriental', 8.82, 125.1),
];
const gaz = buildGazetteer(list, { QC: 'Quezon City' });
const label = (text: string, entries: readonly GazEntry[] = gaz) => matchPlace(text, entries)?.label ?? null;
const kindOf = (text: string, entries: readonly GazEntry[] = gaz) => matchPlace(text, entries)?.kind ?? null;

describe('buildGazetteer: provinces', () => {
  it('keeps a province whose name a town elsewhere also has', () => {
    for (const name of ['Isabela', 'Aurora', 'Quirino', 'Quezon Province']) expect(gaz.find((g) => g.label === name)?.kind).toBe('prov');
    expect(gaz.find((g) => g.label === 'Isabela, Basilan')?.kind).toBe('city');
  });

  it('labels a province "… Province" when a city answers to its name, so its label finds it', () => {
    expect(gaz.filter((g) => g.kind === 'prov' && g.label !== g.name).map((g) => g.label)).toEqual(['Batangas Province', 'Quezon Province']);
    expect(gaz.find((g) => g.label === 'Batangas Province')).toMatchObject({ name: 'Batangas', prov: 'Batangas' });
  });

  it('lets a town stand for its province when it has the same name, so labels stay unique', () => {
    expect(gaz.filter((g) => g.label === 'Leyte')).toEqual([expect.objectContaining({ kind: 'city', prov: 'Leyte' })]);
    const labels = gaz.map((g) => g.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('matches "Province of …", "… Province" and "City of …" by the name alone, and Sta./Sto. as Santa/Santo', () => {
    expect(withKeys({ name: 'Province of Rizal', prov: 'Province of Rizal', kind: 'prov', lat: 14.6, lng: 121.2 }).key2).toBe('rizal');
    expect(withKeys({ name: 'Cebu Province', prov: 'Cebu Province', kind: 'prov', lat: 10.5, lng: 124 }).key2).toBe('cebu');
    expect(withKeys({ name: 'City of Manila', prov: 'City of Manila', kind: 'prov', lat: 14.6, lng: 121 }).key2).toBe('manila');
    expect(withKeys({ name: 'Sta. Cruz', prov: 'Laguna', kind: 'city', lat: 14.3, lng: 121.4 })).toMatchObject({ label: 'Sta. Cruz, Laguna', key: 'santa cruz', full: 'santa cruz laguna' });
    expect(withKeys({ name: 'Sto Nino', prov: 'South Cotabato', kind: 'city', lat: 6.4, lng: 124.7 }).key).toBe('santo nino');
  });

  it('attaches an abbreviation to the place it names, not a province named like it', () => {
    expect(gaz.find((g) => g.label === 'Quezon City')?.aka).toEqual(['qc']);
    expect(gaz.find((g) => g.label === 'Quezon Province')?.aka).toEqual([]);
    expect(label('QC')).toBe('Quezon City');
  });
});

describe('matchPlace: names', () => {
  it('plans a typed province name from the province, not a town of that name elsewhere', () => {
    expect(label('Isabela')).toBe('Isabela');
    expect(kindOf('Isabela')).toBe('prov');
    expect(label('Aurora')).toBe('Aurora');
    expect(label('quirino')).toBe('Quirino');
    expect(label('Rizal')).toBe('Province of Rizal');
    expect(label('Isabela Province')).toBe('Isabela');
    expect(label('Province of Isabela')).toBe('Isabela');
    expect(label('Rizal Province')).toBe('Province of Rizal');
    // Also while typing: the province before the towns named like it.
    expect(label('Isab')).toBe('Isabela');
  });

  it('lets cities win ties, also without "City" (README:291), and finds the province when asked', () => {
    expect(label('Quezon')).toBe('Quezon City');
    expect(label('Batangas')).toBe('Batangas City');
    expect(label('Cebu')).toBe('Cebu City');
    expect(label('Lungsod ng Quezon')).toBe('Quezon City');
    expect(label('Quezon Province')).toBe('Quezon Province');
    expect(label('Province of Quezon')).toBe('Quezon Province');
    expect(label('Lalawigan ng Quezon')).toBe('Quezon Province');
    expect(label('Batangas Province')).toBe('Batangas Province');
    expect(label('Cebu Province')).toBe('Cebu Province');
    expect(label('Province of Cebu')).toBe('Cebu Province');
  });

  it('still finds a town by its name with its province', () => {
    expect(label('Rizal, Cagayan')).toBe('Rizal, Cagayan');
    expect(label('Aurora, Isabela')).toBe('Aurora, Isabela');
    expect(label('Isabela, Negros Occidental')).toBe('Isabela, Negros Occidental');
    expect(label('Quirino Isabela')).toBe('Quirino, Isabela');
  });

  it('takes "City" as asking for a town or city: "Isabela City" is a town named Isabela, never the province', () => {
    // The list doesn't say which Isabela is the city; the first by label is Basilan's, which is.
    expect(label('Isabela City')).toBe('Isabela, Basilan');
    expect(label('City of Isabela')).toBe('Isabela, Basilan');
  });

  it('keeps a same-named town inside its province', () => {
    expect(label('Leyte')).toBe('Leyte');
    expect(kindOf('Leyte')).toBe('city');
    expect(label('quezon city')).toBe('Quezon City');
  });

  it('reads Sta. and Sto. as Santa and Santo, and of two names that tie, takes the one spelled as typed', () => {
    // Before, "Santa Rosa" planned from Santa, Ilocos Sur.
    expect(label('Santa Rosa')).toBe('Sta. Rosa, Laguna');
    expect(label('Santa Cruz, Laguna')).toBe('Sta. Cruz, Laguna');
    expect(label('Sta. Ana')).toBe('Sta. Ana, Cagayan');
    expect(label('Santa Ana')).toBe('Santa Ana, Pampanga');
  });

  it('finds every entry by its own label, as Home and Places read `near` from the URL', () => {
    for (const g of gaz) expect(matchPlace(g.label, gaz)).toBe(g);
  });
});

describe('matchPlace: a place inside longer text', () => {
  it('finds the place a landmark or clinic name starts with', () => {
    expect(label('Quezon Avenue')).toBe('Quezon City');
    expect(label('Quezon City Hall')).toBe('Quezon City');
    expect(label('Bangued Rural Health Unit')).toBe('Bangued, Abra');
    expect(label('Lamitan Public Market')).toBe('Lamitan, Basilan');
  });

  it('finds a town and its province after a barangay or street, never the province named like the town', () => {
    expect(label('Brgy. Poblacion, Aurora, Isabela')).toBe('Aurora, Isabela');
    expect(label('Purok 2 Isabela Negros Occidental')).toBe('Isabela, Negros Occidental');
    expect(label('Brgy. 1, Rizal, Cagayan')).toBe('Rizal, Cagayan');
    expect(label('Brgy. 1, Quezon City')).toBe('Quezon City');
    expect(label('Barangay 1 Quezon City')).toBe('Quezon City');
  });

  it("doesn't count a name inside a longer place's name", () => {
    expect(label('Brgy. Poblacion, New Bataan')).toBe('New Bataan, Davao de Oro');
    expect(label('Brgy. 1, Southern Leyte')).toBe('Southern Leyte');
    expect(label('Hospital, Del Carmen')).toBe('Del Carmen, Surigao del Norte');
    expect(label('Abra del Ilog')).toBe('Abra del Ilog, Occidental Mindoro');
    expect(label('Santa Monica')).toBe('Santa Monica (Sapao), Surigao del Norte');
  });

  it('finds a province or city group named after a barangay that is a town elsewhere', () => {
    expect(label('Bagumbayan, Taguig City')).toBe('Taguig City');
    expect(label('Brgy. San Isidro, Abra')).toBe('Abra');
    expect(label('Brgy. San Isidro, Cebu Province')).toBe('Cebu Province');
  });

  it("takes an address's last part as its province, also one a city answers to", () => {
    expect(label('Brgy. San Jose, Batangas')).toBe('Batangas Province');
    expect(label('Brgy. Ibabang Dupay, Quezon')).toBe('Quezon Province');
    expect(label('Brgy. San Jose, Batangas, Philippines')).toBe('Batangas Province');
    // Without a comma it's a landmark or a street, and cities still win ties.
    expect(label('Quezon Avenue')).toBe('Quezon City');
    expect(label('Batangas')).toBe('Batangas City');
    expect(label('Batangas City, Batangas')).toBe('Batangas City');
  });

  it('finds a town named with its province elsewhere in the text', () => {
    expect(label('Claveria Health Dots Center Misamis Oriental')).toBe('Claveria, Misamis Oriental');
    expect(label('Claveria Rural Health Unit, Cagayan')).toBe('Claveria, Cagayan');
  });

  it('finds "<name> City" in longer text for a town the list writes without it', () => {
    expect(label('Brgy. Sunrise, Isabela City')).toBe('Isabela, Basilan');
    expect(label('Brgy. 1, City of Isabela')).toBe('Isabela, Basilan');
  });

  it('ranks a barangay, sitio or purok named like a town elsewhere below the places in the text', () => {
    expect(label('Brgy. San Isidro, Tuguegarao City')).toBe('Tuguegarao City, Cagayan');
    expect(label('Purok Claveria, Lamitan')).toBe('Lamitan, Basilan');
    expect(label('Sitio Bagumbayan, Baler')).toBe('Baler, Aurora');
    // Alone, it still finds the town.
    expect(label('Barangay San Isidro')).toBe('San Isidro, Bohol');
  });

  it("doesn't take a barangay's \"Sta.\" or \"Sto.\" for the town of Santa", () => {
    expect(label('Brgy. Sta. Isabel, Tuguegarao City')).toBe('Tuguegarao City, Cagayan');
    expect(label('Brgy. Poblacion, Santa')).toBe('Santa, Ilocos Sur');
    expect(label('Santa Rural Health Unit')).toBe('Santa, Ilocos Sur');
  });

  it('ranks a street named like a place below the places in the text', () => {
    expect(label('123 Mabini St., Malate, Manila')).toBe('Malate, Manila, City of Manila');
    expect(label('Mabini St.')).toBe('Mabini, Batangas');
  });

  it('ignores a region or the country at the end', () => {
    expect(label('Quezon City, Metro Manila')).toBe('Quezon City');
    expect(label('Quezon City Metro Manila')).toBe('Quezon City');
    expect(label('Bangued, Abra, Philippines')).toBe('Bangued, Abra');
  });

  it("keeps the owner's rules: one letter matches nothing, two letters only the start of a name", () => {
    expect(label('a')).toBeNull();
    expect(label('ab')).toMatch(/^Abra/);
    expect(label('ag')).toBeNull(); // it starts no name here
  });
});

describe('the committed full list', () => {
  const rows: FacilityRow[] = JSON.parse(readFileSync('data/tb-dots-facilities.json', 'utf8')).facilities;
  const abbreviations: Record<string, string> = JSON.parse(readFileSync('data/place-abbreviations.json', 'utf8')).abbreviations;
  const full = buildGazetteer(rows.map(prepare), abbreviations);
  const at = (name: string) => full.find((g) => g.label === name)!;

  it('plans Isabela, Aurora, Quirino and Rizal from their provinces', () => {
    expect(matchPlace('Isabela', full)).toBe(at('Isabela'));
    expect(at('Isabela').kind).toBe('prov');
    // Before, "Isabela" planned from Isabela, Basilan, over 1,000 km away.
    expect(km(at('Isabela'), at('Isabela, Basilan'))).toBeGreaterThan(1000);
    expect(matchPlace('Aurora', full)).toBe(at('Aurora'));
    expect(matchPlace('Quirino', full)).toBe(at('Quirino'));
    expect(matchPlace('Rizal', full)).toBe(at('Province of Rizal'));
  });

  it('keeps the cities and towns it found before', () => {
    for (const town of ['Rizal, Cagayan', 'Aurora, Isabela', 'Isabela, Negros Occidental', 'Quirino, Isabela']) expect(label(town, full)).toBe(town);
    expect(label('Isabela City', full)).toBe('Isabela, Basilan');
    expect(matchPlace('Leyte', full)).toMatchObject({ label: 'Leyte', kind: 'city' });
    expect(matchPlace('Bulacan', full)).toMatchObject({ label: 'Bulacan', kind: 'city' });
    const cities = [['Quezon', 'Quezon City'], ['Batangas', 'Batangas City'], ['Cavite', 'Cavite City'], ['Cebu', 'Cebu City'], ['Iloilo', 'Iloilo City'], ['Taguig', 'Taguig, Taguig City']];
    for (const [text, city] of cities) expect(label(text, full)).toBe(city);
    expect(full.filter((g) => g.kind === 'prov' && g.label !== g.name).map((g) => g.label)).toEqual(['Batangas Province', 'Cavite Province', 'Quezon Province']);
  });

  it('finds places in longer text, as the review found it must', () => {
    expect(label('Brgy. Poblacion, Aurora, Zamboanga del Sur', full)).toBe('Aurora, Zamboanga del Sur');
    expect(label('Brgy. 1, Quezon, Palawan', full)).toBe('Quezon, Palawan');
    expect(label('Hospital, Pres. Quirino', full)).toBe('Pres. Quirino, Sultan Kudarat');
    expect(label('Brgy. Poblacion, New Bataan', full)).toBe('New Bataan, Davao de Oro');
    expect(label('Brgy. Poblacion, Southern Leyte', full)).toBe('Southern Leyte');
    const landmarks = [['Baguio General Hospital', 'Baguio City'], ['Makati Medical Center', 'Makati City'], ['Quezon Avenue', 'Quezon City'], ['Lungsod Quezon', 'Quezon City'], ['Cebu Doctors Hospital', 'Cebu City'], ['Bangued Rural Health Unit', 'Bangued, Abra']];
    for (const [text, place] of landmarks) expect(label(text, full)).toBe(place);
    expect(label('Santa Rosa', full)).toBe('Sta. Rosa, Laguna');
    expect(label('Abra del Ilog', full)).toBe('Abra del Ilog, Occidental Mindoro');
    expect(label('Santa Monica', full)).toBe('Santa Monica (Sapao), Surigao del Norte');
    expect(label('Quezon City, Metro Manila', full)).toBe('Quezon City');
    expect(label('123 Mabini St., Malate, Manila', full)).toBe('Malate, Manila, City of Manila');
  });

  it('keeps barangays named like towns elsewhere in their province or city (the review of e992bb1)', () => {
    const cases = [
      ['Bagumbayan, Taguig City', 'Taguig City'],
      ['Brgy. San Vicente, Lapu-Lapu City', 'Lapu-Lapu City'],
      ['Brgy. San Isidro, Abra', 'Abra'],
      ['Brgy. Sta. Isabel, Tuguegarao City', 'Tuguegarao City, Cagayan'],
      ['Brgy. Sunrise, Isabela City', 'Isabela, Basilan'],
      ['Claveria Health Dots Center Misamis Oriental', 'Claveria, Misamis Oriental'],
      ['Quezon Rural Health Unit-Nueva Vizcaya', 'Quezon, Nueva Vizcaya'],
      ['Brgy. Santo Niño, Tuguegarao City', 'Tuguegarao City, Cagayan'],
      ['Brgy. San Jose, Batangas', 'Batangas Province'],
      ['Little Baguio, San Juan City', 'San Juan City'],
    ];
    for (const [text, place] of cases) expect(label(text, full)).toBe(place);
    // The list names this Manila district; it is 0.1 km from the City of Manila's point.
    expect(label('San Miguel, City of Manila', full)).toBe('San Miguel, Manila, City of Manila');
  });

  it('keeps clinic names and addresses from the list on their own town', () => {
    const cases = [
      // A longer name around "<name> City" wins, and "City" belongs to a name only in its own part.
      ['Maria Aurora City Hall', 'Maria Aurora'],
      ['New Lucena City Hall', 'New Lucena, Iloilo Province'],
      ['San Nicolas, City of Manila', 'City of Manila'],
      // Namesakes found as "<name> City" tie (label order), never cancel out.
      ['Cauayan City Health Office', 'Cauayan, Isabela'],
      // A town with its province named in the text beats a namesake elsewhere.
      ['Ilang, San Carlos City, Pangasinan', 'San Carlos City, Pangasinan'],
      ['Pangasinan Provincial Hospital, San Carlos City', 'San Carlos City, Pangasinan'],
      ['KM 2 Binuangan Isabela City, Isabela', 'Isabela, Basilan'],
      // A name named twice counts everywhere it appears; a group named after its town adds nothing.
      ['STA. BARBARA RURAL HEALTH UNIT, Santa Barbara', 'Santa Barbara, Pangasinan'],
      ['SAN JUAN MUNICIPAL HEALTH OFFICE, San Juan (Lapog)', 'San Juan (Lapog), Ilocos Sur'],
      ['Brgy. Sta. Isabel, Santa', 'Santa, Ilocos Sur'],
    ];
    for (const [text, place] of cases) expect(label(text, full)).toBe(place);
  });

  it('stays fast on long text: matching reads at most 200 characters', () => {
    const start = performance.now();
    expect(label(`${'Quezon '.repeat(2000)}`, full)).toBe('Quezon City');
    expect(label(`${'Purok 1, Brgy. San Isidro, '.repeat(3)}Tuguegarao City`, full)).toBe('Tuguegarao City, Cagayan');
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('attaches every listed abbreviation as before', () => {
    const akas = Object.fromEntries(full.filter((g) => g.aka.length).map((g) => [g.aka.join(), g.label]));
    expect(akas).toEqual({
      cdo: 'Cagayan de Oro City',
      camnorte: 'Camarines Norte',
      camsur: 'Camarines Sur',
      dasma: 'Dasmarinas, Cavite',
      gensan: 'General Santos City, South Cotabato',
      negocc: 'Negros Occidental',
      negor: 'Negros Oriental',
      qc: 'Quezon City',
      sjdm: 'San Jose del Monte, Bulacan',
    });
  });

  it('finds every entry by its own label, also from the compact form the site loads', () => {
    for (const g of full) expect(matchPlace(g.label, full)).toBe(g);
    // As prepare-data writes it and the browser rebuilds it (fromCompact).
    const compact = fromCompact(full.map(({ name, prov, kind, lat, lng, aka }) => ({ name, prov, kind, lat, lng, ...(aka.length ? { aka } : {}) })));
    expect(compact.map((g) => g.label)).toEqual(full.map((g) => g.label));
    for (const text of ['Isabela', 'Rizal', 'Cebu', 'Quezon', 'Batangas Province', 'Isabela City', 'QC', 'Santa Rosa', 'Quezon City, Metro Manila']) {
      expect(label(text, compact)).toBe(label(text, full));
    }
  });
});

describe('the re-review of 3ad2bf0: what each finding found, with the right place', () => {
  const rows: FacilityRow[] = JSON.parse(readFileSync('data/tb-dots-facilities.json', 'utf8')).facilities;
  const abbreviations: Record<string, string> = JSON.parse(readFileSync('data/place-abbreviations.json', 'utf8')).abbreviations;
  const full = buildGazetteer(rows.map(prepare), abbreviations);
  /** Each text with the label it plans from (null: the text route), so a failure names the text. */
  const expectPlaces = (cases: [string, string | null][], entries: readonly GazEntry[] = full) => {
    for (const [text, place] of cases) expect([text, matchPlace(text, entries)?.label ?? null]).toEqual([text, place]);
  };

  it('ranks a barangay named like another town of the province below the town typed with it', () => {
    expectPlaces([
      ['Magsaysay, Quezon, Palawan', 'Quezon, Palawan'],
      ['Purok 1, Magsaysay, Narra, Palawan', 'Narra, Palawan'],
      ['Buenavista, Real, Quezon', 'Real, Quezon'],
      ['San Carlos, Sipalay, Negros Occidental', 'Sipalay, Negros Occidental'],
      ['Claveria, Tuguegarao City, Cagayan', 'Tuguegarao City, Cagayan'],
      ['Brgy. Del Pilar, Tubod, Surigao del Norte', 'Tubod, Surigao del Norte'],
      ['Quezon, Talugtug, Nueva Ecija', 'Talugtug, Nueva Ecija'],
      ['Biñan, Pagsanjan, Laguna', 'Pagsanjan, Laguna'],
      // A town that stands for its province ranks as that province in longer text.
      ['Brgy. Iniguihan, Bato 5355, Leyte', 'Bato, Leyte'],
      ['Tacloban City, Leyte', 'Tacloban City'],
      ['Ormoc City, Leyte', 'Ormoc City'],
    ]);
  });

  it('plans "…, Rizal", "…, Manila" and a city group named as the last part from the province or group', () => {
    expectPlaces([
      ['Taytay, Rizal', 'Province of Rizal'],
      ['San Isidro, Rodriguez, Rizal', 'Province of Rizal'],
      ['Blk 5 Lot 10, San Isidro, Cainta, Rizal', 'Province of Rizal'],
      ['Santo Niño, Rizal', 'Province of Rizal'],
      ['San Isidro, Rizal Province', 'Province of Rizal'],
      ['SM City Taytay, Rizal', 'Province of Rizal'],
      ['Brgy. San Mateo, Taytay, Rizal', 'Province of Rizal'],
      ['San Agustin Church, Manila', 'City of Manila'],
      ['Santo Tomas University, Manila', 'City of Manila'],
      ['Sta. Ana Hospital, Manila', 'Sta. Ana, Manila, City of Manila'],
      ['Bagumbayan, Taguig', 'Taguig City'],
      ['San Vicente, Lapu-Lapu', 'Lapu-Lapu City'],
      ['Concepcion, Malabon', 'Malabon City'],
      ['Little Baguio, San Juan', 'San Juan City'],
      // Not the provinces the list names "… Province": "…, Cebu" and "…, Iloilo" stay the cities.
      ['Brgy. Poblacion, Cebu', 'Cebu City'],
      ['Jaro, Iloilo', 'Iloilo City'],
      ['Rizal, Laguna', 'Rizal, Laguna'],
      ['123 Mabini St., Malate, Manila', 'Malate, Manila, City of Manila'],
    ]);
  });

  it('takes the town that is the whole last part of "<barangay>, <town>" over a town named like the barangay', () => {
    expectPlaces([
      ['San Isidro, Tanauan', 'Tanauan, Batangas'],
      ['Magsaysay, Tagum', 'Tagum, Davao del Norte'],
      ['Burgos, Digos', 'Digos, Davao del Sur'],
      ['La Paz, Makati', 'Makati City'],
      ['Concepcion, Marikina', 'Marikina City'],
      ['Legazpi Village, Makati', 'Makati City'],
      ['Bagumbayan, City of Batangas', 'Batangas City'],
    ]);
  });

  it('plans a Metro Manila district the list doesn\'t name from the City of Manila', () => {
    expectPlaces([
      ['Cubao, Metro Manila', 'City of Manila'],
      ['BGC, Metro Manila', 'City of Manila'],
      ['Kapitolyo, Metro Manila', 'City of Manila'],
      ['Alabang, Metro Manila', 'City of Manila'],
      ['Camarin, Metro Manila', 'City of Manila'],
      ['Quezon City, Metro Manila', 'Quezon City'],
    ]);
  });

  it('reads "<barangay> City of <city>" as the city, not "<barangay> City"', () => {
    expectPlaces([
      ['San Miguel City of Manila', 'San Miguel, Manila, City of Manila'],
      ['San Nicolas City of Manila', 'City of Manila'],
      ['Brgy. Del Pilar City of Manila', 'City of Manila'],
      ['San Isidro City of Bacolod', 'Bacolod City'],
      ['San Jose City of Angeles', 'Angeles City'],
      ['Science City of Muñoz', 'Science City of Muñoz, Nueva Ecija'],
    ]);
  });

  it('ignores a ZIP code, a region or the country after the province, also without a comma', () => {
    expectPlaces([
      ['Carmen, Cavite 4100', 'Cavite Province'],
      ['Carmen, 4100 Cavite', 'Cavite Province'],
      ['Bagumbayan, Batangas 4200', 'Batangas Province'],
      ['Burgos, Cavite Philippines', 'Cavite Province'],
      ['Brgy. San Jose, Batangas Philippines', 'Batangas Province'],
      ['Brgy. San Isidro, Quezon Philippines', 'Quezon Province'],
      ['Brgy. Ibabang Dupay, Quezon 4301', 'Quezon Province'],
      ['Brgy. San Jose, Quezon, Calabarzon', 'Quezon Province'],
      ['Quezon City 1100', 'Quezon City'],
      ['Purok 1234, Tuguegarao City', 'Tuguegarao City, Cagayan'],
      // Four digits after "Lot" are a lot number, not a ZIP code.
      ['Lot 1234', null],
    ]);
  });

  it('reads a qualified province as the last part', () => {
    expectPlaces([
      ['Brgy. San Jose, Lalawigan ng Quezon', 'Quezon Province'],
      ['Brgy. San Jose, Province of Quezon', 'Quezon Province'],
      ['Brgy. San Jose, Province of Batangas', 'Batangas Province'],
      ['Brgy. San Jose, Probinsya ng Cavite', 'Cavite Province'],
      ['Brgy. San Jose, Lungsod ng Batangas', 'Batangas City'],
    ]);
  });

  it('reads a listed abbreviation in longer text, also with dots', () => {
    expectPlaces([
      ['Cubao, QC', 'Quezon City'],
      ['Brgy. San Isidro, QC', 'Quezon City'],
      ['QC Hall', 'Quezon City'],
      ['Cubao, Q.C.', 'Quezon City'],
      ['Carmen, CDO', 'Cagayan de Oro City'],
      ['Lapasan, C.D.O.', 'Cagayan de Oro City'],
      ['Lagao, GenSan', 'General Santos City, South Cotabato'],
      ['Salitran, Dasma', 'Dasmarinas, Cavite'],
      ['Isabela, NegOcc', 'Isabela, Negros Occidental'],
      ['Pamplona, CamSur', 'Pamplona, Camarines Sur'],
      ['QC', 'Quezon City'],
    ]);
  });

  it('finds a Manila district by its own name, after every other name', () => {
    expectPlaces([
      ['Brgy. 105, Ermita', 'Ermita, Manila, City of Manila'],
      ['Binondo 1012', 'Binondo, Manila, City of Manila'],
      ['123 Mabini St., Malate', 'Malate, Manila, City of Manila'],
      ['Tondo Medical Center', 'Tondo, Manila, City of Manila'],
      ['Smokey Mountain, Tondo', 'Tondo, Manila, City of Manila'],
      // A town of that name still wins.
      ['Santa Cruz', 'Santa Cruz, Marinduque'],
      ['BRGY. NAPO, Santa Cruz', 'Santa Cruz, Marinduque'],
      ['Sta. Ana', 'Sta. Ana, Cagayan'],
    ]);
  });

  it('takes "<town>, Quezon City" as Quezon City', () => {
    expectPlaces([
      ['San Antonio, Quezon City', 'Quezon City'],
      ['San Antonio Quezon City', 'Quezon City'],
      ['Lian, Batangas City', 'Batangas City'],
      ['San Antonio, Quezon Province', 'San Antonio, Quezon'],
    ]);
  });

  it('finds San Fernando, Pampanga, typed "San Fernando City", and keeps La Union\'s', () => {
    expectPlaces([
      ['San Fernando City, Pampanga', 'San Fernando, Pampanga'],
      ['Brgy. Dolores, San Fernando City, Pampanga', 'San Fernando, Pampanga'],
      ['San Fernando City Pampanga', 'San Fernando, Pampanga'],
      ['San Fernando City Hall, San Fernando, Pampanga', 'San Fernando, Pampanga'],
      ['Brgy. Dolores, City of San Fernando, Pampanga', 'San Fernando, Pampanga'],
      ['San Fernando City', 'San Fernando City, La Union'],
      ['Brgy. Catbangen, San Fernando City, La Union', 'San Fernando City, La Union'],
      ['Naga City, Cebu', 'Naga, Cebu Province'],
      // A province named before the city: the province, 2 km from its capital.
      ['SM City Pampanga, San Fernando City', 'Pampanga'],
      // A province's name as a whole part before the last reads as a barangay's: the city typed stays.
      ['Isabela, Roxas City', 'Roxas City, Capiz'],
      ['Isabela, San Pablo City', 'San Pablo City, Laguna'],
      // A street or barangay named after a province says nothing about the city's namesakes.
      ['Isabela St., Quezon City', 'Quezon City'],
      ['Brgy. Isabela, Quezon City', 'Quezon City'],
      ['Cebu St., Naga City', 'Naga City'],
      ['Abra del Ilog, San Juan City', 'San Juan City'],
    ]);
  });

  it('finds the town typed with its province before a landmark named after another town', () => {
    expectPlaces([
      ['Magsaysay Park, Narra, Palawan', 'Narra, Palawan'],
      ['Quezon Memorial Hospital, Taytay, Palawan', 'Taytay, Palawan'],
      ['Rizal Elementary School, Tuguegarao City, Cagayan', 'Tuguegarao City, Cagayan'],
      ['Mabini Shrine, Tagbilaran City, Bohol', 'Tagbilaran City, Bohol'],
      ['Burgos Elementary School, Urdaneta, Pangasinan', 'Urdaneta, Pangasinan'],
      ['Rizal Park, Tuguegarao, Cagayan', 'Tuguegarao City, Cagayan'],
      ['Magsaysay Elementary School, Puerto Princesa City, Palawan', 'Puerto Princesa City'],
      ['Quezon Park, Santiago City, Isabela', 'Santiago City'],
      ['Leyte Provincial Hospital, Palo, Leyte', 'Palo, Leyte'],
      ['Aparri, Cagayan de Oro City', 'Cagayan de Oro City'],
    ]);
  });

  it("doesn't take a street or barangay named like a province for that province", () => {
    expectPlaces([
      ['Brgy. Quezon, Dolores, Eastern Samar', 'Eastern Samar'],
      ['M.L. Quezon St., General Luna, Surigao del Norte', 'Surigao del Norte'],
      ['Brgy. Quezon, Buenavista, Bohol', 'Bohol'],
      ['Brgy. Aurora, Casiguran, Sorsogon', 'Sorsogon'],
      ['J.P. Rizal St., Baras', 'Baras, Province of Rizal'],
      ['Quezon Rural Health Unit - Isabela, Quezon', 'Quezon, Isabela'],
    ]);
  });

  it('reads "Sto. Tomas City" as the Sto. Tomas spelled so', () => {
    expectPlaces([
      ['Sto. Tomas City Hall', 'Sto. Tomas, Batangas'],
      ['Sto. Tomas City Health Office', 'Sto. Tomas, Batangas'],
      ['Sto. Tomas City', 'Sto. Tomas, Batangas'],
      ['Sta. Barbara City', 'Sta. Barbara, Iloilo Province'],
      ['Santo Tomas City', 'Santo Tomas, Pampanga'],
      // Spelled the other way, a town named with its province still ranks above the province.
      ['SANTA ANA RURAL HEALTH UNIT, Cagayan', 'Sta. Ana, Cagayan'],
    ]);
  });

  it('drops the namesakes of a town found by its label with its province', () => {
    expectPlaces([
      ['MAASIN CITY HEALTH UNIT I, Maasin, Southern Leyte', 'Maasin, Southern Leyte'],
      ['TALISAY CITY HEALTH UNIT III, Talisay, Cebu Province', 'Talisay, Cebu Province'],
      ['SAN CARLOS CITY HEALTH OFFICE, San Carlos City, Pangasinan', 'San Carlos City, Pangasinan'],
      ['Samal City Hall, Samal, Davao del Norte', 'Samal, Davao del Norte'],
      ['Valencia City Hall, Valencia, Bukidnon', 'Valencia, Bukidnon'],
      ['Batangas City, Batangas Province', 'Batangas City'],
    ]);
  });

  it('counts a name that is also named on its own, outside a longer name', () => {
    expectPlaces([
      ['Brgy. New Bataan, Bataan', 'Bataan'],
      ['Padre Burgos St., Burgos, Pangasinan', 'Burgos, Pangasinan'],
      ['BRGY. NAGA-NAGA, Palo', 'Palo, Leyte'],
      ['Brgy. Poblacion, New Bataan', 'New Bataan, Davao de Oro'],
    ]);
  });

  it("doesn't take a province's name inside another town's label as naming a town's province", () => {
    expectPlaces([
      ['ABORLAN MEDICARE HOSPITAL, Rizal (Marcos), Palawan', 'Rizal (Marcos), Palawan'],
      ['Aborlan District Hospital, Taytay, Palawan', 'Taytay, Palawan'],
      ['Abulug District Hospital, Tuguegarao City, Cagayan', 'Tuguegarao City, Cagayan'],
      ['Mabini, Maribojoc, Bohol', 'Maribojoc, Bohol'],
      ['Luna, Rosario, La Union', 'Rosario, La Union'],
      // Nor the province's name inside a city's name.
      ['San Francisco, Cebu City', 'Cebu City'],
      ['Lemery, Iloilo City', 'Iloilo City'],
    ]);
  });

  it('reads street and barangay words only within their own comma part, and ranks those names no higher than a town', () => {
    expectPlaces([
      ['TABUK BARANGAY, Isabela', 'Isabela'],
      ['Bagumbayan Barangay, Bais City, Negros Oriental', 'Bais City, Negros Oriental'],
      ['Brgy. Cebu City, Aguinaldo', 'Aguinaldo, Ifugao'],
    ]);
  });

  it('doesn\'t take the word "Mountain" for Mountain Province', () => {
    expectPlaces([
      ['Mountain View Subdivision', null],
      ['Rocky Mountain Clinic', null],
      ['Smokey Mountain', null],
      ['Mountain View Subdivision, Rizal', 'Province of Rizal'],
      // As the last part, or before "Provincial", it is still the province: no city answers to "Mountain".
      ['Brgy. San Jose, Mountain', 'Mountain Province'],
      ['Mountain Provincial Hospital', 'Mountain Province'],
      ['Mountain Province', 'Mountain Province'],
      ['Bontoc, Mountain Province', 'Bontoc, Mountain Province'],
    ]);
  });

  it('leaves a province at the very end without a comma, "Bayan ng X" and a partial "Sta." name as they were', () => {
    expectPlaces([
      // A province at the very end without a comma: cities still win ties.
      ['Kawit Cavite', 'Cavite City'],
      ['Taytay Rizal', 'Taytay, Palawan'],
      // "Bayan ng X" is a name with no kind asked for.
      ['Bayan ng Isabela', 'Isabela'],
      // Partial "Sta." names while typing tie by label order.
      ['Sta. B', 'Santa Barbara, Pangasinan'],
    ]);
  });

  it('applies the same rules to a small synthetic list', () => {
    expectPlaces(
      [
        ['Brgy. 1, QC', 'Quezon City'],
        ['Cubao, Q.C.', 'Quezon City'],
        ['Bagumbayan, Lamitan', 'Lamitan, Basilan'],
        ['Cubao, Metro Manila', 'City of Manila'],
        ['Brgy. San Jose, Batangas 4200', 'Batangas Province'],
        ['Brgy. 1, Rizal', 'Province of Rizal'],
        ['Brgy. 1, Province of Quezon', 'Quezon Province'],
      ],
      gaz,
    );
  });
});

describe('the two checkers of round 1: what each finding found, with the right place', () => {
  const rows: FacilityRow[] = JSON.parse(readFileSync('data/tb-dots-facilities.json', 'utf8')).facilities;
  const abbreviations: Record<string, string> = JSON.parse(readFileSync('data/place-abbreviations.json', 'utf8')).abbreviations;
  const full = buildGazetteer(rows.map(prepare), abbreviations);
  /** Each text with the label it plans from (null: the text route), so a failure names the text. */
  const expectPlaces = (cases: [string, string | null][], entries: readonly GazEntry[] = full) => {
    for (const [text, place] of cases) expect([text, matchPlace(text, entries)?.label ?? null]).toEqual([text, place]);
  };

  it('reads "<Metro Manila city>, Manila" as that city, with Manila as the metro area', () => {
    expectPlaces([
      ['Muntinlupa, Manila', 'Muntinlupa City'],
      ['Las Pinas, Manila', 'Las Piñas City'],
      ['Brgy. San Isidro, Marikina, Manila', 'Marikina City'],
      ['Taguig City, Manila', 'Taguig City'],
      ['Pateros, Manila', 'Pateros'],
      ['Caloocan, Manila', 'Caloocan City'],
      ['Makati, Manila', 'Makati City'],
      // Unchanged: a landmark or district before ", Manila".
      ['Quezon Bridge, Manila', 'City of Manila'],
      ['Pasig River, Manila', 'City of Manila'],
      ['San Agustin Church, Manila', 'City of Manila'],
      ['Tondo, Manila', 'Tondo, Manila, City of Manila'],
      ['123 Mabini St., Malate, Manila', 'Malate, Manila, City of Manila'],
      // Old addresses with "Rizal" stay with the province (lead decision 2).
      ['Marikina, Rizal', 'Province of Rizal'],
    ]);
  });

  it('keeps a Metro Manila city typed with "Metro Manila" or "NCR", also when a street has its name', () => {
    expectPlaces([
      ['Diliman, Quezon, Metro Manila', 'Quezon City'],
      ['East Avenue, Diliman, Brgy. Pinyahan, Quezon, Metro Manila', 'Quezon City'],
      ['Diliman, Quezon, NCR', 'Quezon City'],
      ['Quezon Ave., Metro Manila', 'Quezon City'],
      ['Makati Ave., Metro Manila', 'Makati City'],
      ['Pasig Blvd, Pasig, Metro Manila', 'Pasig City'],
      ['425 Pasig Blvd., Brgy. Bagong Ilog, Pasig, Metro Manila', 'Pasig City'],
      ['Caloocan Ave., Caloocan, Metro Manila', 'Caloocan City'],
      ['Brgy. Caloocan, Caloocan, Metro Manila', 'Caloocan City'],
      // Unchanged: a place the list doesn't name is the City of Manila; Quezon without Metro Manila is the province.
      ['Cubao, Metro Manila', 'City of Manila'],
      ['BGC, Metro Manila', 'City of Manila'],
      ['Alabang, Metro Manila', 'City of Manila'],
      ['Brgy. Bagumbayan, Metro Manila', 'City of Manila'],
      ['Quezon City, Metro Manila', 'Quezon City'],
      ['Brgy. San Jose, Quezon', 'Quezon Province'],
      ['Cubao, Quezon', 'Quezon Province'],
      ['Brgy. San Isidro, Rizal, Metro Manila', 'Province of Rizal'],
    ]);
  });

  it('reads "Prov." as "Province", and "Caraga" after a town as the region', () => {
    expectPlaces([
      ['Brgy. San Isidro, Mountain Prov.', 'Mountain Province'],
      ['Poblacion, Mountain Prov.', 'Mountain Province'],
      ['Brgy. San Jose, Prov. of Mountain', 'Mountain Province'],
      ['Brgy. San Jose, Batangas Prov.', 'Batangas Province'],
      ['Brgy. San Jose, Cavite Prov.', 'Cavite Province'],
      ['Brgy. Consuelo, Bunawan, Caraga', 'Bunawan, Agusan del Sur'],
      ['National Highway, Maygatasan, Bayugan, Caraga', 'Bayugan, Agusan del Sur'],
      ['Brgy. Consuelo, Bunawan, Caraga Region', 'Bunawan, Agusan del Sur'],
      ['Purok 2, Brgy. Poblacion, Caraga', 'Caraga, Davao Oriental'],
      ['Poblacion, Caraga', 'Caraga, Davao Oriental'],
      ['Caraga', 'Caraga, Davao Oriental'],
    ]);
  });

  it('ignores "<name> Region", "Region IVA" and "Region 4A" at the end', () => {
    expectPlaces([
      ['Brgy. San Jose, Cavite, Calabarzon Region', 'Cavite Province'],
      ['Brgy. San Jose, Cavite, Region IVA', 'Cavite Province'],
      ['Brgy. San Jose, Batangas, Region 4A', 'Batangas Province'],
      ['Brgy. San Jose, Batangas, Region IV-A', 'Batangas Province'],
    ]);
  });

  it('reads an abbreviation inside a brand or shop name as a bare name, below the town typed last', () => {
    expectPlaces([
      ['CDO Foodsphere, Valenzuela', 'Valenzuela City'],
      ['GenSan Tuna Bar, Pasig', 'Pasig City'],
      ['QC Bank, Pasig', 'Pasig City'],
      // Unchanged: alone, last, or before a ZIP code it is still its place.
      ['Cubao, QC 1100', 'Quezon City'],
      ['Cubao QC', 'Quezon City'],
      ['QC Hall', 'Quezon City'],
      ['Bagumbayan QC', 'Quezon City'],
      ['CDO Divisoria', 'Cagayan de Oro City'],
      ['GenSan Fish Port', 'General Santos City, South Cotabato'],
      ['Lagao, GenSan 9500', 'General Santos City, South Cotabato'],
      ['Dasma Cavite', 'Dasmarinas, Cavite'],
      ['Q.C.', 'Quezon City'],
    ]);
  });

  it('finds a town the list writes with a second name in brackets by its first name', () => {
    expectPlaces([
      ['San Fernando, Banton, Romblon', 'Banton (Jones), Romblon'],
      ['Caoayan, Quirino, Ilocos Sur', 'Quirino (Angaki), Ilocos Sur'],
      ['Ayungon, Valencia, Negros Oriental', 'Valencia (Luzurriaga), Negros Oriental'],
      ['Alilem, San Juan, Ilocos Sur', 'San Juan (Lapog), Ilocos Sur'],
      ['Bagumbayan, Santa Praxedes', 'Sta. Praxedes (Langangan), Cagayan'],
      ['Bagumbayan, Sta. Praxedes', 'Sta. Praxedes (Langangan), Cagayan'],
      // As the last part, a town of that name without brackets still comes first.
      ['San Isidro, Valencia', 'Valencia, Bohol'],
    ]);
  });

  it('reads "Cotabato" after a North Cotabato town as its province', () => {
    expectPlaces([
      ['Antipas, Cotabato', 'Antipas, North Cotabato'],
      ['Brgy. Poblacion, Arakan, Cotabato', 'Arakan, North Cotabato'],
      ['Kidapawan, Cotabato', 'Kidapawan, North Cotabato'],
      ['Carmen, Cotabato', 'Carmen, North Cotabato'],
      ['Brgy. Rosary Heights, Cotabato', 'Cotabato City'],
    ]);
  });

  it('takes the town typed with its province over "<X> City" named elsewhere in the text', () => {
    expectPlaces([
      ['Tagbilaran City, Talibon, Bohol', 'Talibon, Bohol'],
      ['Lipa City District Hospital, Nasugbu, Batangas', 'Nasugbu, Batangas'],
      ['Bago City District Hospital, Calatrava, Negros Occidental', 'Calatrava, Negros Occidental'],
      ['Bago City Health Office, Binalbagan, Negros Occidental', 'Binalbagan, Negros Occidental'],
      ['Tuguegarao City District Hospital, Tuao, Cagayan', 'Tuao, Cagayan'],
      // Lead decision 4.
      ['Tacloban City, Leyte', 'Tacloban City'],
    ]);
  });

  it('reads a city listed as "<X> City" only within one comma part and not before "of"', () => {
    expectPlaces([
      ['Quezon, City of Calamba', 'Calamba, Laguna'],
      ['Santiago, City of Malolos', 'Malolos, Bulacan'],
      ['Quezon, City of Ilagan', 'Ilagan, Isabela'],
      ['Santiago, City of Cabuyao', 'Cabuyao, Laguna'],
      ['Little Baguio, City of San Juan', 'San Juan City'],
      ['Dagupan, City of Manila', 'City of Manila'],
      ['Quezon, City of Tanauan, Batangas', 'Tanauan, Batangas'],
      ['Quezon, City of San Fernando, Pampanga', 'San Fernando, Pampanga'],
    ]);
  });

  it('reads a province typed as a street or barangay and again as the last part as that province', () => {
    expectPlaces([
      ['Bulacan St., San Roque, Bulacan', 'Bulacan'],
      ['Brgy. Bulacan, San Jose, Bulacan', 'Bulacan'],
      ['Leyte St., San Isidro, Leyte', 'Leyte'],
      ['Cagayan St., San Isidro, Cagayan', 'Cagayan'],
      ['Laguna St., San Isidro, Laguna', 'Laguna'],
      ['Pangasinan St., San Jose, Pangasinan', 'Pangasinan'],
      ['Brgy. San Miguel, San Miguel, Manila', 'San Miguel, Manila, City of Manila'],
      ['Magsaysay Avenue Ramon Magsaysay', 'Ramon Magsaysay, Zamboanga del Sur'],
    ]);
  });

  it('ranks a "Sta."/"Santa" spelling below the last part\'s edge', () => {
    expectPlaces([
      ['San Isidro, Santa Lucia', 'Sta. Lucia, Ilocos Sur'],
      ['Santa Maria District Hospital, Bulacan', 'Sta. Maria, Bulacan'],
      ['Sta. Fe Health Center, Leyte', 'Santa Fe, Leyte'],
      ['Sta. Fe Rural Health Unit, Romblon', 'Santa Fe, Romblon'],
      ['SANTA ANA RURAL HEALTH UNIT, Cagayan', 'Sta. Ana, Cagayan'],
      ['Sta. Ana', 'Sta. Ana, Cagayan'],
    ]);
    // Two towns are spelled "Sta. Teresita": either is right.
    expect(['Sta. Teresita, Batangas', 'Sta. Teresita, Cagayan']).toContain(matchPlace('San Jose, Santa Teresita', full)?.label);
  });

  it('reads a Manila district typed before ", Manila" at the end as that district', () => {
    expectPlaces([
      ['Dagupan Health Center, Tondo, Manila', 'Tondo, Manila, City of Manila'],
      ['Dapitan Health Center, Sampaloc, Manila', 'Sampaloc, Manila, City of Manila'],
      ['Esperanza Health Center, Santa Mesa, Manila', 'Santa Mesa, Manila, City of Manila'],
      ['San Miguel Health Center, San Miguel, Manila', 'San Miguel, Manila, City of Manila'],
      ['Sta. Ana Hospital, Sta. Ana, Manila', 'Sta. Ana, Manila, City of Manila'],
      ['Tayabas Health Center, Tondo, Manila', 'Tondo, Manila, City of Manila'],
      ['Tondo, Manila, Batangas 4000', 'Batangas Province'],
    ]);
  });

  it('takes a province or city group that is the whole last part, also "…, Manila City"', () => {
    expectPlaces([
      ['Biliran, Bohol', 'Bohol'],
      ['Biliran, Cagayan', 'Cagayan'],
      ['Pateros, Quezon', 'Quezon Province'],
      ['Bulacan, Taguig', 'Taguig City'],
      ['Lapu-Lapu City, Taguig', 'Taguig City'],
      ['San Isidro, Manila City', 'City of Manila'],
      ['Bagumbayan, Manila City', 'City of Manila'],
      ['San Agustin Church, Manila City', 'City of Manila'],
      ['Brgy. Greenhills, City of San Juan', 'San Juan City'],
    ]);
  });

  it('the final check of round 2: purok before a Caraga barangay, Metro Manila typed, an abbreviation before a province', () => {
    expectPlaces([
      ['Purok 2, San Jose, Caraga', 'Caraga, Davao Oriental'],
      ['Sitio Mahayag, Santiago, Caraga', 'Caraga, Davao Oriental'],
      ['Brgy. Consuelo, Bunawan, Caraga', 'Bunawan, Agusan del Sur'],
      ['Marikina, Santo Niño, Metro Manila', 'Marikina City'],
      ['Pasig, Santa Lucia, Metro Manila', 'Pasig City'],
      ['Quezon, Santo Domingo, Metro Manila', 'Quezon City'],
      ['Lapasan CDO, Misamis Oriental', 'Cagayan de Oro City'],
      ['CDO Foodsphere, Valenzuela', 'Valenzuela City'],
    ]);
  });
});
