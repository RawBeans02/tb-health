// /sitemap.xml for the site's origin (SITE_URL, Q7), built with the Check switch (Q9).
import type { APIRoute } from 'astro';
import { TBPH_CHECK } from 'astro:env/server';
import { readFacilities } from '../lib/build-data.ts';
import { sitemapPaths, sitemapXml } from '../lib/site.ts';

export const GET: APIRoute = ({ site }) => {
  const ids = readFacilities().facilities.map((row) => row.id);
  return new Response(sitemapXml(site!.href, sitemapPaths({ check: TBPH_CHECK }, ids)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
