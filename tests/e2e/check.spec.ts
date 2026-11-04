// Step 7: the symptom check (PLAN §5). Synthetic answers only.
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

const h1 = (page: Page) => page.locator('main h1');
const next = (page: Page) => page.locator('.next-bar button');

/** Ticks an option by its label and presses Next. */
async function answer(page: Page, ...labels: string[]) {
  for (const label of labels) await page.locator('.check-choice', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}`) }).first().click();
  await next(page).click();
}

async function start(page: Page, path = '/check') {
  await page.goto(path);
  await page.getByRole('button', { name: path.startsWith('/fil') ? 'Simulan' : 'Start' }).click();
  await expect(h1(page)).toBeFocused();
}

test.describe('flow', () => {
  test('intro, then one question per screen with focus on each title (TB red, Q10)', async ({ page }) => {
    await page.goto('/check');
    await expect(h1(page)).toHaveText('Check your symptoms');
    await expect(page.locator('.privacy-row')).toHaveText("Your answers stay on your device. We don't save or send them.");
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(h1(page)).toHaveText('Who are you checking for?');
    await expect(h1(page)).toBeFocused();
    await expect(h1(page)).toHaveCSS('color', 'rgb(196, 32, 50)');
    await expect(page.locator('.progress-label')).toHaveText('Step 1 of 6');
    await expect(page.locator('.question-hint')).toHaveText('Choose one answer.');

    await next(page).click();
    await expect(page.getByRole('alert')).toHaveText('Choose one answer to continue.');
    await answer(page, 'Myself');
    await expect(h1(page)).toHaveText('Right now, is there any of these?');
    await expect(h1(page)).toBeFocused();
    await next(page).click();
    await expect(page.getByRole('alert')).toHaveText('Choose at least one answer, or “None of these”.');
  });

  test('result A: a 2-week cough, with steps, the route button and the card', async ({ page }) => {
    await start(page);
    await answer(page, 'Myself');
    await answer(page, 'None of these');
    await answer(page, 'Cough, with or without phlegm');
    await answer(page, 'No');
    await expect(h1(page)).toHaveText('Did a chest X-ray in the past year show something that might be TB?');
    await answer(page, "I'm not sure");
    await expect(next(page)).toHaveText('See my result');
    await answer(page, 'None of these');

    await expect(h1(page)).toHaveText('Get tested for TB this week.');
    await expect(h1(page)).toBeFocused();
    await expect(page.locator('.result-steps li')).toHaveCount(3);
    await expect(page.locator('.result-notes li')).toHaveText(['iNot sure about an old X-ray? Bring the result with you, or ask whether you need a new one.']);
    await expect(page.getByRole('link', { name: 'Plan my route to a test' })).toHaveAttribute('href', '/?need=all');
    await expect(page.locator('.result-foot')).toContainText('Medical review: [partner clinicians — pending].');
    const card = page.locator('.patient-card');
    await expect(card.locator('dt')).toHaveText(['Date', 'Checked for', 'Symptoms for 2 weeks or more', 'Blood in phlegm', 'Recent symptoms', 'Chest X-ray answer', 'Risk factors', 'Recommended next step']);
    await expect(card.locator('dd').nth(1)).toHaveText('Myself (15 or older)');
    await expect(card.locator('dd').nth(2)).toHaveText('Cough, with or without phlegm');
    await expect(card.locator('dd').nth(4)).toHaveText('Not asked');
    await expect(card.locator('dd').nth(7)).toHaveText('Get tested for TB this week.');
  });

  test('urgent: a danger sign goes straight to the Film screen, and Back returns', async ({ page }) => {
    await start(page);
    await answer(page, 'Myself');
    await answer(page, 'Severe difficulty breathing');
    await expect(h1(page)).toHaveText('Get emergency care now.');
    await expect(h1(page)).toBeFocused();
    await expect(page.locator('.check-stage')).toHaveCSS('background-color', 'rgb(14, 26, 34)');
    await expect(page.locator('.urgent-call')).toHaveText('Call 911');
    await expect(page.locator('.urgent-call')).toHaveAttribute('href', 'tel:911');
    await expect(page.locator('.patient-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(h1(page)).toHaveText('Right now, is there any of these?');
  });

  test('a child path: no blood or X-ray questions; result D with the child and recent notes', async ({ page }) => {
    await start(page);
    await answer(page, 'A child');
    await expect(page.locator('.progress-label')).toHaveText('Step 2 of 4');
    await answer(page, 'None of these');
    await expect(h1(page)).toHaveText('For 2 weeks or more, has the child had any of these?');
    await answer(page, 'None of these');
    await expect(h1(page)).toHaveText('Does the child have a cough, fever or weight loss right now, even if it started less than 2 weeks ago?');
    await answer(page, 'Yes');
    await expect(h1(page)).toHaveText('Do any of these apply?');
    await answer(page, 'None of these');
    await expect(h1(page)).toHaveText('No signs of TB right now.');
    await expect(page.locator('.result-notes li span:last-child')).toHaveText([
      'Bring the child to your health center or a pediatrician, and mention anyone at home who has TB.',
      'Your symptoms started recently. If they last 2 weeks or more, get tested.',
    ]);
    await expect(page.getByRole('link', { name: 'Plan my route to a test' })).toHaveCount(0);
    await expect(page.locator('.patient-card dd').nth(3)).toHaveText('Not asked');
  });

  test('switching to the child path clears earlier answers', async ({ page }) => {
    await start(page);
    await answer(page, 'Myself');
    await answer(page, 'None of these');
    await page.locator('.check-choice', { hasText: 'Night sweats' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('button', { name: 'Back' }).click();
    await answer(page, 'A child');
    await next(page).click();
    await expect(page.getByRole('alert')).toBeVisible(); // nothing carried over on the danger question
    await answer(page, 'None of these');
    await expect(page.locator('.check-choice input:checked')).toHaveCount(0);
    await expect(page.locator('.check-choice')).toContainText(['Cough or wheezing that isn\'t getting better']);
  });

  test('Next sits above the tab bar at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await start(page);
    const button = await next(page).boundingBox();
    const tabs = await page.locator('.tab-bar').boundingBox();
    expect(button!.y + button!.height).toBeLessThanOrEqual(tabs!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('switches language in place, keeping the answers', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await start(page);
    await answer(page, 'Another adult');
    await page.locator('.check-choice', { hasText: 'Very drowsy' }).click();
    await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true));
    await page.locator('.site-header [data-lang-link="fil"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
    expect(new URL(page.url()).pathname).toBe('/fil/check');
    await expect(h1(page)).toHaveText('Sa ngayon, mayroon ba nito?');
    await expect(page.locator('.question-other')).toHaveText('Sagutin para sa taong sinusuri mo.');
    await expect(page.locator('.check-choice.is-on')).toHaveText(/Sobrang antok, nalilito o mahirap gisingin/);
  });
});

test.describe('privacy (PLAN §4.5)', () => {
  test('after Start: nothing leaves the origin, no request carries an answer, nothing is stored', async ({ page }) => {
    await page.goto('/check');
    await page.waitForLoadState('networkidle');
    const storageBefore = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    const requests: { url: string; body: string }[] = [];
    page.on('request', (r) => requests.push({ url: r.url(), body: r.postData() ?? '' }));

    await page.getByRole('button', { name: 'Start' }).click();
    await answer(page, 'Myself');
    await answer(page, 'None of these');
    await answer(page, 'Night sweats', 'Fever with no clear cause');
    await answer(page, 'Yes');
    await answer(page, 'Yes');
    await answer(page, 'Has HIV', 'Has diabetes');
    await expect(h1(page)).toHaveText('Get tested for TB this week.');

    const origin = new URL(page.url()).origin;
    for (const r of requests) {
      expect(new URL(r.url).origin, `request to ${r.url}`).toBe(origin);
      for (const word of ['sweats', 'fever', 'hiv', 'diabetes', 'blood', 'xray', 'self']) {
        expect(`${r.url} ${r.body}`.toLowerCase()).not.toContain(word);
      }
    }
    expect(page.url()).toBe(`${origin}/check`);
    expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).toBe(storageBefore);
    expect(await page.evaluate(async () => (await indexedDB.databases?.())?.length ?? 0)).toBe(0);
    expect(await page.evaluate(async () => (await caches.keys()).length)).toBe(0);
  });
});

test.describe('the summary', () => {
  async function toResultA(page: Page) {
    await start(page);
    await answer(page, 'Myself');
    await answer(page, 'None of these');
    await answer(page, 'Cough, with or without phlegm');
    await answer(page, 'No');
    await answer(page, 'No');
    await answer(page, 'None of these');
    await expect(h1(page)).toHaveText('Get tested for TB this week.');
  }

  test('prints only the card', async ({ page }) => {
    await toResultA(page);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.patient-card')).toBeVisible();
    await expect(page.locator('.result-main')).toBeHidden();
    await expect(page.locator('.card-actions')).toBeHidden();
    await expect(page.locator('.site-header')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    await expect(page.locator('.card-privacy')).toBeHidden();
  });

  test('saves the card as a PNG with a neutral name', async ({ page }) => {
    await toResultA(page);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save as image' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('tbph-summary.png');
    const bytes = readFileSync((await file.path())!);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    await expect(page.locator('.saved-msg')).toHaveText('Your summary was saved as an image.');
  });

  test('on a touch phone, offers the share sheet instead (share stubbed)', async ({ browser, browserName }) => {
    test.skip(browserName !== 'chromium', 'Touch and pointer emulation checked in Chromium.');
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const w = window as unknown as { shared: string[] };
      w.shared = [];
      Object.defineProperty(navigator, 'canShare', { value: () => true });
      Object.defineProperty(navigator, 'share', { value: async (data: { files: File[] }) => void w.shared.push(...data.files.map((f) => `${f.name} ${f.type}`)) });
    });
    await toResultA(page);
    await page.getByRole('button', { name: 'Save my summary' }).click();
    await expect(page.locator('.saved-msg')).toHaveText('Your summary was saved as an image.');
    expect(await page.evaluate(() => (window as unknown as { shared: string[] }).shared)).toEqual(['tbph-summary.png image/png']);
    await context.close();
  });
});
