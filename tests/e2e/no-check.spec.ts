// The build without Check (Q9, audit B26): run by `npm run test:no-check`, which builds the full
// list with TBPH_CHECK=false first. No /check, nothing links to it, no page names it anywhere the
// browser gets it (the HTML as served and as held, the text, title and share preview), and the
// service worker saves nothing of it. scripts/check-links.mjs fails the build on the same rules.
import { readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import { about } from '../../src/content/about.ts';
import { home } from '../../src/content/home.ts';
import { install } from '../../src/content/install.ts';
import { meta } from '../../src/content/meta.ts';
import { notFound } from '../../src/content/notfound.ts';
import { CHECK_NAMES } from '../../src/lib/nav.ts';
import { expect, test } from './fixtures.ts';

// A real place from the list this build ships.
const PLACE = (JSON.parse(readFileSync('dist/data/facilities.json', 'utf8')) as { facilities: { id: string }[] }).facilities[0].id;
const EN = ['/', '/places', '/learn', '/data', '/about', '/install', '/offline', '/place', `/place/${PLACE}`];
const PAGES = [...EN, ...EN.map((path) => (path === '/' ? '/fil' : `/fil${path}`))];
const MISSING = ['/no-such-page', '/place/no-such-place', '/fil/no-such-page', '/fil/place/no-such-place'];

/** Nothing on the page names the check: its HTML as served and as held, its text, title and descriptions. */
async function expectNoCheckName(page: Page, path: string, served: string) {
  expect(served, `${path}: HTML as served`).not.toMatch(CHECK_NAMES);
  expect(await page.content(), `${path}: page.content()`).not.toMatch(CHECK_NAMES);
  expect(await page.locator('body').innerText(), `${path}: text`).not.toMatch(CHECK_NAMES);
  const head = await page.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
  }));
  for (const [what, text] of Object.entries(head)) expect(text, `${path}: ${what}`).not.toMatch(CHECK_NAMES);
}

/** The element shows `text`, and `text` isn't blank: an empty owner slot would pass otherwise. */
async function expectFilled(locator: Locator, text: string) {
  expect(text.trim(), 'the …NoCheck string has text').not.toBe('');
  await expect(locator).toHaveText(text);
}

test.describe('without Check', () => {
  test.use({ expectedErrors: [/status of 404/] });

  test('/check and /fil/check are the 404 page', async ({ page }) => {
    for (const [path, h1] of [['/check', "We can't find that page."], ['/fil/check', 'Hindi namin mahanap ang pahinang iyon.']]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
      await expect(page.locator('main h1')).toHaveText(h1);
    }
  });

  test('no page names the symptom check, anywhere in what the browser gets (Q9, 8 Nov 2026)', async ({ page }) => {
    for (const path of [...PAGES, ...MISSING]) {
      const response = await page.goto(path);
      await expectNoCheckName(page, path, (await response?.text()) ?? '');
    }
    // Install's "works offline" list drops the check, and the 404 keeps one button.
    await page.goto('/install');
    await expect(page.locator('.install-offline > li')).toHaveCount(2);
    await page.goto('/no-such-page');
    await expect(page.locator('.notice-actions a')).toHaveCount(1);
  });

  test("an open route's \"What to bring\" has no check summary, in either language", async ({ page }) => {
    for (const [path, lang] of [['/?near=Quezon+City', 'en'], ['/fil?near=Quezon+City', 'fil']] as const) {
      const response = await page.goto(path);
      // The route opens on load, with the list: everything but bring3, which names the check.
      await expect(page.locator('.bring li'), path).toHaveText([home.bring1[lang], home.bring2[lang], home.bring4[lang], home.bring5[lang]]);
      await expectNoCheckName(page, path, (await response?.text()) ?? '');
    }
  });

  test('the …NoCheck strings fill their places (Q9, 8 Nov 2026)', async ({ page }) => {
    for (const lang of ['en', 'fil'] as const) {
      const at = (path: string) => (lang === 'en' ? path : `/fil${path}`);
      await page.goto(at('/about'));
      await expectFilled(page.locator('#disclaimer p'), about.disclaimerTextNoCheck[lang]);
      await expectFilled(page.locator('#privacy li').first(), about.privacy1NoCheck[lang]);
      await expectFilled(page.locator('#app .about-loose'), about.appTextNoCheck[lang]);
      await page.goto(at('/install'));
      await expectFilled(page.locator('.install-head .lede'), install.leadNoCheck[lang]);
      expect(meta.installDescriptionNoCheck[lang].trim(), 'the …NoCheck string has text').not.toBe('');
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', meta.installDescriptionNoCheck[lang]);
      await page.goto(at('/no-such-page'));
      await expectFilled(page.locator('.notice-head .lede'), notFound.leadNoCheck[lang]);
    }
  });
});

test('no page links to Check, and the tab bar has three tabs', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('a[href="/check"], a[href="/fil/check"], a[href^="/check?"], a[href^="/fil/check?"], a[href^="/check#"], a[href^="/fil/check#"]'), path).toHaveCount(0);
    await expect(page.locator('.tab-bar li'), path).toHaveCount(3);
  }
});

test('the manifest, sitemap and service worker leave Check out', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.shortcuts.map((s: { url: string }) => s.url)).toEqual(['/?need=all', '/learn', '/data']);
  expect(JSON.stringify(manifest)).not.toMatch(CHECK_NAMES);
  expect(await (await request.get('/sitemap.xml')).text()).not.toMatch(/\/check</);
  const sw = await (await request.get('/sw.js')).text();
  // The precache list as the minifier writes it (any quote style): no Check page, island or
  // stylesheet (CheckFlow.<hash>.js, Check.<hash>.css or _check_.<hash>.css), while the other
  // pages and islands are listed.
  expect(sw).not.toMatch(/["'`]\/(fil\/)?check["'`]/);
  expect(sw).not.toMatch(/\/_astro\/_?check(flow)?_?\./i);
  expect(sw).toMatch(/["'`]\/learn["'`]/);
  expect(sw).toMatch(/\/_astro\/Planner\.[\w-]+\.js/);
});
