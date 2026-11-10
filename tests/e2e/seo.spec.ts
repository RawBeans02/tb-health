// Step 12: head tags, sitemap, robots.txt and response headers (PLAN §5). Requests only, so
// it runs in one browser project. The site's origin (SITE_URL, Q7) is read from the build and
// mapped to the local server.
import type { APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.ts';

test.skip(({ browserName }) => browserName !== 'chromium', 'requests only: one project is enough');

const ids = (JSON.parse(readFileSync('dist/data/facilities.json', 'utf8')) as { facilities: { id: string }[] }).facilities.map((f) => f.id);

/** GET without following redirects. */
async function get(request: APIRequestContext, path: string) {
  return request.get(path, { maxRedirects: 0 });
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&#39;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>' };

/** The first capture of `pattern`, with HTML entities decoded. */
function tag(html: string, pattern: RegExp): string | undefined {
  return pattern.exec(html)?.[1]?.replace(/&(?:amp|#39|quot|lt|gt);/g, (entity) => ENTITIES[entity]);
}

async function siteOf(request: APIRequestContext) {
  const home = await (await get(request, '/')).text();
  return new URL(tag(home, /<link rel="canonical" href="([^"]+)"/)!).origin;
}

test.describe('search and sharing', () => {
  test('robots.txt names the sitemap on the site origin', async ({ request }) => {
    const site = await siteOf(request);
    const robots = await get(request, '/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
  });

  test('every sitemap page answers 200 without a redirect and has its head tags', async ({ request }) => {
    const site = await siteOf(request);
    const xml = await (await get(request, '/sitemap.xml')).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // 7 routes and every place, in both languages; no stand-ins, 404s or aliases.
    expect(locs).toHaveLength((7 + ids.length) * 2);
    const listed = new Set(locs);
    for (const loc of locs) {
      const url = new URL(loc);
      expect(url.origin).toBe(site);
      expect(url.search, loc).toBe('');
      expect(url.pathname, loc).not.toMatch(/\/offline$|\/404$|^(\/fil)?\/place$/);

      const response = await get(request, url.pathname);
      expect(response.status(), loc).toBe(200);
      const html = await response.text();
      const title = tag(html, /<title>([^<]*)<\/title>/);
      expect(title, loc).toBeTruthy();
      // V9: "TB PH | …" on Home, "… | TB PH" everywhere else; a place is titled with its name (V8: no em dash).
      expect(title, loc).toMatch(/^(\/fil)?\/?$/.test(url.pathname) ? /^TB PH \| \S/ : /\S \| TB PH$/);
      expect(title, loc).not.toMatch(/—|&mdash;|&#8212;|&#x2014;/i);
      if (/^(\/fil)?\/place\//.test(url.pathname)) expect(title, loc).toBe(`${tag(html, /<h1 class="place-name">([^<]*)<\/h1>/)} | TB PH`);
      expect(tag(html, /<link rel="canonical" href="([^"]+)"/), loc).toBe(loc);
      expect(html, loc).not.toContain('name="robots"');
      for (const lang of ['en', 'fil', 'x-default']) {
        const alternate = tag(html, new RegExp(`<link rel="alternate" hreflang="${lang}" href="([^"]+)"`));
        expect(alternate && listed.has(alternate), `${loc} hreflang ${lang} → ${alternate}`).toBe(true);
      }
      expect(tag(html, /<meta property="og:url" content="([^"]+)"/), loc).toBe(loc);
      expect(tag(html, /<meta property="og:title" content="([^"]+)"/), loc).toBe(title);
      expect(tag(html, /<meta property="og:image" content="([^"]+)"/), loc).toBe(`${site}/icons/og-image.png`);
      if (html.includes('name="description"')) expect(html, loc).toContain('property="og:description"');
      expect(html.match(/<h1[\s>]/g), `${loc}: one H1`).toHaveLength(1);
    }
  });

  test('Home shares the prototype’s preview text, in v8’s wording (V8, V9)', async ({ request }) => {
    const html = await (await get(request, '/')).text();
    expect(tag(html, /<meta property="og:title" content="([^"]+)"/)).toBe('TB PH | Find your way to TB care');
    expect(tag(html, /<meta property="og:description" content="([^"]+)"/)).toBe('Chest X-ray, TB test and free medicines near you, step by step.');
    const fil = await (await get(request, '/fil')).text();
    expect(tag(fil, /<meta property="og:title" content="([^"]+)"/)).toBe('TB PH | Hanapin ang daan papunta sa gamutan sa TB');
    expect(tag(fil, /<meta property="og:description" content="([^"]+)"/)).toBe('Chest X-ray, TB test at libreng gamot na malapit sa iyo, hakbang-hakbang.');
  });

  test('every route’s <title> and og:title, in English and Filipino (V9)', async ({ request }) => {
    const titles: Record<string, string> = {
      '/': 'TB PH | Find your way to TB care',
      '/fil': 'TB PH | Hanapin ang daan papunta sa gamutan sa TB',
      '/places': 'Find TB care near you | TB PH',
      '/fil/places': 'Hanapin ang gamutan malapit sa iyo | TB PH',
      '/check': 'Check symptoms | TB PH',
      '/fil/check': 'Suriin ang sintomas | TB PH',
      '/learn': 'Learn about TB | TB PH',
      '/fil/learn': 'Alamin ang TB | TB PH',
      '/data': 'The data | TB PH',
      '/fil/data': 'Ang datos | TB PH',
      '/about': 'About | TB PH',
      '/fil/about': 'Tungkol sa amin | TB PH',
      '/install': 'Install the app | TB PH',
      '/fil/install': 'I-install ang app | TB PH',
    };
    for (const [path, title] of Object.entries(titles)) {
      const html = await (await get(request, path)).text();
      expect(tag(html, /<title>([^<]*)<\/title>/), path).toBe(title);
      expect(tag(html, /<meta property="og:title" content="([^"]+)"/), path).toBe(title);
    }
    // The stand-ins and 404s, which have no share preview: the title alone.
    const standIns: Record<string, string> = {
      '/offline': 'Offline | TB PH',
      '/fil/offline': 'Wala kang koneksiyon | TB PH',
      '/no-such-page': 'Page not found | TB PH',
      '/fil/no-such-page': 'Hindi namin mahanap ang pahinang iyon | TB PH',
      '/place/no-such-place': 'Page not found | TB PH',
      '/fil/place/no-such-place': 'Hindi namin mahanap ang pahinang iyon | TB PH',
      '/place': 'TB PH',
      '/fil/place': 'TB PH',
    };
    for (const [path, title] of Object.entries(standIns)) {
      const html = await (await get(request, path)).text();
      expect(tag(html, /<title>([^<]*)<\/title>/), path).toBe(title);
      expect(html, path).not.toContain('og:title');
    }
  });

  test('the stand-ins and 404s are noindex, with no canonical or share preview', async ({ request }) => {
    for (const path of ['/offline', '/fil/place', '/no-such-page', '/place/no-such-place']) {
      const html = await (await get(request, path)).text();
      expect(html, path).toContain('<meta name="robots" content="noindex">');
      expect(html, path).not.toContain('rel="canonical"');
      expect(html, path).not.toContain('og:url');
    }
  });

  test('every manifest URL answers 200 without a redirect', async ({ request }) => {
    const manifest = await (await get(request, '/manifest.webmanifest')).json();
    const urls: string[] = [
      manifest.start_url,
      ...manifest.icons.map((i: { src: string }) => i.src),
      ...manifest.shortcuts.flatMap((s: { url: string; icons: { src: string }[] }) => [s.url, ...s.icons.map((i) => i.src)]),
    ];
    for (const url of urls) expect((await get(request, url)).status(), url).toBe(200);
  });

  test('responses carry the _headers file; it is never served itself', async ({ request }) => {
    for (const path of ['/', '/fil/learn', '/no-such-page']) {
      const headers = (await get(request, path)).headers();
      expect(headers['strict-transport-security'], path).toBe('max-age=31536000');
      expect(headers['content-security-policy'], path).toBe("frame-ancestors 'none'");
      expect(headers['permissions-policy'], path).toBe('geolocation=(self), camera=(), microphone=()');
      expect(headers['x-content-type-options'], path).toBe('nosniff');
      expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
      // Test builds aren't production.
      expect(headers['x-robots-tag'], path).toBe('noindex');
    }
    expect((await get(request, '/sw.js')).headers()['cache-control']).toBe('no-cache');
    const asset = (await (await get(request, '/')).text()).match(/\/_astro\/[^"]+\.js/)![0];
    expect((await get(request, asset)).headers()['cache-control']).toBe('public, max-age=31536000, immutable');
    expect((await get(request, '/data/facilities.json')).headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
    expect((await get(request, '/_headers')).status()).toBe(404);
  });
});
