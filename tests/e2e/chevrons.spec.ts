// Step 15.6: every "›" is drawn for the eye only (the owner's brief; the design reference does
// the same). Each one sits in an aria-hidden element, so the accessibility tree of every route,
// in English and Filipino, has none. With JavaScript on, so the islands' output counts, with
// the rows they add later: "See more places" under a planned route, the install row under a
// check result. The back link's "‹" is held to the same rule.
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { check } from '../../src/content/check.ts';
import { expect, test } from './fixtures.ts';

type Lang = 'en' | 'fil';

// The build under test: the sample's Bangued page, or the first place of another fixture.
const ids = (JSON.parse(readFileSync('dist/data/facilities.json', 'utf8')) as { facilities: { id: string }[] }).facilities.map((f) => f.id);
const PLACE = `/place/${ids.includes('bangued-rural-health-unit-abra') ? 'bangued-rural-health-unit-abra' : ids[0]}?stop=2&need=all`;
// Every route, and the place pages' stand-in; the 404s answer 404, so they run apart. The
// routes marked true draw a chevron on load.
const ROUTES: [string, boolean][] = [
  ['/', false],
  ['/places', false],
  [PLACE, true],
  ['/place', false],
  ['/check', false],
  ['/learn', true],
  ['/data', true],
  ['/about', true],
  ['/install', false],
  ['/offline', false],
];
const MISSING = ['/no-such-page', '/place/no-such-place'];
const at = (path: string, lang: Lang) => (lang === 'en' ? path : path === '/' || path.startsWith('/?') ? `/fil${path.slice(1)}` : `/fil${path}`);

/** Hydrates every island, client:visible ones too, so their own output is in the tree. */
async function hydrated(page: Page) {
  await page.evaluate(async () => {
    for (const island of document.querySelectorAll('astro-island[ssr]')) {
      (island.firstElementChild ?? island).scrollIntoView({ block: 'center' });
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }
  });
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

/**
 * Checks the page at a phone's width and a computer's (each shows its own parts: the tab bar,
 * Learn's narrow contents): the accessibility tree has no chevron, and every chevron in the
 * page sits in an aria-hidden element. Returns how many the page draws.
 */
async function expectNoChevronRead(page: Page, label: string) {
  let drawn = 0;
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 820 });
    expect(await page.locator('body').ariaSnapshot(), `${label} at ${width}px: the accessibility tree`).not.toMatch(/[›‹]/);
    const found = await page.evaluate(() => {
      const exposed: string[] = [];
      let count = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!/[›‹]/.test(node.nodeValue ?? '') || node.parentElement?.closest('script, style, template')) continue;
        count += 1;
        const holder = node.parentElement!;
        if (!holder.closest('[aria-hidden="true"]')) exposed.push(`${holder.localName}.${[...holder.classList].join('.')} "${(holder.textContent ?? '').trim().slice(0, 40)}"`);
      }
      return { count, exposed };
    });
    expect(found.exposed, `${label}: chevrons outside an aria-hidden element`).toEqual([]);
    drawn = Math.max(drawn, found.count);
  }
  return drawn;
}

for (const lang of ['en', 'fil'] as const) {
  test.describe(`${lang}: no chevron in the accessibility tree`, () => {
    for (const [base, draws] of ROUTES) {
      const path = at(base, lang);
      test(path, async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' });
        await hydrated(page);
        const drawn = await expectNoChevronRead(page, path);
        if (draws) expect(drawn, `${path} draws its chevrons`).toBeGreaterThan(0);
      });
    }

    test.describe('the 404s', () => {
      test.use({ expectedErrors: [/status of 404/] });
      for (const base of MISSING) {
        const path = at(base, lang);
        test(path, async ({ page }) => {
          await page.goto(path, { waitUntil: 'networkidle' });
          await hydrated(page);
          await expectNoChevronRead(page, path);
        });
      }
    });

    test('a planned route, with "See more places" under each stop', async ({ page }) => {
      const path = at('/?need=all&near=Quezon+City', lang);
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('.results .link-row').first()).toBeVisible();
      expect(await expectNoChevronRead(page, path)).toBeGreaterThan(0);
    });

    test('a check result, with its install row', async ({ page }) => {
      const path = at('/check', lang);
      const h1 = page.locator('main h1');
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: check.start[lang] }).click();
      await expect(h1).toBeFocused();
      // Result A (check.spec.ts, pwa.spec.ts): an adult with a cough.
      for (const answer of [check.opt_who_self, check.none, check.opt_symAdult_cough, check.no, check.opt_xray_no, check.none]) {
        const title = await h1.textContent();
        await page.locator('.check-choice', { hasText: new RegExp(`^${answer[lang].replace(/[()]/g, '\\$&')}`) }).first().click();
        await page.locator('.next-bar button').click();
        await expect(h1).not.toHaveText(title!);
        await expect(h1).toBeFocused();
      }
      await expect(page.locator('.install-row')).toBeVisible();
      expect(await expectNoChevronRead(page, `${path} result`)).toBeGreaterThan(0);
    });

    test("Learn's contents and Data's methods, open", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 820 });
      await page.goto(at('/learn', lang), { waitUntil: 'networkidle' });
      await page.locator('.toc-narrow summary').click();
      await expect(page.locator('.toc-narrow')).toHaveAttribute('open', '');
      expect(await page.locator('body').ariaSnapshot(), 'Learn, contents open').not.toMatch(/[›‹]/);
      await page.goto(at('/data', lang), { waitUntil: 'networkidle' });
      await page.locator('#methods summary').click();
      await expect(page.locator('#methods')).toHaveAttribute('open', '');
      expect(await page.locator('body').ariaSnapshot(), 'Data, methods open').not.toMatch(/[›‹]/);
    });
  });
}
