// Step 13: QA hardening (PLAN §5). The prototype's qa-harness.html checks as a matrix (9 pages ×
// 4 widths × EN/FIL), then axe on every page and the main interactive states.
// Step 15.7 runs it all again in dark mode (V7) as its own guarded job, so the regular chromium
// and webkit runs keep their size under the memory guard. QA_SCHEME is light or dark, light if
// unset, and dark puts " (dark)" after each group's title:
//   QA_SCHEME=dark npx playwright test tests/e2e/qa.spec.ts --project=chromium   (then webkit)
// dark.spec.ts runs axe in dark on these pages and states in every chromium run too.
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { buildDataset } from '../../src/lib/core/data.ts';
import { filterPlaces, NO_FILTERS } from '../../src/lib/core/places.ts';
import { chartsSettled, harnessProbe as probe, outsideProblems, svgTextOutside } from './probes.ts';

// The build under test, not public/ (a later prepare-data may have rewritten that).
const file = JSON.parse(readFileSync('dist/data/facilities.json', 'utf8'));
const facilities = file.facilities as { id: string; name: string }[];
// A place name the Places search matches to exactly one row, by the app's own matching (B84).
const list = buildDataset(file).list;
const ONE = list.find((p) => filterPlaces(list, { ...NO_FILTERS, q: p.name }, null, false).rows.length === 1)?.name;
if (!ONE) throw new Error("qa.spec: no place name in dist/data/facilities.json matches exactly one row, so the one-result Places state can't be reached by a search (B87).");
// The sample's Bangued page, or the first place when a synthetic fixture replaced the sample.
const PLACE = facilities.some((r) => r.id === 'bangued-rural-health-unit-abra')
  ? '/place/bangued-rural-health-unit-abra?stop=2&need=all&near=Bangued'
  : `/place/${facilities[0].id}?stop=2&need=all`;
// With the worst-case fixture built (npm run build:worst-case, audit L2), its few synthetic
// place pages join the matrix; the 2,100-row scale fixture's don't.
const synthetic = facilities.filter((r) => r.name.startsWith('SYNTHETIC'));
const WORST = synthetic.length <= 5 ? synthetic.map((r) => `/place/${r.id}?stop=1`) : [];
const PAGES = ['/', '/places', PLACE, '/check', '/learn', '/data', '/about', '/no-such-page', '/install', ...WORST];
const WIDTHS = [320, 390, 768, 1280];
const fil = (path: string) => (path === '/' ? '/fil' : `/fil${path}`);

function scheme(value = process.env.QA_SCHEME || 'light'): 'light' | 'dark' {
  if (value === 'light' || value === 'dark') return value;
  throw new Error(`QA_SCHEME is light or dark, not ${JSON.stringify(value)}.`);
}
const SCHEME = scheme();
const IN_DARK = SCHEME === 'dark' ? ' (dark)' : '';
test.use({ colorScheme: SCHEME });

/** Each page in both languages, with the 404 page's own response allowed in the console. */
function eachPage(body: (path: string) => void) {
  for (const lang of ['en', 'fil'] as const) {
    for (const base of PAGES) {
      const path = lang === 'fil' ? fil(base) : base;
      test.describe(path, () => {
        if (base === '/no-such-page') test.use({ expectedErrors: [/status of 404/] });
        body(path);
      });
    }
  }
}

test.describe(`qa-harness matrix${IN_DARK}`, () => {
  eachPage((path) => {
    for (const width of WIDTHS) {
      test(`at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await page.goto(path, { waitUntil: 'networkidle' });
        expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches), 'colour scheme').toBe(SCHEME === 'dark');
        await chartsSettled(page); // Data's charts lay out again once hydrated (B76)
        const r = await probe(page);
        expect(r.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
        expect(await outsideProblems(page, 'main *'), 'off the screen or cut off').toEqual([]);
        expect(await svgTextOutside(page), 'chart labels outside their chart').toEqual([]);
        expect(r.holes, 'template leftovers').toEqual([]);
        expect(r.h1, 'one H1').toBe(1);
        expect(r.small, 'targets under 44px').toEqual([]);
        expect(r.tiny, 'text under 14px').toEqual([]);
      });
    }
  });
});

// Places with one result and with none, reached through the filters (B51): the phone
// widths use the Filters sheet, 1280px the side panel.
test.describe(`qa-harness matrix: Places with one result and with none${IN_DARK}`, () => {
  for (const lang of ['en', 'fil'] as const) {
    for (const width of [320, 390, 1280]) {
      for (const [state, query] of [['one result', ONE], ['no result', 'zzzz']] as const) {
        test(`${lang} ${state} at ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 820 });
          await page.goto(lang === 'fil' ? '/fil/places' : '/places', { waitUntil: 'networkidle' });
          const wide = width >= 1080;
          if (!wide) {
            await page.locator('.filters-button').click();
            // The sheet moves focus to its heading on the next frame: text typed before that is
            // lost when the machine is busy (seen in WebKit on 8 Nov 2026), so wait for it.
            await expect(page.locator('#sheet-h')).toBeFocused();
          }
          await page.locator(wide ? '#panel-q' : '#sheet-q').fill(query);
          if (!wide) await page.locator('.sheet-done').click();
          await expect(page.locator('[role="dialog"]')).toHaveCount(0);
          if (state === 'one result') await expect(page.locator('.places-results .facility')).toHaveCount(1);
          else await expect(page.locator('.empty-panel')).toBeVisible();
          const r = await probe(page);
          expect(r.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
          expect(await outsideProblems(page, 'main *'), 'off the screen or cut off').toEqual([]);
          expect(r.h1, 'one H1').toBe(1);
          expect(r.small, 'targets under 44px').toEqual([]);
          expect(r.tiny, 'text under 14px').toEqual([]);
        });
      }
    }
  }
});

/** WCAG 2.2 AA rules, as axe tags them. */
async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(', ')}`);
}

test.describe(`axe (WCAG 2.2 AA)${IN_DARK}`, () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'axe reads the DOM: one engine is enough');

  eachPage((path) => {
    for (const width of [390, 1280]) {
      test(`at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await page.goto(path, { waitUntil: 'networkidle' });
        expect(await axe(page)).toEqual([]);
      });
    }
  });

  test('Home with a route', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#from').fill('Quezon City');
    await page.getByRole('button', { name: 'Show me where to go' }).click();
    await expect(page.locator('.results h2')).toBeFocused();
    expect(await axe(page)).toEqual([]);
  });

  test('Places with the filters sheet open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/places', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('Check, a question', async ({ page }) => {
    await page.goto('/check', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('main h1')).toBeFocused();
    expect(await axe(page)).toEqual([]);
  });

  test('Data, a chart table open', async ({ page }) => {
    await page.goto('/data', { waitUntil: 'networkidle' });
    await page.locator('#d1').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    const toggle = page.locator('#d1 button[aria-expanded]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await axe(page)).toEqual([]);
  });
});
