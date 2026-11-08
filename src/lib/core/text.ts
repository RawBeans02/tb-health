// Text helpers, ported from tbph-core.js (norm, tc).

/** Lower case, accents and punctuation removed, single spaces: for matching only. */
export function norm(text: unknown): string {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const SMALL = new Set(['and', 'of', 'the', 'for', 'ng', 'sa', 'at', 'to', 'in', 'on', 'or', 'de', 'del', 'dela']);
const ACRONYMS = new Set([
  'TB', 'DOTS', 'IDOTS', 'RHU', 'PPMD', 'LCP', 'NCPR', 'EDSA', 'QI', 'BF', 'RITM', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII',
  'XIII', 'NCR', 'CAR', 'PGH', 'OPD', 'HIV', 'LGU', 'C3', 'DOH', 'UP', 'UST', 'UERM', 'FEU', 'BGHMC', 'MMC',
]);
const SEPARATOR = /^(\s+|\/|-|\(|\))$/;

/** Title case for the PhilHealth list's capitals: "BANGUED RURAL HEALTH UNIT" → "Bangued Rural Health Unit". */
export function titleCase(text: unknown): string {
  let first = true;
  return String(text ?? '')
    .split(/(\s+|\/|-|\(|\))/)
    .map((token) => {
      if (!token || SEPARATOR.test(token)) return token;
      if (/^([A-Za-z]\.){1,3}$/.test(token)) {
        first = false;
        return token.toUpperCase();
      }
      const core = token.replace(/[.,;:]+$/, '');
      const trail = token.slice(core.length);
      const upper = core.toUpperCase();
      let out: string;
      if (ACRONYMS.has(upper)) out = upper;
      else if (/^\d/.test(core)) out = core.replace(/^(\d+)(ST|ND|RD|TH)$/i, (_, digits: string, suffix: string) => digits + suffix.toLowerCase());
      else if (!first && SMALL.has(core.toLowerCase())) out = core.toLowerCase();
      else out = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
      first = false;
      return out + trail;
    })
    .join('');
}

/**
 * Whether normalised `key` contains normalised search text `t`. Two letters match only the
 * start of a word, so "ab" finds Abra but not Malabon (owner decision, 4 Nov 2026); longer
 * text matches anywhere.
 */
export function contains(key: string, t: string): boolean {
  return t.length > 2 ? key.includes(t) : ` ${key}`.includes(` ${t}`);
}

/** A region or the country at the end of typed place text: "Pasig, Metro Manila" is Pasig. */
const AREA = /(?: (?:metro manila|ncr|philippines|pilipinas|ph))+$/;

/** Typed place text, normalised, without a region or the country at the end. */
export function placeText(text: unknown): string {
  return norm(text).replace(AREA, '');
}
