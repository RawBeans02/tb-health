#!/usr/bin/env node
// Checks the performance budgets after every build (PLAN §4.6, step 13) and fails it when
// one is over. The precache budget is checked by build-sw.mjs.
//   - JavaScript per page ≤ 60 KB gzip: every script the page loads (module scripts, island
//     components and their renderer, with all their imports) plus its inline scripts and
//     island props, which carry the second language's copy on the in-place pages (§4.2).
//     Read as "Data ≤ 120 KB": the Data page, with its charts and dot story, gets 120 KB.
//     The Leaflet chunk loads only when the map is asked for and isn't counted.
//   - The slim facility list ≤ 200 KB compressed (Brotli, as the host serves it).
// Each piece is gzipped on its own, which overstates a little: the sum is an upper bound.
//
//   node scripts/check-budgets.mjs

import { readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const KB = 1024;
const BUDGET = { js: 60 * KB, dataPage: 120 * KB, facilities: 200 * KB };

const gz = (text) => gzipSync(text, { level: 9 }).length;
const decode = (value) => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

// One JS file's size and its imports (static and dynamic), by URL path.
const files = new Map();
function jsFile(url) {
  if (!files.has(url)) {
    const code = readFileSync(join(dist, url), 'utf8');
    const imports = [...code.matchAll(/(?:from|import)\s*\(?\s*["'`](\.{1,2}\/[^"'`]+\.js)["'`]/g)].map((m) => posix.join(posix.dirname(url), m[1]));
    files.set(url, { size: gz(code), imports });
  }
  return files.get(url);
}

function scriptsOf(html) {
  const entry = [
    ...[...html.matchAll(/<script[^>]*\bsrc="(\/[^"]+\.js)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\b(?:component-url|renderer-url|before-hydration-url)="(\/[^"]+\.js)"/g)].map((m) => m[1]),
  ];
  const seen = new Set();
  const visit = (url) => {
    if (seen.has(url) || /\/leaflet[.-]/.test(url)) return;
    seen.add(url);
    for (const next of jsFile(url).imports) visit(next);
  };
  entry.forEach(visit);
  return seen;
}

/** A page's JavaScript, gzipped: its scripts and their imports, inline scripts, island props. */
function pageJs(html) {
  let size = 0;
  for (const url of scriptsOf(html)) size += jsFile(url).size;
  for (const [, inline] of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) if (inline.trim()) size += gz(inline);
  for (const [, props] of html.matchAll(/<astro-island[^>]*\bprops="([^"]*)"/g)) size += gz(decode(props));
  return size;
}

const worst = { size: 0, page: '' };
let dataPage = 0;
const over = [];
for (const file of htmlFiles(dist)) {
  const page = `/${relative(dist, file).replace(/\.html$/, '').replace(/(^|\/)index$/, '')}`;
  const size = pageJs(readFileSync(file, 'utf8'));
  const isData = /^\/(fil\/)?data$/.test(page);
  const budget = isData ? BUDGET.dataPage : BUDGET.js;
  if (size > budget) over.push(`${page}: ${(size / KB).toFixed(1)} KB of JavaScript (budget ${budget / KB} KB)`);
  if (isData) dataPage = Math.max(dataPage, size);
  else if (size > worst.size) Object.assign(worst, { size, page });
}

const facilities = readFileSync(join(dist, 'data/facilities.json'));
const facilitiesBr = brotliCompressSync(facilities).length;
if (facilitiesBr > BUDGET.facilities) over.push(`data/facilities.json: ${(facilitiesBr / KB).toFixed(1)} KB Brotli (budget ${BUDGET.facilities / KB} KB)`);

if (over.length) {
  console.error(`check-budgets: over budget (PLAN §4.6):\n  ${over.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `check-budgets: JavaScript per page at most ${(worst.size / KB).toFixed(1)} KB gzip (${worst.page}; budget 60), Data ${(dataPage / KB).toFixed(1)} KB (budget 120), facilities.json ${(facilitiesBr / KB).toFixed(1)} KB Brotli (budget 200)`,
);
