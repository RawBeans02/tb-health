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
