// Home: the route planner (README:155–198, Home.dc.html). Place-card strings are in care.ts.
import { pack, ui, type Dict } from './types.ts';

const file = 'Home.dc.html';

export const home = {
  h1: ui('Find your way to TB care.', 'Hanapin ang daan papunta sa gamutan sa TB.', file),
  lede: ui('Chest X-ray, TB test and free medicines — near you, step by step.', 'Chest X-ray, TB test at libreng gamot — malapit sa iyo, hakbang-hakbang.', file),
  fromLabel: ui('Where are you?', 'Nasaan ka?', file),
  fromPh: ui('Barangay, city or landmark', 'Barangay, lungsod o palatandaan', file),
  useLoc: ui('Use my location', 'Gamitin ang aking lokasyon', file),
  locNote: ui(
    'We use your location only to sort places by distance. It stays on your device.',
    'Ginagamit lang namin ang lokasyon mo para ayusin ang mga lugar ayon sa layo. Nananatili ito sa iyong device.',
    file,
  ),
  need: ui('I need', 'Kailangan ko ng', file),
  optAll: ui('The whole route (X-ray, test, medicines)', 'Buong daan (X-ray, test, gamot)', file),
  optNotSure: ui('Not sure yet? Check my symptoms', 'Hindi pa sigurado? Suriin ang aking sintomas', file),
  go: ui('Show me where to go', 'Ipakita kung saan pupunta', file),
  noLoc: ui('Type your barangay or city, or use your location.', 'I-type ang inyong barangay o lungsod, o gamitin ang iyong lokasyon.', file),
  denied: ui('No problem. Type your barangay or city instead.', 'Walang problema. I-type na lang ang inyong barangay o lungsod.', file),
  routeOf: ui('Your TB care route: 3 stops.', 'Ang iyong daan sa gamutan sa TB: 3 hintuan.', file),
  nearest: ui('The nearest is {distance} away.', 'Ang pinakamalapit ay {distance} ang layo.', file),
  reassureLabel: ui('Good to know', 'Mabuting malaman', file),
  reassure1: ui('Testing and TB medicines are free at public health centers.', 'Libre ang pagsusuri at gamot sa TB sa mga pampublikong health center.', file),
  reassure2: pack('A cough that lasts 2 weeks deserves a test.', 'Ang ubong umabot na nang dalawang linggo ay dapat ipasuri.', 80, 83),
  reassure3: ui('TB is curable when you finish treatment.', 'Nagagamot ang TB kapag tinapos ang gamutan.', file),
  teaser: pack('In 2024, about 724,000 Filipinos fell ill with TB.', 'Noong 2024, tinatayang 724,000 Pilipino ang nagkasakit ng TB.', 43, 45),
  teaserLink: ui('See the data.', 'Tingnan ang datos.', file),
  bringTitle: ui('What to bring', 'Ano ang dadalhin', file),
  bring1: ui('A valid ID', 'Valid ID', file),
  bring2: ui('Your PhilHealth ID or number, if you have one', 'PhilHealth ID o numero, kung mayroon', file),
  bring3: ui('Your TB check summary', 'Ang buod ng iyong TB check', file),
  bring4: ui('Any old chest X-ray results', 'Mga lumang resulta ng chest X-ray', file),
  bring5: ui('A face mask', 'Face mask', file),
  noMatch: pack('No centers match your search.', 'Walang tumugma sa hinanap mo.', 411),
  loading: ui('Loading the list of centers…', 'Kinukuha ang listahan ng mga center…', file),
  sources: ui('Sources:', 'Pinagmulan:', file),
  failed: ui('The list could not be loaded. Check your connection and try again.', 'Hindi makuha ang listahan. Tingnan ang inyong koneksiyon at subukang muli.', file),
  retry: ui('Try again', 'Subukang muli', file),
} satisfies Dict;

/** Sources for the stop explanations (Home.dc.html SRC), shown under the route. */
export const homeSources: readonly { name: string; url: string }[] = [
  { name: 'GMA News: PhilHealth YAKAP', url: 'https://www.gmanetwork.com/news/topstories/nation/978959/philhealth-yakap-s-services-75-free-medicines-who-can-avail-and-how/story' },
  { name: 'SunStar, 2025', url: 'https://www.sunstar.com.ph/manila/close-to-200000-tb-cases-recorded-in-2025' },
  {
    name: 'WHO Philippines and DOH, 12 November 2025',
    url: 'https://www.who.int/philippines/news/detail/12-11-2025-who--doh-target-12m-filipinos-to-be-screened-for-tuberculosis-by-2026--philippines-aims-to-double-budget-for-tb-services',
  },
  {
    name: 'Cepheid, 21 March 2025',
    url: 'https://prod-content.cepheid.com/en-CA/insights/insight-hub/community-and-global-health/2025/03/finding-missing-tuberculosis-tb-cases-philippines-need-for-speed.html',
  },
  { name: 'Devex: TB diagnostics in the Philippines', url: 'https://devex.shorthandstories.com/connecting-the-dots-optimizing-tb-diagnostics-in-the-philippines' },
  { name: 'DOH Administrative Order 2020-0056', url: 'https://law.upd.edu.ph/wp-content/uploads/2021/04/DOH-Administrative-Order-No-2020-0056.pdf' },
  { name: 'DZRH, March 2026', url: 'https://dzrh.com.ph/post/more-contagious-than-covid-doh-explains-why-tb-cases-spiked-to-102000-in-metro-manila-post-lockdown' },
];
