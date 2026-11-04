// The sticky header and the floating tab bar never hide what they shouldn't (audit B10, B14):
// link targets land below the header, Check's Next keeps 14px above the tab bar however many
// lines the tab labels take (lead's ruling on B14), the footer clears it, and focus stays
// visible when zoomed.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

/** The band between the header's bottom and the tab bar's top (or the window's bottom). */
function band(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('.site-header')!.getBoundingClientRect();
    const bar = document.querySelector('.tab-bar')!.getBoundingClientRect();
    return { top: header.bottom, bottom: bar.height > 0 ? bar.top : innerHeight };
  });
}

async function belowHeader(page: Page, selector: string) {
  const { top } = await band(page);
  await expect.poll(async () => (await page.locator(selector).boundingBox())!.y).toBeGreaterThanOrEqual(top - 1);
  const y = (await page.locator(selector).boundingBox())!.y;
  expect(y).toBeLessThan(top + 120);
}

test.describe('tab bar clearance (B14)', () => {
  for (const lang of ['en', 'fil'] as const) {
    for (const width of [360, 375, 390]) {
      test(`${lang} at ${width}px: Next sits 14px above the tab bar; the footer clears it`, async ({ page }) => {
        // The danger-signs step: long enough that Next sticks above the tab bar.
        await page.setViewportSize({ width, height: 640 });
        await page.goto(lang === 'fil' ? '/fil/check' : '/check');
        await page.getByRole('button', { name: lang === 'fil' ? 'Simulan' : 'Start' }).click();
        await expect(page.locator('main h1')).toBeFocused();
        await page.locator('.check-choice').first().click();
        await page.locator('.next-bar button').click();
        await expect(page.locator('.check-choice')).toHaveCount(5);
        await expect(page.locator('main h1')).toBeFocused();
        const next = (await page.locator('.next-bar button').boundingBox())!;
        const bar = (await page.locator('.tab-bar').boundingBox())!;
        expect(Math.abs(bar.y - (next.y + next.height) - 14)).toBeLessThanOrEqual(1);

        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        const last = (await page.locator('.site-footer-credit').boundingBox())!;
        expect(last.y + last.height).toBeLessThanOrEqual((await page.locator('.tab-bar').boundingBox())!.y);
      });
    }
  }
});

test.describe('link targets below the header (B10)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("Learn's contents", async ({ page }) => {
    await page.goto('/learn');
    await page.locator('.toc-narrow summary').click();
    const link = page.locator('.toc-narrow a').nth(3);
    const id = (await link.getAttribute('href'))!.split('#')[1];
    await link.click();
    await belowHeader(page, `#${id}`);
  });

  test("Data's index", async ({ page }) => {
    await page.goto('/data');
    const link = page.locator('.data-index a').nth(2);
    const id = (await link.getAttribute('href'))!.split('#')[1];
    await link.click();
    await belowHeader(page, `#${id}`);
  });

  test('#numbers and #accessibility', async ({ page }) => {
    await page.goto('/data#numbers');
    await belowHeader(page, '#numbers');
    await page.goto('/about#accessibility');
    await belowHeader(page, '#accessibility');
  });
});

test.describe('focus stays visible when zoomed (B10, WCAG 2.4.11)', () => {
  // 200% and 400% of a 1280 x 900 window.
  for (const [zoom, width, height] of [[200, 640, 450], [400, 320, 225]] as const) {
    test(`Shift+Tab through Places at ${zoom}%`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/places', { waitUntil: 'networkidle' });
      await page.locator('.site-footer a').last().focus();
      const hidden: string[] = [];
      const check = async () => {
        const { top, bottom } = await band(page);
        return page.evaluate(({ top, bottom }) => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el.closest('.site-header, .tab-bar')) return null;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return null;
          return Math.min(r.bottom, bottom) - Math.max(r.top, top) > 0 ? null : `${el.localName} "${(el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.top)}..${Math.round(r.bottom)}`;
        }, { top, bottom });
      };
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Shift+Tab');
        // WebKit sometimes scrolls a far-off field into view a moment after it takes focus.
        let seen = await check();
        for (let wait = 0; seen && wait < 10; wait++) {
          await page.waitForTimeout(100);
          seen = await check();
        }
        if (seen) hidden.push(seen);
      }
      expect(hidden).toEqual([]);
    });
  }
});
