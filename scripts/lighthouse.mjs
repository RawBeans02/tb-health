#!/usr/bin/env node
// Lighthouse on the built site (PLAN §4.6, step 13), mobile settings, one page at a time.
// Run it on its own guarded job, after a production-mode build (the noindex header of other
// builds would cost the SEO score):
//   SITE_URL=https://tbph.example.org TBPH_PRODUCTION=true npm run build
//   GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && node scripts/lighthouse.mjs [page …]'
// With no pages it runs the list below; on a busy machine, pass a few at a time.
// Lighthouse runs through npx at a pinned version (not a project dependency), in Playwright's
// Chromium (CHROME_PATH), never the Mac's own Chrome. Reports go to lighthouse-report/.
// Fails when a page misses a budget:
// every category ≥ 90, Accessibility 100, LCP ≤ 2.5 s, CLS ≤ 0.1.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const LIGHTHOUSE = 'lighthouse@13.5.0';
const PORT = 4323;
const ALL = ['/', '/places', '/place/bangued-rural-health-unit-abra', '/check', '/learn', '/data', '/about', '/install', '/fil', '/fil/places'];
const PAGES = process.argv.length > 2 ? process.argv.slice(2) : ALL;
const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}lighthouse-report`;
mkdirSync(out, { recursive: true });

const server = spawn(process.execPath, ['scripts/serve-dist.mjs', '--port', String(PORT)], { cwd: root, stdio: 'ignore' });
await new Promise((resolve) => setTimeout(resolve, 800));

const failures = [];
try {
  for (const page of PAGES) {
    const name = page === '/' ? 'home' : page.slice(1).replace(/\//g, '_');
    const report = `${out}/${name}.json`;
    const run = spawnSync(
      'npx',
      ['-y', LIGHTHOUSE, `http://127.0.0.1:${PORT}${page}`, '--output=json', `--output-path=${report}`, '--chrome-flags=--headless=new', '--quiet'],
      { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, CHROME_PATH: chromium.executablePath() } },
    );
    if (run.status !== 0) {
      failures.push(`${page}: Lighthouse exited ${run.status}`);
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
  server.kill();
}

if (failures.length) {
  console.error(`lighthouse: below budget (PLAN §4.6):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('lighthouse: every page within budget.');
