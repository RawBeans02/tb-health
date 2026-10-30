# TB PH — Content & Data Pack

Version 1 — 23 October 2026. "TB PH" is a placeholder name until stakeholders choose one.

## 0. How to use this file

**For Claude Design.** Attach this file together with `tb-ph-data.json` and `tb-dots-facilities-SAMPLE.json`. Every piece of visible copy is here in English (**EN**) and Filipino (**FIL**). Use the numbers exactly as written. Do not invent or round statistics differently, and do not add facts that aren't in this file.

**For the team.** Anything tagged **[REVIEW]** needs a clinician's check, and anything tagged **[VERIFY]** needs a fact check before launch (full list in Section 11). Source tags such as [S1] point to Section 10. Section 7 holds every data table; `tb-ph-data.json` holds the same data in machine-readable form.

**Data vintage.** Burden estimates come from the WHO *Global Tuberculosis Report 2025* (published 12 Nov 2025, covering 2024), the latest edition as of this writing. The facility list is PhilHealth's update of 30 Sep 2026. Monthly notifications run to January 2026.

## 1. Site map and global copy

| Page | Path | EN nav label | FIL nav label |
|---|---|---|---|
| Home | `/` | Home | Simula |
| Learn | `/learn` | Learn about TB | Alamin ang TB |
| Screening | `/check` | Check symptoms | Suriin ang sintomas |
| Facility finder | `/find` | Find a TB-DOTS center | Hanapin ang TB-DOTS center |
| Data | `/data` | The data | Ang datos |
| About | `/about` | About | Tungkol sa amin |

**Language toggle.** Label: "English" / "Filipino". Accessible name: "Language / Wika". Default English. Switching keeps the reader on the same section.

**Safety line (footer of every page)**
- EN: This site gives general information. It is not a diagnosis. If you've had a cough for 2 weeks or more, get tested — it's free at public health centers.
- FIL: Pangkalahatang impormasyon lamang ang nasa site na ito; hindi ito diyagnosis. Kung dalawang linggo ka nang inuubo o higit pa, magpasuri — libre ito sa mga pampublikong health center.

**Emergency line (footer)**
- EN: Emergency? Call 911.
- FIL: Emergency? Tumawag sa 911.

**Data credit (footer)**
- EN: Data: WHO Global Tuberculosis Report 2025, DOH, PhilHealth. Last updated 23 October 2026.
- FIL: Datos: WHO Global Tuberculosis Report 2025, DOH, PhilHealth. Huling update: 23 Oktubre 2026.

## 2. Home — the story in seven beats

A scroll-through story. One visual carries it: a field of **724 dots, each dot = 1,000 people** who fell ill with TB in 2024. Later beats recolor parts of the same field instead of switching to new charts. All numbers bind to `headline_2024` in `tb-ph-data.json`.

**Beat 1 — hero**
- EN headline: In 2024, about 724,000 Filipinos fell ill with TB.
- EN line: Each dot is 1,000 people.
- FIL headline: Noong 2024, tinatayang 724,000 Pilipino ang nagkasakit ng TB.
- FIL line: Bawat tuldok ay 1,000 katao.
- Small print EN: WHO estimate. The true number is likely between 399,000 and 1.18 million.
- Small print FIL: Tantiya ng WHO. Malamang na nasa pagitan ng 399,000 at 1.18 milyon ang tunay na bilang.
- Data: `estimated_cases` 723,902 (range 398,854–1,175,835).

**Beat 2 — scale**
- EN: That's about 2,000 people every day — more than one every minute.
- FIL: Mga 2,000 katao iyan bawat araw — higit sa isa kada minuto.
- Data: `cases_per_day` 1,978.

**Beat 3 — the missing**
- EN headline: One in four was never found.
- EN line: About 179,000 people with TB weren't diagnosed or weren't reported in 2024. Without treatment, they stay sick and can keep spreading it.
- FIL headline: Isa sa bawat apat ang hindi natagpuan.
- FIL line: Mga 179,000 taong may TB ang hindi na-diagnose o hindi naiulat noong 2024. Kapag hindi nagamot, patuloy silang may sakit at maaaring makahawa pa.
- Visual: 179 dots turn hollow. Data: `not_reached` 178,954; `treatment_coverage_pct` 75.3.

**Beat 4 — the deaths**
- EN headline: TB took about 37,000 lives — nearly 100 every day.
- FIL headline: Mga 37,000 buhay ang kinuha ng TB — halos 100 bawat araw.
- Visual: 37 dots turn solid ink. Data: `estimated_deaths` 37,404; `deaths_per_day_hiv_negative` 98 (WHO and DOH quote 98 a day) [S12].

**Beat 5 — the comparison**
- EN headline: The Philippines has the 3rd-most TB cases in the world, and the highest TB rate in Southeast Asia.
- FIL headline: Pangatlo ang Pilipinas sa pinakamaraming kaso ng TB sa mundo, at pinakamataas ang antas ng TB nito sa Timog-Silangang Asya.
- Visual: one compact bar chart of Southeast Asian rates per 100,000 (`global_comparison.southeast_asia_rates`): Philippines 625, Timor-Leste 496, Myanmar 482, Indonesia 382 … Singapore 43.

**Beat 6 — the direction**
- EN headline: Since 2015, our TB rate rose 14%. The world's fell 12%.
- FIL headline: Mula 2015, tumaas nang 14% ang antas ng TB sa atin. Sa buong mundo, bumaba ito nang 12%.
- Visual: two lines indexed to 2015 = 100. Data: `incidence_rate_change_since_2015_pct` +13.6; `global_2024.rate_change_since_2015_pct` −12.3.

**Beat 7 — the turn**
- EN headline: TB is curable. Testing and treatment are free at public health centers.
- EN line: A cough that lasts 2 weeks deserves a test.
- EN buttons: Check your symptoms / Find a TB-DOTS center
- FIL headline: Nagagamot ang TB. Libre ang pagsusuri at gamutan sa mga pampublikong health center.
- FIL line: Ang ubong umabot na nang dalawang linggo ay dapat ipasuri.
- FIL buttons: Suriin ang iyong sintomas / Hanapin ang TB-DOTS center
- Sources line EN: Sources: WHO Global Tuberculosis Report 2025 (2024 estimates), DOH. Details on the Data page.
- Sources line FIL: Pinagmulan: WHO Global Tuberculosis Report 2025 (tantiya para sa 2024), DOH. Detalye sa pahinang Datos.

## 3. Learn — Alamin ang TB

Ten short sections. Keep paragraphs short; the audience includes patients, families, BHWs and students.

### L1. What is TB? / Ano ang TB?
- EN: Tuberculosis (TB) is an infection caused by bacteria called *Mycobacterium tuberculosis*. It most often affects the lungs, but it can also affect other parts of the body, such as the lymph nodes, bones or brain. TB is preventable and curable. [S2]
- EN: Being infected is not the same as being sick. About a quarter of the world's people carry TB germs without being ill, and they can't spread it. Only about 5–10% of them will get sick in their lifetime. The risk is higher when the immune system is weak. [S2]
- FIL: Ang tuberkulosis (TB) ay impeksiyong dulot ng bacteria na tinatawag na *Mycobacterium tuberculosis*. Kadalasang tinatamaan nito ang baga, pero maaari rin nitong tamaan ang ibang bahagi ng katawan gaya ng kulani, buto o utak. Naiiwasan at nagagamot ang TB.
- FIL: Magkaiba ang pagkakaroon ng impeksiyon at ang pagkakasakit. Tinatayang isa sa bawat apat na tao sa mundo ang may dalang mikrobyo ng TB nang hindi nagkakasakit, at hindi sila nakakahawa. Mga 5–10% lang sa kanila ang magkakasakit sa buong buhay nila. Mas mataas ang panganib kapag mahina ang resistensya.

### L2. How it spreads / Paano ito kumakalat
- EN: TB spreads through the air. When someone with TB in the lungs coughs, sneezes or spits, tiny droplets carry the germs, and people nearby breathe them in. Inhaling just a few germs is enough to get infected. That's why TB passes most easily between people who share a room for a long time — at home, at work and in crowded places. [S2]
- EN: TB does not spread through handshakes, shared plates or utensils, or by letting sweat dry on your back. [S7][S11]
- FIL: Kumakalat ang TB sa hangin. Kapag umubo, bumahing o dumura ang taong may TB sa baga, napupunta sa hangin ang maliliit na patak na may dalang mikrobyo, at nalalanghap ito ng mga taong malapit. Kaunting mikrobyo lang ang kailangang malanghap para mahawa. Kaya pinakamadaling magkahawaan ang mga taong matagal na magkasama sa iisang kuwarto — sa bahay, sa trabaho at sa mataong lugar.
- FIL: Hindi naipapasa ang TB sa pakikipagkamay, sa paghiram ng plato o kubyertos, o sa pagpapatuyo ng pawis sa likod.

### L3. Signs and symptoms / Mga senyales at sintomas
- EN: The most common sign is a cough that lasts 2 weeks or more, with or without phlegm. Other signs are fever with no clear cause, night sweats, weight loss without trying, coughing up blood, chest pain, feeling weak or tired, and loss of appetite. [S2][S5]
- EN: Symptoms can stay mild for months, so many people wait too long. Many Filipinos treat a long cough as an ordinary one and buy cough medicine instead of getting checked. [S2][S9]
- EN (children): In children, watch for a cough or wheezing that lasts 2 weeks or more, fever with no clear cause for 2 weeks or more, weight loss or not gaining weight, being unusually tired or less playful, not getting better after antibiotics, or not recovering 2 weeks after a viral illness like the flu. [S6]
- FIL: Ang pinakakaraniwang senyales ay ubo na tumatagal nang dalawang linggo o higit pa, may plema man o wala. Kabilang sa iba pang senyales ang lagnat na hindi alam ang dahilan, pagpapawis sa gabi, pagbaba ng timbang kahit hindi nagdidiyeta, pag-ubo ng dugo, pananakit ng dibdib, panghihina o madaling mapagod, at kawalan ng gana sa pagkain.
- FIL: Maaaring banayad lang ang mga sintomas sa loob ng ilang buwan, kaya maraming naghihintay nang matagal. Maraming Pilipino ang nag-aakalang ordinaryong ubo lang ito at bumibili ng gamot sa ubo sa halip na magpatingin.
- FIL (mga bata): Sa mga bata, bantayan ang ubo o paghuni sa paghinga (wheezing) na tumatagal nang dalawang linggo o higit pa, lagnat na hindi alam ang dahilan nang dalawang linggo o higit pa, pagbaba ng timbang o hindi pagbigat, pagiging matamlay o hindi na masyadong naglalaro, hindi paggaling kahit uminom ng antibiotic, o hindi pagbalik ng dating lakas dalawang linggo matapos ang trangkaso o ibang viral na sakit.

### L4. Who's at higher risk / Sino ang mas nanganganib
- EN: Anyone can get TB. The risk is higher for people who live with or care for someone with TB; people living with HIV; people with diabetes; people who are undernourished; people who smoke or drink heavily; people treated for TB before; older adults; young children, especially under 5, who live with someone with TB; people whose immunity is weakened by medicines such as steroids or cancer treatment; and people in crowded places such as jails, as well as health workers. [S2][S6][S10]
- EN: WHO estimates that in 2024, about 71,000 TB cases in the Philippines were linked to alcohol use disorders, 67,000 to smoking, 61,000 to undernutrition, 53,000 to diabetes and 4,600 to HIV. These overlap, so they don't add up to a total. [S1]
- FIL: Kahit sino ay maaaring magka-TB. Mas mataas ang panganib para sa mga nakatira o nag-aalaga ng taong may TB; mga taong may HIV; mga may diabetes; mga kulang sa nutrisyon; mga naninigarilyo o malakas uminom ng alak; mga dati nang nagamot sa TB; matatanda; maliliit na bata, lalo na ang wala pang 5 taong gulang, na kasama sa bahay ang taong may TB; mga humina ang resistensya dahil sa gamot gaya ng steroids o gamutan sa kanser; at mga nasa mataong lugar gaya ng kulungan, pati na ang mga health worker.
- FIL: Tantiya ng WHO para sa Pilipinas noong 2024: mga 71,000 kaso ng TB ang may kaugnayan sa labis na pag-inom ng alak, 67,000 sa paninigarilyo, 61,000 sa kakulangan sa nutrisyon, 53,000 sa diabetes at 4,600 sa HIV. Nagsasapawan ang mga ito, kaya hindi sila dapat pagsamahin.

### L5. Getting tested — it's free / Magpasuri — libre ito
- EN: If you've had a cough for 2 weeks or more, or any of the signs above, go to your barangay health station, rural health unit, city health center or a TB-DOTS center. Testing is free at public facilities. [S11][S15]
- The steps below are a real sequence, so numbering is appropriate:
  1. EN: A health worker asks about your symptoms and may send you for a chest X-ray. PhilHealth's Konsulta package covers chest X-rays for registered members. [S13]
     FIL: Tatanungin ka ng health worker tungkol sa iyong mga sintomas at maaaring ipa-chest X-ray ka. Sakop ng Konsulta package ng PhilHealth ang chest X-ray para sa mga rehistradong miyembro.
  2. EN: You give a sputum (phlegm) sample. It's checked with a rapid molecular test such as Xpert MTB/RIF or TB-LAMP. Xpert can also show whether the TB resists rifampicin, a key TB medicine. [S5][S12]
     FIL: Magbibigay ka ng sample ng plema. Susuriin ito gamit ang mabilis na molecular test gaya ng Xpert MTB/RIF o TB-LAMP. Kaya ring ipakita ng Xpert kung hindi tinatablan ng rifampicin — isang mahalagang gamot sa TB — ang iyong TB.
  3. EN: If you have TB, treatment starts right away, at the same center or one near your home.
     FIL: Kung may TB ka, magsisimula agad ang gamutan, sa parehong center o sa malapit sa inyong bahay.
- EN: DOH also brings free screening to communities, including portable chest X-rays read with the help of AI. [S12]
- FIL: Kung dalawang linggo ka nang inuubo o higit pa, o may alinman sa mga senyales sa itaas, pumunta sa barangay health station, rural health unit, city health center o TB-DOTS center. Libre ang pagsusuri sa mga pampublikong pasilidad.
- FIL: Nagdadala rin ang DOH ng libreng screening sa mga komunidad, kabilang ang portable chest X-ray na binabasa sa tulong ng AI.

### L6. Treatment / Gamutan  [REVIEW]
- EN: TB is curable with the right medicines, taken every day for the full course.
- EN: Most TB (drug-susceptible TB) is treated with 6 months of daily pills. Children with non-severe TB can now be treated in 4 months. [S12]
- EN: TB medicines are free at public health centers and TB-DOTS centers. PhilHealth also has an outpatient TB-DOTS benefit package at accredited centers (₱5,200 as of November 2024). [S11][S13][S15]
- EN: DOTS stands for "directly observed treatment, short-course": a health worker or treatment supporter helps you take your medicines and checks how you're doing.
- EN: Most people feel better within a few weeks. Keep going anyway — stopping early can bring TB back and make it resistant to medicines.
- EN: Tell your health worker right away if you notice yellow eyes or skin, a bad rash, changes in your eyesight, numbness, or vomiting that won't stop. Orange-red urine is a common, harmless effect of rifampicin.
- FIL: Nagagamot ang TB sa tamang gamot na iniinom araw-araw hanggang matapos ang buong gamutan.
- FIL: Ang karaniwang TB (drug-susceptible TB) ay ginagamot sa loob ng 6 na buwan ng araw-araw na pag-inom ng gamot. Ang mga batang may hindi malubhang TB ay maaari nang gamutin sa loob ng 4 na buwan.
- FIL: Libre ang gamot sa TB sa mga pampublikong health center at TB-DOTS center. May outpatient TB-DOTS benefit package din ang PhilHealth sa mga accredited na center (₱5,200 noong Nobyembre 2024).
- FIL: Ang DOTS ay "directly observed treatment, short-course": may health worker o treatment supporter na tutulong sa pag-inom mo ng gamot at titingin sa kalagayan mo.
- FIL: Karamihan ay bumubuti ang pakiramdam sa loob ng ilang linggo. Ituloy pa rin — kapag huminto nang maaga, maaaring bumalik ang TB at hindi na ito tablan ng gamot.
- FIL: Sabihin agad sa health worker kung naninilaw ang mata o balat, may malalang pantal, nagbabago ang paningin, namamanhid, o paulit-ulit na nagsusuka. Karaniwan at hindi delikado ang pagiging kulay kahel o mamula-mula ng ihi dahil sa rifampicin.

### L7. Drug-resistant TB / Drug-resistant TB
- EN: Drug-resistant TB (DR-TB) doesn't respond to rifampicin, one of the main TB medicines. It can develop when treatment is stopped early or taken incorrectly, or it can be caught from someone who has DR-TB. In 2024, an estimated 27,900 Filipinos developed it, but only about 7,500 were confirmed by a laboratory. The Philippines now uses an all-oral regimen that shortens DR-TB treatment from 2 years to 6 months. [S1][S12]
- FIL: Ang drug-resistant TB (DR-TB) ay hindi tinatablan ng rifampicin, isa sa mga pangunahing gamot sa TB. Maaari itong mangyari kapag itinigil nang maaga o mali ang pag-inom ng gamot, o maaari itong makuha sa taong may DR-TB. Noong 2024, tinatayang 27,900 Pilipino ang nagkaroon nito, pero mga 7,500 lang ang nakumpirma ng laboratoryo. Gumagamit na ang Pilipinas ng gamutang puro iniinom (all-oral) na nagpapaikli sa gamutan ng DR-TB mula 2 taon tungo sa 6 na buwan.

### L8. Preventing TB / Pag-iwas sa TB
- EN: Finding and treating TB early is the most effective way to stop it from spreading.
- EN: Let fresh air in. Open windows — TB germs build up in closed, crowded rooms.
- EN: Cover your cough, and wear a mask while you're coughing.
- EN: If someone at home has TB, everyone in the household should be checked. Some may be offered TB preventive treatment (TPT), a short course of medicine that keeps an infection from turning into disease. In 2024, 77,195 household contacts started TPT. [S1][S12]
- EN: The BCG vaccine, given to newborns, protects young children from severe forms of TB. There is still no vaccine for adults. [S2][S16]
- FIL: Ang maagang paghahanap at paggamot sa TB ang pinakamabisang paraan para mapigilan ang pagkalat nito.
- FIL: Papasukin ang sariwang hangin. Buksan ang mga bintana — naiipon ang mikrobyo ng TB sa saradong kuwartong maraming tao.
- FIL: Takpan ang bibig kapag umuubo, at magsuot ng mask habang inuubo.
- FIL: Kung may TB ang isang kasama sa bahay, dapat ipasuri ang lahat ng nasa bahay. Maaaring bigyan ang ilan ng TB preventive treatment (TPT), isang maikling gamutan na pumipigil na maging sakit ang impeksiyon. Noong 2024, 77,195 na kasama sa bahay ng mga pasyente ang nagsimula ng TPT.
- FIL: Ang bakunang BCG na ibinibigay sa mga bagong silang ay nagpoprotekta sa maliliit na bata laban sa malulubhang uri ng TB. Wala pang bakuna para sa mga nasa hustong gulang.

### L9. Living with TB / Pamumuhay nang may TB
- EN: Having TB is not your fault, and it doesn't define you. With treatment, people go back to school, work and family life. TB doesn't choose between rich and poor. [S11]
- EN: TB can still cost families a lot even when the medicines are free — fares, lost income, food. In the first national patient cost survey, 42% of TB-affected households faced catastrophic costs, meaning TB costs above 20% of yearly household income. For drug-resistant TB, it was 90%. Ask your health center what support is available in your area. [S17]
- FIL: Hindi mo kasalanan ang pagkakaroon ng TB, at hindi ito ang buong pagkatao mo. Sa tulong ng gamutan, nakababalik ang mga tao sa pag-aaral, trabaho at buhay-pamilya. Walang pinipili ang TB, mayaman man o mahirap.
- FIL: Malaki pa rin ang gastos ng TB sa mga pamilya kahit libre ang gamot — pamasahe, nawawalang kita, pagkain. Sa unang pambansang survey ng gastos ng mga pasyente, 42% ng mga sambahayang may TB ang nakaranas ng "catastrophic" na gastos, ibig sabihin ay lumampas sa 20% ng taunang kita ng sambahayan ang gastos sa TB. Sa drug-resistant TB, 90% ito. Itanong sa inyong health center kung anong tulong ang mayroon sa inyong lugar.

### L10. Myths and facts / Mga maling akala at ang totoo

| # | Myth (EN) | Fact (EN) | Maling akala (FIL) | Ang totoo (FIL) | Source |
|---|---|---|---|---|---|
| 1 | TB is hereditary. | TB is caused by germs that spread through the air, not by genes. Families catch it from each other because they share the same air at home. | Namamana ang TB. | Mikrobyong kumakalat sa hangin ang sanhi ng TB, hindi ang lahi. Nagkakahawaan ang magkakapamilya dahil iisang hangin ang nilalanghap nila sa bahay. | [S2][S18] |
| 2 | You can catch TB from shared plates, glasses or utensils. | TB doesn't spread through plates or utensils. It spreads through the air. | Nakukuha ang TB sa paghiram ng plato, baso o kubyertos. | Hindi naipapasa ang TB sa plato o kubyertos. Sa hangin ito kumakalat. | [S7][S11] |
| 3 | Shaking hands with or touching someone with TB will infect you. | Touch doesn't spread TB. | Mahahawa ka kapag nakipagkamay o humawak sa taong may TB. | Hindi naipapasa ang TB sa paghawak. | [S7] |
| 4 | Letting sweat dry on your back causes TB. | Sweat has nothing to do with TB. Only TB germs cause TB. | Nagkaka-TB kapag natuyuan ng pawis ang likod. | Walang kinalaman ang pawis sa TB. Mikrobyo ng TB lang ang sanhi nito. | [S7] |
| 5 | Only poor people get TB. | TB doesn't discriminate. It's found in every part of society. | Mahihirap lang ang nagkaka-TB. | Walang pinipili ang TB. Matatagpuan ito sa lahat ng sektor ng lipunan. | [S9][S11] |
| 6 | Children can't get TB. | They can. WHO estimates that about 73,000 Filipino children under 15 fell ill with TB in 2024. | Hindi nagkaka-TB ang mga bata. | Nagkakaroon. Tantiya ng WHO, mga 73,000 batang Pilipino na wala pang 15 taong gulang ang nagka-TB noong 2024. | [S1][S19] |
| 7 | A long cough is just a cough; cough syrup will fix it. | A cough that lasts 2 weeks or more needs a TB test, not just cough medicine. | Ubo lang 'yan; gagaling din sa gamot sa ubo. | Ang ubong tumatagal nang dalawang linggo o higit pa ay kailangang ipasuri para sa TB, hindi lang basta gamutin ng gamot sa ubo. | [S5][S9] |
| 8 | Once you feel better, you can stop the medicines. | Finish the full course. Stopping early can bring TB back stronger and resistant to medicines. | Kapag maganda na ang pakiramdam, puwede nang itigil ang gamot. | Tapusin ang buong gamutan. Kapag itinigil nang maaga, maaaring bumalik ang TB nang mas malala at hindi na tablan ng gamot. | [S11][S12] |
| 9 | TB can't be cured, and treatment is expensive. | TB is curable, and testing and medicines are free at public health centers and TB-DOTS centers. | Hindi na gumagaling ang TB, at mahal ang gamutan. | Nagagamot ang TB, at libre ang pagsusuri at gamot sa mga pampublikong health center at TB-DOTS center. | [S11][S15] |

## 4. Check symptoms — the guided screening flow  [REVIEW]

**Basis.** The DOH definition of presumptive pulmonary TB: two weeks or longer of any of cough, unexplained fever, unexplained weight loss or night sweats, or a chest X-ray finding suggestive of TB [S5]. The child criteria follow the NTP list [S6]. Danger signs are standard triage. Partner-hospital clinicians must review this section before launch.

**Rules for the build**
- One question per screen. Show a step counter ("Step 3 of 6"), because this is a real sequence. Include a Back button and large tap targets.
- Answers live only in page memory. Nothing is sent, logged or stored, and no analytics events carry answers. Reloading the page clears everything.
- Path is set by Q1: **adult** (15 and older) or **child** (under 15). For "another adult," show this line under each question. EN: "Answer for the person you're checking for." FIL: "Sagutin para sa taong sinusuri mo."
- Any multi-select includes "None of these / Wala sa mga ito," which clears the other choices.

### Screen 0 — Intro
- EN title: Check your symptoms
- EN body: Answer a few questions to see whether you should get tested for TB. It takes about 2 minutes. This is not a diagnosis — only a test can tell whether you have TB.
- EN privacy line: Your answers stay on your device. We don't save or send them.
- EN button: Start
- FIL title: Suriin ang iyong sintomas
- FIL body: Sagutin ang ilang tanong para malaman kung dapat kang magpasuri para sa TB. Mga 2 minuto lang ito. Hindi ito diyagnosis — pagsusuri lang ang makapagsasabi kung may TB ka.
- FIL privacy line: Mananatili lang sa iyong device ang mga sagot mo. Hindi namin ito sine-save o ipinapadala.
- FIL button: Simulan

### Q1 — Who is this for? (single choice)
| Key | EN | FIL |
|---|---|---|
| self | Myself (15 or older) | Para sa akin (15 taong gulang pataas) |
| other_adult | Another adult (15 or older) | Para sa ibang nasa hustong gulang (15 pataas) |
| child | A child (under 15) | Para sa isang bata (wala pang 15 taong gulang) |

- EN question: Who are you checking for?
- FIL question: Para kanino ang pagsusuring ito?

### Q2 — Danger signs right now (multi-select)
- EN question: Right now, is there any of these?
- FIL question: Sa ngayon, mayroon ba nito?

| Key | Path | EN | FIL |
|---|---|---|---|
| blood_lots | adult | Coughing up a lot of blood | Umuubo ng maraming dugo |
| breath | both | Severe difficulty breathing | Matinding hirap sa paghinga |
| chest | adult | Severe chest pain | Matinding pananakit ng dibdib |
| drowsy | both | Very drowsy, confused or hard to wake | Sobrang antok, nalilito o mahirap gisingin |
| no_drink | child | Can't drink or breastfeed | Hindi makainom o makasuso |
| vomit_all | child | Vomits everything | Isinusuka ang lahat ng kinakain o iniinom |
| convulsions | child | Has had convulsions (seizures) | Nagkaroon ng kombulsiyon (seizure) |

### Q3 — Symptoms for 2 weeks or more (multi-select)
Adult path:
- EN question: For 2 weeks or more, have you had any of these?
- FIL question: Sa loob ng dalawang linggo o higit pa, nagkaroon ka ba ng alinman dito?

| Key | EN | FIL |
|---|---|---|
| cough | Cough, with or without phlegm | Ubo, may plema man o wala |
| fever | Fever with no clear cause | Lagnat na hindi alam ang dahilan |
| weight | Weight loss without trying | Pagbaba ng timbang kahit hindi nagdidiyeta |
| sweats | Night sweats | Pagpapawis sa gabi |

Child path:
- EN question: For 2 weeks or more, has the child had any of these?
- FIL question: Sa loob ng dalawang linggo o higit pa, nagkaroon ba ang bata ng alinman dito?

| Key | EN | FIL |
|---|---|---|
| c_cough | Cough or wheezing that isn't getting better | Ubo o paghuni sa paghinga (wheezing) na hindi gumagaling |
| c_fever | Fever with no clear cause | Lagnat na hindi alam ang dahilan |
| c_weight | Weight loss or not gaining weight | Pagbaba ng timbang o hindi pagbigat |
| c_tired | Unusually tired or less playful | Matamlay o hindi na masyadong naglalaro |
| c_antibiotic | Not getting better after antibiotics | Hindi gumaling kahit uminom ng antibiotic |
| c_viral | Not back to normal 2 weeks after a viral illness such as the flu | Hindi pa bumabalik sa dati, dalawang linggo matapos ang trangkaso o ibang viral na sakit |

**Q3b (adult path only) — blood.**
- EN question: Have you coughed up blood recently, even a small amount?
- FIL question: Nakaubo ka ba ng dugo kamakailan, kahit kaunti?
- Options: Yes / Oo, No / Hindi.

### Q4 — Recent symptoms (only shown if Q3 = none)
- EN question: Do you have a cough, fever, night sweats or weight loss right now, even if it started less than 2 weeks ago?
- FIL question: May ubo, lagnat, pagpapawis sa gabi o pagbaba ng timbang ka ba ngayon, kahit wala pang dalawang linggo?
- Child version EN: Does the child have a cough, fever or weight loss right now, even if it started less than 2 weeks ago?
- Child version FIL: May ubo, lagnat o pagbaba ng timbang ba ang bata ngayon, kahit wala pang dalawang linggo?
- Options: Yes / Oo, No / Hindi.

### Q5 — Chest X-ray (adult path)
- EN question: Did a chest X-ray in the past year show something that might be TB?
- FIL question: May nakita bang posibleng TB sa chest X-ray mo sa nakalipas na isang taon?
- Options: Yes / Oo; No / Wala; I'm not sure / Hindi ako sigurado; I haven't had one / Hindi pa ako nagpa-X-ray

### Q6 — Risk factors (multi-select)
- EN question: Do any of these apply?
- FIL question: Alin dito ang totoo para sa iyo?
- Child version FIL: Alin dito ang totoo para sa bata?

| Key | Path | High risk? | EN | FIL |
|---|---|---|---|---|
| contact | both | yes | Lives with, or spends a lot of time with, someone who has TB (now or in the last 2 years) | Nakatira o madalas kasama ang taong may TB (ngayon o sa nakalipas na 2 taon) |
| dr_contact | both (shown only if contact) | yes | That person has drug-resistant TB | Drug-resistant TB ang sakit ng taong iyon |
| hiv | both | yes | Has HIV | May HIV |
| diabetes | adult | yes | Has diabetes | May diabetes |
| prev_tb | both | yes | Was treated for TB before | Dati nang nagamot sa TB |
| age60 | adult | yes | Is 60 or older | 60 taong gulang pataas |
| under5 | child | yes | Is under 5 years old | Wala pang 5 taong gulang |
| underweight | both | yes | Is very thin or undernourished | Sobrang payat o kulang sa nutrisyon |
| immuno | both | yes | Takes medicines that weaken immunity (such as steroids or cancer treatment), or is on dialysis | Umiinom ng gamot na nagpapahina ng resistensya (gaya ng steroids o gamot sa kanser), o nagda-dialysis |
| smoke_alcohol | adult | no | Smokes, or drinks alcohol heavily | Naninigarilyo, o malakas uminom ng alak |
| crowded | adult | no | Lives or works in a crowded place (jail, dormitory, shelter), or is a health worker | Nakatira o nagtatrabaho sa mataong lugar (kulungan, dormitoryo, shelter), o health worker |

### Decision logic (evaluate top to bottom; first match wins)

| Order | Condition | Result |
|---|---|---|
| 1 | Any Q2 danger sign | **URGENT** |
| 2 | Any Q3 symptom, OR Q3b = yes, OR Q5 = yes | **A — Get tested this week** |
| 3 | Q4 = yes AND any high-risk factor | **B — Get checked soon** |
| 4 | Any Q6 risk factor | **C — No signs now; ask about screening** |
| 5 | Everything else | **D — No signs of TB right now** |

Add-on notes, shown inside the result when they apply:
- **blood** (Q3b = yes): show "go today or tomorrow".
- **dr** (prev_tb or dr_contact): show the drug-resistance note.
- **hiv**: show the HIV note.
- **child path**: show the child note.
- **xray_unsure** (Q5 = not sure): show the X-ray tip.
- **recent** (Q4 = yes, on result D): show the recent-symptoms line.

### Result screens

**URGENT**
- EN title: Get emergency care now.
- EN body: These signs need urgent attention. Go to the nearest hospital emergency room, or call 911.
- EN button: Call 911
- FIL title: Magpatingin agad sa emergency.
- FIL body: Kailangan ng agarang atensiyon ang mga senyales na ito. Pumunta sa emergency room ng pinakamalapit na ospital, o tumawag sa 911.
- FIL button: Tumawag sa 911

**A — Get tested this week**
- EN title: Get tested for TB this week.
- EN body: Your answers match the signs health workers look for. Only a test can tell whether it's TB, and testing is free at public health centers.
- EN steps:
  1. Go to your health center or a TB-DOTS center.
  2. Bring your summary and say how long you've had the symptoms.
  3. Wear a mask and cover your cough until you get your results.
- EN buttons: Find a TB-DOTS center / Save my summary
- FIL title: Magpasuri para sa TB ngayong linggo.
- FIL body: Tugma ang mga sagot mo sa mga senyales na hinahanap ng mga health worker. Pagsusuri lang ang makapagsasabi kung TB ito, at libre ang pagsusuri sa mga pampublikong health center.
- FIL steps:
  1. Pumunta sa inyong health center o sa isang TB-DOTS center.
  2. Dalhin ang iyong buod at sabihin kung gaano katagal na ang mga sintomas.
  3. Magsuot ng mask at takpan ang bibig kapag umuubo habang hinihintay ang resulta.
- FIL buttons: Hanapin ang TB-DOTS center / I-save ang aking buod

**B — Get checked soon**
- EN title: Get checked soon.
- EN body: Your symptoms are recent, but you're at higher risk of TB, and for people at higher risk even a short cough matters. Ask your health center about a chest X-ray.
- FIL title: Magpatingin sa lalong madaling panahon.
- FIL body: Bago pa lang ang mga sintomas mo, pero mas mataas ang panganib mong magka-TB, at para sa mga nasa mas mataas na panganib, mahalaga kahit maikling ubo. Itanong sa inyong health center ang tungkol sa chest X-ray.

**C — No signs now; ask about screening**
- EN title: No signs of TB right now — but ask about screening.
- EN body: You're at higher risk of TB, so ask your health center about a TB check. If someone at home has TB, everyone in the household should be screened, and some may be offered TB preventive treatment (TPT).
- FIL title: Walang senyales ng TB sa ngayon — pero magtanong tungkol sa screening.
- FIL body: Mas mataas ang panganib mong magka-TB, kaya itanong sa inyong health center ang tungkol sa TB check. Kung may TB ang isang kasama sa bahay, dapat ipa-screen ang lahat ng nasa bahay, at maaaring bigyan ang ilan ng TB preventive treatment (TPT).

**D — No signs of TB right now**
- EN title: No signs of TB right now.
- EN body: Watch for these signs: a cough for 2 weeks or more, fever, night sweats or weight loss. If any of them lasts 2 weeks, get tested — it's free.
- FIL title: Walang senyales ng TB sa ngayon.
- FIL body: Bantayan ang mga senyales na ito: ubo nang dalawang linggo o higit pa, lagnat, pagpapawis sa gabi o pagbaba ng timbang. Kung tumagal ang alinman nang dalawang linggo, magpasuri — libre ito.

**Add-on notes**
- blood
  - EN: Because you coughed up blood, go today or tomorrow.
  - FIL: Dahil nakaubo ka ng dugo, magpatingin ngayon o bukas.
- dr
  - EN: Tell the health worker that you were treated for TB before, or that you were exposed to drug-resistant TB. You may need a test that also checks for drug resistance.
  - FIL: Sabihin sa health worker na dati ka nang nagamot sa TB, o na na-expose ka sa drug-resistant TB. Maaaring kailanganin mo ng pagsusuring titingin din kung drug-resistant ito.
- hiv
  - EN: Because you have HIV, tell your HIV care provider about these symptoms too.
  - FIL: Dahil may HIV ka, ipaalam din ang mga sintomas na ito sa iyong HIV care provider.
- child
  - EN: Bring the child to your health center or a pediatrician, and mention anyone at home who has TB.
  - FIL: Dalhin ang bata sa inyong health center o sa pediatrician, at banggitin kung may kasama sa bahay na may TB.
- xray_unsure
  - EN: Not sure about an old X-ray? Bring the result with you, or ask whether you need a new one.
  - FIL: Hindi sigurado sa lumang X-ray? Dalhin ang resulta, o itanong kung kailangan mo ng bago.
- recent
  - EN: Your symptoms started recently. If they last 2 weeks or more, get tested.
  - FIL: Bago pa lang ang mga sintomas mo. Kung tumagal ang mga ito nang dalawang linggo o higit pa, magpasuri.

**Footer on every result**
- EN: This is not a diagnosis. Based on DOH and WHO screening guidance. Medical review: [partner clinicians — pending].
- FIL: Hindi ito diyagnosis. Batay sa gabay ng DOH at WHO sa screening. Medical review: [mga katuwang na doktor — nakabinbin].

### Summary card (for results A, B, C and D)
- EN title: My TB check — show this to the health worker
- FIL title: Ang aking TB check — ipakita ito sa health worker
- Fields:
  - Date
  - Checked for: self, another adult, or child
  - Symptoms for 2 weeks or more
  - Blood in phlegm
  - Recent symptoms
  - Chest X-ray answer
  - Risk factors
  - Recommended next step
- Actions:
  - EN: Save as image / Print / Start over
  - FIL: I-save bilang larawan / I-print / Magsimula ulit
- Privacy reminder under the card:
  - EN: This summary exists only on your device.
  - FIL: Nasa iyong device lang ang buod na ito.

## 5. Find a TB-DOTS center

**Intro**
- EN: TB testing and treatment are free at public health centers and TB-DOTS centers. This list shows TB-DOTS clinics accredited by PhilHealth (update of 30 September 2026). Your barangay health station or rural health unit can help too. Call ahead to confirm their hours.
- FIL: Libre ang pagsusuri at gamutan sa TB sa mga pampublikong health center at TB-DOTS center. Makikita rito ang mga TB-DOTS clinic na accredited ng PhilHealth (update noong 30 Setyembre 2026). Makatutulong din ang inyong barangay health station o rural health unit. Tumawag muna para kumpirmahin ang kanilang oras.

**Interface copy**

| Element | EN | FIL |
|---|---|---|
| Search placeholder | Search by city, municipality or facility name | Maghanap ayon sa lungsod, bayan o pangalan ng pasilidad |
| Filter: region | Region | Rehiyon |
| Filter: province/city | Province or city | Probinsiya o lungsod |
| Filter: type | Government / Private | Pampubliko / Pribado |
| Result count | {n} centers | {n} na center |
| Card button | Call | Tumawag |
| Card button | Get directions | Paano pumunta |
| Card button | Copy address | Kopyahin ang address |
| Badge, government | Government — free TB care | Pampubliko — libreng gamutan sa TB |
| Badge, private | Private — fees may apply | Pribado — maaaring may bayad |
| Empty state | No centers match your search. Try a nearby city, or clear the filters. | Walang tumugma sa hinanap mo. Subukan ang kalapit na lungsod, o i-clear ang mga filter. |
| Data note | Facility details come from PhilHealth. If a number doesn't work, contact your city or municipal health office. | Galing sa PhilHealth ang detalye ng mga pasilidad. Kung hindi gumagana ang numero, makipag-ugnayan sa inyong city o municipal health office. |
| Overview map caption | PhilHealth-accredited TB-DOTS clinics per region | Bilang ng TB-DOTS clinic bawat rehiyon na accredited ng PhilHealth |

**Data notes for the build**
- Load `tb-dots-facilities.json` (full list, produced by `scrape_philhealth_tbdots.py`). Until that file exists, use `tb-dots-facilities-SAMPLE.json`, which has 93 real rows from 5 regions and the same fields.
- Fields: `name`, `sector`, `phone`, `email`, `street`, `city_municipality`, `province_or_city_group`, `region`, `region_code`, `accreditation_expiry`, `maps_url`, `source_updated`.
- Facility names are ALL CAPS in the source. Display them in title case, but keep the original for search.
- "Call" dials the first number in `phone` (split on "/", ";", "," or " to "). Some numbers are landlines without an area code. Metro Manila landlines are 8 digits; show the number as written.
- "Get directions" opens `maps_url`, a Google Maps search link; no API key or coordinates are needed.
- The overview map shows counts per region, computed from the facility file (`tb-dots-facilities-by-region.json`).
- Context: the National TB Program runs more than 3,300 TB-DOTS facilities [S20]. The PhilHealth list (about 2,100) covers only the accredited ones, so the copy shouldn't claim to list every place that treats TB.

## 6. The data — chart specs

**Intro**
- EN: These are the numbers behind TB in the Philippines. Most come from the World Health Organization's Global Tuberculosis Report 2025, which covers 2024. Estimates carry uncertainty, so we show ranges where they matter.
- FIL: Ito ang mga numero sa likod ng TB sa Pilipinas. Karamihan ay galing sa Global Tuberculosis Report 2025 ng World Health Organization, na sumasaklaw sa 2024. May kaakibat na di-katiyakan ang mga tantiya, kaya ipinapakita namin ang saklaw kapag mahalaga.

Each chart has a title, a one-line takeaway, a source line, and a "View as table" toggle. Data keys refer to `tb-ph-data.json`.

| ID | Title EN / FIL | Chart | Data key | Takeaway EN / FIL |
|---|---|---|---|---|
| D1 | TB is rising, not falling / Tumataas, hindi bumababa, ang TB | Line, 2010–2024, with shaded uncertainty band | `incidence_series` (rate, rate_lo, rate_hi) | 625 per 100,000 in 2024, up 14% since 2015. The band is WHO's uncertainty range. / 625 bawat 100,000 noong 2024, tumaas nang 14% mula 2015. Ang may-kulay na bahagi ay saklaw ng di-katiyakan ng WHO. |
| D2 | One in four is missed / Isa sa bawat apat ang hindi natutukoy | Two lines (estimated vs notified) with the gap shaded | `detection_gap_series` | 544,948 of about 723,900 were notified in 2024 (75%), up from 32% in 2010. COVID-19 pulled it back down to 42% in 2020. / 544,948 sa mga 723,900 ang naiulat noong 2024 (75%), mula 32% noong 2010. Bumaba ito sa 42% noong 2020 dahil sa COVID-19. |
| D3 | COVID-19 knocked out TB detection / Pinatumba ng COVID-19 ang pagtukoy sa TB | Monthly bars, Jan 2020 – Jan 2026 (2025–26 provisional) | `notifications_monthly` | Only 10,489 cases were notified in April 2020, the lowest month in this record. Notifications reached a record 575,770 in 2023. / 10,489 lang ang naiulat noong Abril 2020, ang pinakamababang buwan sa talaang ito. Umabot sa rekord na 575,770 ang naiulat noong 2023. |
| D4 | Deaths / Mga namatay | Line with band, 2010–2024 | `deaths_series` | About 37,400 deaths in 2024 (range 32,800–42,400), 25% more than in 2015. / Mga 37,400 ang namatay noong 2024 (saklaw: 32,800–42,400), 25% na mas marami kaysa noong 2015. |
| D5 | Who gets TB / Sino ang nagkaka-TB | Population pyramid (estimated), with a toggle to notified cases | `incidence_by_age_sex_2024`, `notifications_by_age_sex_2024` | Nearly 2 in 3 people who fall ill are men (64%). Working-age adults are hit hardest, and about 73,000 children under 15 fell ill. / Halos 2 sa bawat 3 nagkakasakit ay lalaki (64%). Pinakatinatamaan ang mga nasa edad ng pagtatrabaho, at mga 73,000 batang wala pang 15 ang nagkasakit. |
| D6 | What drives TB / Ano ang nagtutulak sa TB | Horizontal bars with range whiskers | `risk_factor_attributable_cases_2024` | Alcohol use, smoking, undernutrition and diabetes each account for tens of thousands of cases. They overlap, and the ranges are wide. / Tig-sampu-sampung libong kaso ang kaugnay ng alak, paninigarilyo, kakulangan sa nutrisyon at diabetes. Nagsasapawan ang mga ito at malawak ang saklaw. |
| D7 | Treatment works when people finish / Gumagana ang gamutan kapag tinapos | One stacked bar for the 2023 cohort, plus a success-rate line for 2012–2023 | `treatment_outcomes` | 84% of people who started treatment in 2023 were cured or completed it; 10.5% stopped before finishing. / 84% ng nagsimula ng gamutan noong 2023 ang gumaling o nakatapos; 10.5% ang huminto bago matapos. |
| D8 | Drug-resistant TB: most cases aren't found / Drug-resistant TB: karamihan ay hindi natutukoy | Funnel: estimated, then confirmed, then started treatment | `drug_resistant_tb` | About 27,900 estimated cases, 7,549 confirmed (27%) and 6,631 started treatment. The Philippines has 7.1% of the world's DR-TB, third highest. / Mga 27,900 ang tantiyang kaso, 7,549 ang nakumpirma (27%) at 6,631 ang nagsimula ng gamutan. Nasa Pilipinas ang 7.1% ng DR-TB sa mundo, pangatlo sa pinakamataas. |
| D9 | TB and HIV / TB at HIV | Three stat cards | `tb_hiv` | 67% of people notified with TB knew their HIV status; 2,762 were HIV-positive and 99% of them were on ART. / 67% ng mga naiulat na may TB ang alam ang kanilang HIV status; 2,762 ang HIV-positive at 99% sa kanila ang naka-ART. |
| D10 | Protecting households / Pagprotekta sa sambahayan | Funnel, plus a TPT line for 2019–2024 | `contacts_and_tpt_2024` | 165,430 household contacts were found, 125,060 screened, 3,220 found to have TB, and 77,195 started preventive treatment. / 165,430 kasama sa bahay ang natukoy, 125,060 ang na-screen, 3,220 ang natuklasang may TB, at 77,195 ang nagsimula ng preventive treatment. |
| D11 | The Philippines and the world / Ang Pilipinas at ang mundo | Bars: top 10 countries by cases; Southeast Asia rates; WHO regions | `global_comparison` | Third in number of cases (6.8% of the world). Our rate of 625 is almost 5 times the global rate of 131. / Pangatlo sa dami ng kaso (6.8% ng mundo). Halos 5 beses ng pandaigdigang antas na 131 ang antas natin na 625. |
| D12 | The hidden cost of TB / Ang nakatagong gastos ng TB | Two big-number cards | `patient_costs` | 42% of TB-affected households faced catastrophic costs; 90% for drug-resistant TB (2016–17 survey). / 42% ng mga sambahayang may TB ang nakaranas ng catastrophic na gastos; 90% sa drug-resistant TB (survey noong 2016–17). |
| D13 | Where TB was found (2016 survey) / Saan natagpuan ang TB (survey noong 2016) | Bars by island group, with CIs | `prevalence_survey_2016` | Adults in NCR, Region III and Region IV-A had the highest prevalence (1,358 per 100,000). Men's prevalence was nearly 3 times women's. / Pinakamataas ang prevalence sa mga nasa hustong gulang sa NCR, Region III at Region IV-A (1,358 bawat 100,000). Halos 3 beses ng sa babae ang prevalence ng lalaki. |
| D14 | TB-DOTS clinics per region / TB-DOTS clinic bawat rehiyon | Tile map or ranked bars | facilities file | Computed from the PhilHealth list. / Kinuwenta mula sa listahan ng PhilHealth. |
| D15 | Off track / Malayo pa sa target | Target vs actual bullets | `end_tb_milestones` | The 2025 milestone was 275 per 100,000 and about 7,500 deaths; in 2024 it was 625 and 37,404. DOH aims for 300 per 100,000 by 2030. / Ang target sa 2025 ay 275 bawat 100,000 at mga 7,500 na namatay; noong 2024, 625 at 37,404 ito. Layunin ng DOH ang 300 bawat 100,000 pagsapit ng 2030. |

**Methods and caveats (show on the page, collapsed by default)**
- EN: *Estimated* cases are WHO's model of how many people actually fell ill. *Notified* cases are those reported to DOH. The gap between them is the people who were missed.
- EN: WHO re-estimates the whole time series every year. When the 2026 report comes out, every series gets replaced, not just extended.
- EN: Monthly figures for 2025–26 are provisional and will change.
- EN: Risk-factor numbers overlap. A person can be both a smoker and diabetic, for example.
- EN: The 2016 prevalence survey screened adults with symptoms and chest X-rays and confirmed TB in the lab. It's the most recent survey with regional breakdowns.
- EN: Current regional case counts aren't published as open data. DOH reported over 102,000 cases in Metro Manila in March 2026. [S11]
- FIL: Ang *tantiyang* kaso ay modelo ng WHO kung ilan talaga ang nagkasakit. Ang *naiulat* ay ang mga kasong iniulat sa DOH. Ang agwat ay ang mga hindi natagpuan.
- FIL: Taon-taon, muling tinatantiya ng WHO ang buong serye. Kapag lumabas ang ulat ng 2026, papalitan ang lahat ng serye, hindi lang dadagdagan.
- FIL: Pansamantala at maaaring magbago ang buwanang datos para sa 2025–26.
- FIL: Nagsasapawan ang mga numero ng risk factor. Halimbawa, maaaring naninigarilyo at may diabetes ang isang tao.
- FIL: Sa prevalence survey noong 2016, sinuri ang mga nasa hustong gulang sa pamamagitan ng tanong tungkol sa sintomas at chest X-ray, at kinumpirma sa laboratoryo ang TB. Ito ang pinakabagong survey na may hati ayon sa rehiyon.
- FIL: Walang open data ng kasalukuyang bilang ng kaso ayon sa rehiyon. Iniulat ng DOH na higit 102,000 ang kaso sa Metro Manila noong Marso 2026.

## 7. Data tables

All tables are generated from `tb-ph-data.json`. Unless noted, the source is the WHO Global Tuberculosis Report 2025 [S1]. Ranges are 95% uncertainty intervals.

### T1. Headline figures, Philippines, 2024

| Indicator | Value | Note |
|---|---|---|
| Population | 115,843,666 | UN estimate used by WHO |
| People who fell ill with TB (estimated) | 723,902 | range 398,854–1,175,835 |
| Incidence rate per 100,000 | 625 | range 344–1,015 |
| Share of world TB cases | 6.8% | rank #3 by number of cases |
| Rank by incidence rate | #2 | among countries with over 1 million people (Papua New Guinea is #1) |
| TB deaths (estimated) | 37,404 | range 32,810–42,404 |
| TB deaths among HIV-negative people | 35,971 | ≈ 98 a day |
| New TB cases a day (estimated) | 1,978 | 2024 had 366 days |
| Notified new and relapse cases | 544,948 | reported by DOH |
| Treatment coverage (notified ÷ estimated) | 75.3% |  |
| People with TB not reached | 178,954 | estimated minus notified |
| Case fatality ratio | 5.6% | deaths ÷ cases |
| Change in incidence rate since 2015 | +13.6% | global: −12.3% |
| Change in deaths since 2015 | +25.3% | global: −29.4% |
| Men / women / children 0–14 (estimated cases) | 461,339 / 262,563 / 73,456 | men and women include children |
| WHO high-burden lists | TB, MDR/RR-TB, TB/HIV | on all three lists |
| Income group | Lower-middle income | World Bank |

### T2. Estimates and notifications by year, 2000–2024

| Year | Incidence /100k | Range | Estimated cases | Estimated deaths | Deaths /100k | Notified (new + relapse) | Coverage |
|---|---|---|---|---|---|---|---|
| 2000 | 590 | 307–964 | 469,740 | 35,280 | 44.3 | 119,914 | 25.5% |
| 2001 | 579 | 305–939 | 471,673 | 35,219 | 43.3 | 107,133 | 22.7% |
| 2002 | 569 | 304–916 | 472,745 | 36,841 | 44.3 | 118,408 | 25.0% |
| 2003 | 559 | 302–893 | 473,599 | 35,374 | 41.7 | 132,759 | 28.0% |
| 2004 | 549 | 301–870 | 474,303 | 34,283 | 39.7 | 130,530 | 27.5% |
| 2005 | 539 | 299–849 | 474,631 | 33,675 | 38.3 | 137,100 | 28.9% |
| 2006 | 530 | 297–828 | 474,134 | 33,802 | 37.8 | 147,305 | 31.1% |
| 2007 | 520 | 292–813 | 473,967 | 31,206 | 34.3 | 140,588 | 29.7% |
| 2008 | 524 | 294–819 | 485,794 | 31,606 | 34.1 | 139,603 | 28.7% |
| 2009 | 528 | 296–825 | 498,086 | 32,538 | 34.5 | 146,565 | 29.4% |
| 2010 | 531 | 298–830 | 511,950 | 31,376 | 32.6 | 166,323 | 32.5% |
| 2011 | 535 | 300–836 | 525,761 | 30,935 | 31.5 | 195,560 | 37.2% |
| 2012 | 539 | 302–842 | 539,824 | 29,928 | 29.9 | 216,627 | 40.1% |
| 2013 | 543 | 305–848 | 553,917 | 29,785 | 29.2 | 229,918 | 41.5% |
| 2014 | 546 | 307–854 | 567,032 | 30,849 | 29.7 | 243,379 | 42.9% |
| 2015 | 550 | 309–860 | 579,507 | 29,860 | 28.4 | 276,672 | 47.7% |
| 2016 | 554 | 311–866 | 591,446 | 33,307 | 31.2 | 332,941 | 56.3% |
| 2017 | 554 | 311–866 | 599,115 | 31,012 | 28.7 | 317,266 | 53.0% |
| 2018 | 554 | 311–866 | 606,571 | 30,676 | 28.0 | 371,668 | 61.3% |
| 2019 | 554 | 311–866 | 613,993 | 31,220 | 28.2 | 409,167 | 66.6% |
| 2020 | 544 | 304–863 | 609,834 | 36,320 | 32.4 | 256,541 | 42.1% |
| 2021 | 579 | 325–934 | 654,909 | 42,133 | 37.3 | 321,564 | 49.1% |
| 2022 | 627 | 346–1,013 | 714,302 | 40,588 | 35.6 | 435,890 | 61.0% |
| 2023 | 632 | 348–1,024 | 726,118 | 38,499 | 33.5 | 575,770 | 79.3% |
| 2024 | 625 | 344–1,015 | 723,902 | 37,404 | 32.3 | 544,948 | 75.3% |

### T3. Monthly TB notifications (new and relapse), January 2020 – January 2026

Source: WHO provisional monthly notifications [S3]. 2025–2026 figures are provisional (January 2026 is likely incomplete); monthly sums differ slightly from final annual totals.

| Year | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2020 | 40,104 | 37,042 | 28,376 | 10,489 | 13,726 | 20,282 | 20,338 | 16,938 | 18,701 | 18,757 | 17,100 | 17,605 | 259,458 |
| 2021 | 24,679 | 24,663 | 29,335 | 22,354 | 23,501 | 25,733 | 27,894 | 26,705 | 25,224 | 24,386 | 23,571 | 19,748 | 297,793 |
| 2022 | 29,412 | 32,204 | 40,998 | 25,236 | 35,013 | 42,979 | 34,115 | 38,115 | 43,520 | 34,399 | 31,057 | 28,132 | 415,180 |
| 2023 | 43,957 | 49,398 | 57,963 | 41,777 | 51,352 | 47,295 | 48,786 | 51,994 | 48,728 | 43,485 | 39,452 | 27,884 | 552,071 |
| 2024 | 51,986 | 48,541 | 47,907 | 48,493 | 46,159 | 40,536 | 48,710 | 48,681 | 47,534 | 46,451 | 41,901 | 31,748 | 548,647 |
| 2025 | 45,795 | 47,467 | 49,051 | 42,378 | 45,091 | 42,923 | 47,222 | 43,278 | 48,067 | 48,707 | 40,395 | 34,689 | 535,063 |
| 2026 | 23,723 | — | — | — | — | — | — | — | — | — | — | — | — |

### T4. TB by age and sex, 2024

| Age | Estimated cases, men | Estimated cases, women | Notified, men | Notified, women |
|---|---|---|---|---|
| 0-4 | 15,233 | 14,595 | 9,783 | 8,041 |
| 5-9 | 13,150 | 11,680 | 9,428 | 8,294 |
| 10-14 | 9,603 | 9,196 | 5,848 | 4,716 |
| 15-24 | 75,518 | 36,528 | 39,864 | 25,168 |
| 25-34 | 66,757 | 36,311 | 49,072 | 27,128 |
| 35-44 | 67,048 | 33,924 | 51,351 | 25,921 |
| 45-54 | 74,976 | 37,532 | 60,194 | 29,017 |
| 55-64 | 70,735 | 37,420 | 60,262 | 30,834 |
| 65+ | 68,319 | 45,378 | 60,643 | 38,392 |

### T5. What was notified in 2024

| Category | Number | Share |
|---|---|---|
| New and relapse cases, total | 544,948 | 100% |
| Lung TB, confirmed by a lab test | 245,406 | 45.8% of lung TB |
| Lung TB, diagnosed clinically | 289,922 |  |
| TB outside the lungs | 9,620 | 1.8% |
| Children 0–14 | 46,110 | 8.5% |
| Men / women | 346,445 / 197,511 |  |

### T6. TB cases attributable to risk factors, 2024 (overlapping; do not add up)

| Risk factor | Estimated cases | Range | Applies to ages |
|---|---|---|---|
| Alcohol use disorders | 70,714 | 13,214–175,482 | 15+ |
| Smoking | 66,603 | 8,208–184,764 | 15+ |
| Undernutrition | 60,916 | 28,545–105,346 | all |
| Diabetes | 52,985 | 23,253–94,751 | 18+ |
| HIV infection | 4,592 | 787–11,683 | all |

### T7. Treatment outcomes

| Cohort | People | Success | Failed | Died | Lost to follow-up | Not evaluated |
|---|---|---|---|---|---|---|
| New and relapse, started 2023 | 570,492 | 83.9% | 0.2% | 1.8% | 10.5% | 3.7% |
| MDR/RR-TB, started 2022 | 7,700 | 75.6% | 3.5% | 9.4% | 11.4% | — |
| TB/HIV, started 2023 | 2,538 | 85.3% |  |  |  |  |
| Children 0–14, started 2023 | 48,877 | 88.6% |  |  |  |  |

Treatment success over time (new and relapse cases):

| Cohort year | 2012 | 2013 | 2014 | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Success | 87.7% | 89.6% | 92.0% | 91.3% | 90.5% | 91.1% | 82.7% | 86.5% | 76.3% | 79.7% | 78.1% | 83.9% |

### T8. Drug-resistant TB (rifampicin-resistant / MDR), 2024

| Indicator | Value |
|---|---|
| Estimated people who developed MDR/RR-TB | 27,870 (range 11,845–43,895) |
| Share among new TB cases | 2.3% |
| Share among previously treated cases | 19.3% |
| Lab-confirmed RR/MDR-TB | 7,549 |
| Confirmed as share of estimated | 27.1% |
| Started on second-line treatment | 6,631 |
| Philippines share of world MDR/RR-TB | 7.1% (rank #3, after India and China) |

Lab-confirmed RR/MDR-TB by year:

| Year | 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 |
|---|---|---|---|---|---|---|---|---|---|---|
| Confirmed | 3,788 | 5,233 | 6,438 | 7,276 | 7,492 | 6,279 | 7,589 | 9,844 | 8,752 | 7,549 |

### T9. TB and HIV, 2024

| Indicator | Value |
|---|---|
| Estimated TB cases among people with HIV | 5,502 |
| Notified TB patients with a known HIV status | 363,386 (66.7%) |
| HIV-positive TB patients | 2,762 |
| On antiretroviral therapy | 2,737 (99.1%) |
| TB deaths among people with HIV (estimated) | 1,434 |

### T10. Household contacts and TB preventive treatment (TPT), 2024

| Step | People |
|---|---|
| Household contacts of confirmed cases | 165,430 |
| Screened | 125,060 |
| Found to have TB | 3,220 |
| Started TPT | 77,195 |
| …of whom children under 5 | 12,715 |
| TPT with short rifamycin-based regimens | 53,468 |

Contacts starting TPT by year:

| Year | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 |
|---|---|---|---|---|---|---|---|
| Started TPT | 5,409 | 5,821 | 3,057 | 9,069 | 34,083 | 50,883 | 77,195 |

### T11. The Philippines and the world, 2024

World: 10,691,405 people fell ill (rate 131 per 100,000) and 1,230,571 died. Since 2015, the global rate fell 12.3% and deaths fell 29.4%.

Top 10 countries by number of cases:

| Rank | Country | Estimated cases | Share of world |
|---|---|---|---|
| 1 | India | 2,707,572 | 25.3% |
| 2 | Indonesia | 1,083,351 | 10.1% |
| 3 | Philippines | 723,902 | 6.8% |
| 4 | China | 696,296 | 6.5% |
| 5 | Pakistan | 668,698 | 6.3% |
| 6 | Nigeria | 509,674 | 4.8% |
| 7 | DR Congo | 411,937 | 3.9% |
| 8 | Bangladesh | 383,883 | 3.6% |
| 9 | Myanmar | 262,580 | 2.5% |
| 10 | South Africa | 249,127 | 2.3% |

Highest incidence rates (countries with over 1 million people):

| Rank | Country | Rate /100k |
|---|---|---|
| 1 | Papua New Guinea | 664 |
| 2 | Philippines | 625 |
| 3 | Lesotho | 548 |
| 4 | DPR Korea | 513 |
| 5 | Timor-Leste | 496 |
| 6 | Djibouti | 495 |
| 7 | Myanmar | 482 |
| 8 | Mongolia | 446 |

Southeast Asia (ASEAN + Timor-Leste):

| Country | Incidence /100k | Deaths /100k |
|---|---|---|
| Philippines | 625 | 32.3 |
| Timor-Leste | 496 | 79.2 |
| Myanmar | 482 | 66.8 |
| Indonesia | 382 | 44.3 |
| Cambodia | 272 | 18.2 |
| Viet Nam | 182 | 12.3 |
| Thailand | 146 | 15.8 |
| Lao PDR | 127 | 9.0 |
| Malaysia | 96 | 8.3 |
| Brunei | 65 | 5.7 |
| Singapore | 43 | 0.5 |

WHO regions (the Philippines and Indonesia are in the Western Pacific Region):

| WHO region | Incidence /100k |
|---|---|
| Africa | 207 |
| South-East Asia | 201 |
| Western Pacific | 131 |
| Eastern Mediterranean | 112 |
| Americas | 33 |
| Europe | 22 |
| World | 131 |

### T12. 2016 National TB Prevalence Survey: lab-confirmed lung TB among adults 15+, per 100,000

| Group | Prevalence | 95% CI |
|---|---|---|
| All adults | 1,159 | 1,016–1,301 |
| Men | 1,713 | 1,482–1,943 |
| Women | 627 | 516–739 |
| Age 15-24 | 799 | 586–1,011 |
| Age 25-34 | 900 | 677–1,123 |
| Age 35-44 | 1,126 | 821–1,430 |
| Age 45-54 | 1,714 | 1,364–2,064 |
| Age 55-64 | 1,504 | 1,104–1,903 |
| Age 65+ | 1,659 | 1,261–2,058 |
| NCR, Region III and Region IV-A | 1,358 | 1,103–1,612 |
| Rest of Luzon | 1,038 | 787–1,288 |
| Visayas | 1,234 | 873–1,594 |
| Mindanao | 856 | 686–1,026 |

### T13. Cost of TB to families (first national patient cost survey, 2016–2017) [S17]

| Group | Households facing catastrophic costs |
|---|---|
| All TB-affected households | 42.4% (95% CI 40.2–44.6%) |
| Drug-resistant TB | 89.7% |

Catastrophic costs means total TB costs (medical, non-medical and lost income, net of assistance) above 20% of yearly household income.


### T14. Targets and where we are

| Target | Goal | Philippines now | Source |
|---|---|---|---|
| End TB 2025 milestone: incidence rate (−50% vs 2015) | 275 per 100,000 | 625 (2024) | [S1] |
| End TB 2025 milestone: deaths (−75% vs 2015) | 7,465 | 37,404 (2024) | [S1] |
| DOH target incidence rate by 2030 | 300 per 100,000 | 625 (2024) | [S21] |
| PhilSTEP2 (2025–2030): people screened by 2026 | 12 million | in progress | [S12] |
| PAAP-TB 2023–2035 | eliminate TB by 2035 | — | [S12] |

### T15. Programme facts (Philippines)

| Fact | Detail | Source |
|---|---|---|
| Law | Republic Act 10767, Comprehensive Tuberculosis Elimination Plan Act (2016): requires a national TB plan, notification of all TB cases and a PhilHealth TB package | [S23] |
| Strategic plan | Philippine Strategic TB Elimination Plan Phase 2 (PhilSTEP2) 2025–2030 | [S12] |
| DOH TB budget | ₱4.2 billion proposed for 2026, up from ₱2.6 billion in 2025 | [S12] |
| Diagnostics | Ultra-portable AI-assisted chest X-rays; WHO-recommended rapid molecular tests (NAAT), e.g. Xpert MTB/RIF, TB-LAMP | [S5][S12] |
| DR-TB treatment | All-oral regimen; 6 months instead of 2 years | [S12] |
| Children | Non-severe drug-susceptible TB: 4-month regimen (2HRZE/2HR) | [S12] |
| Prevention | Shorter TPT regimens; TPT enrollment up over 50% in 2024; TPT extended to contacts of DR-TB | [S12] |
| PhilHealth TB-DOTS package | ₱5,200 outpatient package at accredited TB-DOTS centers (as of Nov 2024); DOH and PhilHealth are raising TB benefits | [S13][S15] |
| PhilHealth Konsulta | Primary-care package covering chest X-ray; ₱1,700 per beneficiary per year | [S13] |
| Facilities | National TB Program: 3,300+ TB-DOTS facilities; PhilHealth-accredited TB-DOTS clinics: ~2,100 (30 Sep 2026 list) | [S20][S4] |
| Recent DOH counts | 192,733 cases recorded Jan–Jun 2025 (ITIS); over 102,000 cases in Metro Manila (reported Mar 2026) | [S7][S11] |
| Local goal | Guimaras aims to be the first TB-free island | [S12] |

## 8. About — Tungkol sa amin

**Mission**
- EN: TB PH is a TB awareness project by [group name], a team of researchers and data scientists, working with partner hospitals that care for people with TB. We turn public TB data into clear information so more Filipinos get tested early and finish treatment.
- FIL: Ang TB PH ay proyekto para sa kamalayan sa TB ng [pangalan ng grupo], isang pangkat ng mga mananaliksik at data scientist, katuwang ang mga ospital na nag-aalaga sa mga taong may TB. Ginagawa naming malinaw na impormasyon ang pampublikong datos tungkol sa TB, para mas maraming Pilipino ang magpasuri nang maaga at tumapos ng gamutan.

**Partners**
- EN heading: Our partners
- FIL heading: Mga katuwang namin
- Layout: a grid of partner hospital logos with names. These are placeholders until the logos and approvals arrive.

**Medical review**
- EN: Health content reviewed by [name, credentials, hospital] on [date].
- FIL: Sinuri ang nilalamang pangkalusugan ni [pangalan, kredensiyal, ospital] noong [petsa].

**Disclaimer**
- EN: This website provides general health information and does not replace a consultation with a doctor or health worker. The symptom checker does not diagnose TB. Only a medical test can. In an emergency, call 911.
- FIL: Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Hindi nagbibigay ng diyagnosis ang symptom checker; pagsusuring medikal lang ang makapagsasabi kung may TB. Sa emergency, tumawag sa 911.

**Privacy**
- EN: There are no accounts, and we don't collect personal information. The symptom checker runs entirely in your browser. Your answers are never saved or sent anywhere.
- FIL: Walang account, at hindi kami kumukuha ng personal na impormasyon. Tumatakbo lamang sa iyong browser ang symptom checker. Hindi kailanman sine-save o ipinapadala kahit saan ang iyong mga sagot.
- Build note: if analytics are added later, list them here, and never record screening answers.

**Data and updates**
- EN: Data last updated 23 October 2026. WHO publishes new TB estimates once a year; the next Global Tuberculosis Report is expected in late 2026. PhilHealth updates its TB-DOTS list regularly, and we refresh ours every month.
- FIL: Huling update ng datos: 23 Oktubre 2026. Isang beses sa isang taon naglalabas ng bagong tantiya sa TB ang WHO; inaasahan ang susunod na Global Tuberculosis Report sa huling bahagi ng 2026. Regular na ina-update ng PhilHealth ang listahan nito ng TB-DOTS, at buwan-buwan naming nire-refresh ang sa amin.

**Contact:** [email]

**Helpful numbers**

| Who | Number | Note |
|---|---|---|
| Emergency (police, fire, medical) | 911 | National emergency hotline |
| DOH hotline | 1555 | **[VERIFY]** before launch |
| Lung Center of the Philippines — TB DOTS | 8924-6101 loc. 1856–1857 | From the PhilHealth TB-DOTS list [S4] |
| Philippine Tuberculosis Society — Quezon Institute | 8356-5857 loc. 125 | From the PhilHealth TB-DOTS list [S4] |
| Your local health center | — | Usually the fastest first stop |

## 9. Glossary

| Term | EN meaning | FIL |
|---|---|---|
| TB | Tuberculosis, a bacterial infection, usually of the lungs | Tuberkulosis |
| Presumptive TB | Someone with signs that need a TB test | Posibleng may TB; kailangang ipasuri |
| Sputum | Phlegm coughed up from the lungs | Plema |
| Xpert MTB/RIF, TB-LAMP | Rapid molecular tests on sputum; Xpert also detects rifampicin resistance | Mabilis na molecular test sa plema |
| TB-DOTS | Directly observed treatment, short-course: treatment with a health worker or supporter's help | Gamutang may gabay ng health worker o treatment supporter |
| TPT | TB preventive treatment for people infected but not sick | Gamot na pang-iwas sa TB |
| DR-TB / RR-TB / MDR-TB | TB that resists rifampicin (RR) or rifampicin and isoniazid (MDR) | TB na hindi tinatablan ng ilang gamot |
| Incidence | New cases in a year | Bilang ng bagong kaso sa isang taon |
| Notification | Cases reported to DOH | Mga kasong naiulat |
| Treatment coverage | Notified cases ÷ estimated cases | Bahagdan ng mga natukoy at naiulat |
| Treatment success | Cured or completed treatment | Gumaling o natapos ang gamutan |
| Lost to follow-up | Stopped treatment for 2 months or more | Huminto sa gamutan nang 2 buwan o higit pa |
| Catastrophic costs | TB costs above 20% of yearly household income | Gastos sa TB na lampas sa 20% ng taunang kita ng sambahayan |

## 10. Sources

- [S1] WHO, *Global Tuberculosis Report 2025* (12 Nov 2025). Report: https://www.who.int/teams/global-tuberculosis-programme/tb-reports/global-tuberculosis-report-2025 . Data files used for every WHO number here: WHO report code repository https://github.com/GTB-TME/gtbreport2025 (snapshot 2025-07-30) and https://www.who.int/teams/global-tuberculosis-programme/data
- [S2] WHO, Tuberculosis health topic: https://who.int/tb ; Global Health Observatory TB theme: https://www.who.int/data/gho/data/themes/tuberculosis
- [S3] WHO provisional monthly TB notifications (CSV, retrieved 23 Oct 2026): https://extranet.who.int/tme/generateCSV.asp?ds=provisional_notifications
- [S4] PhilHealth, accredited health facilities page: https://www.philhealth.gov.ph/partners/providers/facilities/accredited/ ; TB-DOTS list (30 Sep 2026, 85 pages): https://www.philhealth.gov.ph/partners/providers/facilities/accredited/DOTS_093026.pdf
- [S5] DOH Administrative Order No. 2020-0056, NTP Adaptive Plan (definition of presumptive TB; Xpert and TB-LAMP testing): https://law.upd.edu.ph/wp-content/uploads/2021/04/DOH-Administrative-Order-No-2020-0056.pdf
- [S6] "The Presence of Cough and Tuberculosis: Active Case Finding Outcomes in the Philippines" (NTP child screening criteria and NTP high-risk groups): https://pmc.ncbi.nlm.nih.gov/articles/PMC6719270
- [S7] SunStar, "Close to 200,000 TB cases recorded in 2025" (DOH myth-busting; ITIS Jan–Jun 2025): https://www.sunstar.com.ph/manila/close-to-200000-tb-cases-recorded-in-2025
- [S9] Manila Bulletin, 13 Jul 2026, "Many Filipinos still mistake TB for an ordinary cough, expert says": https://mb.com.ph/2026/07/13/many-filipinos-still-mistake-tb-for-an-ordinary-cough-expert-says
- [S10] Daily Tribune, 5 Apr 2026, "TB remains a major health threat" (Baguio City Health Services Office; higher-risk groups): https://tribune.net.ph/amp/story/2026/04/05/tb-remains-a-major-health-threat
- [S11] DZRH, Mar 2026, DOH on Metro Manila TB cases; TB is curable, treatment is free, TB isn't spread by utensils and doesn't discriminate: https://dzrh.com.ph/post/more-contagious-than-covid-doh-explains-why-tb-cases-spiked-to-102000-in-metro-manila-post-lockdown
- [S12] WHO Philippines and DOH joint news release, 12 Nov 2025 (PhilSTEP2, 12M screening, 6-month DR-TB regimen, 4-month child regimen, TPT, PAAP-TB, budget, 98 deaths a day): https://www.who.int/philippines/news/detail/12-11-2025-who--doh-target-12m-filipinos-to-be-screened-for-tuberculosis-by-2026--philippines-aims-to-double-budget-for-tb-services
- [S13] PhilHealth news, 11 Nov 2024 (TB-DOTS package ₱5,200; Konsulta covers chest X-ray, ₱1,700 per beneficiary): https://www.philhealth.gov.ph/news/up/article/2024/news_6731aabf922b2.php
- [S15] DZRH, 23 Mar 2026, "DOH guarantees free TB meds, prioritizes 2027 budget allocation" (PhilHealth TB benefits being raised): https://www.dzrh.com.ph/post/doh-guarantees-free-tb-meds-prioritizes-2027-budget-allocation
- [S16] Philstar/AFP, 14 Nov 2025, "Philippines has 3rd highest TB cases worldwide" (no vaccines for adults): https://www.philstar.com/headlines/2025/11/14/2487103/philippines-has-3rd-highest-tb-cases-worldwide
- [S17] "Expansion of social protection is necessary towards zero catastrophic costs due to TB: the first national TB patient cost survey in the Philippines," *PLOS ONE* (2022): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8884492/
- [S18] Los Baños Times, barangay TB awareness seminar (hereditary and utensil misconceptions): https://lbtimes.ph/page/280/?Itemid=4
- [S19] Southeastern National TB Center, *Philippines Cultural Competency and TB Control* quick guide (beliefs about children and TB; stigma): https://sntc.medicine.ufl.edu/Files/Products/Philippines.pdf
- [S20] Stop TB Partnership, Philippines country brief (NTP operates over 3,300 TB-DOTS facilities): https://www.stoptb.org/sites/default/files/documents/Philippines.pdf
- [S21] Philstar, 28 Mar 2025, "DOH intensifies search for unreported TB cases" (DOH target of 300 per 100,000 by 2030): https://www.philstar.com/headlines/2025/03/28/2431788/doh-intensifies-search-unreported-tb-cases-ensures-treatment/amp/
- [S23] Republic Act No. 10767, Comprehensive Tuberculosis Elimination Plan Act: https://lawplayer.com/ph/act/ra-10767

## 11. Before launch — open items

1. **[REVIEW] Clinical review.** Partner-hospital physicians (ideally a pulmonologist and a pediatrician) review Section 4 (screening logic, danger signs, result wording) and Section 3, L6 (treatment and side effects).
2. **Language review.** A native Filipino speaker with health-communication experience reviews all FIL copy. Later, consider Cebuano, Ilocano and Hiligaynon.
3. **[VERIFY] Contacts.** Confirm that DOH hotline 1555 is current, and add partner-hospital TB clinic numbers.
4. **Facility list.** Run `scrape_philhealth_tbdots.py` to get the full nationwide list. Read `scrape-report.txt` (it should show no missing row numbers), then spot-check about 20 rows against the PDF. Re-run monthly.
5. **Regional case data.** WHO doesn't publish subnational data. Request regional notifications from DOH (Epidemiology Bureau or the National TB Program's ITIS), or use partner-hospital data with permission.
6. **WHO 2026 update.** When the 2026 report is published (expected late 2026), re-run `build_tb_ph_data.py` against the new WHO repository. Replace every series instead of appending to them.
7. **Name and branding.** The final name, logo and partner logos come from stakeholders. The design uses "TB PH" as a swappable wordmark.
8. **Privacy check.** Before release, confirm that no request leaves the screening page with answer data.
