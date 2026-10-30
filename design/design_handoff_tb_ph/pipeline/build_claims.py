#!/usr/bin/env python3
"""Build data/claims.json: every factual statement the site can show, in EN and FIL, with its source.
Numbers come from tb-ph-data.json so text and data cannot drift. Re-run after refreshing the data."""
import json, sys
D = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'data/tb-ph-data.json'))
h = D['headline_2024']; g = D['global_comparison']['global_2024']; nb = D['notification_breakdown_2024']
tx = D['treatment_outcomes']; dr = D['drug_resistant_tb']; hv = D['tb_hiv']; tp = D['contacts_and_tpt_2024']
dg = D['diagnostics_network']; fin = D['financing']; bcg = {r['year']: r['coverage_pct'] for r in D['bcg_coverage']['series']}
ctx = {c['key']: c for c in D['sdg_context']['indicators']}; ps = D['prevalence_survey_2016']
rf = {r['key']: r['cases'] for r in D['risk_factor_attributable_cases_2024']}
diag = {r['year']: r for r in dg['series']}; tps = {r['year']: r['contacts_started_tpt'] for r in tp['tpt_series']}
fy = {r['year']: r for r in fin['series']}
k = lambda n: f"{round(n, -3):,}"; c = lambda n: f"{n:,}"
def M(x): return f"US${x/1e6:.1f} million"
def Mf(x): return f"US${x/1e6:.1f} milyon"
S = {
 'S1': ('WHO, Global Tuberculosis Report 2025 (data: WHO GTB report repository, snapshot 2025-07-30)', 'https://www.who.int/teams/global-tuberculosis-programme/tb-reports/global-tuberculosis-report-2025'),
 'S3': ('WHO provisional monthly TB notifications', 'https://extranet.who.int/tme/generateCSV.asp?ds=provisional_notifications'),
 'S4': ('PhilHealth, List of Accredited TB DOTS Clinics (30 Sep 2026)', 'https://www.philhealth.gov.ph/partners/providers/facilities/accredited/DOTS_093026.pdf'),
 'S11': ('DZRH, DOH on Metro Manila TB cases (Mar 2026)', 'https://dzrh.com.ph/post/more-contagious-than-covid-doh-explains-why-tb-cases-spiked-to-102000-in-metro-manila-post-lockdown'),
 'S12': ('WHO Philippines and DOH joint release (12 Nov 2025)', 'https://www.who.int/philippines/news/detail/12-11-2025-who--doh-target-12m-filipinos-to-be-screened-for-tuberculosis-by-2026--philippines-aims-to-double-budget-for-tb-services'),
 'S13': ('PhilHealth news (11 Nov 2024): TB-DOTS package', 'https://www.philhealth.gov.ph/news/up/article/2024/news_6731aabf922b2.php'),
 'S17': ('First national TB patient cost survey, PLOS ONE (2022)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8884492/'),
 'S20': ('Stop TB Partnership, Philippines country brief', 'https://www.stoptb.org/sites/default/files/documents/Philippines.pdf'),
 'S21': ('Philstar (28 Mar 2025): DOH target of 300 per 100,000 by 2030', 'https://www.philstar.com/headlines/2025/03/28/2431788/doh-intensifies-search-unreported-tb-cases-ensures-treatment/amp/'),
 'S24': ('GMA News: PhilHealth YAKAP services (chest X-ray; 4,000+ clinics, Jan 2026)', 'https://www.gmanetwork.com/news/topstories/nation/978959/philhealth-yakap-s-services-75-free-medicines-who-can-avail-and-how/story'),
 'S25': ("Cepheid (21 Mar 2025): Finding Missing TB Cases, The Philippines' Need for Speed", 'https://prod-content.cepheid.com/en-CA/insights/insight-hub/community-and-global-health/2025/03/finding-missing-tuberculosis-tb-cases-philippines-need-for-speed.html'),
 'S26': ('Devex: Connecting the dots, optimizing TB diagnostics in the Philippines', 'https://devex.shorthandstories.com/connecting-the-dots-optimizing-tb-diagnostics-in-the-philippines'),
 'S28': ('WHO Global TB Report 2025, featured topic: impact of 2025 funding cuts', 'https://www.who.int/teams/global-programme-on-tuberculosis-and-lung-health/tb-reports/global-tuberculosis-report-2025/featured-topics/Impact-of-2025-funding-cuts'),
 'S29': ('Context (Thomson Reuters Foundation): How funding cuts affected TB services around the world', 'https://www.context.news/socioeconomic-inclusion/how-funding-cuts-affected-tb-services-around-the-world'),
 'S30': ('Stop TB Partnership (3 Mar 2025): Impact of US Government funding halt on TB responses', 'https://www.stoptb.org/sites/default/files/documents/Disruption US FUNDING halt030325.pdf'),
 'S31': ('GMA News: DOH calls for more investments to end TB by 2030 (treatment success vs 90% target)', 'https://www.gmanetwork.com/news/topstories/nation/968970/doh-calls-for-more-investments-collaborations-to-end-tb-by-2030/story'),
 'S32': ('The Voice News Weekly (Apr 2024): DOH Central Luzon on TB', 'https://thevoicenewsweekly.com/%f0%9d%90%82%f0%9d%90%a8%f0%9d%90%a6%f0%9d%90%9b%f0%9d%90%9a%f0%9d%90%ad%f0%9d%90%a2%f0%9d%90%a7%f0%9d%90%a0-%f0%9d%90%93%f0%9d%90%81-%f0%9d%90%ad%f0%9d%90%a1%f0%9d%90%ab%f0%9d%90%a8%f0%9d%90%ae'),
 'S33': ('Philippine News Agency (4 Aug 2023): DOH-11 TB cases Jan to Jun 2023', 'https://beta.pna.gov.ph/articles/1207145'),
 'S34': ('Inquirer (21 Dec 2024): 1,280 TB cases logged in Tondo', 'https://newsinfo.inquirer.net/?p=2017587'),
}
C = []
def add(cid, topic, en, fil, src, kind, key=None, year=None, use=('data',)):
    C.append(dict(id=cid, topic=topic, en=en, fil=fil, sources=src, kind=kind, data_key=key, year=year, use_on=list(use)))
# Burden
add('burden-cases', 'burden', f"About {k(h['estimated_cases'])} people in the Philippines fell ill with TB in 2024. That is about {c(round(h['cases_per_day'],-1))} a day.",
    f"Mga {k(h['estimated_cases'])} katao sa Pilipinas ang nagkasakit ng TB noong 2024. Mga {c(round(h['cases_per_day'],-1))} iyan bawat araw.", ['S1'], 'WHO estimate (range 399,000 to 1.18 million)', 'headline_2024.estimated_cases', 2024, ('home','data','learn'))
add('burden-rate', 'burden', f"Our TB rate is {h['incidence_rate_per_100k']} per 100,000 people, almost 5 times the world rate of {g['rate_per_100k']}.",
    f"Ang antas ng TB sa atin ay {h['incidence_rate_per_100k']} bawat 100,000 katao, halos 5 beses ng pandaigdigang antas na {g['rate_per_100k']}.", ['S1'], 'WHO estimate', 'headline_2024.incidence_rate_per_100k', 2024, ('data',))
add('burden-rank', 'burden', f"The Philippines has the 3rd-most TB cases in the world, {h['share_of_global_cases_pct']}% of the global total.",
    f"Pangatlo ang Pilipinas sa pinakamaraming kaso ng TB sa mundo, {h['share_of_global_cases_pct']}% ng kabuuan.", ['S1'], 'WHO estimate', 'headline_2024.share_of_global_cases_pct', 2024, ('data','learn'))
add('burden-sea', 'burden', "Among countries with over 1 million people, only Papua New Guinea has a higher TB rate. In Southeast Asia, ours is the highest.",
    "Sa mga bansang may higit 1 milyong tao, Papua New Guinea lang ang may mas mataas na antas ng TB. Sa Timog-Silangang Asya, tayo ang pinakamataas.", ['S1'], 'WHO estimate', 'global_comparison.top8_by_rate_over_1M_people', 2024)
add('burden-trend', 'burden', f"Since 2015, our TB rate rose {h['incidence_rate_change_since_2015_pct']}%. The world's fell {abs(g['rate_change_since_2015_pct'])}%.",
    f"Mula 2015, tumaas nang {h['incidence_rate_change_since_2015_pct']}% ang antas ng TB sa atin. Sa buong mundo, bumaba ito nang {abs(g['rate_change_since_2015_pct'])}%.", ['S1'], 'WHO estimate', 'headline_2024.incidence_rate_change_since_2015_pct', 2024)
add('burden-deaths', 'burden', f"TB killed about {k(h['estimated_deaths'])} people in the Philippines in 2024, nearly 100 a day.",
    f"Mga {k(h['estimated_deaths'])} katao sa Pilipinas ang namatay sa TB noong 2024, halos 100 bawat araw.", ['S1','S12'], 'WHO estimate (range 32,800 to 42,400)', 'headline_2024.estimated_deaths', 2024, ('data','learn'))
# Detection
add('gap-missed', 'detection', f"About {k(h['not_reached'])} people with TB, 1 in 4, were not diagnosed or not reported in 2024.",
    f"Mga {k(h['not_reached'])} taong may TB, 1 sa bawat 4, ang hindi na-diagnose o hindi naiulat noong 2024.", ['S1'], 'WHO estimate minus DOH notifications', 'headline_2024.not_reached', 2024, ('home','data'))
add('gap-record', 'detection', "TB notifications hit a record 575,770 in 2023, then 544,948 in 2024.",
    "Umabot sa rekord na 575,770 ang naiulat na kaso ng TB noong 2023, at 544,948 noong 2024.", ['S1'], 'DOH notifications reported to WHO', 'notifications_annual', 2024)
add('gap-covid', 'detection', "In April 2020, during the COVID-19 lockdown, only 10,489 TB cases were notified, the lowest month on record since 2020.",
    "Noong Abril 2020, sa gitna ng COVID-19 lockdown, 10,489 lang ang naiulat na kaso ng TB, ang pinakamababang buwan mula 2020.", ['S3'], 'DOH notifications reported to WHO', 'notifications_monthly', 2020)
add('gap-2025', 'detection', f"Provisional data show {c(D['notifications_monthly_annual_totals']['2025'] if '2025' in D['notifications_monthly_annual_totals'] else D['notifications_monthly_annual_totals'][2025])} TB cases notified in 2025.",
    f"Ayon sa pansamantalang datos, {c(D['notifications_monthly_annual_totals']['2025'] if '2025' in D['notifications_monthly_annual_totals'] else D['notifications_monthly_annual_totals'][2025])} na kaso ng TB ang naiulat noong 2025.", ['S3'], 'Provisional, will change', 'notifications_monthly_annual_totals', 2025)
# Who
add('who-men', 'who', f"Nearly 2 in 3 people who fell ill with TB in 2024 were men ({round(h['men']/h['estimated_cases']*100)}%).",
    f"Halos 2 sa bawat 3 nagka-TB noong 2024 ay lalaki ({round(h['men']/h['estimated_cases']*100)}%).", ['S1'], 'WHO estimate', 'headline_2024.men', 2024, ('data','learn'))
add('who-children', 'who', f"About {k(h['children_0_14'])} children under 15 fell ill with TB in 2024. Children were {nb['pct_children']}% of notified cases.",
    f"Mga {k(h['children_0_14'])} batang wala pang 15 taong gulang ang nagka-TB noong 2024. {nb['pct_children']}% ng mga naiulat na kaso ay mga bata.", ['S1'], 'WHO estimate; DOH notifications', 'headline_2024.children_0_14', 2024, ('learn','data'))
# Drivers
add('drivers-attributable', 'drivers', f"In 2024, about {k(rf['alcohol'])} TB cases were linked to alcohol use disorders, {k(rf['smoking'])} to smoking, {k(rf['undernutrition'])} to undernutrition, {k(rf['diabetes'])} to diabetes and {c(round(rf['hiv'],-2))} to HIV. These overlap.",
    f"Noong 2024, mga {k(rf['alcohol'])} kaso ng TB ang may kaugnayan sa labis na pag-inom ng alak, {k(rf['smoking'])} sa paninigarilyo, {k(rf['undernutrition'])} sa kakulangan sa nutrisyon, {k(rf['diabetes'])} sa diabetes at {c(round(rf['hiv'],-2))} sa HIV. Nagsasapawan ang mga ito.", ['S1'], 'WHO estimate, wide ranges', 'risk_factor_attributable_cases_2024', 2024, ('learn','data'))
add('drivers-slums', 'drivers', f"{ctx['urban_slum_pct']['value']}% of people in Philippine cities live in slum conditions ({ctx['urban_slum_pct']['year']}). TB spreads most where people share crowded rooms.",
    f"{ctx['urban_slum_pct']['value']}% ng mga taga-lungsod sa Pilipinas ang nakatira sa mga slum ({ctx['urban_slum_pct']['year']}). Pinakamabilis kumalat ang TB kung saan siksikan ang mga tao sa iisang kuwarto.", ['S1'], 'UN SDG database via WHO', 'sdg_context', ctx['urban_slum_pct']['year'])
add('drivers-smoking', 'drivers', f"{ctx['smoking_pct_15plus']['value']}% of adults smoke: {ctx['smoking_pct_15plus']['by_sex']['m']}% of men and {ctx['smoking_pct_15plus']['by_sex']['f']}% of women ({ctx['smoking_pct_15plus']['year']}).",
    f"{ctx['smoking_pct_15plus']['value']}% ng mga nasa hustong gulang ang naninigarilyo: {ctx['smoking_pct_15plus']['by_sex']['m']}% ng mga lalaki at {ctx['smoking_pct_15plus']['by_sex']['f']}% ng mga babae ({ctx['smoking_pct_15plus']['year']}).", ['S1'], 'WHO GHO', 'sdg_context', ctx['smoking_pct_15plus']['year'])
add('drivers-nutrition', 'drivers', f"{ctx['adult_undernutrition_pct']['value']}% of adults are undernourished ({ctx['adult_undernutrition_pct']['year']}), which raises the risk of falling ill with TB.",
    f"{ctx['adult_undernutrition_pct']['value']}% ng mga nasa hustong gulang ang kulang sa nutrisyon ({ctx['adult_undernutrition_pct']['year']}), na nagpapataas ng panganib na magkasakit ng TB.", ['S1'], 'WHO GHO', 'sdg_context', ctx['adult_undernutrition_pct']['year'])
add('drivers-uhc', 'drivers', f"The Philippines scores {round(ctx['uhc_service_coverage_index']['value'])} out of 100 on WHO's index of essential health service coverage ({ctx['uhc_service_coverage_index']['year']}).",
    f"Nakakuha ang Pilipinas ng {round(ctx['uhc_service_coverage_index']['value'])} sa 100 sa index ng WHO para sa saklaw ng mahahalagang serbisyong pangkalusugan ({ctx['uhc_service_coverage_index']['year']}).", ['S1'], 'WHO GHO', 'sdg_context', ctx['uhc_service_coverage_index']['year'])
# Testing network
d24, d20 = diag[2024], diag[2020]
add('test-sites', 'testing', f"{c(d24['rapid_molecular_test_sites'])} sites used rapid molecular TB tests in 2024, up from {c(d20['rapid_molecular_test_sites'])} in 2020.",
    f"{c(d24['rapid_molecular_test_sites'])} na site ang gumamit ng mabilis na molecular TB test noong 2024, mula {c(d20['rapid_molecular_test_sites'])} noong 2020.", ['S1'], 'Reported by the NTP to WHO', 'diagnostics_network', 2024, ('learn','data','home'))
add('test-volume', 'testing', f"{d24['rapid_tests_performed']/1e6:.2f} million rapid TB tests were done in 2024. About 1 in 5 found TB ({dg['rapid_test_positivity_pct']}%).",
    f"{d24['rapid_tests_performed']/1e6:.2f} milyong mabilis na TB test ang isinagawa noong 2024. Mga 1 sa bawat 5 ang may nakitang TB ({dg['rapid_test_positivity_pct']}%).", ['S1'], 'Reported by the NTP to WHO', 'diagnostics_network', 2024)
add('test-network', 'testing', f"The National TB Program has {c(d24['diagnostic_sites'])} TB testing sites and {c(d24['tb_management_units'])} TB management units (2024).",
    f"May {c(d24['diagnostic_sites'])} TB testing site at {c(d24['tb_management_units'])} TB management unit ang National TB Program (2024).", ['S1'], 'Reported by the NTP to WHO', 'diagnostics_network', 2024)
add('test-couriers', 'testing', "Motorcycle couriers carry sputum samples from health centers to GeneXpert labs, so many people never need to travel to the lab. One GeneXpert typically serves ten municipalities.",
    "Dinadala ng mga motorcycle courier ang sample ng plema mula sa health center papunta sa GeneXpert lab, kaya marami ang hindi na kailangang pumunta mismo sa lab. Karaniwang sampung bayan ang pinagsisilbihan ng isang GeneXpert.", ['S25'], 'Reported', None, 2025, ('home','learn'))
add('test-xray-yakap', 'testing', "PhilHealth's YAKAP primary care package covers a chest X-ray, and there were over 4,000 accredited YAKAP clinics as of January 2026.",
    "Sakop ng YAKAP primary care package ng PhilHealth ang chest X-ray, at higit 4,000 na ang accredited na YAKAP clinic noong Enero 2026.", ['S24'], 'Reported', None, 2026, ('home','learn'))
# Treatment
o = tx['new_and_relapse_2023']
add('tx-success', 'treatment', f"{round(o['success_pct'])}% of people who started TB treatment in 2023 were cured or finished it. DOH's target is 90%.",
    f"{round(o['success_pct'])}% ng nagsimula ng gamutan sa TB noong 2023 ang gumaling o nakatapos. 90% ang target ng DOH.", ['S1','S31'], 'DOH data reported to WHO', 'treatment_outcomes.new_and_relapse_2023', 2023, ('learn','data'))
add('tx-ltfu', 'treatment', f"{o['lost_to_follow_up_pct']}% stopped treatment before finishing, the most common reason treatment did not succeed.",
    f"{o['lost_to_follow_up_pct']}% ang huminto sa gamutan bago matapos, ang pinakakaraniwang dahilan kung bakit hindi nagtagumpay ang gamutan.", ['S1'], 'DOH data reported to WHO', 'treatment_outcomes.new_and_relapse_2023', 2023, ('learn','data'))
add('tx-dr', 'treatment', f"About {k(dr['estimated_rr_mdr_cases'])} people developed drug-resistant TB in 2024, but only {c(dr['lab_confirmed_rr'])} were confirmed by a lab ({round(dr['pct_detected_of_estimated'])}%).",
    f"Mga {k(dr['estimated_rr_mdr_cases'])} katao ang nagkaroon ng drug-resistant TB noong 2024, pero {c(dr['lab_confirmed_rr'])} lang ang nakumpirma ng laboratoryo ({round(dr['pct_detected_of_estimated'])}%).", ['S1'], 'WHO estimate; DOH data', 'drug_resistant_tb', 2024, ('learn','data'))
add('tx-dr-success', 'treatment', f"{tx['mdr_rr_2022']['success_pct']}% of people treated for drug-resistant TB in 2022 succeeded. An all-oral 6-month regimen now replaces 2-year treatment.",
    f"{tx['mdr_rr_2022']['success_pct']}% ng mga ginamot para sa drug-resistant TB noong 2022 ang nagtagumpay. May gamutan na ngayong puro iniinom at 6 na buwan lang, kapalit ng 2 taon.", ['S1','S12'], 'DOH data reported to WHO', 'treatment_outcomes.mdr_rr_2022', 2022, ('learn','data'))
add('tx-hiv', 'treatment', f"{round(hv['pct_on_art'])}% of people with both TB and HIV were on HIV treatment in 2024. {round(hv['pct_tested'])}% of TB patients knew their HIV status.",
    f"{round(hv['pct_on_art'])}% ng may TB at HIV ang naka-HIV treatment noong 2024. {round(hv['pct_tested'])}% ng mga pasyenteng may TB ang alam ang kanilang HIV status.", ['S1'], 'DOH data reported to WHO', 'tb_hiv', 2024)
add('tx-free', 'treatment', "TB testing and medicines are free at public health centers, and PhilHealth's outpatient TB-DOTS package is ₱5,200 at accredited centers (as of November 2024).",
    "Libre ang TB test at gamot sa mga pampublikong health center, at ₱5,200 ang outpatient TB-DOTS package ng PhilHealth sa mga accredited na center (noong Nobyembre 2024).", ['S11','S13'], 'Official', None, 2024, ('home','learn'))
# Prevention
add('prev-tpt', 'prevention', f"{c(tp['contacts_started_tpt'])} household contacts started TB preventive treatment in 2024, up from {c(tps[2019])} in 2019.",
    f"{c(tp['contacts_started_tpt'])} na kasama sa bahay ng mga pasyente ang nagsimula ng TB preventive treatment noong 2024, mula {c(tps[2019])} noong 2019.", ['S1'], 'DOH data reported to WHO', 'contacts_and_tpt_2024', 2024, ('learn','data'))
add('prev-bcg', 'prevention', f"{round(bcg[2024])}% of babies got the BCG vaccine in 2024. Coverage fell to {round(bcg[2021])}% in 2021, during the pandemic.",
    f"{round(bcg[2024])}% ng mga sanggol ang nabakunahan ng BCG noong 2024. Bumaba ito sa {round(bcg[2021])}% noong 2021, sa gitna ng pandemya.", ['S1'], 'WHO/UNICEF estimate', 'bcg_coverage', 2024, ('learn','data'))
# Cost & funding
add('cost-catastrophic', 'cost', "42% of families affected by TB faced catastrophic costs, and 90% of those with drug-resistant TB (2016 to 2017 survey).",
    "42% ng mga pamilyang may TB ang nakaranas ng catastrophic na gastos, at 90% ng may drug-resistant TB (survey noong 2016 hanggang 2017).", ['S17'], 'National survey', 'patient_costs', 2017, ('learn','data'))
r24 = fin['received_2024']; e25 = fin['expected_2025']
add('fund-2024', 'funding', f"The TB program received {M(r24['total'])} in 2024: {round(r24['domestic_pct'])}% from the government, {round(r24['global_fund_pct'])}% from the Global Fund and {round(r24['usaid_pct'])}% from USAID.",
    f"Nakatanggap ang TB program ng {Mf(r24['total'])} noong 2024: {round(r24['domestic_pct'])}% mula sa gobyerno, {round(r24['global_fund_pct'])}% mula sa Global Fund at {round(r24['usaid_pct'])}% mula sa USAID.", ['S1'], 'Reported by the NTP to WHO', 'financing.received_2024', 2024, ('data',))
add('fund-2025', 'funding', f"For 2025, the TB program expected {M(e25['total'])}, and more than half was to come from international donors.",
    f"Para sa 2025, inasahan ng TB program ang {Mf(e25['total'])}, at mahigit kalahati nito ay manggagaling sana sa mga international donor.", ['S1','S28'], 'Expected funding, mid-2025; see caveat', 'financing.expected_2025', 2025, ('data',))
add('fund-cuts', 'funding', "In 2025, USAID ceased to exist. WHO reports that in the Philippines this reduced community outreach, contact investigations and diagnostic work by partner organisations.",
    "Noong 2025, nawala na ang USAID. Ayon sa WHO, nabawasan dahil dito ang community outreach, contact investigation at diagnostic na gawain ng mga partner organization sa Pilipinas.", ['S28','S29'], 'Reported by WHO', 'financing.caveat_2025', 2025, ('data',))
add('fund-budget', 'funding', "DOH proposed ₱4.2 billion for TB services in 2026, up from ₱2.6 billion in 2025.",
    "Nagmungkahi ang DOH ng ₱4.2 bilyon para sa serbisyo sa TB sa 2026, mula ₱2.6 bilyon noong 2025.", ['S12'], 'Official proposal', None, 2026, ('data',))
# Programme & targets
add('target-screen', 'targets', "The national TB plan aims to screen 12 million Filipinos by 2026.",
    "Layunin ng pambansang plano sa TB na ma-screen ang 12 milyong Pilipino pagsapit ng 2026.", ['S12'], 'Official target', None, 2026, ('data','learn'))
add('target-2030', 'targets', "DOH aims to bring the TB rate down to 300 per 100,000 by 2030. In 2024 it was 625.",
    "Layunin ng DOH na pababain ang antas ng TB sa 300 bawat 100,000 pagsapit ng 2030. Noong 2024, 625 ito.", ['S21','S1'], 'Official target', 'end_tb_milestones', 2030, ('data',))
add('target-endtb', 'targets', f"The world's 2025 milestone was to halve the TB rate and cut deaths by 75% from 2015. For the Philippines that meant {D['end_tb_milestones']['milestone_2025_incidence_rate_target']} per 100,000 and about {k(D['end_tb_milestones']['milestone_2025_deaths_target'])} deaths.",
    f"Ang pandaigdigang target para sa 2025 ay hatiin ang antas ng TB at bawasan nang 75% ang namamatay mula 2015. Para sa Pilipinas, {D['end_tb_milestones']['milestone_2025_incidence_rate_target']} bawat 100,000 iyon at mga {k(D['end_tb_milestones']['milestone_2025_deaths_target'])} na namatay.", ['S1'], 'WHO End TB Strategy', 'end_tb_milestones', 2025, ('data',))
add('facilities', 'targets', "The National TB Program runs over 3,300 TB-DOTS facilities. About 2,100 are accredited by PhilHealth (September 2026 list).",
    "Higit 3,300 ang TB-DOTS facility ng National TB Program. Mga 2,100 dito ang accredited ng PhilHealth (listahan noong Setyembre 2026).", ['S20','S4'], 'Official', None, 2026, ('home','learn'))
# Regional snapshots (different years and sources; label them)
add('region-ncr', 'regional', "Metro Manila: DOH reported over 102,000 TB cases (March 2026).",
    "Metro Manila: Iniulat ng DOH ang higit 102,000 kaso ng TB (Marso 2026).", ['S11'], 'DOH, as reported in the news', None, 2026, ('data',))
add('region-r3', 'regional', "Central Luzon: DOH estimated 81,543 new TB cases for 2024. Bulacan detected the most cases in the region in 2023.",
    "Gitnang Luzon: Tinantiya ng DOH ang 81,543 bagong kaso ng TB para sa 2024. Bulacan ang may pinakamaraming natuklasang kaso sa rehiyon noong 2023.", ['S32'], 'DOH regional office, as reported in the news', None, 2024, ('data',))
add('region-r11', 'regional', "Davao Region: 10,363 TB cases were recorded from January to June 2023, 4,315 of them in Davao City.",
    "Rehiyon ng Davao: 10,363 kaso ng TB ang naitala mula Enero hanggang Hunyo 2023, 4,315 dito sa Davao City.", ['S33'], 'DOH regional office, as reported in the news', None, 2023, ('data',))
add('region-tondo', 'regional', "Tondo, Manila: 1,280 TB cases were logged (reported December 2024).",
    "Tondo, Maynila: 1,280 kaso ng TB ang naitala (iniulat noong Disyembre 2024).", ['S34'], 'As reported in the news', None, 2024, ('data',))
add('survey-2016', 'regional', f"In the 2016 national survey, {c(ps['overall']['per_100k'])} per 100,000 adults had lab-confirmed lung TB: {c(ps['men']['per_100k'])} among men and {ps['women']['per_100k']} among women.",
    f"Sa pambansang survey noong 2016, {c(ps['overall']['per_100k'])} bawat 100,000 na nasa hustong gulang ang may lab-confirmed na TB sa baga: {c(ps['men']['per_100k'])} sa mga lalaki at {ps['women']['per_100k']} sa mga babae.", ['S1'], 'National prevalence survey', 'prevalence_survey_2016', 2016, ('data',))
out = dict(meta=dict(title='TB PH claims registry', generated='2026-10-30', count=len(C),
  rule='Only show a claim with its source link. Numbers come from tb-ph-data.json. Regional snapshots come from different years and sources; always show the period.'),
  sources={k_: dict(title=v[0], url=v[1]) for k_, v in S.items()}, claims=C)
json.dump(out, open('data/claims.json','w'), indent=1, ensure_ascii=False)
bad = [x['id'] for x in C for s in x['sources'] if s not in S]
print('claims:', len(C), '| missing sources:', bad, '| topics:', sorted(set(x['topic'] for x in C)))
