#!/usr/bin/env node
// After a deploy (PLAN §4.5, step 14): reads the live site back and compares it with dist/.
// The owner runs it once per deploy; it requests only the site's own pages and files.
//   - every page in the sitemap answers 200, with HTML identical to dist/ (no host feature
//     injected a script or rewrote the page) and no Set-Cookie on any response;
//   - the _headers rules are served: security headers on pages, noindex only off production,
//     Cache-Control on hashed assets, data, the manifest and sw.js (L5, L6);
//   - an unknown address gets a 404 in its language, and /check one in a build without it.
//
//   node scripts/post-deploy-check.mjs https://the-live-site.example
//   (the local server works too: node scripts/post-deploy-check.mjs http://127.0.0.1:4322)

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = process.argv[2] ? new URL(process.argv[2]).origin : null;
if (!origin) {
  console.error('post-deploy-check: give the deployed origin, e.g. https://example.org');
  process.exit(2);
}

const problems = [];
const fail = (text) => problems.push(text);
const builtFile = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

async function get(path) {
  const response = await fetch(new URL(path, origin), { redirect: 'manual' });
  if (response.headers.get('set-cookie')) fail(`${path}: sets a cookie`);
  return response;
}

const production = !/X-Robots-Tag: noindex/.test(readFileSync(`${dist}_headers`, 'utf8'));
const withCheck = existsSync(`${dist}check.html`);

// Pages: every sitemap URL, plus the stand-ins, by path on the deployed origin.
const sitemap = readFileSync(`${dist}sitemap.xml`, 'utf8');
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].replace(/&amp;/g, '&')).pathname);
for (const path of [...pages, '/offline', '/fil/offline', '/place', '/fil/place']) {
  const response = await get(path);
  if (response.status !== 200) {
    fail(`${path}: ${response.status}${response.headers.get('location') ? ` to ${response.headers.get('location')}` : ''}, not 200`);
    continue;
  }
  const html = await response.text();
  if (html !== readFileSync(`${dist}${builtFile(path)}`, 'utf8')) fail(`${path}: the HTML served differs from dist/${builtFile(path)}`);
}

// Headers on a page.
const page = await get('/');
const want = {
  'strict-transport-security': /^max-age=\d+/,
  'content-security-policy': /frame-ancestors 'none'/,
  'permissions-policy': /geolocation=\(self\)/,
  'x-content-type-options': /^nosniff$/,
  'referrer-policy': /^strict-origin-when-cross-origin$/,
};
for (const [name, pattern] of Object.entries(want)) if (!pattern.test(page.headers.get(name) ?? '')) fail(`/: ${name} is ${JSON.stringify(page.headers.get(name))}`);
const robots = page.headers.get('x-robots-tag') ?? '';
if (production && /noindex/.test(robots)) fail('/: a production deploy says noindex');
if (!production && !/noindex/.test(robots)) fail('/: a non-production deploy is missing X-Robots-Tag: noindex');

// Cache-Control (L6).
const asset = /\/_astro\/[^"]+\.js/.exec(readFileSync(`${dist}index.html`, 'utf8'))?.[0];
const cache = [
  [asset, /immutable/],
  ['/data/facilities.json', /max-age=0/],
  ['/manifest.webmanifest', /max-age=0/],
  ['/sw.js', /no-cache|max-age=0/],
];
for (const [path, pattern] of cache) {
  const value = (await get(path)).headers.get('cache-control') ?? '';
  if (!pattern.test(value)) fail(`${path}: Cache-Control is ${JSON.stringify(value)}`);
}

// 404s, in the right language.
for (const [path, file] of [['/no-such-page-x1', '404.html'], ['/fil/no-such-page-x1', 'fil/404.html'], ['/place/no-such-place-x1', 'place/404.html']]) {
  const response = await get(path);
  if (response.status !== 404) fail(`${path}: ${response.status}, not 404`);
  else if ((await response.text()) !== readFileSync(`${dist}${file}`, 'utf8')) fail(`${path}: not the page in dist/${file}`);
}
if (!withCheck && (await get('/check')).status !== 404) fail('/check: answers, but this build leaves Check out (Q9)');

for (const problem of problems) console.error(`post-deploy-check: ${problem}`);
if (problems.length) {
  console.error(`post-deploy-check: ${problems.length} problem(s) on ${origin}.`);
  process.exit(1);
}
console.log(`post-deploy-check: ${origin} matches dist/: ${pages.length + 4} pages identical, no cookies, headers and caching as set, 404s right (${production ? 'production' : 'not production: noindex'}).`);
