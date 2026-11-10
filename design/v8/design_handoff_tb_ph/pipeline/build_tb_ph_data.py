#!/usr/bin/env python3
"""
Rebuild tb-ph-data.json from WHO's Global TB Report code repository.

When WHO publishes a new report (e.g. gtbreport2026), download it and point --repo at it:
  curl -L -o gtb.zip https://codeload.github.com/GTB-TME/gtbreport2025/zip/refs/heads/main   # change the year
  unzip -q gtb.zip
  pip install pyreadr pandas
  python build_tb_ph_data.py --repo gtbreport2025-main --out tb-ph-data.json --year 2024 --snapshot 2025-07-30

--year      latest estimate year in that report (2024 for the 2025 report)
--snapshot  folder name under data/gtb/ without the 'snapshot_' prefix (e.g. 2025-07-30); check the repo
Monthly provisional notifications are embedded below; refresh them from
https://extranet.who.int/tme/generateCSV.asp?ds=provisional_notifications (rows for PHL).
WHO re-estimates the whole series every year: replace the old file, don't merge.
"""
import argparse, os
ap = argparse.ArgumentParser(); ap.add_argument("--repo", required=True); ap.add_argument("--out", default="tb-ph-data.json")
ap.add_argument("--year", type=int, default=2024); ap.add_argument("--snapshot", default="2025-07-30")
ARGS = ap.parse_args(); os.chdir(ARGS.repo)
import pyreadr, pandas as pd, json, math
R = lambda p,k=None: (lambda d: d[k] if k else list(d.values())[0])(pyreadr.read_r(p))
est = R('inc_mort/analysis/est.rda','est')
glob = R('inc_mort/analysis/global.rda','global')
reg = R('inc_mort/analysis/regional.rda')
dr = R('drtb/output/db_dr_country.rda','db_dr_country')
rf = R('inc_mort/analysis/rf.rda','rf')
dis = R('disaggregation/output/db_estimates_country_all.Rdata')
tb = R('data/gtb/snapshot_'+ARGS.snapshot+'/tb.rda','tb')
tx = R('data/gtb/snapshot_'+ARGS.snapshot+'/tx.rda')
tpt = R('data/gtb/snapshot_'+ARGS.snapshot+'/tpt.rda')
svy = R('data/gtb/other/svy.prev.rda')

r0 = lambda x: None if x is None or (isinstance(x,float) and math.isnan(x)) else int(round(x))
r1 = lambda x: None if x is None or (isinstance(x,float) and math.isnan(x)) else round(float(x),1)

ph = est[est.iso3=='PHL'].set_index('year')
SRC_EST = "WHO Global Tuberculosis Report 2025 (estimates for 2024); data from WHO GTB report repository github.com/GTB-TME/gtbreport2025"
SRC_NOT = "Case notifications reported by the Philippines DOH to WHO (WHO global TB database, snapshot 2025-07-30)"

inc_series = [dict(year=int(y), rate_per_100k=r0(ph.loc[y,'inc']), rate_lo=r0(ph.loc[y,'inc.lo']), rate_hi=r0(ph.loc[y,'inc.hi']),
                   cases=r0(ph.loc[y,'inc.num']), cases_lo=r0(ph.loc[y,'inc.lo.num']), cases_hi=r0(ph.loc[y,'inc.hi.num']))
              for y in range(2000,2025)]
death_series = [dict(year=int(y), deaths_total=r0(ph.loc[y,'mort.num']), deaths_hiv_negative=r0(ph.loc[y,'mort.nh.num']),
                     deaths_hiv_positive=r0(ph.loc[y,'mort.h.num']), deaths_lo=r0(ph.loc[y,'mort.lo.num']), deaths_hi=r0(ph.loc[y,'mort.hi.num']),
                     death_rate_per_100k=r1(ph.loc[y,'mort'])) for y in range(2000,2025)]
gap_series = []
for y in range(2010,2025):
    est_n = ph.loc[y,'inc.num']; notif = ph.loc[y,'c.newinc']
    gap_series.append(dict(year=int(y), estimated_new_cases=r0(est_n), notified_new_and_relapse=r0(notif),
                           treatment_coverage_pct=r1(notif/est_n*100), not_reached=r0(est_n-notif)))

# monthly provisional notifications (WHO provisional_notifications CSV, retrieved Oct 2026)
monthly_raw = {
 2020:[40104,37042,28376,10489,13726,20282,20338,16938,18701,18757,17100,17605],
 2021:[24679,24663,29335,22354,23501,25733,27894,26705,25224,24386,23571,19748],
 2022:[29412,32204,40998,25236,35013,42979,34115,38115,43520,34399,31057,28132],
 2023:[43957,49398,57963,41777,51352,47295,48786,51994,48728,43485,39452,27884],
 2024:[51986,48541,47907,48493,46159,40536,48710,48681,47534,46451,41901,31748],
 2025:[45795,47467,49051,42378,45091,42923,47222,43278,48067,48707,40395,34689],
 2026:[23723]}
monthly = [dict(year=y, month=i+1, notified=v, provisional=(y>=2025)) for y,vals in monthly_raw.items() for i,v in enumerate(vals)]
monthly_totals = {y: sum(v) for y,v in monthly_raw.items() if len(v)==12}

# age/sex estimated incidence 2024
d = dis[(dis.iso3=='PHL')&(dis.year==2024)&(dis.measure=='inc')&(dis.unit=='num')]
ages = ['0-4','5-9','10-14','15-24','25-34','35-44','45-54','55-64','65plus']
inc_agesex = [dict(age_group=a, men=r0(d[(d.age_group==a)&(d.sex=='m')].best.iloc[0]), women=r0(d[(d.age_group==a)&(d.sex=='f')].best.iloc[0])) for a in ages]
tot_m = r0(d[(d.age_group=='a')&(d.sex=='m')].best.iloc[0]); tot_f = r0(d[(d.age_group=='a')&(d.sex=='f')].best.iloc[0])
kids = r0(d[(d.age_group=='0-14')&(d.sex=='a')].best.iloc[0])

# notifications by age/sex 2024
t24 = tb[(tb.iso3=='PHL')&(tb.year==2024)].iloc[0]
ag = [('0-4','04'),('5-9','59'),('10-14','1014'),('15-19','1519'),('20-24','2024'),('25-34','2534'),('35-44','3544'),('45-54','4554'),('55-64','5564'),('65plus','65')]
notif_agesex = [dict(age_group=a, men=r0(t24['newrel.m'+k]), women=r0(t24['newrel.f'+k])) for a,k in ag]
nb = dict(new_and_relapse_total=r0(t24['c.newinc']),
          pulmonary_bacteriologically_confirmed=r0(t24['new.labconf']+t24['ret.rel.labconf']),
          pulmonary_clinically_diagnosed=r0(t24['new.clindx']+t24['ret.rel.clindx']),
          extrapulmonary=r0(t24['new.ep']+t24['ret.rel.ep']),
          children_0_14=r0(t24['c.new.014']), men=r0(t24['newrel.m']), women=r0(t24['newrel.f']))
pulm = nb['pulmonary_bacteriologically_confirmed']+nb['pulmonary_clinically_diagnosed']
nb['pct_pulmonary_bacteriologically_confirmed'] = r1(nb['pulmonary_bacteriologically_confirmed']/pulm*100)
nb['pct_extrapulmonary'] = r1(nb['extrapulmonary']/nb['new_and_relapse_total']*100)
nb['pct_children'] = r1(nb['children_0_14']/nb['new_and_relapse_total']*100)
notif_hist = [dict(year=int(y), notified=r0(v)) for y,v in tb[tb.iso3=='PHL'].set_index('year')['c.newinc'].loc[2000:2024].items()]

# risk factors
rfp = rf[(rf.iso3=='PHL')&(~rf['risk.factor'].str.contains('old'))]
labels = {'alcohol':'Alcohol use disorders','smoking':'Smoking','undernutrition':'Undernutrition','diabetes':'Diabetes','hiv':'HIV infection'}
risk = sorted([dict(risk_factor=labels[r['risk.factor']], key=r['risk.factor'], cases=r0(r.best), lo=r0(r.lo), hi=r0(r.hi), age_scope=r.age) for _,r in rfp.iterrows()], key=lambda x:-x['cases'])

# treatment outcomes
txp = tx[tx.iso3=='PHL'].set_index('year')
succ = []
for y in range(2012,2024):
    coh, s = txp.loc[y,'newrel.coh'], txp.loc[y,'newrel.succ']
    if not pd.isna(coh) and coh>0: succ.append(dict(cohort_year=int(y), cohort=r0(coh), success_pct=r1(s/coh*100)))
c23 = txp.loc[2023]
out23 = dict(cohort_year=2023, cohort=r0(c23['newrel.coh']), success=r0(c23['newrel.succ']), failed=r0(c23['newrel.fail']), died=r0(c23['newrel.died']), lost_to_follow_up=r0(c23['newrel.lost']))
out23['not_evaluated']= out23['cohort']-out23['success']-out23['failed']-out23['died']-out23['lost_to_follow_up']
for k in ['success','failed','died','lost_to_follow_up','not_evaluated']: out23[k+'_pct']=r1(out23[k]/out23['cohort']*100)
m22 = txp.loc[2022]
mdr22 = dict(cohort_year=2022, cohort=r0(m22['mdr.coh']), success=r0(m22['mdr.succ']), died=r0(m22['mdr.died']), failed=r0(m22['mdr.fail']), lost_to_follow_up=r0(m22['mdr.lost']))
for k in ['success','failed','died','lost_to_follow_up']: mdr22[k+'_pct']=r1(mdr22[k]/mdr22['cohort']*100)
tbhiv23 = dict(cohort_year=2023, cohort=r0(c23['tbhiv.coh']), success_pct=r1(c23['tbhiv.succ']/c23['tbhiv.coh']*100))
kid23 = dict(cohort_year=2023, cohort=r0(c23['newrel.014.coh']), success_pct=r1(c23['newrel.014.succ']/c23['newrel.014.coh']*100))

# DR-TB
drp = dr[(dr.iso3=='PHL')].set_index('year')
d24 = dr[dr.year==2024].copy(); totrr=d24.e_inc_rr_num.sum(); d24['share']=d24.e_inc_rr_num/totrr*100
rr_rank = d24.sort_values('e_inc_rr_num',ascending=False).reset_index(drop=True)
rr_detected = r0(t24['conf.rr.nfqr']+t24['conf.rr.fqr']); rr_enrolled = r0(t24['conf.rr.nfqr.tx']+t24['conf.rr.fqr.tx']+t24['unconf.rr.nfqr.tx'])
drtb = dict(year=2024, estimated_rr_mdr_cases=r0(drp.loc[2024,'e_inc_rr_num']), lo=r0(drp.loc[2024,'e_inc_rr_num_lo']), hi=r0(drp.loc[2024,'e_inc_rr_num_hi']),
            pct_among_new=r1(drp.loc[2024,'e_rr_prop_new']*100), pct_among_previously_treated=r1(drp.loc[2024,'e_rr_prop_ret']*100),
            lab_confirmed_rr=rr_detected, enrolled_on_treatment=rr_enrolled, pct_detected_of_estimated=r1(rr_detected/drp.loc[2024,'e_inc_rr_num']*100),
            share_of_global_pct=r1(float(d24[d24.iso3=='PHL'].share.iloc[0])), global_rank=int(rr_rank.index[rr_rank.iso3=='PHL'][0])+1,
            confirmed_series=[dict(year=int(y), lab_confirmed=r0(v)) for y,v in tb[tb.iso3=='PHL'].set_index('year').apply(lambda r: r['conf.rrmdr'] if not pd.isna(r['conf.rrmdr']) else (r['conf.rr.nfqr']+ (0 if pd.isna(r['conf.rr.fqr']) else r['conf.rr.fqr'])), axis=1).loc[2015:2024].items()])
tbhiv = dict(year=2024, estimated_hiv_positive_tb=r0(ph.loc[2024,'inc.h.num']), notified_tested_for_hiv=r0(t24['newrel.hivtest']),
             pct_tested=r1(t24['newrel.hivtest']/t24['c.newinc']*100), hiv_positive=r0(t24['newrel.hivpos']), on_art=r0(t24['newrel.art']),
             pct_on_art=r1(t24['newrel.art']/t24['newrel.hivpos']*100), deaths_hiv_positive=r0(ph.loc[2024,'mort.h.num']))
tp = tpt[(tpt.iso3=='PHL')&(tpt.year==2024)].iloc[0]
tpt24 = dict(year=2024, household_contacts_identified=r0(tp['newinc.con']), contacts_screened=r0(tp['newinc.con.screen']), tb_found_among_contacts=r0(tp['newinc.con.tb']),
             contacts_started_tpt=r0(tp['newinc.con.prevtx']), children_under5_started_tpt=r0(tp['newinc.con04.prevtx']), short_rifamycin_regimens=r0(tp['prevtx.short.rifamycin']),
             tpt_series=[dict(year=int(y), contacts_started_tpt=r0(v)) for y,v in tpt[tpt.iso3=='PHL'].set_index('year')['newinc.con.prevtx'].loc[2018:2024].items()])

# global comparison
e24 = est[est.year==2024].copy(); tot = e24['inc.num'].sum(); e24['share']=e24['inc.num']/tot*100
cty = {'IND':'India','IDN':'Indonesia','PHL':'Philippines','CHN':'China','PAK':'Pakistan','NGA':'Nigeria','COD':'DR Congo','BGD':'Bangladesh','MMR':'Myanmar','ZAF':'South Africa',
       'PNG':'Papua New Guinea','TLS':'Timor-Leste','KHM':'Cambodia','VNM':'Viet Nam','THA':'Thailand','LAO':'Lao PDR','MYS':'Malaysia','BRN':'Brunei','SGP':'Singapore','LSO':'Lesotho','PRK':'DPR Korea','MNG':'Mongolia','DJI':'Djibouti'}
top = e24.sort_values('inc.num',ascending=False).head(10)
top_cases = [dict(country=cty.get(r.iso3,r.iso3), iso3=r.iso3, cases=r0(r['inc.num']), share_of_global_pct=r1(r.share)) for _,r in top.iterrows()]
big = e24[e24['pop']>1e6].sort_values('inc',ascending=False).reset_index(drop=True)
top_rate = [dict(country=cty.get(r.iso3,r.iso3), iso3=r.iso3, rate_per_100k=r0(r.inc)) for _,r in big.head(8).iterrows()]
sea = ['PHL','TLS','MMR','IDN','KHM','VNM','THA','LAO','MYS','BRN','SGP']
sea_rates = [dict(country=cty[r.iso3], iso3=r.iso3, rate_per_100k=r0(r.inc), death_rate_per_100k=r1(r.mort)) for _,r in e24[e24.iso3.isin(sea)].sort_values('inc',ascending=False).iterrows()]
g24 = glob[glob.year==2024].iloc[0]; g15 = glob[glob.year==2015].iloc[0]
regs = {'AFR':'Africa','AMR':'Americas','EMR':'Eastern Mediterranean','EUR':'Europe','SEA':'South-East Asia','WPR':'Western Pacific'}
reg_rates = [dict(who_region=regs[r['g.whoregion']], rate_per_100k=r0(r.inc)) for _,r in reg[reg.year==2024].sort_values('inc',ascending=False).iterrows()]
glob_d = dict(year=2024, cases=r0(g24['inc.num']), rate_per_100k=r0(g24.inc), deaths=r0(g24['mort.num']), notified=r0(g24['c.newinc']),
              rate_change_since_2015_pct=r1((g24.inc/g15.inc-1)*100), deaths_change_since_2015_pct=r1((g24['mort.num']/g15['mort.num']-1)*100))
ph_rank_rate = int(big.index[big.iso3=='PHL'][0])+1
ph_rank_cases = int(e24.sort_values('inc.num',ascending=False).reset_index(drop=True).pipe(lambda x: x.index[x.iso3=='PHL'][0]))+1

# prevalence survey 2016
s = svy[(svy.iso3=='PHL')&(svy.year==2016)&(svy['case.type']=='b')]
def sv(sex='a',age='15plus',area='a'):
    q = s[(s.sex==sex)&(s['age.group']==age)&(s['area.type']==area)].iloc[0]; return dict(per_100k=r0(q.prev), lo=r0(q['prev.lo']), hi=r0(q['prev.hi']))
prev16 = dict(year=2016, measure='Prevalence of bacteriologically confirmed pulmonary TB among adults (15+), per 100,000',
              overall=sv(), men=sv('m'), women=sv('f'),
              by_age=[dict(age_group=a.replace('_','-'), **sv(age=a)) for a in ['15_24','25_34','35_44','45_54','55_64','65plus']],
              by_area=[dict(area=n, **sv(area=c)) for c,n in [('n03','NCR, Region III and Region IV-A'),('n04','Rest of Luzon'),('n05','Visayas'),('n06','Mindanao')]],
              source="2016 National TB Prevalence Survey (Philippines), as compiled in WHO global TB database (svy.prev)")

y15, y24 = 2015, ARGS.year
headline = dict(
  year=2024, population=r0(ph.loc[y24,'pop']),
  estimated_cases=r0(ph.loc[y24,'inc.num']), estimated_cases_lo=r0(ph.loc[y24,'inc.lo.num']), estimated_cases_hi=r0(ph.loc[y24,'inc.hi.num']),
  incidence_rate_per_100k=r0(ph.loc[y24,'inc']), incidence_rate_lo=r0(ph.loc[y24,'inc.lo']), incidence_rate_hi=r0(ph.loc[y24,'inc.hi']),
  share_of_global_cases_pct=r1(float(e24[e24.iso3=='PHL'].share.iloc[0])), global_rank_by_cases=ph_rank_cases,
  global_rank_by_rate_among_countries_over_1M_people=ph_rank_rate,
  estimated_deaths=r0(ph.loc[y24,'mort.num']), estimated_deaths_lo=r0(ph.loc[y24,'mort.lo.num']), estimated_deaths_hi=r0(ph.loc[y24,'mort.hi.num']),
  deaths_hiv_negative=r0(ph.loc[y24,'mort.nh.num']), deaths_per_day_hiv_negative=r0(ph.loc[y24,'mort.nh.num']/366),
  cases_per_day=r0(ph.loc[y24,'inc.num']/366),
  notified_new_and_relapse=r0(ph.loc[y24,'c.newinc']), treatment_coverage_pct=r1(ph.loc[y24,'c.newinc']/ph.loc[y24,'inc.num']*100),
  not_reached=r0(ph.loc[y24,'inc.num']-ph.loc[y24,'c.newinc']),
  case_fatality_ratio_pct=r1(ph.loc[y24,'cfr']*100),
  incidence_rate_change_since_2015_pct=r1((ph.loc[y24,'inc']/ph.loc[y15,'inc']-1)*100),
  deaths_change_since_2015_pct=r1((ph.loc[y24,'mort.num']/ph.loc[y15,'mort.num']-1)*100),
  men=tot_m, women=tot_f, children_0_14=kids, high_burden_lists=['TB','MDR/RR-TB','TB/HIV'], income_group='Lower-middle income')
end_tb = dict(baseline_year=2015, milestone_2025_incidence_rate_target=r0(ph.loc[y15,'inc']*0.5), milestone_2025_deaths_target=r0(ph.loc[y15,'mort.num']*0.25),
              actual_2024_incidence_rate=r0(ph.loc[y24,'inc']), actual_2024_deaths=r0(ph.loc[y24,'mort.num']),
              note="WHO End TB Strategy 2025 milestones: -50% incidence rate and -75% deaths vs 2015.")

data = dict(
  meta=dict(title="TB in the Philippines — data pack", generated="2026-10-23", latest_who_report="Global Tuberculosis Report 2025 (published 12 Nov 2025; covers 2024)",
            note="WHO re-estimates the whole time series every year. When the 2026 report is published, replace every series, don't append. Estimates have wide uncertainty intervals; show them.",
            sources=dict(estimates=SRC_EST, notifications=SRC_NOT,
              monthly="WHO provisional monthly notifications CSV (extranet.who.int/tme/generateCSV.asp?ds=provisional_notifications), retrieved 23 Oct 2026",
              who_data_page="https://www.who.int/teams/global-tuberculosis-programme/data")),
  headline_2024=headline, end_tb_milestones=end_tb,
  incidence_series=inc_series, deaths_series=death_series, detection_gap_series=gap_series,
  notifications_annual=notif_hist, notifications_monthly=monthly, notifications_monthly_annual_totals=monthly_totals,
  incidence_by_age_sex_2024=inc_agesex, notifications_by_age_sex_2024=notif_agesex, notification_breakdown_2024=nb,
  risk_factor_attributable_cases_2024=risk,
  treatment_outcomes=dict(new_and_relapse_2023=out23, success_trend=succ, mdr_rr_2022=mdr22, tb_hiv_2023=tbhiv23, children_2023=kid23),
  drug_resistant_tb=drtb, tb_hiv=tbhiv, contacts_and_tpt_2024=tpt24,
  global_comparison=dict(global_2024=glob_d, top10_by_cases=top_cases, top8_by_rate_over_1M_people=top_rate, southeast_asia_rates=sea_rates, who_region_rates=reg_rates),
  prevalence_survey_2016=prev16,
  patient_costs=dict(survey="First national TB patient cost survey, 2016–2017 (Philippines NTP)", catastrophic_cost_pct_all=42.4, ci=[40.2,44.6], catastrophic_cost_pct_drtb=89.7,
                     definition="Total TB-related costs (direct medical + non-medical + lost income, net of social assistance) above 20% of annual household income",
                     source="PLOS ONE 2022; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8884492/"),
)
json.dump(data, open(ARGS.out,'w'), indent=1, ensure_ascii=False)
print(json.dumps(headline, indent=1)); print(end_tb); print(nb); print(out23); print(mdr22, tbhiv23, kid23); print(drtb['estimated_rr_mdr_cases'], drtb['lab_confirmed_rr'], drtb['enrolled_on_treatment'], drtb['pct_detected_of_estimated'], drtb['share_of_global_pct'], drtb['global_rank']); print(tbhiv); print({k:v for k,v in tpt24.items() if k!='tpt_series'}); print(glob_d); print(top_rate); print(monthly_totals); print(succ)
