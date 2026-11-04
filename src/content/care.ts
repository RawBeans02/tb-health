// Strings for facility rows and stops, shared by Home, Places and Place (tbph-core.js STR,
// README:180–195, pack §5). {placeholders} are filled by the caller.
import { pack, ui, type Dict } from './types.ts';

const core = 'tbph-core.js';

export const care = {
  svc_xray: ui('Chest X-ray', 'Chest X-ray', core),
  svc_test: ui('TB test (sputum)', 'TB test (plema)', core),
  svc_meds: ui('Free TB medicines', 'Libreng gamot sa TB', core),
  stopTitle_xray: ui('Get a chest X-ray', 'Magpa-chest X-ray', core),
  stopTitle_test: ui('Give a sputum sample for a TB test', 'Magbigay ng plema para sa TB test', core),
  stopTitle_meds: ui('Start free TB medicines', 'Simulan ang libreng gamot sa TB', core),
  // Q3: the stop explanations ship flagged [REVIEW], with Learn L6, for the clinical review.
  stopText_xray: ui(
    'An X-ray shows whether your lungs need a closer look. PhilHealth members registered at a YAKAP clinic (formerly Konsulta) can get it covered. DOH also runs free X-ray screening in communities. Ask about fees anywhere else.',
    'Ipinapakita ng X-ray kung kailangang suriing mabuti ang iyong baga. Sakop ito para sa mga miyembro ng PhilHealth na rehistrado sa isang YAKAP clinic (dating Konsulta). Nagsasagawa rin ang DOH ng libreng X-ray screening sa mga komunidad. Sa ibang lugar, itanong muna ang bayad.',
    core,
    ['REVIEW'],
  ),
  stopText_test: ui(
    "A rapid test such as Xpert checks for TB and for drug resistance, and testing is free in the National TB Program. You usually don't have to go to the lab yourself: many health centers collect your sample and send it to a lab by courier. Ask when your result will be ready.",
    'Tinitingnan ng mabilis na test gaya ng Xpert kung may TB at kung drug-resistant ito, at libre ang pagsusuri sa National TB Program. Kadalasan, hindi mo na kailangang pumunta mismo sa laboratoryo: maraming health center ang kumukuha ng iyong sample at ipinapadala ito sa laboratoryo sa pamamagitan ng courier. Itanong kung kailan lalabas ang resulta.',
    core,
    ['REVIEW'],
  ),
  stopText_meds: ui(
    "If you have TB, a TB-DOTS center gives you free medicines and checks on you until you finish, usually in 6 months. Pick one near your home or work, because you'll go back often.",
    'Kung may TB ka, bibigyan ka ng TB-DOTS center ng libreng gamot at susubaybayan ka hanggang matapos, karaniwang sa loob ng 6 na buwan. Pumili ng malapit sa bahay o trabaho, dahil madalas kang babalik doon.',
    core,
    ['REVIEW'],
  ),
  status_yes: ui('Offers this', 'Mayroon nito', core),
  status_referral: ui('Collects your sample or refers you', 'Kumukuha ng sample o nagre-refer', core),
  status_unknown: ui('Call to confirm', 'Tumawag para kumpirmahin', core),
  commute: {
    en: 'Commute directions',
    fil: 'Paano mag-commute',
    origin: 'override',
    src: ['readme:217', 'proto:tbph-core.js'],
    flags: ['FIL-REVIEW'],
    note: 'Pack :407 says "Get directions" / "Paano pumunta".',
  },
  walk: ui('Walk', 'Lakad', core),
  drive: ui('Drive', 'Sasakyan', core),
  sakay: {
    en: 'Copy address for Sakay.ph',
    fil: 'Kopyahin ang address para sa Sakay.ph',
    origin: 'override',
    src: ['readme:217', 'proto:tbph-core.js'],
    flags: ['FIL-REVIEW'],
    note: 'Pack :408 says "Copy address" / "Kopyahin ang address".',
  },
  copied: ui('Copied. Paste it into Sakay.ph.', 'Nakopya na. I-paste ito sa Sakay.ph.', core),
  copyFail: ui('Copy this address into Sakay.ph:', 'Kopyahin ang address na ito sa Sakay.ph:', core),
  call: {
    en: 'Call before you go',
    fil: 'Tumawag bago pumunta',
    origin: 'override',
    src: ['readme:217', 'proto:tbph-core.js'],
    flags: ['FIL-REVIEW'],
    note: 'Pack :406 says "Call" / "Tumawag".',
  },
  backRoute: ui('Back to your route', 'Bumalik sa iyong daan', core),
  stopOf: ui("You're at stop {n} of {m}", 'Hintuan {n} sa {m}', core),
  gov: pack('Government — free TB care', 'Pampubliko — libreng gamutan sa TB', 409),
  priv: pack('Private — fees may apply', 'Pribado — maaaring may bayad', 410),
  hours: ui('Hours: {hours}', 'Oras: {hours}', core),
  noHours: ui('Hours not listed — call first', 'Walang nakalistang oras — tumawag muna', core),
  rule: ui(
    'We mark a service as available only when an official list or the facility confirms it.',
    'Minamarkahan lang naming mayroon ang isang serbisyo kapag kinumpirma ito ng opisyal na listahan o ng mismong pasilidad.',
    core,
  ),
  far: ui('Nothing within 10 km. Showing the nearest places in your province.', 'Walang malapit sa loob ng 10 km. Ipinapakita ang pinakamalapit sa inyong probinsiya.', core),
  noXray: ui(
    "We don't have confirmed X-ray sites near you yet. Ask your nearest TB-DOTS center; they can refer you.",
    'Wala pa kaming kumpirmadong X-ray site malapit sa iyo. Magtanong sa pinakamalapit na TB-DOTS center; maaari ka nilang i-refer.',
    core,
  ),
  dataNote: pack(
    "Facility details come from PhilHealth. If a number doesn't work, contact your city or municipal health office.",
    'Galing sa PhilHealth ang detalye ng mga pasilidad. Kung hindi gumagana ang numero, makipag-ugnayan sa inyong city o municipal health office.',
    412,
  ),
  seeMore: ui('See more places', 'Tingnan ang iba pang lugar', core),
  myLoc: ui('My location', 'Ang aking lokasyon', core),
  approxPins: ui(
    'Sample data: places are pinned at approximate city centres, so distances are approximate.',
    'Halimbawang datos: nakalagay ang mga lugar sa tinatayang gitna ng lungsod, kaya tinatayang layo lang ang ipinapakita.',
    core,
  ),
  /** "about 3 km": distances that aren't exact (src/lib/core/geo.ts distanceLabel). */
  about: ui('about {km}', 'mga {km}', core),
} satisfies Dict;
