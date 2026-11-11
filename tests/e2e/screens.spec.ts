// Step 15.2: full-page screenshots of every route, for the dark mode review and the check that
// light mode hasn't moved (docs/step-15-fix-pass.md). English and Filipino, at 390x844 and
// 1280x800, in one colour scheme a run, saved as SCREENS_DIR/<scheme>/<lang>-<route>-<width>.png;
// scripts/compare-screens.mjs compares two runs. Not part of the normal runs: skipped unless
// SCREENS_DIR is set, and Chromium only. Against the sample build (npm run build:sample):
//   SCREENS_DIR=<folder> SCREENS_SCHEME=light npx playwright test tests/e2e/screens.spec.ts --project=chromium
// (SCREENS_SCHEME is light or dark, light if unset; on the 8 GB Mac through the guard, as
// playwright.config.ts says.)
//
// Two runs give the same pixels:
// - reduced motion, so the dot story stands still at its end states (as PLAN §5's prototype
//   pairs do); CSS animations and transitions finished, and the caret hidden, for each shot;
// - fonts loaded; every island hydrated, the ones that wait to be seen too, as a reader
//   scrolling to them gets them (Data's charts laid out again at the page's width), then
//   back at the top;
// - each page shot again until two shots in a row match, with Chromium's partial raster off
//   (below);
// - the Places map left closed; no location and no service worker (playwright.config.ts).
// The clock isn't faked: no route shows a date that moves. The footer and About dates are the
// data files', a place's accreditation date is the list's, and today's date is only on Check's
// result card, which these shots don't reach.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { chartsSettled } from './probes.ts';

const DIR = process.env.SCREENS_DIR ? resolve(process.env.SCREENS_DIR) : '';

function scheme(value = process.env.SCREENS_SCHEME || 'light'): 'light' | 'dark' {
  if (value === 'light' || value === 'dark') return value;
  throw new Error(`SCREENS_SCHEME is light or dark, not ${JSON.stringify(value)}.`);
}
const SCHEME = DIR ? scheme() : 'light';

/** Each route: its name in the file names, and its English path. */
const ROUTES = [
  ['home', '/'],
  ['places', '/places'],
  // A sample place (the one place.spec.ts checks), opened directly: no route stop, no distance.
  ['place', '/place/bangued-rural-health-unit-abra'],
  ['learn', '/learn'],
  ['data', '/data'],
  ['about', '/about'],
  ['install', '/install'],
  ['check', '/check'],
  ['404', '/no-such-page'],
  ['offline', '/offline'],
] as const;
const SIZES = [
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
];
const fil = (path: string) => (path === '/' ? '/fil' : `/fil${path}`);

test.skip(!DIR, 'Takes the step 15.2 screenshots only when SCREENS_DIR is set.');
test.skip(({ browserName }) => browserName !== 'chromium', 'Screenshots in Chromium only.');
test.use({
  colorScheme: SCHEME,
  reducedMotion: 'reduce',
  // Without it, a full-page shot re-rasters only part of some tiles, and the header's language
  // toggle (a 1.5px rounded border) came out a level or two apart at its corners from one
  // shot to the next at 1280px.
  launchOptions: { args: ['--disable-partial-raster'] },
});
// A tall page shot twice or more, on a busy machine.
test.describe.configure({ timeout: 120_000 });

/** Waits for `n` frames. */
function frames(page: Page, n: number) {
  return page.evaluate((n) => new Promise<void>((done) => {
    const next = (left: number) => (left ? requestAnimationFrame(() => next(left - 1)) : done());
    next(n);
  }), n);
}

/** Fonts loaded and every island hydrated and laid out, then back at the top, still. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  // Islands that hydrate when seen (client:visible) are brought into view one by one. An island
  // has no box of its own (display: contents), so it is its first laid-out child that scrolls.
  await page.evaluate(async () => {
    for (const island of document.querySelectorAll('astro-island[ssr]')) {
      const child = [...island.children].find((el) => el.getBoundingClientRect().height > 0);
      (child ?? island).scrollIntoView({ block: 'center' });
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }
  });
  await page.waitForFunction(() => !document.querySelector('astro-island[ssr]'));
  await chartsSettled(page); // on Data: the charts drawn at the page's width
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => scrollY === 0);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await frames(page, 4);
}

/** A full-page shot, taken again until two in a row match. */
async function steadyShot(page: Page) {
  const shoot = () => page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
  let last = await shoot();
  for (let tries = 0; tries < 5; tries++) {
    await frames(page, 2);
    const next = await shoot();
    if (next.equals(last)) return next;
    last = next;
  }
  throw new Error('The page kept changing: six shots in a row differed.');
}

for (const [route, path] of ROUTES) {
  test.describe(route, () => {
    // The 404 page's own response shows in the console.
    if (route === '404') test.use({ expectedErrors: [/status of 404/] });
    for (const lang of ['en', 'fil'] as const) {
      for (const size of SIZES) {
        test(`${lang} at ${size.width}px`, async ({ page }) => {
          await page.setViewportSize(size);
          const response = await page.goto(lang === 'fil' ? fil(path) : path, { waitUntil: 'networkidle' });
          // A route the build doesn't have would be shot as the 404 page.
          expect(response?.status(), `${path} in this build`).toBe(route === '404' ? 404 : 200);
          await settle(page);
          // The map would load outside tiles and never shoot the same twice.
          await expect(page.locator('.leaflet-container'), 'the Places map stays closed').toHaveCount(0);
          const file = join(DIR, SCHEME, `${lang}-${route}-${size.width}.png`);
          mkdirSync(join(DIR, SCHEME), { recursive: true });
          writeFileSync(file, await steadyShot(page));
        });
      }
    }
  });
}
