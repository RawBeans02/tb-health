// The language links in the header and footer (Q2a): two links, aria-current on the
// current language. They always point at this page's twin with the current query and
// hash, save the choice before leaving (Q2b reads it), and keep the reader's place.
// On pages whose island holds state, the switch happens in place (inplace.ts).
import { reapplyAnchor, restoreAnchor, saveAnchor } from '../lib/anchor.ts';
import { LANG_KEY, isLang, toLang, type Lang } from '../lib/i18n.ts';

const html = document.documentElement;

function twin(lang: Lang): string {
  return toLang(location.pathname, lang) + location.search + location.hash;
}

function refresh(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-lang-link]')) {
    const lang = link.dataset.langLink;
    if (!isLang(lang)) continue;
    link.setAttribute('href', twin(lang));
    if (lang === html.lang) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

function onActivate(event: MouseEvent): void {
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-lang-link]') : null;
  const lang = link?.dataset.langLink;
  if (!link || !isLang(lang)) return;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage blocked: the link still works; the choice just isn't remembered.
  }
  link.setAttribute('href', twin(lang)); // the address may have changed since load (replaceState)
  const plain = event.type === 'click' && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  if (!plain) return; // new tab or window: let the browser follow the link
  if (lang === html.lang) {
    event.preventDefault();
    return;
  }
  if (html.dataset.langSwitch === 'inplace' && html.dataset.inplaceReady === 'true') {
    event.preventDefault();
    document.dispatchEvent(new CustomEvent('tbph:lang-request', { detail: { lang } }));
    return;
  }
  saveAnchor(toLang(location.pathname, lang));
}

document.addEventListener('click', onActivate);
document.addEventListener('auxclick', onActivate);
window.addEventListener('hashchange', refresh);
window.addEventListener('popstate', refresh);
document.addEventListener('tbph:lang', refresh);
refresh();
restoreAnchor();
document.addEventListener('tbph:charts-ready', reapplyAnchor);
