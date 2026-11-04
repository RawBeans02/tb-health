// The focus ring is never clipped (audit B1; README:40, :116; WCAG 2.4.7). Tabs through each
// page at 390px and checks that every focused element's 3px ring lies inside every ancestor
// that clips. The Places map's ring is drawn by its frame.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

/** Where the focused element's ring would be cut off, or null when it shows in full. */
function clippedRing(page: Page) {
  return page.evaluate(() => {
    let el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    if (el.classList.contains('leaflet-container')) el = el.closest('.map-frame') as HTMLElement;
    const cs = getComputedStyle(el);
    if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0) return `${el.localName}.${el.className}: no ring`;
    const grow = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    const ring = { left: r.left - grow, top: r.top - grow, right: r.right + grow, bottom: r.bottom + grow };
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflowX === 'visible' && ps.overflowY === 'visible') continue;
      const b = p.getBoundingClientRect();
      const box = {
        left: b.left + parseFloat(ps.borderLeftWidth),
        top: b.top + parseFloat(ps.borderTopWidth),
        right: b.right - parseFloat(ps.borderRightWidth),
        bottom: b.bottom - parseFloat(ps.borderBottomWidth),
      };
      const sideways = ps.overflowX !== 'visible' && (ring.left < box.left - 0.5 || ring.right > box.right + 0.5);
      const vertical = ps.overflowY !== 'visible' && (ring.top < box.top - 0.5 || ring.bottom > box.bottom + 0.5);
      if (sideways || vertical) return `${el.localName}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 30)}" clipped by ${p.localName}.${[...p.classList].join('.')}`;
    }
    return null;
  });
}

/** Tabs through the page (up to `stops` times) and lists every clipped ring. */
async function tabThrough(page: Page, stops = 120) {
  const problems = new Set<string>();
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');
    const problem = await clippedRing(page);
    if (problem) problems.add(problem);
  }
  return [...problems];
}

test.describe('focus ring', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  for (const path of ['/place/bangued-rural-health-unit-abra', '/learn', '/about', '/fil/about', '/install']) {
    test(`shows in full on every stop of ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(await tabThrough(page)).toEqual([]);
    });
  }

  test('shows in full on the Data page, Methods summary included', async ({ page }) => {
    await page.goto('/data', { waitUntil: 'networkidle' });
    await page.locator('#methods summary').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('#methods summary')).toBeFocused();
    expect(await clippedRing(page)).toBeNull();
    expect(await tabThrough(page, 60)).toEqual([]);
  });

  test("shows in full on a Check result's rows", async ({ page }) => {
    await page.goto('/check');
    await page.getByRole('button', { name: 'Start' }).click();
    for (const labels of [['Myself'], ['None of these'], ['Cough, with or without phlegm'], ['No'], ['No'], ['None of these']]) {
      for (const label of labels) await page.locator('.check-choice', { hasText: new RegExp(`^${label}`) }).first().click();
      await page.locator('.next-bar button').click();
    }
    await expect(page.locator('main h1')).toHaveText('Get tested for TB this week.');
    // The result moves focus to its heading after paint; tabbing before that lands back on it.
    await expect(page.locator('main h1')).toBeFocused();
    expect(await tabThrough(page, 40)).toEqual([]);
  });

  test('the Places map: its frame draws the ring', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.alloc(0) }));
    await page.goto('/places', { waitUntil: 'networkidle' });
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).focus();
    for (let i = 0; i < 10 && !(await page.locator('.leaflet-container').evaluate((m) => m === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(page.locator('.leaflet-container')).toBeFocused();
    await expect(page.locator('.map-frame')).toHaveCSS('outline-style', 'solid');
    expect(await clippedRing(page)).toBeNull();
  });
});
