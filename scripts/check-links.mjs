#!/usr/bin/env node
// Crawls dist/ after every build (PLAN §4.2) and fails it when:
//   - a Filipino page links to an English page, or the reverse. Language links and
//     hreflang alternates (elements carrying hreflang) are the only exceptions;
//   - an internal link points at a page or file that wasn't built;
//   - a canonical or hreflang link points at a page that wasn't built, or off the site (B41).
// Pages from later steps are in PENDING: links to them only warn until they exist.
// A build without Check (TBPH_CHECK=false, Q9) must not build or link to /check at all, ship
// its island or stylesheet (which the service worker would save), or name the check anywhere
// in a page's HTML: text, title, descriptions, island props, the in-place language JSON.
//
//   node scripts/check-links.mjs

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { langOf, pagePath, toLang } from '../src/lib/i18n.ts';
import { CHECK_NAMES } from '../src/lib/nav.ts';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

// English paths of pages not built yet; remove each as its step lands.
const PENDING = new Set([]);
const withoutCheck = process.env.TBPH_CHECK === 'false';
// Check's island and stylesheet in _astro/. Astro names the island after its component
// (CheckFlow.<hash>.js) and the stylesheet after what imports check.css: the view
// (Check.<hash>.css) or a lone page (_check_.<hash>.css). In case check.css's rules land in
// a stylesheet named otherwise, every stylesheet is also read for .check-main, check.css's
// class for Check's <main>.
const CHECK_ASSET = /^_?check(?:flow)?_?\./i;
const CHECK_CSS = /\.check-main\b/;

function files(dir, wanted) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path, wanted);
    return wanted.test(entry.name) ? [path] : [];
  });
}

const htmlFiles = (dir) => files(dir, /\.html$/);

function attributes(tag) {
  const out = {};
  for (const [, name, double, single, bare] of tag.matchAll(/([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out[name.toLowerCase()] = double ?? single ?? bare ?? '';
  }
  return out;
}

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&#38;/g, '&');
}

/** The built file a site path is served from, or null. */
function builtFile(path) {
  if (/\.\w+$/.test(path)) return existsSync(join(dist, path)) ? path : null;
  const file = path === '/' ? '/index.html' : `${path}.html`;
  return existsSync(join(dist, file)) ? file : null;
}

if (!existsSync(dist)) {
  console.error('check-links: no dist/ folder; build first.');
  process.exit(1);
}

const errors = [];
const pending = new Map();
let links = 0;
let headLinks = 0;
// The site's origin, read from the home page's canonical (SITE_URL, Q7).
const homeCanonical = existsSync(join(dist, 'index.html')) ? /<link rel="canonical" href="([^"]+)"/.exec(readFileSync(join(dist, 'index.html'), 'utf8'))?.[1] : undefined;
const site = homeCanonical ? new URL(homeCanonical).origin : null;

for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const page = pagePath(`/${relative(dist, file)}`);
  const named = withoutCheck && CHECK_NAMES.exec(html)?.[0];
  if (named) errors.push(`${page}: names the check ("${named}"), but this build leaves Check out (TBPH_CHECK=false)`);
  const pageLang = /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1];
  if (pageLang !== 'en' && pageLang !== 'fil') {
    errors.push(`${page}: <html lang> is ${JSON.stringify(pageLang)}`);
    continue;
  }
  // Head links: canonical and hreflang alternates name built pages on the site's origin.
  for (const [tag] of html.matchAll(/<link\s[^>]*>/g)) {
    const attrs = attributes(tag.slice(5, -1));
    if (attrs.rel !== 'canonical' && attrs.rel !== 'alternate') continue;
    headLinks += 1;
    const url = new URL(decode(attrs.href ?? ''), 'https://site.invalid');
    if (url.origin !== site) errors.push(`${page}: ${attrs.rel} ${attrs.href} is not on the site's origin (${site})`);
    else if (url.search || url.hash) errors.push(`${page}: ${attrs.rel} ${attrs.href} carries a query or hash`);
    else if (!builtFile(url.pathname)) errors.push(`${page}: ${attrs.rel} ${attrs.href} wasn't built`);
  }
  for (const [tag] of html.matchAll(/<a\s[^>]*>/g)) {
    const attrs = attributes(tag.slice(2, -1));
    const href = attrs.href === undefined ? undefined : decode(attrs.href);
    if (!href || !href.startsWith('/') || href.startsWith('//')) continue; // anchors, tel:, external
    links += 1;
    const path = new URL(href, 'https://site.invalid').pathname;
    const isPage = !/\.\w+$/.test(path);
    if (isPage && attrs.hreflang === undefined && langOf(path) !== pageLang) {
      errors.push(`${page} (${pageLang}): links to ${href}, a ${langOf(path)} page`);
    }
    const english = isPage ? toLang(path, 'en') : path;
    if (withoutCheck && english === '/check') {
      errors.push(`${page}: links to ${href}, but this build leaves Check out (TBPH_CHECK=false)`);
      continue;
    }
    if (builtFile(path)) continue;
    if (PENDING.has(english)) pending.set(english, (pending.get(english) ?? 0) + 1);
    else errors.push(`${page}: links to ${href}, which wasn't built`);
  }
}

if (withoutCheck) {
  for (const path of ['/check', '/fil/check']) if (builtFile(path)) errors.push(`${path} was built, but this build leaves Check out (TBPH_CHECK=false)`);
  // build-sw.mjs precaches everything in _astro/, so this also keeps Check out of the service worker.
  const assets = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')) : [];
  const isCheck = (name) => CHECK_ASSET.test(name) || (name.endsWith('.css') && CHECK_CSS.test(readFileSync(join(dist, '_astro', name), 'utf8')));
  for (const name of assets.filter(isCheck)) errors.push(`_astro/${name} is Check's, but this build leaves Check out (TBPH_CHECK=false)`);
  // Nor any other text file it ships: scripts, styles, data, the service worker, the manifest.
  for (const file of files(dist, /\.(?:js|mjs|css|json|webmanifest|xml|txt)$/)) {
    const named = CHECK_NAMES.exec(readFileSync(file, 'utf8'))?.[0];
    if (named) errors.push(`${relative(dist, file)}: names the check ("${named}"), but this build leaves Check out (TBPH_CHECK=false)`);
  }
}

if (pending.size) {
  const list = [...pending].map(([path, n]) => `${path} (${n})`).join(', ');
  console.warn(`check-links: links to pages from later steps, not built yet: ${list}`);
}
for (const error of errors) console.error(`check-links: ${error}`);
if (errors.length) {
  console.error(`check-links: ${errors.length} problem(s).`);
  process.exit(1);
}
console.log(`check-links: ${links} internal links and ${headLinks} canonical and hreflang links checked, languages match.`);
if (withoutCheck) console.log('check-links: without Check: no /check page, link, _astro/ file, or page or file naming the check.');
