// Page titles (V9, 4 Nov 2026): "TB PH | …" on Home and "… | TB PH" everywhere else, in English
// and Filipino, never with an em dash (V8). The views build the rest with pageTitle(), and
// og:title is the same text: tests/e2e/seo.spec.ts reads both on every built route.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chrome } from '../../src/content/chrome.ts';
import { home } from '../../src/content/home.ts';
import { learn } from '../../src/content/learn.ts';
import { meta } from '../../src/content/meta.ts';
import { notFound } from '../../src/content/notfound.ts';
import { offline } from '../../src/content/offline.ts';
import { places } from '../../src/content/places.ts';
import { LANGS } from '../../src/lib/i18n.ts';
import { BRAND, pageTitle } from '../../src/lib/title.ts';

const noStop = (text: string) => text.replace(/\.$/, '');

describe('page titles (V9)', () => {
  it('join the page and the brand with " | ", as V9 quotes Learn’s', () => {
    expect(BRAND).toBe('TB PH');
    expect(pageTitle('Learn about TB')).toBe('Learn about TB | TB PH');
    expect(pageTitle('Alamin ang TB')).toBe('Alamin ang TB | TB PH');
    // Learn.astro builds its title from the H1.
    expect(pageTitle(learn.h1.en)).toBe('Learn about TB | TB PH');
    expect(pageTitle(learn.h1.fil)).toBe('Alamin ang TB | TB PH');
  });

  it('match the four titles V9 quotes in docs/decisions.md, word for word', () => {
    const v9 = readFileSync('docs/decisions.md', 'utf8').split(/^(?=#)/m).find((section) => section.startsWith('### V9. '));
    const quoted = [...(v9 ?? '').matchAll(/"([^"]*TB PH[^"]*)"/g)].map((m) => m[1]);
    expect(quoted).toEqual([meta.homeTitle.en, pageTitle(learn.h1.en), meta.homeTitle.fil, pageTitle(learn.h1.fil)]);
  });

  it('put the brand first on Home, in the words V9 quotes', () => {
    expect(meta.homeTitle.en).toBe('TB PH | Find your way to TB care');
    expect(meta.homeTitle.fil).toBe('TB PH | Hanapin ang daan papunta sa gamutan sa TB');
    for (const lang of LANGS) expect(meta.homeTitle[lang]).toBe(`${BRAND} | ${noStop(home.h1[lang])}`);
  });

  it('end every other title in the dictionaries with " | TB PH", after the page’s own words', () => {
    for (const lang of LANGS) {
      expect(meta.placesTitle[lang]).toBe(pageTitle(places.heading[lang]));
      expect(meta.checkTitle[lang]).toBe(pageTitle(chrome.nav_check[lang]));
    }
    expect(meta.notFoundTitle.en).toBe('Page not found | TB PH');
    expect(meta.notFoundTitle.fil).toBe(pageTitle(noStop(notFound.h1.fil)));
    expect(meta.offlineTitle.en).toBe('Offline | TB PH');
    expect(meta.offlineTitle.fil).toBe(pageTitle(noStop(offline.h1.fil)));
  });

  it('have no em dash, in either language', () => {
    const titles = Object.entries(meta).filter(([key]) => key.endsWith('Title'));
    expect(titles.map(([key]) => key)).toEqual(['homeTitle', 'placesTitle', 'checkTitle', 'notFoundTitle', 'offlineTitle']);
    for (const [key, str] of titles) for (const lang of LANGS) expect(str[lang], `${key}.${lang}`).not.toContain('—');
  });
});
