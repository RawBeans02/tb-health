#!/usr/bin/env node
// Lists everything still open before launch (PLAN §4.3). The build never resolves or
// rewords any of it; the owner decides. Reads the copy dictionaries and the last build in
// dist/, so the gate judges the files that will be uploaded (audit B59).
//
//   node scripts/launch-check.mjs                      report only
//   node scripts/launch-check.mjs --release            the production gate: exits 1 while anything
//                                                      blocking is open (PLAN §5 step 14)
//   node scripts/launch-check.mjs --release --accept=sample,review
//                                                      the owner's explicit override: those blocking
//                                                      items are printed as accepted for this release
// Each blocking item has a key, shown in brackets. Only the owner's own calls can be accepted
// (ACCEPTABLE, audit B60). Exit 2: an unknown argument, or --accept naming a key that can't
// be accepted or isn't open.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { headersFile } from '../src/lib/headers.ts';
import { isMain } from './is-main.mjs';

const root = new URL('../', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));

// Open items no string or data file carries yet. Each moves to a dictionary flag (or
// goes) when its page is built.
const KNOWN = [
  'Sakay.ph deep links [VERIFY] (Place, step 6). (DOH 1555 was verified by the owner, V4.)',
  'The name "TB PH" is a placeholder until stakeholders choose one (pack line 3).',
  'WHO 2026 report: launch on the 2025 report (2024 data) or refresh first (Q11). Copy that names the report or its year moves with it: about.updatesText, dataPage.method2.',
  'Reuse terms for the WHO and PhilHealth data (licence and attribution wording) are not recorded yet.',
];

// Strings that still mention the symptom check, which a build without Check (Q9) leaves in.
// home.bring3 ("Your TB check summary", on every route); notFound.lead (C8: "These" above a
// single button once Check's goes). Listed for the owner, never reworded here (B48). A fixed
// list, updated when the owner answers Q9 (B61).
const CHECK_MENTIONS = ['install.off2', 'install.lead', 'about.disclaimerText', 'about.privacy1', 'about.appText', 'meta.installDescription', 'home.bring3', 'notFound.lead'];

// Strings only Check's pages use, besides its own dictionary: a build without Check ships none.
const CHECK_ONLY = ['meta.checkTitle', 'meta.checkDescription'];

// The Check footer's reviewer placeholder, open until the clinical review is recorded.
const REVIEWER_PLACEHOLDERS = ['[partner clinicians — pending]', '[mga katuwang na doktor — nakabinbin]'];

const PRIVACY_ROW = 'about.privacyServices';

/**
 * The blocking keys the owner may accept for a release. The rest (privacy-row, synthetic,
 * no-build, no-data, no-headers, headers, check-pages, domain, not-production) can't be.
 */
export const ACCEPTABLE = ['check-review', 'sample', 'owner-strings', 'review', 'verify', 'placeholders', 'check-mentions'];

/** `--release` and `--accept=key,key`; anything else is an error. */
export function parseArgs(argv) {
  const args = { release: false, accept: [] };
  for (const a of argv) {
    if (a === '--release') args.release = true;
    else if (a.startsWith('--accept=')) args.accept.push(...a.slice('--accept='.length).split(',').filter(Boolean));
    else return { error: `unknown argument ${a}` };
  }
  return args;
}

/** Today's date in the Philippines, YYYY-MM-DD. */
export function manilaToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(now);
}

/** The last build as the gate reads it: null pieces where dist/ has none. */
export function readBuild(dist) {
  const read = (p) => (existsSync(join(dist, p)) ? readFileSync(join(dist, p), 'utf8') : null);
  const home = read('index.html');
  const json = read('data/facilities.json');
  return {
    build: home === null ? null : { home, check: { en: existsSync(join(dist, 'check.html')), fil: existsSync(join(dist, 'fil', 'check.html')) }, headers: read('_headers') },
    facilities: json === null ? null : JSON.parse(json),
  };
}

/** The views that build a page title with an em dash (" — TB PH"), for the V3 list. */
export function viewTitleDashes(viewsDir) {
  return readdirSync(viewsDir)
    .filter((f) => f.endsWith('.astro') && readFileSync(join(viewsDir, f), 'utf8').includes('— TB PH'))
    .map((f) => f.replace(/\.astro$/, ''))
    .sort();
}

/**
 * What is open, from what the script read (audit B62: pure, so every key is unit-tested).
 *   strings        every copy string: { id, en, fil, origin, src, flags }
 *   build          readBuild()'s build: null when dist/ holds no build, else { home: dist/index.html,
 *                  check: { en, fil }: which check.html pages exist, headers: dist/_headers or null }
 *   facilities     dist/data/facilities.json, or null
 *   today          YYYY-MM-DD
 *   checkMentions  the strings that still mention Check (CHECK_MENTIONS)
 *   titleDashes    the views whose page titles carry an em dash (viewTitleDashes)
 */
export function assess({ strings, build, facilities, today, checkMentions = CHECK_MENTIONS, titleDashes = /** @type {string[]} */ ([]) }) {
  const blocking = [];
  const decide = [...KNOWN];
  const queues = [];
  const block = (key, text) => blocking.push({ key, text });

  // A build without Check (Q9) ships none of Check's strings, so they're in no list (B61).
  // With no build yet, Check is in, as it is by default; with one language's page only, it
  // counts as in, and the split blocks.
  const checkBuilt = build ? build.check.en || build.check.fil : true;
  const isCheck = (s) => s.id.startsWith('check.');
  const shipped = checkBuilt ? strings : strings.filter((s) => !isCheck(s) && !CHECK_ONLY.includes(s.id));

  // Copy. The privacy row is its own block, which can't be accepted: without it About doesn't
  // say who else sees what (RA 10173's transparency; the lead's ruling, B73).
  const missing = (s) => (s.src[0] === 'owner' && !s.en) || (s.src[1] === 'owner' && !s.fil);
  const privacyRow = shipped.find((s) => s.id === PRIVACY_ROW);
  if (privacyRow && missing(privacyRow)) block('privacy-row', `The privacy row (${PRIVACY_ROW}, Q5) isn't in yet: About doesn't say who else sees what (the host, OpenStreetMap, Google Maps). It can't be accepted (RA 10173).`);
  const ownerMissing = shipped.filter((s) => s.id !== PRIVACY_ROW && missing(s));
  if (ownerMissing.length) block('owner-strings', `Strings the owner supplies, not in yet (${ownerMissing.length}): ${ownerMissing.map((s) => s.id).join(', ')}.`);

  // Flagged copy blocks a release: [REVIEW] waits on the clinical review, [VERIFY] on a check,
  // PLACEHOLDER on the owner. Check's [REVIEW] strings and its reviewer placeholder come
  // under check-review below.
  const FLAG_KEYS = { REVIEW: 'review', VERIFY: 'verify', PLACEHOLDER: 'placeholders' };
  const FLAG_WHY = { REVIEW: 'wait on the clinical review', VERIFY: 'need checking', PLACEHOLDER: 'stand in for owner content' };
  for (const flag of ['REVIEW', 'VERIFY', 'PLACEHOLDER']) {
    const flagged = shipped.filter((s) => s.flags?.includes(flag) && !(flag !== 'VERIFY' && isCheck(s)));
    if (!flagged.length) continue;
    // Long lists are summed per dictionary.
    const byDict = new Map();
    for (const s of flagged) {
      const dict = s.id.split('.')[0];
      byDict.set(dict, [...(byDict.get(dict) ?? []), s.id]);
    }
    const parts = [...byDict].map(([dict, ids]) => (ids.length > 6 ? `${dict}: ${ids.length} strings` : ids.join(', ')));
    block(FLAG_KEYS[flag], `[${flag}] strings that ${FLAG_WHY[flag]}: ${parts.join('; ')}.`);
  }
  // Check's clinical review: open while a check string carries [REVIEW] or the footer still
  // has the reviewer placeholder. The flags come off only when the owner records the review.
  if (checkBuilt) {
    const review = shipped.filter((s) => isCheck(s) && s.flags?.includes('REVIEW')).length;
    const placeholderText = (s) => REVIEWER_PLACEHOLDERS.some((p) => s.en.includes(p) || s.fil.includes(p));
    const reviewer = shipped.filter((s) => isCheck(s) && (s.flags?.includes('PLACEHOLDER') || placeholderText(s))).map((s) => s.id);
    const left = [review && `${review} check string${review > 1 ? 's still carry' : ' still carries'} [REVIEW]`, reviewer.length && `the reviewer placeholder is still in (${reviewer.join(', ')})`].filter(Boolean);
    if (left.length) block('check-review', `Check is in the build, but its clinical review is pending: ${left.join('; ')}. Record the review, or build with TBPH_CHECK=false (Q9).`);
  }
  const filReview = shipped.filter((s) => s.flags?.includes('FIL-REVIEW'));
  queues.push(`Filipino review: ${filReview.length} strings not from the pack (D10).`);
  queues.push(`Filipino register pass: ${shipped.filter((s) => s.origin === 'pack').length} pack strings, for one consistent register across pack and review copy.`);
  // V3: no em dashes in copy. Listed for the owner, never reworded here.
  const dashes = shipped.filter((s) => s.en.includes('—') || s.fil.includes('—'));
  const titles = titleDashes.length ? `; and the page titles built in src/views (" — TB PH"): ${titleDashes.join(', ')}` : '';
  if (dashes.length || titles) decide.push(`Em dashes (V3), for the owner or the v7 wording: ${dashes.map((s) => s.id).join(', ')}${titles}.`);
  const overrides = shipped.filter((s) => s.origin === 'override');
  queues.push(`Copy overrides for the owner to confirm: ${overrides.length} strings (docs/copy-overrides.md).`);

  // Data, as built
  if (!facilities) {
    block('no-data', 'No facility list in dist/data/ (run npm run build).');
  } else {
    const { meta, facilities: rows } = facilities;
    if (meta.synthetic) block('synthetic', `Facility list is SYNTHETIC (${meta.count} fake rows). Rebuild with real data.`);
    else if (meta.sample) block('sample', `Facility list is the ${meta.count}-row SAMPLE: the full list needs the pipeline run or a file from the owner (Q8).`);
    const lapsed = rows.filter((r) => r.accreditation_expiry && r.accreditation_expiry < today).length;
    const yearEnd = `${today.slice(0, 4)}-12-31`;
    const lapsing = rows.filter((r) => r.accreditation_expiry && r.accreditation_expiry >= today && r.accreditation_expiry <= yearEnd).length;
    decide.push(`Accreditations: ${lapsed} lapsed, ${lapsing} more end by ${yearEnd}; shown as listed until Q12 (D24).`);
    const updated = rows.map((r) => r.source_updated).filter(Boolean).sort().at(-1);
    if (updated) decide.push(`Facility list dated ${updated} (PhilHealth update); who runs the monthly refresh is open.`);
  }

  // Last build
  if (!build) {
    block('no-build', 'No build in dist/ (run npm run build).');
  } else {
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(build.home)?.[1] ?? '';
    if (!canonical || /\.example\b/.test(new URL(canonical).hostname)) {
      block('domain', `Domain is a placeholder (${canonical ? new URL(canonical).origin : 'none'}): build with SITE_URL once the owner picks the domain (Q7).`);
    }
    if (build.check.en !== build.check.fil) block('check-pages', `Only ${build.check.en ? '/check' : '/fil/check'} is in dist/: Check is in one language only. Rebuild with npm run build.`);
    if (!checkBuilt) {
      decide.push('Check is left out of this build (TBPH_CHECK=false, Q9).');
      if (checkMentions.length) block('check-mentions', `Without Check, these strings still mention it; the owner rewords or drops them (Q9): ${checkMentions.join(', ')}.`);
    }
    // The headers must be exactly what build-headers writes for production.
    if (build.headers === null) block('no-headers', 'dist/_headers is missing: the security headers would not be sent. Rebuild with npm run build.');
    else if (build.headers === headersFile(false)) block('not-production', 'This build is marked noindex: build the release with TBPH_PRODUCTION=true and SITE_URL.');
    else if (build.headers !== headersFile(true)) block('headers', "dist/_headers isn't what build-headers writes for production (src/lib/headers.ts): rebuild with TBPH_PRODUCTION=true and SITE_URL.");
  }

  return { blocking, decide, queues };
}

/** Splits the blocking items by the owner's --accept list, or says why the list is refused. */
export function applyAccept(blocking, accept) {
  const refused = accept.filter((k) => !ACCEPTABLE.includes(k));
  if (refused.length) return { error: `--accept can't take ${refused.join(', ')}: only the owner's own calls can be accepted (${ACCEPTABLE.join(', ')})` };
  const keys = new Set(blocking.map((b) => b.key));
  const notOpen = accept.filter((k) => !keys.has(k));
  if (notOpen.length) return { error: `--accept names ${notOpen.join(', ')}, which ${notOpen.length > 1 ? "aren't" : "isn't"} open; open keys: ${[...keys].join(', ') || 'none'}` };
  return { open: blocking.filter((b) => !accept.includes(b.key)), accepted: blocking.filter((b) => accept.includes(b.key)) };
}

function isStr(value) {
  return value && typeof value === 'object' && 'en' in value && 'fil' in value && 'origin' in value && Array.isArray(value.src);
}

async function readStrings() {
  const out = [];
  const dir = path('src/content/');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'types.ts').sort()) {
    const module = await import(new URL(file, new URL('src/content/', root)).href);
    for (const [dictName, dict] of Object.entries(module)) {
      if (!dict || typeof dict !== 'object') continue;
      for (const [key, str] of Object.entries(dict)) if (isStr(str)) out.push({ id: `${dictName}.${key}`, ...str });
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    console.error(`launch-check: ${args.error}. Usage: launch-check [--release] [--accept=key,key]`);
    process.exit(2);
  }
  const { build, facilities } = readBuild(path('dist/'));
  const { blocking, decide, queues } = assess({ strings: await readStrings(), build, facilities, today: manilaToday(), titleDashes: viewTitleDashes(path('src/views/')) });
  const result = applyAccept(blocking, args.accept);
  if (result.error) {
    console.error(`launch-check: ${result.error}.`);
    process.exit(2);
  }

  const section = (title, items) => {
    if (!items.length) return;
    console.log(`\n${title} (${items.length})`);
    for (const item of items) console.log(`  - ${item}`);
  };
  console.log('launch-check: what is still open before launch (PLAN §4.3). The build resolves none of it.');
  section('Blocking', result.open.map((b) => `[${b.key}] ${b.text}`));
  section('Blocking, accepted by the owner for this release (--accept)', result.accepted.map((b) => `[${b.key}] ${b.text}`));
  section('For the owner to decide or check', decide);
  section('Review queues', queues);

  if (args.release) {
    if (result.open.length) {
      const can = result.open.filter((b) => ACCEPTABLE.includes(b.key)).map((b) => b.key);
      console.error(`\nlaunch-check: ${result.open.length} blocking item(s) open; not ready to release.${can.length ? ` The owner can accept their own calls explicitly with --accept=<key> (${can.join(', ')}).` : ''}`);
      process.exit(1);
    }
    console.log(`\nlaunch-check: ready to release${result.accepted.length ? `, with ${result.accepted.length} item(s) accepted by the owner (${result.accepted.map((b) => b.key).join(', ')}): send that list to the TB Health lead for decisions.md` : ''}.`);
  }
}

if (isMain(import.meta.url)) await main();
