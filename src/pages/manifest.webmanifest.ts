// /manifest.webmanifest, built with the Check switch (Q9) applied to its shortcuts.
import type { APIRoute } from 'astro';
import { TBPH_CHECK } from 'astro:env/server';
import { webManifest } from '../lib/manifest.ts';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(webManifest({ check: TBPH_CHECK }), null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
