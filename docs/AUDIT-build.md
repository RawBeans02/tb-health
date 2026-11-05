# TB PH: build audit (step 14)

The builder's release audit in the SOT format (`design/design_handoff_tb_ph/reference/ultimate-build-source-of-truth.md`). It brings the lead's interim audit (`docs/audit-2026-11-05.md`, snapshot 6f759ff) up to the current build: that audit's findings, N/A rationale and Check routing result stand unless a row below says otherwise. What waits on the owner is in `docs/owner-queue.md`; the release steps are in `docs/HANDOVER.md`.

## Audit record

- **Project / Build:** TB PH
- **Platform:** Web (static PWA, Astro 7 + Preact islands)
- **Environment audited:** `dist/` served by `scripts/serve-dist.mjs` the way the chosen host (Cloudflare Pages, Q7, 5 Nov 2026) serves it (nested 404s, the `_headers` rules, Brotli/gzip), in Chromium and WebKit desktop profiles, iPhone 13 and Pixel 7 profiles, and Chromium with the service worker on. No deployed host yet (Q7), so host behaviour is a post-deploy check.
- **Branch / commit:** `build/14-release` (from `build/13-qa`). The final gate ran on 0bb539a (code, tests and the fixes to B87); this document is updated in the commit after it. Steps 1–13 and the audit tasks are on the branches before it.
- **Audit date:** 5 November 2026
- **Auditor:** Jr. Builder (self-audit, with evidence below). The TB Health lead reviewed steps 13 and 14 independently; its fix items (B44–B87) are in. The code fixes carry tests, except that B52's map-refit test couldn't fail until B70 rewrote it.
- **Blocking findings** (`npm run launch-check -- --release`, keys in brackets):
  - [check-review] Check ships, but its clinical review is pending: 68 check strings carry [REVIEW] and the footer's reviewer placeholder is in. It clears when the review is recorded (B61). Or build with `TBPH_CHECK=false`, which turns it into [check-mentions]: the strings launch-check lists that still mention the check.
  - [review] Learn L6 and the six route-stop strings wait on the clinical review.
  - [privacy-row] the privacy row (Q5), which can't be accepted: without it About doesn't say who else sees what (RA 10173; the lead's ruling, B73).
  - [owner-strings] five Filipino page descriptions (Q3).
  - [placeholders] About's lede, partners, medical review, accessibility and contact rows. (The check card's footer counts under [check-review].)
  - [sample] the 93-row sample facility list (Q8).
  - [domain] the placeholder domain (Q7), and [not-production] until the release is built with `TBPH_PRODUCTION=true`.
  - The owner may accept only their own calls (check-review, sample, owner-strings, review, verify, placeholders, check-mentions). The privacy row, synthetic data, no build, no facility list, a missing `_headers` or one that differs from the production file, Check in one language only, the placeholder domain and a noindex build can't be accepted; naming one, an unknown key or an unknown argument exits 2 (B59, B60). The gate reads the data and the Check switch from `dist/` (B59) and is unit-tested (B62).
- **Accepted exceptions / N/A rationale:** as in the interim audit's "N/A rationale by SOT section", plus: push notifications, accounts, payments and store submission remain N/A; the PWA (step 11) and the SEO and headers work (step 12) now exist and are assessed below.

## Release decision

- **Release status:** **BLOCKED for production** until the owner chooses the domain (Q7: the host, Cloudflare Pages, is decided) and the open items launch-check lists above: Check's clinical review (or a launch without Check, Q9), Learn L6 and the route stops; the owner's strings and placeholders; the full facility list (Q8); and the v7 import (V1–V3: dark mode and the v7 wording; L1, L9, B22), or the owner's decision to launch on v6. The build itself has no known blocking defect: every gate passes (see Evidence). Only the owner's own calls can be accepted (`--accept=<key>`, B60); the placeholder domain and a non-production build can't.
- **Risks if it launched as it stands:**
  - unreviewed medical content: the symptom check's questions and results, Learn L6 and the route-stop lines;
  - the 93-row sample list: few centers, approximate pins, X-ray unknown everywhere, no hours;
  - no privacy row for the outside services yet (Q5), and no qualified review under RA 10173;
  - the placeholder address, which the installed app and every canonical and sitemap URL would carry;
  - the saved or printed card's risk-factor rows, such as HIV, pending the clinical review (O11);
  - the Filipino strings without the native-speaker review (D10);
  - the reuse terms for the WHO data and the PhilHealth list not recorded (O12);
  - the 28 cited outside sources never fetched (L8);
  - lapsed accreditations shown as listed (Q12, D24);
  - no dark mode until the v7 import (V2);
  - the device-only checks not yet done (VoiceOver, TalkBack, real installs, landscape insets);
  - the accepted risks below.
- **Accepted risks (pending the owner):** see "Accepted risks" below.
- **Post-release checks:** `npm run post-deploy-check -- <origin>` after every deploy; the runtime checks below; Search Console for the `fil` alternates. No metrics are collected, by design.

## Master Build Audit (current state)

Status words follow the SOT legend. "Interim" means the row of `docs/audit-2026-11-05.md`. A row is Verified only when no open owner item undercuts it; "Verified (automated) / Runtime check" means the automated evidence passes and part of the row can only be confirmed on a device or the deployed host (B66). The status of each SOT rule is in the appendix at the end.

| Domain | Status | Evidence / what's left |
|---|---|---|
| Core UX / decision friction | Partial | Interim fixes in: submit during a load error is kept (B16), focus after Show more and Try again (B8). Open for the owner: barangays and landmarks (O1), the same centers under every stop on the sample (O8, needs Q8), the phone first screen (O18). |
| Audience / positioning clarity | Partial | Unchanged: Home names the job; About's lede and partners are placeholders [placeholders]. |
| Empty-state / first-value activation | Partial | Loading, error, empty and no-match states, all keyboard-reachable (B8). O1 open. |
| System handoff / in-context flow quality | Partial | tel: links +632 for every NCR number (B20), 44px actions on phones (phone.spec), Sakay copy-then-open. Open: O10, O14, O22; Sakay [VERIFY]. |
| Familiar interaction patterns | Partial | System Back closes the Filters sheet (B15), robust drag (B30), back links that say where they go (B18), no stuck hover on touch (B29), no long-press callout on controls (B32). Tests: places.spec, home.spec, phone.spec. Open for the owner: back links don't return people to their route or filtered list (O7). Device-only: Android Back on the sheet (B15), long-press callouts (B32), stuck hover after a call (B29), the sheet swipe on an iPhone (B30). |
| Responsive/mobile behavior | Partial | QA matrix: 9 pages × 320/390/768/1280 × EN/FIL in Chromium and WebKit, no sideways scroll, nothing off-screen or cut off, one H1, 44px targets, 14px text (qa.spec, probes B50); worst-case content and 2,100 rows pass it (L2); side safe areas (B5), svh stage (B19), tab bar measured before first paint (B14, B68), phone profiles (B42). Open for the owner: the tab labels wrap and "Check symptoms" overflows at 320px (O3, offered as an accepted risk, not yet accepted); the Type filter splits "Government" and "Pampubliko" mid-word (O4). Device-only: landscape insets (B5), the toolbar and svh (B19). |
| Accessibility | Partial | axe WCAG 2.2 AA on every page EN/FIL at 390/1280 and four interactive states (qa.spec); focus ring never clipped (focus.spec, B1); text follows the browser size to 200% (textsize.spec, B2); forced colours (B11, B44); error in view and described (B3); announcements (B28); token contrast (contrast.test). Open for the owner: stacked bars told apart by colour alone (O2), the map controls' small targets and English names (O13), directions opening a new tab unannounced (O14), and the accessibility statement's [email] placeholder. Still by hand: VoiceOver, TalkBack, Safari keyboard (owner list). |
| Website technical SEO | Partial | Titles, descriptions, canonical, hreflang, Open Graph, sitemap and robots (step 12); every sitemap, canonical and hreflang URL answers 200 without a redirect (seo.spec); check-links resolves 800 canonical and hreflang links (B41). Open: Filipino descriptions [owner-strings], og:image:alt (owner copy), structured data (D17), the real domain (Q7). |
| SEO audit tooling / agent-assisted verification | Partial | seo.spec, check-links, the sitemap test and Lighthouse on a production-mode stand-in build (SEO 100 on the ten measured pages; 92 on /fil/data, with no Filipino description until Q3). Open: Search Console on the production domain after launch (owner list). |
| Domain / DNS / email-deliverability setup | Missing | Blocked on Q7 [domain]. No email sent, so SPF/DKIM/DMARC N/A. |
| Frontend quality metrics | Partial | Real 404s in both languages, print (card only), copy feedback, data dates, sticky bars never cover targets or focus (bars.spec, B10); each metric in the appendix. Open: no dark mode until v7 (V2), hover and pressed states (O5), the tab bar's wrapping labels (O3). Device-only: printing a check result. |
| Performance / Lighthouse | Verified (lab) / Runtime check | Lighthouse 13.5.0 on a production-mode stand-in build (a stand-in address, `TBPH_PRODUCTION=true`), compressed like the host, mobile and desktop (B66): every page 99–100 performance, 100 in accessibility and best practices; LCP ≤ 1.81 s mobile, ≤ 0.41 s desktop; CLS ≤ 0.05 (Install 0.059 while its install prompt shows); TBT ≤ 62 ms; no failed requests or console errors (appendix). The desktop run found /places at CLS 0.116, fixed (B66). Budgets in every build (check-budgets). INP needs a real device; L3's off-screen scroll work removed (its trace was Chromium at 6x CPU slowdown; a mid-range Android trace stays a runtime check). SEO isn't counted in this row while Q3 is open: SEO 100 on the ten measured pages; 92 on /fil/data, with no Filipino description until Q3. |
| Authentication / authorization | N/A | No accounts, backend or admin. |
| Data integrity / sensitive fields | Partial | Every located center on the map (B7), +632 tel links (B20), hatch patterns (B21), the Q11 dot-count tripwire, no silent sample fallback; synthetic and worst-case fixtures only. Open: the 93-row sample ships until the real list (Q8): launch-check blocks [sample]; whether the saved card lists risk factors such as HIV waits on the clinical review (O11). |
| API / caching / database performance | Verified | No API or database. Caching: Workbox precache (60 files, 1,145 KB), runtime caches per release, `_headers` Cache-Control (L6; hashed assets immutable, build fails on an unhashed one). |
| Infrastructure spend / abuse guardrails | N/A | Static host, no paid APIs; OSM tiles only when the map is opened. |
| Privacy / retention / deletion | Partial | privacy.spec (L4): pages contact only our origin, the map adds only OSM, no coordinates in storage or URLs; no Cache Storage key carries a query (pwa.spec); nothing stored after Check's Start (check.spec); Referrer-Policy in `_headers`. Open: the privacy row (Q5) [privacy-row]; whether the saved or printed card lists risk factors such as HIV (O11, sensitive health information); the "never saved" lines beside Save, Share and Print (C9); the back-forward cache on a shared phone (runtime); legal adequacy under RA 10173 needs qualified advice. |
| Cancellation / unsubscribe / dark-pattern review | N/A | Nothing to subscribe to. |
| Child/age-related compliance | N/A | Unchanged (interim). |
| Reliability / retries / failure handling | Partial | Try again on list and map with focus kept (B8), submits kept through errors (B16), malformed hashes ignored (B37), offline after one visit with the place shell and offline page (pwa.spec, L10). Open for the owner: a message for a location timeout (O6) and for a location outside the Philippines (O21). |
| Tests / CI / regression coverage | Partial | 2,220 unit tests; e2e on chromium (369), webkit (249), pwa (10), iphone (5), pixel (5), no-check (3); CSP violations and console errors fail every test; `.github/workflows/ci.yml` (D22, manual). Verified locally; the first GitHub run waits for the merge to `main` (D22: GitHub runs a manual workflow only from the default branch). |
| Agent model/provider routing & fallback safety | N/A | No AI at runtime. |
| Release-build verification | Verified (automated) / Runtime check | Tests run on `dist/` served like the host; the Check-off variant is built and tested (B26); `launch-check --release` is the gate, reading `dist/` and unit-tested (B59–B62); the post-deploy check reads the live site back (no cookies, HTML identical to `dist/`, every response's headers exactly as `dist/_headers` sets them, the 404s in both languages; unit-tested, B63). It hasn't run against a host yet: it runs after the first deploy. Deploys (HANDOVER, B86, B88): every wrangler line runs in a subshell that reads a Pages-only API token from the Keychain, stops if it's missing or empty, passes it through the environment (never an argument `ps` could show), pins the TB Health account, clears other Cloudflare credentials and API addresses, and turns off wrangler's usage data and error reports; never wrangler's own login (it would share a login file with KitaMo's projects). The token can be read by any program running as this Mac user unless the owner stores it with `-T ""`. Test copies are non-production previews on `--branch=test`, public to anyone with the address; only a `--branch=main` deploy, through the gate, is the public launch. |
| App Store / platform compliance | N/A | No store; installable PWA (manifest, service worker) tested in step 11. |
| Billing / subscriptions / entitlements | N/A | Free. |
| Billing grace / retry / cancellation retention settings | N/A | No billing. |
| Legal links / policies / support | Partial | About's disclaimer, privacy and accessibility sections. Open: contact and medical-review placeholders, data reuse terms (O12), outside links unchecked until the owner OKs `outside-links --fetch` (L8: 28 sources on 23 sites). |
| Analytics / attribution / consent | Verified (automated) / Runtime check | No analytics, cookies or trackers: pages contact only our origin (privacy.spec). On the live host the post-deploy check will look for Set-Cookie on every response; it hasn't run against a host yet, so it confirms nothing so far. |
| Growth / store assets / localization | Partial | Icons, og-image, manifest, EN and FIL throughout. Open: Filipino descriptions (Q3), the Filipino review queue (D10). |
| Launch-content / acquisition experiments | N/A | Unchanged. |
| Market / storefront prioritization | N/A | Unchanged. |
| Monetization experiments | N/A | Unchanged. |
| A/B experiment integrity / conversion testing | N/A | Unchanged. |
| Production-readiness review | Partial | This document; launch-check gate; owner decisions pending (owner-queue.md). |
| Build-vs-buy / external dependency due diligence | Partial | Exact-pinned dependencies; Workbox runtime instead of workbox-build (fewer packages); Lighthouse through npx, not a dependency; `npm audit --omit=dev`: 0 vulnerabilities, Workbox included (it ships in `sw.js`, so it is a runtime dependency: B56). Open: WHO and PhilHealth reuse terms (O12). |

## Deliberate changes from the prototype (since step 11)

Earlier ones are in PLAN §7 (D1–D25) and `docs/copy-overrides.md`.

- **d16's left axis** (B39): the "1,000,000" tick label ran 12px off the chart in both languages; the axis gutter now widens for it. Every other chart keeps the prototype geometry (unit-tested); Filipino end labels on d1, d16 and d18 also get room.
- **Check's Next sits 14px above the tab bar** (B14, lead's ruling). README's 84px with a one-line bar; while English labels wrap (an 81px bar) it sits 11px higher than the prototype, so a low tap can't land on a tab.
- **Larger text** (B2): sizes are `max(px, rem)`, width queries are in em; at the default size every page is pixel-identical (35 of 36 screenshots byte-identical, the 36th 3 pixels apart). The header row wraps at large text sizes.
- **Focus rings inside full-width rows** (B1) and Highlight colours in forced-colours mode (B11): focus and forced-colours states only.
- **Place back link** (B18): "Find TB care" when the page wasn't opened from Home's route.
- **Map popup names** in the prototype's teal deep (B36; Leaflet's blue had won); Data's Methods chevron at the prototype's 26px grey (B34); d17's hatches (B21).
- **The route draws in again for each new route** (B33), and the map refits without animation (B12).
- **Places count heading** reserves its width and one line while loading (CLS 0.163 → 0.031); no change once loaded.
- **Places keeps a screen's height while its list loads** (B66): on a desktop screen the footer no longer shows under "Loading…" and then jumps (CLS 0.116 → 0.039); no change once loaded.
- **Phone numbers** (B20): every NCR number of 8 or more digits dials as +632 plus its first 8 digits (README:289), not only those starting with certain digits.
- **Distances** (B40): 1,000 km and more get a thousands separator ("about 1,234 km").
- **Announcements** (B28): a visually hidden status line announces a new route and the page title after an in-place language switch, and a single-service route's rows go H2 then H3 (no H4 skip). No new copy.
- **Two chart fixes the stricter probes found** (B50): on charts under 560px wide (d6, d16 and d17's axis) the "0" axis label now starts at x=0 instead of being centred on it, about 4px to the right. Centred, it was drawn into the panel's padding (the svg has `overflow: visible`), not cut off. d17's Filipino legend did run 19px past a 252px chart; it now wraps.
- **d3's monthly chart is 2px taller** (B76): the stricter probe found its month labels' text boxes (the "p" of "Apr") running 2px past the chart's bottom. The labels stay where the prototype has them; the chart runs 2px further.
- **No overlapping chart text on phones** (B78, the lead's ruling that overlap is a defect, even where the prototype has it). Measured at 320 and 390px: d6's axis numbers overlapped by 9–13px at 320px, d17's "US$…M" labels by 19–31px at 320px and 7–11px at 390px, and d15's Filipino label ran 38px into "2024: 625" at 320px. Now an axis label that would start within 4px of the last one is dropped (every gridline stays), and a bullet's value that doesn't fit beside its label takes the line below (that item 22px taller). Where the labels fit, nothing changes. The QA probe now flags two labels in one chart whose boxes cross by more than a third of a line's height.

## Accepted risks (pending the owner)

- The bold "Check symptoms" tab label overflows its slot by 6px at 320px, also at the default size (O3, short labels).
- Lighthouse CLS 0.059 on Install: the one-tap install button appears when the browser offers it (by design, under the 0.1 budget).
- Safari takes the first Enter in the place field while its suggestion list is open (native; B31).
- No dark mode until the v7 import (V2).
- HSTS without includeSubDomains until the domain is known (Q7).
- Places' footnotes move down when the list arrives below them: CLS 0.031 on mobile, up to 0.050 on desktop, within the 0.1 budget (B66).

## Evidence

- **Final gate (step 13, `build/13-qa`):** unit 2,167; `astro check` 0 errors 0 warnings; build 208 pages; precache 60 files 1,131 KB; JS per page ≤ 31.1 KB gzip (Data 49.7 KB of 120); facilities.json 6.9 KB Brotli (29.8 KB at 2,100 rows); check-links 4,796 links + 800 head links; chromium 346; webkit 227 (+119 Chromium-only skips); pwa 10; iphone 5; pixel 5; no-check 3 (206 pages). Step 14's gate (`build/14-release`, after the B14 ruling): the same counts, all passing.
- **First gate after the review fixes B44–B68 (code at 544802d, tests at 8dfe088):** unit 2,194; `astro check` 0 errors 0 warnings; build 208 pages; precache 60 files 1,144 KB; JS per page ≤ 31.6 KB gzip (Data 50.5 KB of 120); facilities.json 6.9 KB Brotli; check-links 4,796 links + 800 head links; chromium 365; webkit 246 (+119 Chromium-only skips; one test was flaky under load and fixed: it now waits for the Check result's own focus, and its specs passed twice over); pwa 10; iphone 5; pixel 5; no-check 3 (206 pages, 58 precached files). On a Check-off build, launch-check swaps [check-review] for [check-mentions] and lists no check strings. Guard peak 6.6 GB. The gate also found that B45 had left the twin's address without its hash; fixed (B45 follow-up).
- **Gate after the fix review's B69–B78 (at 9d3ee61):** unit 2,212; `astro check` 0 errors 0 warnings; build 208 pages; precache 60 files 1,145 KB; JS per page ≤ 31.8 KB gzip (Data 50.7 KB of 120); facilities.json 6.9 KB Brotli; check-links 4,796 links + 800 head links; chromium 368; webkit 248 (+120 Chromium-only skips); pwa 10; iphone 5; pixel 5; no-check 3 (206 pages, 58 precached files, 1,062 KB). Guard peak 6.6 GB.
- **Gate after B79–B85 (at 119fb5c):** unit 2,217; `astro check` 0 errors 0 warnings; build 208 pages; precache 60 files 1,145 KB; JS per page ≤ 31.8 KB gzip (Data 50.7 KB of 120); facilities.json 6.9 KB Brotli; check-links 4,796 links + 800 head links; chromium 369; webkit 249 (+120 Chromium-only skips); pwa 10; iphone 5; pixel 5; no-check 3 (206 pages, 58 precached files, 1,062 KB). The npm scripts that run Astro (dev, the builds, check) turn its telemetry off (B79), and dev, prepare-data, the builds, check, check-links, launch-check, release-check and post-deploy-check check for Node 22.23.4 first (B85, B87). Guard peak 6.6 GB.
- **Final gate (step 14, after B86–B87; at 0bb539a):** unit 2,220; `astro check` 0 errors 0 warnings; build 208 pages; precache 60 files 1,145 KB; JS per page ≤ 31.8 KB gzip (Data 50.7 KB of 120); facilities.json 6.9 KB Brotli; check-links 4,796 links + 800 head links; chromium 369; webkit 249 (+120 Chromium-only skips); pwa 10; iphone 5; pixel 5; no-check 3 (206 pages, 58 precached files, 1,062 KB). Guard peak 6.6 GB.
- **Lighthouse** (13.5.0, production-mode stand-in build, `scripts/lighthouse.mjs`, mobile and `--desktop`): every page 99–100 performance on mobile and 100 on desktop, 100 in accessibility and best practices everywhere, SEO 100 on the ten measured pages; 92 on /fil/data, with no Filipino description until Q3; LCP 1.21–1.81 s mobile, 0.32–0.41 s desktop; CLS ≤ 0.031 mobile (Install 0.059 when the browser offers to install), ≤ 0.050 desktop after the B66 fix; TBT 0–62 ms; no failed requests or console errors. Rechecked on mobile after B68's inline script: `/` and `/fil` 100, `/fil/places` 99, CLS 0. `/data` rechecked after B76 and B78's chart changes: mobile 99, desktop 100, CLS 0. `/fil/data` scores 92 for SEO (no meta description): the Filipino descriptions for About, Data, Install, Learn and Place wait on the owner (Q3), so those pages would score the same until then. Per page in the appendix.
- **Scale:** 2,100 synthetic rows: 4,222 pages built in 4.5 s (whole build 11 s, 496 MB largest process); all 2,100 markers drawn 327 ms after Map at 4× CPU; Places list shown 490 ms after navigation at 4× CPU.
- **Check routing:** the interim audit's two independent comparisons (215,197 combinations; 0 mismatches) plus the child-path unit tests (B43).
- **Outside links:** `node scripts/outside-links.mjs`: 28 sources on 23 sites (page links and the islands' props, such as Home's route sources: B64), 558 directions links; not fetched (owner's OK needed). With `--fetch` it checks one source a second (HEAD, then GET at once after a 4xx or 5xx), each request with a 15 s timeout and a plain project User-Agent, and reports redirects without following them.

## launch-check report

The whole report (`npm run launch-check`, B65) on the final gate's normal build (0bb539a): the sample list, the placeholder domain, not production, Check in. A production build with the real address drops [domain] and [not-production]; a build without Check swaps [check-review] for [check-mentions] and leaves Check's strings out of every list.

```
launch-check: what is still open before launch (PLAN §4.3). The build resolves none of it.

Blocking (8)
  - [privacy-row] The privacy row (about.privacyServices, Q5) isn't in yet: About doesn't say who else sees what (the host, OpenStreetMap, Google Maps). It can't be accepted (RA 10173).
  - [owner-strings] Strings the owner supplies, not in yet (5): meta.aboutDescription, meta.dataDescription, meta.installDescription, meta.learnDescription, meta.placeDescription.
  - [review] [REVIEW] strings that wait on the clinical review: care.stopTitle_xray, care.stopTitle_test, care.stopTitle_meds, care.stopText_xray, care.stopText_test, care.stopText_meds; learn: 7 strings.
  - [placeholders] [PLACEHOLDER] strings that stand in for owner content: about.lede, about.partnersRow, about.reviewText, about.a11yText, about.contactRow.
  - [check-review] Check is in the build, but its clinical review is pending: 68 check strings still carry [REVIEW]; the reviewer placeholder is still in (check.foot). Record the review, or build with TBPH_CHECK=false (Q9).
  - [sample] Facility list is the 93-row SAMPLE: the full list needs the pipeline run or a file from the owner (Q8).
  - [domain] Domain is a placeholder (https://tb-ph.example): build with SITE_URL once the owner picks the domain (Q7).
  - [not-production] This build is marked noindex: build the release with TBPH_PRODUCTION=true and SITE_URL.

For the owner to decide or check (7)
  - Sakay.ph deep links [VERIFY] (Place, step 6). (DOH 1555 was verified by the owner, V4.)
  - The name "TB PH" is a placeholder until stakeholders choose one (pack line 3).
  - WHO 2026 report: launch on the 2025 report (2024 data) or refresh first (Q11). Copy that names the report or its year moves with it: about.updatesText, dataPage.method2.
  - Reuse terms for the WHO and PhilHealth data (licence and attribution wording) are not recorded yet.
  - Em dashes (V3), for the owner or the v7 wording: care.gov, care.priv, care.noHours, charts.d13_2, check.introBody, check.res_C_title, check.res_D_body, check.foot, check.cardTitle, chrome.safety, dotStory.b2, dotStory.b4_h2, home.lede, learn.l2_p1, learn.l5_h, learn.l5_ol2, learn.l6_p5, learn.l8_ul1, learn.l9_p2, meta.homeTitle, meta.placesTitle, meta.checkTitle, meta.notFoundTitle, meta.offlineTitle; and the page titles built in src/views and src/islands (" — TB PH"): About, Data, Install, Learn, Place, PlaceShell.
  - Accreditations: 3 lapsed, 73 more end by 2026-12-31; shown as listed until Q12 (D24).
  - Facility list dated 2026-09-30 (PhilHealth update); who runs the monthly refresh is open.

Review queues (3)
  - Filipino review: 405 strings not from the pack (D10).
  - Filipino register pass: 250 pack strings, for one consistent register across pack and review copy.
  - Copy overrides for the owner to confirm: 7 strings (docs/copy-overrides.md).
```

## Runtime checks still needed

The interim audit's list stands (device and deployed-host checks), with these changes:
- Covered by automated tests now: focus rings at 390px (B1), the Check error in view (B3), map layers under the tab bar (B4), deep links after hydration (B6), Next above the tab bar at 360–390px (B14), zoom and Shift+Tab (B10), forced-colours selected states (B11), sheet drag and second finger in Chromium (B30). The iphone project closes the Filters sheet with Done, because WebKit can't drive the swipe, so the swipe on an iPhone stays a runtime check (B30).
- Added: iPhone Safari, Enter in the place field with the suggestion list open (B31).
- Still device-only: landscape insets (B5), the toolbar and svh (B19), Android Back on the sheet (B15), long-press callouts (B32), stuck hover after a call (B29), Save as image and share, back-forward cache after a Check result, printing, VoiceOver and TalkBack, a mid-range Android trace of the dot story (L3), the Filters sheet swipe on an iPhone (B30), Lighthouse INP.

## Appendix: status per SOT rule

Each rule of the SOT sections that apply to a static site (B66), with the SOT legend: ✅ Verified, 🟡 Partial, ❌ Missing, ⭕ Not applicable, 🔍 Runtime verification required. The sections the build has nothing for (App Store review, store growth, app ideation, AI coding workflows, monetization) keep the interim audit's "N/A rationale by SOT section"; their domain rows are in the Master Build Audit above.

### UI / UX Design

| Rule | Status | Evidence or N/A reason |
|---|---|---|
| Hick's Law, rules 1–5 (no irrelevant options, one primary-looking button, hide unneeded options, the main action first, one primary action per screen) | 🟡 | The approved prototype's hierarchy, recreated and compared screen by screen (PLAN §5, visual check): one filled primary button per screen, secondary actions soft or plain; Places' filters in a sheet on phones; Check shows one question at a time. Open: every route lists the same three centers under all three stops (O8, needs Q8); the other design calls O2–O7 are the owner's. |
| Jakob's Law 1: swipe down to refresh | ⭕ | No feed to refresh; the browser's own pull-to-refresh is left alone. |
| Jakob's Law 2: swipe to go back | 🟡 🔍 | The browser's back gesture is never captured; Back closes the Filters sheet (B15). Open: back links don't return people to their route or filtered list (O7). Android Back on the sheet is a runtime check. |
| Jakob's Law 3: Create/Add in the middle | ⭕ | Nothing to create. |
| Jakob's Law 4: Home far left, Profile far right | ✅ | Home is the first tab; no Profile (no accounts). |
| Jakob's Law 5: at most about five tabs | ✅ | Four tabs: Home, Check, Learn, Data. |
| Empty states as activation flows | 🟡 | Places' empty and no-match states say why and offer Clear filters; Home's no-location and no-match states (B8, B16). Open: a typed barangay or landmark meets a dead end (O1). No analytics, by design, so the empty-to-first-value path isn't measured. |
| Notification permission after value | ⭕ | No push notifications. |
| Mascot or character | ⭕ | The approved design has none, and a mascot would be a design change for the owner on a site about a serious illness. |
| Home-screen widgets | ⭕ | A web app can't place a home-screen widget on iOS or Android; there is no native app. |
| High-frequency actions in context | 🟡 | Calls, directions and Sakay hand off to the system or the other site with a status line; see "System handoff" above (O10, O14, O22, Sakay [VERIFY]). |
| The "vibe-coded" visual fingerprint | 🟡 | The prototype's own design system (tokens, Newsreader and Atkinson Hyperlegible, TB red), recreated pixel-accurately. Open: em dashes in copy (V3, C5; launch-check lists them) and Home's frosted card in the content layer (O27). |

### Website / SEO / Technical Launch Checklist

| Rule | Status | Evidence or N/A reason |
|---|---|---|
| sitemap.xml | ✅ | Built for the domain, both languages, every place; leaves out `/offline` and the `/place` shells; every URL answers 200 without a redirect (seo.spec). |
| robots.txt | ✅ | Built for the domain, names the sitemap (step 12). |
| No unintended noindex | ✅ | Noindex only in a non-production `_headers`; launch-check blocks [not-production]; the post-deploy check fails a production page that says noindex. |
| Meta titles | 🟡 | Every page in both languages (seo.spec). Open: their " — TB PH" em dashes (V3, C5). |
| Meta descriptions | 🟡 | English everywhere; Filipino for About, Data, Install, Learn and Place waits on the owner (Q3) [owner-strings]. |
| Canonical tags | ✅ | Without state params; check-links resolves 800 canonical and hreflang links (B41). |
| Heading hierarchy | ✅ | axe on every page; the H2-to-H4 skip fixed (B28). |
| One H1 per page | ✅ | qa.spec, every page and width. |
| Alt text | 🟡 | Icons are decorative; charts have text tables; the link-preview image's alt text waits on the owner. |
| Structured data | 🟡 | Deferred by D17 until the group name is final and the clinical review is done. |
| Internal links | ✅ | Header, tab bar, footer, Home to Places and Place, Learn and Data cross links; check-links resolves 4,796 internal links every build. |
| Broken links | 🟡 | Internal: check-links every build. Open: the 28 outside sources on 23 sites aren't fetched until the owner's OK (L8, B64). |
| Compressed images | ✅ | No photos; the icons and link-preview PNGs are within check-budgets; Lighthouse reports at most one image request (0.6 KB). |
| Core Web Vitals | ✅ 🔍 | Lab: LCP and CLS within budget on mobile and desktop (Lighthouse gate below). Field data and INP need the live site and a device. |
| Open Graph image | ✅ | `og-image.png` on every page (step 12). |
| Clean URL slugs | ✅ | Slashless lowercase paths, `/fil` for Filipino, place slugs from names, nothing sensitive in URLs (privacy.spec). |
| HTTPS | 🔍 | HSTS in `_headers`; the host serves HTTPS. The post-deploy check reads HSTS on every response. |
| Backlink strategy | ❌ | Not a build task: the owner's outreach once the domain is chosen (Q7). |
| Google Search Console | ❌ | After launch, on the owner's list (release step 7). |
| Mobile responsiveness | 🟡 🔍 | The QA matrix (see "Responsive/mobile behavior"). Open: tab labels wrapping and overflowing at 320px (O3), the Type filter's mid-word split (O4). Landscape insets and the phone toolbar are runtime checks. |
| Search discovery: production domain crawlable, URLs inspected | 🔍 | Needs the domain (Q7) and Search Console. Metadata is deliberate (titles and descriptions per page, §4.3). |
| Agent-assisted SEO tooling | ✅ ⭕ | The SEO checks run on `dist/` built like production (seo.spec, check-links, Lighthouse: SEO 100 on the ten measured pages; 92 on /fil/data, with no Filipino description until Q3); every change goes through branches and tests. No SEO service, keyword data, credentials or Search Console data is connected. |
| Domain, app and email subdomains | 🟡 ⭕ | One static site on one domain, no app or API subdomains; the domain waits on Q7. No email is sent, so SPF, DKIM and DMARC are N/A. |

### Website Quality Metrics: frontend and UX

| Metric | Status | Evidence or N/A reason |
|---|---|---|
| Dark mode | ❌ | No dark mode until the v7 import (V2). |
| Sticky header | ✅ | Never covers an anchor or the focused control (scroll-padding; bars.spec, B10); keyboard reachable. |
| Mobile menu | 🟡 | The phone tab bar replaces a menu (README), labelled, never covering targets (B14). Open: its labels wrap to two or three lines and "Check symptoms" overflows at 320px (O3). |
| Hover states | 🟡 | Hover only on hover-capable fine pointers (B29); focus-visible rings everywhere, never clipped (focus.spec, B1). Open: hover and pressed states missing on several controls (O5). |
| Scroll progress bar | ⭕ | No long read where position matters; Check counts its questions. |
| Back-to-top | ⭕ | Not in the design; Data and Learn have "On this page" links. |
| Loading states | ✅ | Places list and map, Home's route, Data's charts: loading, error with Try again, empty and no-match, focus kept (B8, B16). |
| Search | ✅ | Places name and place search with no-result and one-result states (qa.spec). |
| Skip-to-content | ✅ | On every page, to `main` (step 2). |
| Floating contact button | ⭕ | Contact isn't a frequent action; calls are per place. |
| FAQ section | ⭕ | Learn holds the pack's questions and answers; no FAQ beyond it. |
| Newsletter signup | ⭕ | No email collected. |
| Password visibility toggle | ⭕ | No passwords. |
| Cookie or consent banner | ⭕ 🔍 | No cookies or trackers (privacy.spec); the post-deploy check will confirm it on the live host. |
| Confirmation modal | ⭕ | No destructive actions; Start over resets a short in-memory flow, as specced (README:226). |
| Real 404 page | ✅ | General and place-specific, in both languages, with a 404 status (serve-dist, post-deploy check). |
| Print stylesheet | ✅ 🔍 | Check's result card prints alone; site chrome is marked no-print. Printing on a device is a runtime check. |
| UTM attribution | ⭕ | No analytics; canonical URLs drop parameters. |
| Copy-to-clipboard | ✅ | Sakay's copy-then-open with a status line (copy feedback). |
| Last-updated dates | ✅ | The facility list's date and the WHO report year on Places, Data and About. |

### Website Quality Metrics: backend and performance

| Metric | Status | Evidence or N/A reason |
|---|---|---|
| Images compressed | ✅ | No photos; SVG icons; PNGs within budget. |
| Lazy-load non-critical images | ✅ | No content images; map tiles load only when the map is opened; Data's charts hydrate as they come near (client:visible). |
| Code split | ✅ | One island per page, two on Data (the dot story and the charts); Leaflet loads only with the map; JS per page ≤ 31.8 KB gzip, Data 50.7 KB of 120 (check-budgets). |
| Cache API responses | ✅ | `facilities.json` revalidated on every visit, runtime caches per release, nothing user-specific (L6, pwa.spec). |
| CDN | 🔍 | Cloudflare Pages' edge after the first deploy; the post-deploy check reads the cache headers back. |
| Minify JS and CSS | ✅ | Astro's production build; `sw.js` bundled and minified by Rolldown. |
| Database indexes | ⭕ | No database. |
| Reduce re-renders | ✅ | State stays in each island; 2,100 markers drawn 327 ms after Map at 4× CPU, the Places list 490 ms after navigation. |
| Debounce input handlers | ⭕ | No input starts network or heavy work: the name filter runs in memory and renders 20 rows a page. |
| Paginate large lists | ✅ | Places shows 20 rows, then Show more; the map draws markers on a canvas. |
| Remove unused dependencies | ✅ | Six runtime dependencies plus Workbox, exact pins, `npm audit --omit=dev` 0 (B56). |
| Defer non-critical scripts | ⭕ | No third-party scripts. |
| Loading skeleton | ⭕ | Loading lines instead, with reserved space (Places count, B66). |
| Load balancer | ⭕ | Static host. |
| Compress API payloads | ✅ | `facilities.json` 6.9 KB Brotli (29.8 KB at 2,100 rows), slimmed fields. |
| Connection pooling, expensive-query caching, N+1, server caching | ⭕ | No server or database. |
| Lighthouse audit | 🟡 | Mobile and desktop on a production-mode stand-in build, before B68 except the rechecks (below). Open: rerun on the release build and on the deployed site. |

### Lighthouse / web performance release gate

Lighthouse 13.5.0 on a production-mode stand-in build (`SITE_URL=https://tbph.example.org TBPH_PRODUCTION=true`), served compressed like the host; reports in `lighthouse-report/` (not committed). Mobile reports from 4 November (Places pages rerun 5 November after the B66 fix); desktop 5 November.

| Item | Status | Result |
|---|---|---|
| Performance | ✅ | Mobile 99–100, desktop 100 |
| Accessibility | ✅ | 100 everywhere |
| Best Practices | ✅ | 100 everywhere |
| SEO | 🟡 | 100 on the ten pages below; 92 on /fil/data (no meta description), with no Filipino description until Q3 |
| LCP | ✅ | Mobile 1.21–1.81 s, desktop 0.32–0.41 s |
| INP | 🔍 | Needs a real device; lab TBT below |
| CLS | ✅ | ≤ 0.05 on mobile and desktop (Install 0.059 while its install prompt shows) |
| TBT | ✅ | Mobile 0–62 ms, desktop 0 ms |
| Main and route bundle sizes | ✅ | check-budgets every build: JS ≤ 31.8 KB gzip per page, Data 50.7 KB |
| Request counts and transfer sizes | ✅ | Per page below |
| Console errors and warnings | ✅ | None in any report; every e2e test fails on a console error or CSP violation |
| Network failures, 4xx and 5xx | ✅ | None in any report; check-links every build |

After B68 added a small inline script to every page, a mobile recheck of `/`, `/fil` and `/fil/places` gave 100, 100 and 99, LCP 1.65, 1.66 and 1.81 s, CLS 0 and TBT 0.

Per page, mobile / desktop, before B68. JS, CSS and fonts give requests · KB transferred, the same on both (to 0.1 KB):

| Page | Perf | LCP s | CLS | TBT ms | Requests | KB | JS | CSS | Fonts |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 100 / 100 | 1.68 / 0.41 | 0 / 0 | 52 / 0 | 23 / 20 | 107 / 101 | 13 · 25.0 | 2 · 7.5 | 3 · 48.9 |
| `/places` | 99 / 100 | 1.66 / 0.38 | 0.031 / 0.039 | 49 / 0 | 21 / 22 | 103 / 104 | 13 · 26.2 | 3 · 8.6 | 3 · 48.9 |
| a place page | 100 / 100 | 1.66 / 0.37 | 0 / 0 | 62 / 0 | 20 / 17 | 89 / 83 | 11 · 19.2 | 2 · 6.6 | 3 · 48.9 |
| `/check` | 100 / 100 | 1.65 / 0.37 | 0 / 0 | 0 / 0 | 20 / 17 | 93 / 87 | 11 · 19.8 | 2 · 7.3 | 3 · 48.9 |
| `/learn` | 100 / 100 | 1.50 / 0.36 | 0 / 0 | 0 / 0 | 12 / 12 | 84 / 84 | 5 · 4.7 | 2 · 6.7 | 4 · 63.2 |
| `/data` | 99 / 100 | 1.65 / 0.40 | 0 / 0 | 4 / 0 | 17 / 16 | 101 / 100 | 10 · 18.7 | 2 · 7.8 | 3 · 48.9 |
| `/about` | 100 / 100 | 1.50 / 0.32 | 0 / 0 | 0 / 0 | 10 / 10 | 64 / 64 | 4 · 3.9 | 2 · 6.1 | 3 · 48.9 |
| `/install` | 100 / 100 | 1.21 / 0.36 | 0 / 0 | 0 / 0 | 11 / 11 | 65 / 65 | 5 · 4.6 | 2 · 6.2 | 3 · 48.9 |
| `/fil` | 100 / 100 | 1.66 / 0.37 | 0 / 0 | 0 / 0 | 20 / 20 | 101 / 101 | 13 · 25.0 | 2 · 7.5 | 3 · 48.9 |
| `/fil/places` | 99 / 100 | 1.65 / 0.37 | 0 / 0.050 | 0 / 0 | 21 / 22 | 103 / 104 | 13 · 26.2 | 3 · 8.6 | 3 · 48.9 |

