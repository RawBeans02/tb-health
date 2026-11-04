// Page titles and descriptions (PLAN §4.3). English as in the prototype's <head>.
// Filipino titles are built from the Filipino H1s and nav labels; Filipino descriptions
// are verbatim pack sentences, or come from the owner (Q3). Pages join as they're built.
import type { Dict } from './types.ts';

const ownerFil = (en: string, file: string) =>
  ({
    en,
    fil: '',
    origin: 'owner',
    src: [`proto:${file}`, 'owner'],
    note: 'Filipino description to come from the owner (Q3).',
  }) as const;

export const meta = {
  homeTitle: {
    en: 'TB PH — Find your way to TB care',
    fil: 'TB PH — Hanapin ang daan papunta sa gamutan sa TB',
    origin: 'ui',
    src: ['proto:Home.dc.html', 'derived'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: the Filipino H1 (Home.dc.html:59) without its full stop, after the brand, as in the English title.',
  },
  homeDescription: {
    en: 'Find a chest X-ray, a TB test and free TB medicines near you in the Philippines, step by step. Testing and treatment are free at public health centers.',
    fil: 'Libre ang pagsusuri at gamutan sa TB sa mga pampublikong health center at TB-DOTS center.',
    origin: 'ui',
    src: ['proto:Home.dc.html', 'pack:395'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: a verbatim pack sentence (Places intro), not a translation of the English description.',
  },

  placesTitle: {
    en: 'Find TB care near you — TB PH',
    fil: 'Hanapin ang gamutan malapit sa iyo — TB PH',
    origin: 'ui',
    src: ['proto:Places.dc.html', 'derived'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: the Filipino H1 (Places.dc.html), then the brand, as in the English title.',
  },
  placesDescription: {
    en: 'Search PhilHealth-accredited TB-DOTS clinics by city, service, region and type. Testing and TB medicines are free at public health centers.',
    fil: 'Makikita rito ang mga TB-DOTS clinic na accredited ng PhilHealth (update noong 30 Setyembre 2026).',
    origin: 'ui',
    src: ['proto:Places.dc.html', 'pack:395'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: a verbatim pack sentence (Places intro), not a translation of the English description.',
  },

  checkTitle: {
    en: 'Check symptoms — TB PH',
    fil: 'Suriin ang sintomas — TB PH',
    origin: 'ui',
    src: ['proto:Check.dc.html', 'derived'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: the Filipino nav label (pack :19), then the brand, as in the English title.',
  },
  checkDescription: {
    en: 'Answer a few questions to see whether you should get tested for TB. About 2 minutes. Your answers stay on your device.',
    fil: 'Sagutin ang ilang tanong para malaman kung dapat kang magpasuri para sa TB. Mga 2 minuto lang ito. Mananatili lang sa iyong device ang mga sagot mo.',
    origin: 'ui',
    src: ['proto:Check.dc.html', 'derived'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: three verbatim pack sentences, from pack :197 and :198, matching the English sentence by sentence.',
  },

  notFoundTitle: {
    en: 'Page not found — TB PH',
    fil: 'Hindi namin mahanap ang pahinang iyon — TB PH',
    origin: 'ui',
    src: ['proto:404.dc.html', 'derived'],
    flags: ['FIL-REVIEW'],
    note: 'FIL: the Filipino H1 (404.dc.html) without its full stop, then the brand, as in the English title.',
  },

  offlineTitle: {
    en: 'Offline — TB PH',
    fil: 'Wala kang koneksiyon — TB PH',
    origin: 'ui',
    src: ['proto:sw.js', 'derived'],
    flags: ['FIL-REVIEW'],
    note: "FIL: the Filipino first sentence of the prototype's offline page (sw.js) without its full stop, then the brand, as in the English title.",
  },

  // Filipino descriptions the owner supplies later (Q3). Listed now so launch-check shows them.
  aboutDescription: ownerFil('Who makes TB PH, how the health content is reviewed, privacy, accessibility, data updates and helpful phone numbers.', 'About.dc.html'),
  dataDescription: ownerFil('TB in the Philippines in numbers: cases, deaths, missed cases, testing, treatment, funding and prevention, with sources and table versions of every chart.', 'Data.dc.html'),
  installDescription: ownerFil('Add TB PH to your home screen. It opens full screen, and the planner, symptom check and Learn still open without a signal.', 'Install.dc.html'),
  learnDescription: ownerFil('What TB is, how it spreads, the signs, who is at risk, free testing and treatment, drug-resistant TB, prevention, living with TB, and common myths.', 'Learn.dc.html'),
  placeDescription: ownerFil('Services, hours, phone and directions for a TB-DOTS center in the Philippines.', 'Place.dc.html'),
} satisfies Dict;
