// The service worker (PLAN §5 step 11), with the prototype's strategies (sw.js) on Workbox.
// scripts/build-sw.mjs bundles it to dist/sw.js after `astro build` and fills in the
// precache list and the version. Type-checked on its own (tsconfig.sw.json): it runs in a
// worker, not a page.
//   Pages: network first, 4 s; then the copy saved for that path, whatever the query; then
//          the place shell or the offline page, in the page's language.
//   Saved files (assets, data): from the precache, refreshed with each release.
//   Other files from our origin: stale-while-revalidate.
//   Other origins (map tiles, Google Maps, Sakay.ph): not handled, so never cached.
import { clientsClaim } from 'workbox-core';
import { addRoute, cleanupOutdatedCaches, matchPrecache, precache, type PrecacheEntry } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { offlineStandIn, savedPath } from './lib/offline.ts';

declare const self: ServiceWorkerGlobalScope;
declare const __TBPH_PRECACHE__: PrecacheEntry[];
declare const __TBPH_VERSION__: string;

const PAGES = `tbph-pages-${__TBPH_VERSION__}`;
const FILES = `tbph-files-${__TBPH_VERSION__}`;

// A new release takes over at once, as the prototype's does.
void self.skipWaiting();
clientsClaim();

precache(__TBPH_PRECACHE__);
cleanupOutdatedCaches();

// The runtime caches belong to one release: an old page could ask for assets the new one dropped.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => /^tbph-(pages|files)-/.test(key) && key !== PAGES && key !== FILES).map((key) => caches.delete(key)))),
  );
});

const byPath = async ({ request }: { request: Request }) => new URL(savedPath(new URL(request.url).pathname), self.location.origin).href;

registerRoute(
  ({ request, sameOrigin }) => sameOrigin && request.mode === 'navigate',
  new NetworkFirst({
    cacheName: PAGES,
    networkTimeoutSeconds: 4,
    plugins: [
      { cacheKeyWillBeUsed: byPath },
      {
        // Not visited yet: the copy saved at install, else the stand-in.
        cachedResponseWillBeUsed: async ({ request, cachedResponse }) => {
          if (cachedResponse) return cachedResponse;
          const { pathname } = new URL(request.url);
          return (await matchPrecache(pathname)) ?? (await matchPrecache(offlineStandIn(pathname))) ?? null;
        },
      },
    ],
  }),
);

addRoute({ ignoreURLParametersMatching: [/.*/] });

registerRoute(({ sameOrigin }) => sameOrigin, new StaleWhileRevalidate({ cacheName: FILES, plugins: [{ cacheKeyWillBeUsed: byPath }] }));
