// The web app manifest (README:371): the prototype's manifest.webmanifest with production
// routes. One English manifest (D25): the shortcuts open English pages, and a reader who
// chose Filipino reaches the /fil twin through the saved-choice redirect. Shortcuts come
// from the shared route list, so the Q9 switch drops Check here too; `?source=` is gone (D23).
import { chrome } from '../content/chrome.ts';
import { href } from './i18n.ts';
import { navKeys, type Features } from './nav.ts';

/** The --canvas token (tokens.css). A manifest can't read CSS; a unit test keeps them equal. */
export const CANVAS = '#F1F3F4';

type ShortcutKey = 'home' | 'check' | 'learn' | 'data';

// The prototype manifest's short names and icons, by route.
const SHORTCUTS: Record<ShortcutKey, { short_name: string; icon: string; query?: Record<string, string> }> = {
  home: { short_name: 'Find care', icon: 'find', query: { need: 'all' } },
  check: { short_name: 'Check', icon: 'check' },
  learn: { short_name: 'Learn', icon: 'learn' },
  data: { short_name: 'Data', icon: 'data' },
};

export function webManifest(features: Features) {
  return {
    id: '/',
    name: 'TB PH',
    short_name: 'TB PH',
    description: 'Find a chest X-ray, a TB test and free TB medicines near you in the Philippines, step by step.',
    lang: 'en',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: CANVAS,
    theme_color: CANVAS,
    categories: ['health', 'medical', 'navigation'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: navKeys('shortcuts', features)
      .filter((key): key is ShortcutKey => key in SHORTCUTS)
      .map((key) => ({
        name: chrome[`nav_${key}`].en,
        short_name: SHORTCUTS[key].short_name,
        url: href(key, 'en', { query: SHORTCUTS[key].query }),
        icons: [{ src: `/icons/shortcut-${SHORTCUTS[key].icon}-96.png`, sizes: '96x96', type: 'image/png' }],
      })),
  };
}
