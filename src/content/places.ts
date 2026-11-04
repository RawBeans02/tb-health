// Places: the full list (README:202–211, Places.dc.html, pack §5). Row strings are in care.ts,
// the location field's in home.ts.
import { pack, ui, type Dict } from './types.ts';

const file = 'Places.dc.html';

export const places = {
  heading: ui('Find TB care near you', 'Hanapin ang gamutan malapit sa iyo', file),
  intro: pack(
    'TB testing and treatment are free at public health centers and TB-DOTS centers. This list shows TB-DOTS clinics accredited by PhilHealth (update of 30 September 2026). Your barangay health station or rural health unit can help too. Call ahead to confirm their hours.',
    'Libre ang pagsusuri at gamutan sa TB sa mga pampublikong health center at TB-DOTS center. Makikita rito ang mga TB-DOTS clinic na accredited ng PhilHealth (update noong 30 Setyembre 2026). Makatutulong din ang inyong barangay health station o rural health unit. Tumawag muna para kumpirmahin ang kanilang oras.',
    394,
    395,
  ),
  offline: ui("You're offline. Showing the saved list of centers.", 'Wala kang koneksiyon. Ipinapakita ang naka-save na listahan ng mga center.', file),
  filters: ui('Filters', 'Mga filter', file),
  filtersCount: {
    en: 'Filters ({n})',
    fil: 'Mga filter ({n})',
    origin: 'ui',
    src: ['derived', 'derived'],
    flags: ['FIL-REVIEW'],
    note: "The prototype builds it in code: t.filters + ' (' + n + ')' (Places.dc.html:372).",
  },
  done: ui('Done', 'Tapos na', file),
  search: pack('Search by city, municipality or facility name', 'Maghanap ayon sa lungsod, bayan o pangalan ng pasilidad', 401),
  region: pack('Region', 'Rehiyon', 402),
  prov: pack('Province or city', 'Probinsiya o lungsod', 403),
  allRegions: ui('All regions', 'Lahat ng rehiyon', file),
  allProv: ui('All provinces and cities', 'Lahat ng probinsiya at lungsod', file),
  type: ui('Type', 'Uri', file),
  all: ui('All', 'Lahat', file),
  type_gov: pack('Government', 'Pampubliko', 404),
  type_priv: pack('Private', 'Pribado', 404),
  clear: ui('Clear filters', 'I-clear ang mga filter', file),
  service: ui('Service', 'Serbisyo', file),
  seg_xray: ui('Chest X-ray', 'Chest X-ray', file),
  seg_test: ui('TB test', 'TB test', file),
  seg_meds: ui('Free medicines', 'Libreng gamot', file),
  view: ui('View', 'Ipakita', file),
  list: ui('List', 'Listahan', file),
  map: ui('Map', 'Mapa', file),
  sortDist: ui('Sort by distance', 'Ayusin ayon sa layo', file),
  count: pack('{n} centers', '{n} na center', 405),
  countOne: ui('1 center', '{n} na center', file),
  empty: pack(
    'No centers match your search. Try a nearby city, or clear the filters.',
    'Walang tumugma sa hinanap mo. Subukan ang kalapit na lungsod, o i-clear ang mga filter.',
    411,
  ),
  more: ui('Show more centers ({n} left)', 'Ipakita pa ang ibang center ({n} pa)', file),
  mapLoading: ui('Loading map…', 'Kinukuha ang mapa…', file),
  mapError: ui('The map could not be loaded. Check your connection and try again.', 'Hindi ma-load ang mapa. Tingnan ang inyong koneksiyon at subukang muli.', file),
  sample: ui(
    'Sample list: {n} of about 2,100 accredited centers, from {r} regions. The full list replaces it before launch.',
    'Halimbawang listahan: {n} sa mga 2,100 accredited na center, mula sa {r} rehiyon. Papalitan ito ng buong listahan bago ilunsad.',
    file,
  ),
} satisfies Dict;
