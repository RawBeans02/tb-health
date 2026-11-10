// Step 15.6: Install without JavaScript shows only the steps (the owner's brief). The line for
// the installed app and the one-tap button are hidden in the HTML, and the page's scripts show
// them in the states where they belong (about.spec.ts), so with no script, and even with no
// stylesheet, neither shows nor reaches the accessibility tree.
import type { Page } from '@playwright/test';
import { install } from '../../src/content/install.ts';
import { expect, test } from './fixtures.ts';

test.use({ javaScriptEnabled: false });

/** The steps and nothing else: Android, then iPhone, as the HTML has them (the device order and the computer steps need the script). */
async function onlyTheSteps(page: Page, lang: 'en' | 'fil') {
  // No script ran: prepaint.js sets data-platform on every page.
  await expect(page.locator('html')).not.toHaveAttribute('data-platform');
  await expect(page.locator('main h1')).toHaveText(install.h1[lang]);
  await expect(page.locator('main section[aria-labelledby$="-h"]:visible h2')).toHaveText([install.android[lang], install.ios[lang], install.offH[lang]]);
  await expect(page.locator('#android li:visible, #ios li:visible')).toHaveCount(6);
  for (const part of ['.install-done', '.install-action']) {
    await expect(page.locator(part), part).toHaveAttribute('hidden', '');
    await expect(page.locator(part), part).toBeHidden();
  }
  await expect(page.getByRole('status').filter({ hasText: install.installed[lang] })).toHaveCount(0);
  await expect(page.locator('main').getByRole('button')).toHaveCount(0);
  const tree = await page.locator('main').ariaSnapshot();
  expect(tree).not.toContain(install.installed[lang]);
  expect(tree).not.toMatch(/^\s*- button\b/m);
}

for (const lang of ['en', 'fil'] as const) {
  const path = lang === 'fil' ? '/fil/install' : '/install';

  test(`${path} without JavaScript shows only the steps`, async ({ page }) => {
    await page.goto(path);
    await onlyTheSteps(page, lang);
  });

  test(`${path} without JavaScript or the stylesheet still shows only the steps`, async ({ page }) => {
    // The hidden attribute alone keeps them out, as in a reading view or a text browser.
    await page.route('**/*.css', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await page.goto(path);
    await onlyTheSteps(page, lang);
  });
}
