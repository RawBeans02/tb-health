// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';
import preact from '@astrojs/preact';

/** @param {string} pkg @param {string} file */
const fontsource = (pkg, file) => `./node_modules/@fontsource/${pkg}/files/${file}`;

export default defineConfig({
  output: 'static',
  // Placeholder domain until the owner picks host and domain (Q7); launch-check flags it.
  site: 'https://tb-ph.example',
  // Slashless URLs served from flat files: /places -> places.html (PLAN §2).
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [preact()],
  env: {
    schema: {
      // TBPH_CHECK=false builds without Check in the nav, tab bar, shortcuts and sitemap (Q9).
      TBPH_CHECK: envField.boolean({ context: 'server', access: 'public', default: true }),
    },
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
