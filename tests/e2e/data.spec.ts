// Step 9: the Data page (PLAN §5): the dot story, the charts and TB in numbers.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

/**
 * Scrolls to a chart panel and waits for the charts island to hydrate: it loads when
 * scrolled into view (client:visible), and the panels sit below the dot story.
 */
async function panel(page: Page, id: string) {
  const section = page.locator(`#${id}`);
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
  return section;
}

test.describe('Data', () => {
  test('twenty chart panels, each with a labelled chart and a table on request', async ({ page }) => {
    await page.goto('/data');
    const panels = page.locator('section.panel');
    await expect(panels).toHaveCount(20);
    for (const id of ['d1', 'd5', 'd14', 'd20']) await expect(page.locator(`#${id} h2`)).not.toBeEmpty();
    for (const svg of await page.locator('.chart svg').all()) await expect(svg).toHaveAttribute('aria-label', /.+/);
    const d1 = await panel(page, 'd1');
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
    const d5 = await panel(page, 'd5');
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

  test('"Back to top" goes to the charts intro, below the dot story', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/data');
    await page.locator('#d3').scrollIntoViewIfNeeded();
    await page.locator('#d3').getByRole('link', { name: 'Back to top' }).click();
    await expect(page.locator('#top')).toBeFocused();
    await expect.poll(() => page.locator('#top').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(80);
  });

  test('has no sideways scroll at 320px; wide tables scroll inside their region', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/fil/data');
    await (await panel(page, 'd4')).getByRole('button', { name: 'Ipakita bilang talaan' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });
});

test.describe('Dot story', () => {
  const canvas = (page: Page) => page.locator('#story canvas');
  const legend = (page: Page) => page.locator('.story-legend > span');

  /** Scrolls a beat's text to the middle of the window, past the trigger line. */
  async function toBeat(page: Page, n: number) {
    await page.locator(`#beat-${n} [data-beat]`).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  }

  /** A fingerprint of the canvas pixels, and how many are TB red and ink. */
  function pixels(page: Page) {
    return canvas(page).evaluate(async (c: HTMLCanvasElement) => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let hash = 0;
      let red = 0;
      let ink = 0;
      for (let i = 0; i < data.length; i += 4) {
        hash = (hash * 31 + data[i] + data[i + 1] * 7 + data[i + 2] * 13 + data[i + 3]) | 0;
        if (data[i + 3] > 200 && data[i] > 180 && data[i + 1] < 60 && data[i + 2] < 70) red++;
        if (data[i + 3] > 200 && data[i] < 30 && data[i + 1] < 45 && data[i + 2] < 55) ink++;
      }
      return { hash, red, ink };
    });
  }

  test('opens on the field: beat 1 from the pack, prerendered, and a labelled canvas', async ({ page }) => {
    await page.goto('/data');
    const h1 = page.locator('main h1');
    await expect(h1).toHaveText('In 2024, about 724,000 Filipinos fell ill with TB.');
    await expect(h1).toHaveCSS('color', 'rgb(196, 32, 50)');
    await expect(canvas(page)).toHaveAttribute('role', 'img');
    await expect(canvas(page)).toHaveAttribute('aria-label', 'A field of 724 dots. Each dot is 1,000 people who fell ill with TB in 2024.');
    await expect(legend(page)).toHaveText(['Fell ill', '1 dot = 1,000 people']);
    await expect(page.locator('#beat-5 .visually-hidden li')).toHaveCount(11);
    await expect(page.locator('#beat-5 .visually-hidden li').first()).toHaveText('Philippines: 625');
    await expect(page.locator('#beat-6 .visually-hidden li')).toHaveText(['Philippines: +13.6%', 'World: −12.3%']);
  });

  test('each beat recolours the same field as its text scrolls in; reduced motion shows the end state at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/data');
    await expect(canvas(page)).toHaveAttribute('aria-label', /^A field of 724 dots/);
    expect((await pixels(page)).red).toBe(0);

    await toBeat(page, 2);
    await expect(canvas(page)).toHaveAttribute('aria-label', 'The same field. About two dots fall ill every day.');

    await toBeat(page, 3);
    await expect(canvas(page)).toHaveAttribute('aria-label', '179 of the 724 dots are hollow: people who were never found.');
    await expect(legend(page)).toHaveText(['Fell ill', 'Never found', '1 dot = 1,000 people']);
    const missed = await pixels(page);
    expect(missed.red).toBeGreaterThan(500);
    await page.waitForTimeout(1600);
    expect((await pixels(page)).hash, 'nothing moves under reduced motion').toBe(missed.hash);

    await toBeat(page, 4);
    await expect(canvas(page)).toHaveAttribute('aria-label', '37 dots are solid ink: people who died.');
    await expect(legend(page)).toHaveText(['Fell ill', 'Never found', 'Died', '1 dot = 1,000 people']);
    expect((await pixels(page)).ink).toBeGreaterThan((missed.ink || 0) + 500);

    await toBeat(page, 5);
    await expect(canvas(page)).toHaveAttribute('aria-label', 'Bar chart of TB rates per 100,000 people in Southeast Asia, 2024. The Philippines is highest, at 625.');
    await expect(page.locator('.story-legend')).toHaveCount(0);

    await toBeat(page, 6);
    await expect(canvas(page)).toHaveAttribute('aria-label', "Since 2015, the Philippines' TB rate rose 13.6%, while the world's fell 12.3%.");
  });

  test('animates between beats when motion is allowed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/data');
    await page.waitForTimeout(1600);
    await toBeat(page, 3);
    await expect(canvas(page)).toHaveAttribute('aria-label', /hollow/);
    const early = await pixels(page);
    await page.waitForTimeout(1600);
    const late = await pixels(page);
    expect(late.hash).not.toBe(early.hash);
    expect(late.red).toBeGreaterThan(500);
  });

  test('stacks the stage above the text on a phone, with nothing hidden under it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/data');
    const stage = await page.locator('.story-stage').boundingBox();
    const h1 = await page.locator('main h1').boundingBox();
    expect(stage!.y).toBe(65);
    expect(stage!.width).toBe(390);
    expect(h1!.y).toBeGreaterThanOrEqual(stage!.y + stage!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('ends on the turn: check, find care, and the sources, in both languages', async ({ page }) => {
    for (const [path, check, find, home, h2] of [
      ['/data', 'Check your symptoms', 'Find TB care near you', '/', 'TB is curable. Testing and treatment are free at public health centers.'],
      ['/fil/data', 'Suriin ang iyong sintomas', 'Hanapin ang gamutan malapit sa iyo', '/fil', 'Nagagamot ang TB. Libre ang pagsusuri at gamutan sa mga pampublikong health center.'],
    ] as const) {
      await page.goto(path);
      const turn = page.locator('#turn');
      await expect(turn.locator('h2')).toHaveText(h2);
      await expect(turn.getByRole('link', { name: check })).toHaveAttribute('href', path.replace('data', 'check'));
      await expect(turn.getByRole('link', { name: find })).toHaveAttribute('href', home);
      await expect(turn.locator('.turn-sources a')).toHaveAttribute('href', '#charts');
    }
    await expect(page.locator('.turn-sources')).toHaveText('Pinagmulan: WHO Global Tuberculosis Report 2025 (tantiya para sa 2024), DOH. Detalye sa pahinang Datos.');
    await expect(canvas(page)).toHaveAttribute('aria-label', 'Isang hanay ng 724 tuldok. Bawat tuldok ay 1,000 taong nagkasakit ng TB noong 2024.');
  });
});

test.describe('deep links on a phone (audit B6, B37)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  /** In the viewport, below the sticky header; for a chart, once the charts have hydrated. */
  async function inView(page: Page, selector: string, charts = !selector.includes('claim-')) {
    if (charts) await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    await expect
      .poll(() => page.locator(selector).evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 60 && r.top < innerHeight - 40; }))
      .toBe(true);
  }

  for (const hash of ['d12', 'd16']) {
    test(`/data#${hash} lands on its chart after the charts hydrate`, async ({ page }) => {
      await page.goto(`/data#${hash}`);
      await inView(page, `#${hash}`);
      // And stays there once the charts have settled.
      await page.waitForTimeout(400);
      await inView(page, `#${hash}`);
    });
  }

  test('/data#claim-… lands on the claim row and focuses it', async ({ page }) => {
    await page.goto('/data#claim-burden-cases');
    await inView(page, '#claim-burden-cases');
    await expect(page.locator('#claim-burden-cases')).toBeFocused();
  });

  test("a Learn 'More in the data' link lands on its claim", async ({ page }) => {
    await page.goto('/learn');
    await page.locator('a[href="/data#claim-burden-deaths"]').first().click();
    await expect(page).toHaveURL(/\/data#claim-burden-deaths$/);
    await inView(page, '#claim-burden-deaths');
    await expect(page.locator('#claim-burden-deaths')).toBeFocused();
  });

  test('a switch after reading on from an "On this page" link keeps the reader where they are (B45)', async ({ page }) => {
    await page.goto('/data');
    await page.locator('.data-index a[href="#d5"]').click();
    await inView(page, '#d5');
    await page.locator('#d14').evaluate((el) => scrollBy({ top: el.getBoundingClientRect().top - 120, behavior: 'instant' }));
    await page.waitForTimeout(300);
    // A tap on the visible header link (Playwright's click would first scroll it into view).
    await page.locator('.site-header [data-lang-link="fil"]').evaluate((link: HTMLElement) => link.click());
    await expect(page).toHaveURL(/\/fil\/data$/);
    await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    await expect.poll(async () => Math.abs((await page.locator('#d14').boundingBox())!.y - 120)).toBeLessThanOrEqual(2);
    await page.waitForTimeout(500); // and it stays there once the charts have settled
    expect(Math.abs((await page.locator('#d14').boundingBox())!.y - 120)).toBeLessThanOrEqual(2);
  });

  test('a language switch keeps the section', async ({ page }) => {
    await page.goto('/data#d16');
    await inView(page, '#d16');
    await page.locator('.site-header [data-lang-link="fil"]').click();
    await expect(page).toHaveURL(/\/fil\/data/);
    await inView(page, '#d16');
  });

  test('a malformed hash loads without an error', async ({ page }) => {
    await page.goto('/data#%');
    await expect(page.locator('main h1')).toBeVisible();
  });
});

test("the Methods chevron has the contents chevron's style (audit B34)", async ({ page }) => {
  await page.goto('/data');
  const chevron = page.locator('#methods .toc-chevron');
  await expect(chevron).toHaveCSS('font-size', '26px');
  await expect(chevron).toHaveCSS('color', 'rgb(138, 148, 154)');
  await page.goto('/learn');
  await expect(page.locator('.toc-narrow .toc-chevron')).toHaveCSS('font-size', '26px');
});

test('the estimated or notified toggle has its own name (audit B35)', async ({ page }) => {
  for (const [path, name] of [['/data', 'Show estimated or notified cases'], ['/fil/data', 'Ipakita ang tantiya o naiulat na kaso']]) {
    await page.goto(path);
    await page.locator('#d5').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    await expect(page.locator('#d5 [role="group"]')).toHaveAccessibleName(name);
  }
});

test("a wide table's scroller keeps sideways swipes to itself (audit B38)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/data');
  await page.locator('#d1').scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
  await page.locator('#d1 button[aria-expanded]').click();
  await expect(page.locator('#d1 .dtable-scroll').first()).toHaveCSS('overscroll-behavior-x', 'contain');
});
