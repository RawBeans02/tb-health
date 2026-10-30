# TB PH — handoff notes (v6: every page on v4, phone app, more data)

Static, frontend-only. One file per page; shared chrome is two child components. v1 (story-first home) is archived in `v1/`.

## Files
| Route | File |
|---|---|
| `/` | `Home.dc.html` — route planner and results (Tweaks: `demo` = live / empty / located / far) |
| `/place/{id}` | `Place.dc.html?id=…` — shareable place page; `stop`, `need`, `near`, `loc=gps` are optional context |
| `/places` | `Places.dc.html` — full list, filters, sort by distance, optional map (Leaflet + OSM, loaded only when opened) |
| `/check` | `Check.dc.html` — screening flow; results A, B and C link to `Home.dc.html?need=all` |
| `/learn` | `Learn.dc.html` |
| `/data` | `Data.dc.html` — dot story on top (`DotStory.dc.html`), then 15 charts |
| `/about` | `About.dc.html` — includes location note and accessibility statement |
| 404 | `404.dc.html` |
| shared | `SiteHeader.dc.html` (desktop nav, mobile bottom nav, language toggle), `SiteFooter.dc.html`, `tbph-core.js` |
| spec | `Design System.dc.html` — v3 palette (TB red + teal), glass bars, route line, stops, chips, button hierarchy |
| SEO | `robots.txt`, `sitemap.xml` (placeholder domain `tbph.example.org`) |

## Planner logic (`tbph-core.js`)
- Facilities: tries `data/tb-dots-facilities.json`, falls back to the SAMPLE (a 404 for the full file is expected until it exists).
- Typed places match a gazetteer built from facility city coordinates (cities plus province averages). No geocoding calls from the browser.
- Distance: haversine. Shown as "about n km" unless both the facility (`geo_precision` address/confirmed) and the user (GPS) are precise.
- Services: X-ray counts only when `svc_chest_xray = yes`; test counts `yes` or `onsite_or_referral`; medicines `yes`. Unknown shows "Call to confirm".
- Per stop: 3 nearest offering the service. None within 10 km shows the "Nothing within 10 km" copy and the nearest in the province (from the typed place, or the nearest facility for GPS). No confirmed X-ray within 10 km shows the referral copy and the nearest TB-DOTS centers with their X-ray status.
- Directions use coordinates only when they are precise; with sample (approximate) coordinates they use name + address, so nobody is routed to a city centre.
- Privacy: GPS never enters the URL or storage. URLs carry `need`, `near` (typed text) or `loc=gps` (a flag; the next page asks the browser again).
- Sakay.ph: copies name + address, then opens sakay.ph. [VERIFY] direct destination links.

## New strings not in the content pack (need EN/FIL review)
Planner/place: My location / Ang aking lokasyon; See more places / Tingnan ang iba pang lugar; Back to your route / Bumalik sa iyong daan; You're at stop n of 3 / Hintuan n sa 3; What to bring heading (FIL: Ano ang dadalhin); Copied. Paste it into Sakay.ph. / Nakopya na. I-paste ito sa Sakay.ph.; Services / Mga serbisyo; Hours / Oras; Phone / Telepono; This place isn't on the list.; the sample-pin note.
Places: Service / Serbisyo; List / Listahan; Map / Mapa; map loading/error lines; "Find TB care near you" used as page title.
About: Accessibility statement (EN + FIL) [REVIEW]; footer link "Accessibility".
404 page copy. Earlier v1 strings (step counter, buttons, chart labels) still apply.

## SOT audit (Ultimate Build Source of Truth), summary
- Decision friction: one solid teal primary action per screen; the repeated row action is outlined teal and "Call before you go" is a text link; Walk/Drive and Sakay live on the place page. ✅
- Familiar patterns: 4-tab bottom nav, Home far left. ✅
- Generic-look check (v3): palette back to the brief plus World TB Day red; removed the sun/butter/mint/deep-teal panels, the check-icon row, pills and the dark hero. Glass only on the header and tab bar, with an opaque fallback (no backdrop-filter, Reduce Transparency, Increase Contrast). ✅
- Empty states: no location, permission denied, no match, nothing within 10 km, no confirmed X-ray, list empty (with Clear filters). ✅
- Loading/error states for facility and map loads, with retry. ✅
- Skip link, focus moved to results, labelled inputs, keyboard radios, visible focus (3px ink ring). ✅ Runtime screen-reader pass 🔍
- Permission timing: location is requested only on "Use my location", after the note explains why. ✅
- Real 404 ✅; print stylesheet (screening summary) ✅; copy feedback ✅; last-updated date in footer ✅.
- SEO: titles/descriptions per page ✅; one H1 per page ✅; robots/sitemap 🟡 (placeholder domain); canonical + og:image ❌ (need production URLs and an image).
- Accessibility statement ✅ (needs contact email).
- Performance: facility file and map load lazily; fonts have fallbacks. Lighthouse on the deployed build 🔍. Consider self-hosting fonts (privacy + speed).
- Privacy text: mention Google Fonts, map tiles and Google Maps links if kept 🟡.
- Cookie banner ⭕ (only a language preference is stored); analytics ⭕; payments/accounts ⭕.

## Open items
Clinical review of `/check` and Learn L6; DOH hotline [VERIFY]; YAKAP X-ray list; DOH-NTP lab list; geocoding (`geocode_facilities.py`); partner logos; group name and email; full facility list; production domain for sitemap/canonical.

## Standalone export
Pages fetch JSON and load `tbph-core.js` at runtime. For a single offline file, inline the JSON and the script.

## v5 (30 Oct 2026): phone app, more data, sourced claims
Home is approved; its visuals are unchanged (only app tags were added to its `<head>`).

**Phone app (PWA)**
- New files: `manifest.webmanifest`, `sw.js`, `pwa.js`, `icons/` (app icon, maskable, apple-touch-icon, favicons, 4 shortcut icons, `og-image.png`), `index.html` (redirects to Home), `Install.dc.html` (v4, EN/FIL).
- App tags (manifest, theme color, iOS home-screen tags, icons, `pwa.js`) added to the `<head>` of Home, Places, Place, Check, Learn, Data, About, 404 and Install. Footer: new link "Install the app" / "I-install ang app".
- `pwa.js`: registers the service worker; holds back Chrome's automatic banner; exposes `window.TBPH_PWA` (`canInstall()`, `promptInstall()`, `isStandalone()`, `platform()`); sets `html[data-standalone|data-platform|data-online|data-installable]`; fires `tbph:installable`, `tbph:installed`, `tbph:online`, `tbph:offline`.
- `sw.js`: precaches all pages, child components, runtime, data and icons, plus the three pinned CDN files `support.js` loads (React 18.3.1, ReactDOM 18.3.1, Babel 7.29.0). Pages: network-first (4 s), then cache, then a bilingual offline page. Data and assets: stale-while-revalidate. Map tiles, Google Maps and sakay.ph: never cached. **Bump `VERSION` on every release**; update `CDN_PRECACHE` if `support.js` changes versions.
- Manifest shortcuts (long-press the icon): Find TB care, Check symptoms, Learn about TB, The data. `start_url` and shortcut URLs use `.dc.html` paths; rewrite them to production routes when porting.
- Tested in headless Chromium: manifest has no errors; the only installability error was the test browser's incognito mode; after one online visit Home, Check, Learn, Data, Places, About and Install all open offline; no page scrolls sideways at 320 px or 390 px. Not yet tested: real iPhone/Android installs, and CDN caching on a real host (the sandbox can't reach unpkg; verified with identical local copies).
- Weight: the prototype runtime downloads Babel standalone (~3.1 MB) on a first visit; repeat visits come from the cache. A production build (Claude Code handoff) removes in-browser Babel.

**More data and claims**
- `data/tb-ph-data.json` new sections: `diagnostics_network` (testing sites, rapid-test sites and volumes 2019–2024), `financing` (budget, expected and received funding by source 2019–2025, with `caveat_2025`), `bcg_coverage` (2010–2024), `sdg_context` (slums, smoking by sex, undernutrition, diabetes, alcohol, HIV, UHC index, health spending, social protection, clean fuels, poverty).
- `data/claims.json`: 44 claims in EN and FIL across 11 topics, each with source ids (`sources` map with URLs), `kind`, `data_key` and suggested pages. Numbers are generated from the data file.
- Rebuild order: `pipeline/build_tb_ph_data.py` → `pipeline/build_tb_ph_data_extras.py` → `pipeline/build_claims.py`.

**Known issue for the next round:** About › Helpful numbers renders `{{ n.who }}` and `{{ n.note }}` empty. The v3 prompt (`reference/claude-design-prompt-v3.md`) covers this, the v4 migration of the other pages, and where the new data and claims go.

## v6 (30 Oct 2026): every page on v4, sourced claims on Learn and Data
Home and SiteHeader are unchanged. Every other page now uses the approved v4 look (Canvas `#F1F3F4`, white groups, capsules, segmented controls, Atkinson only; Newsreader only in the wordmark). Specs: `design_handoff_tb_ph/README.md`; evidence: `design_handoff_tb_ph/reference/AUDIT-v6.md`.

**Pages**
- SiteFooter: v4, same language toggle as the header, "Install the app" hidden when installed, "Last updated 30 October 2026".
- Places: Home's location field, Service segmented control, Filters sheet on phones (grabber, Done, swipe/Escape/scrim to close, focus trap) and a left panel at 1080 px and wider, one grouped list of Home's facility rows, List/Map segmented, sort switch, offline line.
- Place: one solid "Commute directions"; Walk, Drive, Sakay copy as soft capsules; Services and Details groups (adds "Accreditation until"); stop indicator drawn as a short route line; offline line; install row when not installed.
- Check: grouped option rows like Home's "I need"; segmented route-line progress + "Step n of N"; Back top left; Next pinned above the tab bar; urgent screen on Film with a white "Call 911" capsule; patient card kept; install row on results A–C. [REVIEW] flags kept.
- Learn: Atkinson 18 px; collapsible contents on phones, sticky sidebar with scroll-spy at 1080 px; "By the numbers" (claims with sources, links to `Data.dc.html#claim-{id}`) and "Back to top" in every section; myths table on wide screens, rows on phones.
- Data: dot story kept (text in v4 type); every chart on a white panel with takeaway, caption, source and a soft "View as table"; stats as rows (no tiles); jump list; "Back to top"; new d16–d20; "TB in numbers" (44 claims by topic, anchors `#claim-{id}`).
- About: grouped sections; partners row; Helpful numbers fixed (who, number, note on every row); "Use TB PH like an app"; Privacy covers offline storage, no tracking and the three outside services.
- 404: v4 with a solid and a soft capsule.

**Bugs fixed**
- About › Helpful numbers, Data › "View as table" and Learn › myths used `<table>` with repeat blocks inside `<tbody>`/`<tr>`; the HTML parser moves those blocks out of the table, so cells rendered empty. All three are ARIA tables built from rows now. Avoid that pattern in the prototype format.
- Data at 320 px scrolled sideways (16–19 px) because of two chart labels; legends now wrap and target labels stay inside the chart.

**Phone app**
- Kept every file and `<head>` tag. Pages read `html[data-standalone]` and `html[data-online]` (set by `pwa.js`) through a MutationObserver; no separate detection. Install entry points: footer link, About section, Place row, Check results A–C. No launch modal or banner. `sw.js` VERSION is now `tbph-2026-10-30c`.

**Shared logic**
- `tbph-core.js › prep()` returns `accr` (accreditation expiry). Chip colours are unchanged in the core so Home stays identical; other pages render the "Offers this" chip text in white.

**QA (Chromium preview, `prototype/qa-harness.html`)**
- 45 loads (9 pages × 320/390/768/1280 px EN + 320 px FIL): 0 px sideways scroll, 0 unresolved template text, one H1 per page, no visible control under 44 px, no text under 14 px in main. Check and the Filters sheet move focus correctly. Data renders d16–d20, 44 claim anchors and full tables.
- Not yet: VoiceOver/TalkBack and keyboard passes by hand, real-device installs, Lighthouse on a production build.

**Open items**: type scale consolidation; dark mode; clinical review (Check, Learn L6); consider Ink question titles on Check; d1–d15 takeaways from `claims.json` in production; em dashes in existing content-pack copy; production domain (canonical, og:image, sitemap); placeholders (group name, email, partners, reviewer); DOH hotline [VERIFY].
