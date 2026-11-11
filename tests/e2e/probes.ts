// Layout probes shared by the QA matrix, the text-size tests (audit B50) and the worst-case pass
// (step 15.4).
import type { Page } from '@playwright/test';

/**
 * The qa-harness.html probe, with its thresholds: sideways scroll, template leftovers, the
 * number of H1s, targets under 44px and text under 14px.
 */
export function harnessProbe(page: Page) {
  return page.evaluate(() => {
    const w = innerWidth;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      // Visually hidden controls (1px, clipped) sit inside larger labelled rows.
      return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const describe = (el: Element) => `${el.localName}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 30)}"`;

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

    return { sideways: document.documentElement.scrollWidth - w, holes, h1: document.querySelectorAll('h1').length, small, tiny };
  });
}

/**
 * Elements that spill out of what holds them: past the screen's sides, or past an ancestor
 * that clips (overflow hidden or clip), where they would be cut off; and text wider than its
 * own box. Only scrollers (overflow auto or scroll) may hold wider content. Chart internals
 * are checked by svgTextOutside(); visually hidden parts, the Leaflet map and decorative
 * (aria-hidden) parts that carry no text are left out (B76: hidden text still shows).
 */
export async function outsideProblems(page: Page, scope = 'main *, .site-header *, .tab-bar *') {
  await chartsSettled(page); // on Data, probe the layout the charts end in (B84)
  return page.evaluate((scope) => {
    const w = innerWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(scope)) {
      if (el.closest('svg, .visually-hidden, .leaflet-container')) continue;
      const hidden = el.closest('[aria-hidden="true"]');
      if (hidden && !(hidden.textContent ?? '').trim()) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      let scroller = false;
      let clip: HTMLElement | null = null;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll') {
          scroller = true;
          break;
        }
        if (!clip && (o === 'hidden' || o === 'clip')) clip = p;
      }
      if (scroller) continue;
      const name = `${el.localName}.${[...el.classList].join('.')} "${(el.textContent ?? '').trim().slice(0, 24)}"`;
      if (r.right > w + 1.5 || r.left < -1.5) out.push(`${name} off the screen (${Math.round(r.left)}..${Math.round(r.right)})`);
      else if (clip) {
        const c = clip.getBoundingClientRect();
        if (r.right > c.right + 1.5 || r.left < c.left - 1.5) out.push(`${name} cut off by ${clip.localName}.${[...clip.classList].join('.')} (${Math.round(r.left)}..${Math.round(r.right)} in ${Math.round(c.left)}..${Math.round(c.right)})`);
      }
      // Text wider than its own box. (Containers are left out: a child's designed bleed, such
      // as Check's Next bar, widens their scroll width without overflowing anything.)
      const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim());
      if (ownText && cs.display !== 'inline' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) out.push(`${name} overflows its box by ${el.scrollWidth - el.clientWidth}px`);
    }
    return out;
  }, scope);
}

/**
 * On Data: scrolls #d1 into view (the charts hydrate when near), then waits until they have
 * hydrated and been laid out again at the page's width: #d1 drawn at the width the island
 * measures (at least 240px), and each chart's viewBox as wide as it is drawn. At 1280px the
 * 928px prerender already fits, so the second test alone would pass before the relayout
 * (B84). Elsewhere it returns at once.
 */
export async function chartsSettled(page: Page) {
  if (!(await page.locator('section.panel').count())) return;
  await page.locator('#d1').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island:has(section.panel)')?.hasAttribute('ssr'));
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(() => {
    const measured = Math.max(240, Math.round(document.querySelector('.panel-measure')!.getBoundingClientRect().width));
    const d1 = document.querySelector<SVGSVGElement>('#d1 svg[viewBox]');
    return (
      d1?.viewBox.baseVal.width === measured &&
      [...document.querySelectorAll<SVGSVGElement>('section.panel svg[viewBox]')].every((svg) => Math.abs(svg.viewBox.baseVal.width - svg.getBoundingClientRect().width) < 1)
    );
  });
}

/**
 * Chart labels (SVG text) outside their chart, on any side, or overlapping another label in
 * the same chart (B78), once the charts have settled on Data. Two labels overlap when their
 * boxes cross by more than a third of the shorter one's height: the lines of one wrapped
 * label only graze.
 */
export async function svgTextOutside(page: Page) {
  if (!(await page.locator('section.panel').count())) return [];
  await chartsSettled(page);
  return page.evaluate(() => {
    const out: string[] = [];
    for (const svg of document.querySelectorAll<SVGSVGElement>('section.panel svg[viewBox]')) {
      const box = svg.getBoundingClientRect();
      for (const t of svg.querySelectorAll('text')) {
        const r = t.getBoundingClientRect();
        if (r.width === 0) continue;
        const id = svg.closest('section.panel')!.id;
        const text = (t.textContent ?? '').slice(0, 30);
        if (r.left < box.left - 1 || r.right > box.right + 1) out.push(`${id} "${text}" ${Math.round(r.left - box.left)}..${Math.round(r.right - box.left)} of ${Math.round(box.width)} wide`);
        if (r.top < box.top - 1 || r.bottom > box.bottom + 1) out.push(`${id} "${text}" ${Math.round(r.top - box.top)}..${Math.round(r.bottom - box.top)} of ${Math.round(box.height)} high`);
      }
      const labels = [...svg.querySelectorAll('text')].map((t) => ({ text: (t.textContent ?? '').slice(0, 30), r: t.getBoundingClientRect() })).filter((l) => l.r.width > 0);
      labels.forEach((a, i) =>
        labels.slice(i + 1).forEach((b) => {
          const across = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
          const down = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
          if (across > 0.5 && down > Math.min(a.r.height, b.r.height) / 3) out.push(`${svg.closest('section.panel')!.id} "${a.text}" overlaps "${b.text}" by ${Math.round(across)}px`);
        }),
      );
    }
    return out;
  });
}
