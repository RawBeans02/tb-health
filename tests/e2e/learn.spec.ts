// Step 8: Learn (PLAN §5).
import { expect, test } from './fixtures.ts';

test.describe('Learn', () => {
  test('one H1, ten sections, the pack copy with its italics, steps and bullets', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('Learn about TB');
    await expect(page.locator('.learn-section > h2')).toHaveCount(10);
    await expect(page.locator('#l1 i')).toHaveText('Mycobacterium tuberculosis');
    await expect(page.locator('#l5 .learn-steps li')).toHaveCount(3);
    await expect(page.locator('#l8 .learn-bullets li')).toHaveCount(4);
    await expect(page.locator('#l5 .learn-actions a')).toHaveText(['Check your symptoms', 'Find TB care near you']);
    await expect(page.locator('#l5 .learn-actions .btn--primary')).toHaveCSS('min-height', '58px');
  });

  test('every "More in the data" link goes to its claim on the Data page, in the page language', async ({ page }) => {
    for (const [path, prefix] of [
      ['/learn', '/data#claim-'],
      ['/fil/learn', '/fil/data#claim-'],
    ] as const) {
      await page.goto(path);
      const hrefs = await page.locator('.claim-more').evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
      expect(hrefs).toHaveLength(17);
      for (const h of hrefs) expect(h.startsWith(prefix), h).toBe(true);
    }
  });

  test('myths and facts: an ARIA table, two columns from 720px, stacked with labels below', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/learn');
    const table = page.getByRole('table', { name: 'Myths and facts' });
    await expect(table.getByRole('row')).toHaveCount(10);
    await expect(table.getByRole('columnheader')).toHaveText(['Myth', 'Fact']);
    await expect(table.locator('.myth-label').first()).toBeHidden();
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(table.locator('.myths-head')).toBeHidden();
    await expect(table.locator('.myth-label').first()).toBeVisible();
  });

  test('contents: collapsible below 1080px, a sticky sidebar with scroll-spy from 1080px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/learn');
    const details = page.locator('.toc-narrow');
    await expect(page.locator('.toc-wide')).toBeHidden();
    await details.locator('summary').click();
    await expect(details.getByRole('link', { name: 'Treatment' })).toHaveAttribute('href', '#l6');

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(details).toBeHidden();
    await page.locator('#l6').scrollIntoViewIfNeeded();
    await page.evaluate(() => scrollBy(0, 1));
    await expect(page.locator('.toc-wide [aria-current="location"]')).toHaveText('Treatment');
  });

  test('"Back to top" scrolls up and moves focus to the main content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/learn');
    await page.locator('#l9 .to-top').scrollIntoViewIfNeeded();
    await page.locator('#l9 .to-top').click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('switching language mid-page at 390px keeps the section in place', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/learn');
    await page.evaluate(() => {
      const top = document.getElementById('l6')!.getBoundingClientRect().top + scrollY;
      scrollTo(0, top - 120);
    });
    await page.locator('.site-footer [data-lang-link="fil"]').evaluate((a) => (a as HTMLElement).click());
    await page.waitForURL((url) => url.pathname === '/fil/learn');
    await expect(page.locator('#l6 h2')).toHaveText('Gamutan');
    // Within sub-pixel rounding of where it was.
    await expect.poll(() => page.evaluate(() => Math.abs(document.getElementById('l6')!.getBoundingClientRect().top - 120))).toBeLessThanOrEqual(2);
  });

  test('has no sideways scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/fil/learn');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
