// Languages and URLs (PLAN §4.2): English at /…, Filipino at /fil/…, both prerendered.
// Pure functions, so pages (build time), islands, browser scripts and later the service
// worker build every internal link the same way. Dictionaries never hold paths.

export type Lang = 'en' | 'fil';

export const LANGS: readonly Lang[] = ['en', 'fil'];

/** The saved language choice (README:283), the only thing the site keeps in localStorage. */
export const LANG_KEY = 'tbph-lang';

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'fil';
}

export function langOf(pathname: string): Lang {
  return pathname === '/fil' || pathname.startsWith('/fil/') ? 'fil' : 'en';
}

/** The same page in another language: /places ↔ /fil/places, / ↔ /fil. */
export function toLang(pathname: string, lang: Lang): string {
  const base = langOf(pathname) === 'fil' ? pathname.slice('/fil'.length) || '/' : pathname;
  if (lang === 'en') return base;
  return base === '/' ? '/fil' : `/fil${base}`;
}

/** A built page's path without the file name: /fil.html → /fil, /index.html → /. */
export function pagePath(pathname: string): string {
  return pathname.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
}

export const ROUTES = {
  home: '/',
  places: '/places',
  check: '/check',
  learn: '/learn',
  data: '/data',
  about: '/about',
  install: '/install',
} as const;

export type RouteKey = keyof typeof ROUTES | 'place';

export interface HrefOptions {
  /** Place id, for the `place` route. */
  id?: string;
  query?: Record<string, string | undefined>;
  hash?: string;
}

/** Every internal link goes through here, so it stays in the page's language. */
export function href(route: RouteKey, lang: Lang, options: HrefOptions = {}): string {
  let path: string;
  if (route === 'place') {
    if (!options.id) throw new Error('href: the place route needs an id');
    path = `/place/${encodeURIComponent(options.id)}`;
  } else {
    path = ROUTES[route];
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const query = params.toString();
  return toLang(path, lang) + (query ? `?${query}` : '') + (options.hash ? `#${options.hash}` : '');
}
