// About (README:244–245; About.dc.html). The pack has no About copy, so the strings are the
// prototype's; bracketed stand-ins are flagged PLACEHOLDER. The privacy row on outside
// services comes from the owner (Q5); the 1555 note is the owner's wording (V4). The
// prototype's "Our partners" and "Medical review" sections are left out for launch (A1).
import { ui, type Dict } from './types.ts';

const file = 'About.dc.html';

export const about = {
  h1: ui('About', 'Tungkol sa amin', file),
  lede: ui(
    'TB PH is a TB awareness project by [group name], a team of researchers and data scientists, working with partner hospitals that care for people with TB. We turn public TB data into clear information so more Filipinos get tested early and finish treatment.',
    'Ang TB PH ay proyekto para sa kamalayan sa TB ng [pangalan ng grupo], isang pangkat ng mga mananaliksik at data scientist, katuwang ang mga ospital na nag-aalaga sa mga taong may TB. Ginagawa naming malinaw na impormasyon ang pampublikong datos tungkol sa TB, para mas maraming Pilipino ang magpasuri nang maaga at tumapos ng gamutan.',
    file,
    ['PLACEHOLDER'],
  ),

  disclaimer: ui('Disclaimer', 'Paalala', file),
  disclaimerText: ui(
    'This website provides general health information and does not replace a consultation with a doctor or health worker. The symptom checker does not diagnose TB. Only a medical test can. In an emergency, call 911.',
    'Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Hindi nagbibigay ng diyagnosis ang symptom checker; pagsusuring medikal lang ang makapagsasabi kung may TB. Sa emergency, tumawag sa 911.',
    file,
  ),
  // Q9: a build without Check (TBPH_CHECK=false) ships this instead, without the check.
  disclaimerTextNoCheck: {
    en: 'This website provides general health information and does not replace a consultation with a doctor or health worker. In an emergency, call 911.',
    fil: 'Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Sa emergency, tumawag sa 911.',
    origin: 'decision',
    src: ['decision:Q9', 'decision:Q9'],
    note: 'The owner\'s approved wording (Q9, 8 Nov 2026): drafted by the lead, approved by the owner.',
  },

  privacy: ui('Privacy', 'Privacy', file),
  privacy1: ui(
    "There are no accounts, and we don't collect personal information. The symptom checker runs entirely in your browser. Your answers are never saved or sent anywhere.",
    'Walang account, at hindi kami kumukuha ng personal na impormasyon. Tumatakbo lamang sa iyong browser ang symptom checker. Hindi kailanman sine-save o ipinapadala kahit saan ang iyong mga sagot.',
    file,
  ),
  // Q9: a build without Check (TBPH_CHECK=false) ships this instead, without the check.
  privacy1NoCheck: {
    en: 'There are no accounts, and we don\'t collect personal information.',
    fil: 'Walang account, at hindi kami kumukuha ng personal na impormasyon.',
    origin: 'decision',
    src: ['decision:Q9', 'decision:Q9'],
    note: 'The owner\'s approved wording (Q9, 8 Nov 2026): drafted by the lead, approved by the owner.',
  },
  privacy2: ui(
    'We use your location only to sort places by distance. It stays on your device.',
    'Ginagamit lang namin ang lokasyon mo para ayusin ang mga lugar ayon sa layo. Nananatili ito sa iyong device.',
    file,
  ),
  privacy3: ui(
    'The app saves its pages and data on your phone so it works offline. There is no tracking and no analytics.',
    'Sine-save ng app ang mga pahina at datos nito sa phone mo para gumana ito kahit offline. Walang tracking at walang analytics.',
    file,
  ),
  privacyServices: {
    en: 'TB PH serves its own fonts, so no font service sees your visit. Our web host, Cloudflare, sees your IP address, your browser and the pages you open. The map comes from OpenStreetMap, and only if you open it; OpenStreetMap then sees your IP address and the area on the map, which is around you if you used your location. Directions open in Google Maps, which then sees the place you chose. For Sakay.ph, we copy the address and open sakay.ph, which sees it only if you paste it there. Calls go through your phone.',
    fil: 'Ang TB PH mismo ang nagbibigay ng mga font nito, kaya walang font service na nakakakita sa pagbisita mo. Nakikita ng aming web host, ang Cloudflare, ang IP address mo, ang browser mo at ang mga pahinang binubuksan mo. Galing sa OpenStreetMap ang mapa, at kapag binuksan mo lang ito; makikita ng OpenStreetMap ang IP address mo at ang lugar na nasa mapa, na nasa paligid mo kung ginamit mo ang lokasyon mo. Sa Google Maps bumubukas ang direksiyon, kaya makikita nito ang lugar na pinili mo. Para sa Sakay.ph, kinokopya namin ang address at binubuksan ang sakay.ph; makikita lang nito ang address kung i-paste mo ito roon. Dumadaan sa phone mo ang mga tawag.',
    origin: 'decision',
    src: ['decision:Q5', 'decision:Q5'],
    note: 'The owner\'s approved wording (Q5, 8 Nov 2026): drafted by the lead, approved by the owner.',
  },

  updates: ui('Data and updates', 'Datos at mga update', file),
  updatesText: ui(
    'Data last updated {date}. WHO publishes new TB estimates once a year; the next Global Tuberculosis Report is expected in late 2026. PhilHealth updates its TB-DOTS list regularly, and we refresh ours every month.',
    'Huling update ng datos: {date}. Isang beses sa isang taon naglalabas ng bagong tantiya sa TB ang WHO; inaasahan ang susunod na Global Tuberculosis Report sa huling bahagi ng 2026. Regular na ina-update ng PhilHealth ang listahan nito ng TB-DOTS, at buwan-buwan naming nire-refresh ang sa amin.',
    file,
  ),

  appH: ui('Use TB PH like an app', 'Gamitin ang TB PH na parang app', file),
  appText: ui(
    'Add TB PH to your home screen. It opens full screen, and once it has been opened, the planner, the symptom check and Learn still work without a signal.',
    'Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner, ang symptom check at ang Alamin kahit walang signal.',
    file,
  ),
  // Q9: a build without Check (TBPH_CHECK=false) ships this instead, without the check.
  appTextNoCheck: {
    en: 'Add TB PH to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal.',
    fil: 'Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal.',
    origin: 'decision',
    src: ['decision:Q9', 'decision:Q9'],
    note: 'The owner\'s approved wording (Q9, 8 Nov 2026): drafted by the lead, approved by the owner.',
  },
  appLink: ui('How to install', 'Paano i-install', file),

  a11y: ui('Accessibility', 'Accessibility', file),
  a11yText: ui(
    "We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. The site works with a keyboard and screen readers, uses large text and strong contrast, and every chart has a table version. Known limitation: the optional map works best with a mouse or touch, so the same places are always listed as text. If something doesn't work for you, tell us at [email].",
    'Layunin naming maabot ang Web Content Accessibility Guidelines (WCAG) 2.2, level AA. Gumagana ang site gamit ang keyboard at screen reader, malalaki ang titik at malinaw ang kulay, at may talaan ang bawat chart. Limitasyon: pinakamainam gamitin ang mapa gamit ang mouse o touch, kaya laging nakalista rin bilang teksto ang parehong mga lugar. Kung may hindi gumagana para sa iyo, sabihin sa amin sa [email].',
    file,
    ['PLACEHOLDER'],
  ),

  numbers: ui('Helpful numbers', 'Mga numerong makatutulong', file),
  call: ui('Call {who}, {number}', 'Tumawag sa {who}, {number}', file),
  fromList: ui('From the PhilHealth TB-DOTS list', 'Mula sa listahan ng PhilHealth ng TB-DOTS', file),
  n911_who: ui('Emergency (police, fire, medical)', 'Emergency (pulis, bumbero, medikal)', file),
  n911_note: ui('National emergency hotline', 'Pambansang emergency hotline', file),
  n1555_who: ui('DOH hotline', 'Hotline ng DOH', file),
  n1555_note: {
    en: 'Press 2 for the National Patient Navigation and Referral Center.',
    fil: 'Pindutin ang 2 para sa National Patient Navigation and Referral Center.',
    origin: 'decision',
    src: ['decision:V4', 'decision:V4'],
    note: "V4: the owner verified 1555 and gave this wording (v7), replacing the prototype's \"[VERIFY] Confirm before launch\".",
  },
  lcp_who: ui('Lung Center of the Philippines, TB DOTS', 'Lung Center of the Philippines, TB DOTS', file),
  lcp_number: ui('8924-6101 loc. 1856–1857', '8924-6101 loc. 1856–1857', file),
  pts_who: ui('Philippine Tuberculosis Society, Quezon Institute', 'Philippine Tuberculosis Society, Quezon Institute', file),
  pts_number: ui('8356-5857 loc. 125', '8356-5857 loc. 125', file),
  local_who: ui('Your local health center', 'Ang inyong lokal na health center', file),
  local_note: ui('Usually the fastest first stop', 'Kadalasang pinakamabilis na unang puntahan', file),

  contact: ui('Contact', 'Makipag-ugnayan', file),
  contactRow: ui('[email]', '[email]', file, ['PLACEHOLDER']),
} satisfies Dict;
