// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig, envField, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';
import { loadEnv } from 'vite';
import { siteOrigin } from './src/lib/site.ts';

/** @param {string} pkg @param {string} file */
const fontsource = (pkg, file) => `./node_modules/@fontsource/${pkg}/files/${file}`;

// TBPH_CHECK=false builds without Check (Q9): no /check pages, and no Check in the nav, tab
// bar, shortcuts, sitemap or service worker.
const TBPH_CHECK = envField.boolean({ context: 'server', access: 'public', default: true });

/**
 * Check's pages, /check and /fil/check (Q9). They live in src/check-pages, not src/pages, and
 * are added only when the build has Check: Astro bundles the island and stylesheet of every
 * page in src/pages, so a build without Check would still ship and precache them (review,
 * 8 Nov 2026). The switch is read as astro:env reads it for the pages, in the modes astro dev
 * and astro build run in: the environment over .env files, empty or unset is the schema's
 * default, anything but true or false an error.
 * @returns {import('astro').AstroIntegration}
 */
function checkPages() {
  return {
    name: 'tbph-check-pages',
    hooks: {
      'astro:config:setup': ({ config, command, injectRoute }) => {
        const value = loadEnv(command === 'dev' ? 'development' : 'production', config.vite.envDir ?? fileURLToPath(config.root), '').TBPH_CHECK;
        if (value !== undefined && value !== '' && value !== 'true' && value !== 'false') {
          throw new Error(`TBPH_CHECK is ${JSON.stringify(value)}: it must be true or false (Q9).`);
        }
        const withCheck = value === undefined || value === '' ? TBPH_CHECK.default : value === 'true';
        if (!withCheck) return;
        injectRoute({ pattern: '/check', entrypoint: './src/check-pages/check.astro' });
        injectRoute({ pattern: '/fil/check', entrypoint: './src/check-pages/fil/check.astro' });
      },
    },
  };
}

export default defineConfig({
  output: 'static',
  // The origin canonical, hreflang, Open Graph, sitemap and robots use: SITE_URL at build
  // time, else the placeholder until the owner picks host and domain (Q7; launch-check flags it).
  site: siteOrigin(process.env.SITE_URL, process.env.TBPH_PRODUCTION === 'true'),
  // Slashless URLs served from flat files: /places -> places.html (PLAN §2).
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact(), checkPages()],
  env: {
    schema: { TBPH_CHECK },
  },
  // Self-hosted from the Fontsource npm packages (README:89, OFL 1.1), latin subset.
  // Astro writes the @font-face rules and metric-matched fallbacks, so the swap doesn't shift layout.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Atkinson Hyperlegible Next',
      cssVariable: '--font-atkinson',
      fallbacks: ['Atkinson Hyperlegible', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [
          { weight: 400, style: 'normal', src: [fontsource('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-400-normal.woff2')] },
          { weight: 700, style: 'normal', src: [fontsource('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-700-normal.woff2')] },
          { weight: 400, style: 'italic', src: [fontsource('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-400-italic.woff2')] },
        ],
      },
    },
    {
      // Wordmark only (README:90).
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-newsreader',
      fallbacks: ['Georgia', 'serif'],
      display: 'swap',
      options: {
        variants: [{ weight: 600, style: 'normal', src: [fontsource('newsreader', 'newsreader-latin-600-normal.woff2')] }],
      },
    },
  ],
  // No code blocks on the site; Shiki's inline styles would also break the CSP.
  markdown: { syntaxHighlight: false },
  vite: {
    // No data: URIs for assets, so img-src and font-src can stay 'self'.
    build: { assetsInlineLimit: 0 },
    // The dev-only ?data=worst switch (step 15.4, src/lib/core/data.ts): compiled in only by
    // `npm run build:worst` (and astro dev). Read from the environment, never a .env file.
    define: { __TBPH_WORST__: JSON.stringify(process.env.TBPH_WORST === 'true') },
  },
  // On from step 1 (PLAN §4.5). Astro hashes its inline scripts and styles into a
  // <meta> CSP. Headers a meta tag can't carry (HSTS, frame-ancestors) come from
  // the host in step 12. Add hosts here only with the owner's OK.
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        // OpenStreetMap tiles for the optional Places map, and nothing else (Q5).
        "img-src 'self' https://tile.openstreetmap.org",
        "font-src 'self'",
        "connect-src 'self'",
        "manifest-src 'self'",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'"] },
    },
  },
});
