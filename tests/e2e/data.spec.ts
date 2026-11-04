// Step 9 (charts and TB in numbers): the Data page (PLAN §5).
import { expect, test } from './fixtures.ts';

test.describe('Data', () => {
  test('twenty chart panels, each with a labelled chart and a table on request', async ({ page }) => {
    await page.goto('/data');
    const panels = page.locator('section.panel');
    await expect(panels).toHaveCount(20);
    for (const id of ['d1', 'd5', 'd14', 'd20']) await expect(page.locator(`#${id} h2`)).not.toBeEmpty();
    for (const svg of await page.locator('.chart svg').all()) await expect(svg).toHaveAttribute('aria-label', /.+/);
    const d1 = page.locator('#d1');
    const button = d1.getByRole('button', { name: 'View as table' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(d1.getByRole('button', { name: 'Hide table' })).toHaveAttribute('aria-expanded', 'true');
    const table = d1.getByRole('table').first();
    await expect(table.getByRole('columnheader').first()).toHaveText('Year');
    expect(await table.getByRole('row').count()).toBeGreaterThan(10);
  });

  test('charts are laid out at the panel width, so labels keep their size', async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/data');
      const svg = page.locator('#d1 .chart svg').first();
      await svg.scrollIntoViewIfNeeded();
      await expect.poll(async () => {
        const [vbWidth, rendered] = await svg.evaluate((el) => [Number(el.getAttribute('viewBox')!.split(' ')[2]), el.getBoundingClientRect().width]);
        return Math.abs(vbWidth - rendered);
      }).toBeLessThanOrEqual(1);
    }
  });

  test('d5 switches between estimated and notified cases', async ({ page }) => {
    await page.goto('/data');
    const d5 = page.locator('#d5');
    await d5.scrollIntoViewIfNeeded();
    const toggle = d5.locator('.panel-toggle button');
    await expect(toggle.first()).toHaveAttribute('aria-pressed', 'true');
    const before = await d5.locator('.chart svg').first().innerHTML();
    await toggle.nth(1).click();
    await expect(toggle.nth(1)).toHaveAttribute('aria-pressed', 'true');
    expect(await d5.locator('.chart svg').first().innerHTML()).not.toBe(before);
  });

  test('TB in numbers: all 44 claims, a topic picker, and deep links that focus the row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/data#claim-burden-cases');
    await expect(page.locator('[id^="claim-"]')).toHaveCount(44);
    await expect(page.locator('#claim-burden-cases')).toBeFocused();
    await page.getByRole('group', { name: 'Topic' }).getByRole('button', { name: 'Funding' }).click();
    await expect(page.locator('.numbers-group:visible')).toHaveCount(1);
    await expect(page.locator('.numbers-group:visible h3')).toHaveText('Funding');
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('#topic').selectOption('all');
    await expect(page.locator('.numbers-group:visible')).toHaveCount(11);
  });

  test("every claim Learn links to exists here, in both languages", async ({ page }) => {
    for (const [learn, data] of [
      ['/learn', '/data'],
      ['/fil/learn', '/fil/data'],
    ] as const) {
      await page.goto(learn);
      const ids = (await page.locator('.claim-more').evaluateAll((els) => els.map((el) => el.getAttribute('href')!.split('#')[1])));
      await page.goto(data);
      for (const id of ids) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    }
  });

  test('has no sideways scroll at 320px; wide tables scroll inside their region', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/fil/data');
    await page.locator('#d4').scrollIntoViewIfNeeded();
    await page.locator('#d4').getByRole('button', { name: 'Ipakita bilang talaan' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});
