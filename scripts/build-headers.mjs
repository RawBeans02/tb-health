#!/usr/bin/env node
// Writes dist/_headers after the build (src/lib/headers.ts). TBPH_PRODUCTION=true for the
// production deploy only; every other build is marked noindex.
//
//   node scripts/build-headers.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { headersFile } from '../src/lib/headers.ts';

const production = process.env.TBPH_PRODUCTION === 'true';
writeFileSync(fileURLToPath(new URL('../dist/_headers', import.meta.url)), headersFile(production));
console.log(`build-headers: dist/_headers (${production ? 'production' : 'not production: noindex'})`);
