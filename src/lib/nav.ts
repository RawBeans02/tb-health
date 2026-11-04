// One route list for the header nav, the phone tab bar, the footer and (step 11) the
// manifest shortcuts, so the Q9 build switch can leave Check out of all of them at once.
import { href, type Lang } from './i18n.ts';

export type NavKey = 'home' | 'check' | 'learn' | 'data' | 'about' | 'a11y' | 'install';

/** Build-time feature switches. `check: false` launches without /check (Q9). */
export interface Features {
  check: boolean;
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
