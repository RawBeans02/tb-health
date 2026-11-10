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
