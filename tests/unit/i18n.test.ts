import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { about } from '../../src/content/about.ts';
import { care } from '../../src/content/care.ts';
import { chrome } from '../../src/content/chrome.ts';
import { dotStory } from '../../src/content/dotstory.ts';
import { home } from '../../src/content/home.ts';
import { install } from '../../src/content/install.ts';
import { learn } from '../../src/content/learn.ts';
import { meta } from '../../src/content/meta.ts';
import { notFound } from '../../src/content/notfound.ts';
import { places } from '../../src/content/places.ts';
import { pick } from '../../src/content/types.ts';
import { formatDate, LAST_UPDATED } from '../../src/lib/dates.ts';
import { href, LANGS, langOf, pagePath, toLang } from '../../src/lib/i18n.ts';
import { CHECK_NAMES, forBuild, navHref, navKeys } from '../../src/lib/nav.ts';

describe('toLang', () => {
  it('maps every page to its twin and back', () => {
    for (const [en, fil] of [
      ['/', '/fil'],
      ['/places', '/fil/places'],
      ['/place/abc', '/fil/place/abc'],
      ['/404', '/fil/404'],
    ]) {
      expect(toLang(en, 'fil')).toBe(fil);
      expect(toLang(fil, 'en')).toBe(en);
      expect(toLang(en, 'en')).toBe(en);
      expect(toLang(fil, 'fil')).toBe(fil);
    }
  });

  it("doesn't mistake a path that only starts with the letters fil", () => {
    expect(langOf('/filipino')).toBe('en');
    expect(toLang('/filipino', 'fil')).toBe('/fil/filipino');
  });
});

describe('pagePath', () => {
  it('drops the built file name', () => {
    expect(pagePath('/index.html')).toBe('/');
    expect(pagePath('/fil.html')).toBe('/fil');
    expect(pagePath('/fil/404.html')).toBe('/fil/404');
    expect(pagePath('/places')).toBe('/places');
    expect(pagePath('/')).toBe('/');
  });
});

describe('href', () => {
  it('keeps links in the page language', () => {
    expect(href('home', 'en')).toBe('/');
    expect(href('home', 'fil')).toBe('/fil');
    expect(href('places', 'fil', { query: { svc: 'test' } })).toBe('/fil/places?svc=test');
    expect(href('about', 'fil', { hash: 'accessibility' })).toBe('/fil/about#accessibility');
  });

  it('builds place links from an encoded id and skips empty params', () => {
    expect(href('place', 'en', { id: 'a b/c', query: { stop: '2', need: undefined, near: '' } })).toBe('/place/a%20b%2Fc?stop=2');
    expect(() => href('place', 'en')).toThrow();
  });
});

describe('navKeys (one route list, Q9)', () => {
  it('lists the header, tab bar and footer items as specced', () => {
    const on = { check: true };
    expect(navKeys('header', on)).toEqual(['home', 'check', 'learn', 'data', 'about']);
    expect(navKeys('tabs', on)).toEqual(['home', 'check', 'learn', 'data']);
    expect(navKeys('footer', on)).toEqual(['home', 'check', 'learn', 'data', 'a11y', 'install', 'about']);
    expect(navKeys('shortcuts', on)).toEqual(['home', 'check', 'learn', 'data']);
  });

  it('leaves Check out of every list when the switch is off, and the tab bar keeps the rest', () => {
    const off = { check: false };
    for (const place of ['header', 'tabs', 'footer', 'shortcuts'] as const) expect(navKeys(place, off)).not.toContain('check');
    expect(navKeys('tabs', off)).toEqual(['home', 'learn', 'data']);
  });

  it('points Accessibility at the About section', () => {
    expect(navHref('a11y', 'fil')).toBe('/fil/about#accessibility');
  });
});

describe('the strings a build without Check ships (Q9, review 8 Nov 2026)', () => {
  it("CHECK_NAMES finds each of the check's names in the copy, in both languages", () => {
    for (const s of [chrome.nav_check, home.optNotSure, home.bring3, dotStory.b7_check, learn.l5_action1, install.off2, install.lead, about.privacy1, about.disclaimerText, about.appText, meta.checkTitle, meta.installDescription]) {
      expect(s.en).toMatch(CHECK_NAMES);
      expect(s.fil).toMatch(CHECK_NAMES);
    }
  });

  it('CHECK_NAMES finds none of the …NoCheck twins, which a build without Check ships instead', () => {
    for (const s of [about.disclaimerTextNoCheck, about.privacy1NoCheck, about.appTextNoCheck, install.leadNoCheck, meta.installDescriptionNoCheck, notFound.leadNoCheck]) {
      expect(s.en).not.toMatch(CHECK_NAMES);
      expect(s.fil).not.toMatch(CHECK_NAMES);
    }
  });

  it('forBuild passes every string through with Check', () => {
    const t = { ...pick(home, 'en'), ...pick(chrome, 'en') };
    expect(forBuild(t, { check: true })).toBe(t);
  });

  it('forBuild leaves out exactly the strings islands and the language JSON carry that name the check', () => {
    for (const lang of LANGS) {
      const all = { ...pick(home, lang), ...pick(care, lang), ...pick(places, lang), ...pick(chrome, lang) };
      const shipped = forBuild(all, { check: false });
      expect(Object.keys(all).filter((key) => !(key in shipped))).toEqual(['optNotSure', 'bring3', 'nav_check']);
      expect(JSON.stringify(shipped), lang).not.toMatch(CHECK_NAMES);
    }
  });
});

describe('formatDate', () => {
  it('writes the date as the prototype does, in both languages', () => {
    expect(formatDate('2026-10-30', 'en')).toBe('30 October 2026');
    expect(formatDate('2026-10-30', 'fil')).toBe('30 Oktubre 2026');
    expect(formatDate('2026-09-03', 'fil')).toBe('3 Setyembre 2026');
  });

  it('takes "last updated" from the newest data file', () => {
    const dates = ['data/tb-ph-data.json', 'data/claims.json'].map((file) => JSON.parse(readFileSync(file, 'utf8')).meta.generated as string);
    expect(LAST_UPDATED).toBe(dates.sort().at(-1));
    expect(LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
