/* TB PH service worker: app shell + data offline, CDN cached, map tiles never cached. */
const VERSION = 'tbph-2026-10-30c';
const SHELL = VERSION + '-shell';
const RUNTIME = VERSION + '-runtime';
const CDN = 'tbph-cdn-v1'; // versioned URLs (react@18.3.1 etc.), safe to keep across releases
const PRECACHE = [
  './Home.dc.html', './Places.dc.html', './Place.dc.html', './Check.dc.html', './Learn.dc.html',
  './Data.dc.html', './DotStory.dc.html', './About.dc.html', './Install.dc.html', './404.dc.html',
  './SiteHeader.dc.html', './SiteFooter.dc.html', './index.html',
  './support.js', './tbph-core.js', './pwa.js', './manifest.webmanifest',
  './data/tb-ph-data.json', './data/tb-dots-facilities-SAMPLE.json', './data/claims.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.svg', './icons/favicon-32.png'
];
const CDN_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
// The prototype runtime (support.js) loads these pinned files with SRI. Precache them at install so the
// app opens offline even if the person goes offline right after the first visit. Update if support.js changes versions.
const CDN_PRECACHE = [
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js'
];
const NEVER = ['tile.openstreetmap.org', 'google.com', 'googleapis.com/maps', 'sakay.ph'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    // add one by one so a single missing file never breaks installation
    await Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: 'reload' }))));
    const cdn = await caches.open(CDN);
    await Promise.allSettled(CDN_PRECACHE.map((u) => cdn.add(new Request(u, { mode: 'cors', credentials: 'omit' }))));
    // the full facility list may not exist yet; cache it if it does
    try { const r = await fetch('./data/tb-dots-facilities.json', { cache: 'reload' }); if (r.ok) await c.put('./data/tb-dots-facilities.json', r); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL, RUNTIME, CDN];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const okToCache = (r) => r && (r.ok || r.type === 'opaque');

async function networkFirst(req, timeoutMs) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs))
    ]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (_) {
    const hit = (await caches.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    throw _;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await caches.match(req);
  const fresh = fetch(req).then((res) => { if (okToCache(res)) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await fresh) || Response.error();
}

function offlinePage() {
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Offline — TB PH</title><body style="margin:0;font:18px/1.5 system-ui,sans-serif;background:#F1F3F4;color:#14212B">' +
    '<main style="max-width:36rem;margin:0 auto;padding:72px 20px"><h1 style="color:#C42032;font-size:30px;line-height:1.1;margin:0 0 12px">You\'re offline.</h1>' +
    '<p style="margin:0 0 8px">This page hasn\'t been saved on your phone yet. Open TB PH again when you have a signal.</p>' +
    '<p lang="fil" style="margin:0 0 20px;color:#3F4B53">Wala kang koneksiyon. Hindi pa naka-save sa phone mo ang pahinang ito. Buksan ulit ang TB PH kapag may signal na.</p>' +
    '<p style="margin:0"><a href="./Home.dc.html" style="color:#175458;font-weight:700">Find TB care</a> &nbsp; <a href="tel:911" style="color:#C42032;font-weight:700">Emergency? Call 911.</a></p></main></body></html>';
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NEVER.some((h) => url.href.includes(h)) && !CDN_HOSTS.includes(url.hostname)) return; // network only
  if (CDN_HOSTS.includes(url.hostname)) { e.respondWith(staleWhileRevalidate(req, CDN)); return; }
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.dc.html') || url.pathname.endsWith('.html');
  if (isPage) {
    e.respondWith(networkFirst(req, 4000).catch(async () => (req.mode === 'navigate' ? offlinePage() : Response.error())));
    return;
  }
  e.respondWith(staleWhileRevalidate(req, RUNTIME));
});
