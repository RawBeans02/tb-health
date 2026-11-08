// Phone numbers, ported from tbph-core.js (firstPhone, telHref). Since the launch review, empty
// entries are skipped, an L- extension is cut like loc, a leading 63 is the country code only at
// 11 or 12 digits, and a number that can't be dialled gets no tel: link (so no Call link; the
// number still shows under the place's Details).

/** The first number of a list such as "8123-4567 / 8765-4321", skipping empty entries ("/0917…"). */
export function firstPhone(phone: unknown): string {
  for (const part of String(phone ?? '').split(/\s*(?:\/|;|,|\bto\b)\s*/i)) if (part.trim()) return part.trim();
  return '';
}

/**
 * A tel: link with the +63 country code, or '' when the digits can't be a Philippine number.
 * An extension is left out: loc (also loc. and local), or L- at the start of a word (not TEL-).
 * - 09…: a mobile, 11 digits. Any other 0…: area code and landline, 10 digits.
 * - 63…: the country code only at 11 or 12 digits; at 7 or 8 it's a local number, as below.
 * - NCR's 8-digit landlines get the 2 area code (README:289), whatever their first digit (Metro
 *   Manila numbers now start 2 to 8); digits after the eighth are left out.
 * - Other local numbers, 7 or 8 digits, are dialled as listed. Any other length: no link.
 */
export function telHref(phone: string, regionCode?: string): string {
  const digits = (phone ?? '').split(/loc|\bl-/i)[0].replace(/\D/g, '');
  const n = digits.length;
  if (digits.startsWith('09')) return n === 11 ? `tel:+63${digits.slice(1)}` : '';
  if (digits.startsWith('0')) return n === 10 ? `tel:+63${digits.slice(1)}` : '';
  if (digits.startsWith('63') && n > 8) return n === 11 || n === 12 ? `tel:+${digits}` : '';
  if (regionCode === 'NCR' && n >= 8) return `tel:+632${digits.slice(0, 8)}`;
  return n === 7 || n === 8 ? `tel:${digits}` : '';
}
