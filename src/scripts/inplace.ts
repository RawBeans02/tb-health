// In-place language switch (PLAN §4.2), only on pages whose island holds state that a
// navigation would lose: Check (answers), Places (filters, location) and Home (while a
// location fix is held). The island sets html[data-lang-switch="inplace"] while it holds
// that state, and re-renders <main> on `tbph:lang`. This script swaps everything outside
// <main> from the two-language strings BaseLayout inlines (#tbph-i18n), so the page
// matches a fresh load of the other language. Nothing is stored to carry the state.
import { findAnchor, keepAnchor } from '../lib/anchor.ts';
import { isLang, toLang, type Lang } from '../lib/i18n.ts';

type Strings = Record<string, string>;

const html = document.documentElement;
const source = document.getElementById('tbph-i18n');
const strings = source ? (JSON.parse(source.textContent ?? '{}') as Record<Lang, Strings>) : null;

function switchTo(lang: Lang, t: Strings): void {
  const anchor = findAnchor();
  for (const el of document.querySelectorAll<HTMLElement>('[data-chrome] [data-t]')) {
    const text = t[el.dataset.t ?? ''];
    if (text !== undefined) el.textContent = text;
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-chrome] [data-t-label]')) {
    const label = t[el.dataset.tLabel ?? ''];
    if (label !== undefined) el.setAttribute('aria-label', label);
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-chrome] a[href^="/"]:not([data-lang-link])')) {
    const url = new URL(link.getAttribute('href') ?? '/', location.origin);
    link.setAttribute('href', toLang(url.pathname, lang) + url.search + url.hash);
  }
  html.lang = lang;
  document.title = t.title;
  // The page doesn't reload, so say it changed (B28; src/scripts/announce.ts reads it out).
  document.dispatchEvent(new CustomEvent('tbph:announce', { detail: t.title }));
  document.querySelector('meta[name="description"]')?.setAttribute('content', t.description ?? '');
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) {
    const url = new URL(canonical.href);
    url.pathname = toLang(url.pathname, lang);
    canonical.setAttribute('href', url.href);
  }
  history.replaceState(history.state, '', toLang(location.pathname, lang) + location.search + location.hash);
  document.dispatchEvent(new CustomEvent('tbph:lang', { detail: { lang } }));
  requestAnimationFrame(() => keepAnchor(anchor));
}

if (strings) {
  document.addEventListener('tbph:lang-request', (event) => {
    const lang = (event as CustomEvent<{ lang?: unknown }>).detail?.lang;
    if (isLang(lang) && lang !== html.lang && strings[lang]) switchTo(lang, strings[lang]);
  });
  html.dataset.inplaceReady = 'true';
}
