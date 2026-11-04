// Step 4: Home, the route planner (PLAN §5). Sample data only; locations are synthetic.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { chromeSnapshot } from './helpers.ts';

const FAR = { latitude: 18.565, longitude: 120.79 }; // the prototype's "far" demo point

const field = (page: Page) => page.locator('#from');
const submit = (page: Page) => page.getByRole('button', { name: 'Show me where to go' });
const heading = (page: Page) => page.locator('.results h2');

/** Records every value of data-drawn on the route, to see whether it animated. */
async function watchDrawn(page: Page) {
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { drawnSeen: string[] }).drawnSeen = seen;
    new MutationObserver(() => {
      const route = document.querySelector('.route');
      if (route) seen.push(route.getAttribute('data-drawn') ?? '');
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-drawn'] });
  });
}
const drawnSeen = (page: Page) => page.evaluate(() => (window as unknown as { drawnSeen: string[] }).drawnSeen);

/** Counts calls to the browser's location API. */
async function countLocationRequests(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { locationRequests: number };
    w.locationRequests = 0;
    const original = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = (...args: Parameters<Geolocation['getCurrentPosition']>) => {
      w.locationRequests += 1;
      original(...args);
    };
  });
}
const locationRequests = (page: Page) => page.evaluate(() => (window as unknown as { locationRequests: number }).locationRequests);

async function ready(page: Page, path = '/') {
  await page.goto(path);
  // The datalist fills once the facility list has loaded and the island has hydrated.
  await expect(page.locator('#tbph-places option').first()).toBeAttached();
}

test.describe('planner', () => {
  test('an empty submit asks for a place and returns focus to the field', async ({ page }) => {
    await ready(page);
    await submit(page).click();
    const message = page.locator('#from-msg');
    await expect(message).toHaveText('Type your barangay or city, or use your location.');
    await expect(message).toHaveAttribute('role', 'alert');
    await expect(field(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(field(page)).toBeFocused();
    await expect(field(page)).toHaveCSS('border-top-color', 'rgb(196, 32, 50)');
  });

  test('a typed city plans the route and moves focus to its heading', async ({ page, browserName }) => {
    await ready(page);
    await field(page).fill('Quezon City');
    // Safari's suggestion list takes the first Enter while it has matches; the second submits.
    // Native behaviour, as in the prototype.
    if (browserName === 'webkit') await field(page).press('Enter');
    await field(page).press('Enter');
    await expect(heading(page)).toBeFocused();
    await expect(heading(page)).toHaveText('Your TB care route: 3 stops. The nearest is about 1 km away.');
    expect(new URL(page.url()).search).toBe('?need=all&near=Quezon+City');
    await expect(page.locator('.stop-title')).toHaveText(['1. Get a chest X-ray', '2. Give a sputum sample for a TB test', '3. Start free TB medicines']);
    await expect(page.locator('.route-step').first().locator('.info-line')).toHaveCount(0);
    await expect(page.locator('.info-line').first()).toContainText("We don't have confirmed X-ray sites near you yet.");
    await expect(page.locator('.route-notes')).toContainText('Sample data: places are pinned at approximate city centres');
  });

  test('place links carry only id and stop; Places links keep the matched place (Q4)', async ({ page }) => {
    await ready(page);
    await field(page).fill('Quezon City');
    await submit(page).click();
    for (const link of await page.locator('.facility-name a').all()) {
      expect(await link.getAttribute('href')).toMatch(/^\/place\/[a-z0-9-]+\?stop=[123]$/);
    }
    await expect(page.locator('.link-row').first()).toHaveAttribute('href', '/places?svc=xray&near=Quezon+City');
    const commute = page.locator('.facility-actions a').first();
    await expect(commute).toHaveAttribute('target', '_blank');
    await expect(commute).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=.+&travelmode=transit$/);
  });

  test('typed text that matches no place stays out of the URL (Q4)', async ({ page }) => {
    await ready(page);
    await field(page).fill('12 Synthetic Street');
    await submit(page).click();
    await expect(heading(page)).toHaveText('No centers match your search.');
    await expect(heading(page)).toBeFocused();
    expect(new URL(page.url()).search).toBe('?need=all');
  });

  test('changing "I need" recomputes without animating', async ({ page }) => {
    await ready(page);
    await field(page).fill('Quezon City');
    await submit(page).click();
    await expect(page.locator('.route')).toHaveAttribute('data-drawn', 'true');
    await watchDrawn(page);
    await page.locator('label.choice', { hasText: 'Free TB medicines' }).click();
    await expect(page.getByRole('radio', { name: 'Free TB medicines', exact: true })).toBeChecked();
    await expect(heading(page)).toHaveText('Start free TB medicines');
    await expect(page.locator('.stop-title')).toHaveCount(0);
    expect(await drawnSeen(page)).not.toContain('false');
    expect(new URL(page.url()).search).toBe('?need=meds&near=Quezon+City');
    // Single-stop routes link places without a stop number.
    expect(await page.locator('.facility-name a').first().getAttribute('href')).toMatch(/^\/place\/[a-z0-9-]+$/);
  });

  test('a new route draws in, and appears drawn at once under reduced motion', async ({ page }) => {
    await ready(page);
    await watchDrawn(page);
    await field(page).fill('Quezon City');
    await submit(page).click();
    await expect(page.locator('.route')).toHaveAttribute('data-drawn', 'true');
    expect((await drawnSeen(page))[0]).toBe('false');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    await watchDrawn(page);
    await field(page).fill('Baguio');
    await submit(page).click();
    await expect(heading(page)).toBeFocused();
    expect(await drawnSeen(page)).not.toContain('false');
    await expect(page.locator('.rail-fill').first()).toHaveCSS('transition-duration', '0s');
  });

  test('deep links restore the plan', async ({ page }) => {
    await ready(page, '/?need=test&near=Bangued%2C+Abra');
    await expect(field(page)).toHaveValue('Bangued, Abra');
    await expect(heading(page)).toHaveText('Give a sputum sample for a TB test');
    await expect(page.getByRole('radio', { name: 'TB test (sputum)', exact: true })).toBeChecked();
  });

  test('works with no sideways scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await ready(page);
    await field(page).fill('Quezon City');
    await submit(page).click();
    await expect(heading(page)).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test.describe('location', () => {
  test('is asked for only on a tap, also for ?loc=gps links (Q4)', async ({ page }) => {
    await countLocationRequests(page);
    await ready(page, '/?loc=gps');
    await expect(page.getByRole('button', { name: 'Use my location' })).toBeVisible();
    expect(await locationRequests(page)).toBe(0);
  });

  test('denied: says so and returns focus to the field', async ({ page }) => {
    await countLocationRequests(page);
    await ready(page);
    await page.getByRole('button', { name: 'Use my location' }).click();
    await expect(page.locator('#from-msg')).toHaveText('No problem. Type your barangay or city instead.');
    await expect(page.locator('#from-msg')).toHaveAttribute('role', 'status');
    await expect(field(page)).toBeFocused();
    expect(await locationRequests(page)).toBe(1);
  });

  test('granted: routes from "My location", with no coordinates in the URL', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(FAR);
    await ready(page);
    await page.getByRole('button', { name: 'Use my location' }).click();
    await expect(heading(page)).toBeFocused();
    await expect(field(page)).toHaveValue('My location');
    await expect(page.locator('.route-origin')).toHaveText('My location');
    await expect(page.locator('.info-line', { hasText: 'Nothing within 10 km' })).toHaveCount(2);
    expect(new URL(page.url()).search).toBe('?need=all&loc=gps');
    expect(page.url()).not.toMatch(/18\.5|120\.7/);
    await expect(page.locator('html')).toHaveAttribute('data-lang-switch', 'inplace');

    // Q4: emptying the field doesn't reuse the old fix.
    await field(page).fill('');
    await submit(page).click();
    await expect(page.locator('#from-msg')).toHaveText('Type your barangay or city, or use your location.');
    await expect(page.locator('.route')).toHaveCount(0);
    expect(new URL(page.url()).search).toBe('?need=all');
  });

  test('with a fix held, the language switches in place and matches a fresh Filipino page', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // Same query as the switched page will have: the language links carry it.
    await ready(page, '/fil?need=all&loc=gps');
    const fresh = await chromeSnapshot(page);
    const freshText = await page.locator('#planner form').innerText();

    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(FAR);
    await ready(page);
    await page.getByRole('button', { name: 'Use my location' }).click();
    await expect(heading(page)).toBeFocused();
    await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));

    await page.locator('.site-header [data-lang-link="fil"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe('/fil?need=all&loc=gps');
    await expect(field(page)).toHaveValue('Ang aking lokasyon');
    await expect(heading(page)).toHaveText(/^Ang iyong daan sa gamutan sa TB: 3 hintuan\. Ang pinakamalapit ay mga \d+ km ang layo\.$/);
    expect(await chromeSnapshot(page)).toEqual(fresh);
    expect(await page.locator('#planner form').innerText()).toBe(freshText);
    for (const link of await page.locator('main a[href^="/"]').all()) expect(await link.getAttribute('href')).toMatch(/^\/fil(\/|$|\?)/);
  });
});

test.describe('facility list errors (Q6)', () => {
  test.use({ expectedErrors: [/status of 503/] });

  test('a failed load shows "Try again", never the sample; retrying neither re-prompts nor loses the field', async ({ page }) => {
    await countLocationRequests(page);
    await page.route('**/data/facilities.json', (route) => route.fulfill({ status: 503, body: '' }));
    await page.goto('/?near=Quezon+City&loc=gps');
    const alert = page.locator('.results-error');
    await expect(alert).toContainText('The list could not be loaded. Check your connection and try again.');
    await expect(page.locator('#tbph-places option')).toHaveCount(0);

    await field(page).fill('Baguio');
    await page.unroute('**/data/facilities.json');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('#tbph-places option').first()).toBeAttached();
    await expect(alert).toHaveCount(0);
    // The URL's place doesn't overwrite what the reader typed, and nothing asks for location.
    await expect(field(page)).toHaveValue('Baguio');
    expect(await locationRequests(page)).toBe(0);
    await submit(page).click();
    await expect(heading(page)).toHaveText(/^Your TB care route: 3 stops\./);
    expect(new URL(page.url()).search).toBe('?near=Baguio+City&need=all');
  });
});

test.describe('look', () => {
  test('frosted planner sheet turns solid under more contrast', async ({ page }) => {
    await ready(page);
    const sheet = page.locator('.planner-sheet');
    await expect(sheet).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.64)');
    await page.emulateMedia({ contrast: 'more' });
    await expect(sheet).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  test('controls are as specced: field 58px, location 48px, rows 56px, primary 58px', async ({ page }) => {
    await ready(page);
    expect((await field(page).boundingBox())?.height).toBe(58);
    expect((await page.locator('.locate').boundingBox())?.height).toBe(48);
    for (const h of await page.locator('.choice').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(56);
    expect((await submit(page).boundingBox())?.height).toBe(58);
  });
});
