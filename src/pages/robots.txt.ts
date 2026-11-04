// /robots.txt: everything may be crawled; the sitemap is on the site's origin (SITE_URL, Q7).
// Non-production deploys are kept out of search by the X-Robots-Tag header (src/lib/headers.ts).
import type { APIRoute } from 'astro';
import { robotsTxt } from '../lib/site.ts';

export const GET: APIRoute = ({ site }) => new Response(robotsTxt(site!.href), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
