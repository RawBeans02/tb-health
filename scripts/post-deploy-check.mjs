#!/usr/bin/env node
// After a deploy (PLAN §4.5, step 14): reads the live site back and compares it with dist/.
// The owner runs it once per deploy; it requests only the site's own pages and files.
//   - every page in the sitemap answers 200, with HTML identical to dist/ (no host feature
//     injected a script or rewrote the page) and no Set-Cookie on any response;
//   - every response carries exactly the headers dist/_headers gives its path (audit B63: a
//     pattern would let an HSTS max-age of 0 pass), and a production deploy no noindex;
//   - an unknown address gets a 404 in its language, and /check and /fil/check one in a
//     build without Check.
// Exit 1: problems found. Exit 2: no http: or https: origin given. Exit 3: the host couldn't be reached, a
// request timed out, or the script failed, so the check is incomplete.
//
//   node scripts/post-deploy-check.mjs https://the-live-site.example
//   (the local server works too: npm run serve, then node scripts/post-deploy-check.mjs http://127.0.0.1:4322)

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './is-main.mjs';

const TIMEOUT = 15_000;

/** dist/_headers as Cloudflare Pages reads it: a path pattern (`*` matches anything), then its headers indented below. */
export function parseHeaders(text) {
  const rules = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      rules.push({ re: new RegExp(`^${pattern}$`), headers: [] });
    } else if (rules.length) {
      const colon = line.indexOf(':');
      rules.at(-1).headers.push([line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim()]);
    }
  }
  return rules;
}

/** The headers a path must carry: every matching rule applies, and a repeated name joins with a comma. */
export function expectedHeaders(rules, path) {
  const out = new Map();
  for (const rule of rules) {
    if (!rule.re.test(path)) continue;
    for (const [name, value] of rule.headers) out.set(name, out.has(name) ? `${out.get(name)}, ${value}` : value);
  }
  return out;
}

/** What is wrong with one response's headers (live: a Headers object or anything with get()). */
export function headerProblems(path, expected, live, production) {
  const out = [];
  for (const [name, value] of expected) {
    const got = live.get(name);
    if (got !== value) out.push(`${path}: ${name} is ${JSON.stringify(got)}, not ${JSON.stringify(value)}`);
  }
  if (production && /noindex/i.test(live.get('x-robots-tag') ?? '')) out.push(`${path}: a production deploy says noindex`);
  if (live.get('set-cookie')) out.push(`${path}: sets a cookie`);
  return out;
}

/** The origin to check, from the first argument: http: or https: only, else null. */
export function parseOrigin(arg) {
  try {
    const url = new URL(arg);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * Reads the live site back against `dist`. Each request has its own timeout and error; five
 * failures in a row stop the requests (the host isn't answering), keeping what was found.
 */
export async function checkSite(origin, dist, fetchImpl = fetch) {
  const built = (file) => readFileSync(join(dist, file), 'utf8');
  const builtFile = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

  const home = built('index.html');
  const headersText = built('_headers');
  const rules = parseHeaders(headersText);
  const production = !/X-Robots-Tag: noindex/.test(headersText);
  const withCheck = existsSync(join(dist, 'check.html'));

  const problems = [];
  const errors = [];
  let stopped = '';
  let checked = 0;
  let failedInRow = 0;
  // One request, read in full, its headers checked against _headers.
  async function get(path) {
    if (stopped) return null;
    try {
      const response = await fetchImpl(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT) });
      const text = await response.text();
      checked++;
      failedInRow = 0;
      problems.push(...headerProblems(path, expectedHeaders(rules, path), response.headers, production));
      return { status: response.status, location: response.headers.get('location'), text };
    } catch (error) {
      errors.push(`${path}: ${error.name === 'TimeoutError' ? `no answer in ${TIMEOUT / 1000} s` : (error.cause?.code ?? error.message)}`);
      if (++failedInRow === 5) stopped = `${origin} stopped answering: five requests in a row failed, so the rest weren't sent`;
      return null;
    }
  }

  // Pages: every sitemap URL (both languages, every place), plus the stand-ins.
  const sitemap = built('sitemap.xml');
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname);
  for (const path of [...pages, '/offline', '/fil/offline', '/place', '/fil/place']) {
    const response = await get(path);
    if (!response) continue;
    if (response.status !== 200) problems.push(`${path}: ${response.status}${response.location ? ` to ${response.location}` : ''}, not 200`);
    else if (response.text !== built(builtFile(path))) problems.push(`${path}: the HTML served differs from dist/${builtFile(path)}`);
  }

  // Files: one of each kind _headers names.
  const asset = /\/_astro\/[^"]+\.js/.exec(home)?.[0];
  if (!asset) throw new Error('dist/index.html loads no /_astro/ script');
  const icon = readdirSync(join(dist, 'icons')).find((f) => f.endsWith('.png'));
  for (const path of [asset, `/icons/${icon}`, '/data/facilities.json', '/manifest.webmanifest', '/sw.js']) {
    const response = await get(path);
    if (response && response.status !== 200) problems.push(`${path}: ${response.status}, not 200`);
  }

  // 404s, in the right language: the general ones, the place ones, and Check's in a build without it.
  const missing = [
    ['/no-such-page-x1', '404.html'],
    ['/fil/no-such-page-x1', 'fil/404.html'],
    ['/place/no-such-place-x1', 'place/404.html'],
    ['/fil/place/no-such-place-x1', 'fil/place/404.html'],
    ...(withCheck ? [] : [['/check', '404.html'], ['/fil/check', 'fil/404.html']]),
  ];
  for (const [path, file] of missing) {
    const response = await get(path);
    if (!response) continue;
    if (response.status !== 404) problems.push(`${path}: ${response.status}, not 404${path.endsWith('/check') ? ' (this build leaves Check out, Q9)' : ''}`);
    else if (response.text !== built(file)) problems.push(`${path}: not the page in dist/${file}`);
  }

  return { problems, errors, stopped, checked, pages: pages.length + 4, production };
}

async function main() {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url));
  const origin = parseOrigin(process.argv[2]);
  if (!origin) {
    console.error('post-deploy-check: give the deployed origin, http: or https:, e.g. https://example.org');
    process.exit(2);
  }
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(readFileSync(join(dist, 'index.html'), 'utf8'))?.[1];
  if (canonical && new URL(canonical).origin !== origin) console.warn(`post-deploy-check: warning: checking ${origin}, but this build's canonical origin is ${new URL(canonical).origin}.`);

  const { problems, errors, stopped, checked, pages, production } = await checkSite(origin, dist);
  for (const problem of problems) console.error(`post-deploy-check: ${problem}`);
  for (const error of errors) console.error(`post-deploy-check: couldn't check ${error}`);
  if (stopped) console.error(`post-deploy-check: ${stopped}.`);
  if (errors.length) {
    console.error(`post-deploy-check: incomplete: ${errors.length} request(s) failed on ${origin}${problems.length ? `, and ${problems.length} problem(s) found` : ''}.`);
    process.exit(3);
  }
  if (problems.length) {
    console.error(`post-deploy-check: ${problems.length} problem(s) on ${origin}.`);
    process.exit(1);
  }
  console.log(`post-deploy-check: ${origin} matches dist/: ${checked} responses, ${pages} pages identical, no cookies, every response's headers exactly as dist/_headers sets them, 404s right (${production ? 'production' : 'not production: noindex'}).`);
}

if (isMain(import.meta.url)) {
  await main().catch((error) => {
    console.error(`post-deploy-check: failed: ${error.message}`);
    process.exit(3);
  });
}
