// scripts/test-port.mjs: each checkout serves the browser tests on its own port, so a server a
// stopped run left behind (and later runs reuse) is always this checkout's; TBPH_TEST_PORT sets it.
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { portFor, testPort } from '../../scripts/test-port.mjs';

describe('testPort', () => {
  const dirs: string[] = [];
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

  it('gives each checkout path its own port, the same every time, in 43000–43999 (not 4322)', () => {
    const one = portFor('/Users/someone/Documents/tb-health');
    const two = portFor('/Users/someone/Documents/tb-health-launch');
    expect(portFor('/Users/someone/Documents/tb-health')).toBe(one);
    expect(two).not.toBe(one);
    for (const port of [one, two]) expect(port >= 43000 && port <= 43999, String(port)).toBe(true);
  });

  it('is this checkout’s by default, from its real path (a symlink to it gets the same port)', () => {
    expect(testPort(undefined, {})).toBe(portFor(realpathSync(process.cwd())));
    const dir = mkdtempSync(join(tmpdir(), 'tbph-port-'));
    dirs.push(dir);
    symlinkSync(dir, join(dir, 'link'));
    expect(testPort(join(dir, 'link'), {})).toBe(testPort(dir, {}));
  });

  it('takes TBPH_TEST_PORT instead, and refuses one that is no usable port', () => {
    expect(testPort(undefined, { TBPH_TEST_PORT: '45000' })).toBe(45000);
    expect(testPort(undefined, { TBPH_TEST_PORT: '' })).toBe(testPort(undefined, {}));
    for (const bad of ['abc', '80', '70000', '4.5', '-1']) expect(() => testPort(undefined, { TBPH_TEST_PORT: bad }), bad).toThrow(/TBPH_TEST_PORT/);
  });
});
