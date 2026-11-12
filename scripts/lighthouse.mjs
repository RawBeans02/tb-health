#!/usr/bin/env node
// Lighthouse on the built site (PLAN §4.6, step 13), mobile settings (or `--desktop`, Lighthouse's
// desktop preset: audit B66), one page at a time, in light mode (or `--dark`, step 15.7: V7).
// Run it on its own guarded job, after a production-mode build (the noindex header of other
// builds would cost the SEO score):
//   SITE_URL=https://tbph.example.org TBPH_PRODUCTION=true npm run build
//   GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && node scripts/lighthouse.mjs [--desktop] [--dark] [page …]'
// With no pages it runs the list below, less the pages this build doesn't have (it says which:
// a build without Check has no /check, which would be audited as the 404 page); on a busy
// machine, pass a few at a time.
// It serves dist/ on a free port the system picks, so it never audits a server another run or
// checkout left running. Lighthouse runs through npx at a pinned version (not a project
// dependency) and attaches to a Chromium this script launches through Playwright (never the
// Mac's own Chrome), so a stop by the memory guard closes the browser too. Reports go to
// lighthouse-report/ (desktop ones end in .desktop.json, dark ones in .dark.json).
// The scheme: Lighthouse has no setting for it, and the tab it opens isn't one of Playwright's,
// so the browser itself is launched preferring light or dark (schemeArg), never the Mac's own
// appearance. Each report's final screenshot is then checked to be in that scheme.
// Fails when a page misses a budget:
// every category ≥ 90, Accessibility 100, LCP ≤ 2.5 s, CLS ≤ 0.1.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './is-main.mjs';

const LIGHTHOUSE = 'lighthouse@13.5.0';
export const ALL = ['/', '/places', '/place/bangued-rural-health-unit-abra', '/check', '/learn', '/data', '/about', '/install', '/fil', '/fil/places'];

/**
 * The Blink settings Playwright's headless Chromium launches with (1.64.1: a mouse, so hover
 * and a fine pointer). Chromium keeps only the last `--blink-settings`, so schemeArg repeats
 * them; a unit test fails if Playwright's change.
 */
export const PLAYWRIGHT_BLINK_SETTINGS = 'primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4';

/**
 * The launch switch that makes every page in the browser prefer dark or light: Blink's
 * preferredColorScheme, 0 dark and 1 light. Tried on 12 Nov 2026 against the tab Lighthouse
 * opens: with no switch it was light (the Mac was set to dark), and `--force-dark-mode` left it
 * light.
 */
export const schemeArg = (dark) => `--blink-settings=${PLAYWRIGHT_BLINK_SETTINGS},preferredColorScheme=${dark ? 0 : 1}`;

/** A page's report file: home, places, place_…, fil_places, then .desktop and .dark as run. */
export function reportName(page, { desktop = false, dark = false } = {}) {
  const name = page === '/' ? 'home' : page.slice(1).replace(/\//g, '_');
  return `${name}${desktop ? '.desktop' : ''}${dark ? '.dark' : ''}.json`;
}

/**
 * The scheme a screenshot shows, from its mean luminance (0 to 255): the pages' light canvas
 * is #F1F3F4 (about 242) and the dark one #0E1417 (about 19); in between, neither.
 */
export function schemeOf(meanLuminance) {
  if (meanLuminance >= 160) return 'light';
  if (meanLuminance <= 100) return 'dark';
  return null;
}

/** The mean luminance of a report's final screenshot, decoded in a page of its own; null without one. */
async function screenshotLuminance(browser, lhr) {
  const data = lhr.audits['final-screenshot']?.details?.data;
  if (!data) return null;
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    return await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 0; i < px.length; i += 4) sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      return sum / (px.length / 4);
    }, data);
  } finally {
    await context.close();
  }
}

/** The pages of ALL that `dist` has a file for, as serve-dist serves them (/ → index.html, /places → places.html), and the rest. */
export function builtPages(dist) {
  const has = (page) => existsSync(join(dist, page === '/' ? 'index.html' : `${page.slice(1)}.html`));
  return { pages: ALL.filter(has), skipped: ALL.filter((page) => !has(page)) };
}

/** Starts serve-dist on a free port; resolves with its origin once it listens, or rejects if it stops first. */
function serve(root) {
  const server = spawn(process.execPath, ['scripts/serve-dist.mjs', '--port', '0'], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
  const origin = new Promise((resolve, reject) => {
    let text = '';
    server.stdout.setEncoding('utf8').on('data', (chunk) => {
      text += chunk;
      const url = /http:\/\/127\.0\.0\.1:\d+/.exec(text);
      if (url) resolve(url[0]);
    });
    server.once('exit', (code) => reject(new Error(`serve-dist stopped (exit ${code}) before it listened`)));
  });
  return { server, origin };
}

async function main() {
  const DESKTOP = process.argv.includes('--desktop');
  const DARK = process.argv.includes('--dark');
  const SCHEME = DARK ? 'dark' : 'light';
  const ARGS = process.argv.slice(2).filter((a) => a !== '--desktop' && a !== '--dark');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const built = builtPages(join(root, 'dist'));
  const PAGES = ARGS.length ? ARGS : built.pages;
  if (!ARGS.length && built.skipped.length) console.log(`lighthouse: skipping ${built.skipped.join(', ')}: not in this build's dist/`);
  if (!PAGES.length) {
    console.error('lighthouse: dist/ has none of the pages: build first.');
    process.exit(2);
  }
  const out = `${root}lighthouse-report`;
  mkdirSync(out, { recursive: true });

  const { chromium } = await import('@playwright/test');
  const DEBUG_PORT = 9333;
  const { server, origin: listening } = serve(root);
  const origin = await listening.catch((error) => {
    console.error(`lighthouse: ${error.message}`);
    process.exit(1);
  });
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`, schemeArg(DARK)] });
  let child = null;
  const stop = async () => {
    child?.kill('SIGTERM');
    server.kill();
    await browser.close().catch(() => {});
  };
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => stop().then(() => process.exit(1)));

  /** Runs one command and resolves with its exit code; `child` is it, for a stop signal. */
  const run = (command, args) =>
    new Promise((resolve) => {
      // CHROME_PATH too: if Lighthouse can't attach and launches a browser, it's still Playwright's.
      child = spawn(command, args, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, CHROME_PATH: chromium.executablePath() } });
      child.on('exit', (code) => resolve(code ?? 1));
    });

  const failures = [];
  try {
    for (const page of PAGES) {
      const report = `${out}/${reportName(page, { desktop: DESKTOP, dark: DARK })}`;
      const status = await run('npx', ['-y', LIGHTHOUSE, `${origin}${page}`, `--port=${DEBUG_PORT}`, '--output=json', `--output-path=${report}`, '--quiet', ...(DESKTOP ? ['--preset=desktop'] : [])]);
      if (status !== 0) {
        failures.push(`${page}: Lighthouse exited ${status}`);
        continue;
      }
      const lhr = JSON.parse(readFileSync(report, 'utf8'));
      const luminance = await screenshotLuminance(browser, lhr);
      const shown = luminance === null ? null : schemeOf(luminance);
      if (shown !== SCHEME) failures.push(`${page}: the final screenshot isn't ${SCHEME} (${luminance === null ? 'no screenshot' : `mean luminance ${Math.round(luminance)}`})`);
      const score = (id) => Math.round(lhr.categories[id].score * 100);
      const lcp = lhr.audits['largest-contentful-paint'].numericValue / 1000;
      const cls = lhr.audits['cumulative-layout-shift'].numericValue;
      const tbt = lhr.audits['total-blocking-time'].numericValue;
      const scores = { performance: score('performance'), accessibility: score('accessibility'), 'best-practices': score('best-practices'), seo: score('seo') };
      console.log(`${page.padEnd(40)} ${shown ?? '?'}  perf ${scores.performance}  a11y ${scores.accessibility}  bp ${scores['best-practices']}  seo ${scores.seo}  LCP ${lcp.toFixed(2)} s  CLS ${cls.toFixed(3)}  TBT ${Math.round(tbt)} ms`);
      for (const [id, value] of Object.entries(scores)) if (value < (id === 'accessibility' ? 100 : 90)) failures.push(`${page}: ${id} ${value}`);
      if (lcp > 2.5) failures.push(`${page}: LCP ${lcp.toFixed(2)} s`);
      if (cls > 0.1) failures.push(`${page}: CLS ${cls.toFixed(3)}`);
    }
  } finally {
    await stop();
  }

  if (failures.length) {
    console.error(`lighthouse: below budget (PLAN §4.6):\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log('lighthouse: every page within budget.');
}

if (isMain(import.meta.url)) await main();
