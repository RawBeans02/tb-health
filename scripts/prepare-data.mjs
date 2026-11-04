#!/usr/bin/env node
// Validates the source data and writes what the build and the site read (PLAN §4.4).
// No network. Runs before every build.
//
//   node scripts/prepare-data.mjs              real facility file if present, else the 93-row sample
//   node scripts/prepare-data.mjs --synthetic  ~2,100 obviously fake rows, for measuring scale only
//   node scripts/prepare-data.mjs --worst-case the sample plus five fake worst-case rows (L2)
//
//   node scripts/prepare-data.mjs --accept-ids  also records this list's place ids in
//                                               data/place-ids.json (after reviewing the report)
//
// Writes (git-ignored):
//   public/data/facilities.json       slimmed facility list with stable place ids, fetched at runtime
//   public/data/gazetteer.json        cities and provinces (also inside facilities.json), for the Place page
//
// data/place-abbreviations.json lists widely used short names ("QC") that find a place.
//   src/generated/region-counts.json  facilities per region, for the Data page (d14)
//
// Place ids (Q6) come from the normalised name + city + province. data/place-ids.json is
// the last accepted list of ids: each run reports ids added and removed since then, and
// suggests renames. data/place-aliases.json maps old ids to current ones so old links work.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { prepare } from '../src/lib/core/facility.ts';
import { buildGazetteer } from '../src/lib/core/geo.ts';
import { norm } from '../src/lib/core/text.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const out = {
  facilities: join(root, 'public/data/facilities.json'),
  gazetteer: join(root, 'public/data/gazetteer.json'),
  regionCounts: join(root, 'src/generated/region-counts.json'),
};
const idRegistryPath = join(dataDir, 'place-ids.json');
const aliasesPath = join(dataDir, 'place-aliases.json');
const abbreviationsPath = join(dataDir, 'place-abbreviations.json');

const SYNTHETIC_ROWS = 2100;

// Fields left out of the published list (default D23: least data).
const DROPPED_FIELDS = ['email', 'maps_url', 'source_row', 'region_as_listed', 'source'];

const REQUIRED_TEXT = ['id', 'name', 'city_municipality', 'province_or_city_group', 'region'];
const SERVICE_VALUES = {
  svc_chest_xray: ['yes', 'no', 'unknown'],
  svc_tb_test: ['yes', 'no', 'unknown', 'onsite_or_referral'],
  svc_free_tb_medicines: ['yes', 'no', 'unknown'],
};
const REGION_CODES = ['NCR', 'CAR', 'R1', 'R2', 'R3', 'R4A', 'R4B', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'NIR', 'BARMM'];
const SECTORS = ['Government', 'Private'];
const KINDS = ['health_center', 'hospital', 'clinic'];
const GEO_PRECISION = ['', 'address', 'name', 'city', 'confirmed', 'approx_city_design_only', 'synthetic'];
// Generous box around the Philippines; anything outside is a geocoding error.
const PH_BOUNDS = { minLat: 4.2, maxLat: 21.5, minLng: 116.0, maxLng: 127.0 };

/**
 * A readable place id from the normalised name + city + province (Q6). A part the earlier
 * ones already spell out is skipped: "Laoag City Health Office" + "Laoag City" +
 * "Ilocos Norte" → laoag-city-health-office-ilocos-norte.
 */
export function placeKey(row) {
  let text = '';
  for (const part of [row.name, row.city_municipality, row.province_or_city_group]) {
    const n = norm(part);
    if (n && !` ${text} `.includes(` ${n} `)) text = text ? `${text} ${n}` : n;
  }
  return text.replace(/ /g, '-');
}

/**
 * Ids for every row, in row order. Rows sharing a key get -2, -3… in a fixed order
 * (street, then the source's row id), so a row added elsewhere can't shift them.
 */
export function assignPlaceIds(rows) {
  const groups = new Map();
  rows.forEach((row, i) => {
    const key = placeKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  const ids = new Array(rows.length);
  const order = (a, b) => norm(rows[a].street).localeCompare(norm(rows[b].street)) || String(rows[a].id).localeCompare(String(rows[b].id));
  for (const [key, members] of groups) {
    members.sort(order).forEach((i, n) => {
      ids[i] = n === 0 ? key : `${key}-${n + 1}`;
    });
  }
  return ids;
}

/** What changed since the accepted ids, with likely renames (same street, city and province). */
export function compareIds(accepted, current) {
  const added = Object.keys(current).filter((id) => !(id in accepted));
  const removed = Object.keys(accepted).filter((id) => !(id in current));
  const where = (p) => norm([p.street, p.city, p.prov].join(' '));
  const renamed = removed.flatMap((from) => {
    const to = added.find((id) => where(current[id]) === where(accepted[from]));
    return to ? [{ from, to }] : [];
  });
  return { added, removed, renamed };
}

export function validateAliases(aliases, ids) {
  const errors = [];
  for (const [from, to] of Object.entries(aliases)) {
    if (ids.has(from)) errors.push(`alias ${from}: is a current place id, so it can't also be an alias`);
    if (!ids.has(to)) errors.push(`alias ${from} → ${to}: no place has that id`);
  }
  return errors;
}

export function validateFacilities(rows) {
  const errors = [];
  const warnings = [];
  const seen = new Set();
  rows.forEach((row, i) => {
    const at = `facility ${i} (${row?.id ?? 'no id'})`;
    if (!row || typeof row !== 'object') {
      errors.push(`${at}: not an object`);
      return;
    }
    for (const key of REQUIRED_TEXT) {
      if (typeof row[key] !== 'string' || !row[key].trim()) errors.push(`${at}: missing ${key}`);
    }
    if (seen.has(row.id)) errors.push(`${at}: duplicate id`);
    seen.add(row.id);
    for (const [key, allowed] of Object.entries(SERVICE_VALUES)) {
      if (!allowed.includes(row[key])) errors.push(`${at}: ${key} is ${JSON.stringify(row[key])}`);
    }
    const hasLat = row.lat !== null && row.lat !== undefined;
    const hasLng = row.lng !== null && row.lng !== undefined;
    if (hasLat !== hasLng) errors.push(`${at}: only one of lat/lng`);
    if (hasLat && hasLng) {
      const { lat, lng } = row;
      if (typeof lat !== 'number' || typeof lng !== 'number' || lat < PH_BOUNDS.minLat || lat > PH_BOUNDS.maxLat || lng < PH_BOUNDS.minLng || lng > PH_BOUNDS.maxLng) {
        errors.push(`${at}: coordinates outside the Philippines (${lat}, ${lng})`);
      }
    }
    if (!GEO_PRECISION.includes(row.geo_precision ?? '')) warnings.push(`${at}: unknown geo_precision ${JSON.stringify(row.geo_precision)}`);
    if (!REGION_CODES.includes(row.region_code)) warnings.push(`${at}: unknown region_code ${JSON.stringify(row.region_code)}`);
    if (!SECTORS.includes(row.sector)) warnings.push(`${at}: unknown sector ${JSON.stringify(row.sector)}`);
    if (!KINDS.includes(row.facility_kind)) warnings.push(`${at}: unknown facility_kind ${JSON.stringify(row.facility_kind)}`);
    if (row.accreditation_expiry && !/^\d{4}-\d{2}-\d{2}$/.test(row.accreditation_expiry)) {
      errors.push(`${at}: accreditation_expiry is ${JSON.stringify(row.accreditation_expiry)}`);
    }
  });
  return { errors, warnings };
}

export function slim(row) {
  const copy = { ...row };
  for (const key of DROPPED_FIELDS) delete copy[key];
  return copy;
}

export function regionCounts(rows) {
  const byCode = new Map();
  for (const row of rows) {
    const entry = byCode.get(row.region_code) ?? { code: row.region_code, region: row.region, total: 0, government: 0, private: 0 };
    entry.total += 1;
    if (row.sector === 'Government') entry.government += 1;
    else if (row.sector === 'Private') entry.private += 1;
    byCode.set(row.region_code, entry);
  }
  const order = (code) => {
    const i = REGION_CODES.indexOf(code);
    return i < 0 ? REGION_CODES.length : i;
  };
  return [...byCode.values()].sort((a, b) => order(a.code) - order(b.code));
}

export function validateClaims(claims) {
  const errors = [];
  const ids = new Set();
  for (const claim of claims.claims ?? []) {
    if (ids.has(claim.id)) errors.push(`claim ${claim.id}: duplicate id`);
    ids.add(claim.id);
    if (!claim.sources?.length) errors.push(`claim ${claim.id}: no sources`);
    for (const source of claim.sources ?? []) {
      if (!claims.sources?.[source]) errors.push(`claim ${claim.id}: source ${source} isn't in the sources list`);
    }
  }
  return errors;
}

// Deterministic, obviously fake rows placed around the sample's city centres, grouped by
// region as the PhilHealth list is (so a cut at the first N rows would drop whole regions).
// Never shipped: launch-check flags a synthetic build, and nothing here resembles a real
// facility or person.
export function syntheticFacilities(sampleRows, count = SYNTHETIC_ROWS) {
  let seed = 20261104;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const located = sampleRows.filter((row) => typeof row.lat === 'number');
  const rows = Array.from({ length: count }, (_, i) => {
    const base = located[i % located.length];
    const n = String(i + 1).padStart(5, '0');
    return {
      id: `SYN-${n}`,
      name: `SYNTHETIC TEST CLINIC ${n}`,
      sector: base.sector,
      phone: '0000000000',
      street: `${i + 1} TEST STREET`,
      city_municipality: base.city_municipality,
      province_or_city_group: base.province_or_city_group,
      region_code: base.region_code,
      region: base.region,
      accreditation_expiry: base.accreditation_expiry,
      facility_kind: base.facility_kind,
      svc_free_tb_medicines: base.svc_free_tb_medicines,
      svc_tb_test: base.svc_tb_test,
      svc_chest_xray: base.svc_chest_xray,
      hours: '',
      lat: Math.round((base.lat + (random() - 0.5) * 0.1) * 1e5) / 1e5,
      lng: Math.round((base.lng + (random() - 0.5) * 0.1) * 1e5) / 1e5,
      geo_precision: 'synthetic',
      source_updated: base.source_updated,
    };
  });
  return rows.sort((a, b) => a.region_code.localeCompare(b.region_code, 'en', { numeric: true }));
}

// The worst cases the pages must hold (audit L2), as obviously fake rows added to the sample:
// a very long hyphenated name with ñ and an apostrophe; phones with 'loc' and ';', a 7-digit
// landline, an NCR 5xxx number and none at all; long hours; no coordinates. Never shipped.
export function worstCaseFacilities(sampleRows) {
  const ncr = sampleRows.find((row) => row.region_code === 'NCR') ?? sampleRows[0];
  const other = sampleRows.find((row) => row.region_code !== 'NCR') ?? sampleRows[0];
  const base = (row, n, patch) => ({
    id: `SYN-WORST-${n}`,
    name: `SYNTHETIC TEST CLINIC ${n}`,
    sector: row.sector,
    phone: '0000000000',
    street: `${n} TEST STREET`,
    city_municipality: row.city_municipality,
    province_or_city_group: row.province_or_city_group,
    region_code: row.region_code,
    region: row.region,
    accreditation_expiry: row.accreditation_expiry,
    facility_kind: row.facility_kind,
    svc_free_tb_medicines: 'yes',
    svc_tb_test: 'onsite_or_referral',
    svc_chest_xray: 'yes',
    hours: '',
    lat: row.lat,
    lng: row.lng,
    geo_precision: 'synthetic',
    source_updated: row.source_updated,
    ...patch,
  });
  return [
    base(ncr, 1, {
      name: "SYNTHETIC TEST SANTO NIÑO-DE'LA-PAZ MULTI-SPECIALTY TB-DOTS AND COMMUNITY HEALTH-AND-WELLNESS EXTENSION CLINIC",
      street: '1234-B EXTRAORDINARILY-LONG-NAMED SYNTHETIC TEST STREET CORNER ANOTHER VERY LONG TEST AVENUE EXTENSION',
      phone: '5000-0000 loc. 1234; 5000-0001 loc. 5678',
      hours: 'Monday to Friday 7:00 AM to 5:00 PM; Saturday 8:00 AM to 12:00 NN; closed on Sundays and holidays except for synthetic test emergencies',
    }),
    base(other, 2, { phone: '000-0000' }),
    base(ncr, 3, { phone: '5100-0000' }),
    base(other, 4, { phone: '' }),
    base(other, 5, { lat: null, lng: null }),
  ];
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const text = JSON.stringify(value);
  writeFileSync(path, text);
  return Buffer.from(text);
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  const worst = process.argv.includes('--worst-case');
  const synthetic = process.argv.includes('--synthetic') || worst;
  const realPath = join(dataDir, 'tb-dots-facilities.json');
  const samplePath = join(dataDir, 'tb-dots-facilities-SAMPLE.json');
  const sample = !synthetic && !existsSync(realPath);
  const sourcePath = synthetic || sample ? samplePath : realPath;
  const source = readJson(sourcePath);
  const rows = worst ? [...source.facilities, ...worstCaseFacilities(source.facilities)] : synthetic ? syntheticFacilities(source.facilities) : source.facilities;

  const failures = [];
  if (!Array.isArray(rows) || rows.length === 0) failures.push('facility list is empty');
  const facilityCheck = validateFacilities(rows ?? []);
  failures.push(...facilityCheck.errors);
  failures.push(...validateClaims(readJson(join(dataDir, 'claims.json'))));
  if (!readJson(join(dataDir, 'tb-ph-data.json')).meta) failures.push('tb-ph-data.json has no meta');

  for (const warning of facilityCheck.warnings.slice(0, 20)) console.warn(`prepare-data: warning: ${warning}`);
  if (facilityCheck.warnings.length > 20) console.warn(`prepare-data: …and ${facilityCheck.warnings.length - 20} more warnings`);
  if (failures.length) fail(failures);

  const ids = assignPlaceIds(rows);
  const idSet = new Set(ids);
  if (idSet.size !== ids.length) failures.push('place ids are not unique (a suffixed id matches another place)');
  const aliases = existsSync(aliasesPath) ? readJson(aliasesPath) : {};
  failures.push(...validateAliases(aliases, idSet));
  if (failures.length) fail(failures);

  const withIds = rows.map((row, i) => ({ ...row, id: ids[i] }));
  if (!synthetic) reportIds(withIds, aliases);

  const round = (x) => Math.round(x * 1e5) / 1e5;
  const abbreviations = existsSync(abbreviationsPath) ? readJson(abbreviationsPath).abbreviations : {};
  const gazEntries = buildGazetteer(withIds.map(prepare), abbreviations);
  const gazetteer = gazEntries.map(({ name, prov, kind, lat, lng, aka }) => ({ name, prov, kind, lat: round(lat), lng: round(lng), ...(aka.length ? { aka } : {}) }));
  const found = gazEntries.flatMap((g) => g.aka);
  console.log(`prepare-data: abbreviations: ${found.length} of ${Object.keys(abbreviations).length} match a place in this list${found.length ? ` (${found.join(', ')})` : ''}`);

  const published = {
    meta: {
      title: source.title,
      source: source.source,
      count: rows.length,
      sample,
      synthetic,
    },
    aliases,
    gazetteer,
    facilities: withIds.map(slim),
  };
  const bytes = writeJson(out.facilities, published);
  writeJson(out.regionCounts, regionCounts(rows));
  const gazBytes = writeJson(out.gazetteer, gazetteer);

  const kind = synthetic ? 'SYNTHETIC' : sample ? 'SAMPLE' : 'real';
  console.log(
    `prepare-data: ${rows.length} facilities (${kind}, from ${relative(root, sourcePath)}) → ${relative(root, out.facilities)} ` +
      `${kb(bytes.length)}, gzip ${kb(gzipSync(bytes).length)}, brotli ${kb(brotliCompressSync(bytes).length)}; ` +
      `gazetteer ${gazetteer.length} places, gzip ${kb(gzipSync(gazBytes).length)}`,
  );
}

function fail(failures) {
  for (const failure of failures.slice(0, 50)) console.error(`prepare-data: ${failure}`);
  console.error(`prepare-data: ${failures.length} problem(s); fix the data in data/ before building.`);
  process.exit(1);
}

/** Q6: reports place ids added and removed since data/place-ids.json; --accept-ids records the new list. */
function reportIds(rows, aliases) {
  const current = Object.fromEntries(
    rows.map((r) => [r.id, { name: r.name, street: r.street ?? '', city: r.city_municipality, prov: r.province_or_city_group }]),
  );
  if (process.argv.includes('--accept-ids')) {
    writeFileSync(idRegistryPath, `${JSON.stringify({ note: 'Place ids last accepted with prepare-data --accept-ids (Q6).', places: current }, null, 1)}\n`);
    console.log(`prepare-data: recorded ${rows.length} place ids in ${relative(root, idRegistryPath)}.`);
    return;
  }
  if (!existsSync(idRegistryPath)) {
    console.warn(`prepare-data: no ${relative(root, idRegistryPath)} yet; run with --accept-ids to record these ids.`);
    return;
  }
  const { added, removed, renamed } = compareIds(readJson(idRegistryPath).places, current);
  if (!added.length && !removed.length) return;
  console.warn(`prepare-data: place ids changed since they were accepted: ${added.length} added, ${removed.length} removed.`);
  for (const { from, to } of renamed) console.warn(`prepare-data:   probably renamed: ${from} → ${to}`);
  const unaliased = removed.filter((id) => !(id in aliases) && !renamed.some((r) => r.from === id));
  for (const id of unaliased.slice(0, 20)) console.warn(`prepare-data:   gone, no alias: ${id}`);
  if (renamed.some((r) => !(r.from in aliases))) {
    console.warn(`prepare-data:   add renames to ${relative(root, aliasesPath)} so old links keep working, then rerun with --accept-ids.`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
