// scripts/check-node.mjs (audit B85, B87): an older Node stops with the floor named; 22.23.4
// and later pass. The script has no imports, so it runs here in a sandbox with a stand-in
// process object.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync('scripts/check-node.mjs', 'utf8');
function run(node: string) {
  const out = { code: null as number | null, message: '' };
  runInNewContext(source, {
    process: { versions: { node }, exit: (code: number) => (out.code = code) },
    console: { error: (text: string) => (out.message = text) },
  });
  return out;
}

describe('check-node', () => {
  it('stops an older Node, naming the floor and the fix', () => {
    for (const node of ['16.20.2', '20.18.0', '22.18.0', '22.23.3']) {
      expect(run(node), node).toEqual({ code: 1, message: `TB Health needs Node 22.23.4 or later (see .nvmrc): run nvm use. This is Node ${node}.` });
    }
  });

  it('lets 22.23.4 and later through', () => {
    for (const node of ['22.23.4', '22.24.0', '23.11.0', '24.1.0']) expect(run(node), node).toEqual({ code: null, message: '' });
  });
});
