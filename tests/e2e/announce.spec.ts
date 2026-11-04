// Updates that don't move focus are read out, and the route's headings don't skip a level
// (audit B28).
import { expect, test } from './fixtures.ts';

test('an "I need" change reads out the new route heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#tbph-places option').first()).toBeAttached();
  await page.locator('#from').fill('Quezon City');
  await page.getByRole('button', { name: 'Show me where to go' }).click();
  await expect(page.locator('.results h2')).toBeFocused();
  await page.locator('.choice', { hasText: 'Chest X-ray' }).first().click();
  const heading = await page.locator('.results h2').textContent();
  await expect(page.locator('#tbph-announce')).toHaveText(heading!);
  await expect(page.locator('#tbph-announce')).toHaveAttribute('role', 'status');
});

test('a single-service route goes H2, then H3 for each place', async ({ page }) => {
  await page.goto('/?need=xray&near=Quezon+City');
  await expect(page.locator('.results h2')).toBeVisible();
  await expect(page.locator('.results h4')).toHaveCount(0);
  await expect(page.locator('.results h3 a').first()).toBeVisible();
});

for (const path of ['/places', '/check']) {
  test(`an in-place language switch on ${path} reads out the new title`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.locator('.site-header [data-lang-link="fil"]').click();
    await expect(page).toHaveURL(new RegExp(`/fil${path}`));
    const title = await page.title();
    await expect(page.locator('#tbph-announce')).toHaveText(title);
  });
}
