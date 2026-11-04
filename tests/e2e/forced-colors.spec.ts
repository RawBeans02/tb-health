// Selected states stay visible in forced colours (audit B11). Chromium emulates the mode.
import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.skip(({ browserName }) => browserName !== 'chromium', 'forced-colors emulation is Chromium only');

const colours = (el: Locator) => el.evaluate((e) => { const cs = getComputedStyle(e); return `${cs.backgroundColor} ${cs.color}`; });

test('selected segment, current tab, current language and the switch differ from their neighbours', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/places', { waitUntil: 'networkidle' });

  const view = page.getByRole('group', { name: 'View' });
  expect(await colours(view.locator('button[aria-pressed="true"]'))).not.toBe(await colours(view.locator('button[aria-pressed="false"]').first()));
  expect(await colours(page.locator('.tab-bar a[aria-current]'))).not.toBe(await colours(page.locator('.tab-bar a:not([aria-current])').first()));
  const toggle = page.locator('.site-header .lang-toggle');
  expect(await colours(toggle.locator('a[aria-current]'))).not.toBe(await colours(toggle.locator('a:not([aria-current])')));

  // The switch shows once a location is known.
  await page.context().grantPermissions(['geolocation']);
  await page.getByRole('button', { name: 'Use my location' }).click();
  const sw = page.getByRole('switch');
  const track = sw.locator('.switch-track');
  const on = await colours(track);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(await colours(track)).not.toBe(on);
});
