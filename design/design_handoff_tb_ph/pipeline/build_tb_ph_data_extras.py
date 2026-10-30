#!/usr/bin/env python3
"""
Add the v5 sections to tb-ph-data.json from WHO's Global TB Report repository:
diagnostics_network, financing, bcg_coverage, sdg_context (+ the sourced 2025 funding note).

  python build_tb_ph_data.py --repo gtbreport2025-main --out tb-ph-data.json --year 2024 --snapshot 2025-07-30
  python build_tb_ph_data_extras.py --repo gtbreport2025-main --data tb-ph-data.json --snapshot 2025-07-30
"""
import argparse, json, math, os
import pyreadr, pandas as pd

ap = argparse.ArgumentParser(); ap.add_argument('--repo', required=True); ap.add_argument('--data', required=True)
ap.add_argument('--snapshot', default='2025-07-30'); a = ap.parse_args()
R = lambda p: list(pyreadr.read_r(os.path.join(a.repo, p)).values())[0]
num = lambda x: None if x is None or (isinstance(x, float) and math.isnan(x)) else (int(round(x)) if (abs(x) >= 100 or float(x).is_integer()) else round(float(x), 1))
snap = f'data/gtb/snapshot_{a.snapshot}/'

# Diagnostics network (WHO strategy survey, reported by the NTP)
s = R(snap + 'sty.rda'); p = s[s.iso3 == 'PHL'].set_index('year').sort_index()
diag = []
for y in range(2019, 2025):
    if y not in p.index: continue
    r = p.loc[y]
    diag.append(dict(year=y, diagnostic_sites=num(r.get('dx.test.sites')), smear_microscopy_sites=num(r.get('smear')),
                     rapid_molecular_test_sites=num(r.get('m.wrd')), rapid_tests_performed=num(r.get('m.wrd.tests.performed')),
                     rapid_tests_positive=num(r.get('m.wrd.tests.positive')), culture_labs=num(r.get('culture')),
                     tb_management_units=num(r.get('bmu'))))
last = diag[-1]
diagnostics = dict(series=diag, latest_year=last['year'],
                   rapid_test_positivity_pct=round(last['rapid_tests_positive'] / last['rapid_tests_performed'] * 100, 1),
                   source='WHO global TB database, strategy and laboratory data reported by the Philippines NTP (snapshot ' + a.snapshot + ')',
                   note='rapid_molecular_test_sites = sites using WHO-recommended rapid diagnostics (e.g. Xpert MTB/RIF, TB-LAMP, Truenat).')

# Financing (US$, current; reported by the NTP to WHO)
f = R(snap + 'finance.rda'); ph = f[f.iso3 == 'PHL'].set_index('year').sort_index()
fin = []
for y in range(2019, 2026):
    if y not in ph.index: continue
    r = ph.loc[y]
    fin.append(dict(year=y, budget_usd=num(r.get('budget.tot')), available_usd=num(r.get('cf.tot')),
                    available_domestic_usd=num(r.get('cf.tot.domestic')), available_global_fund_usd=num(r.get('cf.tot.gf')),
                    available_usaid_usd=num(r.get('cf.tot.usaid')), available_other_grants_usd=num(r.get('cf.tot.grnt')),
                    received_usd=num(r.get('rcvd.tot')), received_domestic_usd=num(r.get('rcvd.tot.domestic')),
                    received_global_fund_usd=num(r.get('rcvd.tot.gf')), received_usaid_usd=num(r.get('rcvd.tot.usaid')),
                    spent_usd=num(r.get('exp.tot'))))
f25 = [x for x in fin if x['year'] == 2025][0]; f24 = [x for x in fin if x['year'] == 2024][0]
share = lambda part, tot: round(part / tot * 100, 1) if part and tot else None
financing = dict(
    series=fin, currency='US$ (current)',
    expected_2025=dict(total=f25['available_usd'], domestic_pct=share(f25['available_domestic_usd'], f25['available_usd']),
                       global_fund_pct=share(f25['available_global_fund_usd'], f25['available_usd']),
                       usaid_pct=share(f25['available_usaid_usd'], f25['available_usd'])),
    received_2024=dict(total=f24['received_usd'], domestic_pct=share(f24['received_domestic_usd'], f24['received_usd']),
                       global_fund_pct=share(f24['received_global_fund_usd'], f24['received_usd']),
                       usaid_pct=share(f24['received_usaid_usd'], f24['received_usd'])),
    caveat_2025=('2025 figures are funding the NTP expected when it reported to WHO in mid-2025. WHO reports that USAID ceased to exist as an '
                 'entity in 2025, and that in the Philippines the loss of USAID funding reduced community outreach, contact investigations '
                 'and diagnostic operations of partner organisations. Do not present the 2025 USAID amount as money received.'),
    source='WHO global TB database, finance data reported by the Philippines NTP (snapshot ' + a.snapshot + '); WHO Global TB Report 2025, featured topic on 2025 funding cuts')

# BCG coverage (WHO/UNICEF estimates via WHO GHO)
b = R('data/gho/bcg_gho_country.rda'); bb = b[b.iso3 == 'PHL'].sort_values('year')
bcg = dict(series=[dict(year=int(r.year), coverage_pct=num(r.bcg_coverage)) for _, r in bb.iterrows() if r.year >= 2010],
           source='WHO/UNICEF estimates of national immunization coverage, via WHO Global Health Observatory (in WHO GTB report data)')

# SDG-linked drivers (latest available, all sexes)
d = R('data/gtb/other/sdg.rda'); dd = R('data/gtb/other/sdgdef.rda')
want = {'EN_LND_SLUM': 'urban_slum_pct', 'M_Est_smk_curr_std': 'smoking_pct_15plus', 'NCD_BMI_18C': 'adult_undernutrition_pct',
        'NCD_GLUC_04': 'diabetes_pct_18plus', 'SA_0000001462': 'alcohol_use_disorders_pct_15plus', 'MDG_0000000029': 'hiv_prevalence_pct_15_49',
        'UHC_INDEX_REPORTED': 'uhc_service_coverage_index', 'SH.XPD.CHEX.PP.CD': 'health_spending_per_person_ppp_usd',
        'per_allsp.cov_pop_tot': 'social_protection_coverage_pct', 'EG.CFT.ACCS.ZS': 'clean_cooking_fuel_pct',
        'SI_POV_DAY1': 'extreme_poverty_pct', 'FINPROTECTION_CATA_TOT_10_POP': 'household_health_spending_over_10pct_pct'}
ctx = []
for ind, key in want.items():
    rows = d[(d.iso3 == 'PHL') & (d['indicator.id'] == ind) & (d.sex == 'a') & (d.year <= 2024)].sort_values('year')
    if rows.empty: continue
    r = rows.iloc[-1]; meta = dd[dd['indicator.id'] == ind].iloc[0]
    item = dict(key=key, indicator_id=ind, year=int(r.year), value=num(r.value), label=meta['display.name.in.profile'], source=meta['data.source'])
    sx = d[(d.iso3 == 'PHL') & (d['indicator.id'] == ind) & (d.year == r.year) & (d.sex.isin(['m', 'f']))]
    if not sx.empty: item['by_sex'] = {row.sex: num(row.value) for _, row in sx.iterrows()}
    ctx.append(item)
sdg = dict(indicators=ctx, source='WHO GTB report SDG dataset (WHO GHO, World Bank, UN SDG database)')

data = json.load(open(a.data))
data['diagnostics_network'] = diagnostics
data['financing'] = financing
data['bcg_coverage'] = bcg
data['sdg_context'] = sdg
data['meta']['v5_additions'] = ['diagnostics_network', 'financing', 'bcg_coverage', 'sdg_context']
json.dump(data, open(a.data, 'w'), indent=1, ensure_ascii=False)
print(json.dumps(dict(diag_latest=last, positivity=diagnostics['rapid_test_positivity_pct'], expected_2025=financing['expected_2025'],
                      received_2024=financing['received_2024'], bcg_last=bcg['series'][-3:], ctx=[(c['key'], c['year'], c['value'], c.get('by_sex')) for c in ctx]), indent=0))
