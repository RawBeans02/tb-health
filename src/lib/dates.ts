// Dates shown on the site ("Last updated …") come from the data files' meta, not typed
// into copy (PLAN §4.3).
import claims from '../../data/claims.json' with { type: 'json' };
import stats from '../../data/tb-ph-data.json' with { type: 'json' };

/** The newest of the data files' `generated` dates (ISO yyyy-mm-dd). */
export const LAST_UPDATED: string = [stats.meta.generated, claims.meta.generated].sort().at(-1)!;

export { formatDate } from './format-date.ts';
