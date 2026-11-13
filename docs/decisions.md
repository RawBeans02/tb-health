# TB Health — owner decisions

Decisions the owner (Rovince) made, recorded by the TB Health lead. Question numbers refer to `docs/PLAN.md` §7.1. A decision counts only once the owner has given it; recommendations and defaults in PLAN.md are not decisions until they're listed here (or, for §7.2 defaults, until the owner overrides them).

The lead keeps this file. The Jr. Builder reads it and doesn't edit it.

## 14 November 2026 (owner, in chat with the lead)

### V23. Step 15's defaults stay as they went live
- **The owner keeps every step 15 default listed under "Now" in `docs/owner-queue.md`.** The owner answered "Keep them all" to the lead's question "Keep all of step 15's defaults as they went live?" on 14 Nov 2026, after the lead's review of the stand-in lead's step 15 work (9075def to ddb4317) found no defects.
- From step 15.4 (worst-case data):
  - in Filipino, the Government badge "Pampubliko (libreng gamutan sa TB)" wraps onto two lines on a 320px phone, instead of the brief's `white-space: nowrap`; no shorter badge is needed;
  - Call keeps the launch rule (audit O10, option a): it dials the first number any phone can dial, and the whole phone field stays under Details;
  - the two small departures from v8: the Commute button in a route row pads 14px instead of 18px, and the filter segments are at least as wide as their longest word.
- The lead's calls in step 15:
  - no GitHub Actions (V21), with the Linux check in Docker on the Mac;
  - phone feel (15.3): Home's "I need" rows and Check's answers get the pressed state; a do-nothing touch listener lets iPhones show it; the Filters sheet is sized in `dvh`;
  - the Places map (V22): the device's main pointer decides, so a touch-screen laptop keeps one-finger drag, and no two-finger hint is written;
  - the Filters sheet (15.5): no spring or rubber band when it's pulled up.
- Nothing changes in the site, so nothing needs a release.

## 13 November 2026 (owner, in chat with the stand-in lead and the Account Admin)

### R4. The owner checks step 15's device list after the release
- **The owner checks the device list on a real iPhone and an Android phone, after the release.** The owner answered "I'll check them" to the stand-in lead's question "Who checks the site on a real iPhone and Android phone after the release?" on 13 Nov 2026. The list is "The device list (step 15)" in `docs/AUDIT-build.md`.
- **Done the same night:** the owner reported "check done, its great, even the night mode" on 13 Nov 2026. No item was reported failing.

### R3. The step 15 release ships the strings that wait on the clinical review (release key [review])
- **The owner accepts the release check's [review] key for the step 15 release:** the 13 strings R1 lists ship again before their clinical review. Twelve are word for word what the launch shipped; `learn.l6_p5`'s em dash became a full stop, in English and Filipino (the v8 pack, V8). The owner answered "Yes, release" to the stand-in lead's question "Release step 15 to the live site, with the 13 review strings as at launch?" on 13 Nov 2026, and gave the Account Admin the same answer before it ran the release.
- **What follows:** the release ran `npm run release-check -- --accept=review`, and the gate accepted [review] only (`docs/release-2026-11-13.md`). Like R1, this covers one release: a later release asks again.
- **Still open:** the clinical review itself. The [REVIEW] flags stay on these strings until it is recorded.

## 11 November 2026, after step 15.3 (owner, in chat with the stand-in lead)

### V22. On touch screens, one finger scrolls the page past the Places map (audit O9)
- **Option (a) of audit O9.** The stand-in lead asked "Fix the Places map's one-finger drag (audit O9) now?" after step 15.3, and the owner answered "Yes, fix O9" on 11 Nov 2026.
- Where the main pointer is a finger (`pointer: coarse`), the map no longer pans with one finger, so one finger scrolls the page past it. Two fingers pan and zoom the map. With a mouse or trackpad, dragging is unchanged.
- This departs from v8's Places prototype, which keeps Leaflet's one-finger drag (`L.map(el, { scrollWheelZoom: false })`).
- The smaller fix the 15.3 report put with it: Leaflet's own hover looks on the map's controls (the zoom buttons, the credits, a popup's close button) show only with a mouse, like the site's own (B29).
- No hint was written. If testers on the device list don't find the two-finger pan, a hint is new copy and comes back to the owner.

## 11 November 2026, 16:42 (owner, in the Account Admin's chat, relayed to the stand-in lead)

### V21. No GitHub Actions (goes further than D22's 6 November amendment)
- **TB Health uses no GitHub Actions, and neither do the owner's other personal projects.** The owner said it in the Account Admin's chat, which relayed it to the stand-in lead: "we wont use the run actions, we only did that before for the kitamo, but these are not website products that require a prod, these are personal projects".
- No workflow is planned, added or fixed. Every check runs locally on the Mac, through the memory guard (`_handoff/lowmem-run.sh`). The Linux check is `scripts/linux-check.sh`, in Docker on the Mac (D22, amended 6 Nov). The launch went without it (R2); whether a later release runs it is the owner's call. It hasn't been run yet.
- D22's 6 November amendment had kept `.github/workflows/ci.yml`, manual only, "if the hold is lifted". This decision goes further: there's no GitHub run to keep it for.
- **The stand-in lead's call, which the owner can object to:** step 15.7 removed `.github/workflows/ci.yml`. It had only a manual trigger, and GitHub refused each run started with it before any step ran (D22). `scripts/linux-check.sh` is now the only definition of the Linux check, and HANDOVER and PLAN's D22 say so. The decision waited for 15.7 because the step 15.3 session shared the checkout.

## 11 November 2026 (owner, in chat with the stand-in lead)

Why: the lead on the main account paused at its weekly limit on 11 November. Until it resets (Friday 13 November, 1 PM Manila), a session on the desktop account is lead and builder. It put the open points from the lead's handoff and from the step 15.2 reviews to the owner, each with a default. The owner answered "Use the defaults", so V15 to V20 are those defaults.

### V15. Open points from the lead's handoff
- The data file's title keeps its em dash ("TB in the Philippines — data pack"). It's never shown, and the pipeline writes it.
- Learn L5 cites S13 only, as the v8 pack does. S24 isn't added.
- check-dashes stays strict: a build stops if a PhilHealth clinic name or address has an em dash. HANDOVER's refresh notes are to say so (step 15.7).
- The dark contrast pairs: v8's HANDOFF has no list, so the contrast test checks the light pairs against the dark values, plus the pairs dark mode adds.
- The old Jr. Builder's notes on the Linux check in Docker go into HANDOVER, with the results marked "not run yet".
- The test copy is built without Check (`TBPH_CHECK=false`), like production.

### V16. The primary button's hover in dark mode is #288287
- theme.css's #2A878C gives white text 4.25:1. That's under AA for the two 18px bold labels: "Clear filters" on Places, and the button at the end of Data's story.
- #288287 is the nearest shade of it that reaches 4.5:1 (4.53:1), and it's still lighter than the resting #22777C.
- Light mode is unchanged.

### V17. Selected segments and the current language in dark mode
- They take the look v8 gives Data's d5 toggle (Data.dc.html): an Ink fill (#E7ECEF) with Surface text (#182126), 13.7:1.
- theme.css's ink-fill (#44535C) was 2.05:1 against the surface, under the 3:1 a state needs.
- Light mode is unchanged. The info disc and the skip link keep ink-fill.

### V18. Over the Places map, the header and tab bar turn solid in dark mode
- The map keeps its light colours (V7), so the dark glass over it turns grey and the current tab's label falls to about 3.1:1.
- While the map shows, the bars take the solid fallback that Increase Contrast and Reduce Transparency already use.
- Light mode is unchanged.

### V19. Dark values accepted as they are
- d2's "Missed" label stays as it is for now: 4.42:1 in dark, 4.48:1 in light.
- These stay under 3:1 in dark only, because the same information is also given in text:
  - the progress and stop lines (1.98:1);
  - the dot story's died against fell-ill dots (2.50:1);
  - d7's "Not evaluated" and "Treatment failed" swatches (1.17:1).
- The dot story's "died" legend swatch stays Ink, so it matches the dots. DotStory.dc.html's legend uses ink-fill.

### V20. The dot story's Filipino label for beat 4
- It calls the died dots "itim" (black), but in dark mode they're near-white.
- The wording stays for now and goes on the Filipino review list (`docs/owner-queue.md`).

## 4 November 2026, fourth batch (owner, written to the lead)

Why: the owner compared the live site (https://tb-ph.pages.dev) with the v8 design project and approved a fix pass, step 15 (`docs/step-15-fix-pass.md`). The owner sent this batch with `TB-PH-v8.zip` on 10 November 2026 and asked for it to be recorded as "4 November 2026, owner, fourth batch". **Where it differs from PLAN.md, it wins.** R2 (the v6 design) covered the launch; from step 15 on, v8 applies. V6 to V14 are the owner's items 1 to 9.

### V6. v8 is the newest design reference
- **`design/v8/` is the newest design reference. Wherever v6, v7 and v8 differ, v8 wins.** `design/v8/HANDOFF.md` lists every change under "v7" and "v8".
- `design/v8/` is the zip's `design-v8/`, copied unedited. It's reference only: don't edit it. V1's `design/v7/` never reached the repository.

### V7. Dark mode ships (overrides D2)
- Use the `--tb-*` tokens in `design/v8/theme.css`. Light values are unchanged; dark values apply with `prefers-color-scheme: dark`. **No in-app switch.**
- These keep their colours on purpose:
  - the urgent Film screen and its white "Call 911" button;
  - the saved summary image, which is always light;
  - the map tiles and markers.
- In dark mode the dot story's TB red is `#F26A72`, D14's TB red in dark mode. The other dark values are in `design/v8/DotStory.dc.html` › `applyScheme` (step 15.2).

### V8. No em dashes in copy (overrides D6)
- The copy baseline is now `design/v8/design_handoff_tb_ph/reference/content-and-data-pack.md`, the v8 pack. It has no em dashes and uses the owner's approved wording.
- The parity test points at it, and every changed string is logged in `docs/copy-overrides.md`.
- En dashes stay for ranges and empty table cells.

### V9. Page titles use " | " instead of " — "
- In English and Filipino:
  - "TB PH | Find your way to TB care"
  - "Learn about TB | TB PH"
  - "TB PH | Hanapin ang daan papunta sa gamutan sa TB"
  - "Alamin ang TB | TB PH"
- `og:title` follows the same pattern.

### V10. Learn L5, step 1
- EN: "A health worker asks about your symptoms and may send you for a chest X-ray. PhilHealth's YAKAP package (formerly Konsulta) covers chest X-rays for members registered at a YAKAP clinic."
- FIL, flagged FIL-REVIEW: "Tatanungin ka ng health worker tungkol sa iyong mga sintomas at maaaring ipa-chest X-ray ka. Sakop ng YAKAP package ng PhilHealth (dating Konsulta) ang chest X-ray para sa mga miyembrong rehistrado sa isang YAKAP clinic."

### V11. The Filipino label for Accessibility is "Aksesibilidad"
- It's used for the footer link and the About section heading, and flagged FIL-REVIEW. The English stays "Accessibility".

### V12. Claims keep the 4 November rounding
- The rounding in `data/claims.json` stays as supplied on 4 November (V5).
- `build_claims.py` is replaced with `design/v8/design_handoff_tb_ph/pipeline/build_claims.py`, so future refreshes keep the same rounding. The lead checked on 10 November: the repository's copy (`design/design_handoff_tb_ph/pipeline/build_claims.py`; there is no top-level `pipeline/`) and `data/claims.json` were already identical to v8's, so neither changed.

### V13. glisse is not adopted
- It's React-only, pre-1.0, and its SVG refraction is heavy for low-end Android phones. It also has no reduced-transparency or high-contrast fallback.

### V14. New skills for step 15
- In `.claude/skills/`: `mobile-native`, `break-ui`, `review-animations`, `animation-performance`, `emil-design-eng` and `apple-motion`. `apple-motion` is the motion skill from skills-main, renamed so it doesn't clash with the HIG `apple-design` skill. The builder uses them in step 15.
- They're in the checkout's `.claude/skills/` on the owner's Mac, with the zip's `apple-design` (the HIG skill), not in the repository. The Mac's user-level `~/.claude/skills/apple-design` is still the motion skill, so ask for the HIG skill as `apple-design-hig` (its user-level copy) to be sure which one loads.

### Still open
- Who builds step 15: the Jr. Builder moved to another project on 10 November 2026.

## 9 November 2026 (owner, in chat with the lead)

### A3. About: no contact email at launch
- **The site launches without a contact email.** The owner answered "launch without one" to the lead's question "Will you send the contact email, or launch without one?" on 9 Nov 2026. About drops the prototype's Contact section (its row was the "[email]" placeholder), and the accessibility text drops its last sentence, "If something doesn't work for you, tell us at [email]." (FIL "Kung may hindi gumagana para sa iyo, sabihin sa amin sa [email].").
  - `about.a11yText`: EN "We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. The site works with a keyboard and screen readers, uses large text and strong contrast, and every chart has a table version. Known limitation: the optional map works best with a mouse or touch, so the same places are always listed as text." FIL "Layunin naming maabot ang Web Content Accessibility Guidelines (WCAG) 2.2, level AA. Gumagana ang site gamit ang keyboard at screen reader, malalaki ang titik at malinaw ang kulay, at may talaan ang bawat chart. Limitasyon: pinakamainam gamitin ang mapa gamit ang mouse o touch, kaya laging nakalista rin bilang teksto ang parehong mga lugar."
- **Still open:** a contact email, which brings both back.

### A2. About: the group's name and the intro
- **The group is Amazing Research Labs.** The owner sent "https://amazinglabs.org/ here is the team" on 9 Nov 2026. The site names it Amazing Research Labs (Amazing Research Labs Organization, Inc.), a nonprofit applied research organization. Only the organization is named on About, not its people.
- **The intro drops the partner hospitals.** The owner answered "Yes, drop it" to the lead's question "Drop "working with partner hospitals" from the About intro?" on 9 Nov 2026, as no partners are named at launch (A1).
  - `about.lede`: EN "TB PH is a TB awareness project by Amazing Research Labs, a team of researchers and data scientists. We turn public TB data into clear information so more Filipinos get tested early and finish treatment." FIL "Ang TB PH ay proyekto para sa kamalayan sa TB ng Amazing Research Labs, isang pangkat ng mga mananaliksik at data scientist. Ginagawa naming malinaw na impormasyon ang pampublikong datos tungkol sa TB, para mas maraming Pilipino ang magpasuri nang maaga at tumapos ng gamutan."
- **Still open:** the contact email for the Contact and Accessibility rows.

### R2. Launch on the v6 design with the current defaults
- **The launch keeps the current defaults:** the v6 design (the v7 zip, with dark mode and the v7 wording, isn't on the Mac), no Linux check before launch (D22, amended 6 Nov), the smaller design items O2–O27 as they are (`docs/audit-2026-11-05.md`), and no alt text for the link-preview image. The owner answered "Yes, v6 defaults" to the lead's question "Launch on the v6 design with the other defaults?" on 9 Nov 2026.
- **Still open:** v7 when its files arrive; the O items stay listed in `docs/owner-queue.md` for after the launch.

## 8 November 2026 (owner, in chat with the lead)

### R1. The launch ships the strings that wait on the clinical review (release key [review])
- **The owner accepts the release check's [review] key for the launch:** the 13 strings flagged [REVIEW] ship before their clinical review. They are the route's step titles and texts (`care.stopTitle_xray`, `care.stopTitle_test`, `care.stopTitle_meds`, `care.stopText_xray`, `care.stopText_test`, `care.stopText_meds`) and Learn's Treatment section (L6: `learn.l6_h`, `learn.l6_p1` to `learn.l6_p6`), all verbatim from the content pack. The owner answered "Yes, ship them" to the lead's question "Ship the 13 strings still awaiting clinical review with the launch?" on 8 Nov 2026.
- **What follows:** the release command runs `npm run release-check -- --accept=review` (HANDOVER, "Each release", step 4). Check stays out of the launch build (Q9).
- **Still open:** the clinical review itself. The [REVIEW] flags stay on these strings until it is recorded, and launch-check keeps listing them.

### A1. About: no partner-hospitals or medical-reviewer rows at launch
- **The About page launches without the prototype's "Our partners" and "Medical review" sections** (README:245 lists them; their rows were placeholders: "Partner hospitals (names and logos to come)" and "Health content reviewed by [name, credentials, hospital] on [date]"). The owner answered "Yes, drop both" to the lead's question "Drop the partner-hospitals and medical-reviewer rows for launch?" on 8 Nov 2026.
- **What follows:** About's page description no longer promises how the health content is reviewed: `meta.aboutDescription` EN "Who makes TB PH, privacy, accessibility, data updates and helpful phone numbers." FIL "Kung sino ang gumagawa ng TB PH, privacy, accessibility, mga update sa datos at mga numerong makatutulong." (the prototype's and Q3's wording without that clause, as the owner queue said it would be).
- **Still open:** the clinical review itself (Check, Learn L6) is unchanged and still pending; the sections come back when there are partner names or a reviewer to name.

### Q8. The OpenStreetMap credit (the owner's wording)
- **The owner approved the lead's draft** of the credit for the clinic positions. They are OpenStreetMap data, from the Nominatim lookups of the Q8 run (7 Nov), and OpenStreetMap asks for a credit wherever its data is used (PLAN.md, Q8: "wording yours"). The owner answered "Approve the credit" to the lead's question "Approve the OpenStreetMap credit for the site footer?" on 8 Nov 2026.
  - `chrome.creditOsm`: EN "Clinic positions:" FIL "Mga lokasyon ng klinika:". In every page's footer, under the data credit, it's followed by "© OpenStreetMap contributors", a link to https://www.openstreetmap.org/copyright, the same in both languages (the map already credits OpenStreetMap the same way).

### Q5. The privacy row (the owner's wording)
- **The owner approved the lead's draft** of `about.privacyServices`, the About › Privacy row on outside services (item 5 of the lead's launch wording list, drafted 7 Nov 2026). The owner answered "Approve all" to the lead's question "Do you approve the launch wording file as drafted?" on 8 Nov 2026. That approves items 5–17; items 1–4 (group name, contact email, partner hospitals, medical reviewer) ask for facts and are still open. It ships as written:
  - `about.privacyServices`: EN "TB PH serves its own fonts, so no font service sees your visit. Our web host, Cloudflare, sees your IP address, your browser and the pages you open. The map comes from OpenStreetMap, and only if you open it; OpenStreetMap then sees your IP address and the area on the map, which is around you if you used your location. Directions open in Google Maps, which then sees the place you chose. For Sakay.ph, we copy the address and open sakay.ph, which sees it only if you paste it there. Calls go through your phone." FIL "Ang TB PH mismo ang nagbibigay ng mga font nito, kaya walang font service na nakakakita sa pagbisita mo. Nakikita ng aming web host, ang Cloudflare, ang IP address mo, ang browser mo at ang mga pahinang binubuksan mo. Galing sa OpenStreetMap ang mapa, at kapag binuksan mo lang ito; makikita ng OpenStreetMap ang IP address mo at ang lugar na nasa mapa, na nasa paligid mo kung ginamit mo ang lokasyon mo. Sa Google Maps bumubukas ang direksiyon, kaya makikita nito ang lugar na pinili mo. Para sa Sakay.ph, kinokopya namin ang address at binubuksan ang sakay.ph; makikita lang nito ang address kung i-paste mo ito roon. Dumadaan sa phone mo ang mga tawag."

### Q3. Filipino page descriptions (the owner's wording)
- **The owner approved the lead's drafts** of the Filipino descriptions (items 13–17). The English stays the prototype's. `meta.installDescription` is the version for a build with Check; a build without Check ships `meta.installDescriptionNoCheck` (Q9 below).
  - `meta.aboutDescription`: "Kung sino ang gumagawa ng TB PH, paano sinusuri ang nilalamang pangkalusugan, privacy, accessibility, mga update sa datos at mga numerong makatutulong."
  - `meta.dataDescription`: "Ang TB sa Pilipinas sa mga numero: mga kaso, pagkamatay, mga kasong hindi natutukoy, pagsusuri, gamutan, pondo at pag-iwas, kasama ang mga pinagmulan at talaan ng bawat chart."
  - `meta.installDescription`: "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at nabubuksan pa rin ang planner, ang symptom check at ang Alamin kahit walang signal."
  - `meta.learnDescription`: "Ano ang TB, paano ito kumakalat, mga senyales at sintomas, sino ang mas nanganganib, libreng pagsusuri at gamutan, drug-resistant TB, pag-iwas, pamumuhay nang may TB, at mga maling akala."
  - `meta.placeDescription`: "Mga serbisyo, oras, telepono at direksiyon ng isang TB-DOTS center sa Pilipinas."

### Q9. Launch wording without Check (the owner's wording)
- **The owner approved the lead's drafts** for a build without Check (items 6–12). Each cuts the symptom check from a string that named it; the 404's lead says "This" above its single button. A build without Check ships these instead of the strings they replace, and leaves out `install.off2` and `home.bring3` (no new words):
  - `install.leadNoCheck`: EN "Add it to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." FIL "Idagdag ito sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."
  - `about.appTextNoCheck`: EN "Add TB PH to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." FIL "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."
  - `meta.installDescriptionNoCheck`: EN "Add TB PH to your home screen. It opens full screen, and the planner and Learn still open without a signal." FIL "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at nabubuksan pa rin ang planner at ang Alamin kahit walang signal."
  - `about.disclaimerTextNoCheck`: EN "This website provides general health information and does not replace a consultation with a doctor or health worker. In an emergency, call 911." FIL "Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Sa emergency, tumawag sa 911."
  - `about.privacy1NoCheck`: EN "There are no accounts, and we don't collect personal information." FIL "Walang account, at hindi kami kumukuha ng personal na impormasyon."
  - `notFound.leadNoCheck`: EN "The link may be old or mistyped. This will get you back on track:" FIL "Maaaring luma o mali ang link. Makatutulong ito:"

## 7 November 2026 (owner, in chat with the lead)

### Q7. Public launch tonight, at the free pages.dev address (answers Q7 in part)
- **The site goes public tonight, 7 November 2026, at the free `*.pages.dev` address** that Cloudflare gives the project. The owner answered "Public, free address" to the lead's question "What must be live tonight?". The other options were a public launch on a real domain, which would have to be bought and set up tonight, and a test copy only.
- **Why:** the owner's deadline is tonight.
- **What follows:**
  - The release is built with `SITE_URL=https://<subdomain>.pages.dev`, the address `pages project create` prints (HANDOVER, "Each release").
  - Installed apps are tied to that address. If a domain comes later, anyone who installed the app before the move has to install it again.
  - Under Q9 (4 Nov), the clinical review isn't done, so the launch is built with `TBPH_CHECK=false`.
- **Still open:** the domain (Q7), and the rest of what the launch needs from the owner (`docs/owner-queue.md`).

### Q8. The full clinic list: run the pipeline now
- **The owner approved the pipeline run.** The owner answered "Yes, run it" to the lead's question "May the builder fetch the full clinic list from PhilHealth now?". The question said what the run does:
  - downloads PhilHealth's TB-DOTS list, one PDF;
  - looks up about 2,100 clinic addresses on OpenStreetMap's Nominatim, one per second;
  - installs two Python packages, pdfplumber and requests.
- **The lead ran it** in the lead's scratch folder, not the builder's checkout, so the hour of lookups could start at once.
  - **The PDF:** `DOTS_093026.pdf`, "List of Accredited TB DOTS Clinics for CY 2026 Updated as of September 30, 2026".
    - It was the only TB-DOTS list on PhilHealth's page on 7 Nov 2026 (Last-Modified 15 Oct 2026).
    - 4,017,609 bytes, SHA-256 `afb171c6aff3a3a0ba0591b6f765b1afeebb746379ffd05c4f51803d77ecf612`.
  - **The parse:** 2,097 facilities in all 17 regions, rows 1–2,097 with no gaps or duplicates, and all 85 pages read as ruled tables.
  - **The lookups:** the pipeline's queries, parameters and 1.1-second pause, in one thread, with every result cached.
    - No contact email was given, so the User-Agent names the project's public repository: `TB-PH-route-planner (https://github.com/RawBeans02/tb-health)`. The owner can give an email instead.
    - Every city is looked up first. Then come the address and name lookups, starting with the cities that have the most clinics.
    - A clinic the lookups don't reach before the launch keeps its city's pin, and the site marks its distance as approximate.

## 6 November 2026 (owner, in chat with the lead)

### D22. Linux tests without GitHub Actions (amends D22)
- **The release audit doesn't wait for GitHub Actions.** The owner answered "Yes, skip Actions" to the lead's question "Should the release audit use the builder's Docker run instead of GitHub's CI?"
- **Why:** GitHub refused all five CI runs before any step started (42047181969, 42049823367, 42130658469, 42161612422 and 42169442426, 5–6 Nov). The cause was a billing hold on the GitHub account, not the code. Nothing else in TB Health uses Actions: pushes are plain git, and deploys go from the Mac to Cloudflare Pages (Q7).
- **The test evidence for step 14:**
  - the builder's full run on the Mac (the b941275 gate);
  - `ci.yml`'s steps, in its order, run on Linux in Docker on the Mac:
    - The owner approved this run on 6 Nov, answering "Yes, run them".
    - It runs against a fresh export of the pushed commit, with Node 22.23.4 and `CI=true`, in Microsoft's Playwright image for our version (`mcr.microsoft.com/playwright:v1.64.1-noble`).
    - Like CI, it ends with `npm audit`, which sends the dependency list to the npm registry that `npm install` already uses.
    - It differs from GitHub's machine in two ways: it runs on arm64 instead of x86_64, and it uses the image's fonts and libraries instead of the runner's.
- **`.github/workflows/ci.yml` stays,** with its manual trigger only. It never runs unless someone starts it, so it costs nothing, and it works again if the hold is lifted. Launch doesn't need it.

## 5 November 2026 (owner, in chat with the lead)

### Q7. Host: Cloudflare Pages (the domain is still open)
- **Cloudflare Pages, in a Cloudflare account used only for TB Health**, which the owner controls. The owner answered "Yes, Cloudflare" to the lead's question "Host TB Health on Cloudflare Pages, in an account used only for TB Health?" No KitaMo account, project or token is used.
- *Lead's reading, 5 Nov 2026, for the owner to overrule:*
  - Deploys are HANDOVER's direct upload with wrangler, run by the owner from a clean checkout of `main` (B72). No Git integration and no automatic previews.
  - Until launch, test copies are preview deploys: non-production builds with noindex, on a branch other than `main`, at a `*.pages.dev` address. A deploy to `main` is the public launch (B86).
  - The owner creates the Cloudflare account and an API token for it, and keeps the token in the Mac's Keychain. Wrangler gets it per command, like `GH_TOKEN` for pushes. There is no global `wrangler login`, because other projects on this Mac share that login (B86). The builder and lead sessions never ask for the token or use it. Only the release lines the owner runs read it. Like gh's token, it can be read by any program running as this Mac user (B88).
- **Still open:** the real domain. It's needed before launch, because it fixes the installed app's address, and HSTS then gets `includeSubDomains`.

## 4 November 2026, third batch (owner, written to the lead)

Why: PLAN.md was written from the v6 handoff. The owner asked for more changes after v6, and they're in the v7 prototype (`TB-PH-project.zip`, 4 Nov 2026). **Where v6 and v7 differ, v7 wins.**

### V1. v7 is the newer design reference
- `TB-PH-project.zip` goes into the repo unzipped to `design/v7/`. `design/v7/HANDOFF.md` › "v7" lists every change. *(Pending: the zip isn't on the Mac yet; the owner is adding it to `~/Downloads`.)*
- `design/design_handoff_tb_ph/` (v6) stays untouched, except `pipeline/build_claims.py` (V5).

### V2. Dark mode ships (overrides D2)
- Use `design/v7/theme.css`. Its light values are the existing tokens; its dark values apply under `prefers-color-scheme: dark`. **No in-app switch.**
- These stay fixed (not themed) on purpose:
  - the urgent Film screen and its white "Call 911" button;
  - the saved summary image, which is always light;
  - the map tiles and markers.
- Contrast results are in HANDOFF › v7.
- In dark mode the dot story's TB red is `#F26A72`, the red token's dark value (amends D14).
- QA covers every page in light and dark.

### V3. No em dashes in copy (overrides D6)
- Where v7 changed a string, **the v7 wording is the owner's approved wording.** Ship it, log each case in `docs/copy-overrides.md`, and run the parity test against the v7 wording for those strings. This covers:
  - page titles (e.g. "Check symptoms | TB PH");
  - the footer safety line;
  - the sector badges "Government (free TB care)" and "Private (fees may apply)";
  - "Hours not listed. Call first.";
  - the Check intro and result texts;
  - "[partner clinicians, pending]" (the clinical review itself is still pending);
  - the Learn and Data lines listed in HANDOFF › v7.
- Any other copy string that still has an em dash: **list it for the owner. Don't reword it.**

### V4. DOH hotline 1555 is verified (closes that `[VERIFY]`)
- About's note uses the v7 wording:
  - EN: "Press 2 for the National Patient Navigation and Referral Center."
  - FIL: "Pindutin ang 2 para sa National Patient Navigation and Referral Center."
- Sources the owner gave:
  - GMA News, 2025: a DOH official named 1555 as the DOH hotline, alongside 911. https://www.gmanetwork.com/news/topstories/nation/953374/doh-habagat-evacuation-drinking-water/story
  - DOH-led inter-agency advisory, 29 Sep 2023: callers choose option 2 at 1555 for patient navigation and referral. https://bmb.gov.ph/wp-content/uploads/2023/10/PhiICZ_Advisory_on_Henipavirus_29Sep2023.pdf
  - Daily Tribune, 28 Apr 2025: DOH hotline 1555, option 2, for medical emergencies. https://tribune.net.ph/2025/04/28/bulusan-volcano-erupts-alert-level-1-raised
- The Sakay.ph deep links stay `[VERIFY]`.

### V5. The content conflicts are resolved (the list under D5 and §7.3)
- The claims now use the content pack's rounding:
  - about 7,500 deaths (the 2025 milestone, `target-endtb`);
  - 27,900 people with drug-resistant TB (`tx-dr`);
  - 14% and 12% for the trend since 2015 (`burden-trend`).
- `data/claims.json` and `design/design_handoff_tb_ph/pipeline/build_claims.py` are replaced with the owner's versions. The owner chose to overwrite the v6 copy of `build_claims.py`. The lead checked that only those three claims changed (EN and FIL); ids, order and sources are the same, and only `meta.generated` moved to 2026-11-04.
- No pipeline run is needed. D5's default (the d1–d15 takeaways stay the pack's text) still applies.

### Still open
Q7 (host and domain), Q8 (full clinic list), Q11 (WHO 2026 report), Q12 (lapsed accreditations), the Filipino descriptions (Q3) and the privacy text (Q5).

## 4 November 2026 (owner, in chat with the lead)

### Plan
- **`docs/PLAN.md` approved** as revised after the independent review (commit `7ea78ff`). The builder may start step 1 (scaffold) on `build/01-scaffold`.
- Q4–Q13 stay open. The lead asks the owner before the steps that need them (grouping as in §7.1). Until then, §7.2 defaults apply.

### Q2. Language URLs
- **Filipino at `/fil/…`**, English at `/…`, both prerendered (PLAN §4.2).
- **(a) Toggle:** two links with `aria-current` on the current language, replacing README's buttons with `aria-pressed`. Log it in `docs/copy-overrides.md` as a deliberate change from the README.
- **(b) Saved choice:** a reader whose saved choice (`tbph-lang`) is Filipino is sent from **every English page** to its `/fil/` twin, keeping query and hash. Not only `/` and app launch.
- (c), (d): accepted as the costs of this option (Filipino titles and descriptions; both-language copy on Check, Places and Home).

### Q3. Copy source
- **Approved as proposed:**
  - Content-pack copy (incl. §1 global and §5 Places) ships verbatim and parity-tested.
  - Where the pack has nothing (planner, Place, Install, 404), the prototype's strings ship verbatim, flagged for EN/FIL review.
  - Where README wording differs from the pack, **README wins**. Every case is listed in `docs/copy-overrides.md` for the owner to confirm.
  - The stop explanations ("Get a chest X-ray…", "usually in 6 months") ship flagged `[REVIEW]` with Learn L6.
- **No newer content pack.** `design/design_handoff_tb_ph/reference/content-and-data-pack.md` is the latest; build from it. (The `tb-ph-content-and-data.md` cited in design prompt v2 isn't coming.)
- **Filipino descriptions for About, Data, Install, Learn and Place: the owner will supply them later.** The builder lists the strings needed (origin `owner`) and writes none. They stay blocking items in `launch-check` until supplied; the build carries on meanwhile.
- Follows from Q3 = yes: defaults D10 and D11 apply as written.

### Q4. Privacy in URLs and location (asked ahead of step 3–4)
- **Approved as recommended:**
  - `near` goes in a URL only when it matches a known city or province, never free text such as a home address.
  - Location is asked for only when the visitor taps "Use my location", including on `?loc=gps` links, which show that button instead of prompting.
  - Fix the prototype bugs: the one-letter search (82 rows), the reused stale location fix, and Retry re-prompting.
- **(a) Place links carry only `id` and `stop`.** No `need`, `near` or `loc` in links into a place page (`need=meds` hints at treatment, and links reach browser history and host logs).
- **(b) No GPS distance on the Place page.** It shows a distance only from a typed `near` (a known city or province); there's no new location control and no new copy.

### Q6. Facility data (asked ahead of step 4)
- **Approved as recommended:**
  - If the facility list fails to load, production shows "could not be loaded / Try again". It never silently falls back to the 93-row sample.
  - Stable place ids derived from the normalised name + city + province, with a suffix on collisions and an alias map so old links keep working. `prepare-data` reports which ids changed between refreshes.
  - One prerendered page per place and language.

### Q5. OpenStreetMap tiles and the privacy text (asked ahead of steps 5 and 10)
- **Use the public OpenStreetMap tile server** for the optional Places map, as specced. Add `tile.openstreetmap.org` to the CSP's `img-src` (and nothing else) when the map is built.
- **The owner writes the new EN/FIL About privacy rows** (self-hosted fonts, map tiles, the host). The builder writes none: they're `owner` strings that block in `launch-check` until supplied.

### Q9. Launching without Check (asked ahead of step 7)
- **Yes: the site may go live without `/check`** if the clinical review isn't done by launch. Check is still built in full. One build-time switch leaves it out of the nav, the phone tab bar, the manifest shortcuts and the sitemap; the tab bar then shows the remaining tabs.
- *Lead's reading, 4 Nov 2026, for the owner to overrule:* "without `/check`" means the page isn't published at all. With the switch off:
  - `/check` and `/fil/check` aren't built, so they get the 404, and the service worker doesn't precache them;
  - every standalone link or button to Check in page content (the 404's "Check symptoms" button, and later Home and Learn) is dropped by the same switch;
  - where dropping a link would leave a sentence that still mentions the check, the builder lists it for the owner and doesn't reword it.

### Q10. Check question titles (asked ahead of step 7)
- **TB red, as specced** in the README (not Ink as AUDIT-v6 suggests).

### Q13. No-X-ray rule (asked ahead of step 3)
- **README:293's rule:** the referral note shows only when no confirmed X-ray site exists at all, not when none is within 10 km.

### Search quirks kept from the prototype (asked during step 4)
- **Fix all three.** None needs new copy:
  - common abbreviations find their place, e.g. "QC" finds Quezon City. A short abbreviation list is kept as data, and each entry is listed for the owner;
  - two letters match only the start of a word ("ab" no longer matches Malabon, Cabanatuan or Tabuk);
  - a typed city is placed at the centre of its clinics' pins, worked out from our own data, not at its first clinic's pin (which made the nearest clinic read "about 1 km").

## 30 October 2026 (owner, via the Account Admin)

### Q1. Node
- Node 22 LTS through nvm for tb-health only, pinned in `.nvmrc`. nvm's default alias and the global/Homebrew Node stay unchanged (the KitaMo builders use them).
