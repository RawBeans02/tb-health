// scripts/check-dashes.mjs (V8, step 15.1): the build fails on an em dash in a page's text,
// <title>, meta description or og:* tags, in any of its spellings, and lists without failing
// those in island props, inline JSON, other attributes, scripts, styles and JSON files, the
// clinic data file among them. Synthetic pages only.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkDist, CLINIC_DATA, EM_DASH, jsonDashes, report, scanHtml } from '../../scripts/check-dashes.mjs';

const page = (head: string, body: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`;
const CLEAN = page(
  '<title>Learn about TB | TB PH</title><meta name="description" content="Testing and treatment are free."><meta property="og:title" content="Learn about TB | TB PH">',
  '<main><h1>Getting tested: it’s free</h1><p>Monthly figures for 2025–26 are provisional.</p><table><tr><td>2026</td><td>–</td></tr></table></main>',
);
const where = (html: string) => scanHtml(html).failed.map((f: { where: string }) => f.where);

describe('scanHtml: what fails', () => {
  it('passes a page with no em dash, en dashes for ranges and empty cells included', () => {
    const { failed, listed, counts } = scanHtml(CLEAN);
    expect(failed).toEqual([]);
    expect(listed).toEqual({});
    expect(counts).toEqual({ text: 4, tags: 3 });
  });

  it('fails an em dash in a text node, in each spelling', () => {
    // &#151; and &#x97; too: HTML maps them to an em dash, as windows-1252 does.
    for (const dash of ['—', '&mdash;', '&#8212;', '&#08212;', '&#x2014;', '&#X2014;', '&#x02014;', '&#8212 ', '&#151;', '&#0151;', '&#151 ', '&#x97;', '&#X97;', '&#x0097;']) {
      expect(where(page('<title>A | TB PH</title>', `<p>Open windows ${dash} TB germs build up.</p>`)), dash).toEqual(['text']);
    }
  });

  it('fails one in <title>, the meta description and any og:* tag, and in SVG text', () => {
    expect(where(page('<title>About — TB PH</title>', ''))).toEqual(['<title>']);
    expect(where(page('<meta name="description" content="Who makes TB PH — privacy">', ''))).toEqual(['<meta name="description">']);
    expect(where(page('<meta property="og:title" content="About &#8212; TB PH">', ''))).toEqual(['<meta property="og:title">']);
    expect(where(page('<meta property="og:description" content=\'Near you — step by step\'>', ''))).toEqual(['<meta property="og:description">']);
    expect(where(page('', '<svg><text x="0" y="10">2,000 a day — one a minute</text></svg>'))).toEqual(['text']);
  });

  it('reads text in <noscript>, <template> and <textarea>, and after a stray "<"', () => {
    expect(where(page('', '<noscript><p>A — B</p></noscript>'))).toEqual(['text']);
    expect(where(page('', '<template><p>A — B</p></template>'))).toEqual(['text']);
    expect(where(page('', '<textarea>A — B</textarea>'))).toEqual(['<textarea>']);
    expect(where(page('', '<p>1 < 2 — always</p>'))).toEqual(['text']);
  });

  it("doesn't count numbers that only start like the dash's code, a named reference HTML doesn't have, nor comments", () => {
    expect(where(page('', '<p>&#82120; &#x20145; &#1510; &#x97a; &MDASH;</p><!-- a comment — not shown -->'))).toEqual([]);
  });

  it('quotes where it found the dash', () => {
    const [found] = scanHtml(page('', '<p>That&#39;s about 2,000 people every day — more than one every minute.</p>')).failed;
    expect(found.excerpt).toContain('every day — more than one');
  });
});

describe('scanHtml: what it lists without failing', () => {
  it('island props, inline JSON, scripts, styles and other attributes', () => {
    const html = page(
      '<meta name="twitter:title" content="A — B"><style>.x::after { content: "—"; }</style><script type="application/json" id="tbph-i18n">{"safety":"get tested \\u2014 it is free"}</script><script>document.title = `${name} — TB PH`;</script>',
      '<astro-island uid="1" props="{&quot;t&quot;:[0,&quot;Government — free TB care&quot;]}" ssr></astro-island><button aria-label="Close — sheet">x</button><img alt="A — B" src="/a.png">',
    );
    const { failed, listed } = scanHtml(html);
    expect(failed).toEqual([]);
    expect(Object.keys(listed).sort()).toEqual(['attributes', 'json', 'props', 'scripts', 'styles']);
    expect(listed.attributes.map((a: { where: string }) => a.where)).toEqual(['<meta content>', '<button aria-label>', '<img alt>']);
    expect(listed.props[0].excerpt).toContain('Government — free TB care');
    expect(listed.json[0].excerpt).toContain('\\u2014');
  });
});

describe('jsonDashes', () => {
  it('names the path of each string with an em dash', () => {
    expect(jsonDashes(JSON.stringify({ meta: { title: 'TB — data' }, facilities: [{ name: 'A' }, { name: 'B — C' }] }))!.map((d) => d.where)).toEqual(['meta.title', 'facilities[1].name']);
    expect(jsonDashes('{"a":"2025–26"}')).toEqual([]);
    expect(jsonDashes('not json')).toBeNull();
  });
});

describe('checkDist and the script', () => {
  const dirs: string[] = [];
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));
  const dist = (files: Record<string, string>) => {
    const d = mkdtempSync(join(tmpdir(), 'tbph-dashes-'));
    dirs.push(d);
    for (const [name, text] of Object.entries(files)) {
      mkdirSync(join(d, name, '..'), { recursive: true });
      writeFileSync(join(d, name), text);
    }
    return d;
  };
  const clinics = (name: string) => JSON.stringify({ meta: { count: 1 }, facilities: [{ id: 'a', name }] });
  const run = (folder: string) => spawnSync(process.execPath, ['scripts/check-dashes.mjs', folder], { encoding: 'utf8' });

  it('fails a build with an em dash in a page, naming the file, and exits 1', () => {
    const d = dist({ 'index.html': CLEAN, 'fil/learn.html': page('<title>Alamin ang TB — TB PH</title>', ''), [CLINIC_DATA]: clinics('A') });
    const result = checkDist(d);
    expect(result.pages).toBe(2);
    expect(result.failed).toEqual([{ file: 'fil/learn.html', where: '<title>', excerpt: 'Alamin ang TB — TB PH' }]);
    const out = run(d);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('check-dashes: fil/learn.html: <title> "Alamin ang TB — TB PH"');
    expect(out.stderr).toContain('check-dashes: 1 em dash in page text, <title>, meta descriptions or og:* tags (V8).');
  });

  it('fails a place page that shows a clinic name with an em dash, though the clinic data file is only listed', () => {
    const name = 'Health Center — Annex';
    const d = dist({ 'place/a.html': page(`<title>${name} | TB PH</title><meta property="og:title" content="${name} | TB PH">`, `<h1 class="place-name">${name}</h1>`), [CLINIC_DATA]: clinics(name) });
    const result = checkDist(d);
    expect(result.failed.map((f: { where: string }) => f.where)).toEqual(['<title>', '<meta property="og:title">', 'text']);
    expect(result.listed.clinics.map((i: { where: string }) => i.where)).toEqual(['facilities[0].name']);
    expect(run(d).status).toBe(1);
  });

  it('lists the clinic data, other JSON, scripts and styles without failing, and says what it checked', () => {
    const d = dist({
      'index.html': CLEAN,
      [CLINIC_DATA]: clinics('Health Center — Annex'),
      'manifest.webmanifest': JSON.stringify({ name: 'TB PH — app' }),
      '_astro/app.js': 'const t = `TB in the Philippines \\u{2014} data pack`;',
      '_astro/app.css': '.x::before { content: "\\2014"; }',
    });
    const result = checkDist(d);
    expect(result.failed).toEqual([]);
    expect(result.listed.clinics).toEqual([{ file: CLINIC_DATA, where: 'facilities[0].name', excerpt: 'Health Center — Annex' }]);
    expect(result.listed.data.map((i: { file: string }) => i.file)).toEqual(['manifest.webmanifest']);
    expect(result.listed.scripts.map((i: { file: string }) => i.file)).toEqual(['_astro/app.js']);
    expect(result.listed.styles.map((i: { file: string }) => i.file)).toEqual(['_astro/app.css']);
    const out = run(d);
    expect(out.status).toBe(0);
    expect(out.stderr).toContain(`listed, not failed: 1 em dash in clinic data (${CLINIC_DATA}):`);
    expect(out.stdout).toBe(
      'check-dashes: 1 page checked: no em dash in the text (4 text nodes), <title>, meta description or og:* tags (3 tags). ' +
        'Also read, without failing: island props, inline JSON, other attributes, scripts, styles and JSON files, the clinic data among them (4 em dashes, listed above).\n',
    );
  });

  it('says so when nothing is listed either', () => {
    const { summary, notes, errors } = report(checkDist(dist({ 'index.html': CLEAN, [CLINIC_DATA]: clinics('A') })));
    expect(errors).toEqual([]);
    expect(notes).toEqual([]);
    expect(summary).toMatch(/\(no em dash\)\.$/);
  });

  it('exits 1 without a build folder', () => {
    expect(run(join(tmpdir(), 'tbph-no-such-dist-x1')).status).toBe(1);
  });

  it('runs in every build, right after check-links', () => {
    const { scripts } = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
    for (const name of ['build', 'build:sample', 'build:synthetic', 'build:worst-case']) {
      expect(scripts[name], name).toMatch(/&& node scripts\/check-links\.mjs && node scripts\/check-dashes\.mjs$/);
    }
  });

  it('finds the dash in the spellings a page can use, and not the en dash', () => {
    for (const text of ['—', '&mdash;', '&#8212;', '&#x2014;', '&#151;', '&#x97;']) expect(EM_DASH.test(text), text).toBe(true);
    // &#150; and &#x96; are the en dash's windows-1252 spellings.
    for (const text of ['–', '&ndash;', '&#8211;', '-', '&#x2013;', '&Mdash;', '&#150;', '&#x96;']) expect(EM_DASH.test(text), text).toBe(false);
  });
});
