// Copy parity (PLAN §4.3): every string matches the source it names, word for word, so
// medical and UI copy can't drift during the port.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Str } from '../../src/content/types.ts';
import { LANGS } from '../../src/lib/i18n.ts';

const design = 'design/design_handoff_tb_ph';
const packLines = readFileSync(`${design}/reference/content-and-data-pack.md`, 'utf8').split('\n');
const readmeLines = readFileSync(`${design}/README.md`, 'utf8').split('\n');
const overridesDoc = readFileSync('docs/copy-overrides.md', 'utf8');

// Prototype strings sit in JS literals or markup; undo the escaping before comparing.
const prototype = (file: string) =>
  readFileSync(`${design}/prototype/${file}`, 'utf8')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function isStr(value: unknown): value is Str {
  return !!value && typeof value === 'object' && 'en' in value && 'fil' in value && 'src' in value;
}

const modules = import.meta.glob<Record<string, Record<string, unknown>>>(['../../src/content/*.ts', '!**/types.ts'], { eager: true });
const entries: { id: string; str: Str }[] = [];
for (const module of Object.values(modules)) {
  for (const [dictName, dict] of Object.entries(module)) {
    for (const [key, str] of Object.entries(dict)) if (isStr(str)) entries.push({ id: `${dictName}.${key}`, str });
  }
}

describe('copy dictionaries', () => {
  it('found the dictionaries', () => {
    expect(entries.length).toBeGreaterThan(20);
  });

  for (const { id, str } of entries) {
    describe(id, () => {
      LANGS.forEach((lang, i) => {
        const ref = str.src[i];
        const text = str[lang];

        it(`${lang} matches ${ref}`, () => {
          if (ref === 'owner') {
            expect(str.origin).toBe('owner');
            return;
          }
          expect(text.trim(), 'empty string').not.toBe('');
          if (ref === 'derived') {
            expect(str.note, 'derived strings say how they were built').toBeTruthy();
            return;
          }
          const [kind, where] = ref.split(/:(.*)/);
          const source =
            kind === 'pack' ? packLines[Number(where) - 1] : kind === 'readme' ? readmeLines[Number(where) - 1] : prototype(where);
          expect(source, `${ref} not found`).toBeDefined();
          if (/\{(?!date\})\w+\}/.test(text)) {
            // A template the prototype builds in code ('Hours: ' + h): each literal piece must be there.
            for (const piece of text.split(/\{\w+\}/).map((p) => p.trim()).filter(Boolean)) expect(source).toContain(piece);
            return;
          }
          // {date} follows the data files, so any "30 October 2026"-style date matches it.
          const pattern = text.split('{date}').map(escape).join(String.raw`\d{1,2} \p{L}+ \d{4}`);
          expect(source).toMatch(new RegExp(pattern, 'u'));
        });
      });

      it('has the origin its sources imply', () => {
        if (str.origin === 'pack') expect(str.src.every((r) => r.startsWith('pack:'))).toBe(true);
        if (str.origin === 'override') {
          expect(str.note, 'overrides name the pack line they replace').toMatch(/[Pp]ack :\d+/);
          expect(overridesDoc, 'every override is listed for the owner').toContain(id);
        }
        if (str.origin === 'ui' && str.src[1] !== 'owner') expect(str.flags).toContain('FIL-REVIEW');
      });
    });
  }
});

describe('dictionaries an island merges', () => {
  // Home's island gets home + care; Places gets home + care + places; Place gets care +
  // place + the nav. A shared key would let one page's string silently replace another's.
  it('share no keys', async () => {
    const { home } = await import('../../src/content/home.ts');
    const { care } = await import('../../src/content/care.ts');
    const { places } = await import('../../src/content/places.ts');
    const { place } = await import('../../src/content/place.ts');
    const { chrome } = await import('../../src/content/chrome.ts');
    const sets = [Object.keys(home), Object.keys(care), Object.keys(places), Object.keys(place), ['nav_home']];
    expect(Object.keys(chrome)).toContain('nav_home');
    const seen = new Map<string, number>();
    sets.forEach((keys, i) => {
      for (const k of keys) {
        expect(seen.has(k), `${k} is in two dictionaries`).toBe(false);
        seen.set(k, i);
      }
    });
  });
});
