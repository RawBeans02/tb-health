// A smoke set on real phone settings (audit B42): the iphone (iPhone 13, WebKit) and pixel
// (Pixel 7, Chromium) projects run only the @phone tests, here.
import { expect, test } from './fixtures.ts';

test.describe('on a phone @phone', () => {
  test('the platform is read as the phone it is', async ({ page, browserName }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-platform', browserName === 'webkit' ? 'ios' : 'android');
  });

  test('the Filters sheet opens, and closes by swipe (Pixel) or Done', async ({ page, browserName, context }) => {
    await page.goto('/places');
    await expect(page.locator('.places-toolbar h2')).toHaveText('93 centers');
    await page.getByRole('button', { name: 'Filters', exact: true }).tap();
    const dialog = page.getByRole('dialog', { name: 'Filters' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Filters' })).toBeFocused();
    if (browserName === 'chromium') {
      await page.waitForTimeout(300);
      const g = (await page.locator('.sheet-grab').boundingBox())!;
      const cdp = await context.newCDPSession(page);
      const at = { x: g.x + g.width / 2, y: g.y + 12 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...at, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: at.x, y: at.y + 140, id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await dialog.getByRole('button', { name: 'Done' }).tap();
    }
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeFocused();
  });

  test('a place page shows its actions, each at least 44px tall', async ({ page }) => {
    await page.goto('/place/bangued-rural-health-unit-abra?stop=2');
    await expect(page.locator('h1')).toHaveText('Bangued Rural Health Unit');
    const actions = page.locator('.place-actions a.btn, .place-actions button, .place-call');
    await expect(actions).toHaveCount(5);
    for (const action of await actions.all()) expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('.place-commute')).toHaveAttribute('href', /google\.com\/maps\/dir\/\?api=1/);
    await expect(page.locator('.place-call')).toHaveAttribute('href', /^tel:\+63/);
  });

  test("Check's Next stays above the tab bar", async ({ page }) => {
    await page.goto('/check');
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.locator('.check-choice').first().tap();
    await page.locator('.next-bar button').tap();
    await expect(page.locator('.check-choice')).toHaveCount(5);
    const next = (await page.locator('.next-bar button').boundingBox())!;
    const bar = (await page.locator('.tab-bar').boundingBox())!;
    expect(next.y + next.height).toBeLessThanOrEqual(bar.y);
  });

  test('Install puts this phone first and leaves out the computer', async ({ page, browserName }) => {
    await page.goto('/install');
    const first = page.locator('main section[aria-labelledby$="-h"]:visible h2').first();
    await expect(first).toHaveText(browserName === 'webkit' ? 'On iPhone or iPad (Safari)' : 'On Android (Chrome)');
    await expect(page.locator('#desktop')).toBeHidden();
  });
});
