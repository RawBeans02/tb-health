// What the service worker keeps for offline use (PLAN §5 step 11). Shared by the worker,
// its build step (scripts/build-sw.mjs) and the tests.
import { LANGS, ROUTES, langOf, toLang } from './i18n.ts';
import type { Features } from './nav.ts';

/** Stand-ins the worker serves at another page's address when that page isn't saved. */
export const PLACE_SHELL = '/place';
export const OFFLINE_PAGE = '/offline';

const PLACE_PAGE = /^(?:\/fil)?\/place\/[^/]+$/;

/**
 * Pages saved on the first visit: the core routes and both stand-ins, in both languages.
 * Place pages are saved only once visited; offline, the shell renders the others.
 */
export function precachePages(features: Features): string[] {
  const routes = Object.entries(ROUTES)
    .filter(([key]) => key !== 'check' || features.check)
    .map(([, path]) => path);
  return LANGS.flatMap((lang) => [...routes, PLACE_SHELL, OFFLINE_PAGE].map((path) => toLang(path, lang)));
}

/**
 * The address a page is saved under: its path alone, so no query (need, near, stop…) is
 * ever part of a cache key and any query finds the page. A trailing slash goes, as the
 * host's redirect would do it.
 */
export function savedPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;
}

/** An unsaved page's stand-in, in its language: the place shell for a place, else the offline page. */
export function offlineStandIn(pathname: string): string {
  const path = savedPath(pathname);
  return toLang(PLACE_PAGE.test(path) ? PLACE_SHELL : OFFLINE_PAGE, langOf(path));
}
