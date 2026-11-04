// Selected states stay visible in forced colours (audit B11, B44). Chromium emulates the mode.
// Each selected state must compute to the system's Highlight colours, read from a probe, not
// merely differ from its neighbours (the author colours differ too, but at about 2.3:1).
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.skip(({ browserName }) => browserName !== 'chromium', 'forced-colors emulation is Chromium only');

const colours = (el: Locator) => el.evaluate((e) => { const cs = getComputedStyle(e); return { bg: cs.backgroundColor, fg: cs.color }; });

/** The system colours this browser uses in forced-colours mode. */
function systemColours(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.cssText = 'forced-color-adjust: none; background: Highlight; color: HighlightText';
    document.body.append(probe);
    const highlight = { bg: getComputedStyle(probe).backgroundColor, fg: getComputedStyle(probe).color };
    probe.style.cssText = 'forced-color-adjust: none; background: Canvas';
    const canvas = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { highlight, canvas };
  });
}

test('selected segment, current tab and current language are Highlight; the switch is Canvas off and Highlight on', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/places', { waitUntil: 'networkidle' });
  const system = await systemColours(page);

  expect(await colours(page.getByRole('group', { name: 'View' }).locator('button[aria-pressed="true"]'))).toEqual(system.highlight);
  expect(await colours(page.locator('.tab-bar a[aria-current]'))).toEqual(system.highlight);
  expect(await colours(page.locator('.site-header .lang-toggle a[aria-current]'))).toEqual(system.highlight);

  // The switch shows once a location is known; it starts on.
  await page.context().grantPermissions(['geolocation']);
  await page.getByRole('button', { name: 'Use my location' }).click();
  const sw = page.getByRole('switch');
  const track = sw.locator('.switch-track');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect((await colours(track)).bg).toBe(system.highlight.bg);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect((await colours(track)).bg).toBe(system.canvas);
});
