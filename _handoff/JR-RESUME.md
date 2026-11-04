# JR resume — TB Health

## Done
- Folder, git repo and builder rules (`CLAUDE.md`) set up. Remote: https://github.com/RawBeans02/tb-health (owner pushes).
- Claude Design handoff v6 imported into `design/design_handoff_tb_ph/` (30 Oct 2026).
- Handoff studied in full: README, every prototype page, `tbph-core.js`, the content pack, SOT checklist, audit and notes, data files, pipeline scripts (read, not run) (30 Oct 2026).
- `docs/PLAN.md` written (30 Oct 2026): stack choice (Astro 7 static + Preact islands + TypeScript + plain CSS tokens, self-hosted fonts, Workbox SW, Vitest + Playwright, npm), a 15-step build plan with the Home planner as the first full slice, and owner questions with defaults. The Account Admin relayed §7.1 to the owner on 30 Oct 2026.
- Review status: a five-angle independent review (spec coverage, rules/privacy, stack facts, sequencing/tests, owner questions) was started on 30 Oct but **failed**: the Mac slept and lost the network, and no critic returned findings. Only the stack critic's lookups were recovered. Its corrections were applied to PLAN.md §3 and §4.5: CSP through Astro's `security.csp` hashes, `Referrer-Policy: strict-origin-when-cross-origin` (OSM tiles need a Referer), the SW source bundled before `injectManifest`, npm instead of the old Homebrew pnpm 9, explicit style units for Preact 11. The other four angles were never reviewed; rerun them if the owner or Account Admin wants.
- Committed on branch `plan/build-plan` (4 Nov 2026). The owner pushed it the same day, and it tracks `origin/plan/build-plan`. Pushes stay with the owner, through the Account Admin.
- 4 Nov 2026: the four review angles that failed were rerun (spec coverage, rules/privacy, sequencing/tests, owner questions), each with a skeptic verify pass. There were 46 findings, no blockers, and every serious one was confirmed or partly confirmed. PLAN.md was rewritten to match:
  - §4.2 language design: links stay in the page's language, toggle links, in-place switch only where state would be lost, saved-choice redirect;
  - one Place renderer + `place/404`;
  - shared UI parts in `src/ui/` as Preact;
  - CSP and PWA attributes from step 1/2;
  - service workers blocked in default tests;
  - an explicit precache;
  - a synthetic 2,100-row fixture;
  - the run shape on the 8 GB Mac and the visual-check method;
  - the host treated as a data processor;
  - no builder-written copy;
  - Q3 premise corrected, Q2/Q4–Q8 reworded, new Q9–Q13, D23–D25.

  Results sent to the TB Health lead.
- **4 Nov 2026: plan approved**, Q2/Q3 answered (`docs/decisions.md`, lead's file). PLAN.md marked approved on `plan/build-plan` (`ba3ee92`).
- **4 Nov 2026: step 1 (scaffold) built** on `build/01-scaffold`, **approved by the lead** the same day with no changes (installer pin added after review):
  - Astro 7.4.5 static (`trailingSlash: 'never'`, `build.format: 'file'`), Preact 11.1.1, TypeScript 6.0.3 strict, `security.csp` on (meta tag, hashes; img/font/connect `'self'` only, no OSM until Q5).
  - `tokens.css` (all README tokens), `global.css` (reset, focus, links). Fonts through Astro's fonts API from the Fontsource packages, woff2 only, with metric-matched fallbacks.
  - Icons copied to `public/icons/`; BaseLayout with the prototype's head tags; a placeholder `/`.
  - `data/` copied from the handoff. `scripts/prepare-data.mjs` validates the data, writes the slimmed `public/data/facilities.json` and `src/generated/region-counts.json` (both git-ignored), with `--synthetic` for 2,100 fake rows. Place ids pass through unchanged as a **Q6 stub**. The gazetteer comes in step 3 with the ported core.
  - Vitest (9 tests for prepare-data), Playwright (Chromium + WebKit, service workers blocked, fixed synthetic geolocation without permission), `scripts/serve-dist.mjs` (slashless files, 308 for `/x/` and `/x.html`, nearest `404.html`).
- **4 Nov 2026: step 2 (shell, languages, 404) built** on `build/02-shell` (cut from `build/01-scaffold` after `b05b89a`):
  - `src/lib/i18n.ts` (`toLang`, `href`, `pagePath`), `src/lib/nav.ts` (one route list; `TBPH_CHECK=false` drops Check from nav, tab bar, footer, shortcuts, Q9), `src/lib/dates.ts` (footer date = newest data-file `generated`), `src/lib/anchor.ts`.
  - `SiteHeader`, `SiteFooter`, `LangToggle` (two links, `aria-current`, Q2a), `src/styles/chrome.css` (CSS breakpoints keyed on `<html lang>`, glass fallbacks), `src/styles/ui.css` (frame, H1, buttons). Every colour is a token (dark mode, V2, drops into `tokens.css`).
  - `src/scripts/prepaint.js`: first thing in `<body>` (after the CSP meta), hash added with `Astro.csp.insertScriptHash`; Q2b redirect + `data-standalone/online/platform`. `src/scripts/lang.ts` (toggle links), `src/scripts/inplace.ts` + `InPlaceLanguage.astro` (in-place switch for Home/Places/Check; island sets `html[data-lang-switch="inplace"]`, listens for `tbph:lang`).
  - Dictionaries in `src/content/` (`types.ts` format: en, fil, origin, src refs, flags). Parity test `tests/unit/parity.test.ts`; `docs/copy-overrides.md`; `scripts/launch-check.mjs`; `scripts/check-links.mjs` runs after every build (its `PENDING` set lists pages from later steps: remove each as it lands).
  - 404 and `/fil/404`; Home placeholders at `/` and `/fil`.
  - Tests: 101 unit, 20 Playwright (Chromium 20 pass; WebKit 19 pass + 1 Chromium-only skip). `tests/e2e/fixtures.ts` fails any test on a CSP violation, console error or uncaught exception (`test.use({ expectedErrors })` for expected 404 notes).
  - Visual check against `404.dc.html` at 320/390/1280 (EN) and 390/1280 (FIL): same H1, header, footer and page heights. Pairs in `visual-check/step2/` (git-ignored).
- 4 Nov 2026: merged the lead's `lead/owner-batch-3` (V1–V5: v7 design, dark mode, no em dashes, 1555 verified, new claims). `claims.json`'s `meta.generated` is now 2026-11-04, so the footer reads "Last updated 4 November 2026".
- 4 Nov 2026: **lead approved step 2.** Lead's reading of Q9 (36eba91): `TBPH_CHECK=false` also unpublishes /check and drops in-content links to it; `check-links` enforces it in such builds (3970d13).
- **4 Nov 2026: step 3 (planner logic port) built** on `build/03-core`:
  - `src/lib/core/`: `text.ts` (norm, titleCase), `phone.ts`, `facility.ts` (types, prepare, offers), `geo.ts` (km, buildGazetteer, withKeys, matchPlace, distanceLabel), `route.ts` (resolveOrigin, route), `links.ts` (directionsUrl, homeQuery, readHomeParams), `data.ts` (loadFacilities: no sample fallback, retry refetches). No copy in core: the "about"/"mga" prefix and all STR strings move to dictionaries in step 4 (after v7, which changes some).
  - Owner fixes: text under 2 characters matches nothing (Q4 a); an emptied field doesn't reuse an old fix (Q4 b); referral note only when no confirmed X-ray site exists (Q13). Not yet: Retry/`?loc=gps` re-prompt is Home island behaviour (step 4). Left as in the prototype (not approved): "QC" doesn't match; 2-letter text still matches by substring ("ab" → 6 rows); typed-city distance 0 → "about 1 km".
  - `prepare-data`: Q6 ids (`placeKey`, `assignPlaceIds`), `data/place-ids.json` registry (recorded for the sample with `--accept-ids`), optional `data/place-aliases.json`, `public/data/gazetteer.json` (compact; rebuild keys with `withKeys`). Published rows carry the derived id; the PhilHealth row id is dropped.
  - Tests: 132 unit across 4 files (`npm test`); e2e unchanged (Chromium 20, WebKit 19 + 1 skip).
- **4 Nov 2026: step 4 (Home) built** on `build/04-home`:
  - `src/islands/Planner.tsx` (owns all of `<main>`), `src/ui/parts.tsx` (Chip, SectorBadge, InfoLine, LinkRow), `src/styles/home.css`, `src/content/home.ts` + `care.ts` (place-card strings shared with Places/Place; stop texts flagged REVIEW per Q3), `src/lib/core/locate.ts`, `src/views/Home.astro`.
  - Behaviour: location only on a tap (also `?loc=gps`); URL via `homeQuery` (matched place or gps flag; emptied field clears them); the URL's `near` applies once, on the first successful load, and never over typed text; "Try again" shows the loading line; the in-place switch is on while a fix is held (`html[data-lang-switch]`); "Not sure yet?" link dropped when `TBPH_CHECK=false`.
  - Visual check vs `Home.dc.html` (empty, Quezon City, far GPS 18.565/120.79) at 390/1280 EN and 390 FIL: all measured positions and page heights identical. Pairs in `visual-check/step4/`.
  - Known: Safari's datalist takes the first Enter while it has suggestions (native, as in the prototype); `text-wrap: pretty` on all paragraphs (README) breaks a few lines differently from the prototype.
- **4 Nov 2026: step 5 (Places) built** on `build/05-places`:
  - `src/islands/Places.tsx` (owns `<main>`, always in-place language switch), `src/islands/placesMap.ts` (Leaflet 1.9.4 from npm, loaded as a classic script on "Map" so "Try again" works in Safari; a TileLayer subclass swaps Leaflet's `data:` blank GIF for `/icons/empty.gif`), `src/lib/core/places.ts` (filterPlaces, regionOptions, provinceOptions, activeFilters), `src/ui/controls.tsx` (SegmentedControl, Select with a masked self-hosted chevron, Switch, LocationField, FacilityRow, BottomSheet: inert background, scroll lock, Escape on document, swipe), `src/content/places.ts`, `src/styles/places.css`.
  - CSP `img-src` adds `https://tile.openstreetmap.org` only (Q5). Tests serve tiles locally.
  - README over prototype: prefixed chips read "Chest X-ray: ✓ Offers this" (README:208); the prototype put the ✓ first.
  - WebKit reports its own `<select>` internals as a style-src violation; the test fixture allows exactly that message in WebKit only (Chromium still catches ours).
  - CSS order: page stylesheets can load before `ui.css`, so shared rules (e.g. `.frame--back`) live in `ui.css`.
  - Visual check vs `Places.dc.html` (list) at 390/1280 EN and 1280 FIL: identical positions and heights. Filter/sort on 2,100 synthetic rows: under 0.5 ms.
- 4 Nov 2026: **lead approved steps 3–5.** Owner's search fixes (a14c811): abbreviations in `data/place-abbreviations.json` (QC, CDO, GenSan, SJDM, Dasma, CamSur, CamNorte, NegOcc, NegOr; owner to check the list), two letters match only at a word start (planner and Places search), a city sits at the mean of its clinics' pins. prepare-data ships the gazetteer inside `facilities.json`. Chip fix 193daa0 (prefix and status as one text run). Lead is holding two owner items: auto-width Type segments ("Governm/ent" is in the prototype too) and the abbreviation list. Lead is auditing against the SOT checklist and an Apple HIG review; a task list will follow.
- **4 Nov 2026: step 6 (place pages) built** on `build/06-place`:
  - `src/pages/place/[id].astro` + `fil/place/[id].astro` (one page per place and language, plus alias ids with a canonical to the current id, Q6), `place/404` + `fil/place/404` (missing state, served by the nearest-404 rule). `src/lib/build-data.ts` reads the prepared list at build.
  - `src/islands/PlaceDetails.tsx` (1.8 KB gzip): Sakay copy-then-open (`src/lib/core/clipboard.ts`), distance only from a matched `near` via `/data/gazetteer.json` (Q4b), back link goes back in history to Home's route when the reader came from it. Details (hours, phone, region, accreditation date) formatted at build.
  - Stop motif and back label are CSS on `html[data-stop]`, set by the pre-paint script from `?stop=1–3`: no layout shift (CLS 0 in Chromium).
  - `care.ts` now has the place actions; commute, call and Sakay are README overrides of pack :406–408 (logged in copy-overrides.md).
  - Shared `.h2` and `.footnotes` moved to `ui.css` (page stylesheets aren't on every page).
  - Synthetic build: 4,208 pages in 5.0 s, whole build 9 s, largest process 360 MB, machine peak 6.51 GB; `dist/` 118 MB.
  - Visual check vs `Place.dc.html?id=PH-DOTS-00002&stop=2` at 390/1280 EN and 390 FIL: identical positions and heights.
- 4 Nov 2026: **lead approved step 6.** CSP: `blob:` may join `img-src` only if save-as-image needs it (never `data:`); revoke object URLs at once, keep the PNG in no cache or storage. File name: neutral `tbph-summary.png` (7.3 open item).
- **4 Nov 2026: step 7 (Check) built** on `build/07-check`:
  - `src/content/check.ts` (generated once from the prototype's objects, each string tied to its pack §4 line; [REVIEW] on questions, options, results and notes), `src/lib/check/flow.ts` (sequence, evaluate, notes, optionsFor, pickSingle, toggleMulti, after, before, cardRows), `src/lib/check/image.ts` (canvas card, `tbph-summary.png`, share on touch devices that can, else download; object URL revoked at once; no blob: needed in img-src), `src/lib/format-date.ts` (data-free; `dates.ts` re-exports it), `src/islands/CheckFlow.tsx` (owns `<main>`, always in-place switch), `src/styles/check.css` (print: card only).
  - Pages `src/pages/[check].astro` + `fil/[check].astro`: getStaticPaths returns nothing when `TBPH_CHECK=false` (Q9), so `/check` gets the 404 and check-links fails on any link to it.
  - Parity test lists `src/content` at run time (Vitest's module cache had kept an old `import.meta.glob` list).
  - Tests: unit decision tables (`tests/unit/check.test.ts`); e2e `tests/e2e/check.spec.ts` incl. the §4.5 privacy test, print, PNG download, share (Chromium), in-place switch, sticky Next above the tab bar.
  - Visual check vs `Check.dc.html` (intro, first question, urgent, result A) at 390/1280: identical.
- 4 Nov 2026: **lead approved step 7**; the lead is running an independent read-only check of `flow.ts` routing against pack §4.
- **5 Nov 2026: step 8 (Learn) built** on `build/08-learn`:
  - `src/content/learn.ts` (generated once from the prototype markup, each string tied to its pack §3 line; `*asterisks*` for italics as in the pack; L6 strings flagged REVIEW), `src/lib/learn.ts` (section blocks, claim ids per section, sources), `src/views/Learn.astro` (static), `src/scripts/learn.ts` (scroll-spy, back to top), `src/styles/learn.css`.
  - "By the numbers" from `data/claims.json` at build; 17 "More in the data" links to `/data#claim-…` (pending page). L5 "Check your symptoms" dropped when `TBPH_CHECK=false`.
  - D21: L5 buttons at the global 58/46px (prototype 52px).
  - `.inset-group` moved to `ui.css` (third case of a shared style in a page stylesheet; keep shared rules in ui.css).
  - Visual check vs `Learn.dc.html` at 390/1280 EN and 390 FIL: section positions identical (1280: +6px from L6 on, the D21 buttons); myth rows 1–3px shorter on phones.
- Node 22.23.4 installed through nvm for this folder only and pinned in `.nvmrc` (owner said yes via the Account Admin session, 30 Oct 2026). nvm's default alias (`16`) and the Homebrew/global Node were left unchanged, because the KitaMo builders use them. Don't change them.

## Next
1. **Steps back to back** (lead, 4 Nov 2026): each step on its own branch cut from the previous one, staged by path. At the end of each, send the lead a short report (commits, test results, guard peak line, deviations), then start the next one straight away. The lead messages if something needs fixing.
2. Stop and ask the lead only for: a genuinely open question; anything needing new copy, a new service or a pipeline run; failing tests I can't fix; a big change to the plan.
3. **v7 (V1–V3):** when the lead imports `design/v7/` and messages, read `design/v7/HANDOFF.md` › "v7", then in my own commit update PLAN.md (D2 dark mode, D6 em dashes, D14 dot red `#F26A72`, §7.3 conflicts and 1555, the launch-check list, the QA matrix in light and dark, design/v7 as a reference) and tell the lead if v7 changes anything bigger. Then: drop `theme.css`'s dark values into `tokens.css` (plus a dark `theme-color` meta), apply v7's wording for changed strings (step 2 has: the footer safety line, the Home and 404 titles), point their parity refs at v7, and log them in `docs/copy-overrides.md`. Any other em dash: list for the lead, don't reword.
4. **Step 9 (Data) in progress** on `build/09-data`. Plan, in order:
   - **9b logic done** (`src/content/charts.ts`: 212 strings + 20 titles + 7 templates, 45 tied to pack lines; `src/lib/charts/panels.ts` `buildPanels(d, lang, cw, wide, state, tx)`; `tests/unit/panels.test.ts`). The dictionary param is `tx`, not `t`: the prototype's d10 block has a local `t` that shadowed it. Next: `src/islands/ChartPanel.tsx` (or one Data island) rendering panels as SVG + ARIA tables, re-laid out at the real width (D13), then the page frame (intro, On this page, Methods, TB in numbers), then the dot story.
   - **9a done** (`src/lib/charts/primitives.ts`, `tests/unit/charts.test.ts`). 9b next: scratch transform in the session scratchpad replaced 257 `L('en','fil')` literal pairs in build() with `t[N]`; 7 calls build strings from data (months, d13 caption, d14 sample caption, d16 positivity, d16/d18 'rapid tests in {year}' / 'of babies in {year}', d19 sex split) and need templates. build() also reads state: claims (d16–d20 via `cl(id)`), fac (d14; use `src/generated/region-counts.json`), open (table toggles), pyr (d5 toggle). If the scratchpad is gone, redo the transform from Data.dc.html lines `build(d, lang, cw, wide)`.
   - 9a `src/lib/charts/`: port Data.dc.html's G/ts/rows/hbars/pyramid/monthly/stack/bullets/fstack/tbl as pure TS returning data (rects, paths, circles, texts); unit tests at widths 640/560/420. Labels render as SVG `<text>` (x/y/text-anchor attributes), not the prototype's absolutely positioned HTML spans: their inline styles would be blocked by the CSP in prerendered HTML.
   - 9b panels d1–d20 (`build()`): copy extracted by running the prototype's build() in a vm sandbox for en and fil, then tied to pack §6 lines in `src/content/data.ts` (parity); D5 default (takeaways stay the pack's text). Panels prerendered at a default width, re-laid out in the browser when visible (D13), with "View as table".
   - 9c page frame: intro, "On this page", Methods, "TB in numbers" (44 claims, topic picker, `#claim-{id}` deep links that focus the row), then 9d the dot story canvas (DotStory.dc.html; D14 TB red #C42032).
5. Step 4's owner demo instructions went to the lead (4 Nov 2026).
6. **Before step 12, ask the lead about Q7** (host and domain). Until then the placeholder `https://tb-ph.example` (`astro.config.mjs` `site`), flagged in `launch-check`.
- Checkout: this checkout is mine and I own branch switching. The lead only edits `docs/decisions.md`, reviews with `git show`/`git diff`, and tells me before committing a decision by path on my current branch.
- Git hygiene: stage commits by path (`git add <files>`), never `git add -A` or `git add .`, so the lead's files don't get swept in.

## How to run things
- Every shell: `. ~/.nvm/nvm.sh && nvm use` (reads `.nvmrc`) before any node/npm command. Package manager is npm; leave the Homebrew pnpm alone.
- Fresh checkout: `npm ci` (the bundled npm 10.9.9 is fine for that). **Adding or updating packages: `npx -y npm@11.21.1 install …`** (pinned, so installs repeat exactly), because npm 10's installer crashes on this tree (`reading 'edgesOut'`). Pin exact versions.
- Scripts: `npm run build` (prepare-data + astro build + link crawl), `npm run launch-check`, `npm run build:synthetic` (2,100 fake facilities, for scale only; rebuild normally afterwards), `npm run check` (astro check), `npm test` (Vitest), `npm run test:e2e -- --project=chromium` (Playwright against `dist/`, build first), `npm run serve` (dist/ on http://127.0.0.1:4322).
- Heavy jobs (check, build, tests, Playwright, Lighthouse), one guarded job each, one Playwright project per job: `GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && npm run <script>'`. Keep the guard's `peak … GB` line as evidence for each step.
- View the prototype: `cd design/design_handoff_tb_ph/prototype && python3 -m http.server 8080` (it loads React and fonts from CDNs).

## Contacts
- **Lead: the "TB Health" desktop session** in `~/Documents/tb-health`, at `uds:/tmp/cc-socks/22329.sock` (4 Nov 2026). It leads the project and talks to the owner directly. Send it review results, questions, status, **pushes and owner questions** (from 4 Nov 2026), and take tasks from it. Batch questions into one message.
- **Account Admin:** only for Mac problems (pushes go through the lead from 4 Nov 2026). Its address was `uds:/tmp/cc-socks/19695.sock` on 4 Nov 2026 (`2530.sock` is stale).
- Socket addresses change when a session restarts, so reply to the `from` address of each session's latest message. These sessions don't show in `ListAgents`. Never send TB Health questions to KitaMo sessions.
- The gh account on this Mac has read access only, so pushes stay with the owner.
- This builder is full-time on TB Health (the owner retired its KitaMo session, 4 Nov 2026). The KitaMo rules in `CLAUDE.md` still apply.

## Open questions
- `docs/PLAN.md` §7.1. Q1–Q3 answered (Q2, Q3 on 4 Nov 2026, see `docs/decisions.md`). Open questions go through the TB Health lead, who asks the owner before the steps that need them:
  - Answered 4 Nov 2026: Q4, Q5, Q6, Q9, Q10, Q13, and V1–V5 (v7). See `docs/decisions.md`.
  - Open: Q7 host/domain (ask the lead before step 12), Q8 full facility list, Q11 WHO 2026 refresh, Q12 lapsed accreditations (D24 applies), the owner's Filipino descriptions (Q3) and About privacy rows (Q5).
  - Asked the lead (step 2 report): with `TBPH_CHECK=false`, should the /check page itself and in-content links to it (the 404's "Check symptoms" button, later Learn/Home) also go? The decision lists only nav, tab bar, shortcuts and sitemap, so they stay for now.
- The owner supplies the Filipino descriptions for About, Data, Install, Learn and Place later (Q3). They are `owner` strings, blocking in `launch-check`; I write none.
