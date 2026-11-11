// The Data page's twenty chart panels (d1–d20), ported from Data.dc.html build(). Pure: data,
// language, chart width and page state in; panel specs out (shapes, tables, copy). Built at
// the default width for the prerendered page, then again at the real width in the browser
// (D13). Copy comes from src/content/charts.ts; numbers and claims from the data files.
import type { charts } from '../../content/charts.ts';
import { fill } from '../../content/types.ts';
import type { Lang } from '../i18n.ts';
import { bullets, fmt, fstack, hbars, monthly, pyramid, rows, stack, tbl, ts, type Chart, type Table } from './primitives.ts';

/* eslint-disable @typescript-eslint/no-explicit-any -- the data files' shapes, as the prototype reads them. */
export type ChartStrings = Record<keyof typeof charts, string>;

/**
 * Data-page colours (Data.dc.html C), as the names of the tokens they are (tokens.css). Charts
 * use TB red for illness, Teal for care, Dot for context. DataCharts draws each through a class
 * that reads its token (.fill-ink, .stroke-dot … in data.css), so the charts follow the colour
 * scheme (V7). Teal text is teal-ink: the same colour in light, readable on the dark panel.
 */
export const COLORS = { ink: 'ink', muted: 'muted', rule: 'separator', coral: 'tb-red', coralDeep: 'tb-red', teal: 'teal', tealInk: 'teal-ink', tealDeep: 'teal-deep', dot: 'dot', paper: 'surface', paper2: 'separator', onTeal: 'on-teal' } as const;

/** Every token a chart paints with; data.css has a .fill- and a .stroke- class for each. */
export const PAINTS: readonly string[] = [...new Set(Object.values(COLORS))];

/** The hatch patterns charts fill with (Data.dc.html:34-37): a 3px line on the panel colour, by id. */
export const HATCHES: Record<string, string> = { dhatch: COLORS.dot, 'dh-teal': COLORS.teal, 'dh-ink': COLORS.ink, 'dh-dot': COLORS.dot };

/** Region codes and names for d14 (Data.dc.html REG). */
export const REGIONS: [string, string][] = [['NCR', 'NCR & Rizal'], ['CAR', 'Cordillera (CAR)'], ['R1', 'Region I (Ilocos)'], ['R2', 'Region II (Cagayan Valley)'], ['R3', 'Region III (Central Luzon)'], ['R4A', 'Region IV-A (Calabarzon)'], ['R4B', 'MIMAROPA (Region IV-B)'], ['R5', 'Region V (Bicol)'], ['R6', 'Region VI (Western Visayas)'], ['R7', 'Region VII (Central Visayas)'], ['R8', 'Region VIII (Eastern Visayas)'], ['R9', 'Region IX (Zamboanga Peninsula)'], ['R10', 'Region X (Northern Mindanao)'], ['R11', 'Region XI (Davao)'], ['R12', 'Region XII (Soccsksargen)'], ['R13', 'Caraga (Region XIII)'], ['BARMM', 'BARMM']];

export interface PanelState {
  /** d5: estimated or notified cases. */
  pyr: string;
  setPyr: (k: string) => void;
  /** d14: facilities per region from the prepared list, or null. */
  regions: { n: number; sample: boolean; names: Record<string, string>; counts: Record<string, number> } | null;
  /** data/claims.json, for d16–d20. */
  claims: any;
}

export interface Panel {
  id: string;
  takeaway?: string;
  caption?: string;
  source?: string;
  srcLinks?: { name: string; url: string; sep: string }[];
  svgs?: Chart[];
  tables?: Table[];
  stats?: { v: string; l: string; s?: string; color?: string }[];
  toggle?: { label: string; on: boolean; pick: () => void }[];
  /** The toggle group's own name (README:239); the chart title otherwise (audit B35). */
  toggleLabel?: string;
  claimRows?: { text: string; meta: string; src: any }[];
  link2?: { href: string; label: string } | null;
  [key: string]: unknown;
}

export function buildPanels(d: any, lang: Lang, cw: number, wide: boolean, state: PanelState, tx: ChartStrings): Panel[] {
    const en = lang === 'en', C = COLORS, pct = (n: number) => n.toFixed(1) + '%';
    const light = { bg: 'transparent', ink: C.ink, muted: C.muted, rule: C.rule, base: C.ink, dot: C.dot, coral: C.coral, teal: C.teal, link: C.teal, dark: 'false' };
    const film = light;
        const S = {
      who: tx.common_1,
      whoDoh: tx.common_2
    };
    const bandCap = wide ? tx.common_3 : tx.common_4;
    const Y = tx.common_5, out = [];

    { const s = d.incidence_series.filter((r: any) => r.year >= 2010), yrs = s.map((r: any) => r.year), v = s.map((r: any) => r.rate_per_100k), lo = s.map((r: any) => r.rate_lo), hi = s.map((r: any) => r.rate_hi), i15 = yrs.indexOf(2015);
      const alt = tx.d1_1;
      out.push({ id: 'd1', th: light, takeaway: tx.d2_1, caption: bandCap, source: S.who,
        svgs: [wide ? ts({ w: cw, years: yrs, th: light, yMax: 1100, ticks: [0, 250, 500, 750, 1000], tf: fmt, band: { lo, hi, color: C.coral }, series: [{ vals: v, color: C.coral, label: fmt(v[v.length - 1]), sub: tx.d2_2 }], notes: [{ i: i15, v: v[i15], text: fmt(v[i15]) + tx.d2_3, below: true }], alt })
          : rows({ w: cw, years: yrs, vals: v, lo, hi, color: C.coral, max: 1100, th: light, valText: (i: any) => fmt(v[i]), alt })],
        tables: [tbl(tx.d2_4, [Y, tx.d2_5, tx.d2_6, tx.d2_7], s.map((r: any) => [r.year, fmt(r.rate_per_100k), fmt(r.rate_lo), fmt(r.rate_hi)]))] }); }

    { const g = d.detection_gap_series, yrs = g.map((r: any) => r.year), est = g.map((r: any) => r.estimated_new_cases), no = g.map((r: any) => r.notified_new_and_relapse), i20 = yrs.indexOf(2020), last = g[g.length - 1];
      const alt = tx.d2_8;
      out.push({ id: 'd2', th: light, takeaway: tx.d3_1,
        caption: wide ? tx.d3_2 : tx.d3_3, source: S.whoDoh,
        svgs: [wide ? ts({ w: cw, years: yrs, th: light, yMax: 800000, ticks: [0, 200000, 400000, 600000, 800000], tf: fmt, gap: { upper: est, lower: no, color: C.coral, at: 2, label: tx.d3_4, ink: C.coralDeep }, series: [{ vals: est, color: C.ink, label: tx.d3_5, sub: fmt(last.estimated_new_cases), dy: -6 }, { vals: no, color: C.teal, label: tx.d3_6, sub: fmt(last.notified_new_and_relapse) + ' (' + pct(last.treatment_coverage_pct) + ')', ink: C.tealInk, dy: 6 }], notes: [{ i: i20, v: no[i20], text: pct(g[i20].treatment_coverage_pct) + ' (2020)', color: C.teal, below: true }], alt })
          : rows({ w: cw, years: yrs, vals: no, outer: est, color: C.teal, max: 800000, th: light, valText: (i: any) => pct(g[i].treatment_coverage_pct), legend: [{ fill: C.teal, label: tx.d3_6 }, { fill: 'none', stroke: C.ink, sw: 1.25, label: tx.d3_5 }], alt })],
        tables: [tbl(tx.d3_7, [Y, tx.d3_5, tx.d3_6, tx.d3_8, tx.d3_9], g.map((r: any) => [r.year, fmt(r.estimated_new_cases), fmt(r.notified_new_and_relapse), pct(r.treatment_coverage_pct), fmt(r.not_reached)]))] }); }

    { const m = d.notifications_monthly, years = [...new Set(m.map((r: any) => r.year))];
      const mo = tx.months.split(' ');
      const min = m.reduce((a: any, b: any) => b.notified < a.notified ? b : a);
      const rowsM = years.map((y: any) => { const vals = Array(12).fill(null); let prov = false; m.filter((r: any) => r.year === y).forEach((r: any) => { vals[r.month - 1] = r.notified; prov = prov || r.provisional; }); return { year: y, vals, prov }; });
      const totals = d.notifications_monthly_annual_totals || {};
      out.push({ id: 'd3', th: light, takeaway: tx.d4_1,
        caption: tx.d4_2,
        source: tx.d4_3,
        svgs: [monthly({ w: Math.min(cw, 860), rows: rowsM, max: 60000, th: light, months: mo, provLabel: tx.d4_4, min: { year: min.year, month: min.month - 1, label: fmt(min.notified) + ' (' + mo[min.month - 1] + ' ' + min.year + ')' }, alt: tx.d4_5 })],
        tables: [tbl(tx.d4_6, [Y, ...mo, tx.d4_7], rowsM.map((r: any) => [r.year + (r.prov ? tx.d4_8 : ''), ...r.vals.map((v: any) => (v == null ? null : fmt(v))), totals[r.year] != null ? fmt(totals[r.year]) : null]))] }); }

    { const s = d.deaths_series.filter((r: any) => r.year >= 2010), yrs = s.map((r: any) => r.year), v = s.map((r: any) => r.deaths_total), lo = s.map((r: any) => r.deaths_lo), hi = s.map((r: any) => r.deaths_hi), i15 = yrs.indexOf(2015);
      const alt = tx.d4_9;
      out.push({ id: 'd4', th: film, takeaway: tx.d5_1, caption: bandCap, source: S.who,
        svgs: [wide ? ts({ w: cw, years: yrs, th: film, yMax: 50000, ticks: [0, 10000, 20000, 30000, 40000, 50000], tf: fmt, band: { lo, hi, color: C.coral }, series: [{ vals: v, color: C.coral, label: fmt(v[v.length - 1]), sub: tx.d5_2 }], notes: [{ i: i15, v: v[i15], text: fmt(v[i15]) + tx.d2_3, color: C.paper, below: true }], alt })
          : rows({ w: cw, years: yrs, vals: v, lo, hi, color: C.coral, max: 50000, th: film, valText: (i: any) => fmt(v[i]), alt })],
        tables: [tbl(tx.d5_3, [Y, tx.d5_4, tx.d2_6, tx.d2_7, tx.d5_5], s.map((r: any) => [r.year, fmt(r.deaths_total), fmt(r.deaths_lo), fmt(r.deaths_hi), r.death_rate_per_100k.toFixed(1)]))] }); }

    { const lab = (a: any) => a.replace('65plus', '65+').replace('-', '–');
      const est = d.incidence_by_age_sex_2024.map((r: any) => ({ label: lab(r.age_group), m: r.men, f: r.women })), not = d.notifications_by_age_sex_2024.map((r: any) => ({ label: lab(r.age_group), m: r.men, f: r.women }));
      const isEst = state.pyr === 'est';
      const pick = (k: string) => () => state.setPyr(k);
      out.push({ id: 'd5', th: light, takeaway: tx.d6_1,
        caption: tx.d6_2, source: S.whoDoh,
        toggleLabel: tx.d6_3,
        // The segmented control's own classes colour it (ui.css).
        toggle: [['est', tx.d3_5], ['not', tx.d3_6]].map(([k, label]) => ({ label, on: state.pyr === k, pick: pick(k) })),
        svgs: [pyramid({ w: Math.min(cw, 760), groups: isEst ? est : not, max: 80000, th: light, men: tx.d6_4, women: tx.d6_5, alt: tx.d6_6 })],
        tables: [tbl(tx.d6_7, [tx.d6_8, tx.d6_4, tx.d6_5], est.map((r: any) => [r.label, fmt(r.m), fmt(r.f)])), tbl(tx.d6_9, [tx.d6_8, tx.d6_4, tx.d6_5], not.map((r: any) => [r.label, fmt(r.m), fmt(r.f)]))] }); }

    { const names: Record<string, string> = { alcohol: tx.d6_10, smoking: tx.d6_11, undernutrition: tx.d6_12, diabetes: tx.d6_13, hiv: tx.d6_14 };
      const rf = d.risk_factor_attributable_cases_2024, scope = (s: any) => s === 'a' ? tx.d6_15 : s;
      out.push({ id: 'd6', th: light, takeaway: tx.d7_1,
        caption: tx.d7_2, source: S.who,
        svgs: [hbars({ w: cw, th: light, max: 200000, labelW: 200, axis: [0, 50000, 100000, 150000, 200000], rows: rf.map((r: any) => ({ label: names[r.key] || r.risk_factor, v: r.cases, lo: r.lo, hi: r.hi, color: C.dot, text: fmt(r.cases) })), alt: tx.d7_3 })],
        tables: [tbl(tx.d7_4, [tx.d7_5, tx.d7_6, tx.d2_6, tx.d2_7, tx.d7_7], rf.map((r: any) => [names[r.key] || r.risk_factor, fmt(r.cases), fmt(r.lo), fmt(r.hi), scope(r.age_scope)]))] }); }

    { const o = d.treatment_outcomes, c = o.new_and_relapse_2023, tr = o.success_trend, yrs = tr.map((r: any) => r.cohort_year), v = tr.map((r: any) => r.success_pct);
      const segs = [{ v: c.success_pct, n: c.success, color: C.teal, label: tx.d7_8 }, { v: c.lost_to_follow_up_pct, n: c.lost_to_follow_up, color: C.coral, label: tx.d7_9 }, { v: c.not_evaluated_pct, n: c.not_evaluated, color: C.dot, label: tx.d7_10 }, { v: c.died_pct, n: c.died, color: C.ink, label: tx.d7_11 }, { v: c.failed_pct, n: c.failed, color: C.muted, label: tx.d7_12 }];
      const t2 = tx.d7_13;
      out.push({ id: 'd7', th: light, takeaway: tx.d8_1,
        source: tx.d8_2,
        svgs: [stack({ w: Math.min(cw, 760), segs, th: light, title: tx.d8_3 + ' (' + fmt(c.cohort) + ')', alt: tx.d8_4 }),
          wide ? ts({ w: cw, h: 260, years: yrs, th: light, yMax: 100, ticks: [0, 25, 50, 75, 100], tf: (v: any) => v + '%', series: [{ vals: v, color: C.teal, label: pct(v[v.length - 1]), sub: tx.d8_5, ink: C.tealInk }], title: t2, alt: t2 })
            : rows({ w: cw, years: yrs, vals: v, color: C.teal, max: 100, th: light, valText: (i: any) => pct(v[i]), title: t2, alt: t2 })],
        tables: [tbl(tx.d8_6, [tx.d8_7, tx.d8_8, tx.d8_9], segs.map((s: any) => [s.label, pct(s.v), fmt(s.n)])), tbl(t2, [tx.d8_10, tx.d8_11, tx.d8_9], tr.map((r: any) => [r.cohort_year, pct(r.success_pct), fmt(r.cohort)]))] }); }

    { const x = d.drug_resistant_tb;
      const rowsD = [{ label: tx.d7_6, v: x.estimated_rr_mdr_cases, lo: x.lo, hi: x.hi, color: C.dot, text: fmt(x.estimated_rr_mdr_cases) }, { label: tx.d8_12, v: x.lab_confirmed_rr, color: C.teal, text: fmt(x.lab_confirmed_rr) + ' (' + pct(x.pct_detected_of_estimated) + ')' }, { label: tx.d8_13, v: x.enrolled_on_treatment, color: C.tealDeep, text: fmt(x.enrolled_on_treatment) }];
      out.push({ id: 'd8', th: light, takeaway: tx.d9_1,
        caption: tx.d9_2, source: S.who,
        svgs: [hbars({ w: cw, th: light, max: 45000, labelW: 210, rows: rowsD, alt: tx.d9_3 })],
        tables: [tbl(tx.d9_4, [tx.d9_5, tx.d9_6], [[tx.d7_6, fmt(x.estimated_rr_mdr_cases) + ' (' + fmt(x.lo) + '–' + fmt(x.hi) + ')'], [tx.d9_7, pct(x.pct_among_new)], [tx.d9_8, pct(x.pct_among_previously_treated)], [tx.d8_12, fmt(x.lab_confirmed_rr)], [tx.d9_9, pct(x.pct_detected_of_estimated)], [tx.d8_13, fmt(x.enrolled_on_treatment)], [tx.d9_10, pct(x.share_of_global_pct) + ' (#' + x.global_rank + ')']]), tbl(tx.d9_11, [Y, tx.d9_12], x.confirmed_series.map((r: any) => [r.year, fmt(r.lab_confirmed)]))] }); }

    { const h = d.tb_hiv, people = tx.d9_13;
      out.push({ id: 'd9', th: light, takeaway: tx.d10_1, source: S.who,
        stats: [{ v: pct(h.pct_tested), l: tx.d10_2, s: fmt(h.notified_tested_for_hiv) + people, color: C.teal }, { v: fmt(h.hiv_positive), l: tx.d10_3, s: '', color: C.ink }, { v: pct(h.pct_on_art), l: tx.d10_4, s: fmt(h.on_art) + people, color: C.teal }],
        tables: [tbl(tx.d10_5, [tx.d9_5, tx.d9_6], [[tx.d10_6, fmt(h.estimated_hiv_positive_tb)], [tx.d10_7, fmt(h.notified_tested_for_hiv) + ' (' + pct(h.pct_tested) + ')'], [tx.d10_8, fmt(h.hiv_positive)], [tx.d10_9, fmt(h.on_art) + ' (' + pct(h.pct_on_art) + ')'], [tx.d10_10, fmt(h.deaths_hiv_positive)]])] }); }

    { const t = d.contacts_and_tpt_2024, ser = t.tpt_series.filter((r: any) => r.year >= 2019), yrs = ser.map((r: any) => r.year), v = ser.map((r: any) => r.contacts_started_tpt);
      const t2 = tx.d10_11;
      out.push({ id: 'd10', th: light, takeaway: tx.d11_1, source: S.who,
        svgs: [hbars({ w: cw, th: light, max: 180000, labelW: 250, title: tx.d11_2, rows: [{ label: tx.d11_3, v: t.household_contacts_identified, color: C.dot, text: fmt(t.household_contacts_identified) }, { label: tx.d11_4, v: t.contacts_screened, color: C.teal, text: fmt(t.contacts_screened) }, { label: tx.d11_5, v: t.tb_found_among_contacts, color: C.coral, text: fmt(t.tb_found_among_contacts) }, { label: tx.d11_6, v: t.contacts_started_tpt, color: C.teal, text: fmt(t.contacts_started_tpt) }], alt: tx.d11_7 }),
          wide ? ts({ w: cw, h: 260, years: yrs, th: light, yMax: 80000, ticks: [0, 20000, 40000, 60000, 80000], tf: fmt, series: [{ vals: v, color: C.teal, label: fmt(v[v.length - 1]), sub: tx.d11_8, ink: C.tealInk }], title: t2, alt: t2 })
            : rows({ w: cw, years: yrs, vals: v, color: C.teal, max: 80000, th: light, valText: (i: any) => fmt(v[i]), title: t2, alt: t2 })],
        tables: [tbl(tx.d11_9, [tx.d11_10, tx.d8_9], [[tx.d11_11, fmt(t.household_contacts_identified)], [tx.d11_4, fmt(t.contacts_screened)], [tx.d11_5, fmt(t.tb_found_among_contacts)], [tx.d11_6, fmt(t.contacts_started_tpt)], [tx.d11_12, fmt(t.children_under5_started_tpt)], [tx.d11_13, fmt(t.short_rifamycin_regimens)]]), tbl(t2, [Y, tx.d11_14], t.tpt_series.map((r: any) => [r.year, fmt(r.contacts_started_tpt)]))] }); }

    { const g = d.global_comparison, ph = (n: any) => n === 'Philippines' ? tx.d11_15 : n;
      const reg: Record<string, string> = { 'Africa': tx.d11_16, 'South-East Asia': tx.d11_17, 'Western Pacific': tx.d11_18, 'Eastern Mediterranean': tx.d11_19, 'Americas': tx.d11_20, 'Europe': tx.d11_21 };
      const t1 = tx.d11_22, t2 = tx.d11_23, t3 = tx.d11_24;
      const phRate = d.headline_2024.incidence_rate_per_100k;
      const regRows = g.who_region_rates.map((r: any) => ({ label: reg[r.who_region] || r.who_region, v: r.rate_per_100k, color: C.dot, text: fmt(r.rate_per_100k) })).concat([{ label: tx.d11_25, v: g.global_2024.rate_per_100k, color: C.ink, text: fmt(g.global_2024.rate_per_100k), bold: true }, { label: tx.d11_15, v: phRate, color: C.coral, text: fmt(phRate), bold: true }]);
      out.push({ id: 'd11', th: light, takeaway: tx.d12_1, source: S.who,
        svgs: [hbars({ w: cw, th: light, max: 2800000, labelW: 150, R: 150, title: t1, rows: g.top10_by_cases.map((r: any) => ({ label: ph(r.country), v: r.cases, color: r.iso3 === 'PHL' ? C.coral : C.dot, bold: r.iso3 === 'PHL', text: fmt(r.cases) + ' (' + pct(r.share_of_global_pct) + ')' })), alt: t1 }),
          hbars({ w: cw, th: light, max: 700, labelW: 150, R: 60, title: t2, rows: g.southeast_asia_rates.map((r: any) => ({ label: ph(r.country), v: r.rate_per_100k, color: r.iso3 === 'PHL' ? C.coral : C.dot, bold: r.iso3 === 'PHL', text: fmt(r.rate_per_100k) })), alt: t2 }),
          hbars({ w: cw, th: light, max: 700, labelW: 200, R: 60, title: t3, rows: regRows, alt: t3 })],
        tables: [tbl(t1, [tx.d12_2, tx.d7_6, tx.d12_3], g.top10_by_cases.map((r: any) => [ph(r.country), fmt(r.cases), pct(r.share_of_global_pct)])), tbl(t2, [tx.d12_2, tx.d12_4, tx.d12_5], g.southeast_asia_rates.map((r: any) => [ph(r.country), fmt(r.rate_per_100k), r.death_rate_per_100k.toFixed(1)])), tbl(t3, [tx.d12_6, tx.d12_4], regRows.map((r: any) => [r.label, r.text]))] }); }

    { const p = d.patient_costs;
      out.push({ id: 'd12', th: light, takeaway: tx.d13_1,
        caption: tx.d13_2,
        source: tx.d13_3,
        stats: [{ v: pct(p.catastrophic_cost_pct_all), l: tx.d13_4, s: '95% CI ' + p.ci[0].toFixed(1) + '–' + p.ci[1].toFixed(1) + '%', color: C.coral }, { v: pct(p.catastrophic_cost_pct_drtb), l: tx.d13_5, s: '', color: C.coral }],
        tables: [tbl(tx.d13_6, [tx.d13_7, tx.d8_8], [[tx.d13_8, pct(p.catastrophic_cost_pct_all) + ' (95% CI ' + p.ci[0].toFixed(1) + '–' + p.ci[1].toFixed(1) + '%)'], [tx.d13_9, pct(p.catastrophic_cost_pct_drtb)]])] }); }

    { const s = d.prevalence_survey_2016, areaName: Record<string, string> = { 'NCR, Region III and Region IV-A': tx.d13_10, 'Rest of Luzon': tx.d13_11, 'Visayas': 'Visayas', 'Mindanao': 'Mindanao' };
      const top = Math.max(...s.by_area.map((a: any) => a.per_100k));
      const t1 = tx.d13_12, t2 = tx.d13_13;
      const all = tx.d13_14;
      out.push({ id: 'd13', th: light, takeaway: tx.d14_1,
        caption: fill(tx.d13_caption, { n: fmt(s.overall.per_100k) }),
        source: tx.d14_2,
        svgs: [hbars({ w: cw, th: light, max: 2000, labelW: 260, R: 64, title: t1, ref: { v: s.overall.per_100k }, rows: s.by_area.map((a: any) => ({ label: areaName[a.area] || a.area, v: a.per_100k, lo: a.lo, hi: a.hi, color: a.per_100k === top ? C.coral : C.dot, bold: a.per_100k === top, text: fmt(a.per_100k) })), alt: t1 }),
          hbars({ w: cw, th: light, max: 2000, labelW: 260, R: 64, title: t2, ref: { v: s.overall.per_100k }, rows: [{ label: tx.d6_4, v: s.men.per_100k, lo: s.men.lo, hi: s.men.hi, color: C.ink, text: fmt(s.men.per_100k) }, { label: tx.d6_5, v: s.women.per_100k, lo: s.women.lo, hi: s.women.hi, color: C.dot, text: fmt(s.women.per_100k) }], alt: t2 })],
        tables: [tbl(tx.d14_3, [tx.d13_7, tx.d14_4, tx.d2_6, tx.d2_7], [[all, fmt(s.overall.per_100k), fmt(s.overall.lo), fmt(s.overall.hi)], [tx.d6_4, fmt(s.men.per_100k), fmt(s.men.lo), fmt(s.men.hi)], [tx.d6_5, fmt(s.women.per_100k), fmt(s.women.lo), fmt(s.women.hi)]].concat(s.by_age.map((a: any) => [tx.d14_5 + a.age_group.replace('65plus', '65+').replace('-', '–'), fmt(a.per_100k), fmt(a.lo), fmt(a.hi)]), s.by_area.map((a: any) => [areaName[a.area] || a.area, fmt(a.per_100k), fmt(a.lo), fmt(a.hi)])))] }); }

    { const f = state.regions, t1 = tx.d14_6;
      let svgs: Chart[] = [], caption = tx.d14_7, tables: Table[] = [];
      if (f) {
        const regs = REGIONS.map(([code, name]: any) => ({ code, name: f.names[code] || name, n: f.counts[code] || 0 }));
        Object.keys(f.counts).forEach((code: any) => { if (!regs.find((r: any) => r.code === code)) regs.push({ code, name: f.names[code] || code, n: f.counts[code] }); });
        const has = regs.filter((r: any) => r.n).sort((a: any, b: any) => b.n - a.n), none = regs.filter((r: any) => !r.n);
        const max = Math.max(10, Math.ceil(has.reduce((m: any, r: any) => Math.max(m, r.n), 0) / 10) * 10);
        svgs = has.length ? [hbars({ w: cw, th: light, max, labelW: 240, R: 56, rows: has.map((r: any) => ({ label: r.name, v: r.n, color: C.teal, text: fmt(r.n) })), alt: t1 })] : [];
        caption = (f.sample ? fill(tx.d14_sample, { n: String(f.n), r: String(has.length) }) : '') + (none.length ? tx.d14_8 + none.map((r: any) => r.name).join('; ') + '.' : '');
        tables = [tbl(t1, [tx.d12_6, tx.d14_9], has.map((r: any) => [r.name, fmt(r.n)]).concat(none.map((r: any) => [r.name, tx.d14_10])))];
      }
      out.push({ id: 'd14', th: light, takeaway: tx.d15_1, caption, svgs, tables,
        source: tx.d15_2 }); }

    { const m = d.end_tb_milestones;
      out.push({ id: 'd15', th: light, takeaway: tx.d16_1,
        source: tx.d16_2,
        svgs: [bullets({ w: Math.min(cw, 860), th: light, alt: tx.d16_3, items: [{ label: tx.d16_4, now: tx.d16_5 + fmt(m.actual_2024_incidence_rate), v: m.actual_2024_incidence_rate, max: 700, marks: [{ v: m.milestone_2025_incidence_rate_target, text: tx.d16_6 + fmt(m.milestone_2025_incidence_rate_target) }, { v: 300, text: tx.d16_7, below: true }] }, { label: tx.d16_8, now: tx.d16_5 + fmt(m.actual_2024_deaths), v: m.actual_2024_deaths, max: 40000, marks: [{ v: m.milestone_2025_deaths_target, text: tx.d16_6 + fmt(m.milestone_2025_deaths_target) }] }] })],
        tables: [tbl(tx.d16_9, [tx.d16_10, tx.d16_11, tx.d16_12], [[tx.d16_13, fmt(m.milestone_2025_incidence_rate_target) + tx.d16_14, fmt(m.actual_2024_incidence_rate) + ' (2024)'], [tx.d16_15, fmt(m.milestone_2025_deaths_target), fmt(m.actual_2024_deaths) + ' (2024)'], [tx.d16_16, tx.d16_17, fmt(m.actual_2024_incidence_rate) + ' (2024)']])] }); }

    const CL = state.claims;
    if (CL) {
      const cl = (id: any) => { const x = CL.claims.find((k: any) => k.id === id); return x ? (x[lang] || x.en) : ''; };
      const srcL = (ids: any) => { const u = Array.from(new Set(ids)); return u.map((sid: any, j: any) => { const s0 = CL.sources[sid] || { title: sid, url: '#' }; return { name: s0.title, url: s0.url, sep: j < u.length - 1 ? '; ' : '' }; }); };
      const srcOf = (ids: any) => srcL([].concat.apply([], ids.map((id: any) => (CL.claims.find((k: any) => k.id === id) || { sources: [] }).sources)));
      const one = (ids: any) => srcOf(ids).length > 1 ? tx.d16_18 : tx.d16_19;

      { const dn = d.diagnostics_network;
        if (dn) {
          const sites = dn.series.filter((r: any) => r.year >= 2020 && r.rapid_molecular_test_sites != null);
          const tests = dn.series.filter((r: any) => r.year >= 2021 && r.rapid_tests_performed != null);
          const ty = tests.map((r: any) => r.year), tv = tests.map((r: any) => r.rapid_tests_performed), last = tests[tests.length - 1];
          const alt1 = tx.d16_20;
          const alt2 = tx.d16_21;
          const t2 = tx.d16_22, ids = ['test-sites', 'test-volume'];
          out.push({ id: 'd16', th: light, takeaway: cl('test-sites') + ' ' + cl('test-volume'),
            caption: fill(tx.d16_positivity, { pos: fmt(last.rapid_tests_positive), tests: fmt(last.rapid_tests_performed), year: String(last.year), pct: String(dn.rapid_test_positivity_pct) }),
            source: one(ids), srcLinks: srcOf(ids),
            svgs: [
              hbars({ w: Math.min(cw, 860), th: light, max: 1200, labelW: 64, R: 64, axis: [0, 400, 800, 1200], rows: sites.map((r: any) => ({ label: String(r.year), v: r.rapid_molecular_test_sites, color: C.teal, text: fmt(r.rapid_molecular_test_sites) })), alt: alt1, title: tx.d17_1 }),
              wide ? ts({ w: cw, h: 260, years: ty, th: light, yMax: 1400000, ticks: [0, 500000, 1000000], tf: fmt, series: [{ vals: tv, color: C.teal, label: fmt(tv[tv.length - 1]), sub: fill(tx.d16_testsIn, { year: String(ty[ty.length - 1]) }) }], alt: alt2, title: t2 })
                   : rows({ w: cw, years: ty, vals: tv, color: C.teal, max: 1400000, th: light, valText: (i: any) => fmt(tv[i]), alt: alt2, title: t2 })
            ],
            tables: [
              tbl(alt1, [Y, tx.d17_2], sites.map((r: any) => [r.year, fmt(r.rapid_molecular_test_sites)])),
              tbl(alt2, [Y, tx.d17_3, tx.d17_4], tests.map((r: any) => [r.year, fmt(r.rapid_tests_performed), r.rapid_tests_positive == null ? null : fmt(r.rapid_tests_positive)]))
            ] });
        } }

      { const fin = d.financing;
        if (fin) {
          const fy = fin.series.filter((r: any) => r.year >= 2019 && r.year <= 2025);
          const keys = [['domestic', tx.d17_5, C.teal, 'url(#dh-teal)'], ['global_fund', 'Global Fund', C.ink, 'url(#dh-ink)'], ['usaid', 'USAID', C.dot, 'url(#dh-dot)']];
          const exp = (r: any) => r.received_usd == null, val = (r: any, k: any) => exp(r) ? r['available_' + k + '_usd'] : r['received_' + k + '_usd'];
          const alt = tx.d17_6;
          const ids = ['fund-2024', 'fund-2025', 'fund-cuts', 'fund-budget'];
          out.push({ id: 'd17', th: light, takeaway: cl('fund-2024') + ' ' + cl('fund-2025'), caption: cl('fund-cuts') + ' ' + cl('fund-budget'), source: one(ids), srcLinks: srcOf(ids),
            svgs: [fstack({ w: Math.min(cw, 860), th: light, max: 180000000, axis: [0, 50000000, 100000000, 150000000], af: (v: any) => 'US$' + (v / 1000000) + 'M',
              legend: keys.map((k: any): { label: string; fill: string; stroke?: string; sw?: number } => ({ label: k[1], fill: k[2] })).concat([{ label: tx.d18_1, fill: 'url(#dhatch)', stroke: C.dot, sw: 1.5 }]),
              rows: fy.map((r: any) => ({ label: String(r.year), segs: keys.map((k: any) => ({ v: val(r, k[0]) || 0, fill: exp(r) ? k[3] : k[2], stroke: exp(r) ? k[2] : 'none', sw: exp(r) ? 1.5 : 0 })), note: exp(r) ? tx.d18_2 : '' })), alt })],
            tables: [tbl(alt, [Y, tx.d17_5, 'Global Fund', 'USAID', tx.d18_3], fy.map((r: any) => [exp(r) ? r.year + tx.d18_4 : r.year].concat(keys.map((k: any) => { const v = val(r, k[0]); return v == null ? null : 'US$' + fmt(v); })).concat([exp(r) ? (r.available_usd == null ? null : 'US$' + fmt(r.available_usd)) : 'US$' + fmt(r.received_usd)])))] });
        } }

      { const bc = d.bcg_coverage;
        if (bc) {
          const s0 = bc.series.filter((r: any) => r.year >= 2015), by = s0.map((r: any) => r.year), bv = s0.map((r: any) => r.coverage_pct), i21 = by.indexOf(2021);
          const alt = tx.d18_5;
          out.push({ id: 'd18', th: light, takeaway: cl('prev-bcg'), source: one(['prev-bcg']), srcLinks: srcOf(['prev-bcg']),
            svgs: [wide ? ts({ w: cw, h: 260, years: by, th: light, yMax: 100, ticks: [0, 25, 50, 75, 100], tf: (v: any) => v + '%', series: [{ vals: bv, color: C.teal, label: bv[bv.length - 1] + '%', sub: fill(tx.d18_babiesIn, { year: String(by[by.length - 1]) }) }], notes: i21 >= 0 ? [{ i: i21, v: bv[i21], text: '2021: ' + bv[i21] + '%' }] : [], alt })
                   : rows({ w: cw, years: by, vals: bv, color: C.teal, max: 100, th: light, valText: (i: any) => bv[i] + '%' + (by[i] === 2021 ? tx.d19_1 : ''), alt })],
            tables: [tbl(alt, [Y, tx.d19_2], s0.map((r: any) => [r.year, r.coverage_pct + '%']))] });
        } }

      { const sc = d.sdg_context;
        if (sc) {
          const get = (k: any) => sc.indicators.find((r: any) => r.key === k);
          const defs = [['urban_slum_pct', tx.d19_3, '%'], ['smoking_pct_15plus', tx.d19_4, '%'], ['adult_undernutrition_pct', tx.d19_5, '%'], ['diabetes_pct_18plus', tx.d19_6, '%'], ['alcohol_use_disorders_pct_15plus', tx.d19_7, '%'], ['uhc_service_coverage_index', tx.d19_8, '']];
          const rs = defs.map(([k, label, unit]: any) => { const r = get(k); if (!r) return null; const sex = k === 'smoking_pct_15plus' && r.by_sex ? fill(tx.d19_bySex, { m: String(r.by_sex.m), f: String(r.by_sex.f) }) : ''; return { v: r.value + unit, l: label + sex, s: r.year + '. ' + r.source, r, label }; }).filter(Boolean);
          const ids = ['drivers-slums', 'drivers-smoking', 'drivers-nutrition', 'drivers-uhc'];
          out.push({ id: 'd19', th: light, takeaway: cl('drivers-slums'), stats: rs.map((x: any) => ({ v: x.v, l: x.l, s: x.s })), source: one(ids), srcLinks: srcOf(ids),
            tables: [tbl(tx.d20_1, [tx.d20_2, tx.d9_6, Y, tx.d20_3], rs.map((x: any) => [x.label, x.v, x.r.year, x.r.source]))] });
        } }

      { const reg = CL.claims.filter((x: any) => x.topic === 'regional');
        if (reg.length) {
          out.push({ id: 'd20', th: light, takeaway: tx.common_6,
            claimRows: reg.map((x: any) => ({ text: x[lang] || x.en, meta: tx.common_7 + x.year + '. ' + x.kind + '.', src: srcL(x.sources) })),
            caption: tx.common_8,
            source: one(reg.map((x: any) => x.id)), srcLinks: srcOf(reg.map((x: any) => x.id)), link2: { href: '#d13', label: tx.common_9 },
            tables: [tbl(tx.common_10, [tx.common_11, tx.common_12, tx.d20_3], reg.map((x: any) => [x[lang] || x.en, x.year, (x.sources || []).map((s: any) => (CL.sources[s] || { title: s }).title).join('; ')]))] });
        } }
    }

    return out;
}
