// Privacy (PLAN §4.5, audit L4): each page contacts only our origin, plus OpenStreetMap's
// tiles once the map is opened (the hosts the About text will name, Q5); a location fix
// leaves no coordinates in storage or the address. Tiles are served locally.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

/** Every host the page asks for anything. */
function hosts(page: Page) {
  const seen = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http')) seen.add(url.host);
  });
  return seen;
}

/** Everything the page keeps in local and session storage. */
const storage = (page: Page) => page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));

test('each page contacts only our origin', async ({ page, baseURL }) => {
  const seen = hosts(page);
  for (const path of ['/', '/places', '/place/bangued-rural-health-unit-abra', '/check', '/learn', '/data', '/about', '/install', '/fil', '/fil/data']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); // islands below the fold
    await page.waitForLoadState('networkidle');
  }
  expect([...seen]).toEqual([new URL(baseURL!).host]);
});

test('a location fix and the map: only OpenStreetMap is added, and no coordinates are kept', async ({ page, context, baseURL }) => {
  await context.grantPermissions(['geolocation']); // the synthetic fix from playwright.config
  await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }));
  const seen = hosts(page);
  await page.goto('/places');
  await expect(page.locator('.places-toolbar h2')).toHaveText('93 centers');
  const before = await storage(page);
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('switch')).toBeVisible();
  await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
  await expect(page.locator('.leaflet-tile-loaded').first()).toBeAttached();

  expect([...seen].sort()).toEqual([new URL(baseURL!).host, 'tile.openstreetmap.org'].sort());
  expect(await storage(page)).toBe(before);
  for (const text of [page.url(), await storage(page)]) expect(text).not.toMatch(/14\.6|121\.0|lat|lng/i);

  // Home too: the route from "My location" keeps the fix in memory only.
  await page.goto('/');
  await expect(page.locator('#tbph-places option').first()).toBeAttached();
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.locator('.results h2')).toBeFocused();
  for (const text of [page.url(), await storage(page)]) expect(text).not.toMatch(/14\.6|121\.0|lat|lng/i);
});
