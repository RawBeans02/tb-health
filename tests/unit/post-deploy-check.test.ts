// The post-deploy check's header comparison (audit B63): each page and file type gets exactly
// the headers dist/_headers gives it, so a weakened value fails where a pattern would pass.
import { describe, expect, it } from 'vitest';
import { headersFile } from '../../src/lib/headers.ts';
import { expectedHeaders, headerProblems, parseHeaders } from '../../scripts/post-deploy-check.mjs';

const rules = parseHeaders(headersFile(true));
const SECURITY = ['strict-transport-security', 'content-security-policy', 'permissions-policy', 'x-content-type-options', 'referrer-policy'];
const served = (path: string, change: Record<string, string | null> = {}) => {
  const live = new Map(expectedHeaders(rules, path));
  for (const [name, value] of Object.entries(change)) {
    if (value === null) live.delete(name);
    else live.set(name, value);
  }
  return { get: (name: string) => live.get(name) ?? null };
};

describe('expectedHeaders', () => {
  it('gives every page and 404 the security headers and nothing else', () => {
    for (const path of ['/', '/fil', '/places', '/fil/places', '/place/abc', '/fil/place/abc', '/data', '/place', '/no-such-page-x1', '/fil/place/no-such-place-x1']) {
      expect([...expectedHeaders(rules, path).keys()], path).toEqual(SECURITY);
    }
  });

  it('adds Cache-Control for the service worker, hashed files, data, icons and the manifest', () => {
    expect(expectedHeaders(rules, '/sw.js').get('cache-control')).toBe('no-cache');
    expect(expectedHeaders(rules, '/_astro/app.Ab12.js').get('cache-control')).toBe('public, max-age=31536000, immutable');
    for (const path of ['/data/facilities.json', '/icons/icon-192.png', '/manifest.webmanifest']) {
      expect(expectedHeaders(rules, path).get('cache-control'), path).toBe('public, max-age=0, must-revalidate');
    }
  });

  it('asks for noindex only off production', () => {
    expect(expectedHeaders(rules, '/').has('x-robots-tag')).toBe(false);
    expect(expectedHeaders(parseHeaders(headersFile(false)), '/').get('x-robots-tag')).toBe('noindex');
  });

  it('joins a header that two matching rules both set', () => {
    expect(expectedHeaders(parseHeaders('/*\n  Link: <a>\n/x\n  Link: <b>\n'), '/x').get('link')).toBe('<a>, <b>');
  });
});

describe('headerProblems', () => {
  it('passes headers served exactly as set', () => {
    for (const path of ['/', '/sw.js', '/data/facilities.json']) expect(headerProblems(path, expectedHeaders(rules, path), served(path), true)).toEqual([]);
  });

  it('fails a weakened or missing value that a pattern would let through', () => {
    const path = '/fil/places';
    expect(headerProblems(path, expectedHeaders(rules, path), served(path, { 'strict-transport-security': 'max-age=0' }), true)).toEqual([
      '/fil/places: strict-transport-security is "max-age=0", not "max-age=31536000"',
    ]);
    expect(headerProblems('/sw.js', expectedHeaders(rules, '/sw.js'), served('/sw.js', { 'cache-control': 'max-age=0' }), true)).toHaveLength(1);
    expect(headerProblems(path, expectedHeaders(rules, path), served(path, { 'x-content-type-options': null }), true)).toHaveLength(1);
  });

  it('fails a cookie, and a noindex on production', () => {
    expect(headerProblems('/', expectedHeaders(rules, '/'), served('/', { 'set-cookie': 'a=1' }), true)).toEqual(['/: sets a cookie']);
    expect(headerProblems('/', expectedHeaders(rules, '/'), served('/', { 'x-robots-tag': 'noindex' }), true)).toEqual(['/: a production deploy says noindex']);
  });
});
