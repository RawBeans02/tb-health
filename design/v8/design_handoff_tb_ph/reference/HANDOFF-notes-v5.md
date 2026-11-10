# TB PH — handoff notes (v2: TB care route planner)

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
