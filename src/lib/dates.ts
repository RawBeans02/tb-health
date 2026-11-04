// Dates shown on the site ("Last updated …") come from the data files' meta, not typed
// into copy (PLAN §4.3).
import claims from '../../data/claims.json' with { type: 'json' };
import stats from '../../data/tb-ph-data.json' with { type: 'json' };
import type { Lang } from './i18n.ts';

/** The newest of the data files' `generated` dates (ISO yyyy-mm-dd). */
export const LAST_UPDATED: string = [stats.meta.generated, claims.meta.generated].sort().at(-1)!;

/** "30 October 2026" / "30 Oktubre 2026", the prototype's format in both languages. */
export function formatDate(iso: string, lang: Lang): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const monthName = new Intl.DateTimeFormat(lang === 'fil' ? 'fil' : 'en', { month: 'long', timeZone: 'UTC' }).format(date);
  return `${day} ${monthName} ${year}`;
}
