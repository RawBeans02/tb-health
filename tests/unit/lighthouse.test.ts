// scripts/lighthouse.mjs: with no pages given, it audits the pages this build has and names the
// rest. A build without Check has no /check, which Lighthouse would otherwise audit as the 404.
// Then the colour scheme (step 15.7): the launch switch, the report names, and reading the
// scheme back from a screenshot.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ALL, PLAYWRIGHT_BLINK_SETTINGS, builtPages, reportName, schemeArg, schemeOf } from '../../scripts/lighthouse.mjs';

describe('lighthouse: the default pages', () => {
  const dist = mkdtempSync(join(tmpdir(), 'tbph-lighthouse-'));
  afterAll(() => rmSync(dist, { recursive: true, force: true }));
  const write = (file: string) => {
    mkdirSync(dirname(join(dist, file)), { recursive: true });
    writeFileSync(join(dist, file), '');
  };

  it('are the ones dist/ has a file for: without check.html, all but /check', () => {
    for (const file of ['index.html', 'places.html', 'place/bangued-rural-health-unit-abra.html', 'learn.html', 'data.html', 'about.html', 'install.html', 'fil.html', 'fil/places.html', '404.html']) write(file);
    expect(builtPages(dist)).toEqual({ pages: ALL.filter((page) => page !== '/check'), skipped: ['/check'] });
    write('check.html');
    expect(builtPages(dist)).toEqual({ pages: ALL, skipped: [] });
  });

  it('are none when nothing was built', () => {
    expect(builtPages(join(dist, 'missing'))).toEqual({ pages: [], skipped: ALL });
  });
});

describe('lighthouse: the colour scheme', () => {
  it('launches the browser preferring dark with --dark, and light without it, never the system appearance', () => {
    expect(schemeArg(true)).toBe(`--blink-settings=${PLAYWRIGHT_BLINK_SETTINGS},preferredColorScheme=0`);
    expect(schemeArg(false)).toBe(`--blink-settings=${PLAYWRIGHT_BLINK_SETTINGS},preferredColorScheme=1`);
  });

  it("keeps Playwright's own headless Blink settings, which the switch replaces", () => {
    // Every --blink-settings Playwright's launcher passes, wherever its bundle keeps them.
    const lib = join('node_modules', 'playwright-core', 'lib');
    const found = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith('.js')) for (const m of readFileSync(path, 'utf8').matchAll(/"--blink-settings=([^"]*)"/g)) found.add(m[1]);
      }
    };
    walk(lib);
    expect([...found]).toEqual([PLAYWRIGHT_BLINK_SETTINGS]);
  });

  it('names each report by page, then .desktop and .dark', () => {
    expect(reportName('/')).toBe('home.json');
    expect(reportName('/fil/places', { dark: true })).toBe('fil_places.dark.json');
    expect(reportName('/place/bangued-rural-health-unit-abra', { desktop: true, dark: true })).toBe('place_bangued-rural-health-unit-abra.desktop.dark.json');
    expect(reportName('/about', { desktop: true })).toBe('about.desktop.json');
  });

  it("reads the scheme from a screenshot's mean luminance, and neither in between", () => {
    // The probe's final screenshots of /about on 12 Nov 2026: 232 light, 40 dark.
    expect([schemeOf(232), schemeOf(160), schemeOf(40), schemeOf(100)]).toEqual(['light', 'light', 'dark', 'dark']);
    expect([schemeOf(101), schemeOf(130), schemeOf(159)]).toEqual([null, null, null]);
  });
});
