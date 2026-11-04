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

/** Tab bar icons, 24×24 stroke paths (README:132). Install's offline list reuses them. */
export const TAB_ICONS: Partial<Record<NavKey, string>> = {
  home: 'M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.6a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z',
  check: 'M9 3h6v3H9zM8.5 4.5h-2A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-2M9 13.5l2 2 4-4.5',
  learn: 'M3 5.5c2.5-1 5.5-1 9 1 3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1zM12 6.5V20',
  data: 'M5 20v-8M12 20V5M19 20v-5M3 20h18',
};
