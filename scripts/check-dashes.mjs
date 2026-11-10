#!/usr/bin/env node
// No em dashes in what the pages say (V8, 4 Nov 2026; step 15.1's "a scan of dist/ finds no
// '—' in any text node, <title>, meta description or og:* tag"). Runs after every build, as
// check-links does, and fails it when an em dash (U+2014, or &mdash;, &#8212;, &#x2014;, or
// &#151; and &#x97;, which HTML also reads as one) is in a page's text, its <title>, its meta
// description or an og:* tag. En dashes stay: ranges and empty table cells use them (V8).
// That includes the clinic data a page shows: a place page puts the clinic's name in its <h1>,
// <title> and og:title, and its address and the rest in its text, so an em dash in a clinic's
// PhilHealth row fails the build too.
// It also lists, without failing, em dashes in what a page can show later or elsewhere: island
// props, inline JSON (the in-place language strings), other attributes (aria-label, alt, title
// and the like), scripts, styles and the JSON files, the clinic data file among them.
//
//   node scripts/check-dashes.mjs           checks dist/
//   node scripts/check-dashes.mjs <folder>  checks another build (the unit tests use one)

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './is-main.mjs';

/**
 * An em dash (U+2014): the character, or a character reference to it (named ones are
 * case-sensitive). HTML also reads the numeric references 151 and x97 as an em dash: its
 * parser maps them to U+2014, as windows-1252 does.
 */
export const EM_DASH = /—|&mdash;|&#0*8212(?:;|(?![0-9]))|&#[xX]0*2014(?:;|(?![0-9a-fA-F]))|&#0*151(?:;|(?![0-9]))|&#[xX]0*97(?:;|(?![0-9a-fA-F]))/;
/** In a script or JSON it can also be a JavaScript or JSON escape: backslash, "u2014" or "u{2014}". */
const EM_DASH_CODE = new RegExp(String.raw`${EM_DASH.source}|\\u2014|\\u\{0*2014\}`);
/** In CSS, a CSS escape: backslash, then "2014" (with up to two leading zeros). */
const EM_DASH_CSS = new RegExp(String.raw`${EM_DASH.source}|\\0{0,2}2014(?![0-9a-fA-F])`);

/** @typedef {{ where: string, excerpt: string }} Found */
/** @typedef {Found & { file: string }} FoundIn */

/** The clinic data the pages load (scripts/prepare-data.mjs writes it). */
export const CLINIC_DATA = 'data/facilities.json';

/** What is listed without failing, in the order the report gives. */
export const LISTED = {
  props: 'island props',
  json: 'inline JSON',
  attributes: 'other attributes',
  scripts: 'scripts',
  styles: 'styles',
  clinics: `clinic data (${CLINIC_DATA})`,
  data: 'other JSON files',
};

// A start tag and its attributes (quoted, unquoted or bare).
const TAG = /<([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/y;
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
// Elements whose content is text up to their end tag: not markup.
const RAW_TEXT = new Set(['script', 'style', 'title', 'textarea']);

/**
 * About 60 characters around the first em dash, on one line.
 * @param {string} text
 * @param {RegExp} [pattern]
 * @returns {string}
 */
export function excerpt(text, pattern = EM_DASH) {
  const flat = text.replace(/\s+/g, ' ');
  const at = flat.search(pattern);
  const start = Math.max(0, at - 30);
  const end = Math.min(flat.length, at + 30);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end).trim()}${end < flat.length ? '…' : ''}`;
}

function attributesOf(source) {
  const out = [];
  for (const [, name, double, single, bare] of source.matchAll(ATTRIBUTE)) out.push([name.toLowerCase(), double ?? single ?? bare ?? '']);
  return out;
}

/** A meta tag the owner's scan covers: the description and every og:* tag. */
function isCheckedMeta(attrs) {
  const key = (attrs.get('property') ?? attrs.get('name') ?? '').toLowerCase();
  return key === 'description' || key.startsWith('og:');
}

/**
 * One page's HTML.
 *   failed   em dashes in text nodes, <title>, the meta description and og:* tags: [{ where, excerpt }]
 *   listed   em dashes elsewhere in the page, by LISTED key: [{ where, excerpt }]
 *   counts   the text nodes and tags read, for the report
 * @param {string} html
 * @returns {{ failed: Found[], listed: Record<string, Found[]>, counts: { text: number, tags: number } }}
 */
export function scanHtml(html) {
  /** @type {Found[]} */
  const failed = [];
  /** @type {Record<string, Found[]>} */
  const listed = {};
  const counts = { text: 0, tags: 0 };
  const list = (key, where, text, pattern = EM_DASH) => (listed[key] ??= []).push({ where, excerpt: excerpt(text, pattern) });
  const text = (chunk, where = 'text') => {
    if (!chunk.trim()) return;
    counts.text += 1;
    if (EM_DASH.test(chunk)) failed.push({ where, excerpt: excerpt(chunk) });
  };

  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    text(html.slice(i, lt === -1 ? html.length : lt));
    if (lt === -1) break;
    const skipTo = (marker, from) => {
      const at = html.indexOf(marker, from);
      return at === -1 ? html.length : at + marker.length;
    };
    if (html.startsWith('<!--', lt)) {
      i = skipTo('-->', lt + 4);
      continue;
    }
    if (html.startsWith('<![CDATA[', lt)) {
      const end = skipTo(']]>', lt + 9);
      text(html.slice(lt + 9, end - 3));
      i = end;
      continue;
    }
    if (/^<[!?/]/.test(html.slice(lt, lt + 2))) {
      i = skipTo('>', lt);
      continue;
    }
    TAG.lastIndex = lt;
    const tag = TAG.exec(html);
    if (!tag) {
      // A "<" that starts no tag is text.
      text('<');
      i = lt + 1;
      continue;
    }
    i = TAG.lastIndex;
    const name = tag[1].toLowerCase();
    const attrList = attributesOf(tag[2]);
    const attrs = new Map(attrList);
    for (const [attr, value] of attrList) {
      if (name === 'meta' && attr === 'content' && isCheckedMeta(attrs)) {
        counts.tags += 1;
        if (EM_DASH.test(value)) failed.push({ where: `<meta ${attrs.has('property') ? `property="${attrs.get('property')}"` : `name="${attrs.get('name')}"`}>`, excerpt: excerpt(value) });
      } else if (EM_DASH.test(value)) {
        if (name === 'astro-island' && attr === 'props') list('props', `<astro-island> props`, value);
        else list('attributes', `<${name} ${attr}>`, value);
      }
    }
    if (!RAW_TEXT.has(name)) continue;
    const close = new RegExp(`</${name}\\s*>`, 'ig');
    close.lastIndex = i;
    const end = close.exec(html);
    const content = html.slice(i, end ? end.index : html.length);
    i = end ? close.lastIndex : html.length;
    if (name === 'title') {
      counts.tags += 1;
      if (EM_DASH.test(content)) failed.push({ where: '<title>', excerpt: excerpt(content) });
    } else if (name === 'textarea') {
      text(content, '<textarea>');
    } else if (name === 'style') {
      if (EM_DASH_CSS.test(content)) list('styles', '<style>', content, EM_DASH_CSS);
    } else if (/json/i.test(attrs.get('type') ?? '')) {
      if (EM_DASH_CODE.test(content)) list('json', `<script type="${attrs.get('type')}">`, content, EM_DASH_CODE);
    } else if (EM_DASH_CODE.test(content)) {
      list('scripts', '<script>', content, EM_DASH_CODE);
    }
  }
  return { failed, listed, counts };
}

/**
 * The JSON paths of the strings that carry an em dash, or null when the file isn't JSON.
 * @param {string} source
 * @returns {Found[] | null}
 */
export function jsonDashes(source) {
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    return null;
  }
  /** @type {Found[]} */
  const out = [];
  const walk = (node, path) => {
    if (typeof node === 'string') {
      if (EM_DASH.test(node)) out.push({ where: path || '(the file)', excerpt: excerpt(node) });
    } else if (Array.isArray(node)) node.forEach((item, k) => walk(item, `${path}[${k}]`));
    else if (node && typeof node === 'object') for (const [key, item] of Object.entries(node)) walk(item, path ? `${path}.${key}` : key);
  };
  walk(value, '');
  return out;
}

function files(dir, wanted) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path, wanted);
    return wanted.test(entry.name) ? [path] : [];
  });
}

/**
 * The whole check over a build folder.
 *   pages    HTML files read
 *   counts   text nodes and tags read
 *   failed   [{ file, where, excerpt }]: what fails the build
 *   listed   { key: [{ file, where, excerpt }] } by LISTED key: reported, never failed
 * @param {string} dist
 * @returns {{ pages: number, counts: { text: number, tags: number }, failed: FoundIn[], listed: Record<string, FoundIn[]> }}
 */
export function checkDist(dist) {
  /** @type {FoundIn[]} */
  const failed = [];
  /** @type {Record<string, FoundIn[]>} */
  const listed = Object.fromEntries(Object.keys(LISTED).map((key) => [key, []]));
  const counts = { text: 0, tags: 0 };
  const name = (path) => relative(dist, path).split(sep).join('/');
  const pages = files(dist, /\.html$/);
  for (const path of pages) {
    const file = name(path);
    const page = scanHtml(readFileSync(path, 'utf8'));
    counts.text += page.counts.text;
    counts.tags += page.counts.tags;
    failed.push(...page.failed.map((item) => ({ file, ...item })));
    for (const [key, items] of Object.entries(page.listed)) listed[key].push(...items.map((item) => ({ file, ...item })));
  }
  for (const path of files(dist, /\.(?:json|webmanifest)$/)) {
    const file = name(path);
    const source = readFileSync(path, 'utf8');
    const found = jsonDashes(source) ?? (EM_DASH_CODE.test(source) ? [{ where: '(not JSON)', excerpt: excerpt(source, EM_DASH_CODE) }] : []);
    listed[file === CLINIC_DATA ? 'clinics' : 'data'].push(...found.map((item) => ({ file, ...item })));
  }
  for (const [key, wanted, pattern] of [['scripts', /\.m?js$/, EM_DASH_CODE], ['styles', /\.css$/, EM_DASH_CSS]]) {
    for (const path of files(dist, wanted)) {
      const source = readFileSync(path, 'utf8');
      if (pattern.test(source)) listed[key].push({ file: name(path), where: key === 'scripts' ? 'script' : 'stylesheet', excerpt: excerpt(source, pattern) });
    }
  }
  return { pages: pages.length, counts, failed, listed };
}

/**
 * The report's lines: { errors, notes, summary }.
 * @param {ReturnType<typeof checkDist>} result
 * @returns {{ errors: string[], notes: string[], summary: string }}
 */
export function report({ pages, counts, failed, listed }) {
  const n = (count) => count.toLocaleString('en-US');
  const line = (item) => `${item.file}: ${item.where} "${item.excerpt}"`;
  const notes = [];
  for (const [key, label] of Object.entries(LISTED)) {
    const items = listed[key];
    if (!items.length) continue;
    notes.push(`listed, not failed: ${n(items.length)} em dash${items.length > 1 ? 'es' : ''} in ${label}:`);
    notes.push(...items.slice(0, 10).map((item) => `  ${line(item)}`));
    if (items.length > 10) notes.push(`  … and ${n(items.length - 10)} more`);
  }
  const listedTotal = Object.values(listed).reduce((sum, items) => sum + items.length, 0);
  const errors = failed.map(line);
  const also = `Also read, without failing: island props, inline JSON, other attributes, scripts, styles and JSON files, the clinic data among them (${listedTotal ? `${n(listedTotal)} em dash${listedTotal > 1 ? 'es' : ''}, listed above` : 'no em dash'}).`;
  const summary = failed.length
    ? `${n(failed.length)} em dash${failed.length > 1 ? 'es' : ''} in page text, <title>, meta descriptions or og:* tags (V8).`
    : `${n(pages)} page${pages === 1 ? '' : 's'} checked: no em dash in the text (${n(counts.text)} text nodes), <title>, meta description or og:* tags (${n(counts.tags)} tags). ${also}`;
  return { errors, notes, summary };
}

function main() {
  const dist = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../dist/', import.meta.url));
  if (!existsSync(dist)) {
    console.error('check-dashes: no dist/ folder; build first.');
    process.exit(1);
  }
  const result = checkDist(dist);
  const { errors, notes, summary } = report(result);
  for (const note of notes) console.warn(`check-dashes: ${note}`);
  for (const error of errors) console.error(`check-dashes: ${error}`);
  if (errors.length) {
    console.error(`check-dashes: ${summary}`);
    process.exit(1);
  }
  console.log(`check-dashes: ${summary}`);
}

if (isMain(import.meta.url)) main();
