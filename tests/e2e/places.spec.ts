// Step 5: Places (PLAN §5). Sample data; synthetic locations; map tiles served locally so
// tests never contact OpenStreetMap.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const count = (page: Page) => page.locator('.places-toolbar h2');
const rows = (page: Page) => page.locator('.places-results .facility');

async function ready(page: Page, path = '/places') {
  await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }));
  await page.goto(path);
  await expect(count(page)).toHaveText('93 centers');
}

test.describe('list', () => {
  test('lists 20 at a time, each with all three services, and links places by id only (Q4a)', async ({ page }) => {
    await ready(page);
    await expect(rows(page)).toHaveCount(20);
    const chips = (await rows(page).first().locator('.chip').allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
    expect(chips).toEqual(['Chest X-ray: Call to confirm', 'TB test (sputum): Collects your sample or refers you', 'Free TB medicines: ✓ Offers this']);
    for (const link of await page.locator('.facility-name a').all()) expect(await link.getAttribute('href')).toMatch(/^\/place\/[a-z0-9-]+$/);
    await page.getByRole('button', { name: 'Show more centers (73 left)' }).click();
    await expect(rows(page)).toHaveCount(40);
    await expect(page.locator('.footnotes')).toContainText('Sample list: 93 of about 2,100 accredited centers, from 5 regions.');
  });

  test('filters by service, type, region, province and words; "Clear filters" resets them', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page);
    const panel = page.locator('.filters-panel');
    await expect(panel).toBeVisible();
    await expect(page.locator('.filters-button')).toBeHidden();

    await page.getByRole('group', { name: 'Type' }).first().getByRole('button', { name: 'Private' }).click();
    const privateCount = Number((await count(page).innerText()).split(' ')[0]);
    expect(privateCount).toBeGreaterThan(0);
    expect(privateCount).toBeLessThan(93);
    for (const badge of await page.locator('.facility .badge').all()) await expect(badge).toHaveText('Private — fees may apply');

    await page.getByRole('group', { name: 'Type' }).first().getByRole('button', { name: 'All' }).click();
    await panel.getByLabel('Region').selectOption({ label: 'Cordillera (CAR)' });
    const provinces = await panel.getByLabel('Province or city').locator('option').allInnerTexts();
    expect(provinces).toContain('Benguet');
    expect(provinces).not.toContain('Quezon City');
    await panel.getByLabel('Search by city, municipality or facility name').fill('baguio');
    await expect(count(page)).toHaveText(/^\d+ centers?$/);
    for (const address of await page.locator('.facility-address').allInnerTexts()) expect(address).toContain('Baguio');

    await panel.getByRole('button', { name: 'Clear filters' }).click();
    await expect(count(page)).toHaveText('93 centers');
    await expect(panel.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
  });

  test('the X-ray filter says when no X-ray site is confirmed and lists the centers instead', async ({ page }) => {
    await ready(page, '/places?svc=xray');
    await expect(page.getByRole('group', { name: 'Service' }).getByRole('button', { name: 'Chest X-ray' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.info-line').filter({ hasText: "We don't have confirmed X-ray sites" })).toBeVisible();
    await expect(count(page)).toHaveText('93 centers');
    expect((await rows(page).first().locator('.chip').allInnerTexts()).map((text) => text.trim())).toEqual(['Call to confirm']);
  });

  test('shows the empty state with a solid "Clear filters"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page);
    await page.locator('.filters-panel').getByLabel('Search by city, municipality or facility name').fill('zzzz');
    await expect(count(page)).toHaveText('0 centers');
    const empty = page.locator('.empty-panel');
    await expect(empty).toContainText('No centers match your search. Try a nearby city, or clear the filters.');
    await empty.getByRole('button', { name: 'Clear filters' }).click();
    await expect(count(page)).toHaveText('93 centers');
  });

  test('shows the offline line when the browser is offline', async ({ page }) => {
    await ready(page);
    const line = page.locator('.offline-line');
    await expect(line).toBeHidden();
    await page.context().setOffline(true);
    await expect(line).toBeVisible();
    await expect(line).toHaveText(/You're offline\. Showing the saved list of centers\./);
    await page.context().setOffline(false);
  });

  test('has no sideways scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test('comes back to the route with the matched place (Q4)', async ({ page }) => {
    await ready(page, '/places?svc=test&near=Quezon+City&loc=gps');
    await expect(page.locator('#near')).toHaveValue('Quezon City');
    await expect(page.getByRole('link', { name: 'Back to your route' })).toHaveAttribute('href', '/?near=Quezon+City&loc=gps');
    await expect(page.locator('.facility-dist').first()).toHaveText(/^about \d+ km$/);
    await expect(page.getByRole('switch', { name: 'Sort by distance' })).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('location', () => {
  test('is asked for only on a tap, also for ?loc=gps links (Q4)', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { asked: number };
      w.asked = 0;
      navigator.geolocation.getCurrentPosition = () => {
        w.asked += 1;
      };
    });
    await ready(page, '/places?loc=gps');
    expect(await page.evaluate(() => (window as unknown as { asked: number }).asked)).toBe(0);
    await expect(page.getByRole('switch')).toHaveCount(0);
  });

  test('granted: sorts by distance, and the switch turns sorting off', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 16.41, longitude: 120.6 });
    await ready(page);
    await page.getByRole('button', { name: 'Use my location' }).click();
    await expect(page.locator('#near')).toHaveValue('My location');
    const sort = page.getByRole('switch', { name: 'Sort by distance' });
    await expect(sort).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.facility-address').first()).toContainText('Baguio City');
    await sort.click();
    await expect(sort).toHaveAttribute('aria-checked', 'false');
    expect(page.url()).not.toMatch(/16\.4|120\.6/);
  });
});

test.describe('filters sheet (below 1080px)', () => {
  test('opens as a dialog, traps focus, closes with Escape and returns focus', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page);
    await expect(page.locator('.filters-panel')).toBeHidden();
    const button = page.getByRole('button', { name: 'Filters', exact: true });
    await button.click();
    const dialog = page.getByRole('dialog', { name: 'Filters' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Filters' })).toBeFocused();
    await expect(dialog.locator('.sheet-count')).toHaveText('93 centers');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    expect(await page.evaluate(() => (document.querySelector('.places') as HTMLElement).inert && (document.querySelector('.site-header') as HTMLElement).inert)).toBe(true);

    // Tab cycles inside the sheet.
    // Safari moves focus to every control with Option+Tab.
    for (let i = 0; i < 12; i++) await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);

    await dialog.getByRole('group', { name: 'Type' }).getByRole('button', { name: 'Government' }).click();
    await expect(dialog.locator('.sheet-count')).not.toHaveText('93 centers');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Filters (1)' })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    expect(await page.evaluate(() => (document.querySelector('.places') as HTMLElement).inert)).toBe(false);
  });

  test('closes with Done and with a tap on the scrim', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page);
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.mouse.click(195, 20);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('map', () => {
  test('loads only on request, with OpenStreetMap tiles allowed by the CSP (Q5)', async ({ page }) => {
    const tiles: string[] = [];
    page.on('request', (request) => {
      if (request.url().startsWith('https://tile.openstreetmap.org/')) tiles.push(request.url());
    });
    await ready(page);
    expect(tiles).toHaveLength(0);
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.map-status')).toHaveCount(0);
    await expect(page.locator('.leaflet-interactive').first()).toBeAttached();
    await expect.poll(() => tiles.length).toBeGreaterThan(0);
    await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'List' }).click();
    await expect(page.locator('.leaflet-container')).toHaveCount(0);
  });

  test.describe(() => {
    test.use({ expectedErrors: [/leaflet|net::ERR_FAILED|Failed to load resource/] });
    test('recovers from a failed load with "Try again"', async ({ page }) => {
      await ready(page);
      await page.route('**/_astro/leaflet*.js', (route) => route.abort());
      await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
      await expect(page.locator('.map-status')).toContainText('The map could not be loaded. Check your connection and try again.');
      await page.unroute('**/_astro/leaflet*.js');
      await page.locator('.map-status').getByRole('button', { name: 'Try again' }).click();
      await expect(page.locator('.leaflet-container')).toBeVisible();
    });
  });
});

test.describe('language', () => {
  test('switches in place, keeping the filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page, '/places?svc=meds');
    await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));
    await page.locator('.site-header [data-lang-link="fil"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
    expect(new URL(page.url()).pathname).toBe('/fil/places');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hanapin ang gamutan malapit sa iyo');
    await expect(page.getByRole('group', { name: 'Serbisyo' }).getByRole('button', { name: 'Libreng gamot' })).toHaveAttribute('aria-pressed', 'true');
    await expect(count(page)).toHaveText('93 na center');
    for (const link of await page.locator('.facility-name a').all()) expect(await link.getAttribute('href')).toMatch(/^\/fil\/place\//);
  });
});
