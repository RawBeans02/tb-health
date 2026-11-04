#!/usr/bin/env node
// Lists everything still open before launch (PLAN §4.3). The build never resolves or
// rewords any of it; the owner decides. Reads the copy dictionaries, the prepared data
// and the last build in dist/.
//
//   node scripts/launch-check.mjs            report only
//   node scripts/launch-check.mjs --release  also exits 1 while anything blocking is open

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
const today = new Date().toISOString().slice(0, 10);

// Open items no string or data file carries yet. Each moves to a dictionary flag (or
// goes) when its page is built.
const KNOWN = [
  'Content conflicts (pack §11): 7,500 vs 7,000 deaths; 27,900 vs about 28,000 DR-TB; 14% vs 13.6%. Data takeaways wait on D5 (before step 9).',
  'DOH hotline 1555 [VERIFY] (About, step 10) and Sakay.ph deep links [VERIFY] (Place, step 6).',
  'The name "TB PH" is a placeholder until stakeholders choose one (pack line 3).',
  'WHO 2026 report: launch on the 2025 report (2024 data) or refresh first (Q11).',
];

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

// Copy
const all = await strings();
const ownerMissing = all.filter((s) => (s.src[0] === 'owner' && !s.en) || (s.src[1] === 'owner' && !s.fil));
if (ownerMissing.length) blocking.push(`Strings the owner supplies, not in yet (${ownerMissing.length}): ${ownerMissing.map((s) => s.id).join(', ')}.`);
blocking.push('About privacy rows, EN and FIL, from the owner (Q5): self-hosted fonts, map tiles, the host. Listed as strings in step 10.');
for (const flag of ['REVIEW', 'VERIFY', 'PLACEHOLDER']) {
  const flagged = all.filter((s) => s.flags?.includes(flag));
  if (flagged.length) decide.push(`[${flag}] ${flagged.map((s) => s.id).join(', ')}.`);
}
const filReview = all.filter((s) => s.flags?.includes('FIL-REVIEW'));
queues.push(`Filipino review: ${filReview.length} strings not from the pack (D10).`);
const overrides = all.filter((s) => s.origin === 'override');
queues.push(`Copy overrides for the owner to confirm: ${overrides.length} strings (docs/copy-overrides.md).`);

// Data
const facilities = readJson('public/data/facilities.json');
if (!facilities) {
  blocking.push('No prepared facility list (run npm run build).');
} else {
  const { meta, facilities: rows } = facilities;
  if (meta.synthetic) blocking.push(`Facility list is SYNTHETIC (${meta.count} fake rows). Rebuild with real data.`);
  else if (meta.sample) blocking.push(`Facility list is the ${meta.count}-row SAMPLE: the full list needs the pipeline run or a file from the owner (Q8).`);
  const lapsed = rows.filter((r) => r.accreditation_expiry && r.accreditation_expiry < today).length;
  const yearEnd = `${today.slice(0, 4)}-12-31`;
  const lapsing = rows.filter((r) => r.accreditation_expiry && r.accreditation_expiry >= today && r.accreditation_expiry <= yearEnd).length;
  decide.push(`Accreditations: ${lapsed} lapsed, ${lapsing} more end by ${yearEnd}; shown as listed until Q12 (D24).`);
  const updated = rows.map((r) => r.source_updated).filter(Boolean).sort().at(-1);
  if (updated) decide.push(`Facility list dated ${updated} (PhilHealth update); who runs the monthly refresh is open.`);
}

// Last build
const home = existsSync(path('dist/index.html')) ? readFileSync(path('dist/index.html'), 'utf8') : null;
if (!home) {
  blocking.push('No build in dist/ (run npm run build).');
} else {
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(home)?.[1] ?? '';
  if (!canonical || /\.example\b/.test(new URL(canonical).hostname)) {
    blocking.push(`Domain is a placeholder (${canonical ? new URL(canonical).origin : 'none'}): host and domain wait on Q7 (before step 12).`);
  }
  const headerNav = /<nav class="site-nav"[\s\S]*?<\/nav>/.exec(home)?.[0] ?? '';
  if (/href="\/check"/.test(headerNav)) {
    blocking.push('Check is in the nav, but its clinical review is pending: finish the review, or build with TBPH_CHECK=false (Q9). Learn L6 [REVIEW] too.');
  } else {
    decide.push('Check is left out of this build (TBPH_CHECK=false, Q9). Learn L6 [REVIEW] still needs the clinical review.');
  }
}

const section = (title, items) => {
  if (!items.length) return;
  console.log(`\n${title} (${items.length})`);
  for (const item of items) console.log(`  - ${item}`);
};
console.log('launch-check: what is still open before launch (PLAN §4.3). The build resolves none of it.');
section('Blocking', blocking);
section('For the owner to decide or check', decide);
section('Review queues', queues);

if (process.argv.includes('--release') && blocking.length) {
  console.error(`\nlaunch-check: ${blocking.length} blocking item(s) open; not ready to release.`);
  process.exit(1);
}
