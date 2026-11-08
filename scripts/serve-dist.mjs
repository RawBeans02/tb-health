#!/usr/bin/env node
// Serves dist/ the way the planned host (Cloudflare Pages, Q7) does, for Playwright and
// local checks. No dependencies.
//   /places        → places.html          /fil → fil.html
//   /places/ and /places.html → 308 to /places (query kept)
//   unknown path   → nearest 404.html walking up (place/404.html, fil/404.html, 404.html), status 404
//   dist/_headers  → applied to every response it matches, and never served itself
//   text files     → Brotli or gzip when the browser accepts it, as the host compresses them
//                    (Lighthouse's throttled timings count the bytes sent)
//
//   node scripts/serve-dist.mjs [--port 4322]   (0: any free port; it prints the address it got)
// The browser tests start it on their own port (scripts/test-port.mjs), Lighthouse on port 0.

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const portArg = process.argv.indexOf('--port');
const port = Number(portArg > 0 ? process.argv[portArg + 1] : process.env.PORT ?? 4322);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function isFile(path) {
  return existsSync(path) && statSync(path).isFile();
}

// Returns a path inside dist/, or null if the request tries to leave it.
function inside(urlPath) {
  const path = normalize(join(root, urlPath));
  return path === root || path.startsWith(root + sep) ? path : null;
}

function nearest404(urlPath) {
  let dir = dirname(urlPath);
  for (;;) {
    const candidate = inside(join(dir, '404.html'));
    if (candidate && isFile(candidate)) return candidate;
    if (dir === '/' || dir === '.') return null;
    dir = dirname(dir);
  }
}

// dist/_headers as Cloudflare Pages and Netlify read it: a path pattern (`*` matches
// anything), then its headers indented below. Every matching rule applies, and a header two
// rules set is joined with a comma, as Cloudflare does. Read per request, since a rebuild
// rewrites it while the server runs.
function headersFor(urlPath) {
  const file = join(root, '_headers');
  if (!isFile(file)) return {};
  const out = {};
  let applies = false;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      applies = new RegExp(`^${pattern}$`).test(urlPath);
    } else if (applies) {
      const colon = line.indexOf(':');
      const name = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      out[name] = out[name] ? `${out[name]}, ${value}` : value;
    }
  }
  return out;
}

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest', '.svg', '.txt', '.xml']);

function send(req, res, status, file, urlPath) {
  const headers = {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
    ...headersFor(urlPath),
  };
  const accepts = req.headers['accept-encoding'] ?? '';
  if (!COMPRESSIBLE.has(extname(file)) || !/\b(br|gzip)\b/.test(accepts)) {
    res.writeHead(status, headers);
    createReadStream(file).pipe(res);
    return;
  }
  const body = readFileSync(file);
  const br = /\bbr\b/.test(accepts);
  const encoded = br ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }) : gzipSync(body);
  res.writeHead(status, { ...headers, 'Content-Encoding': br ? 'br' : 'gzip', Vary: 'Accept-Encoding', 'Content-Length': encoded.length });
  res.end(encoded);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let urlPath;
  try {
    urlPath = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  const redirectTo =
    urlPath.length > 1 && urlPath.endsWith('/') ? urlPath.replace(/\/+$/, '') :
    urlPath.endsWith('/index.html') ? urlPath.slice(0, -'index.html'.length).replace(/(.)\/$/, '$1') :
    urlPath.endsWith('.html') ? urlPath.slice(0, -'.html'.length) :
    null;
  if (redirectTo !== null) {
    res.writeHead(308, { Location: encodeURI(redirectTo || '/') + url.search }).end();
    return;
  }

  const base = urlPath === '/_headers' ? null : inside(urlPath);
  if (base) {
    const file = urlPath === '/' ? join(root, 'index.html') : isFile(`${base}.html`) ? `${base}.html` : isFile(base) ? base : null;
    if (file) {
      send(req, res, 200, file, urlPath);
      return;
    }
  }

  const notFound = nearest404(urlPath);
  if (notFound) send(req, res, 404, notFound, urlPath);
  else res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`serve-dist: http://127.0.0.1:${server.address().port} (${root})`);
});
