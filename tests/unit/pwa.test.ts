// Step 11: the manifest and what the service worker saves (PLAN §5).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CANVAS, webManifest } from '../../src/lib/manifest.ts';
import { offlineStandIn, precachePages, savedPath } from '../../src/lib/offline.ts';

// The v8 design reference's manifest (V6), byte for byte v6's.
const prototype = JSON.parse(readFileSync('design/v8/design_handoff_tb_ph/prototype/manifest.webmanifest', 'utf8'));

describe('webManifest', () => {
  const manifest = webManifest({ check: true });

  it("keeps the prototype's names, icons and colours, with production routes", () => {
    for (const key of ['name', 'short_name', 'description', 'lang', 'dir', 'display', 'background_color', 'theme_color', 'categories'] as const) {
      expect(manifest[key], key).toEqual(prototype[key]);
    }
    expect(manifest).toMatchObject({ id: '/', start_url: '/', scope: '/' });
    expect(manifest.icons).toEqual(prototype.icons.map((icon: { src: string }) => ({ ...icon, src: `/${icon.src}` })));
  });

  it('has the shortcuts of the shared route list, at production routes, without ?source (D23)', () => {
    expect(manifest.shortcuts.map((s) => [s.name, s.short_name, s.icons[0].src])).toEqual(
      prototype.shortcuts.map((s: { name: string; short_name: string; icons: { src: string }[] }) => [s.name, s.short_name, `/${s.icons[0].src}`]),
    );
    expect(manifest.shortcuts.map((s) => s.url)).toEqual(['/?need=all', '/check', '/learn', '/data']);
    expect(JSON.stringify(manifest)).not.toContain('source');
  });

  it('drops the Check shortcut without Check (Q9)', () => {
    expect(webManifest({ check: false }).shortcuts.map((s) => s.url)).toEqual(['/?need=all', '/learn', '/data']);
  });

  it('uses the canvas token for its colours, as the theme-color meta does', () => {
    const token = /--canvas:\s*(#[0-9A-Fa-f]{6})/.exec(readFileSync('src/styles/tokens.css', 'utf8'))?.[1];
    expect(CANVAS).toBe(token);
  });
});

describe('precachePages', () => {
  it('saves the core routes and both stand-ins in both languages', () => {
    expect(precachePages({ check: true })).toEqual([
      ...['/', '/places', '/check', '/learn', '/data', '/about', '/install', '/place', '/offline'],
      ...['/fil', '/fil/places', '/fil/check', '/fil/learn', '/fil/data', '/fil/about', '/fil/install', '/fil/place', '/fil/offline'],
    ]);
  });

  it('leaves /check out without Check (Q9)', () => {
    const pages = precachePages({ check: false });
    expect(pages).toHaveLength(16);
    expect(pages.filter((p) => p.includes('check'))).toEqual([]);
  });
});

describe('savedPath', () => {
  it('is the path alone, without a trailing slash', () => {
    expect(savedPath('/')).toBe('/');
    expect(savedPath('/fil/')).toBe('/fil');
    expect(savedPath('/places//')).toBe('/places');
    expect(savedPath('/place/abc')).toBe('/place/abc');
  });
});

describe('offlineStandIn', () => {
  it('is the place shell for a place page, in its language', () => {
    expect(offlineStandIn('/place/abc')).toBe('/place');
    expect(offlineStandIn('/fil/place/abc')).toBe('/fil/place');
    expect(offlineStandIn('/fil/place/abc/')).toBe('/fil/place');
  });

  it('is the offline page for anything else, in its language', () => {
    expect(offlineStandIn('/no-such-page')).toBe('/offline');
    expect(offlineStandIn('/placebo')).toBe('/offline');
    expect(offlineStandIn('/place/a/b')).toBe('/offline');
    expect(offlineStandIn('/fil')).toBe('/fil/offline');
    expect(offlineStandIn('/fil/x/y')).toBe('/fil/offline');
  });
});
