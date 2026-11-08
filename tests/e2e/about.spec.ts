// Step 10: About and Install (PLAN §5).
import type { Browser, Page } from '@playwright/test';
import { formatDate, LAST_UPDATED } from '../../src/lib/dates.ts';
import { expect, test } from './fixtures.ts';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

/** Runs as the installed app: prepaint reads navigator.standalone (iOS's flag). */
async function installed(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
}

/** Fires a stand-in for Chrome's beforeinstallprompt, answering with `outcome`. */
async function offerInstall(page: Page, outcome: 'accepted' | 'dismissed') {
  await page.evaluate((choice) => {
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: choice });
    dispatchEvent(event);
  }, outcome);
}

async function onDevice(browser: Browser, userAgent: string) {
  const context = await browser.newContext({ userAgent, viewport: { width: 390, height: 800 } });
  return { context, page: await context.newPage() };
}

test.describe('About', () => {
  test('has every section in order, under its H2', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('main h1')).toHaveText('About');
    await expect(page.locator('main h1')).toHaveCSS('color', 'rgb(196, 32, 50)');
    await expect(page.locator('main h2')).toHaveText([
      'Our partners',
      'Medical review',
      'Disclaimer',
      'Privacy',
      'Data and updates',
      'Use TB PH like an app',
      'Accessibility',
      'Helpful numbers',
      'Contact',
    ]);
    await expect(page.locator('#updates p')).toHaveText(new RegExp(`^Data last updated ${formatDate(LAST_UPDATED, 'en')}\\. `));
    await expect(page.locator('#app').getByRole('link', { name: 'How to install' })).toHaveAttribute('href', '/install');
  });

  test('privacy shows the prototype rows, then the owner’s row on outside services (Q5), in both languages', async ({ page }) => {
    await page.goto('/about');
    const rows = page.locator('#privacy li');
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toHaveText(/^There are no accounts/);
    await expect(rows.last()).toHaveText(/^TB PH serves its own fonts/);
    await expect(page.locator('#privacy')).not.toContainText('Google Fonts');
    await page.goto('/fil/about');
    await expect(rows).toHaveCount(4);
    await expect(rows.last()).toHaveText(/^Ang TB PH mismo ang nagbibigay/);
  });

  test('helpful numbers: no blank rows, exact tel: links of 44px, the 1555 note from V4', async ({ page }) => {
    await page.goto('/about');
    const rows = page.locator('#numbers li');
    await expect(rows).toHaveCount(5);
    for (const row of await rows.all()) {
      await expect(row.locator('.number-name')).not.toBeEmpty();
      await expect(row.locator('.number-note')).not.toBeEmpty();
    }
    const tels = page.locator('#numbers a');
    await expect(tels).toHaveText(['911', '1555', '8924-6101 loc. 1856–1857', '8356-5857 loc. 125']);
    expect(await tels.evaluateAll((links) => links.map((a) => a.getAttribute('href')))).toEqual(['tel:911', 'tel:1555', 'tel:+63289246101', 'tel:+63283565857']);
    await expect(tels.first()).toHaveAccessibleName('Call Emergency (police, fire, medical), 911');
    for (const tel of await tels.all()) expect((await tel.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const note = rows.nth(1).locator('.number-note');
    await expect(note).toHaveText('Press 2 for the National Patient Navigation and Referral Center.');
    await expect(note).toHaveCSS('color', 'rgb(86, 98, 106)');
  });

  test('the footer’s Accessibility link lands on its section', async ({ page }) => {
    await page.goto('/learn');
    await page.locator('.site-footer').getByRole('link', { name: 'Accessibility' }).click();
    await expect(page).toHaveURL(/\/about#accessibility$/);
    await expect(page.locator('#accessibility h2')).toBeInViewport();
  });

  test('in Filipino, with the same numbers', async ({ page }) => {
    await page.goto('/fil/about');
    await expect(page.locator('main h1')).toHaveText('Tungkol sa amin');
    await expect(page.locator('#numbers li').nth(1).locator('.number-note')).toHaveText('Pindutin ang 2 para sa National Patient Navigation and Referral Center.');
    await expect(page.locator('#numbers a').first()).toHaveAccessibleName('Tumawag sa Emergency (pulis, bumbero, medikal), 911');
    await expect(page.locator('#app a')).toHaveAttribute('href', '/fil/install');
  });

  test('hides "Use TB PH like an app" in the installed app', async ({ page }) => {
    await installed(page);
    await page.goto('/about');
    await expect(page.locator('#app')).toBeHidden();
    await expect(page.locator('#numbers')).toBeVisible();
  });
});

test.describe('Install', () => {
  const sections = (page: Page) => page.locator('main section[aria-labelledby$="-h"]:visible h2');

  test('orders the steps for the device: computer first on a desktop', async ({ page }) => {
    await page.goto('/install');
    await expect(page.locator('main h1')).toHaveText('Use TB PH like an app.');
    await expect(sections(page)).toHaveText(['On a computer (Chrome or Edge)', 'On Android (Chrome)', 'On iPhone or iPad (Safari)', 'What works without a signal']);
    await expect(page.locator('#desktop li')).toHaveCount(3);
    await expect(page.locator('#desktop .install-step-text').first()).toHaveText(/^1\. Click the install icon/);
  });

  test('iPhone first on iOS, Android first on Android, no computer steps on either', async ({ browser }) => {
    for (const [ua, order] of [
      [IPHONE, ['On iPhone or iPad (Safari)', 'On Android (Chrome)']],
      [ANDROID, ['On Android (Chrome)', 'On iPhone or iPad (Safari)']],
    ] as const) {
      const { context, page } = await onDevice(browser, ua);
      await page.goto('/install');
      await expect(sections(page)).toHaveText([...order, 'What works without a signal']);
      await expect(page.locator('#desktop')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      await context.close();
    }
  });

  test('shows the one-tap button only once the browser offers to install', async ({ page }) => {
    await page.goto('/install');
    const button = page.getByRole('button', { name: 'Install TB PH' });
    await expect(button).toBeHidden();
    await offerInstall(page, 'accepted');
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('[data-install-status]')).toHaveText('Installed. Look for TB PH on your home screen.');
    await expect(button).toBeHidden();
  });

  test('says it can wait when the prompt is dismissed (in Filipino)', async ({ page }) => {
    await page.goto('/fil/install');
    await offerInstall(page, 'dismissed');
    await page.getByRole('button', { name: 'I-install ang TB PH' }).click();
    await expect(page.locator('[data-install-status]')).toHaveText('Walang problema. Puwede mo itong i-install anumang oras mula sa pahinang ito.');
  });

  test('in the installed app: says so, and shows neither steps nor button', async ({ page }) => {
    await installed(page);
    await page.goto('/install');
    await expect(page.locator('.install-done')).toHaveText(/TB PH is installed\. You're using the app\./);
    await offerInstall(page, 'accepted');
    await expect(page.getByRole('button', { name: 'Install TB PH' })).toBeHidden();
    await expect(sections(page)).toHaveText(['What works without a signal']);
  });

  test('marks the footer link as the current page', async ({ page }) => {
    await page.goto('/install');
    await expect(page.locator('.site-footer-nav [aria-current]')).toHaveText('Install the app');
  });
});
