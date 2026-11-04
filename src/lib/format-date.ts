// "30 October 2026" / "30 Oktubre 2026", the prototype's format in both languages. No data
// imports, so islands can use it.
import type { Lang } from './i18n.ts';

export function formatDate(iso: string, lang: Lang): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const monthName = new Intl.DateTimeFormat(lang === 'fil' ? 'fil' : 'en', { month: 'long', timeZone: 'UTC' }).format(date);
  return `${day} ${monthName} ${year}`;
}

/** Today in the visitor's own time zone, as yyyy-mm-dd. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
