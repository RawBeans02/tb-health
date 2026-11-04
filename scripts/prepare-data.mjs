#!/usr/bin/env node
// Validates the source data and writes what the build and the site read (PLAN §4.4).
// No network. Runs before every build.
//
//   node scripts/prepare-data.mjs              real facility file if present, else the 93-row sample
//   node scripts/prepare-data.mjs --synthetic  ~2,100 obviously fake rows, for measuring scale only
//
// Writes (git-ignored):
//   public/data/facilities.json       slimmed facility list, fetched at runtime
//   src/generated/region-counts.json  facilities per region, for the Data page (d14)
//
// Still to come: the small gazetteer (step 3, with the ported core), and stable
// place ids with an alias map (Q6, not yet answered).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const out = {
  facilities: join(root, 'public/data/facilities.json'),
  regionCounts: join(root, 'src/generated/region-counts.json'),
};

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

/** Q6 stub: ids pass through from the source file until the owner decides how they're derived. */
export function placeId(row) {
  return row.id;
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
  const copy = { ...row, id: placeId(row) };
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

// Deterministic, obviously fake rows placed around the sample's city centres. Never shipped:
// launch-check flags a synthetic build, and nothing here resembles a real facility or person.
export function syntheticFacilities(sampleRows, count = SYNTHETIC_ROWS) {
  let seed = 20261104;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const located = sampleRows.filter((row) => typeof row.lat === 'number');
  return Array.from({ length: count }, (_, i) => {
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
  const synthetic = process.argv.includes('--synthetic');
  const realPath = join(dataDir, 'tb-dots-facilities.json');
  const samplePath = join(dataDir, 'tb-dots-facilities-SAMPLE.json');
  const sample = !synthetic && !existsSync(realPath);
  const sourcePath = synthetic || sample ? samplePath : realPath;
  const source = readJson(sourcePath);
  const rows = synthetic ? syntheticFacilities(source.facilities) : source.facilities;

  const failures = [];
  if (!Array.isArray(rows) || rows.length === 0) failures.push('facility list is empty');
  const facilityCheck = validateFacilities(rows ?? []);
  failures.push(...facilityCheck.errors);
  failures.push(...validateClaims(readJson(join(dataDir, 'claims.json'))));
  if (!readJson(join(dataDir, 'tb-ph-data.json')).meta) failures.push('tb-ph-data.json has no meta');

  for (const warning of facilityCheck.warnings.slice(0, 20)) console.warn(`prepare-data: warning: ${warning}`);
  if (facilityCheck.warnings.length > 20) console.warn(`prepare-data: …and ${facilityCheck.warnings.length - 20} more warnings`);
  if (failures.length) {
    for (const failure of failures.slice(0, 50)) console.error(`prepare-data: ${failure}`);
    console.error(`prepare-data: ${failures.length} problem(s); fix the data in data/ before building.`);
    process.exit(1);
  }

  const published = {
    meta: {
      title: source.title,
      source: source.source,
      count: rows.length,
      sample,
      synthetic,
    },
    facilities: rows.map(slim),
  };
  const bytes = writeJson(out.facilities, published);
  writeJson(out.regionCounts, regionCounts(rows));

  const kind = synthetic ? 'SYNTHETIC' : sample ? 'SAMPLE' : 'real';
  console.log(
    `prepare-data: ${rows.length} facilities (${kind}, from ${relative(root, sourcePath)}) → ${relative(root, out.facilities)} ` +
      `${kb(bytes.length)}, gzip ${kb(gzipSync(bytes).length)}, brotli ${kb(brotliCompressSync(bytes).length)}`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
