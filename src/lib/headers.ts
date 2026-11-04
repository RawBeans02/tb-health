// dist/_headers (PLAN §4.5, step 12): the response headers a <meta> CSP can't carry, in the
// syntax Cloudflare Pages and Netlify both read, so the choice of host (Q7) needs no change
// here. Builds that aren't production (TBPH_PRODUCTION=true) also ask search engines not to
// index them. On GitHub Pages none of this applies: see PLAN §3, Host.

export function headersFile(production: boolean): string {
  const all = [
    // A year; includeSubDomains waits until the owner's domain is known (Q7).
    'Strict-Transport-Security: max-age=31536000',
    // Only what the meta CSP can't say. Both policies apply, so this one restricts nothing else.
    "Content-Security-Policy: frame-ancestors 'none'",
    'Permissions-Policy: geolocation=(self), camera=(), microphone=()',
    'X-Content-Type-Options: nosniff',
    // The browser default, stated: other sites see our origin, never a page address (§4.5).
    'Referrer-Policy: strict-origin-when-cross-origin',
    ...(production ? [] : ['X-Robots-Tag: noindex']),
  ];
  return [
    '# Written by scripts/build-headers.mjs from src/lib/headers.ts.',
    '/*',
    ...all.map((line) => `  ${line}`),
    '',
    '# The browser checks for a new service worker on every visit.',
    '/sw.js',
    '  Cache-Control: no-cache',
    '',
    '# Content-hashed build files never change under one name (build-headers checks the names).',
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '# Data, icons and the manifest keep their names across releases: always revalidated.',
    '# Pages get the same from both hosts by default (a /* rule would merge with the one above).',
    ...['/data/*', '/icons/*', '/manifest.webmanifest'].flatMap((path) => [path, '  Cache-Control: public, max-age=0, must-revalidate', '']),
  ].join('\n');
}
