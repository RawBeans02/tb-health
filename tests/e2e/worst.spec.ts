// Step 15.4, worst-case data (docs/step-15-fix-pass.md; the break-ui skill): Home's route, Places
// and the place pages with the full list's worst real rows, on emulated phones at 320 and 390px, in
// English and Filipino, light and dark. Every state must have no sideways scroll, nothing off the
// screen or cut off, no template leftovers, no target under 44px and no text under 14px, and is
// saved as a full-page screenshot for the report. Then "Show more" through the 403 NCR centers
// with the CPU slowed 4×: no long task over 200 ms, with the timings and a trace saved.
//
// The list is dist/data/facilities-worst.json (scripts/prepare-data.mjs, worstFullFacilities),
// read through the ?data=worst switch (src/lib/core/data.ts), which only `astro dev` and
// `npm run build:worst` have. Runs only when WORST_DIR is set, and in Chromium only, which
// emulates phones and slows the CPU. On the 8 GB Mac, each step through the guard:
//   npm run build:worst
//   WORST_DIR=<folder> npx playwright test tests/e2e/worst.spec.ts --project=chromium
//   npm run build:sample   (the other specs count on the sample)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { places as text } from '../../src/content/places.ts';
import { buildDataset, type FacilitiesFile } from '../../src/lib/core/data.ts';
import { km, matchPlace } from '../../src/lib/core/geo.ts';
import { filterPlaces, NO_FILTERS, type PlaceFilters } from '../../src/lib/core/places.ts';
import { harnessProbe, outsideProblems } from './probes.ts';

const DIR = process.env.WORST_DIR ? resolve(process.env.WORST_DIR) : '';

test.skip(!DIR, 'The step 15.4 worst-case pass runs only when WORST_DIR is set, after npm run build:worst.');
test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only: it emulates phones and slows the CPU.');
test.describe.configure({ timeout: 600_000 });

type Lang = 'en' | 'fil';

function worstFile(): FacilitiesFile {
  try {
    return JSON.parse(readFileSync('dist/data/facilities-worst.json', 'utf8'));
  } catch {
    throw new Error('worst.spec: dist/data/facilities-worst.json is missing: run `npm run build:worst` first.');
  }
}

const file = DIR ? worstFile() : null;
const data = file ? buildDataset(file) : null;
const list = data?.list ?? [];
// The worst rows prepare-data moved to Quezon City, in its order: Places lists them first.
const moved = (file?.facilities ?? []).filter((row) => row.geo_precision === 'synthetic').map((row) => row.id);
const count = (f: Partial<PlaceFilters>) => filterPlaces(list, { ...NO_FILTERS, ...f }, null, false).rows.length;

// The states that aren't one list: one result (the longest name), 403 (NCR) and 21, where
// "Show more" has one left; the region furthest from Basco, for four-digit distances.
const byLength = [...list].sort((a, b) => b.name.length - a.name.length);
const one = byLength.slice(0, 20).find((p) => count({ q: p.name }) === 1);
const byProv = new Map<string, { region: string; prov: string; n: number }>();
for (const p of list) {
  const key = `${p.code}|${p.prov}`;
  byProv.set(key, { region: p.code, prov: p.prov, n: (byProv.get(key)?.n ?? 0) + 1 });
}
const over20 = [...byProv.values()].filter((g) => g.n > 20).sort((a, b) => a.n - b.n)[0];
const basco = data ? matchPlace('Basco', data.gaz) : null;
const away = (p: (typeof list)[number]) => (basco && p.lat !== null && p.lng !== null ? km(basco, { lat: p.lat, lng: p.lng }) : -1);
const furthest = basco ? [...list].sort((a, b) => away(b) - away(a))[0] : null;

const PHONES = [
  { width: 320, height: 640, deviceScaleFactor: 2 },
  { width: 390, height: 844, deviceScaleFactor: 3 },
] as const;

function url(lang: Lang, path: string, query = 'data=worst') {
  const base = lang === 'fil' ? (path === '/' ? '/fil' : `/fil${path}`) : path;
  return `${base}?${query}`;
}

const idOf = (href: string) => new URL(href).pathname.split('/').pop() ?? '';

/** The QA matrix's checks, soft so one run lists every break, then the screenshot. */
async function check(page: Page, shot: string) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const r = await harnessProbe(page);
  expect.soft(r.sideways, `${shot}: sideways scroll`).toBeLessThanOrEqual(0);
  expect.soft(await outsideProblems(page, 'main *'), `${shot}: off the screen or cut off`).toEqual([]);
  expect.soft(r.holes, `${shot}: template leftovers`).toEqual([]);
  expect.soft(r.small, `${shot}: targets under 44px`).toEqual([]);
  expect.soft(r.tiny, `${shot}: text under 14px`).toEqual([]);
  // A phone field's lines break only between its numbers (each .phone-number on one line).
  const split = await page.locator('.phone-number').evaluateAll((spans) => spans.filter((s) => s.getClientRects().length > 1 || s.getBoundingClientRect().height > 40).map((s) => s.textContent));
  expect.soft(split, `${shot}: phone numbers broken across lines`).toEqual([]);
  // From the top, so the fixed header and tab bar are drawn there, not over the middle.
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: join(DIR, shot), fullPage: true, scale: 'css', animations: 'disabled' });
}

/** Sets filters through the Filters sheet, as a phone does. */
async function filter(page: Page, f: Partial<PlaceFilters>) {
  await page.locator('.filters-button').click();
  await expect(page.locator('#sheet-h')).toBeFocused();
  if (f.region !== undefined) await page.locator('#sheet-region').selectOption(f.region);
  if (f.prov !== undefined) await page.locator('#sheet-prov').selectOption(f.prov);
  if (f.q !== undefined) await page.locator('#sheet-q').fill(f.q);
  await page.locator('.sheet-done').click();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
}

const heading = (page: Page) => page.locator('.places-toolbar h2');
const rowIds = (page: Page, scope: string) => page.locator(`${scope} .facility-name a`).evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));

for (const scheme of ['light', 'dark'] as const) {
  for (const phone of PHONES) {
    test.describe(`${scheme}, ${phone.width}px phone`, () => {
      test.use({
        viewport: { width: phone.width, height: phone.height },
        deviceScaleFactor: phone.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
        colorScheme: scheme,
        reducedMotion: 'reduce',
      });

      for (const lang of ['en', 'fil'] as const) {
        test(lang, async ({ page }) => {
          const shot = (state: string) => `${scheme}/${lang}-${state}-${phone.width}.png`;
          mkdirSync(join(DIR, scheme), { recursive: true });
          expect(moved.length, 'prepare-data moved the worst rows').toBeGreaterThanOrEqual(5);

          // Home: the demo search, Quezon City. Every stop lists the three moved rows nearest it
          // (the list has no confirmed X-ray site, so stop 1 lists the nearest centers too).
          await page.goto(url(lang, '/', 'data=worst&need=all&near=Quezon%20City'), { waitUntil: 'networkidle' });
          await expect(page.locator('.route-heading')).toBeVisible();
          const onRoute = [...new Set((await rowIds(page, '.route')).map(idOf))].sort();
          expect.soft(onRoute, 'Home: the route lists the three moved rows nearest Quezon City').toEqual(moved.slice(0, 3).sort());
          await check(page, shot('home-route'));

          // Places, no origin: the list in file order, the moved rows first.
          await page.goto(url(lang, '/places'), { waitUntil: 'networkidle' });
          await expect(heading(page)).toHaveText(text.count[lang].replace('{n}', list.length.toLocaleString('en-US')));
          expect.soft((await rowIds(page, '.places-results')).slice(0, moved.length).map(idOf), 'Places: the moved rows come first').toEqual(moved);
          await check(page, shot('places'));

          // NCR, 403 centers: the first page and "Show more".
          await filter(page, { region: 'NCR' });
          await expect(heading(page)).toHaveText(text.count[lang].replace('{n}', String(count({ region: 'NCR' }))));
          await check(page, shot('places-ncr'));

          // A province with 21 or a few more: "Show more" with one, or a few, left.
          if (over20) {
            await page.goto(url(lang, '/places'), { waitUntil: 'networkidle' });
            await filter(page, { region: over20.region, prov: over20.prov });
            await expect(page.locator('.places-results .link-row--button')).toHaveText(text.more[lang].replace('{n}', String(over20.n - 20)));
            await check(page, shot('places-over20'));
          }

          // One result (the longest name), then none.
          if (one) {
            await page.goto(url(lang, '/places'), { waitUntil: 'networkidle' });
            await filter(page, { q: one.name });
            await expect(heading(page)).toHaveText(text.countOne[lang].replace('{n}', '1'));
            await check(page, shot('places-one'));
          }
          await filter(page, { q: 'zzzz' });
          await expect(page.locator('.empty-panel')).toBeVisible();
          await check(page, shot('places-none'));

          // From Basco, the region furthest away: distances in the thousands, by distance.
          if (furthest) {
            await page.goto(url(lang, '/places', 'data=worst&near=Basco'), { waitUntil: 'networkidle' });
            await filter(page, { region: furthest.code });
            await expect(page.locator('.places-results .facility-dist').first()).toHaveText(/\d,\d{3} km/);
            await check(page, shot('places-far'));
          }

          // Each moved row's own page (the real one, built from the shipped list).
          for (const [i, id] of moved.entries()) {
            await page.goto(lang === 'fil' ? `/fil/place/${id}?stop=2` : `/place/${id}?stop=2`, { waitUntil: 'networkidle' });
            await expect(page.locator('h1.place-name')).toBeVisible();
            await check(page, shot(`place-${i + 1}`));
          }
        });
      }
    });
  }
}

test.describe('Show more through the 403 NCR centers', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });

  test('no long task over 200 ms with the CPU slowed 4×', async ({ page, browser }) => {
    const total = count({ region: 'NCR' });
    await page.goto(url('en', '/places'), { waitUntil: 'networkidle' });
    await filter(page, { region: 'NCR' });
    await expect(page.locator('.places-results .facility')).toHaveCount(20);

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => {
      const w = window as unknown as { longTasks: number[] };
      w.longTasks = [];
      new PerformanceObserver((entries) => {
        for (const e of entries.getEntries()) w.longTasks.push(Math.round(e.duration));
      }).observe({ type: 'longtask' });
    });
    await browser.startTracing(page, { path: join(DIR, 'show-more-trace.json'), screenshots: false });
    const clicks: { shown: number; longTasks: number[] }[] = [];
    for (let shown = 20; shown < total; ) {
      const before = await page.evaluate(() => (window as unknown as { longTasks: number[] }).longTasks.length);
      await page.locator('.places-results .link-row--button').click();
      shown = Math.min(total, shown + 20);
      await expect(page.locator('.places-results .facility')).toHaveCount(shown);
      // Two frames and a pause, so the observer has reported the click's tasks.
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 100)))));
      clicks.push({ shown, longTasks: await page.evaluate((from) => (window as unknown as { longTasks: number[] }).longTasks.slice(from), before) });
    }
    await browser.stopTracing();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const worst = Math.max(0, ...clicks.flatMap((c) => c.longTasks));
    writeFileSync(join(DIR, 'show-more-longtasks.json'), `${JSON.stringify({ cpuThrottle: 4, total, worstMs: worst, clicks }, null, 1)}\n`);
    await expect(page.locator('.places-results .link-row--button')).toHaveCount(0);
    expect(worst, 'the longest task after a "Show more" click, in ms').toBeLessThanOrEqual(200);
  });
});
