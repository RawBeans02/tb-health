// The ported planner core (src/lib/core), checked against the 93-row sample and small
// synthetic lists. Synthetic rows only; no real people anywhere.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { buildDataset, loadFacilities, type FacilitiesFile } from '../../src/lib/core/data.ts';
import { offers, prepare, serviceStatus, type FacilityRow } from '../../src/lib/core/facility.ts';
import { buildGazetteer, distanceLabel, km, matchPlace, withKeys } from '../../src/lib/core/geo.ts';
import { directionsUrl, homeQuery, readHomeParams } from '../../src/lib/core/links.ts';
import { firstPhone, telHref } from '../../src/lib/core/phone.ts';
import { resolveOrigin, route, type Origin } from '../../src/lib/core/route.ts';
import { norm, titleCase } from '../../src/lib/core/text.ts';

const sampleFile = JSON.parse(readFileSync('data/tb-dots-facilities-SAMPLE.json', 'utf8'));
const sample = buildDataset({
  meta: { title: sampleFile.title, source: sampleFile.source, count: sampleFile.count, sample: true, synthetic: false },
  aliases: {},
  facilities: sampleFile.facilities,
});
const ALL = ['xray', 'test', 'meds'] as const;
const MY_LOCATION = ['My location', 'Ang aking lokasyon'];

function row(overrides: Partial<FacilityRow>): FacilityRow {
  return {
    id: 'SYN-1',
    name: 'SYNTHETIC TEST CLINIC',
    sector: 'Government',
    city_municipality: 'Testville',
    province_or_city_group: 'Test Province',
    region_code: 'R1',
    svc_chest_xray: 'unknown',
    svc_tb_test: 'yes',
    svc_free_tb_medicines: 'yes',
    lat: 15,
    lng: 121,
    geo_precision: 'address',
    ...overrides,
  };
}

describe('text', () => {
  it('normalises for matching', () => {
    expect(norm('  Parañaque  City! ')).toBe('paranaque city');
    expect(norm(null)).toBe('');
  });

  it("title-cases the list's capitals, keeping acronyms, initials and small words", () => {
    expect(titleCase('BANGUED RURAL HEALTH UNIT')).toBe('Bangued Rural Health Unit');
    expect(titleCase('REGION I MEDICAL CENTER TB DOTS CENTER')).toBe('Region I Medical Center TB DOTS Center');
    expect(titleCase('SAINT LOUIS UNIVERSITY - SACRED HEART MEDICAL CENTER - PPMD UNIT')).toBe(
      'Saint Louis University - Sacred Heart Medical Center - PPMD Unit',
    );
    expect(titleCase('A.G. TUPAZ BARANGAY 10')).toBe('A.G. Tupaz Barangay 10');
    expect(titleCase('THE UNIVERSITY OF THE PHILIPPINES (UP) 2ND FLOOR')).toBe('The University of the Philippines (UP) 2nd Floor');
    expect(titleCase('KM. 5, PICO')).toBe('Km. 5, Pico');
  });
});

describe('phone', () => {
  it('takes the first of several numbers', () => {
    expect(firstPhone('8123-4567 / 8765-4321')).toBe('8123-4567');
    expect(firstPhone('0912 000 0000; 0913 000 0000')).toBe('0912 000 0000');
    expect(firstPhone('8000-0001 to 05')).toBe('8000-0001');
  });

  it('builds +63 tel: links, with the 2 area code for NCR landlines', () => {
    expect(telHref('(074) 000-0000', 'CAR')).toBe('tel:+63740000000');
    expect(telHref('0917 000 0000', 'R1')).toBe('tel:+639170000000');
    expect(telHref('+63 2 8000 0000', 'NCR')).toBe('tel:+63280000000');
    expect(telHref('8000-0000 loc. 123', 'NCR')).toBe('tel:+63280000000');
    expect(telHref('8000-0000', 'R1')).toBe('tel:80000000');
    expect(telHref('', 'NCR')).toBe('');
    expect(telHref('n/a', 'NCR')).toBe('');
  });
});

describe('facility', () => {
  it('counts a service only when the list confirms it', () => {
    expect(serviceStatus('yes', 'xray')).toBe('yes');
    expect(serviceStatus('onsite_or_referral', 'test')).toBe('referral');
    expect(serviceStatus('onsite_or_referral', 'xray')).toBe('unknown');
    expect(serviceStatus('no', 'meds')).toBe('no');
    expect(serviceStatus(undefined, 'meds')).toBe('unknown');
  });

  it('prepares a row for display and matching', () => {
    const p = prepare(row({ name: 'TESTVILLE CITY HEALTH OFFICE', street: '1 TEST STREET', phone: '0917 000 0000 / 0918 000 0000' }));
    expect(p).toMatchObject({
      name: 'Testville City Health Office',
      raw: 'TESTVILLE CITY HEALTH OFFICE',
      address: '1 Test Street, Testville, Test Province',
      first: '0917 000 0000',
      tel: 'tel:+639170000000',
      gov: true,
      precise: true,
      svc: { xray: 'unknown', test: 'yes', meds: 'yes' },
    });
    expect(offers(p, 'test')).toBe(true);
    expect(offers(p, 'xray')).toBe(false);
  });

  it('treats a city-level pin as approximate and a missing pin as no coordinates', () => {
    expect(prepare(row({ geo_precision: 'approx_city_design_only' })).precise).toBe(false);
    expect(prepare(row({ lat: null, lng: null })).lat).toBeNull();
    expect(prepare(row({ city_municipality: 'Baguio City', province_or_city_group: 'Baguio City' })).place).toBe('Baguio City');
  });
});

describe('geo', () => {
  it('measures great-circle distance', () => {
    expect(km({ lat: 14.6, lng: 121 }, { lat: 14.6, lng: 121 })).toBe(0);
    expect(km({ lat: 14.6, lng: 121 }, { lat: 15.6, lng: 121 })).toBeCloseTo(111.19, 1);
  });

  it('builds one entry per city and per province, labelled for the field and the URL', () => {
    const labels = sample.gaz.map((g) => g.label);
    expect(labels).toContain('Bangued, Abra');
    expect(labels).toContain('Abra');
    expect(labels).toContain('Quezon City');
    expect(new Set(labels).size).toBe(labels.length);
    expect(sample.gaz.find((g) => g.label === 'Abra')?.kind).toBe('prov');
    expect(withKeys({ name: 'Baguio City', prov: 'Baguio City', kind: 'city', lat: 16.4, lng: 120.6 }).key2).toBe('baguio');
  });

  it('matches typed places: exact, prefix, contains; cities win ties', () => {
    expect(matchPlace('Quezon City', sample.gaz)?.label).toBe('Quezon City');
    expect(matchPlace('quezon', sample.gaz)?.label).toBe('Quezon City');
    expect(matchPlace('Baguio', sample.gaz)?.label).toBe('Baguio City');
    expect(matchPlace('Bangued, Abra', sample.gaz)?.label).toBe('Bangued, Abra');
    expect(matchPlace('Manila', sample.gaz)?.label).toBe('City of Manila');
  });

  it('matches nothing for one letter', () => {
    expect(matchPlace('a', sample.gaz)).toBeNull();
  });

  it('finds a place by a listed abbreviation, ignoring case and a trailing "City" (owner, 4 Nov 2026)', () => {
    const gaz = buildGazetteer(sample.list, { QC: 'Quezon City', SJDM: 'San Jose del Monte', CDO: 'Cagayan de Oro' });
    expect(matchPlace('QC', gaz)?.label).toBe('Quezon City');
    expect(matchPlace('qc', gaz)?.label).toBe('Quezon City');
    expect(matchPlace('SJDM', gaz)?.name).toMatch(/^San Jose del Monte/i);
    // CDO isn't in the sample, so it attaches to nothing.
    expect(gaz.flatMap((g) => g.aka).sort()).toEqual(['qc', 'sjdm']);
    expect(matchPlace('QC', buildGazetteer(sample.list))).toBeNull();
  });

  it("places a city at the mean of its clinics' pins, and a province at the mean of its cities", () => {
    const list = [
      prepare(row({ id: 'A', city_municipality: 'Testville', lat: 15.0, lng: 121.0 })),
      prepare(row({ id: 'B', city_municipality: 'Testville', lat: 15.2, lng: 121.4 })),
      prepare(row({ id: 'C', city_municipality: 'Othertown', lat: 16.0, lng: 122.0 })),
    ];
    const gaz = buildGazetteer(list);
    const city = gaz.find((g) => g.name === 'Testville')!;
    expect(city.lat).toBeCloseTo(15.1, 10);
    expect(city.lng).toBeCloseTo(121.2, 10);
    const province = gaz.find((g) => g.kind === 'prov')!;
    expect(province.lat).toBeCloseTo((15.1 + 16.0) / 2, 10);
  });

  it('labels distances: exact only for a precise place and the visitor\'s own location', () => {
    expect(distanceLabel(2.44, true)).toEqual({ km: '2.4 km', approx: false });
    expect(distanceLabel(12.6, true)).toEqual({ km: '13 km', approx: false });
    expect(distanceLabel(0, false)).toEqual({ km: '1 km', approx: true });
    expect(distanceLabel(12.6, false)).toEqual({ km: '13 km', approx: true });
    expect(distanceLabel(null, true)).toBeNull();
  });
});

describe('resolveOrigin', () => {
  const fix = { lat: 14.6, lng: 121 };

  it('uses the location fix only while the field says "My location", in either language', () => {
    expect(resolveOrigin({ text: 'My location', gps: fix, myLocation: MY_LOCATION }, sample.gaz)).toEqual({ ...fix, gps: true });
    expect(resolveOrigin({ text: 'Ang aking lokasyon', gps: fix, myLocation: MY_LOCATION }, sample.gaz)).toEqual({ ...fix, gps: true });
  });

  it('does not route from an old fix once the field is emptied (Q4)', () => {
    expect(resolveOrigin({ text: '  ', gps: fix, myLocation: MY_LOCATION }, sample.gaz)).toBeNull();
    expect(resolveOrigin({ text: 'My location', gps: null, myLocation: MY_LOCATION }, sample.gaz)).toBeNull();
  });

  it('matches typed text to a city or province, or keeps it as text', () => {
    expect(resolveOrigin({ text: 'quezon', gps: fix, myLocation: MY_LOCATION }, sample.gaz)).toMatchObject({ label: 'Quezon City', prov: 'Quezon City' });
    expect(resolveOrigin({ text: 'Somewhere Else', gps: null, myLocation: MY_LOCATION }, sample.gaz)).toEqual({ text: 'Somewhere Else', label: 'Somewhere Else' });
  });
});

describe('route', () => {
  it('plans three stops from a typed city (the sample has no confirmed X-ray site)', () => {
    const origin = resolveOrigin({ text: 'Quezon City', gps: null, myLocation: MY_LOCATION }, sample.gaz)!;
    const r = route(sample.list, origin, ALL);
    expect(r.empty).toBe(false);
    expect(r.stops.map((s) => s.mode)).toEqual(['noXray', 'ok', 'ok']);
    for (const stop of r.stops) expect(stop.items).toHaveLength(3);
    expect(r.stops[0].items.map((x) => x.p.city)).toEqual(['Quezon City', 'Quezon City', 'Quezon City']);
    // The sample pins every clinic at its city's approximate centre, so the city's mean pin
    // is that same point and the nearest is 0 km ("about 1 km"). Real pins will differ.
    expect(r.nearest).toBeCloseTo(0, 6);
  });

  it('falls back to the province when nothing is within 10 km (the "far" demo point)', () => {
    const r = route(sample.list, { lat: 18.565, lng: 120.79, gps: true }, ALL);
    expect(r.prov).toBe('Ilocos Norte');
    expect(r.stops[1]).toMatchObject({ k: 'test', mode: 'far' });
    for (const x of r.stops[1].items) expect(x.p.prov).toBe('Ilocos Norte');
    expect(r.stops[1].items[0].d!).toBeGreaterThan(10);
  });

  it('matches nothing for a one-letter search (Q4; the prototype returned 82 rows)', () => {
    const r = route(sample.list, { text: 'a', label: 'a' }, ALL);
    expect(r.empty).toBe(true);
    expect(r.stops.every((s) => s.items.length === 0)).toBe(true);
  });

  it('matches two letters only at the start of a word (owner, 4 Nov 2026)', () => {
    const list = ['Malabon', 'Abucay', 'Tabuk'].map((city, i) => prepare(row({ id: `T${i}`, city_municipality: city, province_or_city_group: 'Test Province' })));
    const r = route(list, { text: 'ab', label: 'ab' }, ['meds']);
    expect(r.stops[0].items.map((x) => x.p.city)).toEqual(['Abucay']);
    // Three letters still match anywhere.
    expect(route(list, { text: 'abo', label: 'abo' }, ['meds']).stops[0].items.map((x) => x.p.city)).toEqual(['Malabon']);
  });

  it('ranks unmatched text by city, then province', () => {
    const list = [
      prepare(row({ id: 'A', name: 'SYNTHETIC CLINIC A', city_municipality: 'Other Town', province_or_city_group: 'Testshire' })),
      prepare(row({ id: 'B', name: 'SYNTHETIC CLINIC B', city_municipality: 'Testville', province_or_city_group: 'Elsewhere' })),
      prepare(row({ id: 'C', name: 'SYNTHETIC CLINIC C', city_municipality: 'Far Town', province_or_city_group: 'Far Province' })),
    ];
    const r = route(list, { text: 'testville testshire', label: 'x' }, ['meds']);
    expect(r.stops[0].items.map((x) => x.p.id)).toEqual(['B', 'A']);
  });

  it('shows the referral note only when no confirmed X-ray site exists at all (Q13)', () => {
    const here = { lat: 15, lng: 121, gps: true as const };
    const nearby = prepare(row({ id: 'NEAR', lat: 15.01, lng: 121 }));
    const xray50km = prepare(row({ id: 'XRAY', svc_chest_xray: 'yes', lat: 15.45, lng: 121 }));
    const withXray = route([nearby, xray50km], here, ['xray']);
    expect(withXray.stops[0].mode).toBe('far'); // the prototype said noXray here
    expect(withXray.stops[0].items.map((x) => x.p.id)).toEqual(['XRAY']);

    const without = route([nearby], here, ['xray']);
    expect(without.stops[0]).toMatchObject({ mode: 'noXray', total: 0 });
    expect(without.stops[0].items.map((x) => x.p.id)).toEqual(['NEAR']);
  });

  it('keeps places offering the service within 10 km in distance order, three at most', () => {
    const here = { lat: 15, lng: 121, gps: true as const };
    const list = [0.05, 0.01, 0.03, 0.02].map((dLat, i) => prepare(row({ id: `P${i}`, lat: 15 + dLat, lng: 121 })));
    const r = route(list, here, ['test']);
    expect(r.stops[0].mode).toBe('ok');
    expect(r.stops[0].items.map((x) => x.p.id)).toEqual(['P1', 'P3', 'P2']);
    expect(r.stops[0].total).toBe(4);
  });
});

describe('links', () => {
  it('sends directions to coordinates only for a precise place', () => {
    const precise = prepare(row({ lat: 15.1, lng: 121.2 }));
    expect(directionsUrl(precise, 'transit')).toBe('https://www.google.com/maps/dir/?api=1&destination=15.1%2C121.2&travelmode=transit');
    const approx = prepare(row({ geo_precision: 'city', street: '1 TEST STREET' }));
    expect(directionsUrl(approx, 'walking')).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('SYNTHETIC TEST CLINIC, 1 TEST STREET, Testville, Test Province, Philippines')}&travelmode=walking`,
    );
  });

  it('puts only a matched place or a gps flag in the Home URL, never typed text or coordinates (Q4)', () => {
    const matched = resolveOrigin({ text: 'quezon', gps: null, myLocation: MY_LOCATION }, sample.gaz)!;
    expect(homeQuery('all', matched)).toEqual({ need: 'all', near: 'Quezon City', loc: undefined });
    expect(homeQuery('meds', { text: '12 Home Street', label: '12 Home Street' })).toEqual({ need: 'meds', near: undefined, loc: undefined });
    const gps: Origin = { lat: 14.6, lng: 121, gps: true };
    expect(homeQuery('test', gps)).toEqual({ need: 'test', near: undefined, loc: 'gps' });
  });

  it('reads Home URLs, ignoring unknown needs and unmatched places', () => {
    expect(readHomeParams('?need=xray&near=Bangued%2C+Abra', sample.gaz)).toMatchObject({ need: 'xray', near: { label: 'Bangued, Abra' }, locGps: false });
    expect(readHomeParams('?need=bogus&near=zzzz&loc=gps', sample.gaz)).toEqual({ need: 'all', near: null, locGps: true });
  });
});

describe('loadFacilities', () => {
  const file: FacilitiesFile = { meta: { title: 't', source: 's', count: 1, sample: false, synthetic: true }, aliases: {}, facilities: [row({})] };
  const ok = () => Promise.resolve(new Response(JSON.stringify(file), { status: 200 }));
  const down = () => Promise.resolve(new Response('', { status: 503 }));

  it('fails without falling back to the sample, then refetches on "Try again" (Q6)', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementationOnce(down).mockImplementationOnce(ok);
    await expect(loadFacilities(fetcher)).rejects.toThrow('HTTP 503');
    expect(fetcher).toHaveBeenCalledWith('/data/facilities.json');
    const data = await loadFacilities(fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([url]) => url === '/data/facilities.json')).toBe(true);
    expect(data.list[0].name).toBe('Synthetic Test Clinic');
    expect(data.synthetic).toBe(true);
    // Cached after success.
    await loadFacilities(fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('builds the gazetteer and index from the list', () => {
    const data = buildDataset(file);
    expect(data.byId.get('SYN-1')?.city).toBe('Testville');
    expect(data.gaz.map((g) => g.label)).toEqual(buildGazetteer(data.list).map((g) => g.label));
  });
});

describe('filterPlaces (Places)', () => {
  const list = [
    prepare(row({ id: 'G1', name: 'SYNTHETIC GOV CLINIC', sector: 'Government', region_code: 'R1', region: 'Region I', province_or_city_group: 'Alpha', lat: 15.02, lng: 121 })),
    prepare(row({ id: 'P1', name: 'SYNTHETIC PRIVATE CLINIC', sector: 'Private', region_code: 'R2', region: 'Region II', province_or_city_group: 'Beta', lat: 15.01, lng: 121, svc_tb_test: 'no' })),
    prepare(row({ id: 'N1', name: 'SYNTHETIC UNPINNED CLINIC', sector: 'Government', region_code: 'R1', region: 'Region I', province_or_city_group: 'Alpha', lat: null, lng: null })),
  ];

  it('combines region, province, type, service and every search word', async () => {
    const { filterPlaces, NO_FILTERS } = await import('../../src/lib/core/places.ts');
    const ids = (f: Partial<typeof NO_FILTERS>) => filterPlaces(list, { ...NO_FILTERS, ...f }, null, true).rows.map((r) => r.p.id);
    expect(ids({})).toEqual(['G1', 'P1', 'N1']);
    expect(ids({ region: 'R1' })).toEqual(['G1', 'N1']);
    expect(ids({ prov: 'Beta' })).toEqual(['P1']);
    expect(ids({ sector: 'priv' })).toEqual(['P1']);
    expect(ids({ svc: 'test' })).toEqual(['G1', 'N1']);
    expect(ids({ q: 'synthetic gov' })).toEqual(['G1']);
    expect(ids({ q: 'synthetic nowhere' })).toEqual([]);
    // Two letters match only the start of a word: "ri" starts no word ("private" has it inside).
    expect(ids({ q: 'ri' })).toEqual([]);
    expect(ids({ q: 'pr' })).toEqual(['P1']);
  });

  it('sorts by distance with unpinned places last, only while the switch is on', async () => {
    const { filterPlaces, NO_FILTERS } = await import('../../src/lib/core/places.ts');
    const here = { lat: 15, lng: 121 };
    expect(filterPlaces(list, NO_FILTERS, here, true).rows.map((r) => r.p.id)).toEqual(['P1', 'G1', 'N1']);
    expect(filterPlaces(list, NO_FILTERS, here, false).rows.map((r) => r.p.id)).toEqual(['G1', 'P1', 'N1']);
  });

  it('lists the other matches with a note when no X-ray site is confirmed', async () => {
    const { filterPlaces, NO_FILTERS } = await import('../../src/lib/core/places.ts');
    const result = filterPlaces(list, { ...NO_FILTERS, svc: 'xray' }, null, true);
    expect(result.noXray).toBe(true);
    expect(result.rows).toHaveLength(3);
  });

  it('offers regions by name and provinces within a region, and counts filters as the button does', async () => {
    const { activeFilters, NO_FILTERS, provinceOptions, regionOptions } = await import('../../src/lib/core/places.ts');
    expect(regionOptions(list)).toEqual([
      { code: 'R1', name: 'Region I' },
      { code: 'R2', name: 'Region II' },
    ]);
    expect(provinceOptions(list, 'R2')).toEqual(['Beta']);
    expect(activeFilters({ ...NO_FILTERS, q: ' x ', region: 'R1', svc: 'test' })).toBe(2);
  });
});
