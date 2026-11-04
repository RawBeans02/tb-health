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
    await expect(page.locator('.map')).toHaveAttribute('data-markers', /^[1-9]\d*$/); // markers drawn (canvas)
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
      await expect(page.locator('.leaflet-container')).toBeFocused(); // B8
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

test.describe('map layers (audit B4)', () => {
  test('stay under the tab bar and the Filters sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ready(page);
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    // Scroll so the map runs under the tab bar.
    const tab = page.locator('.tab-bar a').first();
    const tabBox = (await tab.boundingBox())!;
    await page.evaluate((y) => {
      const map = document.querySelector('.map-frame')!.getBoundingClientRect();
      scrollBy(0, map.bottom - y - 20);
    }, tabBox.y + tabBox.height);
    const center = (await tab.boundingBox())!;
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.tab-bar a') !== null, { x: center.x + center.width / 2, y: center.y + center.height / 2 });
    expect(hit).toBe(true);

    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet).toBeVisible();
    // Polled: the sheet slides in.
    await expect.poll(async () => {
      const s = (await sheet.boundingBox())!;
      return page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('[role="dialog"]'), { x: s.x + s.width / 2, y: s.y + 40 });
    }).toBe(true);
  });
});

test.describe('map markers (audit B7)', () => {
  test('every located center gets one, with its popup built on demand', async ({ page }) => {
    await ready(page);
    const located = await page.evaluate(async () => {
      const file = await (await fetch('/data/facilities.json')).json();
      return file.facilities.filter((r: { lat: unknown }) => typeof r.lat === 'number').length;
    });
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.map')).toHaveAttribute('data-markers', String(located));
    // Canvas markers: no per-marker SVG paths.
    await expect(page.locator('.leaflet-overlay-pane canvas')).toHaveCount(1);
    await expect(page.locator('.leaflet-popup')).toHaveCount(0);
  });
});

test.describe('focus after updates (audit B8)', () => {
  test('"Show more" moves focus to the first new row, every time', async ({ page }) => {
    await ready(page);
    for (let shown = 20; shown < 93; shown += 20) {
      await expect(rows(page)).toHaveCount(shown);
      await page.getByRole('button', { name: /^Show more centers/ }).click();
      await expect(rows(page).nth(shown).locator('a').first()).toBeFocused();
    }
    await expect(rows(page)).toHaveCount(93);
  });

  test.describe(() => {
    test.use({ expectedErrors: [/status of 503/] });

    test('"Try again" on the list lands on the count', async ({ page }) => {
      await page.route('**/data/facilities.json', (route) => route.fulfill({ status: 503, body: '' }));
      await page.goto('/places');
      await expect(page.locator('.results-error')).toBeVisible();
      await page.unroute('**/data/facilities.json');
      await page.locator('.results-error').getByRole('button', { name: 'Try again' }).click();
      await expect(count(page)).toHaveText('93 centers');
      await expect(count(page)).toBeFocused();
    });
  });
});

test.describe('location (audit B9)', () => {
  test('denied: says so in a status the field points to, and returns focus to the field', async ({ page }) => {
    await ready(page);
    const field = page.locator('#near');
    const msg = page.locator('#near-msg');
    await expect(msg).toBeAttached(); // mounted before anything is said
    await expect(msg).toHaveText('');
    await expect(field).toHaveAttribute('aria-describedby', 'near-msg');
    await page.getByRole('button', { name: 'Use my location' }).click();
    await expect(msg).toHaveText('No problem. Type your barangay or city instead.');
    await expect(msg).toHaveAttribute('role', 'status');
    await expect(field).toBeFocused();
  });
});

test.describe('map motion (audit B12)', () => {
  test('with reduced motion: no fade or zoom animation, and refits land at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible();
    await expect(map).not.toHaveClass(/leaflet-fade-anim/);
    await expect(map).not.toHaveClass(/leaflet-zoom-anim/);
    // Narrow, then broaden quickly: the map refits each time, with nothing left animating.
    const search = page.getByRole('searchbox').or(page.locator('#near'));
    await search.first().fill('Baguio');
    await search.first().fill('');
    await expect(page.locator('.map')).toHaveAttribute('data-markers', '93');
    await expect(page.locator('.leaflet-zoom-anim, .leaflet-pan-anim')).toHaveCount(0);
  });
});

test.describe('system Back (audit B15)', () => {
  test('a CloseWatcher lives only while the sheet is open, and Back closes it keeping the filters', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CloseWatcher is Chromium only');
    await page.addInitScript(() => {
      const Native = (window as unknown as { CloseWatcher: new () => { destroy(): void; requestClose(): void } }).CloseWatcher;
      const live = new Set<{ destroy(): void; requestClose(): void }>();
      (window as unknown as { watchers: typeof live }).watchers = live;
      (window as unknown as { CloseWatcher: unknown }).CloseWatcher = class extends Native {
        constructor() {
          super();
          live.add(this);
        }
        destroy() {
          live.delete(this);
          super.destroy();
        }
      };
    });
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page);
    const live = () => page.evaluate(() => (window as unknown as { watchers: Set<unknown> }).watchers.size);
    expect(await live()).toBe(0);
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Filters' });
    await expect(dialog).toBeVisible();
    await expect.poll(live).toBe(1); // created by the sheet's open effect, after paint
    await dialog.getByRole('combobox', { name: 'Region' }).selectOption({ index: 1 });
    // What the system Back does to a CloseWatcher.
    await page.evaluate(() => [...(window as unknown as { watchers: Set<{ requestClose(): void }> }).watchers][0].requestClose());
    await expect(dialog).toHaveCount(0);
    await expect.poll(live).toBe(0);
    await expect(page).toHaveURL(/\/places/);
    await expect(page.getByRole('button', { name: /^Filters/ })).toContainText('1');
  });
});
