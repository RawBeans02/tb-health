import type { Page } from '@playwright/test';

/** Everything outside <main> that a language switch changes, normalised for comparison. */
export function chromeSnapshot(page: Page) {
  return page.evaluate(() => {
    const walk = (el: Element): string => {
      const attrs = [...el.attributes]
        .map((a) => `${a.name}=${a.value}`)
        .sort()
        .join(' ');
      const kids = [...el.childNodes]
        .map((node) => (node.nodeType === Node.TEXT_NODE ? (node.textContent ?? '').trim() : node instanceof Element ? walk(node) : ''))
        .filter(Boolean)
        .join('');
      return `<${el.localName} ${attrs}>${kids}</${el.localName}>`;
    };
    return {
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      alternates: [...document.querySelectorAll('link[rel="alternate"]')].map((l) => `${l.getAttribute('hreflang')} ${l.getAttribute('href')}`),
      header: walk(document.querySelector('.site-header')!),
      footer: walk(document.querySelector('.site-footer')!),
    };
  });
}
