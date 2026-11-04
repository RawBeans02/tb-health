// Text follows the browser's text-size setting (audit B2): with a larger default font size,
// text grows, the hierarchy holds, and nothing overflows at phone widths. Chromium only: the
// default font size is set through the DevTools protocol.
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

test.skip(({ browserName }) => browserName !== 'chromium', 'sets the default font size through CDP');

const PAGES = ['/', '/places', '/place/bangued-rural-health-unit-abra', '/check', '/learn', '/data', '/about', '/install'];

async function defaultFontSize(page: Page, px: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: px } });
}

/** Sideways scroll, content off the screen, and text wider than its own box. */
function overflow(page: Page) {
  return page.evaluate(() => {
    const w = innerWidth;
    const out: string[] = [];
    const scroll = document.documentElement.scrollWidth - w;
    if (scroll > 0) out.push(`page scrolls sideways by ${scroll}px`);
    for (const el of document.querySelectorAll<HTMLElement>('main *, .site-header *, .tab-bar *')) {
      if (el.closest('svg') || el.closest('.visually-hidden') || el.closest('.leaflet-container')) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      let scroller = false;
      for (let p: HTMLElement | null = el; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll' || (p !== el && (o === 'hidden' || o === 'clip'))) scroller = true;
      }
      if (scroller) continue;
      const name = `${el.localName}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 24)}"`;
      if (r.right > w + 1.5 || r.left < -1.5) out.push(`${name} off the screen (${Math.round(r.left)}..${Math.round(r.right)})`);
      // Text wider than its own box. (Containers are left out: a child's designed bleed, such
      // as Check's Next bar, widens their scroll width without overflowing anything.)
      const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim());
      if (ownText && cs.display !== 'inline' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) out.push(`${name} overflows its box by ${el.scrollWidth - el.clientWidth}px`);
    }
    return out;
  });
}

test.describe('larger default text', () => {
  test('body text and headings grow with it, in order', async ({ page }) => {
    await defaultFontSize(page, 24);
    await page.goto('/learn');
    const sizes = await page.evaluate(() => {
      const size = (sel: string) => parseFloat(getComputedStyle(document.querySelector(sel)!).fontSize);
      return { h1: size('main h1'), h2: size('main h2'), p: size('main section p') };
    });
    expect(sizes.p).toBe(27);
    expect(sizes.h1).toBeGreaterThan(sizes.h2);
    expect(sizes.h2).toBeGreaterThan(sizes.p);
  });

  // 16px: the default, as a baseline.
  for (const [px, widths] of [[16, [320]], [24, [320, 390]], [32, [390]]] as const) {
    for (const lang of ['en', 'fil'] as const) {
      for (const base of PAGES) {
        const path = lang === 'fil' ? (base === '/' ? '/fil' : `/fil${base}`) : base;
        for (const width of widths) {
          test(`${path} at ${width}px, ${px}px default: nothing overflows`, async ({ page }) => {
            await defaultFontSize(page, px);
            await page.setViewportSize({ width, height: 844 });
            await page.goto(path, { waitUntil: 'networkidle' });
            expect(await overflow(page)).toEqual([]);
          });
        }
      }
    }
  }

  test("Check's question and Next bar at a 32px default", async ({ page }) => {
    await defaultFontSize(page, 32);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/check');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('main h1')).toBeFocused();
    expect(await overflow(page)).toEqual([]);
    const next = await page.locator('.next-bar button').boundingBox();
    const tabs = await page.locator('.tab-bar').boundingBox();
    expect(next!.y + next!.height).toBeLessThanOrEqual(tabs!.y);
  });
});
