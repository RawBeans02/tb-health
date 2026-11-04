// Step 13: QA hardening (PLAN §5). The prototype's qa-harness.html checks as a matrix (9 pages ×
// 4 widths × EN/FIL), then axe on every page and the main interactive states.
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

const facilities = (JSON.parse(readFileSync('public/data/facilities.json', 'utf8')) as { facilities: { id: string; name: string }[] }).facilities;
// The sample's Bangued page, or the first place when a synthetic fixture replaced the sample.
const PLACE = facilities.some((r) => r.id === 'bangued-rural-health-unit-abra')
  ? '/place/bangued-rural-health-unit-abra?stop=2&need=all&near=Bangued'
  : `/place/${facilities[0].id}?stop=2&need=all`;
// With the worst-case fixture built (npm run build:worst-case, audit L2), its few synthetic
// place pages join the matrix; the 2,100-row scale fixture's don't.
const synthetic = facilities.filter((r) => r.name.startsWith('SYNTHETIC'));
const WORST = synthetic.length <= 5 ? synthetic.map((r) => `/place/${r.id}?stop=1`) : [];
const PAGES = ['/', '/places', PLACE, '/check', '/learn', '/data', '/about', '/no-such-page', '/install', ...WORST];
const WIDTHS = [320, 390, 768, 1280];
const fil = (path: string) => (path === '/' ? '/fil' : `/fil${path}`);

/** The harness's probe (qa-harness.html), with its thresholds. */
function probe(page: Page) {
  return page.evaluate(() => {
    const w = innerWidth;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // Visually hidden controls (1px, clipped) sit inside larger labelled rows.
      return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const describe = (el: Element) => `${el.localName}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 30)}"`;

    // Off the side of the screen, unless inside something that scrolls or clips sideways.
    const off: string[] = [];
    for (const el of document.querySelectorAll('main *')) {
      if (!visible(el) || (el.closest('svg') && el.localName !== 'svg')) continue;
      let p = el.parentElement;
      let clipped = false;
      while (p && p !== document.body) {
        if (['auto', 'hidden', 'scroll', 'clip'].includes(getComputedStyle(p).overflowX)) {
          clipped = true;
          break;
        }
        p = p.parentElement;
      }
      const r = el.getBoundingClientRect();
      if (!clipped && (r.right > w + 1.5 || r.left < -1.5)) off.push(`${describe(el)} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }

    // Template leftovers: {{x}} or a {name} placeholder that was never filled.
    const holes: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('script, style, template')) continue;
      if (/\{\{|\{[a-z]\w*\}/i.test(node.nodeValue ?? '')) holes.push((node.nodeValue ?? '').trim().slice(0, 40));
    }

    // Targets under 44px: controls in <main>, the language links and the tab bar.
    const small: string[] = [];
    for (const el of document.querySelectorAll('main button, main input, main select, main [role="switch"], main a.btn, [data-lang-link], .tab-bar a')) {
      if (visible(el) && el.getBoundingClientRect().height < 43.5) small.push(`${describe(el)} ${Math.round(el.getBoundingClientRect().height)}px`);
    }

    // Text under 14px in <main>.
    const tiny: string[] = [];
    for (const el of document.querySelectorAll('main :is(p, span, a, li, dd, dt, label, td, th, figcaption, small)')) {
      if (!visible(el) || el.closest('[aria-hidden="true"]') || !(el.textContent ?? '').trim()) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 14) tiny.push(`${describe(el)} ${size}px`);
    }

    return { sideways: document.documentElement.scrollWidth - w, off, holes, h1: document.querySelectorAll('h1').length, small, tiny };
  });
}

/** Each page in both languages, with the 404 page's own response allowed in the console. */
function eachPage(body: (path: string) => void) {
  for (const lang of ['en', 'fil'] as const) {
    for (const base of PAGES) {
      const path = lang === 'fil' ? fil(base) : base;
      test.describe(path, () => {
        if (base === '/no-such-page') test.use({ expectedErrors: [/status of 404/] });
        body(path);
      });
    }
  }
}

test.describe('qa-harness matrix', () => {
  eachPage((path) => {
    for (const width of WIDTHS) {
      test(`at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await page.goto(path, { waitUntil: 'networkidle' });
        const r = await probe(page);
        expect(r.sideways, 'sideways scroll').toBeLessThanOrEqual(0);
        expect(r.off, 'off the screen').toEqual([]);
        expect(r.holes, 'template leftovers').toEqual([]);
        expect(r.h1, 'one H1').toBe(1);
        expect(r.small, 'targets under 44px').toEqual([]);
        expect(r.tiny, 'text under 14px').toEqual([]);
      });
    }
  });
});

/** WCAG 2.2 AA rules, as axe tags them. */
async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(', ')}`);
}

test.describe('axe (WCAG 2.2 AA)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'axe reads the DOM: one engine is enough');

  eachPage((path) => {
    for (const width of [390, 1280]) {
      test(`at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await page.goto(path, { waitUntil: 'networkidle' });
        expect(await axe(page)).toEqual([]);
      });
    }
  });

  test('Home with a route', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#from').fill('Quezon City');
    await page.getByRole('button', { name: 'Show me where to go' }).click();
    await expect(page.locator('.results h2')).toBeFocused();
    expect(await axe(page)).toEqual([]);
  });

  test('Places with the filters sheet open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/places', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('Check, a question', async ({ page }) => {
    await page.goto('/check', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('main h1')).toBeFocused();
    expect(await axe(page)).toEqual([]);
  });

  test('Data, a chart table open', async ({ page }) => {
    await page.goto('/data', { waitUntil: 'networkidle' });
    await page.locator('#d1').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    const toggle = page.locator('#d1 button[aria-expanded]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await axe(page)).toEqual([]);
  });
});
