// Step 11: the phone app (PLAN §5). Runs in its own project with the service worker on
// (playwright.config.ts); every other project blocks it. Sample data; map tiles served locally.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const VISITED = 'bangued-rural-health-unit-abra';
const UNVISITED = 'baguio-general-hospital-and-medical-center-baguio-city';

/** The first visit: returns once the worker is active, has saved everything, and controls the page. */
async function firstVisit(page: Page, path = '/') {
  await page.goto(path);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

async function offline(page: Page) {
  await page.context().setOffline(true);
}

/** Every Cache Storage entry: cache name, address, stored size. */
function cached(page: Page) {
  return page.evaluate(async () => {
    const out: { cache: string; url: string; bytes: number }[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        out.push({ cache: name, url: request.url, bytes: response ? (await response.blob()).size : 0 });
      }
    }
    return out;
  });
}

test.describe('phone app', () => {
  test('links the manifest: production routes, Check shortcut, no ?source', async ({ page, request }) => {
    await page.goto('/learn');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    const response = await request.get('/manifest.webmanifest');
    expect(response.headers()['content-type']).toBe('application/manifest+json');
    const manifest = await response.json();
    expect(manifest).toMatchObject({ id: '/', start_url: '/', scope: '/', display: 'standalone' });
    expect(manifest.shortcuts.map((s: { url: string }) => s.url)).toEqual(['/?need=all', '/check', '/learn', '/data']);
    expect(JSON.stringify(manifest)).not.toContain('source=');
  });

  test('opens the core pages offline after one visit, whatever the query', async ({ page }) => {
    await firstVisit(page);
    await offline(page);

    await page.goto('/?need=all');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toHaveText('Find your way to TB care.');

    await page.goto('/fil/?need=all');
    await expect(page.locator('main h1')).toHaveText('Hanapin ang daan papunta sa gamutan sa TB.');

    await page.goto('/places?svc=test');
    await expect(page.locator('.places-toolbar h2')).not.toHaveText('0 centers');
    await expect(page.locator('.places-results .facility').first()).toBeVisible();
    // The line's "saved list" is true: the list came from the saved file.
    await expect(page.locator('.offline-line')).toHaveText(/You're offline\. Showing the saved list of centers\./);

    for (const path of ['/learn', '/data', '/about', '/install', '/check', '/fil/learn']) {
      await page.goto(path);
      await expect(page.locator('main h1'), path).not.toHaveText(/offline|koneksiyon/i);
    }
  });

  test('a visited place page opens offline with its route stop', async ({ page }) => {
    await firstVisit(page);
    await page.goto(`/place/${VISITED}?stop=2&need=all`);
    await expect(page.locator('h1')).toHaveText('Bangued Rural Health Unit');
    await offline(page);
    await page.goto(`/place/${VISITED}?stop=3&need=meds`);
    await expect(page.locator('h1')).toHaveText('Bangued Rural Health Unit');
    await expect(page.locator('html')).toHaveAttribute('data-stop', '3');
    // The saved page itself (the shell has no canonical).
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://tb-ph.example/place/${VISITED}`);
    await expect(page.locator('.offline-line')).toHaveText(/You're offline\. Showing the saved details for this center\./);
  });

  test('an unvisited place renders offline from the saved list, in English and Filipino', async ({ page }) => {
    await firstVisit(page);
    await offline(page);

    await page.goto(`/place/${UNVISITED}?stop=1`);
    await expect(page.locator('h1')).toHaveText('Baguio General Hospital and Medical Center');
    await expect(page).toHaveTitle('Baguio General Hospital and Medical Center — TB PH');
    // The shell, not a saved page: noindex and no canonical.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-stop', '1');
    await expect(page.locator('#det-h')).toHaveText('Details');
    await expect(page.locator('.offline-line')).toBeVisible();
    await expect(page.locator('[data-lang-link="fil"]').first()).toHaveAttribute('href', `/fil/place/${UNVISITED}?stop=1`);

    await page.goto(`/fil/place/${UNVISITED}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    await expect(page.locator('h1')).toHaveText('Baguio General Hospital and Medical Center');
    await expect(page.locator('.offline-line')).toHaveText(/Wala kang koneksiyon\. Ipinapakita ang naka-save na detalye ng center na ito\./);

    await page.goto('/place/no-such-place');
    await expect(page.locator('h1')).toHaveText("This place isn't on the list.");
    await expect(page).toHaveTitle('Page not found — TB PH');
  });

  test('an unsaved page offline gets the offline page in its language', async ({ page }) => {
    await firstVisit(page);
    await offline(page);
    await page.goto('/no-such-page');
    await expect(page.locator('main h1')).toHaveText("You're offline.");
    await expect(page.locator('main a.btn')).toHaveAttribute('href', '/');
    await page.goto('/fil/wala-nito');
    await expect(page.locator('main h1')).toHaveText('Wala kang koneksiyon.');
    await expect(page).toHaveTitle('Wala kang koneksiyon — TB PH');
    await expect(page.locator('main a.btn')).toHaveAttribute('href', '/fil');
  });

  test('saves within budget, only from our origin, and no address with its query', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }));
    await firstVisit(page, '/?need=all&near=Quezon+City');
    await page.goto(`/place/${VISITED}?stop=2&need=xray&near=Quezon+City`);
    await expect(page.locator('h1')).toBeVisible();
    await page.goto('/places?svc=test&near=Quezon+City');
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.leaflet-tile-loaded').first()).toBeAttached();

    const entries = await cached(page);
    const origin = new URL(page.url()).origin;
    for (const { url } of entries) {
      expect(new URL(url).origin, url).toBe(origin);
      // Workbox's content hash is the only parameter a saved address ever has.
      expect(new URL(url).search, url).toMatch(/^(\?__WB_REVISION__=[0-9a-f]+)?$/);
    }
    const precache = entries.filter((e) => e.cache.startsWith('workbox-precache'));
    expect(precache.length).toBeLessThanOrEqual(60);
    expect(precache.reduce((sum, e) => sum + e.bytes, 0)).toBeLessThanOrEqual(3 * 1024 * 1024);
    expect(entries.some((e) => e.url.endsWith(`/place/${VISITED}`))).toBe(true);
  });

  test('a launch with Filipino saved lands on /fil, online and offline', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    await firstVisit(page);
    await page.evaluate(() => localStorage.setItem('tbph-lang', 'fil'));
    await page.goto('/');
    await expect(page).toHaveURL(/\/fil$/);
    await expect(page.locator('html')).toHaveAttribute('data-standalone', 'true');
    await offline(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/fil$/);
    await expect(page.locator('main h1')).toHaveText('Hanapin ang daan papunta sa gamutan sa TB.');
  });
});
