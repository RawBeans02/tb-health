#!/usr/bin/env node
// Step 15.4: the dev-only worst-case list and its ?data=worst switch (src/lib/core/data.ts) must
// never ship. After a build, dist/ holds neither data/facilities-worst.json nor the switch's
// code, except after `npm run build:worst` (TBPH_WORST=true), which must hold both. Every build
// script runs this before its link checks, so a build that breaks the rule fails.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const list = existsSync(join(dist, 'data/facilities-worst.json'));
const code = readdirSync(join(dist, '_astro'))
  .filter((name) => name.endsWith('.js') && readFileSync(join(dist, '_astro', name), 'utf8').includes('facilities-worst'))
  .map((name) => `_astro/${name}`);
const worstBuild = process.env.TBPH_WORST === 'true';
const found = `${list ? 'dist/data/facilities-worst.json' : 'no list'}; switch in ${code.join(', ') || 'no script'}`;

if (worstBuild && (!list || !code.length)) {
  console.error(`check-dev-only: npm run build:worst should hold the worst-case list and its switch, but has ${found}.`);
  process.exit(1);
}
if (!worstBuild && (list || code.length)) {
  console.error(`check-dev-only: this build holds the dev-only worst-case list or its switch (${found}). Never deploy it: build again without TBPH_WORST and without prepare-data --with-worst.`);
  process.exit(1);
}
console.log(worstBuild ? `check-dev-only: a worst-case test build (${found}); never deploy it.` : 'check-dev-only: no worst-case list or switch in dist/.');
