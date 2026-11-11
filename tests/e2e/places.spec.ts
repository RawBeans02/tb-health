// Step 5: Places (PLAN §5). Sample data; synthetic locations; map tiles served locally so
// tests never contact OpenStreetMap.
import type { Browser, Page } from '@playwright/test';
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
    for (const badge of await page.locator('.facility .badge').all()) await expect(badge).toHaveText('Private (fees may apply)');
    // The sample lists no hours: the v8 wording, without the em dash (V3, V8).
    await expect(page.locator('.facility .facility-hours').first()).toHaveText('Hours not listed. Call first.');

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
    // No blue tap flash on the map's links, Leaflet's own (step 15.3), where the engine has the property.
    if (await page.evaluate(() => CSS.supports('-webkit-tap-highlight-color', 'transparent'))) {
      const flash = await page.locator('.leaflet-control-zoom-in').evaluate((el) => getComputedStyle(el).getPropertyValue('-webkit-tap-highlight-color'));
      expect(flash).toBe('rgba(0, 0, 0, 0)');
    }
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
  // Any build: on the 2,100-row synthetic one (npm run build:synthetic) this is what proves
  // the old 800-marker cap is gone. Draw and filter times are recorded as annotations.
  test('every located center gets one, with its popup built on demand', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/places');
    const file = await page.evaluate(async () => (await (await fetch('/data/facilities.json')).json()) as { facilities: { lat: unknown; svc_chest_xray?: string }[] });
    // The heading counts every row; the map, only those with a location (B76).
    const located = file.facilities.filter((r) => typeof r.lat === 'number').length;
    await expect(count(page)).toHaveText(`${file.facilities.length.toLocaleString('en-US')} centers`);
    let t = Date.now();
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.map')).toHaveAttribute('data-markers', String(located));
    test.info().annotations.push({ type: 'timing', description: `${located} markers drawn ${Date.now() - t} ms after Map` });
    await expect(page.locator('.leaflet-overlay-pane canvas')).toHaveCount(1); // canvas, not one path per marker
    await expect(page.locator('.leaflet-popup')).toHaveCount(0);
    t = Date.now();
    await page.locator('#panel-q').fill('Bangued');
    await expect(page.locator('.map')).not.toHaveAttribute('data-markers', String(located));
    test.info().annotations.push({ type: 'timing', description: `filter redrawn ${Date.now() - t} ms after the tap (${await page.locator('.map').getAttribute('data-markers')} markers)` });
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
  test('a refit made while the last one would still be animating lands: the map ends showing every marker (B70)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ready(page);
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    const map = page.locator('.map');
    await expect(map).toHaveAttribute('data-markers', '93');
    await expect(map).not.toHaveAttribute('data-moving');
    // Cordillera, then every region 50 ms later. The two fits are under Leaflet's 4-level
    // zoom animation threshold, so an animated first fit would still be running (250 ms) and
    // Leaflet would drop the second. Resolves once the second fit has been asked for.
    await page.locator('#panel-region').evaluate(
      (select: HTMLSelectElement) =>
        new Promise<void>((resolve) => {
          const box = document.querySelector<HTMLElement>('.map')!;
          const seen: string[] = [];
          new MutationObserver((_, observer) => {
            seen.push(box.dataset.markers ?? '');
            if (seen.includes('8') && box.dataset.markers === '93') {
              observer.disconnect();
              resolve();
            }
          }).observe(box, { attributeFilter: ['data-markers'] });
          const pick = (value: string) => {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          };
          pick([...select.options].find((o) => o.text.startsWith('Cordillera'))!.value);
          setTimeout(() => pick(''), 50);
        }),
    );
    await expect(map).not.toHaveAttribute('data-moving');
    await expect(map).toHaveAttribute('data-fit', 'true');
  });

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

test.describe('sheet drag (audit B30)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', "Chromium only: the drags go through CDP's Input.dispatchTouchEvent, which WebKit lacks. The iphone project closes the sheet with Done instead, and the swipe on an iPhone stays a runtime check (B30).");

  /** A phone with the Filters sheet open; `touch` sends raw touch events; `at` is the grabber. */
  async function openSheet(browser: Browser) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', points: { x: number; y: number; id: number }[]) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    await page.goto('/places');
    await expect(page.locator('.places-toolbar h2')).toHaveText('93 centers');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(page.locator('.sheet.is-shown')).toBeVisible();
    await page.waitForTimeout(300);
    const g = (await page.locator('.sheet-grab').boundingBox())!;
    return { context, page, touch, sheet: page.locator('.sheet'), at: { x: g.x + g.width / 2, y: g.y + 12 } };
  }

  test('a cancelled touch goes back to rest and never closes', async ({ browser }) => {
    const { context, page, touch, sheet, at } = await openSheet(browser);
    await touch('touchStart', [{ ...at, id: 1 }]);
    await touch('touchMove', [{ x: at.x, y: at.y + 50, id: 1 }]);
    await expect(sheet).toHaveClass(/is-dragging/);
    await touch('touchCancel', []);
    await expect(sheet).not.toHaveClass(/is-dragging/);
    expect(await sheet.getAttribute('style')).toBeFalsy();
    await expect(page.locator('.sheet.is-shown')).toBeVisible();
    await context.close();
  });

  test('a second finger on the grab strip causes no jump', async ({ browser }) => {
    const { context, page, sheet, at } = await openSheet(browser);
    // Touch events dispatched on the strip itself: Chrome's touch emulation never fires a
    // touchstart for a second finger, so the identifier guard is only reachable this way.
    await page.evaluate(({ x, y }) => {
      const grab = document.querySelector('.sheet-grab')!;
      const finger = (id: number, cx: number, cy: number) => new Touch({ identifier: id, target: grab, clientX: cx, clientY: cy });
      const fire = (type: string, touches: Touch[], changed: Touch[]) =>
        grab.dispatchEvent(new TouchEvent(type, { touches, targetTouches: touches, changedTouches: changed, bubbles: true, cancelable: true }));
      const one = finger(1, x, y);
      fire('touchstart', [one], [one]);
      const moved = finger(1, x, y + 30);
      fire('touchmove', [moved], [moved]);
      const two = finger(2, x + 60, y); // the second finger, on the strip
      fire('touchstart', [moved, two], [two]);
      const further = finger(1, x, y + 40);
      fire('touchmove', [further, two], [further]);
    }, at);
    // The sheet follows the first finger to 40px, not 10px from a restart at the second touch.
    await expect(sheet).toHaveAttribute('style', /translateY\(40px\)/);
    await expect(page.locator('.sheet.is-shown')).toBeVisible();
    await context.close();
  });

  test('a release past 90px starts the slide-out at once', async ({ browser }) => {
    const { context, page, touch, at } = await openSheet(browser);
    await touch('touchStart', [{ ...at, id: 1 }]);
    await touch('touchMove', [{ x: at.x, y: at.y + 120, id: 1 }]);
    await touch('touchEnd', []);
    await expect(page.locator('.sheet.is-shown')).toHaveCount(0, { timeout: 100 });
    await expect(page.locator('.sheet[style*="translateY"]')).toHaveCount(0, { timeout: 100 });
    await context.close();
  });
});

test.describe('place field keyboard (audit B31)', () => {
  test('no autocorrect or spellcheck; Enter is "done" on Places and closes the keyboard', async ({ page }) => {
    await ready(page);
    const near = page.locator('#near');
    await expect(near).toHaveAttribute('autocorrect', 'off');
    await expect(near).toHaveAttribute('spellcheck', 'false');
    await expect(near).toHaveAttribute('enterkeyhint', 'done');
    await near.fill('Baguio');
    await near.press('Enter');
    await expect(near).not.toBeFocused();
  });

  test("an IME's Enter (keyCode 229) keeps the field and its keyboard (B54)", async ({ page }) => {
    await ready(page);
    const near = page.locator('#near');
    await near.focus();
    await near.evaluate((el) => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      Object.defineProperty(event, 'keyCode', { value: 229 });
      el.dispatchEvent(event);
    });
    await expect(near).toBeFocused();
  });

  test('Enter is "go" on Home', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#from')).toHaveAttribute('enterkeyhint', 'go');
    await expect(page.locator('#from')).toHaveAttribute('autocorrect', 'off');
  });
});

test('long press: no selection on tabs, segments and the switch; content stays selectable (audit B32)', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  await page.getByRole('button', { name: 'Use my location' }).click();
  const select = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).userSelect);
  for (const control of ['.tab-bar a', '.segmented button', '.switch']) expect(await select(control), control).toBe('none');
  for (const content of ['.footnotes p', '.facility-name a', 'main h1']) expect(await select(content), content).not.toBe('none');
});

test('a map popup keeps its colours, not Leaflet\'s link blue (audit B36)', async ({ page }) => {
  await ready(page);
  await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
  await expect(page.locator('.map')).toHaveAttribute('data-markers', '93');
  // A popup's content as placesMap.ts builds it, inside the map, where Leaflet's
  // `.leaflet-container a` applies.
  await page.evaluate(() => {
    const box = document.createElement('div');
    box.className = 'leaflet-popup-content';
    box.innerHTML = '<a class="map-popup-name" href="#">Name</a><div class="map-popup-address">Address</div>';
    document.querySelector('.leaflet-container')!.append(box);
  });
  await expect(page.locator('.leaflet-popup-content .map-popup-name')).toHaveCSS('color', 'rgb(23, 84, 88)');
  await expect(page.locator('.leaflet-popup-content .map-popup-address')).toHaveCSS('color', 'rgb(20, 33, 43)');
});
