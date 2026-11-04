# TB PH build plan: stack and steps

Status: **approved by the owner on 4 November 2026** (as of commit `7ea78ff`), with Q2 and Q3 answered; Q4, Q5, Q6, Q9, Q10 and Q13 answered the same day. The owner's decisions are recorded in `docs/decisions.md`, which the TB Health lead keeps; where this plan and that file differ, `decisions.md` wins.
Written 30 October 2026 by the Jr. Builder, from the v6 design handoff (`design/design_handoff_tb_ph/`). Updated 4 November 2026 after an independent review from five angles (stack facts, spec coverage, rules and privacy, sequencing and tests, owner questions), with every finding re-checked by a skeptic. §7.1 changed: Q2, Q3, Q4, Q5, Q6, Q7 and Q8 were reworded, and Q9–Q13 are new.

## 1. Summary

- **Stack:** Astro 7 (static output) + Preact islands + TypeScript (strict) + plain CSS with design tokens. Self-hosted fonts. Workbox service worker generated after the build. Vitest for logic, Playwright + axe for the browser. Node 22 LTS, npm.
- **Shape:** every page is prerendered HTML, in English at `/…` and Filipino at `/fil/…` (Q2). JavaScript runs only in the interactive parts: the route planner, the Places list and filters, the Place page, the symptom check, the dot story, the Data charts and a few small helpers.
- **Order:** scaffold → shared shell (header, footer, languages, 404) → ported planner logic with tests → **Home route planner as the first end-to-end slice** → Places → Place → Check → Learn → Data → About and Install → phone app (PWA) → SEO and headers → QA hardening → release audit.
- **Owner input needed:** 7 questions before specific steps, 4 before launch (§7.1). Q1–Q6, Q9, Q10 and Q13 are answered; Q7 (host and domain, asked before step 12), Q8, Q11 and Q12 are open. Everything else has a stated default (§7.2) that I follow unless the owner says otherwise.

## 2. What we're building

The spec is `design/design_handoff_tb_ph/README.md`. In short: a bilingual (English / Filipino) TB care finder for the Philippines. It is static and frontend-only: no accounts, no backend, no analytics, and location never leaves the browser.

| Route | Page | Interactivity |
|---|---|---|
| `/` | Home: the route planner (where are you → what you need → 3-stop route) | Large island |
| `/places` | Full list of TB-DOTS centers, filters (panel or bottom sheet), optional map | Large island; map loads only on request |
| `/place/{id}` | Shareable place page | One prerendered page per place and language, hydrated by a single `PlaceDetails` island. The same component renders the offline shell (§4.4) |
| `/check` | Guided symptom check, urgent screen, results A–D, printable summary card | Medium island (answers in memory only) |
| `/learn` | Long-form "Learn about TB" (L1–L10) | Static, plus tiny scripts (scroll-spy, back to top) |
| `/data` | Dot story (canvas) + 20 charts + "TB in numbers" (44 claims) | Static text and tables; charts and dot story are islands loaded when scrolled into view |
| `/about` | About, privacy, accessibility, helpful numbers | Static |
| `/install` | How to install the phone app | Small island |
| 404 | Not found, plus the place-specific "This place isn't on the list." (README:220) | Static |

Plus the phone-app layer: manifest, icons, service worker (offline after one visit), install entry points hidden when installed, and offline status lines.

Reference material, all read in full for this plan: README, the 13 prototype pages and `tbph-core.js`, the content pack, the source-of-truth checklist (SOT), AUDIT-v6, handoff notes v2/v5/v6, design prompts v2/v3, the data files and the pipeline scripts (read, not run).

## 3. Stack choice

| Piece | Choice | Why |
|---|---|---|
| Framework | **Astro 7.4**, `output: 'static'`, `trailingSlash: 'never'`, `build.format: 'file'` | The site is mostly static content with a few interactive parts, which is Astro's "islands" model, and the handoff suggests it (README:9). It ships zero JS by default and builds plain HTML that any static host can serve. It has built-in i18n routing, so English stays at `/` and Filipino goes under `/fil/` (§4.2). Slashless file output matches the routes in README and avoids a redirect on every navigation. |
| Islands and UI parts | **Preact** (`@astrojs/preact`) | The prototype's behaviour is written as React-style classes (`state`, `setState`, lifecycle methods, `renderVals`), and Preact ports those almost line for line. That keeps behaviour drift low on medical and route logic. The runtime is about 4 KB. Shared UI parts (chips, rows, buttons, controls) are Preact components too, so islands and static pages use the same code (§4.1). Islands hydrate `client:load` (planner, check), `client:visible` (charts, dot story) or `client:idle` (small helpers). Preact 11 no longer adds `px` to numeric style values, so units are written explicitly. |
| Language | **TypeScript 6, strict** | `tbph-core.js` becomes a typed module (README:15). Copy dictionaries are typed so a missing Filipino string fails the build. TypeScript 7 is out, but `@astrojs/check` (which type-checks `.astro` files) supports only 5 and 6 (step 1). |
| Styling | **Plain CSS + custom properties** (`tokens.css`) and shared classes | The tokens in README §Design tokens map directly to CSS variables. Glass fallbacks, the language-dependent breakpoints (1000px EN / 1180px FIL) and `prefers-*` queries are pure CSS. No Tailwind or UI kit: pixel-accurate recreation is easier when the CSS mirrors the spec. The prototype's inline styles become classes. Prerendered HTML carries no `style` attributes unless the CSP hashes them, and dynamic values are set after hydration (§4.5). |
| Charts | **Hand-built SVG** builders ported from `Data.dc.html` as pure TS functions | The design says charts stay hand-built (prompt v3:119). They render at build time at the default width, then re-lay out in the browser when visible, which keeps the prototype's exact behaviour at every width. Tables and text work without JS. |
| Dot story | **Canvas 2D** island (port of `DotStory.dc.html`) | 724 animated dots. Static text beats are server-rendered; the canvas loads when scrolled near. |
| Map | **Leaflet 1.9.4 bundled from npm**, dynamically imported only when "Map" is chosen | Same library and version as the prototype, but not loaded from unpkg (no third-party script host, no missing integrity check). Tiles: the public OpenStreetMap server, as in the spec (**Q5**). |
| Fonts | **Self-hosted** from the Fontsource npm packages through Astro's fonts API (local provider): Atkinson Hyperlegible Next 400/700/400 italic, Newsreader 600 (wordmark only), latin subset, woff2 | README:89 says self-host (privacy and speed). Both fonts are SIL OFL 1.1. The latin files are about 12–24 KB each, and the latin subset covers Filipino's ñ. Astro generates the metric-matched fallbacks (adjusted Arial, Times New Roman) that avoid layout shift, and nothing is fetched at build time. Newsreader is the static 600 instance, not the prototype's variable optical-size font (132 KB for a wordmark). |
| Phone app | Web manifest + **Workbox**: `src/sw.ts` bundled on its own, then `workbox-build` 7 `injectManifest` inserts an explicit precache list after `astro build` | README:371 asks for a build-generated service worker with the prototype's strategies. `injectManifest` doesn't bundle the worker itself, so a small separate bundle step runs first. A post-build step avoids `@vite-pwa/astro`, which doesn't support Astro 6+ yet. |
| Data | Statistics and claims **imported at build time**; facility list **fetched at runtime** from a slimmed JSON that the build prepares | See §4.4. |
| Tests | **Vitest** (logic, chart builders, copy parity), **Playwright** with Chromium + WebKit, one worker (end-to-end, accessibility with `@axe-core/playwright`, a port of `qa-harness.html`), **Lighthouse** on the production build | All heavy runs go through `_handoff/lowmem-run.sh` with `GUARD_NO_DOCKER=1`, split into small guarded jobs (§5, "How checks run"). |
| Tooling | **Node 22.23.4 LTS** pinned with `.nvmrc`, **npm** (ships with that Node) | Astro 7 and Vitest 5 need Node ≥ 22.23.4. It is installed through nvm for this folder only (owner said yes, 30 Oct 2026). nvm's default alias and the global/Homebrew Node are unchanged, because the KitaMo builders use them. npm 10.9.9, bundled with that Node, runs scripts and `npm ci`, but its installer crashes on this dependency tree (`Cannot read properties of null (reading 'edgesOut')`), so adding or updating packages uses `npx -y npm@11.21.1 install`, pinned so installs repeat exactly (step 1). The Homebrew pnpm on this Mac is 9.15.9 from March 2025, so it's left alone. Shells run `. ~/.nvm/nvm.sh && nvm use` before any npm command, including inside `lowmem-run.sh`. Astro's experimental parallel prerendering stays off, because it starts one worker per CPU core. |
| Host | Any static host. Recommended: **Cloudflare Pages**, in a TB Health-only project the owner controls (**Q7**) | It serves real 404s from the nearest `404.html`, so `/fil/404.html` and `/place/404.html` work. Without a top-level `404.html` it would answer every unknown URL with the home page and a 200. It supports a `_headers` file (HSTS etc.) and Brotli, and has no bandwidth billing. GitHub Pages also works if no new vendor is wanted, but it can't set security headers and serves only one root 404 page. |

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
  prepare-data.mjs        validate data, slim the facility list, derive ids, region counts and a small gazetteer (no network)
  build-sw.mjs            bundle src/sw.ts, then Workbox injectManifest with an explicit precache list
  launch-check.mjs        lists everything still open before launch (see 4.3)
src/
  styles/                 tokens.css (README tokens), global.css (focus, links, glass + fallbacks, print)
  content/                typed EN/FIL dictionaries per page + sources registry (see 4.3); no paths inside
  ui/                     shared Preact parts, rendered as plain HTML on static pages and imported by islands:
                          GroupedList, LinkRow, InfoLine, Chip, SectorBadge, buttons, FacilityRow, OptionRow,
                          LocationField, SegmentedControl, Select, Switch, BottomSheet, ClaimRow, BackLink
  lib/core/               port of tbph-core.js: text, phone, facility, geo, route, links, data loading
  lib/check/              symptom-check logic: steps, evaluate, notes, card rows (pure functions)
  lib/charts/             SVG primitives + the 20 chart specs (pure functions of data, lang, width)
  lib/                    i18n (href helper, language switch), pwa (port of pwa.js), anchor (keep reading position)
  islands/                Preact: Planner, Places, PlaceDetails, CheckFlow, DotStory, ChartPanel, TopicPicker, InstallSteps
  layouts/BaseLayout.astro  head tags, pre-paint script, skip link, header, footer
  pages/                  index, places, place/[id], place/404, check, learn, data, about, install, 404 + fil/ copies (thin wrappers)
  sw.ts                   service worker source (strategies from prototype sw.js)
tests/unit  tests/e2e  tests/fixtures (synthetic data only)
docs/                     PLAN.md, copy-overrides.md, later AUDIT-build.md (decisions.md belongs to the TB Health lead)
```
`design/` stays untouched as the reference. `support.js` and `qa-harness.html` are never ported; the harness checks become Playwright tests.

### 4.2 Languages and URLs (**Q2**, answered 4 Nov 2026)
- **URLs.** English pages at `/…`, Filipino pages at `/fil/…`, both prerendered. Each has its own `<html lang>`, `<title>` and description, `hreflang` links and sitemap entries. There's no flash of English for Filipino readers, it works without JavaScript, and Filipino can be found in search.
- **Links stay in the page's language.** Every internal link (static pages, islands, the service worker's offline page) comes from one `href(route, lang, params)` helper, a thin wrapper over Astro's locale URLs. Dictionaries never hold paths. A crawl of `dist/` fails the build if a `/fil/` page links to an English page or the reverse, except for the language toggle and `hreflang` tags.
- **The toggle** becomes two links, "English" and "Filipino", each with `lang`/`hreflang` and `aria-current` on the current language. These replace README's two buttons with `aria-pressed` (README:131, :307); the owner approved the change (Q2a), and it is logged in `docs/copy-overrides.md`. Clicking either one writes `tbph-lang` before switching. The link carries the current query and hash, so Home's `need`/`near` and Place's `stop`/`need` survive the switch.
- **Keeping the reader's place** (README:283). Before navigating, the page saves the current `[data-anchor]` id and offset in `sessionStorage` and deletes them once restored (§4.5 lists this).
- **In-place switch only where state would be lost.** On these pages the toggle switches language without a navigation and updates the address with `history.replaceState`:
  - Check, where the answers are held;
  - Places, where the filters and a location fix are held;
  - Home, but only while a location fix is held.

  Nothing is stored to carry that state across. On those pages the island owns the whole of `<main>`, and a small script swaps the header, footer and skip link from an inlined two-language dictionary (about 40 strings). It also updates every internal link, `<html lang>`, `<title>`, the description, the canonical URL and `hreflang`. These pages therefore carry both languages' copy, counted in §4.6. Place always navigates; how a location fix carries over there depends on Q4.
- **The saved choice** (`tbph-lang`, as specced). *Decided (Q2b):* a pre-paint script on every English page sends a reader whose saved choice is Filipino to the `/fil/` twin, keeping the query and hash. This matches "remembered on the device" (prompt v2:54) and makes manifest shortcuts and shared English links open in Filipino for them. Crawlers have no storage, so they're unaffected. (The lighter option, applying the choice only on `/` and at app launch, was not chosen.)
- **The installed app** has one English manifest (`start_url: /`). Shortcuts point at English routes and reach Filipino through the same redirect. Both `/` and `/fil/` are precached, so a Filipino launch works offline.
- **What the `/fil/` option costs** (accepted by the owner, Q2c–d):
  - the toggle change above;
  - Filipino page titles and descriptions that don't exist yet (§4.3);
  - twice the place pages (about 4,200 at launch);
  - both-language copy on Check, Places and Home.

  *The alternative (as specced):* one URL per page with the language swapped in the browser. On a static build that means shipping both languages in every page or showing English first. Filipino can't be indexed, and the interactive parts re-render after load.

### 4.3 Copy and medical content
- One typed dictionary per page in `src/content/`. Each string carries `en`, `fil`, an **origin** and **flags** (`REVIEW`, `VERIFY`, `PLACEHOLDER`, `FIL-REVIEW`). The origins are:
  - `pack`: the content pack;
  - `ui`: written in the prototype;
  - `override`: README wording that differs from the pack;
  - `owner`: supplied by the owner or a translator.
- **The builder writes no new copy.** Strings are copied **verbatim** from the content pack where it has them, and otherwise from the prototype. That includes pack §1 (global, footer, safety, data credit) and §5 (Places: intro, filters, count, sector badges, empty state, data note), which are tagged `pack`. Any string with no source at all is listed for the owner instead of being written. Examples are Filipino page descriptions with no Filipino sentence in the pack, or any "lapsed" label. `launch-check` treats those as blocking.
- A **parity test** compares every `pack` string with `reference/content-and-data-pack.md` and fails on any difference, so medical copy can't drift during the port.
- `docs/copy-overrides.md` records every place where the build uses README/prototype wording instead of the pack, with the pack line and the README line, for the owner to confirm (approved in principle, Q3):
  - `/find` and "Find a TB-DOTS center" vs `/places` and "Find TB care";
  - "Get directions" opening `maps_url` vs "Commute directions";
  - "Call" / "Copy address" vs "Call before you go" / "Copy address for Sakay.ph";
  - "Plan my route to a test";
  - the 23 vs 30 October dates;
  - the toggle change (§4.2).
- **Page titles and descriptions.** English as in the prototype. Filipino titles are built from existing Filipino H1s and nav labels. Filipino descriptions use only verbatim Filipino pack sentences: Check from pack :197–198, Places and Home from pack :395. The rest (About, Data, Install, Learn, Place) come from the owner later (Q3). Until then they are listed as `owner` strings that block in `launch-check`, and I write none.
- `scripts/launch-check.mjs` lists everything still open, and the build never resolves or rewords any of it:
  - clinical review pending for Check, and `[REVIEW]` on Learn L6;
  - DOH 1555 `[VERIFY]`;
  - placeholders;
  - `owner` strings not yet supplied;
  - sample or synthetic data, and the placeholder domain;
  - the known content conflicts (7,500 vs 7,000 deaths; 27,900 vs about 28,000; 14% vs 13.6%) and the pending D5 decision;
  - lapsed accreditations and the facility file's age.

  Flags stay visible on preview builds exactly as designed.
- Dates ("Last updated", data dates) come from one constant read from the data files' `meta`, not typed in several places.

### 4.4 Data flow
```
pipeline/ (owner runs it, or approves a run)  →  data/*.json  →  scripts/prepare-data.mjs  →  build
```
- `tb-ph-data.json` and `claims.json` are **imported at build time**. Charts, tables, takeaways, Learn's "By the numbers" and "TB in numbers" become static HTML: they work offline, nothing shifts after load, and there are no silent fetch failures. README:6 says these are fetched at runtime; updating them needs a redeploy either way (default D12).
- The facility list stays a **runtime fetch** (README:288), but from a slimmed `public/data/facilities.json`. It is validated against a schema and has only the fields the site uses (D23). It is pre-compressed by the host. The build also writes:
  - d14's per-region counts, so the Data page doesn't download the list;
  - a small cities-and-provinces gazetteer, which the Place page uses to show the distance from a typed `near` without downloading the whole list.
- **Place ids** (Q6). The ids are derived in `prepare-data` from the normalised name + city + province, with a suffix on collisions. An alias map keeps old ids working, and the script reports which ids changed between data refreshes.
- **One Place renderer.** `PlaceDetails` is prerendered for each id and language, then hydrated. Offline, the same component renders a per-language `/place` shell from the cached `facilities.json`. An unknown id gets the designed missing state from `place/404.html` and `fil/place/404.html`, served with a 404 status.
- Build-time guards fail the build when data breaks an assumption: chart maxima, `southeast_asia_rates[0]` is the Philippines, every claim's sources resolve. The fixed dot counts 724/179/37 are a deliberate tripwire: a WHO refresh trips them until the copy with literal numbers is updated (Q11).
- Until the full list exists, the build uses the 93-row sample, whose sample notes show as designed. A **synthetic ~2,100-row fixture** is used only to measure build time, memory, JSON size and Places speed at production scale. It has obviously fake names and addresses, is never shipped, and `launch-check` flags it.

### 4.5 Privacy and security (RA 10173)
- **Storage and tracking.** There are no analytics, no third-party scripts and no cookies. The site stores only two things:
  - `tbph-lang` in localStorage;
  - the one-navigation reading anchor in sessionStorage, deleted once used.

  Check answers and location fixes stay in memory.
- **The host** sees every visitor's IP, browser and requested page address. The About privacy text has to say so (Q5/Q7). Host features that inject scripts or cookies or rewrite HTML stay off: analytics beacons, email obfuscation, script optimisers, bot challenges. A post-deploy check confirms no `Set-Cookie` and HTML identical to `dist/`.
- **Automated privacy tests:**
  - after Check's Start, no cross-origin request is made, no request URL or body contains an answer, and localStorage, sessionStorage, IndexedDB and Cache Storage are unchanged (same-origin page assets may load);
  - after using location, no coordinates appear in any URL or storage;
  - `near` in a URL is never free text;
  - no Cache Storage key contains a query string;
  - each page contacts only our origin plus the hosts the About text names.
- **URL inputs** (`id`, `need`, `stop`, `near`, `svc`, hash ids) are whitelisted or length-capped and only ever rendered as text. Which route context travels in place links is part of Q4.
- **Content Security Policy.** Astro's island hydration and our pre-paint script are inline scripts, so `script-src 'self'` alone would break every island. Astro 7's `security.csp` emits a `<meta>` CSP with hashes for them, and it is **on from step 1**, so every step is built and tested under the real policy. It allows scripts, styles, fonts and data from our own origin only. Images may also come from `tile.openstreetmap.org`, `data:` and `blob:` (map, save as image). The host adds what a meta tag can't set: HSTS and `frame-ancestors 'none'`, plus `Permissions-Policy: geolocation=(self), camera=(), microphone=()` and `X-Content-Type-Options: nosniff`. Non-production deploys also send `X-Robots-Tag: noindex`.
- **`Referrer-Policy: strict-origin-when-cross-origin`** (the browser default). OSM's tile policy requires a Referer and says not to block it. Other sites (OSM, Google Maps, Sakay.ph) only ever see our origin, never a page address with its parameters.
- **The About privacy rows must stay literally true.** Self-hosting fonts, bundling Leaflet and naming the host change what they should say, and new text is the owner's to approve (Q5).

### 4.6 Performance budgets (proposed, default D16)
- Mobile Lighthouse ≥ 90 in every category (Accessibility 100).
- LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
- JS per page ≤ 60 KB gzip, including the second-language copy on the in-place pages (§4.2). Data ≤ 120 KB. The Leaflet chunk is excluded and loads only on request.
- Slim facility JSON ≤ 200 KB compressed.
- Precache ≤ 60 entries and ≤ 3 MB stored on a first visit (the uncompressed facility list is about 1.1 MB of that); place pages are never precached.

## 5. Build steps

Each step gets its own local branch (`build/NN-name`) and commits, staged by path. I update `_handoff/JR-RESUME.md` and report to the TB Health lead; pushes go through the owner. "Done" means the tests listed pass through `lowmem-run.sh`, plus the visual check against the prototype described below. Sizes: S ≈ one session, M ≈ two, L ≈ three or more.

| # | Step | Delivers | Done when | Size |
|---|---|---|---|---|
| 0 | **Owner decisions + environment** | Done. Node 22.23.4 via nvm + `.nvmrc` (30 Oct 2026); plan approved and Q2–Q3 answered (4 Nov 2026, `docs/decisions.md`) | Owner approves the plan | — |
| 1 | **Scaffold** | Astro 7 + Preact + TS strict + npm; slashless file output; `security.csp` on; `tokens.css`, `global.css`; self-hosted fonts; icons and favicon/apple-touch tags; BaseLayout; `data/` copied from the handoff; `prepare-data.mjs` (incl. synthetic-fixture mode); Vitest; Playwright (one worker, service workers blocked by default, fixed synthetic or denied geolocation in every context, `dist/` served by a light static server that honours nested `404.html`); test and report folders in `.gitignore` | `npm run build` and an empty test run pass through `lowmem-run.sh` | S |
| 2 | **Shell + languages + 404** | SiteHeader (glass + solid fallbacks, nav, toggle links, phone tab bar), SiteFooter, skip link, focus and link styles. i18n routing + `href` helper + link-language crawl. Pre-paint script: saved-choice redirect (Q2), PWA attributes (`data-standalone`, `data-online`, `data-platform`). Chrome-swap script for in-place pages. Dictionary format + parity test + `launch-check`. CSP-violation test fixture. Nav, tab bar and shortcuts driven by one route list (Q9). 404 and `/fil/404` | Breakpoints right in EN (1000px) and FIL (1180px). Glass turns solid under reduced transparency / more contrast / no blur support. Skip link works. Parity test green. `/x` and `/fil/x` give a 404 in the right language. Saved `fil` + `/?need=all#x` lands on `/fil/?need=all#x`. Link crawl clean. No CSP violations | M |
| 3 | **Planner logic port** | `lib/core/*` from `tbph-core.js` with types; unit tests for every function (normalise, title case, phone links, services, gazetteer, place matching, route, distance, directions links); agreed fixes only (Q4); no-X-ray rule per Q13 | All core tests pass, including the cases the readers verified on the sample (82-row bug fixed only if approved) | M |
| 4 | **Home: the first full slice** | Shared UI parts in `src/ui/` (GroupedList, FacilityRow, OptionRow, Chip, SectorBadge, InfoLine, LinkRow, buttons, LocationField). Backdrop, frosted planner form, "I need" rows, all result states (loading, error + try again, no match, route), route draw-in (instant under reduced motion), URL state per Q4, geolocation on click, focus moves, "Good to know". Links to Places and Place are stubs until steps 5–6 | End-to-end: empty submit error; typed city → route heading focused; location denied/granted (mocked); "I need" change recomputes without animating; deep links restore. With a location fix held, an in-place switch to Filipino keeps the route, and header, main, footer and every link match a fresh `/fil/` load. Visual check in all demo states. **Demo to the owner** (stub links said up front) | L |
| 5 | **Places** | SegmentedControl, Select, Switch, BottomSheet (focus trap with `inert`, Escape, scrim, swipe, scroll lock that can't leak). Filters panel ≥ 1080px, list with "Show more", sort by distance, all states, lazy Leaflet map (Q5) with its error and "Try again" | Sheet keyboard and screen-reader tests; filters; empty state; offline line shows when `data-online=false`; map loads only on request and recovers from a failed load; in-place switch keeps filters; no horizontal scroll at 320px; filter and sort timings measured on the synthetic fixture | L |
| 6 | **Place pages** | `PlaceDetails` prerendered per id and language (Q6). Stop motif shown before paint from a validated `stop` (no layout shift). Actions: commute, walk, drive, copy address for Sakay.ph (copy first, then open). Services and details. Distance from `near` via the small gazetteer; location per Q4. `place/404` and `fil/place/404` with the designed missing state | `/place/bad` and `/fil/place/bad` give a 404 with "This place isn't on the list." and "See more places". A shared link with `stop` shows the motif with no layout shift. Copy success and failure messages. Build time and peak memory measured on the synthetic fixture (about 4,200 pages) | M |
| 7 | **Check** | Question flow ported as pure, tested functions (steps, evaluate, notes, card rows), the four views, sticky Next above the tab bar, urgent Film screen, patient card, print (card only), save as image. Question title colour per Q10; launch switch per Q9 | Decision-table tests for urgent/A/B/C/D; stale answers never leak across paths; focus on each H1; the privacy test in §4.5; print shows only the card; save-as-image makes a PNG (share stubbed); Next sits above the tab bar at 390px; in-place switch keeps answers; clinical-review footnote still visible | L |
| 8 | **Learn** | Static article L1–L10, contents (collapsible / sticky sidebar with scroll-spy), "By the numbers" from claims at build time, myths table (ARIA, two layouts), back to top | Parity test for every Learn string; all 17 claim links resolve to `/data#claim-…` on EN and `/fil/data#claim-…` on FIL; one H1; switching language mid-page at 390px keeps the section in place | M |
| 9 | **Data** | D5 decided before this step. Chart builders + 20 panels with tables ("View as table"), d5 toggle (shared SegmentedControl), captions and sources, hatching, narrow layouts; Methods; "TB in numbers" with topic picker (shared SegmentedControl/Select) and deep links; dot story canvas | Builder unit tests (widths 640/560/420); every chart has a table and an SVG label; deep link focuses the claim; dot counts 724/179/37; reduced motion shows end states; language switch keeps the section in place | L |
| 10 | **About + Install** | About sections (helpful numbers, `[VERIFY]` kept), install section hidden when installed; Install page with platform order and one-tap install | Helpful-number rows never blank; `tel:` links exact; install entry points hidden when `data-standalone=true` | S |
| 11 | **Phone app (PWA)** | Manifest with production routes. `pwa.ts`: absolute `/sw.js`, install prompt. Workbox SW: an explicit precache (core routes in both languages, the two place shells, EN and FIL offline pages, assets, data JSON), with place pages excluded and cached when visited. Pages network-first (4 s) → cache → offline page, matching cached pages whatever the query (as `sw.js:57` does) with query-free cache keys. Data and assets stale-while-revalidate. Map tiles, Google Maps and Sakay never cached. Version from the build hash | In a separate Chromium project with the SW on: offline after one visit for `/?need=all`, `/fil/?need=all`, `/places?svc=test` and a place URL with `stop`/`need`; an unvisited place renders offline in EN and FIL; the offline lines' "saved list" is true; precache within budget; no Cache Storage key has a query string; a standalone launch with saved `fil` lands on `/fil/` online and offline | M |
| 12 | **SEO + headers** | Titles and descriptions per §4.3, canonical without state params, hreflang, Open Graph + `og-image.png`, sitemap and robots for the real domain (Q7), `_headers` (HSTS, frame-ancestors, Permissions-Policy, nosniff, noindex on non-production) | Head-tag tests on every route; every canonical, hreflang, sitemap and manifest URL answers 200 with no redirect; the map and save-as-image work under the CSP | S |
| 13 | **QA hardening** | qa-harness checks as a Playwright matrix (9 routes × widths × EN/FIL: no sideways scroll, no overflow, one H1, targets ≥ 44px, text ≥ 14px, no template leftovers, no console errors); axe on every route; contrast token test; Lighthouse; budget check; internal link and link-language check; synthetic-fixture performance pass | All green, or listed as accepted risks for the owner | M |
| 14 | **Release audit + handover** | `docs/AUDIT-build.md` in the SOT format (status per rule, N/A reasons, evidence); `launch-check` report; post-deploy check (no cookies, HTML = `dist/`); the owner-only list (below); deploy command. `launch-check` refuses a production deploy while the Check review or sample data is open, unless the owner passes an explicit override | The owner has a PASS / PASS WITH RISKS / BLOCKED decision to make with evidence | S |

The owner-only list at step 14 covers:
- clinical review;
- `[VERIFY]` items and placeholders;
- the Filipino review;
- the content conflicts and D5;
- type-scale consolidation;
- the exported or printed card's risk-factor row;
- lapsed accreditations and data age;
- real-device installs;
- VoiceOver, TalkBack and Safari keyboard passes;
- Search Console.

Step 4 is deliberately early: it proves the whole chain (copy, data, logic, island, URL, language, tests, visual match) on the most important page before the rest is built the same way.

**How checks run on the 8 GB Mac.** The site is built once per gate. The rest runs as separate guarded jobs (`GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh …`):
- one per Playwright project (Chromium, then WebKit);
- the prototype comparison, Chromium only;
- Lighthouse on its own.

`playwright.config` reads the guard's `E2E_WORKERS`. The build runs under the guard's 1.5 GB heap, which the synthetic fixture measures. Guard exits 97/98/99 mean "retry later", not a test failure, and each step's evidence records the guard's peak memory line.

**Visual check against the prototype.** The prototype is served locally as README:18 describes (it pulls React and fonts from CDNs on this machine only). Its demo states are reproduced by interaction:
- typing "Quezon City";
- a mocked location at 18.565, 120.79 for "far";
- scripted answer paths for urgent and A–D.

`tbph-lang` is set on the prototype's own origin, and reduced motion is emulated so the route, dot story and map are still. Paired screenshots at 320/390/768/1280 px (FIL at 320/1024/1280) go to a git-ignored folder for review, and each step's resume entry lists which pairs were checked. A few computed-style assertions (control heights 58/48/46/44, breakpoints) join the automated suite. Every browser context uses a fixed synthetic location or denies it, never the Mac's real one.

## 6. Risks I'm planning around

| Risk | Plan |
|---|---|
| Medical copy drifts during the port | Verbatim dictionaries + parity test; no new copy; flags stay visible |
| The facility list doesn't exist yet (sample only: approximate pins, X-ray unknown everywhere, no hours) | Build and test on the sample; the synthetic fixture measures production scale; `launch-check` blocks a "ready" status until the real list is in (Q8) |
| Facility ids are PDF row numbers, so a new PhilHealth list can point shared links at the wrong clinic | Stable ids with an alias map and change report (Q6) |
| 8 GB shared Mac | One heavy job at a time, split into small guarded jobs (§5); Playwright with one worker; Chromium + WebKit only; Lighthouse never alongside KitaMo jobs |
| Safari quirks (glass, safe areas, sticky button, Web Share, print) | WebKit project in Playwright now; real iPhone/Android checks are on the owner's list |
| Prototype edge cases (one-letter search returns 82 rows, "QC" doesn't match, a stale location fix is reused, Retry re-prompts) | Fixed only with the owner's OK (Q4); otherwise ported as-is and listed |
| The service worker hides network mocks or adds requests in tests | Service workers blocked in the default test projects; SW behaviour tested in its own project |
| The CSP blocks something late | CSP on from step 1, with a violation check on every test page |
| Unreviewed Check reachable on a public preview | Deploy model in Q7; noindex on non-production; `launch-check` override needed for production |
| The WHO 2026 report will likely appear **during** the build (due late 2026) | Q11 asks whether to launch on 2024 data or refresh first; the dot-count tripwire catches a partial refresh |

## 7. Questions for the owner

### 7.1 Need an answer (with my recommendation)

**Before I start** (all answered)
- ~~**Q1. Node.**~~ Answered 30 Oct 2026: yes, Node 22 LTS through nvm for tb-health only, pinned in `.nvmrc`; nvm's default alias and the global/Homebrew Node untouched.
- ~~**Q2. Language URLs.**~~ Answered 4 Nov 2026 (`docs/decisions.md`): Filipino at `/fil/…`; (a) the toggle becomes two links with `aria-current`, logged in `docs/copy-overrides.md`; (b) the saved choice sends a Filipino reader from every English page to its `/fil/` twin, keeping query and hash; (c) and (d) accepted as costs.
- ~~**Q3. Copy source.**~~ Answered 4 Nov 2026 (`docs/decisions.md`): approved as proposed. Pack copy verbatim and parity-tested; prototype strings where the pack has none, flagged for EN/FIL review; README wins over the pack, each case in `docs/copy-overrides.md`; the stop explanations flagged `[REVIEW]` with L6. There is no newer content pack: build from the handoff's `content-and-data-pack.md`. The owner supplies the Filipino descriptions for About, Data, Install, Learn and Place later; they are `owner` strings that block in `launch-check`, and I write none. D10 and D11 apply.

**Before a specific step**
- ~~**Q4. Privacy in URLs and location.**~~ Answered 4 Nov 2026 (`docs/decisions.md`): as recommended. `near` only for a known city or province; location only on a tap, including `?loc=gps`; the three prototype bugs fixed. (a) Place links carry only `id` and `stop`. (b) No GPS distance on Place, only a distance from a typed `near`.
- ~~**Q5. OpenStreetMap and the privacy text.**~~ Answered 4 Nov 2026: the public OSM tile server; `tile.openstreetmap.org` joins `img-src` only when the map is built. The owner writes the new EN/FIL privacy rows (`owner` strings, blocking in `launch-check`).
- ~~**Q6. Facility data.**~~ Answered 4 Nov 2026: as recommended. An error and "Try again", never a silent sample fallback; stable ids from normalised name + city + province with a collision suffix, an alias map and a changed-ids report (built in step 3); one prerendered page per place and language.
- **Q7. Host, domain and deploys (before connecting a host; step 12).** Which host, account and domain? *Recommend* a TB Health-only Cloudflare Pages project and token held by you, never KitaMo's. Deploys by a direct upload you run, with no automatic branch previews or production deploys from `main` until launch. If you prefer Git integration, keep previews behind access control. GitHub Pages works too, but has no security headers and only a root 404 page. The domain also fixes the installed app's identity, so it's best chosen once.
- ~~**Q9. Launching without Check.**~~ Answered 4 Nov 2026: the site may launch without `/check`. Check is built in full, behind one build-time switch that drops it from the nav, tab bar, manifest shortcuts and sitemap.
- ~~**Q10. Check question titles.**~~ Answered 4 Nov 2026: TB red, as specced.

**Before launch**
- **Q8. Full facility list.** May I run the PhilHealth scrape + Nominatim geocoding (about 2,100 rows, 40 min to 2 h at 1 request/s)? Or will you provide the file? Details:
  - Which contact email goes in the geocoder's User-Agent?
  - *Recommend Nominatim over Google:* Google's terms limit storing geocodes and showing them on a non-Google map, and it needs a key and billing.
  - Nominatim results are OpenStreetMap data and need an OSM credit wherever distances use them (wording yours).
  - Should automatic street-level matches count as "precise" (exact distances, coordinate directions) before a person spot-checks them?
- **Q11. WHO 2026 report.** It is due late 2026 and will likely appear during the build. Launch on the WHO 2025 report (2024 data), dated as such, or refresh first? A refresh means a pipeline run (`build_tb_ph_data.py`, `build_claims.py`, with your OK), and the content owner updating the literal numbers in the pack, EN and FIL.
- **Q12. Lapsed accreditations.** In the sample, 76 of the 93 rows have PhilHealth accreditation ending on or before 31 Dec 2026 (3 have already ended). Show them as listed (default D24), rank them lower, or hide them? Any visible "lapsed" label is new copy you'd supply.
- ~~**Q13. No-X-ray rule.**~~ Answered 4 Nov 2026: README:293's rule (the referral note shows only when no confirmed X-ray site exists at all).

### 7.2 Defaults I'll follow unless you say otherwise
- **D1** Type scale: build the exact sizes specced, as named tokens, so consolidating later is a one-file change (README:107). The consolidation decision is on the pre-launch owner list.
- **D2** Dark mode: not in v1 (not designed).
- **D3** "Offers this" chip text `#FFFFFF` on every page, Home included (README:260).
- **D4** *Moved to Q13.*
- **D5** Data d1–d15 takeaways stay the content pack's text. Generating them from claims (README:334) changes numbers (e.g. 7,500 vs 7,000 deaths), so it needs your decision before step 9. Until then `launch-check` lists the conflicts.
- **D6** Em dashes in pack strings stay as written. I write no new copy; anything without a source is listed for you (§4.3).
- **D7** Konsulta (Learn) vs YAKAP (planner, claims): each ships verbatim from its source and is flagged for the content owner. I don't choose.
- **D8** *Moved to Q9.* Check is built in full with "Medical review: [partner clinicians — pending]" visible; L6 gets a tracked flag, not new visible copy.
- **D9** Placeholders and `[VERIFY]` stay visible as designed; `launch-check` lists them; you decide when to launch.
- **D10** (Q3 = yes, applies) Filipino strings not in the pack ship as in the prototype, flagged for the native-speaker review.
- **D11** (Q3 = yes, applies) Check results A–C say "Plan my route to a test" (README) and link to `/?need=all` (EN) or `/fil/?need=all` (FIL).
- **D12** Statistics and claims are built into the pages, not fetched at runtime (§4.4).
- **D13** Charts are prerendered, then re-laid out in the browser (prototype parity at every width).
- **D14** Dot story: "scattered" layout (prototype default); canvas uses TB red `#C42032` instead of the leftover old coral.
- **D15** Service-worker updates apply silently, as in the prototype, with revisioned precache so open tabs don't break.
- **D16** Performance budgets as in §4.6.
- **D17** No structured data (JSON-LD) until the group name is final and clinical review is done.
- **D18** The Design System page and the QA harness are not shipped.
- **D19** Check steps don't add browser history entries (prototype), so nothing about answers ends up in history.
- **D20** Places filters aren't written to the URL (prototype).
- **D21** Where the README contradicts itself, I read it as:
  - 20 charts, not 15;
  - `og-image.png` exists;
  - three motions (route, dot story, sheet slide);
  - Install at `/install`;
  - page-specific specs win over the general frame spec (e.g. Learn H2 size);
  - the global button sizes apply (e.g. Learn L5 buttons 58/46px).
- **D22** CI: a GitHub Actions file (build + tests) with a manual trigger only. It runs on GitHub's machines and your Actions minutes, and only when you start it. There's no external link checking without your OK, since it calls other sites.
- **D23** Settled by the spec or reducing third parties:
  - self-hosted fonts (README:89);
  - Leaflet bundled from npm instead of unpkg;
  - `?source=` dropped from the manifest (nothing reads it);
  - unused fields (`email`, `maps_url`, `source_row`, `region_as_listed`, per-row `source`) dropped from the published facility JSON (least data).
- **D24** Lapsed accreditations are shown as listed, with their "Accreditation until" date (prototype), until Q12 is answered.
- **D25** One English manifest; shortcut names stay English; shortcuts reach Filipino pages through the saved-choice redirect.

### 7.3 Open items I'm tracking but not resolving
- Clinical review (Check, Learn L6), including whether the exported or printed summary card should list risk factors such as HIV, and whether its file name can be neutral (e.g. `tbph-summary.png`).
- DOH hotline 1555 `[VERIFY]`; Sakay.ph deep links `[VERIFY]`.
- YAKAP X-ray list and DOH-NTP lab list.
- Group name, contact email, partner names and logos, medical reviewer, and the "TB PH" name itself.
- Filipino language review.
- The content conflicts (27,900 vs about 28,000 DR-TB; 7,500 vs 7,000 deaths; 14% vs 13.6%).
- Type-scale consolidation (README:107).
- Partner-confirmed services for the overrides file.
- Who runs the monthly data refresh.
- Real-device installs; VoiceOver, TalkBack and Safari keyboard passes; Search Console.

## 8. What I won't do without asking
- Run anything in `pipeline/`.
- Add a service, API key, analytics or tracking.
- Write new copy.
- Resolve or reword `[REVIEW]`, `[VERIFY]` or placeholders.
- Push, merge or create repos.
- Edit the TB Health lead's `docs/decisions.md`.
- Touch anything in `~/Documents/KitaMo-ph`.
- Use real patient data or a real location anywhere.
