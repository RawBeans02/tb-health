// Copy dictionaries (PLAN §4.3). Every visible string carries both languages, where each
// came from, and its open flags. The builder writes no copy: tests/unit/parity.test.ts
// checks each string against the source it names, and scripts/launch-check.mjs lists
// what is still open.
import type { Lang } from '../lib/i18n.ts';

export type Flag =
  | 'REVIEW' //      needs a clinician's check
  | 'VERIFY' //      needs a fact check
  | 'PLACEHOLDER' // stands in for something not decided yet
  | 'FIL-REVIEW'; // Filipino not from the pack: for the native-speaker review (D10)

export type Origin =
  | 'pack' //     the content pack, verbatim
  | 'ui' //       the prototype (or README), where the pack has nothing
  | 'override' // README wording that differs from the pack (listed in docs/copy-overrides.md)
  | 'decision' // the owner's own wording, quoted in docs/decisions.md (also listed in copy-overrides.md)
  | 'owner'; //   still to come from the owner; blocks launch

/**
 * Where one language's text comes from:
 *   pack:N    line N of design/…/reference/content-and-data-pack.md
 *   readme:N  line N of design/…/README.md
 *   proto:F   prototype file F
 *   decision:ID  decision ID in docs/decisions.md ("### V4. …"), which quotes the owner's wording
 *   derived   built mechanically from other strings, as the note says (checked by hand)
 *   owner     not supplied yet
 */
export type Ref = `pack:${number}` | `readme:${number}` | `proto:${string}` | `decision:${string}` | 'derived' | 'owner';

export interface Str {
  en: string;
  /** Empty only while the owner hasn't supplied it (src[1] === 'owner'). */
  fil: string;
  origin: Origin;
  src: readonly [en: Ref, fil: Ref];
  flags?: readonly Flag[];
  note?: string;
}

export type Dict = Record<string, Str>;

/** A string that appears verbatim on pack line `enLine` (EN) and `filLine` (FIL). */
export function pack(en: string, fil: string, enLine: number, filLine = enLine, flags: Flag[] = []): Str {
  return { en, fil, origin: 'pack', src: [`pack:${enLine}`, `pack:${filLine}`], flags };
}

/** A prototype string. Its Filipino is not from the pack, so it is flagged for review (D10). */
export function ui(en: string, fil: string, file: string, flags: Flag[] = []): Str {
  return { en, fil, origin: 'ui', src: [`proto:${file}`, `proto:${file}`], flags: ['FIL-REVIEW', ...flags] };
}

/** Text for one language: `{ key: string }`. */
export function pick<D extends Dict>(dict: D, lang: Lang): { [K in keyof D]: string } {
  return Object.fromEntries(Object.entries(dict).map(([key, str]) => [key, str[lang]])) as { [K in keyof D]: string };
}

/** Fills `{name}` placeholders. */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}
