#!/usr/bin/env node
// Every link to another site in dist/ (audit L8): the sources pages cite, and the directions,
// map and Sakay.ph links, in the HTML and in the islands' props, which only the client
// renders (Home's route sources: audit B64). Without --fetch it only lists them, offline.
// With --fetch it asks each source once whether it still answers: that contacts other
// sites, so it runs only with the owner's OK, and dead sources go to the content owner
// (never rewritten here). It doesn't follow redirects, so no other host is contacted; it
// reports where they point. Directions links (one per place) are counted, not fetched.
// Not in the inventory: links only scripts make, such as the map's OpenStreetMap attribution
// and Sakay.ph's target, which the Place page opens from JS.
//
//   node scripts/outside-links.mjs           the inventory, offline
//   node scripts/outside-links.mjs --fetch   also checks each source (owner's OK first)

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const site = new URL(/<link rel="canonical" href="([^"]+)"/.exec(readFileSync(join(dist, 'index.html'), 'utf8'))[1]).origin;
const DIRECTIONS = /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/dir\//;
const TIMEOUT = 15_000;
const USER_AGENT = 'tb-health-outside-links/1 (checks that cited sources still answer)';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const unescape = (text) => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** The outside URLs in one page: its links, and the URLs in its islands' props (JSON strings). */
function urls(html) {
  const links = [...html.matchAll(/<a\s[^>]*href="(https?:\/\/[^"]+)"/g)].map((m) => unescape(m[1]));
  const props = [...html.matchAll(/<astro-island\b[^>]*\bprops="([^"]*)"/g)].flatMap((m) => [...unescape(m[1]).matchAll(/"(https?:\/\/[^"\s{}]+)"/g)].map((u) => u[1]));
  return [...links, ...props];
}

const sources = new Map(); // URL → pages citing it
const directions = new Map(); // host → count
for (const file of htmlFiles(dist)) {
  const page = `/${relative(dist, file).replace(/\.html$/, '')}`;
  for (const href of urls(readFileSync(file, 'utf8'))) {
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

// --fetch: one source a second (HEAD, then GET at once after a 4xx or 5xx), each request with
// a timeout and a plain project User-Agent. Redirects aren't followed: their target is
// reported instead. A failure names its cause (ENOTFOUND, ECONNRESET, CERT_…).
const request = (href, method) => fetch(href, { method, redirect: 'manual', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT) });
const dead = [];
const moved = [];
for (const [href, pages] of sources) {
  const on = `(on ${[...pages].slice(0, 3).join(', ')}${pages.size > 3 ? ', …' : ''})`;
  let response = null;
  let failure = '';
  const why = (error) => (error.name === 'TimeoutError' ? `no answer in ${TIMEOUT / 1000} s` : (error.cause?.code ?? error.message));
  try {
    response = await request(href, 'HEAD');
  } catch (error) {
    failure = why(error);
  }
  // Some sites refuse HEAD: GET after any HEAD answer that isn't 2xx or 3xx, and report the
  // GET's own result.
  if (response && response.status >= 400) {
    try {
      response = await request(href, 'GET');
    } catch (error) {
      response = null;
      failure = why(error);
    }
  }
  if (!response || response.status >= 400) dead.push(`${response?.status ?? failure}  ${href}  ${on}`);
  else if (response.status >= 300) moved.push(`${response.status} to ${response.headers.get('location') ?? '?'}  ${href}  ${on}`);
  await response?.body?.cancel();
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.log(`\noutside-links: ${dead.length} of ${sources.size} sources didn't answer with a page:`);
for (const line of dead) console.log(`  ${line}`);
console.log(`\noutside-links: ${moved.length} redirect elsewhere (not followed; the content owner checks the target):`);
for (const line of moved) console.log(`  ${line}`);
