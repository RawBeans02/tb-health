#!/usr/bin/env node
// Compares two folders of screenshots pixel by pixel (step 15.2: "light-mode screenshots still
// match the previous ones"; tests/e2e/screens.spec.ts takes them). PNGs pair up by their path
// under each folder. For each pair it prints "identical", or how many pixels differ and the box
// that holds them, and writes a diff image into diffDir: the differing pixels in red over a
// faded grey copy of the first image, at the larger of the two sizes (where only one image
// reaches, every pixel counts as differing). It lists the files only one folder has, and exits
// 1 when anything differs or is missing (2 when it can't run: a folder that isn't there, or no
// PNG at all).
//
//   node scripts/compare-screens.mjs <dirA> <dirB> [diffDir]
//
// node_modules has no pngjs or pixelmatch (sharp is there only as Astro's own dependency), so
// PNGs are read here with node:zlib: 8-bit greyscale, RGB, palette, greyscale with alpha and
// RGBA, not interlaced, which covers browser screenshots (Chromium's are 8-bit RGB). Pixels
// compare as RGBA, so the same picture saved two ways is identical. Files with the same bytes
// aren't decoded; the others are compared row by row as they inflate, so a full-page shot
// (Data at 1280px is 34 million pixels) never sits whole in memory, and the diff image is
// deflated as it is drawn: under 200 MB for all 40 step 15.2 pairs, where whole images took
// over 800 MB.

import { once } from 'node:events';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { createDeflate, createInflate, crc32, deflateSync, inflateSync } from 'node:zlib';
import { isMain } from './is-main.mjs';

/**
 * RGBA pixels, 4 bytes a pixel, rows top to bottom.
 * @typedef {{ width: number, height: number, data: Uint8Array }} Image
 */
/**
 * The box around the differing pixels, inclusive.
 * @typedef {{ x0: number, y0: number, x1: number, y1: number }} Box
 */
/** @typedef {{ file: string, status: 'identical' } | { file: string, status: 'differ', count: number, box: Box | null, sizes: [string, string] | null, diff: string | null } | { file: string, status: 'unreadable', error: string }} Pair */

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Channels per pixel for each 8-bit colour type. */
const CHANNELS = /** @type {Record<number, number>} */ ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 });
/** One RGBA number from its channels, red in the lowest byte. @param {number} r @param {number} g @param {number} b @param {number} a */
const rgba = (r, g, b, a) => (r | (g << 8) | (b << 16) | (a << 24)) >>> 0;
/** The diff image's palette: 0 is red, 1 to 255 the greys of the same value. */
const DIFF_PALETTE = Buffer.from(Array.from({ length: 256 }, (_, i) => (i ? [i, i, i] : [255, 0, 0])).flat());

/**
 * A PNG's size and compressed pixel data, and how to read pixel x of an unfiltered row as one
 * RGBA number.
 * @param {Buffer} buf
 */
function parsePng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG file');
  let header = null;
  let palette = null;
  let transparency = null;
  /** @type {Buffer[]} */
  const idat = [];
  for (let pos = 8; pos + 12 <= buf.length; ) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    if (data.length !== length) throw new Error(`the ${type} chunk is cut short`);
    pos += 12 + length;
    if (type === 'IHDR') header = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), depth: data[8], colour: data[9], interlace: data[12] };
    else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') transparency = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  if (!header) throw new Error('no IHDR chunk');
  const { width, height, depth, colour, interlace } = header;
  const channels = CHANNELS[colour];
  if (!channels || depth !== 8) throw new Error(`unsupported PNG: colour type ${colour}, bit depth ${depth} (8-bit only)`);
  if (interlace) throw new Error('unsupported PNG: interlaced');

  /** @type {(row: Uint8Array, x: number) => number} */
  let pixel;
  if (colour === 6) {
    pixel = (row, x) => rgba(row[x * 4], row[x * 4 + 1], row[x * 4 + 2], row[x * 4 + 3]);
  } else if (colour === 2) {
    // tRNS here is one colour, 16 bits a channel, that is fully transparent.
    const key = transparency && transparency.length >= 6 ? [transparency.readUInt16BE(0), transparency.readUInt16BE(2), transparency.readUInt16BE(4)] : null;
    pixel = (row, x) => {
      const s = x * 3;
      const clear = key !== null && row[s] === key[0] && row[s + 1] === key[1] && row[s + 2] === key[2];
      return rgba(row[s], row[s + 1], row[s + 2], clear ? 0 : 255);
    };
  } else if (colour === 3) {
    if (!palette) throw new Error('palette PNG without a PLTE chunk');
    const colours = new Uint32Array(256);
    for (let i = 0; i < 256; i++) colours[i] = i * 3 + 2 < palette.length ? rgba(palette[i * 3], palette[i * 3 + 1], palette[i * 3 + 2], transparency && i < transparency.length ? transparency[i] : 255) : rgba(0, 0, 0, 255);
    pixel = (row, x) => colours[row[x]];
  } else if (colour === 4) {
    pixel = (row, x) => rgba(row[x * 2], row[x * 2], row[x * 2], row[x * 2 + 1]);
  } else {
    const key = transparency && transparency.length >= 2 ? transparency.readUInt16BE(0) : -1;
    pixel = (row, x) => rgba(row[x], row[x], row[x], row[x] === key ? 0 : 255);
  }
  return { width, height, channels, data: Buffer.concat(idat), pixel };
}

/**
 * Undoes a row's PNG filter in place. `above` is the unfiltered row above it (zeros above the
 * first row); `bpp` the bytes a pixel.
 * @param {number} filter @param {Uint8Array} row @param {Uint8Array} above @param {number} bpp
 */
function unfilter(filter, row, above, bpp) {
  const n = row.length;
  if (filter === 1) {
    for (let i = bpp; i < n; i++) row[i] = (row[i] + row[i - bpp]) & 255;
  } else if (filter === 2) {
    for (let i = 0; i < n; i++) row[i] = (row[i] + above[i]) & 255;
  } else if (filter === 3) {
    for (let i = 0; i < n; i++) row[i] = (row[i] + (((i >= bpp ? row[i - bpp] : 0) + above[i]) >> 1)) & 255;
  } else if (filter === 4) {
    for (let i = 0; i < n; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = above[i];
      const c = i >= bpp ? above[i - bpp] : 0;
      const pa = Math.abs(b - c);
      const pb = Math.abs(a - c);
      const pc = Math.abs(a + b - 2 * c);
      row[i] = (row[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
  } else if (filter !== 0) throw new Error(`unknown filter type ${filter}`);
}

/**
 * Reads a whole PNG into RGBA pixels (for small images: pages compare row by row instead).
 * @param {Buffer} buf
 * @returns {Image}
 */
export function decodePng(buf) {
  const { width, height, channels, data, pixel } = parsePng(buf);
  const stride = width * channels;
  const raw = inflateSync(data);
  if (raw.length < (stride + 1) * height) throw new Error('the image data is shorter than the image');
  const out = new Uint8Array(width * height * 4);
  let above = new Uint8Array(stride);
  for (let y = 0, o = 0; y < height; y++) {
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    unfilter(raw[y * (stride + 1)], row, above, channels);
    for (let x = 0; x < width; x++, o += 4) {
      const p = pixel(row, x);
      out[o] = p & 255;
      out[o + 1] = (p >>> 8) & 255;
      out[o + 2] = (p >>> 16) & 255;
      out[o + 3] = p >>> 24;
    }
    above = row;
  }
  return { width, height, data: out };
}

/**
 * A PNG's rows one at a time, unfiltered as zlib inflates them, each as RGBA numbers. The
 * array is reused: read it before asking for the next row.
 * @param {ReturnType<typeof parsePng>} png
 * @returns {AsyncGenerator<Uint32Array, void, void>}
 */
async function* pngRows({ width, height, channels, data, pixel }) {
  const stride = width * channels;
  const inflate = createInflate({ chunkSize: 256 * 1024 });
  inflate.end(data);
  const pixels = new Uint32Array(width);
  /** @type {Uint8Array} */
  let above = new Uint8Array(stride);
  let pending = Buffer.alloc(0);
  let y = 0;
  for await (const piece of inflate) {
    pending = pending.length ? Buffer.concat([pending, piece]) : piece;
    let at = 0;
    for (; y < height && pending.length - at > stride; y++, at += stride + 1) {
      const row = pending.subarray(at + 1, at + 1 + stride);
      unfilter(pending[at], row, above, channels);
      for (let x = 0; x < width; x++) pixels[x] = pixel(row, x);
      yield pixels;
      above = row;
    }
    pending = pending.subarray(at);
  }
  if (y < height) throw new Error('the image data is shorter than the image');
}

/**
 * Writes RGBA pixels as an 8-bit RGBA PNG (no row filters).
 * @param {Image} image
 * @returns {Buffer}
 */
export function encodePng({ width, height, data }) {
  const stride = width * 4;
  const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) rows.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  return pngFile(width, height, 6, deflateSync(rows));
}

/**
 * An 8-bit PNG file from its deflated rows.
 * @param {number} width @param {number} height @param {3 | 6} colour 3 palette, 6 RGBA
 * @param {Buffer} deflated @param {Buffer | null} [palette]
 */
function pngFile(width, height, colour, deflated, palette = null) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colour; // compression, filter and interlace stay 0
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), ...(palette ? [chunk('PLTE', palette)] : []), chunk('IDAT', deflated), chunk('IEND', Buffer.alloc(0))]);
}

/** @param {string} type @param {Buffer} data */
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/**
 * Compares two PNGs pixel by pixel (RGBA, exact). Where only one image reaches, as when two
 * full-page screenshots differ in height, every pixel counts as differing.
 * @param {Buffer} bufA
 * @param {Buffer} bufB
 * @param {boolean} [withDiff] also draw the diff image (a PNG file's bytes, when pixels differ)
 * @returns {Promise<{ count: number, box: Box | null, sizes: [string, string] | null, diff: Buffer | null }>}
 */
export async function comparePngs(bufA, bufB, withDiff = false) {
  const a = parsePng(bufA);
  const b = parsePng(bufB);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const sizes = a.width === b.width && a.height === b.height ? null : /** @type {[string, string]} */ ([`${a.width}x${a.height}`, `${b.width}x${b.height}`]);
  const rowsA = pngRows(a);
  const rowsB = pngRows(b);
  // The diff image, deflated as it is drawn, in batches of rows: each row a filter byte (0),
  // then one DIFF_PALETTE index a pixel. A new batch is zeros, so every pixel starts red.
  const deflate = withDiff ? createDeflate() : null;
  /** @type {Buffer[]} */
  const deflated = [];
  deflate?.on('data', (piece) => deflated.push(piece));
  const batchSize = withDiff ? Math.max(256 * 1024, width + 1) : 0;
  let batch = Buffer.alloc(batchSize);
  let used = 0;
  const flush = async () => {
    if (deflate && used && !deflate.write(batch.subarray(0, used))) await once(deflate, 'drain');
    batch = Buffer.alloc(batchSize);
    used = 0;
  };
  let count = 0;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  try {
    for (let y = 0; y < height; y++) {
      const pa = y < a.height ? (await rowsA.next()).value : undefined;
      const pb = y < b.height ? (await rowsB.next()).value : undefined;
      if (withDiff && used + width + 1 > batch.length) await flush();
      const line = used + 1;
      if (withDiff) used += width + 1;
      for (let x = 0; x < width; x++) {
        if (pa && pb && x < a.width && x < b.width && pa[x] === pb[x]) {
          if (withDiff) {
            // A faded grey copy of the first image, for where things are: 217 to 255, never 0.
            const p = pa[x];
            const grey = 0.299 * (p & 255) + 0.587 * ((p >>> 8) & 255) + 0.114 * ((p >>> 16) & 255);
            batch[line + x] = Math.round(255 - (255 - grey) * 0.15 * ((p >>> 24) / 255));
          }
          continue;
        }
        count++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  } finally {
    await rowsA.return();
    await rowsB.return();
  }
  let diff = null;
  if (deflate) {
    await flush();
    deflate.end();
    await once(deflate, 'end');
    if (count) diff = pngFile(width, height, 3, Buffer.concat(deflated), DIFF_PALETTE);
  }
  return { count, box: count ? { x0, y0, x1, y1 } : null, sizes, diff };
}

/** The PNG files under `dir`, as sorted paths relative to it with "/", leaving out `skip`. @param {string} dir @param {string | null} skip */
export function listPngs(dir, skip = null) {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((rel) => /\.png$/i.test(rel) && !(skip && (join(dir, rel) + sep).startsWith(skip + sep)) && statSync(join(dir, rel)).isFile())
    .map((rel) => rel.split(sep).join('/'))
    .sort();
}

/**
 * Compares every PNG pair under two folders, writing a diff image per differing pair into
 * diffDir when one is given.
 * @param {string} dirA
 * @param {string} dirB
 * @param {string | null} [diffDir]
 */
export async function compareFolders(dirA, dirB, diffDir = null) {
  const skip = diffDir ? resolve(diffDir) : null;
  const inA = listPngs(resolve(dirA), skip);
  const inB = listPngs(resolve(dirB), skip);
  const setB = new Set(inB);
  /** @type {Pair[]} */
  const pairs = [];
  for (const file of inA.filter((f) => setB.has(f))) {
    const bufA = readFileSync(join(dirA, file));
    const bufB = readFileSync(join(dirB, file));
    if (bufA.equals(bufB)) {
      pairs.push({ file, status: 'identical' });
      continue;
    }
    let result;
    try {
      result = await comparePngs(bufA, bufB, !!diffDir);
    } catch (error) {
      pairs.push({ file, status: 'unreadable', error: error instanceof Error ? error.message : String(error) });
      continue;
    }
    if (!result.count) {
      pairs.push({ file, status: 'identical' });
      continue;
    }
    let diff = null;
    if (diffDir && result.diff) {
      diff = join(diffDir, file);
      mkdirSync(dirname(diff), { recursive: true });
      writeFileSync(diff, result.diff);
    }
    pairs.push({ file, status: 'differ', count: result.count, box: result.box, sizes: result.sizes, diff });
  }
  const setA = new Set(inA);
  return { pairs, onlyA: inA.filter((f) => !setB.has(f)), onlyB: inB.filter((f) => !setA.has(f)) };
}

/** One line per pair, then the files only one side has, then a summary. @param {Awaited<ReturnType<typeof compareFolders>>} result */
export function report({ pairs, onlyA, onlyB }) {
  const lines = pairs.map((p) => {
    if (p.status === 'identical') return `${p.file}: identical`;
    if (p.status === 'unreadable') return `${p.file}: unreadable (${p.error})`;
    const box = p.box ? `, box x ${p.box.x0}..${p.box.x1}, y ${p.box.y0}..${p.box.y1} (${p.box.x1 - p.box.x0 + 1}x${p.box.y1 - p.box.y0 + 1})` : '';
    const sizes = p.sizes ? `size ${p.sizes[0]} vs ${p.sizes[1]}, ` : '';
    return `${p.file}: ${sizes}${p.count} pixel${p.count === 1 ? '' : 's'} differ${p.count === 1 ? 's' : ''}${box}${p.diff ? `; diff ${p.diff}` : ''}`;
  });
  for (const f of onlyA) lines.push(`${f}: only in A`);
  for (const f of onlyB) lines.push(`${f}: only in B`);
  const identical = pairs.filter((p) => p.status === 'identical').length;
  const differ = pairs.length - identical;
  const ok = !differ && !onlyA.length && !onlyB.length;
  lines.push(`${pairs.length} pair${pairs.length === 1 ? '' : 's'}: ${identical} identical, ${differ} differ or unreadable; ${onlyA.length} only in A, ${onlyB.length} only in B.`);
  return { lines, ok };
}

async function main() {
  const [dirA, dirB, diffDir] = process.argv.slice(2);
  if (!dirA || !dirB) {
    console.error('usage: node scripts/compare-screens.mjs <dirA> <dirB> [diffDir]');
    process.exit(2);
  }
  for (const dir of [dirA, dirB]) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      console.error(`compare-screens: ${dir} is not a folder.`);
      process.exit(2);
    }
  }
  const result = await compareFolders(dirA, dirB, diffDir || null);
  if (!result.pairs.length && !result.onlyA.length && !result.onlyB.length) {
    console.error(`compare-screens: no PNG files in ${dirA} or ${dirB}.`);
    process.exit(2);
  }
  console.log(`compare-screens: A = ${resolve(dirA)}`);
  console.log(`compare-screens: B = ${resolve(dirB)}`);
  const { lines, ok } = report(result);
  for (const line of lines) console.log(line);
  process.exit(ok ? 0 : 1);
}

if (isMain(import.meta.url)) await main();
