// The offline page (/offline, /fil/offline), which the service worker serves for a page that
// isn't saved yet. The words are the prototype's (sw.js, offlinePage). That one page carried
// both languages; here each language has its own, and the header and footer give the ways
// on (Find TB care, the 911 line).
import { ui, type Dict } from './types.ts';

const file = 'sw.js';

export const offline = {
  h1: ui("You're offline.", 'Wala kang koneksiyon.', file),
  lead: ui(
    "This page hasn't been saved on your phone yet. Open TB PH again when you have a signal.",
    'Hindi pa naka-save sa phone mo ang pahinang ito. Buksan ulit ang TB PH kapag may signal na.',
    file,
  ),
} satisfies Dict;
