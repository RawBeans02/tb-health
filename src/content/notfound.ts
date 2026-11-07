// 404 and /fil/404 (README:247, 404.dc.html). The buttons reuse the nav labels.
import { ui, type Dict } from './types.ts';

export const notFound = {
  h1: ui("We can't find that page.", 'Hindi namin mahanap ang pahinang iyon.', '404.dc.html'),
  lead: ui('The link may be old or mistyped. These will get you back on track:', 'Maaaring luma o mali ang link. Makatutulong ang mga ito:', '404.dc.html'),
  // Q9, C8: without Check one button is left, so "These" would point at a single button.
  leadNoCheck: {
    en: '',
    fil: '',
    origin: 'owner',
    src: ['owner', 'owner'],
    note:
      'Q9, C8: notFound.lead for a build without Check, above its single button. The owner approves the wording.',
  },
} satisfies Dict;
