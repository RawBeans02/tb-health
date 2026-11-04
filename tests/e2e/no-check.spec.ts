// The build without Check (Q9, audit B26): run by `npm run test:no-check`, which builds it
// with TBPH_CHECK=false first. No /check, nothing links to it, and the app doesn't offer it.
import { expect, test } from './fixtures.ts';

test.describe('without Check', () => {
  test.use({ expectedErrors: [/status of 404/] });

  test('/check and /fil/check are the 404 page', async ({ page }) => {
    for (const [path, h1] of [['/check', "We can't find that page."], ['/fil/check', 'Hindi namin mahanap ang pahinang iyon.']]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
      await expect(page.locator('main h1')).toHaveText(h1);
    }
  });
});

test('no page links to Check, and the tab bar has three tabs', async ({ page }) => {
  for (const path of ['/', '/learn', '/data', '/about', '/install', '/places', '/fil', '/fil/learn']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('a[href="/check"], a[href="/fil/check"], a[href^="/check?"], a[href^="/fil/check?"]'), path).toHaveCount(0);
    await expect(page.locator('.tab-bar li'), path).toHaveCount(3);
  }
});

test('the manifest has no Check shortcut and the service worker saves no /check', async ({ request }) => {
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.shortcuts.map((s: { url: string }) => s.url)).toEqual(['/?need=all', '/learn', '/data']);
  const sw = await (await request.get('/sw.js')).text();
  // The precache list as the minifier writes it (any quote style).
  expect(sw).not.toMatch(/["'`]\/(fil\/)?check["'`]/);
  expect(sw).toMatch(/["'`]\/learn["'`]/);
});
