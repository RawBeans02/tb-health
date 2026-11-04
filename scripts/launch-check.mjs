#!/usr/bin/env node
// Lists everything still open before launch (PLAN §4.3). The build never resolves or
// rewords any of it; the owner decides. Reads the copy dictionaries, the prepared data
// and the last build in dist/.
//
//   node scripts/launch-check.mjs                      report only
//   node scripts/launch-check.mjs --release            the production gate: exits 1 while anything
//                                                      blocking is open (PLAN §5 step 14)
//   node scripts/launch-check.mjs --release --accept=sample,review
//                                                      the owner's explicit override: those blocking
//                                                      items are printed as accepted for this release
// Each blocking item has a key, shown in brackets, for --accept.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
const today = new Date().toISOString().slice(0, 10);

// Open items no string or data file carries yet. Each moves to a dictionary flag (or
// goes) when its page is built.
const KNOWN = [
  'Sakay.ph deep links [VERIFY] (Place, step 6). (DOH 1555 was verified by the owner, V4.)',
  'The name "TB PH" is a placeholder until stakeholders choose one (pack line 3).',
  'WHO 2026 report: launch on the 2025 report (2024 data) or refresh first (Q11). Copy that names the report or its year moves with it: about.updatesText, datapage.method2.',
  'Reuse terms for the WHO and PhilHealth data (licence and attribution wording) are not recorded yet.',
];

// Strings that still mention the symptom check, which a build without Check (Q9) leaves in.
const CHECK_MENTIONS = ['install.off2', 'install.lead', 'about.disclaimerText', 'about.privacy1', 'about.appText', 'meta.installDescription'];

function isStr(value) {
  return value && typeof value === 'object' && 'en' in value && 'fil' in value && 'origin' in value && Array.isArray(value.src);
}

async function strings() {
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

function readJson(p) {
  return existsSync(path(p)) ? JSON.parse(readFileSync(path(p), 'utf8')) : null;
}

const blocking = [];
const decide = [...KNOWN];
const queues = [];
const block = (key, text) => blocking.push({ key, text });

// Copy
const all = await strings();
const ownerMissing = all.filter((s) => (s.src[0] === 'owner' && !s.en) || (s.src[1] === 'owner' && !s.fil));
if (ownerMissing.length) block('owner-strings', `Strings the owner supplies, not in yet (${ownerMissing.length}): ${ownerMissing.map((s) => s.id).join(', ')}.`);

// Which dictionaries this build ships: without Check (Q9), Check's own strings don't.
const home = existsSync(path('dist/index.html')) ? readFileSync(path('dist/index.html'), 'utf8') : null;
const checkBuilt = !!home && /href="\/check"/.test(/<nav class="site-nav"[\s\S]*?<\/nav>/.exec(home)?.[0] ?? '');

// Flagged copy blocks a release: [REVIEW] waits on the clinical review, [VERIFY] on a check,
// PLACEHOLDER on the owner. (Check's own [REVIEW] strings come under check-review below.)
const FLAG_KEYS = { REVIEW: 'review', VERIFY: 'verify', PLACEHOLDER: 'placeholders' };
const FLAG_WHY = { REVIEW: 'wait on the clinical review', VERIFY: 'need checking', PLACEHOLDER: 'stand in for owner content' };
for (const flag of ['REVIEW', 'VERIFY', 'PLACEHOLDER']) {
  const flagged = all.filter((s) => s.flags?.includes(flag) && !(flag === 'REVIEW' && s.id.startsWith('check.')));
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
const filReview = all.filter((s) => s.flags?.includes('FIL-REVIEW'));
queues.push(`Filipino review: ${filReview.length} strings not from the pack (D10).`);
queues.push(`Filipino register pass: ${all.filter((s) => s.origin === 'pack').length} pack strings, for one consistent register across pack and review copy.`);
// V3: no em dashes in copy. Listed for the owner, never reworded here.
const dashes = all.filter((s) => s.en.includes('\u2014') || s.fil.includes('\u2014'));
if (dashes.length) decide.push(`Em dashes (V3), for the owner or the v7 wording: ${dashes.map((s) => s.id).join(', ')}.`);
const overrides = all.filter((s) => s.origin === 'override');
queues.push(`Copy overrides for the owner to confirm: ${overrides.length} strings (docs/copy-overrides.md).`);

// Data
const facilities = readJson('public/data/facilities.json');
if (!facilities) {
  block('no-data', 'No prepared facility list (run npm run build).');
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
if (!home) {
  block('no-build', 'No build in dist/ (run npm run build).');
} else {
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(home)?.[1] ?? '';
  if (!canonical || /\.example\b/.test(new URL(canonical).hostname)) {
    block('domain', `Domain is a placeholder (${canonical ? new URL(canonical).origin : 'none'}): build with SITE_URL once the owner picks host and domain (Q7).`);
  }
  if (checkBuilt) {
    block('check-review', 'Check is in the build, but its clinical review is pending: finish the review, or build with TBPH_CHECK=false (Q9).');
  } else {
    decide.push('Check is left out of this build (TBPH_CHECK=false, Q9).');
    block('check-mentions', `Without Check, these strings still mention it; the owner rewords or drops them (Q9): ${CHECK_MENTIONS.join(', ')}.`);
  }
  const headers = existsSync(path('dist/_headers')) ? readFileSync(path('dist/_headers'), 'utf8') : '';
  if (/X-Robots-Tag: noindex/.test(headers)) block('not-production', 'This build is marked noindex: build the release with TBPH_PRODUCTION=true and SITE_URL.');
}

// The owner's explicit override for this release: --accept=key,key.
const acceptArg = process.argv.find((a) => a.startsWith('--accept='));
const accepted = new Set(acceptArg ? acceptArg.slice('--accept='.length).split(',').filter(Boolean) : []);
const keys = new Set(blocking.map((b) => b.key));
const unknown = [...accepted].filter((k) => !keys.has(k));
if (unknown.length) {
  console.error(`launch-check: --accept names ${unknown.join(', ')}, which ${unknown.length > 1 ? "aren't" : "isn't"} open; open keys: ${[...keys].join(', ') || 'none'}.`);
  process.exit(2);
}
const open = blocking.filter((b) => !accepted.has(b.key));
const overridden = blocking.filter((b) => accepted.has(b.key));

const section = (title, items) => {
  if (!items.length) return;
  console.log(`\n${title} (${items.length})`);
  for (const item of items) console.log(`  - ${item}`);
};
console.log('launch-check: what is still open before launch (PLAN §4.3). The build resolves none of it.');
section('Blocking', open.map((b) => `[${b.key}] ${b.text}`));
section('Blocking, accepted by the owner for this release (--accept)', overridden.map((b) => `[${b.key}] ${b.text}`));
section('For the owner to decide or check', decide);
section('Review queues', queues);

if (process.argv.includes('--release')) {
  if (open.length) {
    console.error(`\nlaunch-check: ${open.length} blocking item(s) open; not ready to release. The owner can accept one explicitly with --accept=<key>.`);
    process.exit(1);
  }
  console.log(`\nlaunch-check: ready to release${overridden.length ? `, with ${overridden.length} item(s) accepted by the owner` : ''}.`);
}
