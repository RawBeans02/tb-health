#!/usr/bin/env node
// Every link to another site in dist/ (audit L8): the sources pages cite, and the directions,
// map and Sakay.ph links. Without --fetch it only lists them, offline. With --fetch it asks
// each source once whether it still answers: that contacts other sites, so it runs only
// with the owner's OK, and dead sources go to the content owner (never rewritten here).
// Directions links (one per place) are counted, not fetched.
//
//   node scripts/outside-links.mjs           the inventory, offline
//   node scripts/outside-links.mjs --fetch   also checks each source (owner's OK first)

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const site = new URL(/<link rel="canonical" href="([^"]+)"/.exec(readFileSync(join(dist, 'index.html'), 'utf8'))[1]).origin;
const DIRECTIONS = /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/dir\//;

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const sources = new Map(); // URL → pages citing it
const directions = new Map(); // host → count
for (const file of htmlFiles(dist)) {
  const page = `/${relative(dist, file).replace(/\.html$/, '')}`;
  for (const [, raw] of readFileSync(file, 'utf8').matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)) {
    const href = raw.replace(/&amp;/g, '&');
    if (new URL(href).origin === site) continue;
    if (DIRECTIONS.test(href)) {
      const host = new URL(href).host;
      directions.set(host, (directions.get(host) ?? 0) + 1);
      continue;
    }
    if (!sources.has(href)) sources.set(href, new Set());
    sources.get(href).add(page);
  }
}

const byHost = new Map();
for (const href of sources.keys()) {
  const host = new URL(href).host;
  byHost.set(host, (byHost.get(host) ?? 0) + 1);
}
console.log(`outside-links: ${sources.size} distinct source links on ${byHost.size} sites; directions links: ${[...directions].map(([h, n]) => `${n} to ${h}`).join(', ') || 'none'}.`);
for (const [host, n] of [...byHost].sort((a, b) => b[1] - a[1])) console.log(`  ${host}: ${n}`);

if (!process.argv.includes('--fetch')) process.exit(0);

// --fetch: one request per source, a second apart; HEAD first, then GET if HEAD isn't allowed.
const dead = [];
for (const [href, pages] of sources) {
  let status = 0;
  try {
    let response = await fetch(href, { method: 'HEAD', redirect: 'follow' });
    if (response.status === 405 || response.status === 403) response = await fetch(href, { redirect: 'follow' });
    status = response.status;
  } catch {
    status = 0;
  }
  if (status === 0 || status >= 400) dead.push(`${status || 'no answer'}  ${href}  (on ${[...pages].slice(0, 3).join(', ')}${pages.size > 3 ? ', …' : ''})`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.log(`\noutside-links: ${dead.length} of ${sources.size} sources didn't answer with a page:`);
for (const line of dead) console.log(`  ${line}`);
