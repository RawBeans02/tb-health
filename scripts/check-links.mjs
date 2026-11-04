#!/usr/bin/env node
// Crawls dist/ after every build (PLAN §4.2) and fails it when:
//   - a Filipino page links to an English page, or the reverse. Language links and
//     hreflang alternates (elements carrying hreflang) are the only exceptions;
//   - an internal link points at a page or file that wasn't built.
// Pages from later steps are in PENDING: links to them only warn until they exist.
// A build without Check (TBPH_CHECK=false, Q9) must not build or link to /check at all.
//
//   node scripts/check-links.mjs

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { langOf, pagePath, toLang } from '../src/lib/i18n.ts';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

// English paths of pages not built yet; remove each as its step lands.
const PENDING = new Set(['/place', '/check', '/learn', '/data', '/about', '/install']);
const withoutCheck = process.env.TBPH_CHECK === 'false';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

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

for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const page = pagePath(`/${relative(dist, file)}`);
  const pageLang = /<html[^>]*\blang="([^"]+)"/.exec(html)?.[1];
  if (pageLang !== 'en' && pageLang !== 'fil') {
    errors.push(`${page}: <html lang> is ${JSON.stringify(pageLang)}`);
    continue;
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
    const english = isPage ? toLang(path, 'en').replace(/^\/place\/.*/, '/place') : path;
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
console.log(`check-links: ${links} internal links checked, languages match.`);
