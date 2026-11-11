// Phone numbers, ported from tbph-core.js (firstPhone, telHref). Since the launch review, empty
// entries are skipped, an L- extension is cut like loc, a leading 63 is the country code only at
// 11 or 12 digits, a number that can't be dialled gets no tel: link, and the Call link dials the
// first number on the list that any phone can (the whole list still shows under Details).

/** The numbers of a list such as "8123-4567 / 8765-4321", without empty entries ("/0917…"). */
export function phoneParts(phone: unknown): string[] {
  return String(phone ?? '')
    .split(/\s*(?:\/|;|,|\bto\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * A phone field as listed, cut into chunks of one number and the separator after it ("075-6327543/"),
 * with the space that follows, if any, as the chunk's gap: joined again they give the field back.
 * Place pages keep each chunk on one line, so lines break between numbers and never start with a
 * separator (step 15.4).
 */
export function phoneChunks(phone: string): { text: string; gap: string }[] {
  const parts = phone.split(/(\s*(?:\/|;|,|\bto\b)\s*)/i); // numbers at even places, separators between
  const chunks: { text: string; gap: string }[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const separator = parts[i + 1] ?? '';
    const kept = separator.replace(/\s+$/, '');
    if (parts[i] || separator) chunks.push({ text: parts[i] + kept, gap: separator.slice(kept.length) });
  }
  return chunks;
}

/** The first number of a list such as "8123-4567 / 8765-4321", skipping empty entries ("/0917…"). */
export function firstPhone(phone: unknown): string {
  return phoneParts(phone)[0] ?? '';
}

/**
 * The number the Call link dials, with its tel: link: the first on the list that any phone can
 * dial (a mobile, or a landline with its area code: +63), else the first local number (7 or 8
 * digits, which only a landline in its area can dial), else the first number and no link.
 */
export function callNumber(phone: unknown, regionCode?: string): { first: string; tel: string } {
  let local: { first: string; tel: string } | null = null;
  for (const part of phoneParts(phone)) {
    const tel = telHref(part, regionCode);
    if (tel.startsWith('tel:+')) return { first: part, tel };
    if (tel && !local) local = { first: part, tel };
  }
  return local ?? { first: firstPhone(phone), tel: '' };
}

/**
 * A tel: link with the +63 country code, or '' when the digits can't be a Philippine number.
 * An extension is left out: loc (also loc. and local), or L- at the start of a word (not TEL-).
 * - 09…: a mobile, 11 digits. Any other 0…: area code and landline, 10 digits, or 11 for a
 *   provincial area code with an 8-digit landline (Metro Manila's 02 has 8, so 10 in all).
 * - 63…: the country code only at 11 or 12 digits; at 7 or 8 it's a local number, as below.
 * - NCR's 8-digit landlines get the 2 area code (README:289), whatever their first digit (Metro
 *   Manila numbers now start 2 to 8); digits after the eighth are left out.
 * - Other local numbers, 7 or 8 digits, are dialled as listed. Any other length: no link.
 */
export function telHref(phone: string, regionCode?: string): string {
  const digits = (phone ?? '').split(/loc|\bl-/i)[0].replace(/\D/g, '');
  const n = digits.length;
  if (digits.startsWith('09')) return n === 11 ? `tel:+63${digits.slice(1)}` : '';
  if (digits.startsWith('0')) return n === 10 || (n === 11 && !digits.startsWith('02')) ? `tel:+63${digits.slice(1)}` : '';
  if (digits.startsWith('63') && n > 8) return n === 11 || n === 12 ? `tel:+${digits}` : '';
  if (regionCode === 'NCR' && n >= 8) return `tel:+632${digits.slice(0, 8)}`;
  return n === 7 || n === 8 ? `tel:${digits}` : '';
}
