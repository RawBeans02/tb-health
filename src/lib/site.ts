// The site's address and what search engines get (PLAN §5 step 12). The host and domain are
// the owner's to pick (Q7), so the origin comes from SITE_URL at build time; canonical,
// hreflang, Open Graph, the sitemap and robots.txt all follow it.
import { LANGS, ROUTES, href } from './i18n.ts';
import type { Features } from './nav.ts';

/** Until Q7 is answered. launch-check flags it, and a production build refuses it. */
export const PLACEHOLDER_SITE = 'https://tb-ph.example';

/**
 * The origin to build for. Pages link to /_astro/… and /fil/… from the root, so the site
 * must be served from the root of an https origin, not a sub-path.
 */
export function siteOrigin(value: string | undefined, production: boolean): string {
  const url = new URL(value || PLACEHOLDER_SITE);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username) {
    throw new Error(`SITE_URL must be a bare https origin such as https://example.org, not ${value}`);
  }
  if (production && url.origin === PLACEHOLDER_SITE) throw new Error('A production build (TBPH_PRODUCTION=true) needs SITE_URL: the domain is still the placeholder (Q7).');
  return url.origin;
}

/**
 * Every page search engines should know, in both languages: the routes the build has (Q9
 * drops /check) and one page per place under its current id. Left out: 404s, the offline
 * page and place shell (stand-ins), and alias ids (their canonical is the current id).
 */
export function sitemapPaths(features: Features, placeIds: readonly string[]): string[] {
  const routes = (Object.keys(ROUTES) as (keyof typeof ROUTES)[]).filter((key) => key !== 'check' || features.check);
  return LANGS.flatMap((lang) => [...routes.map((key) => href(key, lang)), ...placeIds.map((id) => href('place', lang, { id }))]);
}

export function sitemapXml(site: string, paths: readonly string[]): string {
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href.replace(/&/g, '&amp;')}</loc></url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
}

export function robotsTxt(site: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
}
