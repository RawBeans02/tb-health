#!/usr/bin/env node
// Builds dist/sw.js after `astro build` (PLAN §2, step 11): an explicit precache list with a
// content hash per file, a version from those hashes, then src/sw.ts bundled with them.
// Fails the build when a listed file is missing or the list is over budget (PLAN §4.6).
// Workbox's runtime does the caching; listing the files needs no more than this, so
// workbox-build (and the Babel and Rollup it brings) isn't used.
//
//   node scripts/build-sw.mjs

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'rolldown';
import { precachePages } from '../src/lib/offline.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const BUDGET = { entries: 60, bytes: 3 * 1024 * 1024 };

// Same switch as the pages (Q9): a build without Check saves no /check.
const features = { check: process.env.TBPH_CHECK !== 'false' };

/** A page's address → its file: / → index.html, /fil → fil.html, /fil/places → fil/places.html. */
const pageFile = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

function files(dir) {
  return readdirSync(join(dist, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? files(path) : [path];
  });
}

const entries = [
  ...precachePages(features).map((url) => ({ url, file: pageFile(url) })),
  // Astro's hashed assets. The map loads only on request and needs the network anyway.
  ...files('_astro')
    .filter((file) => !/^_astro\/(leaflet|layers|marker-icon)[.-]/.test(file))
    .map((file) => ({ url: `/${file}`, file, hashed: true })),
  // The manifest, the PNG favicon and the app icons only matter online (installing, tabs).
  ...['icons/favicon.svg', 'icons/chevron-down.svg', 'data/facilities.json', 'data/gazetteer.json'].map((file) => ({ url: `/${file}`, file })),
];

let bytes = 0;
const precache = entries.map(({ url, file, hashed }) => {
  const path = join(dist, file);
  if (!existsSync(path)) throw new Error(`build-sw: ${file} is in the precache list but wasn't built`);
  bytes += statSync(path).size;
  // Hashed names change with their content, so Workbox needs no revision for them.
  return { url, revision: hashed ? null : createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16) };
});

if (precache.length > BUDGET.entries || bytes > BUDGET.bytes) {
  throw new Error(`build-sw: precache is ${precache.length} files, ${bytes} bytes; the budget is ${BUDGET.entries} files, ${BUDGET.bytes} bytes`);
}

const version = createHash('sha256').update(JSON.stringify(precache)).digest('hex').slice(0, 12);

await build({
  input: join(root, 'src/sw.ts'),
  platform: 'browser',
  logLevel: 'warn',
  transform: {
    define: {
      __TBPH_PRECACHE__: JSON.stringify(precache),
      __TBPH_VERSION__: JSON.stringify(version),
      // Workbox's development logging and checks go.
      'process.env.NODE_ENV': '"production"',
    },
  },
  output: { file: join(dist, 'sw.js'), format: 'iife', minify: true },
});

console.log(`build-sw: dist/sw.js, version ${version}, ${precache.length} files precached (${(bytes / 1024).toFixed(0)} KB) from ${relative(root, dist)}/`);
