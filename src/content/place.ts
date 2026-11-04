// Place: the shareable place page (README:213–220, Place.dc.html). Actions, chips and
// footnotes are in care.ts.
import { pack, ui, type Dict } from './types.ts';

const file = 'Place.dc.html';

export const place = {
  missing: ui("This place isn't on the list.", 'Wala sa listahan ang lugar na ito.', file),
  services: ui('Services', 'Mga serbisyo', file),
  details: ui('Details', 'Mga detalye', file),
  hoursLabel: ui('Hours', 'Oras', file),
  phoneLabel: ui('Phone', 'Telepono', file),
  regionLabel: pack('Region', 'Rehiyon', 402),
  accrLabel: ui('Accreditation until', 'Accredited hanggang', file),
  hoursNotListed: ui('Not listed. Call first.', 'Walang nakalista. Tumawag muna.', file),
  offlinePlace: ui("You're offline. Showing the saved details for this center.", 'Wala kang koneksiyon. Ipinapakita ang naka-save na detalye ng center na ito.', file),
  install: ui('Save TB PH to your home screen for next time.', 'I-save ang TB PH sa home screen mo para sa susunod.', file),
} satisfies Dict;
