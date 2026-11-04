// Step 6: place pages (PLAN §5). Sample data only.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

const ID = 'bangued-rural-health-unit-abra';
const PATH = `/place/${ID}`;

/** Sums layout shifts (Chromium's Layout Instability API) from the start of the page. */
async function trackShifts(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { shift: number };
    w.shift = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!entry.hadRecentInput) w.shift += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Not supported here.
    }
  });
}

test.describe('place page', () => {
  test('shows the place, its actions, services and details', async ({ page }) => {
    await page.goto(PATH);
    await expect(page).toHaveTitle('Bangued Rural Health Unit — TB PH');
    await expect(page.locator('h1')).toHaveText('Bangued Rural Health Unit');
    await expect(page.locator('h1')).toHaveCSS('color', 'rgb(196, 32, 50)');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://tb-ph.example${PATH}`);
    await expect(page.locator('.place-meta .badge')).toHaveText('Government — free TB care');
    await expect(page.locator('.place-address')).toHaveText('Actividad Economia St. Zone 3, Bangued, Abra');

    const commute = page.getByRole('link', { name: 'Commute directions: Bangued Rural Health Unit' });
    await expect(commute).toHaveAttribute('href', /travelmode=transit$/);
    expect((await commute.boundingBox())?.height).toBe(58);
    await expect(page.getByRole('link', { name: 'Walk: Bangued Rural Health Unit' })).toHaveAttribute('href', /travelmode=walking$/);
    await expect(page.getByRole('link', { name: 'Drive: Bangued Rural Health Unit' })).toHaveAttribute('href', /travelmode=driving$/);
    await expect(page.getByRole('link', { name: /^Call before you go: Bangued Rural Health Unit, / })).toHaveAttribute('href', 'tel:+637461401845');

    await expect(page.locator('.service-name')).toHaveText(['Chest X-ray', 'TB test (sputum)', 'Free TB medicines']);
    await expect(page.locator('.detail-row dt')).toHaveText(['Hours', 'Phone', 'Region', 'Accreditation until']);
    await expect(page.locator('.detail-row dd')).toHaveText(['Not listed. Call first.', '07461401845', 'Cordillera (CAR)', '31 December 2026']);
    await expect(page.locator('.footnotes')).toContainText('Sample data: places are pinned at approximate city centres');
    await expect(page.locator('main .install-entry')).toBeVisible();
    await expect(page.locator('.stop-panel')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Find TB care' }).first()).toHaveAttribute('href', '/');
  });

  test('in Filipino, with Filipino labels, date and links', async ({ page }) => {
    await page.goto(`/fil${PATH}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    await expect(page.locator('.detail-row dt')).toHaveText(['Oras', 'Telepono', 'Rehiyon', 'Accredited hanggang']);
    await expect(page.locator('.detail-row dd').last()).toHaveText('31 Disyembre 2026');
    await expect(page.locator('.install-row')).toHaveAttribute('href', '/fil/install');
  });

  test('a valid stop shows the route motif before paint, with no layout shift', async ({ page, browserName }) => {
    await trackShifts(page);
    await page.goto(`${PATH}?stop=2`);
    await expect(page.locator('html')).toHaveAttribute('data-stop', '2');
    await expect(page.locator('.stop-label:visible')).toHaveText("You're at stop 2 of 3");
    await expect(page.locator('.motif-step[data-n="2"] .motif-name')).toHaveCSS('font-weight', '700');
    await expect(page.locator('.motif-step[data-n="3"] .motif-disc')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('.back-link')).toContainText('Back to your route');
    await page.waitForLoadState('load');
    if (browserName === 'chromium') expect(await page.evaluate(() => (window as unknown as { shift: number }).shift)).toBe(0);
  });

  test('ignores an invalid stop', async ({ page }) => {
    await page.goto(`${PATH}?stop=9`);
    await expect(page.locator('html')).not.toHaveAttribute('data-stop');
    await expect(page.locator('.stop-panel')).toBeHidden();
  });

  test('"Back to your route" returns to the route on Home', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tbph-places option').first()).toBeAttached();
    await page.locator('#from').fill('Bangued, Abra');
    await page.getByRole('button', { name: 'Show me where to go' }).click();
    await page.locator('.facility-name a').first().click();
    await expect(page).toHaveURL(/\/place\/[a-z0-9-]+\?stop=1$/);
    await page.getByRole('link', { name: 'Back to your route' }).click();
    await expect(page).toHaveURL(/\/\?need=all&near=Bangued%2C\+Abra$/);
    await expect(page.locator('.results h2')).toHaveText(/^Your TB care route: 3 stops\./);
  });

  test('shows a distance only from a typed place in the URL (Q4b)', async ({ page }) => {
    const gazetteer: string[] = [];
    page.on('request', (r) => r.url().includes('/data/gazetteer.json') && gazetteer.push(r.url()));
    await page.goto(PATH);
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(gazetteer).toHaveLength(0);
    await expect(page.locator('.place-dist')).toHaveCount(0);

    await page.goto(`${PATH}?near=Baguio`);
    await expect(page.locator('.place-dist')).toHaveText(/^about \d+ km$/);
    await page.goto(`${PATH}?near=12%20Synthetic%20Street`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.place-dist')).toHaveCount(0);
  });

  test('copies the address for Sakay.ph, then opens it', async ({ page, context, browserName }) => {
    await context.route('https://sakay.ph/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>sakay</title>' }));
    if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PATH);
    const opened = context.waitForEvent('page');
    await page.getByRole('button', { name: 'Copy address for Sakay.ph' }).click();
    expect((await opened).url()).toBe('https://sakay.ph/');
    const status = page.locator('.place-copied');
    if (browserName === 'chromium') {
      await expect(status).toHaveText('Copied. Paste it into Sakay.ph.');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Bangued Rural Health Unit, Actividad Economia St. Zone 3, Bangued, Abra');
    } else {
      await expect(status).toHaveText(/^(Copied\. Paste it into Sakay\.ph\.|Copy this address into Sakay\.ph: Bangued Rural Health Unit, .+)$/);
    }
  });

  test('shows the offline line, and hides the install row in the installed app', async ({ page }) => {
    await page.goto(PATH);
    await page.context().setOffline(true);
    await expect(page.locator('.offline-line')).toHaveText(/You're offline\. Showing the saved details for this center\./);
    await page.context().setOffline(false);
    await page.evaluate(() => document.documentElement.setAttribute('data-standalone', 'true'));
    await expect(page.locator('main .install-entry')).toBeHidden();
  });

  test('has no sideways scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`${PATH}?stop=3`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test.describe('missing place', () => {
  test.use({ expectedErrors: [/status of 404/] });

  for (const [path, lang, h1, more] of [
    ['/place/no-such-place', 'en', "This place isn't on the list.", '/places'],
    ['/fil/place/wala-nito', 'fil', 'Wala sa listahan ang lugar na ito.', '/fil/places'],
  ] as const) {
    test(`${path} is a 404 in ${lang}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('main .btn--primary')).toHaveAttribute('href', more);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    });
  }
});
