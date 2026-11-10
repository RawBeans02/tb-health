# Copy overrides

Places where the build uses README or prototype wording instead of the content pack, or changes a specced behaviour, for the owner to confirm (approved in principle, Q3 and Q2a in `docs/decisions.md`). The rule: where README differs from the pack, README wins (Q3).

Each string entry names its dictionary id (`src/content/…`). `tests/unit/parity.test.ts` fails if a string marked `override` isn't listed here.

Since step 15 the pack is the v8 pack, `design/v8/design_handoff_tb_ph/reference/content-and-data-pack.md` (V8, 4 November 2026, fourth batch), and "pack :N" below is its line N. Its lines from 23 on are one below v6's (it adds the Accessibility footer link at :23), and two below from v6's :824 on (it adds source S24). The strings it changed are listed in "The v8 pack" at the end.

## Behaviour

### Language toggle: links instead of buttons (Q2a, step 2)
- **README:131 and :143:** two buttons, "English" / "Filipino", with `lang` and `aria-pressed`, in a group labelled "Language / Wika".
- **Ships:** two links with the same labels, `lang`, `hreflang` and look, in the same group. The current language has `aria-current="true"` instead of `aria-pressed`. Each link goes to the same page in the other language, keeping the query and hash (Filipino at `/fil/…`, Q2). On Check, Places and Home while a location fix is held, the switch happens in place without a navigation (PLAN §4.2).
- **Why:** each language has its own URL now, so the toggle navigates. Links work without JavaScript and can be opened in a new tab.
- One visual detail: the toggle's corners are rounded on the links rather than clipped with `overflow: hidden`, so the focus ring isn't cut off. It looks the same.

## Strings

### `chrome.nav_home`: "Find TB care" (step 2)
- **Pack :17 and :20:** the Home page is "Home" / "Simula" at `/`, and the facility finder is "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center" at `/find`.
- **README:130 (ships):** "Find TB care" / "Hanapin ang gamutan" for the first nav item and tab. It leads to `/` (the planner), and the full list lives at `/places`, which marks the same item as current (README:133).

### `chrome.credit`: the data date (step 2)
- **Pack :36–37:** "… Last updated 23 October 2026." / "… Huling update: 23 Oktubre 2026."
- **README:144 and the prototype footer (ships):** "… Last updated 30 October 2026." / "… Huling update: 30 Oktubre 2026."
- The date isn't typed into the string: it is the newest `generated` date in `data/tb-ph-data.json` and `data/claims.json`, so it follows the data. The pack's 23 October and the README's 30 October were each the newest data-file date at the time; since the owner's new `claims.json` (V5, 4 November 2026) the footer reads 4 November 2026.

### `care.commute`, `care.call`, `care.sakay`: place actions (steps 4–6)
- **Pack :407–409 (Places card buttons):** "Call" / "Tumawag", "Get directions" / "Paano pumunta", "Copy address" / "Kopyahin ang address".
- **README:193, :208, :217 and the prototype (ship):** "Call before you go" / "Tumawag bago pumunta" (a text link), "Commute directions" / "Paano mag-commute" (Google Maps transit directions in a new tab, with Walk and Drive beside it on the Place page), and "Copy address for Sakay.ph" / "Kopyahin ang address para sa Sakay.ph" (copies the address, then opens sakay.ph). The Sakay.ph link itself stays `[VERIFY]`.

### `check.res_A_find`: "Plan my route to a test" (step 7, D11)
- **Pack :322 and :329 (result A buttons):** "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center".
- **README:226 and the prototype (ship):** "Plan my route to a test" / "Planuhin ang daan papunta sa pagsusuri", the solid button on results A, B and C, leading to the planner with the whole route (`/?need=all`, or `/fil?need=all`).

### `dotStory.b7_find`: "Find TB care near you" (step 9)
- **Pack :82 and :85 (dot story, beat 7 buttons):** "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center".
- **README:236 and the prototype (ship):** "Find TB care near you" / "Hanapin ang gamutan malapit sa iyo", the soft button beside "Check your symptoms" at the end of the dot story. It leads to the planner (`/`, or `/fil`), like Learn's L5 button with the same words.

### `about.updatesText`: the data date (step 10)
- **Prototype (About › Data and updates):** "Data last updated 30 October 2026." / "Huling update ng datos: 30 Oktubre 2026."
- **Ships:** the same sentence with the date from the data files, as in the footer credit (`chrome.credit`), so it reads 4 November 2026 today and moves with the next refresh. The only other date in page copy, the Data page's "retrieved 23 October 2026" (`charts`, monthly notifications), is a retrieval date and stays as written.

## The owner's own wording (`decision` strings)

Strings whose wording the owner gave in `docs/decisions.md`; the parity test finds each one, in quotes, in the decision it names (by id, such as V4, not by line).

### `about.privacyServices` (Q5, 8 Nov 2026)
- **Ships (Q5 in decisions.md):** "TB PH serves its own fonts, so no font service sees your visit. Our web host, Cloudflare, sees your IP address, your browser and the pages you open. The map comes from OpenStreetMap, and only if you open it; OpenStreetMap then sees your IP address and the area on the map, which is around you if you used your location. Directions open in Google Maps, which then sees the place you chose. For Sakay.ph, we copy the address and open sakay.ph, which sees it only if you paste it there. Calls go through your phone." / "Ang TB PH mismo ang nagbibigay ng mga font nito, kaya walang font service na nakakakita sa pagbisita mo. Nakikita ng aming web host, ang Cloudflare, ang IP address mo, ang browser mo at ang mga pahinang binubuksan mo. Galing sa OpenStreetMap ang mapa, at kapag binuksan mo lang ito; makikita ng OpenStreetMap ang IP address mo at ang lugar na nasa mapa, na nasa paligid mo kung ginamit mo ang lokasyon mo. Sa Google Maps bumubukas ang direksiyon, kaya makikita nito ang lugar na pinili mo. Para sa Sakay.ph, kinokopya namin ang address at binubuksan ang sakay.ph; makikita lang nito ang address kung i-paste mo ito roon. Dumadaan sa phone mo ang mga tawag."

### `about.a11yText` (A3, 9 Nov 2026)
- **Ships (A3 in decisions.md):** "We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. The site works with a keyboard and screen readers, uses large text and strong contrast, and every chart has a table version. Known limitation: the optional map works best with a mouse or touch, so the same places are always listed as text." / "Layunin naming maabot ang Web Content Accessibility Guidelines (WCAG) 2.2, level AA. Gumagana ang site gamit ang keyboard at screen reader, malalaki ang titik at malinaw ang kulay, at may talaan ang bawat chart. Limitasyon: pinakamainam gamitin ang mapa gamit ang mouse o touch, kaya laging nakalista rin bilang teksto ang parehong mga lugar." The prototype's text without "If something doesn't work for you, tell us at [email].", as the site launches without a contact email.

### `about.lede` (A2, 9 Nov 2026)
- **Ships (A2 in decisions.md):** "TB PH is a TB awareness project by Amazing Research Labs, a team of researchers and data scientists. We turn public TB data into clear information so more Filipinos get tested early and finish treatment." / "Ang TB PH ay proyekto para sa kamalayan sa TB ng Amazing Research Labs, isang pangkat ng mga mananaliksik at data scientist. Ginagawa naming malinaw na impormasyon ang pampublikong datos tungkol sa TB, para mas maraming Pilipino ang magpasuri nang maaga at tumapos ng gamutan." The prototype's lede with the group's name, without "working with partner hospitals that care for people with TB".

### `meta.aboutDescription` (A1, 8 Nov 2026)
- **Ships (A1 in decisions.md):** "Who makes TB PH, privacy, accessibility, data updates and helpful phone numbers." / "Kung sino ang gumagawa ng TB PH, privacy, accessibility, mga update sa datos at mga numerong makatutulong." The prototype's (EN) and Q3's (FIL) description without "how the health content is reviewed", as About launches without its Medical review section.

### `chrome.creditOsm` (Q8, 8 Nov 2026)
- **Ships (Q8 in decisions.md):** "Clinic positions:" / "Mga lokasyon ng klinika:", in every page's footer before the link "© OpenStreetMap contributors" (openstreetmap.org/copyright).

### `install.leadNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "Add it to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." / "Idagdag ito sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."

### `about.appTextNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "Add TB PH to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." / "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."

### `meta.installDescriptionNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "Add TB PH to your home screen. It opens full screen, and the planner and Learn still open without a signal." / "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at nabubuksan pa rin ang planner at ang Alamin kahit walang signal."

### `about.disclaimerTextNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "This website provides general health information and does not replace a consultation with a doctor or health worker. In an emergency, call 911." / "Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Sa emergency, tumawag sa 911."

### `about.privacy1NoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "There are no accounts, and we don't collect personal information." / "Walang account, at hindi kami kumukuha ng personal na impormasyon."

### `notFound.leadNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "The link may be old or mistyped. This will get you back on track:" / "Maaaring luma o mali ang link. Makatutulong ito:"

### `about.n1555_note`: the DOH hotline note (step 10, V4)
- **Prototype:** "[VERIFY] Confirm before launch" / "[VERIFY] Kumpirmahin bago ilunsad", in TB red.
- **Ships (V4 in decisions.md, the v7 wording):** "Press 2 for the National Patient Navigation and Referral Center." / "Pindutin ang 2 para sa National Patient Navigation and Referral Center.", in the muted note colour, since it is no longer a `[VERIFY]`.

## The v8 pack (V8, 4 November 2026, fourth batch)

The owner made the v8 pack the copy baseline (V8): no em dashes, in the owner's approved wording. With it come the page titles joined by " \| " (V9), the YAKAP wording in Learn L5, step 1 (V10) and "Aksesibilidad" in Filipino (V11). Where v8 changed a prototype string, the v8 prototype's wording ships (V6: where v6 and v8 differ, v8 wins; V3 already named "Hours not listed. Call first."). The parity test reads the v8 pack, README and prototype, in `design/v8/design_handoff_tb_ph/`. Every string whose shipped wording changed in step 15.1, in English or Filipino:

| String | Was (v6) | Ships (v8) | Source |
|---|---|---|---|
| `about.a11y` | "Accessibility" / "Accessibility" | "Accessibility" / "Aksesibilidad" | The v8 prototype (About.dc.html); V11. FIL-REVIEW. |
| `care.gov` | "Government — free TB care" / "Pampubliko — libreng gamutan sa TB" | "Government (free TB care)" / "Pampubliko (libreng gamutan sa TB)" | v8 pack :410. |
| `care.priv` | "Private — fees may apply" / "Pribado — maaaring may bayad" | "Private (fees may apply)" / "Pribado (maaaring may bayad)" | v8 pack :411. |
| `care.noHours` | "Hours not listed — call first" / "Walang nakalistang oras — tumawag muna" | "Hours not listed. Call first." / "Walang nakalistang oras. Tumawag muna." | The v8 prototype (tbph-core.js); V3 quotes the English as the owner's wording (V6). FIL-REVIEW. |
| `charts.d13_2` | "Catastrophic costs: total TB costs — medical, non-medical and lost income, net of assistance — above 20% of yearly household income." / "Catastrophic na gastos: kabuuang gastos sa TB — medikal, hindi medikal at nawalang kita, bawas ang tulong — na lampas sa 20% ng taunang kita ng sambahayan." | "Catastrophic costs: total TB costs (medical, non-medical and lost income, net of assistance) above 20% of yearly household income." / "Catastrophic na gastos: kabuuang gastos sa TB (medikal, hindi medikal at nawalang kita, bawas ang tulong) na lampas sa 20% ng taunang kita ng sambahayan." | The v8 prototype (Data.dc.html), V6: brackets for the em dashes. FIL-REVIEW. |
| `check.introBody` | "Answer a few questions to see whether you should get tested for TB. It takes about 2 minutes. This is not a diagnosis — only a test can tell whether you have TB." / "Sagutin ang ilang tanong para malaman kung dapat kang magpasuri para sa TB. Mga 2 minuto lang ito. Hindi ito diyagnosis — pagsusuri lang ang makapagsasabi kung may TB ka." | "Answer a few questions to see whether you should get tested for TB. It takes about 2 minutes. This is not a diagnosis. Only a test can tell whether you have TB." / "Sagutin ang ilang tanong para malaman kung dapat kang magpasuri para sa TB. Mga 2 minuto lang ito. Hindi ito diyagnosis. Pagsusuri lang ang makapagsasabi kung may TB ka." | v8 pack :194, :198. [REVIEW] stays. |
| `check.res_C_title` | "No signs of TB right now — but ask about screening." / "Walang senyales ng TB sa ngayon — pero magtanong tungkol sa screening." | "No signs of TB right now, but ask about screening." / "Walang senyales ng TB sa ngayon, pero magtanong tungkol sa screening." | v8 pack :338, :340. [REVIEW] stays. |
| `check.res_D_body` | "Watch for these signs: a cough for 2 weeks or more, fever, night sweats or weight loss. If any of them lasts 2 weeks, get tested — it's free." / "Bantayan ang mga senyales na ito: ubo nang dalawang linggo o higit pa, lagnat, pagpapawis sa gabi o pagbaba ng timbang. Kung tumagal ang alinman nang dalawang linggo, magpasuri — libre ito." | "Watch for these signs: a cough for 2 weeks or more, fever, night sweats or weight loss. If any of them lasts 2 weeks, get tested. It's free." / "Bantayan ang mga senyales na ito: ubo nang dalawang linggo o higit pa, lagnat, pagpapawis sa gabi o pagbaba ng timbang. Kung tumagal ang alinman nang dalawang linggo, magpasuri. Libre ito." | v8 pack :345, :347. [REVIEW] stays. |
| `check.foot` | "This is not a diagnosis. Based on DOH and WHO screening guidance. Medical review: [partner clinicians — pending]." / "Hindi ito diyagnosis. Batay sa gabay ng DOH at WHO sa screening. Medical review: [mga katuwang na doktor — nakabinbin]." | "This is not a diagnosis. Based on DOH and WHO screening guidance. Medical review: [partner clinicians, pending]." / "Hindi ito diyagnosis. Batay sa gabay ng DOH at WHO sa screening. Medical review: [mga katuwang na doktor, nakabinbin]." | v8 pack :370, :371. [REVIEW] and PLACEHOLDER stay: the clinical review is still pending. |
| `check.cardTitle` | "My TB check — show this to the health worker" / "Ang aking TB check — ipakita ito sa health worker" | "My TB check: show this to the health worker" / "Ang aking TB check: ipakita ito sa health worker" | v8 pack :374, :375. |
| `chrome.nav_a11y` | "Accessibility" / "Accessibility" | "Accessibility" / "Aksesibilidad" | v8 pack :23, its new footer-link row; V11. FIL-REVIEW. Was the prototype's (SiteFooter.dc.html). |
| `chrome.safety` | "This site gives general information. It is not a diagnosis. If you've had a cough for 2 weeks or more, get tested — it's free at public health centers." / "Pangkalahatang impormasyon lamang ang nasa site na ito; hindi ito diyagnosis. Kung dalawang linggo ka nang inuubo o higit pa, magpasuri — libre ito sa mga pampublikong health center." | "This site gives general information. It is not a diagnosis. If you've had a cough for 2 weeks or more, get tested. It's free at public health centers." / "Pangkalahatang impormasyon lamang ang nasa site na ito; hindi ito diyagnosis. Kung dalawang linggo ka nang inuubo o higit pa, magpasuri. Libre ito sa mga pampublikong health center." | v8 pack :28, :29. |
| `dotStory.b2` | "That's about 2,000 people every day — more than one every minute." / "Mga 2,000 katao iyan bawat araw — higit sa isa kada minuto." | "That's about 2,000 people every day, more than one every minute." / "Mga 2,000 katao iyan bawat araw, higit sa isa kada minuto." | v8 pack :53, :54. |
| `dotStory.b4_h2` | "TB took about 37,000 lives — nearly 100 every day." / "Mga 37,000 buhay ang kinuha ng TB — halos 100 bawat araw." | "TB took about 37,000 lives, nearly 100 every day." / "Mga 37,000 buhay ang kinuha ng TB, halos 100 bawat araw." | v8 pack :65, :66. |
| `home.lede` | "Chest X-ray, TB test and free medicines — near you, step by step." / "Chest X-ray, TB test at libreng gamot — malapit sa iyo, hakbang-hakbang." | "Chest X-ray, TB test and free medicines near you, step by step." / "Chest X-ray, TB test at libreng gamot na malapit sa iyo, hakbang-hakbang." | The v8 prototype (Home.dc.html), V6; it is also Home's share preview (og:description). FIL-REVIEW. |
| `learn.l2_p1` | "TB spreads through the air. When someone with TB in the lungs coughs, sneezes or spits, tiny droplets carry the germs, and people nearby breathe them in. Inhaling just a few germs is enough to get infected. That's why TB passes most easily between people who share a room for a long time — at home, at work and in crowded places." / "Kumakalat ang TB sa hangin. Kapag umubo, bumahing o dumura ang taong may TB sa baga, napupunta sa hangin ang maliliit na patak na may dalang mikrobyo, at nalalanghap ito ng mga taong malapit. Kaunting mikrobyo lang ang kailangang malanghap para mahawa. Kaya pinakamadaling magkahawaan ang mga taong matagal na magkasama sa iisang kuwarto — sa bahay, sa trabaho at sa mataong lugar." | "TB spreads through the air. When someone with TB in the lungs coughs, sneezes or spits, tiny droplets carry the germs, and people nearby breathe them in. Inhaling just a few germs is enough to get infected. That's why TB passes most easily between people who share a room for a long time: at home, at work and in crowded places." / "Kumakalat ang TB sa hangin. Kapag umubo, bumahing o dumura ang taong may TB sa baga, napupunta sa hangin ang maliliit na patak na may dalang mikrobyo, at nalalanghap ito ng mga taong malapit. Kaunting mikrobyo lang ang kailangang malanghap para mahawa. Kaya pinakamadaling magkahawaan ang mga taong matagal na magkasama sa iisang kuwarto: sa bahay, sa trabaho at sa mataong lugar." | v8 pack :100, :102. |
| `learn.l5_h` | "Getting tested — it's free" / "Magpasuri — libre ito" | "Getting tested: it's free" / "Magpasuri: libre ito" | v8 pack :119: a colon, as every v8 heading has. |
| `learn.l5_ol1` | "A health worker asks about your symptoms and may send you for a chest X-ray. PhilHealth's Konsulta package covers chest X-rays for registered members." / "Tatanungin ka ng health worker tungkol sa iyong mga sintomas at maaaring ipa-chest X-ray ka. Sakop ng Konsulta package ng PhilHealth ang chest X-ray para sa mga rehistradong miyembro." | "A health worker asks about your symptoms and may send you for a chest X-ray. PhilHealth's YAKAP package (formerly Konsulta) covers chest X-rays for members registered at a YAKAP clinic." / "Tatanungin ka ng health worker tungkol sa iyong mga sintomas at maaaring ipa-chest X-ray ka. Sakop ng YAKAP package ng PhilHealth (dating Konsulta) ang chest X-ray para sa mga miyembrong rehistrado sa isang YAKAP clinic." | v8 pack :122, :123, which carry V10's wording. The Filipino is flagged FIL-REVIEW (V10). |
| `learn.l5_ol2` | "You give a sputum (phlegm) sample. It's checked with a rapid molecular test such as Xpert MTB/RIF or TB-LAMP. Xpert can also show whether the TB resists rifampicin, a key TB medicine." / "Magbibigay ka ng sample ng plema. Susuriin ito gamit ang mabilis na molecular test gaya ng Xpert MTB/RIF o TB-LAMP. Kaya ring ipakita ng Xpert kung hindi tinatablan ng rifampicin — isang mahalagang gamot sa TB — ang iyong TB." | "You give a sputum (phlegm) sample. It's checked with a rapid molecular test such as Xpert MTB/RIF or TB-LAMP. Xpert can also show whether the TB resists rifampicin, a key TB medicine." / "Magbibigay ka ng sample ng plema. Susuriin ito gamit ang mabilis na molecular test gaya ng Xpert MTB/RIF o TB-LAMP. Kaya ring ipakita ng Xpert kung hindi tinatablan ng rifampicin (isang mahalagang gamot sa TB) ang iyong TB." | v8 pack :125: brackets for the em dashes. Filipino only: the English had none. |
| `learn.l6_p5` | "Most people feel better within a few weeks. Keep going anyway — stopping early can bring TB back and make it resistant to medicines." / "Karamihan ay bumubuti ang pakiramdam sa loob ng ilang linggo. Ituloy pa rin — kapag huminto nang maaga, maaaring bumalik ang TB at hindi na ito tablan ng gamot." | "Most people feel better within a few weeks. Keep going anyway. Stopping early can bring TB back and make it resistant to medicines." / "Karamihan ay bumubuti ang pakiramdam sa loob ng ilang linggo. Ituloy pa rin. Kapag huminto nang maaga, maaaring bumalik ang TB at hindi na ito tablan ng gamot." | v8 pack :137, :143. [REVIEW] stays (Learn L6's clinical review is pending). |
| `learn.l8_ul1` | "Let fresh air in. Open windows — TB germs build up in closed, crowded rooms." / "Papasukin ang sariwang hangin. Buksan ang mga bintana — naiipon ang mikrobyo ng TB sa saradong kuwartong maraming tao." | "Let fresh air in. Open windows. TB germs build up in closed, crowded rooms." / "Papasukin ang sariwang hangin. Buksan ang mga bintana. Naiipon ang mikrobyo ng TB sa saradong kuwartong maraming tao." | v8 pack :152, :157. |
| `learn.l9_p2` | "TB can still cost families a lot even when the medicines are free — fares, lost income, food. In the first national patient cost survey, 42% of TB-affected households faced catastrophic costs, meaning TB costs above 20% of yearly household income. For drug-resistant TB, it was 90%. Ask your health center what support is available in your area." / "Malaki pa rin ang gastos ng TB sa mga pamilya kahit libre ang gamot — pamasahe, nawawalang kita, pagkain. Sa unang pambansang survey ng gastos ng mga pasyente, 42% ng mga sambahayang may TB ang nakaranas ng "catastrophic" na gastos, ibig sabihin ay lumampas sa 20% ng taunang kita ng sambahayan ang gastos sa TB. Sa drug-resistant TB, 90% ito. Itanong sa inyong health center kung anong tulong ang mayroon sa inyong lugar." | "TB can still cost families a lot even when the medicines are free: fares, lost income, food. In the first national patient cost survey, 42% of TB-affected households faced catastrophic costs, meaning TB costs above 20% of yearly household income. For drug-resistant TB, it was 90%. Ask your health center what support is available in your area." / "Malaki pa rin ang gastos ng TB sa mga pamilya kahit libre ang gamot: pamasahe, nawawalang kita, pagkain. Sa unang pambansang survey ng gastos ng mga pasyente, 42% ng mga sambahayang may TB ang nakaranas ng "catastrophic" na gastos, ibig sabihin ay lumampas sa 20% ng taunang kita ng sambahayan ang gastos sa TB. Sa drug-resistant TB, 90% ito. Itanong sa inyong health center kung anong tulong ang mayroon sa inyong lugar." | v8 pack :164, :166. |
| `meta.homeTitle` | "TB PH — Find your way to TB care" / "TB PH — Hanapin ang daan papunta sa gamutan sa TB" | "TB PH \| Find your way to TB care" / "TB PH \| Hanapin ang daan papunta sa gamutan sa TB" | V9 quotes both; the English is also the v8 prototype's `<title>` (Home.dc.html). FIL-REVIEW. |
| `meta.placesTitle` | "Find TB care near you — TB PH" / "Hanapin ang gamutan malapit sa iyo — TB PH" | "Find TB care near you \| TB PH" / "Hanapin ang gamutan malapit sa iyo \| TB PH" | V9. English: the v8 prototype's `<title>` (Places.dc.html); Filipino: the Filipino H1, then the brand. FIL-REVIEW. |
| `meta.checkTitle` | "Check symptoms — TB PH" / "Suriin ang sintomas — TB PH" | "Check symptoms \| TB PH" / "Suriin ang sintomas \| TB PH" | V9. English: the v8 prototype's `<title>` (Check.dc.html); Filipino: the nav label (pack :19), then the brand. FIL-REVIEW. |
| `meta.notFoundTitle` | "Page not found — TB PH" / "Hindi namin mahanap ang pahinang iyon — TB PH" | "Page not found \| TB PH" / "Hindi namin mahanap ang pahinang iyon \| TB PH" | V9. English: the v8 prototype's `<title>` (404.dc.html); Filipino: the Filipino H1 without its full stop, then the brand. FIL-REVIEW. |
| `meta.offlineTitle` | "Offline — TB PH" / "Wala kang koneksiyon — TB PH" | "Offline \| TB PH" / "Wala kang koneksiyon \| TB PH" | V9. English: the v8 prototype's offline page (sw.js); Filipino: its first sentence without the full stop, then the brand. FIL-REVIEW. |

The titles the views build have no dictionary id of their own. They join the page's own words and the brand with `pageTitle()` (`src/lib/title.ts`, V9), and `og:title` is the same text:

| Page | Was | Ships |
|---|---|---|
| About (`src/views/About.astro`) | "About — TB PH" / "Tungkol sa amin — TB PH" | "About \| TB PH" / "Tungkol sa amin \| TB PH" |
| Data (`src/views/Data.astro`) | "The data — TB PH" / "Ang datos — TB PH" | "The data \| TB PH" / "Ang datos \| TB PH" |
| Install (`src/views/Install.astro`) | "Install the app — TB PH" / "I-install ang app — TB PH" | "Install the app \| TB PH" / "I-install ang app \| TB PH" |
| Learn (`src/views/Learn.astro`) | "Learn about TB — TB PH" / "Alamin ang TB — TB PH" | "Learn about TB \| TB PH" / "Alamin ang TB \| TB PH", as V9 quotes them |
| Each place (`src/views/Place.astro`, and `src/islands/PlaceShell.tsx` offline) | "{name} — TB PH" | "{name} \| TB PH" |

Not a string: an empty table cell on the Data page shows an en dash, "–", instead of "—" (`src/lib/charts/primitives.ts`; V8 keeps en dashes for ranges and empty table cells).

**Compared with the v8 pack and kept** (step 15.1). The owner's own wording above stays where the v8 pack still has a placeholder, contradicts a later decision or has no such text:
- `about.lede` (A2): the pack's Mission (:748–749) still has "[group name]" and the partner hospitals (A1, A2).
- About's "Our partners", "Medical review" and Contact sections stay out (A1, A3): the pack still has their placeholders (partner logos to come, "[name, credentials, hospital] on [date]", "[email]").
- `about.n1555_note` (V4): the pack's Helpful numbers row (:780) still says "**[VERIFY]** before launch". The v8 prototype (About.dc.html) already has V4's wording.
- `about.a11yText` (A3): the pack has no accessibility statement, and the v8 prototype's still ends with the "[email]" sentence A3 drops.
- `about.privacyServices` (Q5), `chrome.creditOsm` (Q8), `meta.aboutDescription` (A1), the Filipino descriptions (Q3) and the …NoCheck twins (Q9): the pack has no such text.
- The README and prototype wording above (`chrome.nav_home`, `chrome.credit`, `care.commute`, `care.call`, `care.sakay`, `check.res_A_find`, `dotStory.b7_find`, `about.updatesText`): the v8 pack's lines are v6's, one or two lines further down, so README and the prototype still win (Q3).

None of these has an em dash.
