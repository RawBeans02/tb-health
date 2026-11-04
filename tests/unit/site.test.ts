// Step 12: the site's origin, sitemap, robots.txt and response headers (PLAN §5).
import { describe, expect, it } from 'vitest';
import { headersFile } from '../../src/lib/headers.ts';
import { placePathsFor } from '../../src/lib/build-data.ts';
import type { FacilitiesFile } from '../../src/lib/core/data.ts';
import type { FacilityRow } from '../../src/lib/core/facility.ts';
import { headLinks, PLACEHOLDER_SITE, robotsTxt, siteOrigin, sitemapPaths, sitemapXml } from '../../src/lib/site.ts';

describe('siteOrigin', () => {
  it('is SITE_URL as a bare origin, or the placeholder', () => {
    expect(siteOrigin(undefined, false)).toBe(PLACEHOLDER_SITE);
    expect(siteOrigin('', false)).toBe(PLACEHOLDER_SITE);
    expect(siteOrigin('https://tbph.example.org', false)).toBe('https://tbph.example.org');
    expect(siteOrigin('https://tbph.example.org/', false)).toBe('https://tbph.example.org');
  });

  it('refuses http, a sub-path, a query and credentials', () => {
    for (const bad of ['http://tbph.example.org', 'https://user.github.io/tb-ph', 'https://tbph.example.org/?x=1', 'https://a:b@tbph.example.org']) {
      expect(() => siteOrigin(bad, false), bad).toThrow(/bare https origin/);
    }
  });

  it('refuses the placeholder in a production build', () => {
    expect(() => siteOrigin(undefined, true)).toThrow(/placeholder/);
    expect(siteOrigin('https://tbph.example.org', true)).toBe('https://tbph.example.org');
  });
});

describe('sitemap', () => {
  it('lists the routes and current place ids in both languages', () => {
    expect(sitemapPaths({ check: true }, ['a-b', 'c'])).toEqual([
      ...['/', '/places', '/check', '/learn', '/data', '/about', '/install'],
      '/place/a-b',
      '/place/c',
      ...['/fil', '/fil/places', '/fil/check', '/fil/learn', '/fil/data', '/fil/about', '/fil/install'],
      '/fil/place/a-b',
      '/fil/place/c',
    ]);
  });

  it('leaves out /check without Check (Q9), and never lists the stand-ins or 404s', () => {
    const paths = sitemapPaths({ check: false }, ['x']);
    expect(paths.filter((p) => p.includes('check'))).toEqual([]);
    expect(paths.filter((p) => /offline|404|^(\/fil)?\/place$/.test(p))).toEqual([]);
  });

  it('writes absolute URLs on the site origin', () => {
    const xml = sitemapXml('https://tbph.example.org/', ['/', '/fil/place/a']);
    expect(xml).toContain('<loc>https://tbph.example.org/</loc>');
    expect(xml).toContain('<loc>https://tbph.example.org/fil/place/a</loc>');
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  it('is named in robots.txt', () => {
    expect(robotsTxt('https://tbph.example.org/')).toBe('User-agent: *\nAllow: /\n\nSitemap: https://tbph.example.org/sitemap.xml\n');
  });
});

describe('headersFile', () => {
  it('sets what the meta CSP cannot, for every path, and no-cache on sw.js', () => {
    const file = headersFile(true);
    for (const line of [
      'Strict-Transport-Security: max-age=31536000',
      "Content-Security-Policy: frame-ancestors 'none'",
      'Permissions-Policy: geolocation=(self), camera=(), microphone=()',
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
    ]) {
      expect(file).toContain(`/*\n`);
      expect(file).toContain(`  ${line}\n`);
    }
    expect(file).toContain('/sw.js\n  Cache-Control: no-cache\n');
  });

  it('caches hashed build files for a year and revalidates the rest (L6)', () => {
    const file = headersFile(true);
    expect(file).toContain('/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n');
    for (const path of ['/data/*', '/icons/*', '/manifest.webmanifest']) expect(file).toContain(`${path}\n  Cache-Control: public, max-age=0, must-revalidate\n`);
    // No Cache-Control on /*: hosts merge every matching rule's headers.
    const all = file.slice(file.indexOf('/*\n'), file.indexOf('\n\n', file.indexOf('/*\n')));
    expect(all).not.toContain('Cache-Control');
  });

  it('marks every build but production noindex', () => {
    expect(headersFile(false)).toContain('  X-Robots-Tag: noindex\n');
    expect(headersFile(true)).not.toContain('X-Robots-Tag');
  });
});

describe('alias place pages (audit B41)', () => {
  // Synthetic rows: only the ids matter here.
  const row = (id: string) => ({ id }) as unknown as FacilityRow;
  const file = { meta: {}, aliases: { 'old-name-city': 'new-name-city', 'gone-place': 'no-such-id' }, facilities: [row('new-name-city'), row('other-place')] } as unknown as FacilitiesFile;

  it('builds an alias page for an old id whose target exists, naming the current id', () => {
    const pages = placePathsFor(file);
    expect(pages.map((p) => p.params.id)).toEqual(['new-name-city', 'other-place', 'old-name-city']);
    const alias = pages.find((p) => p.params.id === 'old-name-city')!;
    expect(alias.props.canonicalId).toBe('new-name-city');
    expect(alias.props.row.id).toBe('new-name-city');
  });

  it("gives /place/{old} and /fil/place/{old} the current id's canonical and hreflang", () => {
    const site = 'https://tbph.example.org';
    const current = `/place/${placePathsFor(file).find((p) => p.params.id === 'old-name-city')!.props.canonicalId}`;
    expect(headLinks(current, 'en', site)).toEqual({
      canonical: `${site}/place/new-name-city`,
      en: `${site}/place/new-name-city`,
      fil: `${site}/fil/place/new-name-city`,
      xDefault: `${site}/place/new-name-city`,
    });
    expect(headLinks(current, 'fil', site).canonical).toBe(`${site}/fil/place/new-name-city`);
  });
});
