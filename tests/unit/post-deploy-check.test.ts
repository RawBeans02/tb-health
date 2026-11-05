// The post-deploy check's header comparison (audit B63): each page and file type gets exactly
// the headers dist/_headers gives it, so a weakened value fails where a pattern would pass.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { headersFile } from '../../src/lib/headers.ts';
import { checkSite, expectedHeaders, headerProblems, parseHeaders, parseOrigin } from '../../scripts/post-deploy-check.mjs';

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

describe('parseOrigin (B75)', () => {
  it('takes an http: or https: address as its origin, and nothing else', () => {
    expect(parseOrigin('https://tbph.org/some/page')).toBe('https://tbph.org');
    expect(parseOrigin('http://127.0.0.1:4322')).toBe('http://127.0.0.1:4322');
    for (const bad of [undefined, '', 'tbph.org', 'ftp://tbph.org', 'file:///etc/passwd', 'javascript:alert(1)']) expect(parseOrigin(bad), String(bad)).toBeNull();
  });
});

describe('checkSite: five failures in a row (B75)', () => {
  const dirs: string[] = [];
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));
  /** A small dist/: two pages in the sitemap, one script, one icon. */
  const dist = () => {
    const d = mkdtempSync(join(tmpdir(), 'tbph-pdc-'));
    dirs.push(d);
    mkdirSync(join(d, 'icons'));
    writeFileSync(join(d, 'index.html'), '<script src="/_astro/app.js"></script>');
    writeFileSync(join(d, '_headers'), headersFile(true));
    writeFileSync(join(d, 'sitemap.xml'), '<loc>https://tbph.org/</loc><loc>https://tbph.org/places</loc>');
    writeFileSync(join(d, 'icons', 'a.png'), '');
    return d;
  };

  it('stops sending requests but keeps the problems and errors found so far', async () => {
    let calls = 0;
    // The first request answers with a cookie (a problem); every later one fails.
    const fetchImpl = (async () => {
      if (++calls === 1) return new Response('x', { headers: { 'set-cookie': 'a=1' } });
      throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
    }) as unknown as typeof fetch;
    const result = await checkSite('https://tbph.org', dist(), fetchImpl);
    expect(calls).toBe(6);
    expect(result.errors).toHaveLength(5);
    expect(result.errors[0]).toBe('/places: ECONNREFUSED');
    expect(result.problems).toContain('/: sets a cookie');
    expect(result.stopped).toMatch(/stopped answering/);
  });
});
