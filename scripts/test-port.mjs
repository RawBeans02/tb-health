// The port the browser tests serve dist/ on (playwright.config.ts): one per checkout, so the
// server a stopped run leaves behind, which later runs reuse outside CI, is always this
// checkout's and serves its dist/, never another checkout's. A stable hash of the checkout's
// real path into 43000–43999, away from `npm run serve`'s 4322; TBPH_TEST_PORT sets it instead.
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CHECKOUT = fileURLToPath(new URL('..', import.meta.url));

/** 43000–43999, from a checkout's path. @param {string} path */
export function portFor(path) {
  return 43000 + (createHash('sha256').update(path).digest().readUInt32BE(0) % 1000);
}

/** This checkout's test port, or TBPH_TEST_PORT's. @param {string} [checkout] @param {Record<string, string | undefined>} [env] */
export function testPort(checkout = CHECKOUT, env = process.env) {
  const set = env.TBPH_TEST_PORT;
  if (!set) return portFor(realpathSync(checkout));
  const port = Number(set);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`TBPH_TEST_PORT must be a port from 1024 to 65535, not ${JSON.stringify(set)}.`);
  return port;
}
