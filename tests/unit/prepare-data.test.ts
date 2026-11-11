import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assignPlaceIds,
  compareIds,
  placeKey,
  regionCounts,
  slim,
  syntheticFacilities,
  worstCaseFacilities,
  worstFullFacilities,
  validateAliases,
  validateClaims,
  validateFacilities,
} from '../../scripts/prepare-data.mjs';

const sample = JSON.parse(readFileSync('data/tb-dots-facilities-SAMPLE.json', 'utf8'));
const claims = JSON.parse(readFileSync('data/claims.json', 'utf8'));
const row = sample.facilities[0];

describe('validateFacilities', () => {
  it('accepts the 93-row sample with no errors', () => {
    expect(validateFacilities(sample.facilities).errors).toEqual([]);
  });

  it('rejects duplicate ids, missing names, unknown services and coordinates outside the Philippines', () => {
    const { errors } = validateFacilities([
      row,
      { ...row },
      { ...row, id: 'X-2', name: '' },
      { ...row, id: 'X-3', svc_chest_xray: 'maybe' },
      { ...row, id: 'X-4', lat: 35.68, lng: 139.69 },
      { ...row, id: 'X-5', lat: 14.6, lng: null },
    ]);
    expect(errors).toEqual([
      expect.stringContaining('duplicate id'),
      expect.stringContaining('missing name'),
      expect.stringContaining('svc_chest_xray'),
      expect.stringContaining('outside the Philippines'),
      expect.stringContaining('only one of lat/lng'),
    ]);
  });

  it('warns, without failing, on a region the pipeline could not map', () => {
    const { errors, warnings } = validateFacilities([{ ...row, region_code: '' }]);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([expect.stringContaining('region_code')]);
  });
});

describe('slim', () => {
  it('drops the fields the site never uses (default D23)', () => {
    const out = slim(row);
    for (const key of ['email', 'maps_url', 'source_row', 'region_as_listed', 'source']) expect(out).not.toHaveProperty(key);
    expect(out).toMatchObject({ id: row.id, name: row.name, lat: row.lat, svc_tb_test: row.svc_tb_test });
  });
});

describe('regionCounts', () => {
  it('counts every row once, split by sector', () => {
    const counts = regionCounts(sample.facilities);
    expect(counts.reduce((n: number, r: { total: number }) => n + r.total, 0)).toBe(sample.facilities.length);
    for (const r of counts) expect(r.government + r.private).toBe(r.total);
    expect(counts[0].code).toBe('NCR');
  });
});

describe('syntheticFacilities', () => {
  const rows = syntheticFacilities(sample.facilities);

  it('makes 2,100 valid rows with unique ids, the same on every run', () => {
    expect(rows).toHaveLength(2100);
    expect(validateFacilities(rows).errors).toEqual([]);
    expect(syntheticFacilities(sample.facilities)).toEqual(rows);
  });

  it('uses only obviously fake names, streets and phone numbers', () => {
    for (const r of rows) {
      expect(r.name).toMatch(/^SYNTHETIC TEST CLINIC \d{5}$/);
      expect(r.street).toMatch(/^\d+ TEST STREET$/);
      expect(r.phone).toBe('0000000000');
      expect(r).not.toHaveProperty('email');
    }
  });

  it('groups rows by region, as the PhilHealth list does (audit B7)', () => {
    const codes = rows.map((r) => r.region_code);
    const runs = codes.filter((code, i) => i === 0 || code !== codes[i - 1]);
    // One run per region, and more than one region.
    expect(runs).toHaveLength(new Set(codes).size);
    expect(runs.length).toBeGreaterThan(1);
  });
});

describe('validateClaims', () => {
  it('finds every claim source in the registry', () => {
    expect(validateClaims(claims)).toEqual([]);
  });

  it('reports a claim whose source is missing', () => {
    expect(validateClaims({ sources: {}, claims: [{ id: 'c1', sources: ['S99'] }] })).toEqual([expect.stringContaining('S99')]);
  });
});

describe('place ids (Q6)', () => {
  const clinic = (name: string, city: string, prov: string, extra = {}) => ({ ...row, name, city_municipality: city, province_or_city_group: prov, ...extra });

  it('reads as name, city and province, skipping a part the name already says', () => {
    expect(placeKey(clinic('LAOAG CITY HEALTH OFFICE', 'Laoag City', 'Ilocos Norte'))).toBe('laoag-city-health-office-ilocos-norte');
    expect(placeKey(clinic('BAGUIO GENERAL HOSPITAL', 'Baguio City', 'Baguio City'))).toBe('baguio-general-hospital-baguio-city');
    expect(placeKey(clinic('Sto. Niño Health Center', 'Parañaque', 'NCR'))).toBe('sto-nino-health-center-paranaque-ncr');
  });

  it('gives every sample row a unique id', () => {
    const ids = assignPlaceIds(sample.facilities);
    expect(new Set(ids).size).toBe(sample.facilities.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('suffixes collisions in street order, so adding a row elsewhere moves no id', () => {
    const a = clinic('SYNTHETIC RHU', 'Testville', 'Test Province', { id: 'X-1', street: 'B STREET' });
    const b = clinic('SYNTHETIC RHU', 'Testville', 'Test Province', { id: 'X-2', street: 'A STREET' });
    const other = clinic('SYNTHETIC CLINIC', 'Testville', 'Test Province', { id: 'X-3' });
    expect(assignPlaceIds([a, b])).toEqual(['synthetic-rhu-testville-test-province-2', 'synthetic-rhu-testville-test-province']);
    expect(assignPlaceIds([other, b, a]).slice(1)).toEqual(['synthetic-rhu-testville-test-province', 'synthetic-rhu-testville-test-province-2']);
  });

  it('reports ids added and removed, and spots a rename at the same address', () => {
    const at = (name: string, street: string) => ({ name, street, city: 'Testville', prov: 'Test Province' });
    const accepted = { 'old-name-testville': at('OLD NAME', '1 TEST STREET'), 'kept-testville': at('KEPT', '2 TEST STREET') };
    const current = { 'new-name-testville': at('NEW NAME', '1 TEST STREET'), 'kept-testville': at('KEPT', '2 TEST STREET') };
    expect(compareIds(accepted, current)).toEqual({
      added: ['new-name-testville'],
      removed: ['old-name-testville'],
      renamed: [{ from: 'old-name-testville', to: 'new-name-testville' }],
    });
  });

  it('rejects aliases that point nowhere or shadow a current id', () => {
    const ids = new Set(['a', 'b']);
    expect(validateAliases({ old: 'a' }, ids)).toEqual([]);
    expect(validateAliases({ old: 'gone' }, ids)).toEqual([expect.stringContaining('no place has that id')]);
    expect(validateAliases({ b: 'a' }, ids)).toEqual([expect.stringContaining('is a current place id')]);
  });
});

describe('worstCaseFacilities (audit L2)', () => {
  const rows = worstCaseFacilities(sample.facilities);

  it('adds five valid, obviously fake rows with the hard cases', () => {
    expect(rows).toHaveLength(5);
    expect(validateFacilities([...sample.facilities, ...rows]).errors).toEqual([]);
    for (const r of rows) expect(r.name).toMatch(/^SYNTHETIC TEST /);
    expect(rows[0].name).toMatch(/Ñ.*'/);
    expect(rows.map((r) => r.phone)).toEqual(['5000-0000 loc. 1234; 5000-0001 loc. 5678', '500-0000', '5100-0000', '', '0000000000']);
    expect(rows[4].lat).toBeNull();
  });
});

describe('worstFullFacilities (step 15.4)', () => {
  // The full list: the worst cases it really holds.
  const real = JSON.parse(readFileSync('data/tb-dots-facilities.json', 'utf8')).facilities;
  const at = { lat: 14.65132, lng: 121.06498 };
  const rows = worstFullFacilities(real, at);
  const moved = rows.filter((r: { geo_precision?: string }) => r.geo_precision === 'synthetic');

  it('keeps every row once, with the worst rows first', () => {
    expect(rows).toHaveLength(real.length);
    expect(new Set(rows.map((r: { id: string }) => r.id)).size).toBe(real.length);
    expect(moved.length).toBeGreaterThanOrEqual(5);
    expect(rows.slice(0, moved.length)).toEqual(moved);
    expect(validateFacilities(rows).errors).toEqual([]);
  });

  it("picks the brief's two examples and the longest name, address and phone list, each once", () => {
    const names = moved.map((r: { name: string }) => r.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names[0].length).toBe(Math.max(...real.map((r: { name: string }) => r.name.length)));
    expect(names).toContain('MANILA CENTRAL UNIVERSITY- DR. FILEMON D. TANCHOCO SR. MEDICAL FOUNDATION, INC.');
    expect(moved.map((r: { phone?: string }) => r.phone)).toContain('0939-2859794, 2754585 / 0977-815-2444');
    expect(moved.some((r: { phone?: string }) => !String(r.phone ?? '').trim())).toBe(true);
  });

  it('changes only where the worst rows are: just north of the point given, marked synthetic', () => {
    for (const r of moved) {
      const original = real.find((x: { id: string }) => x.id === r.id);
      expect({ ...r, lat: original.lat, lng: original.lng, geo_precision: original.geo_precision }).toEqual(original);
      expect(r.lat - at.lat).toBeGreaterThan(0);
      expect(r.lat - at.lat).toBeLessThan(0.001);
      expect(r.lng).toBe(at.lng);
    }
  });
});
