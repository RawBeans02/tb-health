// Header, phone tab bar, footer and skip link (README:125–145, pack §1).
import { pack, ui, type Dict } from './types.ts';

export const chrome = {
  skip: ui('Skip to content', 'Lumaktaw sa nilalaman', 'SiteHeader.dc.html'),
  navMain: ui('Main', 'Pangunahing nabigasyon', 'SiteHeader.dc.html'),
  navMore: ui('More pages', 'Iba pang pahina', 'SiteFooter.dc.html'),
  langGroup: pack('Language / Wika', 'Language / Wika', 24),
  langEn: pack('English', 'English', 24),
  langFil: pack('Filipino', 'Filipino', 24),

  nav_home: {
    en: 'Find TB care',
    fil: 'Hanapin ang gamutan',
    origin: 'override',
    src: ['readme:130', 'readme:130'],
    flags: ['FIL-REVIEW'],
    note: 'Pack :17 and :20 name the pages "Home" / "Simula" and "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center" at /find; README uses "Find TB care" for both, at / and /places.',
  },
  nav_check: pack('Check symptoms', 'Suriin ang sintomas', 19),
  nav_learn: pack('Learn about TB', 'Alamin ang TB', 18),
  nav_data: pack('The data', 'Ang datos', 21),
  nav_about: pack('About', 'Tungkol sa amin', 22),
  nav_a11y: ui('Accessibility', 'Accessibility', 'SiteFooter.dc.html'),
  nav_install: ui('Install the app', 'I-install ang app', 'SiteFooter.dc.html'),

  safety: pack(
    "This site gives general information. It is not a diagnosis. If you've had a cough for 2 weeks or more, get tested — it's free at public health centers.",
    'Pangkalahatang impormasyon lamang ang nasa site na ito; hindi ito diyagnosis. Kung dalawang linggo ka nang inuubo o higit pa, magpasuri — libre ito sa mga pampublikong health center.',
    27,
    28,
  ),
  emergencyLead: pack('Emergency?', 'Emergency?', 31, 32),
  emergencyCall: pack('Call 911.', 'Tumawag sa 911.', 31, 32),
  credit: {
    en: 'Data: WHO Global Tuberculosis Report 2025, DOH, PhilHealth. Last updated {date}.',
    fil: 'Datos: WHO Global Tuberculosis Report 2025, DOH, PhilHealth. Huling update: {date}.',
    origin: 'override',
    src: ['readme:144', 'proto:SiteFooter.dc.html'],
    flags: ['FIL-REVIEW'],
    note: 'Pack :35–36 say 23 October 2026; README and the prototype say 30 October 2026. {date} is the newest data-file date (src/lib/dates.ts).',
  },
  creditOsm: {
    en: 'Clinic positions:',
    fil: 'Mga lokasyon ng klinika:',
    origin: 'decision',
    src: ['decision:Q8', 'decision:Q8'],
    note: "The owner's approved wording (Q8, 8 Nov 2026): the clinic positions are OpenStreetMap data (Nominatim), which asks for this credit. SiteFooter.astro follows it with the link \"© OpenStreetMap contributors\".",
  },
} satisfies Dict;
