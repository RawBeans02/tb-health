// One route list for the header nav, the phone tab bar, the footer and the
// manifest shortcuts, so the Q9 build switch can leave Check out of all of them at once,
// and the strings that name the check, which it leaves out of every page.
import { href, type Lang } from './i18n.ts';

export type NavKey = 'home' | 'check' | 'learn' | 'data' | 'about' | 'a11y' | 'install';

/** Build-time feature switches. `check: false` launches without /check (Q9). */
export interface Features {
  check: boolean;
}

/**
 * Words that name the check, in either language. A build without Check has them nowhere in
 * its pages, not even out of sight in island props or the in-place language JSON (Q9, review
 * 8 Nov 2026): scripts/check-links.mjs fails the build on them, and the no-check browser test
 * reads the pages for them.
 */
export const CHECK_NAMES = /symptom check|TB check summary|buod ng iyong TB check|check (?:my |your )?symptoms|suriin ang (?:iyong |aking )?sintomas/i;

// Strings that name the check and travel whole to the browser, in island props or the in-place
// language JSON: the nav label, Home's "Not sure yet?" link and the route's check summary.
const CHECK_STRINGS = ['nav_check', 'optNotSure', 'bring3'] as const;
type CheckString = (typeof CHECK_STRINGS)[number];

/** Strings as a build ships them: one without Check may lack those that name it. */
export type ForBuild<T> = Omit<T, CheckString> & Partial<Pick<T, Extract<keyof T, CheckString>>>;

/** `strings` as this build ships them: a build without Check leaves out those that name it (Q9). */
export function forBuild<T extends Record<string, string>>(strings: T, features: Features): ForBuild<T> {
  if (features.check) return strings;
  return Object.fromEntries(Object.entries(strings).filter(([key]) => !(CHECK_STRINGS as readonly string[]).includes(key))) as ForBuild<T>;
}

// README:130 (header), :132 (tab bar: the first four header items; About lives in the
// footer), :142 (footer). Shortcuts match the prototype manifest.
const LISTS = {
  header: ['home', 'check', 'learn', 'data', 'about'],
  tabs: ['home', 'check', 'learn', 'data'],
  footer: ['home', 'check', 'learn', 'data', 'a11y', 'install', 'about'],
  shortcuts: ['home', 'check', 'learn', 'data'],
} as const satisfies Record<string, readonly NavKey[]>;

export type NavPlace = keyof typeof LISTS;

export function navKeys(place: NavPlace, features: Features): NavKey[] {
  return LISTS[place].filter((key) => key !== 'check' || features.check);
}

export function navHref(key: NavKey, lang: Lang): string {
  if (key === 'a11y') return href('about', lang, { hash: 'accessibility' });
  return href(key, lang);
}

/** Tab bar icons, 24×24 stroke paths (README:132). Install's offline list reuses them. */
export const TAB_ICONS: Partial<Record<NavKey, string>> = {
  home: 'M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.6a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z',
  check: 'M9 3h6v3H9zM8.5 4.5h-2A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-2M9 13.5l2 2 4-4.5',
  learn: 'M3 5.5c2.5-1 5.5-1 9 1 3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1zM12 6.5V20',
  data: 'M5 20v-8M12 20V5M19 20v-5M3 20h18',
};
