# TB PH build plan: stack and steps

Status: **proposal, waiting for the owner's approval.** No app code is written until the owner approves this plan and answers the blocking questions in §7.1.
Written 30 October 2026 by the Jr. Builder, from the v6 design handoff (`design/design_handoff_tb_ph/`). Updated 4 November 2026 with stack-fact corrections (§3, §4.5); §7.1 is unchanged.

## 1. Summary

- **Stack:** Astro 7 (static output) + Preact islands + TypeScript (strict) + plain CSS with design tokens. Self-hosted fonts. Workbox service worker generated after the build. Vitest for logic, Playwright + axe for the browser. Node 22 LTS, npm.
- **Shape:** every page is prerendered HTML; JavaScript runs only in the interactive parts: the route planner, the Places list and filters, the Place page, the symptom check, the dot story, the Data charts and a few small helpers.
- **Order:** scaffold → shared shell (header, footer, language, 404) → ported planner logic with tests → **Home route planner as the first end-to-end slice** → Places → Place → Check → Learn → Data → About and Install → phone app (PWA) → SEO and headers → QA hardening → release audit.
- **Owner input needed:** 2 questions before I start, 5 more before specific steps (§7.1). Q1 (Node) is already answered. Everything else has a stated default (§7.2) that I follow unless the owner says otherwise.

## 2. What we're building

The spec is `design/design_handoff_tb_ph/README.md`. In short: a bilingual (English / Filipino) TB care finder for the Philippines. It is static and frontend-only: no accounts, no backend, no analytics, and location never leaves the browser.

| Route | Page | Interactivity |
|---|---|---|
| `/` | Home: the route planner (where are you → what you need → 3-stop route) | Large island |
| `/places` | Full list of TB-DOTS centers, filters (panel or bottom sheet), optional map | Large island; map loads only on request |
| `/place/{id}` | Shareable place page | Static page with a small island (distance, back link, copy address, stop motif) |
| `/check` | Guided symptom check, urgent screen, results A–D, printable summary card | Medium island (answers in memory only) |
| `/learn` | Long-form "Learn about TB" (L1–L10) | Static, plus tiny scripts (scroll-spy, back to top) |
| `/data` | Dot story (canvas) + 20 charts + "TB in numbers" (44 claims) | Static text and tables; charts and dot story are islands loaded when scrolled into view |
| `/about` | About, privacy, accessibility, helpful numbers | Static |
| `/install` | How to install the phone app | Small island |
| 404 | Not found | Static |

Plus the phone-app layer: manifest, icons, service worker (offline after one visit), install entry points hidden when installed, and offline status lines.

Reference material, all read in full for this plan: README, the 13 prototype pages and `tbph-core.js`, the content pack, the source-of-truth checklist (SOT), AUDIT-v6, handoff notes v2/v5/v6, design prompts v2/v3, the data files and the pipeline scripts (read, not run).

## 3. Stack choice

| Piece | Choice | Why |
|---|---|---|
| Framework | **Astro 7.4**, `output: 'static'` | The site is mostly static content with a few interactive parts, which is Astro's "islands" model, and the handoff suggests it (README:9). It ships zero JS by default and builds plain HTML that any static host can serve. It has built-in i18n routing, so English stays at `/` and Filipino goes under `/fil/` (see §4.2). |
| Islands | **Preact** (`@astrojs/preact`) | The prototype's behaviour is written as React-style classes (`state`, `setState`, lifecycle methods, `renderVals`), and Preact ports those almost line for line. That keeps behaviour drift low on medical and route logic. The runtime is about 4 KB. Islands hydrate `client:load` (planner, check), `client:visible` (charts, dot story) or `client:idle` (small helpers). Preact 11 (current) no longer adds `px` to numeric style values, so islands write units explicitly. |
| Language | **TypeScript, strict** | `tbph-core.js` becomes a typed module (README:15). Copy dictionaries are typed so a missing Filipino string fails the build. |
| Styling | **Plain CSS + custom properties** (`tokens.css`) and Astro scoped styles | The tokens in README §Design tokens map directly to CSS variables. Glass fallbacks, the language-dependent breakpoints (1000px EN / 1180px FIL) and `prefers-*` queries are pure CSS. No Tailwind or UI kit: pixel-accurate recreation is easier when the CSS mirrors the spec. |
| Charts | **Hand-built SVG** builders ported from `Data.dc.html` as pure TS functions | The design says charts stay hand-built (prompt v3:119). They render at build time at the default width, then re-lay out in the browser when visible, which keeps the prototype's exact behaviour at every width. Tables and text work without JS. |
| Dot story | **Canvas 2D** island (port of `DotStory.dc.html`) | 724 animated dots. Static text beats are server-rendered; the canvas loads when scrolled near. |
| Map | **Leaflet 1.9.4 bundled from npm**, dynamically imported only when "Map" is chosen | Same library and version as the prototype, but not loaded from unpkg (no third-party script host, no missing integrity check). Tiles: OpenStreetMap (**needs owner OK**, Q5). |
| Fonts | **Self-hosted** via Fontsource: Atkinson Hyperlegible Next 400/700/400 italic, Newsreader 600 (wordmark only), latin subset | README:89 says self-host (privacy and speed). Both fonts are SIL OFL 1.1. The latin files are about 12–24 KB each, and the latin subset covers Filipino's ñ. Metric-matched fallbacks avoid layout shift. |
| Phone app | Web manifest + **Workbox**: `src/sw.ts` bundled on its own, then `workbox-build` 7 `injectManifest` inserts the precache list after `astro build` | README:371 asks for a build-generated service worker with the prototype's strategies. `injectManifest` doesn't bundle the worker itself, so a small separate bundle step runs first. A post-build step avoids `@vite-pwa/astro`, which doesn't support Astro 6+ yet. |
| Data | Statistics and claims **imported at build time**; facility list **fetched at runtime** from a slimmed JSON that the build prepares | See §4.4. |
| Tests | **Vitest** (logic, chart builders, copy parity), **Playwright** with Chromium + WebKit, one worker (end-to-end, accessibility with `@axe-core/playwright`, a port of `qa-harness.html`), **Lighthouse** on the production build | All heavy runs go through `_handoff/lowmem-run.sh` with `GUARD_NO_DOCKER=1`. |
| Tooling | **Node 22.23.4 LTS** pinned with `.nvmrc`, **npm** (ships with that Node) | Astro 7 and Vitest 5 need Node ≥ 22.23.4. Installed through nvm for this folder only (owner said yes, 30 Oct 2026). nvm's default alias and the global/Homebrew Node are unchanged, because the KitaMo builders use them. npm needs no extra install; the Homebrew pnpm on this Mac is 9.15.9 from March 2025, so it's left alone. Shells run `. ~/.nvm/nvm.sh && nvm use` before any npm command, including inside `lowmem-run.sh`. Astro's experimental parallel prerendering stays off: it starts one worker per CPU core. |
| Host | Any static host. Recommended: **Cloudflare Pages** (owner's account) | It serves a real 404 status (it uses the nearest `404.html`, so `/fil/404.html` works; without a top-level `404.html` it would answer every unknown URL with the home page and a 200), supports a `_headers` file (HSTS etc.) and Brotli, and has no bandwidth billing. GitHub Pages also works if no new vendor is wanted, but it can't set security headers (**Q7**). |

**Alternatives considered**
- *Next.js static export:* it ships the React runtime on every page and builds are heavier on the shared 8 GB Mac. It adds nothing a static site needs.
- *SvelteKit static:* a good fit, but every prototype class would have to be rewritten in Svelte's model instead of ported, which is more risk on the planner and check logic.
- *Eleventy + vanilla TS:* the smallest output, but we'd hand-build hydration and state for five large interactive UIs.

## 4. Architecture

### 4.1 Folder layout (planned)
```
.nvmrc  package.json  package-lock.json  astro.config.mjs  tsconfig.json
data/                     source data: tb-ph-data.json, claims.json, facility file (pipeline output lands here)
scripts/
  prepare-data.mjs        validate data, slim the facility list, derive ids and region counts (no network)
  build-sw.mjs            Workbox injectManifest over dist/ after astro build
  launch-check.mjs        lists open flags: [REVIEW], [VERIFY], placeholders, sample data, placeholder domain
src/
  styles/                 tokens.css (README tokens), global.css (focus, links, glass + fallbacks, print)
  content/                typed EN/FIL dictionaries per page + sources registry (see 4.3)
  lib/core/               port of tbph-core.js: text, phone, facility, geo, route, links, data loading
  lib/check/              symptom-check logic: steps, evaluate, notes, card rows (pure functions)
  lib/charts/             SVG primitives + the 20 chart specs (pure functions of data, lang, width)
  lib/                    i18n, pwa (port of pwa.js), anchor (keep reading position), dom helpers
  components/             static Astro parts: header, footer, grouped list, chip, sector badge, info line, link row, claim row, back link
  islands/                Preact: Planner, LocationField, Places, PlaceDetails, CheckFlow, DotStory, ChartPanel, TopicPicker, InstallSteps, BottomSheet
  layouts/BaseLayout.astro  head tags, pre-paint script, skip link, header, footer
  pages/                  index, places, place/[id], check, learn, data, about, install, 404 + fil/ copies (thin wrappers)
  sw.ts                   service worker source (strategies from prototype sw.js)
tests/unit  tests/e2e
docs/                     PLAN.md, decisions.md, copy-overrides.md, later AUDIT-build.md
```
`design/` stays untouched as the reference. `support.js` and `qa-harness.html` are never ported; the harness checks become Playwright tests.

### 4.2 Languages and URLs (recommended option; **Q2**)
- English pages at `/…`, Filipino pages at `/fil/…`, both prerendered. Each has its own `<html lang>`, `<title>` and description, `hreflang` links and sitemap entries. No flash of English for Filipino readers, it works without JavaScript, and Filipino can be found in search.
- The language toggle is a link to the same page in the other language. With JavaScript it keeps the reader's place (README:283): it saves the current `[data-anchor]` id and offset for one navigation, then restores them.
- On pages with in-memory state (Home, Places, Place, Check), the toggle swaps the language **in place** and updates the address with `history.replaceState`. Answers, a location fix and filters are never lost, and are never written anywhere to carry them across.
- The saved choice (`tbph-lang` in localStorage, as specced) is applied when someone opens `/` or the installed app: a tiny pre-paint script sends them to `/fil/`. Every other URL opens in its own language.
- *The alternative (as specced):* one URL per page with the language swapped in the browser. On a static build that means shipping both languages in every page or showing English first, Filipino can't be indexed, and the interactive parts re-render after load. It is workable, but costs more and looks worse.

### 4.3 Copy and medical content
- One typed dictionary per page in `src/content/`. Each string carries `en`, `fil`, an **origin** (`pack` = content pack, `ui` = prototype-authored, `override` = README wording that differs from the pack) and **flags** (`REVIEW`, `VERIFY`, `PLACEHOLDER`, `FIL-REVIEW`).
- Strings are copied **verbatim** from the content pack where it has them, and otherwise from the prototype. A **parity test** compares every `pack` string with `reference/content-and-data-pack.md` and fails on any difference, so medical copy can't drift during the port.
- `docs/copy-overrides.md` records every place where the build uses README/prototype wording instead of the pack (nav labels, "Commute directions", "Plan my route to a test", the 30 vs 23 October dates…), with the pack line and the README line. The owner confirms them (Q3).
- `scripts/launch-check.mjs` lists every open flag. Check stays "clinical review pending", Learn L6 stays `[REVIEW]`, DOH 1555 stays `[VERIFY]` and placeholders stay as they are. The build never resolves or rewords them, and they stay visible on preview builds exactly as designed.
- Dates ("Last updated", data dates) come from one constant read from the data files' `meta`, not typed in several places.

### 4.4 Data flow
```
pipeline/ (owner runs it, or approves a run)  →  data/*.json  →  scripts/prepare-data.mjs  →  build
```
- `tb-ph-data.json` and `claims.json` are **imported at build time**. Charts, tables, takeaways, Learn's "By the numbers" and "TB in numbers" become static HTML: they work offline, nothing shifts after load, and there are no silent fetch failures. README:6 says these are fetched at runtime; updating them needs a redeploy either way (default D12).
- The facility list stays a **runtime fetch** (README:288), but from a slimmed `public/data/facilities.json`. It is validated against a schema, has only the fields the site uses (no `email`, `maps_url`, `source_row`…; about 45% smaller, and less data published), and is pre-compressed by the host. d14's per-region counts are computed at build time, so the Data page doesn't download the facility list.
- Build-time guards fail the build when data breaks an assumption: chart maxima, `southeast_asia_rates[0]` is the Philippines, every claim's sources resolve, the dot counts are 724/179/37.
- Until the full list exists, the build uses the 93-row sample. Its sample notes show, as designed, and `launch-check` reports it.

### 4.5 Privacy and security (RA 10173)
- No analytics, no third-party scripts, no cookies. localStorage holds only `tbph-lang`. Check answers and GPS coordinates stay in memory.
- Automated tests: running the whole symptom check makes **zero network requests**. After using location, no coordinates appear in the URL or in storage. Each page contacts only the hosts the About privacy text names.
- URL inputs (`id`, `need`, `stop`, `near`, `svc`, hash ids) are whitelisted or length-capped and only ever rendered as text.
- Content Security Policy: Astro's island hydration and our pre-paint script are inline scripts, so `script-src 'self'` alone would break every island. Astro 7's `security.csp` emits a `<meta>` CSP with hashes for them. It allows scripts, styles, fonts and data from our own origin only; images also from `tile.openstreetmap.org`, `data:` and `blob:` (map, save as image). The host adds what a meta tag can't set: HSTS and `frame-ancestors 'none'`, plus `Permissions-Policy: geolocation=(self), camera=(), microphone=()` and `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin` (the browser default). OSM's tile policy requires a Referer and says not to block it. Other sites (OSM, Google Maps, Sakay.ph) only ever see our origin, never a page URL with its parameters.
- The About privacy rows must stay literally true. Self-hosting fonts and bundling Leaflet changes what they should say, and new text is the owner's to approve (Q5).

### 4.6 Performance budgets (proposed, default D16)
Mobile Lighthouse ≥ 90 in every category (Accessibility 100). LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms. JS per page ≤ 60 KB gzip (Data ≤ 120 KB; the Leaflet chunk is excluded and loads only on request). Slim facility JSON ≤ 200 KB compressed.

## 5. Build steps

Each step gets its own local branch (`build/NN-name`) and commits. I update `_handoff/JR-RESUME.md` and hand the owner one push command per step; the owner pushes and merges. "Done" means the tests listed pass through `lowmem-run.sh`, plus a side-by-side check against the prototype at 320/390/768/1280 px (FIL at 320/1024/1280). The prototype is served locally as README:18 describes; it pulls React and fonts from CDNs on this machine only. Sizes: S ≈ one session, M ≈ two, L ≈ three or more.

| # | Step | Delivers | Done when | Size |
|---|---|---|---|---|
| 0 | **Owner decisions + environment** | Answers to Q2–Q3. Node 22.23.4 via nvm + `.nvmrc`: done 30 Oct 2026 | Owner approves the plan | — |
| 1 | **Scaffold** | Astro 7 + Preact + TS strict + npm; `tokens.css`, `global.css`; self-hosted fonts; BaseLayout; `data/` copied from the handoff; `prepare-data.mjs`; Vitest and Playwright configured for one worker | `npm run build` and an empty test run pass through `lowmem-run.sh` | S |
| 2 | **Shell + languages + 404** | SiteHeader (glass + solid fallbacks, nav, language toggle, phone tab bar), SiteFooter, skip link, focus and link styles, i18n routing (Q2), pre-paint script, dictionary format + parity test + flag inventory, 404 page with a real 404 status | Header/footer breakpoints right in EN (1000px) and FIL (1180px); glass turns solid under reduced transparency / more contrast / no blur support; skip link works; parity test green | M |
| 3 | **Planner logic port** | `lib/core/*` from `tbph-core.js` with types; unit tests for every function (normalise, title case, phone links, services, gazetteer, place matching, route, distance, directions links); agreed fixes only (e.g. minimum 2 characters, Q4) | All core tests pass, including the cases the readers verified on the sample (82-row bug fixed only if approved) | M |
| 4 | **Home: the first full slice** | Backdrop, frosted planner form, location field (shared with Places), "I need" rows, all result states (loading, error + try again, no match, route), route draw-in (instant under reduced motion), URL state per Q4, geolocation on click, focus moves, "Good to know" | End-to-end: empty submit error; typed city → route heading focused; location denied/granted (mocked); "I need" change recomputes without animating; deep links restore; language swap keeps state; visual match with the prototype in all its demo states. **Demo to owner.** | L |
| 5 | **Places** | Segmented control, select, switch, bottom sheet (focus trap with `inert`, Escape, scrim, swipe, scroll lock that can't leak), filters panel ≥ 1080px, list with "Show more", sort by distance, all states, lazy Leaflet map (if Q5 = yes) | Sheet keyboard and screen-reader tests; filters; empty and offline states; map loads only on request; no horizontal scroll at 320px | L |
| 6 | **Place pages** | Prerendered `/place/{id}` per facility (Q6), stop motif, actions (commute, walk, drive, copy address for Sakay.ph: copy first, then open), services and details, offline shell for places not yet visited | Unknown id → real 404; shared link with `stop` shows the motif; copy success and failure messages | M |
| 7 | **Check** | Question flow ported as pure, tested functions (steps, evaluate, notes, card rows), the four views, sticky Next above the tab bar, urgent Film screen, patient card, print (card only), save as image | Decision-table tests for urgent/A/B/C/D; stale answers never leak across paths; focus on each H1; **zero network requests and nothing stored** during the check; clinical-review footnote still visible | L |
| 8 | **Learn** | Static article L1–L10, contents (collapsible / sticky sidebar with scroll-spy), "By the numbers" from claims at build time, myths table (ARIA, two layouts), back to top | Parity test for every Learn string; all 17 claim links resolve to `/data#claim-…`; one H1 | M |
| 9 | **Data** | Chart builders + 20 panels with tables ("View as table"), d5 toggle, captions and sources, hatching, narrow layouts; Methods; "TB in numbers" with topic picker and deep links; dot story canvas | Builder unit tests (widths 640/560/420); every chart has a table and an SVG label; deep link focuses the claim; dot counts 724/179/37; reduced motion shows end states | L |
| 10 | **About + Install** | About sections (helpful numbers, `[VERIFY]` kept), install section hidden when installed; Install page with platform order and one-tap install | Helpful-number rows never blank; `tel:` links exact; install entry points hidden in installed mode | S |
| 11 | **Phone app (PWA)** | Manifest with production routes, icons, `pwa.ts` (absolute `/sw.js`, attributes set before paint), Workbox SW: pages network-first (4 s) → cache → offline page; data and assets stale-while-revalidate; map tiles, Google Maps and Sakay never cached; version from the build hash | Every page opens offline after one visit (including place pages through the shell); offline lines show; installed mode hides install entry points | M |
| 12 | **SEO + headers** | Per-page EN/FIL titles and descriptions (new FIL strings flagged for review), canonical without state params, hreflang, Open Graph + `og-image.png`, sitemap and robots for the real domain (Q7), `_headers` (CSP etc.) | Head-tag tests on every route; the CSP doesn't break the map, save-as-image or print | S |
| 13 | **QA hardening** | qa-harness checks as a Playwright matrix (9 routes × widths × EN/FIL: no sideways scroll, no overflow, one H1, targets ≥ 44px, text ≥ 14px, no template leftovers, no console errors); axe on every route; contrast token test; Lighthouse; budget check; internal link check | All green, or listed as accepted risks for the owner | M |
| 14 | **Release audit + handover** | `docs/AUDIT-build.md` in the SOT format (status per rule, N/A reasons, evidence), `launch-check` report, the owner-only list (clinical review, `[VERIFY]`, placeholders, Filipino review, real-device installs, VoiceOver/TalkBack/Safari keyboard passes, Search Console), deploy command | The owner has a PASS / PASS WITH RISKS / BLOCKED decision to make with evidence | S |

Step 4 is deliberately early: it proves the whole chain (copy, data, logic, island, URL, language, tests, visual match) on the most important page before the rest is built the same way.

## 6. Risks I'm planning around

| Risk | Plan |
|---|---|
| Medical copy drifts during the port | Verbatim dictionaries + parity test; no rewording; flags stay visible |
| The facility list doesn't exist yet (sample only: approximate pins, X-ray unknown everywhere, no hours) | Build and test on the sample; `launch-check` blocks a "ready" status until the real list is in (Q8) |
| Facility ids are PDF row numbers, so a new PhilHealth list can point shared links at the wrong clinic | Stable ids derived in the build (Q6) |
| 8 GB shared Mac | One heavy job at a time through `lowmem-run.sh`; Playwright with one worker; Chromium + WebKit only; Lighthouse never alongside KitaMo jobs |
| Safari quirks (glass, safe areas, sticky button, Web Share, print) | WebKit project in Playwright now; real iPhone/Android checks are on the owner's list |
| Prototype edge cases (one-letter search returns 82 rows, "QC" doesn't match, a stale GPS fix is reused, Retry re-prompts) | Fixed only with the owner's OK (Q4); otherwise ported as-is and listed |
| A tight CSP breaks Leaflet's inline styles or save-as-image | CSP tests per island in step 12 |
| The WHO 2026 report lands soon after launch | Numbers and dates come from data; build guards catch out-of-range values; copy stays pack-verbatim until the content owner updates it |

## 7. Questions for the owner

### 7.1 Need an answer (with my recommendation)

**Before I start**
- ~~**Q1. Node.**~~ Answered 30 Oct 2026: yes, Node 22 LTS through nvm for tb-health only, pinned in `.nvmrc`; nvm's default alias and the global/Homebrew Node untouched.
- **Q2. Language URLs.** Filipino at `/fil/…` (§4.2; *recommended*), or one URL per page with the language swapped in the browser, as specced?
- **Q3. Copy source.** The content pack has no planner, Places, Place, Install or 404 copy, and some README labels differ from the pack. OK to use the prototype strings verbatim, flagged for EN/FIL review, with README wording winning over the pack where they differ (logged in `docs/copy-overrides.md`)? The stop explanations ("Get a chest X-ray…", "usually in 6 months") would be flagged `[REVIEW]` with Learn L6. Also: is there a newer content pack? Design prompt v2 cites `tb-ph-content-and-data.md` with a planner section, and it isn't in the handoff.

**Before a specific step**
- **Q4. Privacy in URLs (step 4).** *Recommend:* put `near` in the URL only when it matches a known city or province, never free text such as a home address. Ask for location only on a click, also for `?loc=gps` links, which show the "Use my location" button instead. Drop `?source=` from the manifest. Fix the small prototype bugs (one-letter search, stale GPS fix, Retry re-prompt).
- **Q5. Third parties (steps 1, 5, 10).** OK to self-host fonts, bundle Leaflet and use the public OpenStreetMap tile server for the optional map? Then the About privacy row ("Three outside services… Google Fonts…") is no longer accurate: who writes the new EN/FIL text?
- **Q6. Facility data (steps 3, 6).** *Recommend:* production shows "could not be loaded / Try again" instead of silently falling back to the 93-row sample; stable place ids derived from name + city + province; the published JSON drops unused fields (`email`, `maps_url`…); one prerendered page per place.
- **Q7. Host and domain (step 12, deploy).** Which host and domain? *Recommend* Cloudflare Pages (headers, real 404s, no bandwidth bill); GitHub Pages works but has no security headers. The domain also fixes the installed app's identity, so it's best chosen once.
- **Q8. Full facility list (before launch).** May I run the PhilHealth scrape + Nominatim geocoding (about 2,100 rows, 40 min to 2 h at 1 request/s), and which contact email goes in the geocoder's User-Agent? Or will you provide the file?

### 7.2 Defaults I'll follow unless you say otherwise
- **D1** Type scale: build the exact sizes specced, as named tokens, so consolidating later is a one-file change (README:107).
- **D2** Dark mode: not in v1 (not designed).
- **D3** "Offers this" chip text `#FFFFFF` on every page, Home included (README:260).
- **D4** No-X-ray rule as README:293 says. The prototype differs, but only once real X-ray data exists.
- **D5** Data d1–d15 takeaways stay the content pack's text; generating them from claims (README:334) waits for your decision, because it changes numbers (e.g. 7,500 vs 7,000 deaths).
- **D6** Em dashes in pack strings stay as written; new copy I add has none.
- **D7** Konsulta (Learn) vs YAKAP (planner, claims): each ships verbatim from its source and is flagged for the content owner. I don't choose.
- **D8** Check is built in full with "Medical review: [partner clinicians — pending]" visible. Whether `/check` goes live before clinical review is your call. L6 gets a tracked flag, not new visible copy.
- **D9** Placeholders and `[VERIFY]` stay visible as designed; `launch-check` lists them; you decide when to launch.
- **D10** Filipino strings not in the pack ship as in the prototype, flagged for the native-speaker review.
- **D11** Check result buttons say "Plan my route to a test" (README) and link to `/?need=all`.
- **D12** Statistics and claims are built into the pages, not fetched at runtime (§4.4).
- **D13** Charts are prerendered, then re-laid out in the browser (prototype parity at every width).
- **D14** Dot story: "scattered" layout (prototype default); canvas uses TB red `#C42032` instead of the leftover old coral.
- **D15** Service-worker updates apply silently, as in the prototype, with revisioned precache so open tabs don't break.
- **D16** Performance budgets as in §4.6.
- **D17** No structured data (JSON-LD) until the group name is final and clinical review is done.
- **D18** The Design System page and the QA harness are not shipped.
- **D19** Check steps don't add browser history entries (prototype), so nothing about answers ends up in history.
- **D20** Places filters aren't written to the URL (prototype).
- **D21** Where the README contradicts itself, I read it as: 20 charts (not 15), `og-image.png` exists, three motions (route, dot story, sheet slide), Install at `/install`, page-specific specs win over the general frame spec (e.g. Learn H2 size), and the global button sizes apply (e.g. Learn L5 buttons 58/46px).
- **D22** CI: I'll add a GitHub Actions file (build + tests) in step 13 for you to enable. No external link checking without your OK, since it calls other sites.

### 7.3 Open items I'm tracking but not resolving
Clinical review (Check, Learn L6); DOH hotline 1555 `[VERIFY]`; Sakay.ph deep links `[VERIFY]`; YAKAP X-ray list and DOH-NTP lab list; group name, contact email, partner names and logos, medical reviewer, and the "TB PH" name itself; Filipino language review; the content conflicts the readers found (27,900 vs 28,000 DR-TB; 7,500 vs 7,000 deaths; 14% vs 13.6%); expired accreditations in the list (hide, flag or show?); partner-confirmed services for the overrides file; who runs the monthly data refresh; real-device installs, VoiceOver/TalkBack/Safari keyboard passes, Search Console.

## 8. What I won't do without asking
Run anything in `pipeline/`; add a service, API key, analytics or tracking; resolve or reword `[REVIEW]`, `[VERIFY]` or placeholders; push, merge or create repos; touch anything in `~/Documents/KitaMo-ph`; use real patient data anywhere.
