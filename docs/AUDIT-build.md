# TB PH: build audit (step 14)

The builder's release audit in the SOT format (`design/design_handoff_tb_ph/reference/ultimate-build-source-of-truth.md`). It brings the lead's interim audit (`docs/audit-2026-11-05.md`, snapshot 6f759ff) up to the current build: that audit's findings, N/A rationale and Check routing result stand unless a row below says otherwise. What waits on the owner is in `docs/owner-queue.md`; the release steps are in `docs/HANDOVER.md`.

## Audit record

- **Project / Build:** TB PH
- **Platform:** Web (static PWA, Astro 7 + Preact islands)
- **Environment audited:** `dist/` served by `scripts/serve-dist.mjs` the way the planned host serves it (nested 404s, the `_headers` rules, Brotli/gzip), in Chromium and WebKit desktop profiles, iPhone 13 and Pixel 7 profiles, and Chromium with the service worker on. No deployed host yet (Q7), so host behaviour is a post-deploy check.
- **Branch / commit:** `build/14-release` (from `build/13-qa`). Steps 1–13 and the audit tasks are on the branches before it.
- **Audit date:** 5 November 2026
- **Auditor:** Jr. Builder (self-audit, with evidence below). The lead's independent review of the step 13 commits is in progress; its findings come in as fix items.
- **Blocking findings** (`npm run launch-check -- --release`, keys in brackets):
  - [check-review] Check ships, but its clinical review is pending (or build with `TBPH_CHECK=false`, which turns this into [check-mentions]: six strings that still mention the check).
  - [review] Learn L6 and the six route-stop strings wait on the clinical review.
  - [owner-strings] the privacy row (Q5) and five Filipino page descriptions (Q3).
  - [placeholders] About's lede, partners, medical review, accessibility and contact rows; the check card's footer.
  - [sample] the 93-row sample facility list (Q8).
  - [domain] the placeholder domain (Q7), and [not-production] until the release is built with `TBPH_PRODUCTION=true`.
- **Accepted exceptions / N/A rationale:** as in the interim audit's "N/A rationale by SOT section", plus: push notifications, accounts, payments and store submission remain N/A; the PWA (step 11) and the SEO and headers work (step 12) now exist and are assessed below.

## Release decision

- **Release status:** open. Set after the lead's review of the step 13 commits. On the evidence below the build itself has no known blocking defect; launch is BLOCKED by the launch-check items above until the owner resolves them or accepts them explicitly (`--accept=<key>`).
- **Accepted risks (pending the owner):** see "Accepted risks" below.
- **Post-release checks:** `npm run post-deploy-check -- <origin>` after every deploy; the runtime checks below; Search Console for the `fil` alternates. No metrics are collected, by design.

## Master Build Audit (current state)

Status words follow the SOT legend. "Interim" means the row of `docs/audit-2026-11-05.md`.

| Domain | Status | Evidence / what's left |
|---|---|---|
| Core UX / decision friction | Partial | Interim fixes in: submit during a load error is kept (B16), focus after Show more and Try again (B8). Open for the owner: barangays and landmarks (O1), the same centers under every stop on the sample (O8, needs Q8), the phone first screen (O18). |
| Audience / positioning clarity | Partial | Unchanged: Home names the job; About's lede and partners are placeholders [placeholders]. |
| Empty-state / first-value activation | Partial | Loading, error, empty and no-match states, all keyboard-reachable (B8). O1 open. |
| System handoff / in-context flow quality | Partial | tel: links +632 for every NCR number (B20), 44px actions on phones (phone.spec), Sakay copy-then-open. Open: O10, O14, O22; Sakay [VERIFY]. |
| Familiar interaction patterns | Verified | System Back closes the Filters sheet (B15), robust drag (B30), back links that say where they go (B18), no stuck hover on touch (B29), no long-press callout on controls (B32). Tests: places.spec, home.spec, phone.spec. |
| Responsive/mobile behavior | Verified | QA matrix: 9 pages × 320/390/768/1280 × EN/FIL in Chromium and WebKit, no sideways scroll, nothing off-screen, one H1, 44px targets, 14px text (qa.spec); worst-case content and 2,100 rows pass it (L2); side safe areas (B5), svh stage (B19), tab bar measured (B14), phone profiles (B42). Accepted: Check tab label at 320px (O3). |
| Accessibility | Verified (automated) / Runtime check | axe WCAG 2.2 AA on every page EN/FIL at 390/1280 and four interactive states (qa.spec); focus ring never clipped (focus.spec, B1); text follows the browser size to 200% (textsize.spec, B2); forced colours (B11); error in view and described (B3); announcements (B28); token contrast (contrast.test). Still by hand: VoiceOver, TalkBack, Safari keyboard (owner list). |
| Website technical SEO | Verified | Titles, descriptions, canonical, hreflang, Open Graph, sitemap and robots (step 12); every sitemap, canonical and hreflang URL answers 200 without a redirect (seo.spec); check-links resolves 800 canonical and hreflang links (B41). Open: Filipino descriptions [owner-strings], og:image:alt (owner copy). |
| SEO audit tooling / agent-assisted verification | Verified | seo.spec, check-links, the sitemap test; Search Console after launch (owner). |
| Domain / DNS / email-deliverability setup | Missing | Blocked on Q7 [domain]. No email sent, so SPF/DKIM/DMARC N/A. |
| Frontend quality metrics | Verified | Real 404s in both languages, print (card only), copy feedback, data dates, sticky bars never cover targets or focus (bars.spec, B10). |
| Performance / Lighthouse | Verified (lab) / Runtime check | Lighthouse 13.5.0 mobile, compressed like the host: every page 99–100 performance and 100 in the other categories, LCP ≤ 1.82 s, CLS ≤ 0.06 (see Evidence). Budgets in every build (check-budgets). INP needs a real device; L3's off-screen scroll work removed. |
| Authentication / authorization | N/A | No accounts, backend or admin. |
| Data integrity / sensitive fields | Verified | Every located center on the map (B7), +632 tel links (B20), hatch patterns (B21), the Q11 dot-count tripwire, no silent sample fallback; synthetic and worst-case fixtures only. Open: the real list (Q8). |
| API / caching / database performance | Verified | No API or database. Caching: Workbox precache (60 files, 1.13 MB), runtime caches per release, `_headers` Cache-Control (L6; hashed assets immutable, build fails on an unhashed one). |
| Infrastructure spend / abuse guardrails | N/A | Static host, no paid APIs; OSM tiles only when the map is opened. |
| Privacy / retention / deletion | Verified / Runtime check | privacy.spec (L4): pages contact only our origin, the map adds only OSM, no coordinates in storage or URLs; no Cache Storage key carries a query (pwa.spec); nothing stored after Check's Start (check.spec); Referrer-Policy in `_headers`. Open: the Q5 privacy row [owner-strings]; the back-forward cache on a shared phone (runtime). |
| Cancellation / unsubscribe / dark-pattern review | N/A | Nothing to subscribe to. |
| Child/age-related compliance | N/A | Unchanged (interim). |
| Reliability / retries / failure handling | Verified | Try again on list and map with focus kept (B8), submits kept through errors (B16), malformed hashes ignored (B37), offline after one visit with the place shell and offline page (pwa.spec, L10). |
| Tests / CI / regression coverage | Verified | 2,167 unit tests; e2e on chromium (346), webkit (227), pwa (10), iphone (5), pixel (5), no-check (3); CSP violations and console errors fail every test; `.github/workflows/ci.yml` (D22, manual). Pending: the owner's first CI run. |
| Agent model/provider routing & fallback safety | N/A | No AI at runtime. |
| Release-build verification | Verified / Runtime check | Tests run on `dist/` served like the host; the Check-off variant is built and tested (B26); `launch-check --release` is the gate; the post-deploy check reads the live site back (no cookies, HTML identical to `dist/`, headers). Runs after the first deploy. |
| App Store / platform compliance | N/A | No store; installable PWA (manifest, service worker) tested in step 11. |
| Billing / subscriptions / entitlements | N/A | Free. |
| Billing grace / retry / cancellation retention settings | N/A | No billing. |
| Legal links / policies / support | Partial | About's disclaimer, privacy and accessibility sections. Open: contact and medical-review placeholders, data reuse terms (O12), outside links unchecked until the owner OKs `outside-links --fetch` (L8: 27 sources on 22 sites). |
| Analytics / attribution / consent | Verified | No analytics, cookies or trackers; the post-deploy check confirms no Set-Cookie on the live host. |
| Growth / store assets / localization | Partial | Icons, og-image, manifest, EN and FIL throughout. Open: Filipino descriptions (Q3), the Filipino review queue (D10). |
| Launch-content / acquisition experiments | N/A | Unchanged. |
| Market / storefront prioritization | N/A | Unchanged. |
| Monetization experiments | N/A | Unchanged. |
| A/B experiment integrity / conversion testing | N/A | Unchanged. |
| Production-readiness review | Partial | This document; launch-check gate; owner decisions pending (owner-queue.md). |
| Build-vs-buy / external dependency due diligence | Verified / Partial | Exact-pinned dependencies; Workbox runtime instead of workbox-build (fewer packages); Lighthouse through npx, not a dependency; `npm audit --omit=dev`: 0 vulnerabilities. Open: WHO and PhilHealth reuse terms (O12). |

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

## Accepted risks (pending the owner)

- The bold "Check symptoms" tab label overflows its slot by 6px at 320px, also at the default size (O3, short labels).
- Lighthouse CLS 0.059 on Install: the one-tap install button appears when the browser offers it (by design, under the 0.1 budget).
- Safari takes the first Enter in the place field while its suggestion list is open (native; B31).
- Charts keep light colours in dark mode until v7 (B22).
- HSTS without includeSubDomains until the domain is known (Q7).

## Evidence

- **Final gate (step 13, `build/13-qa`):** unit 2,167; `astro check` 0 errors 0 warnings; build 208 pages; precache 60 files 1,131 KB; JS per page ≤ 31.1 KB gzip (Data 49.7 KB of 120); facilities.json 6.9 KB Brotli (29.8 KB at 2,100 rows); check-links 4,796 links + 800 head links; chromium 346; webkit 227 (+119 Chromium-only skips); pwa 10; iphone 5; pixel 5; no-check 3 (206 pages). Step 14's gate (`build/14-release`, after the B14 ruling): the same counts, all passing.
- **Lighthouse** (mobile, production-mode build, `scripts/lighthouse.mjs`), after the audit fixes, performance: `/` 100, `/places` 99, a place page 100, `/check` 100, `/learn` 100, `/data` 99, `/about` 100, `/install` 100, `/fil` 100, `/fil/places` 99; 100 in accessibility, best practices and SEO on every page; LCP 1.21–1.82 s; CLS ≤ 0.031 (Install 0.059 when the browser offers to install).
- **Scale:** 2,100 synthetic rows: 4,222 pages built in 4.5 s (whole build 11 s, 496 MB largest process); all 2,100 markers drawn 327 ms after Map at 4× CPU; Places list shown 490 ms after navigation at 4× CPU.
- **Check routing:** the interim audit's two independent comparisons (215,197 combinations; 0 mismatches) plus the child-path unit tests (B43).
- **Outside links:** `node scripts/outside-links.mjs`: 27 sources on 22 sites, 558 directions links; not fetched (owner's OK needed).

## Runtime checks still needed

The interim audit's list stands (device and deployed-host checks), with these changes:
- Covered by automated tests now: focus rings at 390px (B1), the Check error in view (B3), map layers under the tab bar (B4), deep links after hydration (B6), Next above the tab bar at 360–390px (B14), zoom and Shift+Tab (B10), forced-colours selected states (B11), sheet drag and second finger in Chromium (B30).
- Added: iPhone Safari, Enter in the place field with the suggestion list open (B31).
- Still device-only: landscape insets (B5), the toolbar and svh (B19), Android Back on the sheet (B15), long-press callouts (B32), stuck hover after a call (B29), Save as image and share, back-forward cache after a Check result, printing, VoiceOver and TalkBack, a low-end Android trace (L3), Lighthouse INP.
