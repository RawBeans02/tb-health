#!/usr/bin/env node
// Lighthouse on the built site (PLAN §4.6, step 13), mobile settings (or `--desktop`, Lighthouse's
// desktop preset: audit B66), one page at a time.
// Run it on its own guarded job, after a production-mode build (the noindex header of other
// builds would cost the SEO score):
//   SITE_URL=https://tbph.example.org TBPH_PRODUCTION=true npm run build
//   GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && node scripts/lighthouse.mjs [--desktop] [page …]'
// With no pages it runs the list below, less the pages this build doesn't have (it says which:
// a build without Check has no /check, which would be audited as the 404 page); on a busy
// machine, pass a few at a time.
// It serves dist/ on a free port the system picks, so it never audits a server another run or
// checkout left running. Lighthouse runs through npx at a pinned version (not a project
// dependency) and attaches to a Chromium this script launches through Playwright (never the
// Mac's own Chrome), so a stop by the memory guard closes the browser too. Reports go to
// lighthouse-report/ (desktop ones end in .desktop.json).
// Fails when a page misses a budget:
// every category ≥ 90, Accessibility 100, LCP ≤ 2.5 s, CLS ≤ 0.1.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMain } from './is-main.mjs';

const LIGHTHOUSE = 'lighthouse@13.5.0';
export const ALL = ['/', '/places', '/place/bangued-rural-health-unit-abra', '/check', '/learn', '/data', '/about', '/install', '/fil', '/fil/places'];

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
  const ARGS = process.argv.slice(2).filter((a) => a !== '--desktop');
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
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] });
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
      const name = page === '/' ? 'home' : page.slice(1).replace(/\//g, '_');
      const report = `${out}/${name}${DESKTOP ? '.desktop' : ''}.json`;
      const status = await run('npx', ['-y', LIGHTHOUSE, `${origin}${page}`, `--port=${DEBUG_PORT}`, '--output=json', `--output-path=${report}`, '--quiet', ...(DESKTOP ? ['--preset=desktop'] : [])]);
      if (status !== 0) {
        failures.push(`${page}: Lighthouse exited ${status}`);
        continue;
      }
      const lhr = JSON.parse(readFileSync(report, 'utf8'));
      const score = (id) => Math.round(lhr.categories[id].score * 100);
      const lcp = lhr.audits['largest-contentful-paint'].numericValue / 1000;
      const cls = lhr.audits['cumulative-layout-shift'].numericValue;
      const tbt = lhr.audits['total-blocking-time'].numericValue;
      const scores = { performance: score('performance'), accessibility: score('accessibility'), 'best-practices': score('best-practices'), seo: score('seo') };
      console.log(`${page.padEnd(40)} perf ${scores.performance}  a11y ${scores.accessibility}  bp ${scores['best-practices']}  seo ${scores.seo}  LCP ${lcp.toFixed(2)} s  CLS ${cls.toFixed(3)}  TBT ${Math.round(tbt)} ms`);
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
