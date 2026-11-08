// Check's pages (Q9, review 8 Nov 2026): astro.config.mjs adds /check and /fil/check only when
// the build has Check, reading TBPH_CHECK as astro:env reads it for the pages, and nothing in
// src/pages leads to Check's island or stylesheet, which Astro would bundle into every build.
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AstroIntegration } from 'astro';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

type Setup = NonNullable<AstroIntegration['hooks']['astro:config:setup']>;

const integration = config.integrations?.flat().find((i): i is AstroIntegration => !!i && i.name === 'tbph-check-pages');
const saved = process.env.TBPH_CHECK;
const dirs: string[] = [];

afterEach(() => {
  if (saved === undefined) delete process.env.TBPH_CHECK;
  else process.env.TBPH_CHECK = saved;
});
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** The routes the config adds for TBPH_CHECK in the environment (undefined: unset) and an optional .env file. */
function routes(value: string | undefined, dotEnv?: string): string[] {
  if (value === undefined) delete process.env.TBPH_CHECK;
  else process.env.TBPH_CHECK = value;
  const root = mkdtempSync(join(tmpdir(), 'tbph-env-'));
  dirs.push(root);
  if (dotEnv !== undefined) writeFileSync(join(root, '.env'), dotEnv);
  const added: string[] = [];
  const setup = integration?.hooks['astro:config:setup'] as Setup;
  const injectRoute = (route: { pattern: string; entrypoint: string | URL }) => added.push(`${route.pattern} ${route.entrypoint}`);
  setup({ config: { root: pathToFileURL(`${root}/`), vite: {} }, command: 'build', injectRoute } as unknown as Parameters<Setup>[0]);
  return added;
}

const BOTH = ['/check ./src/check-pages/check.astro', '/fil/check ./src/check-pages/fil/check.astro'];

describe("Check's pages (Q9)", () => {
  it("are added unless TBPH_CHECK is false; unset or empty is the schema's default, true", () => {
    expect(routes(undefined)).toEqual(BOTH);
    expect(routes('')).toEqual(BOTH);
    expect(routes('true')).toEqual(BOTH);
    expect(routes('false')).toEqual([]);
  });

  it('follow a .env file as astro:env does, with the environment first', () => {
    expect(routes(undefined, 'TBPH_CHECK=false\n')).toEqual([]);
    expect(routes('true', 'TBPH_CHECK=false\n')).toEqual(BOTH);
  });

  it('refuse any other value, as astro:env does', () => {
    for (const value of ['False', '0', 'no', 'off']) expect(() => routes(value), value).toThrow(/must be true or false/);
  });

  it("are the only way in to Check's island and stylesheet", () => {
    const files = (readdirSync('src', { recursive: true }) as string[]).filter((f) => /\.(astro|tsx?)$/.test(f));
    const importing = (pattern: RegExp) => files.filter((f) => pattern.test(readFileSync(join('src', f), 'utf8'))).sort();
    expect(importing(/\/islands\/CheckFlow\.tsx'|\/styles\/check\.css'/)).toEqual(['views/Check.astro']);
    expect(importing(/\/views\/Check\.astro'/)).toEqual(['check-pages/check.astro', 'check-pages/fil/check.astro']);
  });
});
