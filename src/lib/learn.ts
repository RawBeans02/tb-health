// Learn's structure (Learn.dc.html): sections in order, their blocks, the claims under
// "By the numbers" (README:231) and the sources line. Copy is in src/content/learn.ts.
import type { learn } from '../content/learn.ts';

type Key = keyof typeof learn;

export type Block = { kind: 'p'; key: Key } | { kind: 'ol' | 'ul'; keys: Key[] } | { kind: 'actions' } | { kind: 'myths' };

export const SECTIONS: readonly { id: string; blocks: Block[] }[] = [
  { id: 'l1', blocks: [{ kind: 'p', key: 'l1_p1' }, { kind: 'p', key: 'l1_p2' }] },
  { id: 'l2', blocks: [{ kind: 'p', key: 'l2_p1' }, { kind: 'p', key: 'l2_p2' }] },
  { id: 'l3', blocks: [{ kind: 'p', key: 'l3_p1' }, { kind: 'p', key: 'l3_p2' }, { kind: 'p', key: 'l3_p3' }] },
  { id: 'l4', blocks: [{ kind: 'p', key: 'l4_p1' }, { kind: 'p', key: 'l4_p2' }] },
  { id: 'l5', blocks: [{ kind: 'p', key: 'l5_p1' }, { kind: 'ol', keys: ['l5_ol1', 'l5_ol2', 'l5_ol3'] }, { kind: 'p', key: 'l5_p2' }, { kind: 'actions' }] },
  { id: 'l6', blocks: [{ kind: 'p', key: 'l6_p1' }, { kind: 'p', key: 'l6_p2' }, { kind: 'p', key: 'l6_p3' }, { kind: 'p', key: 'l6_p4' }, { kind: 'p', key: 'l6_p5' }, { kind: 'p', key: 'l6_p6' }] },
  { id: 'l7', blocks: [{ kind: 'p', key: 'l7_p1' }] },
  { id: 'l8', blocks: [{ kind: 'p', key: 'l8_p1' }, { kind: 'ul', keys: ['l8_ul1', 'l8_ul2', 'l8_ul3', 'l8_ul4'] }] },
  { id: 'l9', blocks: [{ kind: 'p', key: 'l9_p1' }, { kind: 'p', key: 'l9_p2' }] },
  { id: 'l10', blocks: [{ kind: 'myths' }] },
];

/** Claims from data/claims.json under each section's "By the numbers" (README:231). */
export const NUMBERS: Record<string, string[]> = {
  l1: ['burden-cases', 'burden-deaths'],
  l3: ['gap-missed'],
  l4: ['drivers-attributable', 'who-men', 'who-children'],
  l5: ['test-sites', 'test-couriers', 'test-xray-yakap'],
  l6: ['tx-success', 'tx-ltfu', 'tx-free'],
  l7: ['tx-dr', 'tx-dr-success'],
  l8: ['prev-tpt', 'prev-bcg'],
  l9: ['cost-catastrophic'],
};

/** Each section's sources (pack §10 ids), in the prototype's order. */
export const SECTION_SOURCES: Record<string, string[]> = {
  l1: ['S2'],
  l2: ['S2', 'S7', 'S11'],
  l3: ['S2', 'S5', 'S6', 'S9'],
  l4: ['S2', 'S6', 'S10', 'S1'],
  l5: ['S11', 'S15', 'S13', 'S5', 'S12'],
  l6: ['S12', 'S11', 'S13', 'S15'],
  l7: ['S1', 'S12'],
  l8: ['S1', 'S12', 'S2', 'S16'],
  l9: ['S11', 'S17'],
  l10: ['S2', 'S18', 'S7', 'S11', 'S9', 'S1', 'S19', 'S5', 'S12', 'S15'],
};

/** Source names and links for those lines (Learn.dc.html S). */
export const SOURCES: Record<string, { name: string; url: string }> = {
  S1: { name: 'WHO Global Tuberculosis Report 2025', url: 'https://www.who.int/teams/global-tuberculosis-programme/tb-reports/global-tuberculosis-report-2025' },
  S2: { name: 'WHO: Tuberculosis', url: 'https://who.int/tb' },
  S5: { name: 'DOH Administrative Order 2020-0056', url: 'https://law.upd.edu.ph/wp-content/uploads/2021/04/DOH-Administrative-Order-No-2020-0056.pdf' },
  S6: { name: 'Active case finding in the Philippines (PMC)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6719270' },
  S7: { name: 'SunStar, 2025', url: 'https://www.sunstar.com.ph/manila/close-to-200000-tb-cases-recorded-in-2025' },
  S9: { name: 'Manila Bulletin, 13 July 2026', url: 'https://mb.com.ph/2026/07/13/many-filipinos-still-mistake-tb-for-an-ordinary-cough-expert-says' },
  S10: { name: 'Daily Tribune, 5 April 2026', url: 'https://tribune.net.ph/amp/story/2026/04/05/tb-remains-a-major-health-threat' },
  S11: { name: 'DZRH, March 2026', url: 'https://dzrh.com.ph/post/more-contagious-than-covid-doh-explains-why-tb-cases-spiked-to-102000-in-metro-manila-post-lockdown' },
  S12: {
    name: 'WHO Philippines and DOH, 12 November 2025',
    url: 'https://www.who.int/philippines/news/detail/12-11-2025-who--doh-target-12m-filipinos-to-be-screened-for-tuberculosis-by-2026--philippines-aims-to-double-budget-for-tb-services',
  },
  S13: { name: 'PhilHealth, 11 November 2024', url: 'https://www.philhealth.gov.ph/news/up/article/2024/news_6731aabf922b2.php' },
  S15: { name: 'DZRH, 23 March 2026', url: 'https://www.dzrh.com.ph/post/doh-guarantees-free-tb-meds-prioritizes-2027-budget-allocation' },
  S16: { name: 'Philstar/AFP, 14 November 2025', url: 'https://www.philstar.com/headlines/2025/11/14/2487103/philippines-has-3rd-highest-tb-cases-worldwide' },
  S17: { name: 'PLOS ONE, 2022: first national TB patient cost survey', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8884492/' },
  S18: { name: 'Los Baños Times', url: 'https://lbtimes.ph/page/280/?Itemid=4' },
  S19: { name: 'Southeastern National TB Center', url: 'https://sntc.medicine.ufl.edu/Files/Products/Philippines.pdf' },
};

/** Splits pack-style *italics* into runs: [text, italic, text, …]. */
export function italics(text: string): { text: string; italic: boolean }[] {
  return text.split(/\*(.*?)\*/).map((part, i) => ({ text: part, italic: i % 2 === 1 })).filter((r) => r.text);
}
