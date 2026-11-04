import { describe, expect, it } from 'vitest';
import { formatDate, LAST_UPDATED } from '../../src/lib/dates.ts';
import { href, langOf, pagePath, toLang } from '../../src/lib/i18n.ts';
import { navHref, navKeys } from '../../src/lib/nav.ts';

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

describe('formatDate', () => {
  it('writes the date as the prototype does, in both languages', () => {
    expect(formatDate('2026-10-30', 'en')).toBe('30 October 2026');
    expect(formatDate('2026-10-30', 'fil')).toBe('30 Oktubre 2026');
    expect(formatDate('2026-09-03', 'fil')).toBe('3 Setyembre 2026');
  });

  it('takes "last updated" from the newest data file', () => {
    expect(LAST_UPDATED).toBe('2026-10-30');
  });
});
