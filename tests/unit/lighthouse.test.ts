// scripts/lighthouse.mjs: with no pages given, it audits the pages this build has and names the
// rest. A build without Check has no /check, which Lighthouse would otherwise audit as the 404.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ALL, builtPages } from '../../scripts/lighthouse.mjs';

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
