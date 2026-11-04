// A place's Details rows (README:216): built at build time on each place page, and in the
// browser by the offline place shell, so both read the same.
import type { Place } from './core/facility.ts';
import { formatDate } from './format-date.ts';
import type { Lang } from './i18n.ts';

interface Labels {
  hoursLabel: string;
  hoursNotListed: string;
  phoneLabel: string;
  regionLabel: string;
  accrLabel: string;
}

export function placeDetails(p: Place, t: Labels, lang: Lang): { label: string; value: string }[] {
  return [
    { label: t.hoursLabel, value: p.hours || t.hoursNotListed },
    ...(p.phone ? [{ label: t.phoneLabel, value: p.phone }] : []),
    { label: t.regionLabel, value: p.region || p.code },
    ...(/^\d{4}-\d{2}-\d{2}$/.test(p.accr) ? [{ label: t.accrLabel, value: formatDate(p.accr, lang) }] : []),
  ];
}
