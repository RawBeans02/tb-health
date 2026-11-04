#!/usr/bin/env node
// Writes dist/_headers after the build (src/lib/headers.ts). TBPH_PRODUCTION=true for the
// production deploy only; every other build is marked noindex.
//
//   node scripts/build-headers.mjs

import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { headersFile } from '../src/lib/headers.ts';

const production = process.env.TBPH_PRODUCTION === 'true';

// /_astro/* is cached for a year as immutable: every file there must carry a content hash
// (Astro's name.HASH.ext, or the fonts' hash.woff2), or a release could serve a stale copy.
const astro = fileURLToPath(new URL('../dist/_astro/', import.meta.url));
const unhashed = readdirSync(astro, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => !/\.[A-Za-z0-9_-]{8}\.\w+$/.test(name) && !/^[0-9a-f]{16}\.woff2$/.test(name));
if (unhashed.length) {
  console.error(`build-headers: files in dist/_astro without a content hash, which can't be cached as immutable: ${unhashed.join(', ')}`);
  process.exit(1);
}
writeFileSync(fileURLToPath(new URL('../dist/_headers', import.meta.url)), headersFile(production));
console.log(`build-headers: dist/_headers (${production ? 'production' : 'not production: noindex'})`);
