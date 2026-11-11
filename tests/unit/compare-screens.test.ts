// scripts/compare-screens.mjs (step 15.2): two folders of screenshots compared pixel by pixel,
// on tiny generated PNGs (an equal pair, then a different one), and its PNG reader on a file
// another encoder wrote.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { decodePng, encodePng } from '../../scripts/compare-screens.mjs';

/** A width x height image in one RGBA colour, with some pixels set to others. */
function image(width: number, height: number, rgba: number[], set: [x: number, y: number, rgba: number[]][] = []) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set(rgba, i * 4);
  for (const [x, y, c] of set) data.set(c, (y * width + x) * 4);
  return { width, height, data };
}
const CANVAS = [241, 243, 244, 255]; // #F1F3F4
const RED = [255, 0, 0, 255];

// 6x6 RGB, written by libpng 1.6 through sharp (libvips) with adaptive filtering: its rows
// use the Sub, Up, Average, Paeth, Up and Up filters, as Chromium's screenshots mix them.
// RGB is the pixels it was made from.
const LIBPNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAYAAAAGCAIAAABvrngfAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAANElEQVQI12PkMopiRwVMDBiAGVOIxdDI2AcG3O18fHx8mLi5uSUkJFRVVY2MjOzt7bELAQC9jwwj0ejA/AAAAABJRU5ErkJggg==';
const RGB =
  '0a325a1139611840681f476f264e762d557d0a325a1139611840681f476f264e762d557d05192d0b2947113457183d631f456c264d74364b608297accee3f81a2f44667b90b2c7dc41566b9aafc4f3081d4c6176a5bacffe13284c6176b2c7dc182d427e93a8e4f90e4a5f74';

const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** A temporary folder holding these files (paths relative to it). */
function folder(files: Record<string, Buffer | string>) {
  const dir = mkdtempSync(join(tmpdir(), 'tbph-screens-'));
  dirs.push(dir);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}
const run = (...args: string[]) => spawnSync(process.execPath, ['scripts/compare-screens.mjs', ...args], { encoding: 'utf8' });

describe('compare-screens', () => {
  it('passes an equal pair, and the same pixels saved two ways (exit 0)', () => {
    const png = encodePng(image(4, 3, CANVAS));
    const libpng = Buffer.from(LIBPNG, 'base64');
    // The libpng file (RGB, filtered) against our RGBA copy of what it holds: other bytes, same pixels.
    const a = folder({ 'light/en-home-390.png': png, 'light/fil-home-390.png': libpng });
    const b = folder({ 'light/en-home-390.png': Buffer.from(png), 'light/fil-home-390.png': encodePng(decodePng(libpng)) });
    expect(encodePng(decodePng(libpng)).equals(libpng)).toBe(false);
    const out = run(a, b);
    expect(out.stdout).toContain('light/en-home-390.png: identical\n');
    expect(out.stdout).toContain('light/fil-home-390.png: identical\n');
    expect(out.stdout).toContain('2 pairs: 2 identical, 0 differ or unreadable; 0 only in A, 0 only in B.');
    expect(out.status).toBe(0);
  });

  it('counts the differing pixels, gives their box and writes a diff image (exit 1)', () => {
    const a = folder({ 'light/en-data-1280.png': encodePng(image(5, 4, CANVAS)) });
    const b = folder({ 'light/en-data-1280.png': encodePng(image(5, 4, CANVAS, [[1, 1, [14, 20, 23, 255]], [3, 2, [241, 243, 245, 255]]])) });
    const diffs = join(a, 'diff'); // inside A: left out of what is compared
    for (let i = 0; i < 2; i++) {
      const out = run(a, b, diffs);
      expect(out.stdout).toContain(`light/en-data-1280.png: 2 pixels differ, box x 1..3, y 1..2 (3x2); diff ${join(diffs, 'light/en-data-1280.png')}\n`);
      expect(out.stdout).toContain('1 pair: 0 identical, 1 differ or unreadable; 0 only in A, 0 only in B.');
      expect(out.status).toBe(1);
    }
    const diff = decodePng(readFileSync(join(diffs, 'light/en-data-1280.png')));
    expect([diff.width, diff.height]).toEqual([5, 4]);
    const at = (x: number, y: number) => [...diff.data.subarray((y * 5 + x) * 4, (y * 5 + x) * 4 + 4)];
    expect(at(1, 1)).toEqual(RED);
    expect(at(3, 2)).toEqual(RED);
    expect(at(0, 0)).toEqual([253, 253, 253, 255]); // A's #F1F3F4, faded to grey
  });

  it('reads a page row by row across zlib output chunks (256 KB), a row split between two', () => {
    // 300x400 RGBA is 480 KB of rows: row 218 straddles the first chunk's end.
    const shade = (x: number, y: number) => [x % 251, y % 241, (x * y) % 239, 255];
    const tall = (set: [x: number, y: number, rgba: number[]][]) => {
      const img = image(300, 400, CANVAS);
      for (let y = 0; y < 400; y++) for (let x = 0; x < 300; x++) img.data.set(shade(x, y), (y * 300 + x) * 4);
      for (const [x, y, c] of set) img.data.set(c, (y * 300 + x) * 4);
      return encodePng(img);
    };
    const a = folder({ 'tall.png': tall([]) });
    const b = folder({ 'tall.png': tall([[0, 218, RED], [299, 399, RED]]) });
    const out = run(a, b);
    expect(out.stdout).toContain('tall.png: 2 pixels differ, box x 0..299, y 218..399 (300x182)\n');
    expect(out.status).toBe(1);
  });

  it('counts where only one image reaches as differing, when the sizes differ', () => {
    const a = folder({ 'x.png': encodePng(image(4, 3, CANVAS)) });
    const b = folder({ 'x.png': encodePng(image(4, 5, CANVAS)) });
    const out = run(a, b);
    expect(out.stdout).toContain('x.png: size 4x3 vs 4x5, 8 pixels differ, box x 0..3, y 3..4 (4x2)\n');
    expect(out.status).toBe(1);
  });

  it('lists the files only one folder has, and a file it cannot read (exit 1)', () => {
    const png = encodePng(image(2, 2, CANVAS));
    const a = folder({ 'only-a.png': png, 'both.png': png, 'bad.png': png });
    const b = folder({ 'only-b.png': png, 'both.png': png, 'bad.png': 'not a png', 'notes.txt': 'not compared' });
    const out = run(a, b);
    expect(out.stdout).toContain('bad.png: unreadable (not a PNG file)\n');
    expect(out.stdout).toContain('both.png: identical\n');
    expect(out.stdout).toContain('only-a.png: only in A\n');
    expect(out.stdout).toContain('only-b.png: only in B\n');
    expect(out.stdout).toContain('2 pairs: 1 identical, 1 differ or unreadable; 1 only in A, 1 only in B.');
    expect(out.status).toBe(1);
  });

  it('exits 2 without two folders, or with no PNG in them', () => {
    expect(run().status).toBe(2);
    expect(run(folder({}), join(tmpdir(), 'tbph-no-such-folder-x1')).status).toBe(2);
    const empty = run(folder({ 'a.txt': 'x' }), folder({}));
    expect(empty.stderr).toContain('no PNG files');
    expect(empty.status).toBe(2);
  });
});

describe('decodePng', () => {
  it('reads a PNG another encoder wrote, with all four row filters, as RGBA', () => {
    const rgb = Buffer.from(RGB, 'hex');
    const rgba = new Uint8Array(36 * 4);
    for (let i = 0; i < 36; i++) rgba.set([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], 255], i * 4);
    const img = decodePng(Buffer.from(LIBPNG, 'base64'));
    expect([img.width, img.height]).toEqual([6, 6]);
    expect([...img.data]).toEqual([...rgba]);
  });

  it('reads back what encodePng writes, transparency included', () => {
    const img = image(3, 2, [10, 20, 30, 0], [[2, 1, [200, 100, 50, 128]]]);
    expect(decodePng(encodePng(img))).toEqual(img);
  });

  it('refuses what it cannot read', () => {
    expect(() => decodePng(Buffer.from('not a png'))).toThrow(/not a PNG/);
    const sixteenBit = encodePng(image(1, 1, CANVAS));
    sixteenBit[24] = 16; // IHDR bit depth (its CRC is not checked)
    expect(() => decodePng(sixteenBit)).toThrow(/8-bit only/);
  });
});
