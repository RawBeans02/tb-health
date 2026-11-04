// Phone numbers, ported from tbph-core.js (firstPhone, telHref).

/** The first number of a list such as "8123-4567 / 8765-4321". */
export function firstPhone(phone: unknown): string {
  return String(phone ?? '').split(/\s*(?:\/|;|,|\bto\b)\s*/i)[0].trim();
}

/** A tel: link with the +63 country code. NCR's 8-digit landlines get the 2 area code
    (README:289), whatever their first digit (Metro Manila numbers now start 2 to 8). */
export function telHref(phone: string, regionCode?: string): string {
  if (!phone) return '';
  const digits = phone.split(/\s*loc\.?\s*/i)[0].replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('63')) return `tel:+${digits}`;
  if (digits.startsWith('0')) return `tel:+63${digits.slice(1)}`;
  if (regionCode === 'NCR' && digits.length >= 8) return `tel:+632${digits.slice(0, 8)}`;
  return `tel:${digits}`;
}
