# Prompt for Claude Design — "TB PH" (v2: Sakay.ph-style TB care route planner)

**How to use:** In Claude Design (claude.ai/design), start a new project and attach the three files below. Then paste everything under the line as your first message. If an attachment type isn't accepted, paste the content file's text instead.

Attach:
- `tb-ph-content-and-data.md` — all copy (English and Filipino), the route planner, screening logic and data tables
- `data/tb-dots-facilities-SAMPLE.json` — 93 real TB-DOTS clinics, with service fields and approximate design coordinates
- `data/tb-ph-data.json` — chart data for the Data page

---

Design a bilingual (English/Filipino) website that works like **Sakay.ph, but for TB care**. Sakay.ph tells Filipinos how to get from where they are to where they're going. This site tells them where to get the three things TB care needs, and how to get there:

1. **Chest X-ray**
2. **TB test** (sputum)
3. **Free TB medicines**

It's a utility first. Someone with a long cough, or a family member helping them, should go from opening the site to "I know where to go and how to get there" in under a minute, on a cheap phone with slow mobile data.

**Who we are.** We're a research and data science group working with partner hospitals that treat TB. Audiences, in priority order:
- people with symptoms and their families
- barangay health workers guiding patients
- the general public
- students and researchers (served by the Data page)

**The files are the source of truth.** Use the copy exactly as written in English and Filipino; it's all in the content file (planner: Section 2; screening: Section 4; places list: Section 5; charts: Section 6). Never invent statistics, distances, hours or services. If a field is empty or "unknown," the interface says "Call to confirm." The sample coordinates are approximate city centres for prototyping (`geo_precision: approx_city_design_only`), so distances shown from them must read as approximate ("about 3 km").

**Name.** "TB PH" is a placeholder wordmark; make it easy to swap.

## Information architecture
1. **Home = the route planner** (Section 2):
   - A "From" field ("Where are you?") with a "Use my location" button.
   - "I need" choices: The whole route (default), Chest X-ray, TB test, Free TB medicines, and "Not sure yet? Check my symptoms."
   - A primary button: "Show me where to go."
   - Below the panel: three reassurance lines and a one-line data teaser.
2. **Route results:**
   - A vertical route line with three stops (X-ray, then test, then medicines), like transit legs.
   - Each stop shows a short explanation and the 3 nearest places that offer that service, plus "See more places."
   - A route summary line at the top, and "What to bring" at the end.
3. **Place card and place page** (`/place/{id}`, shareable):
   - Name in title case, government/private badge, distance, service chips ("Offers this" / "Call to confirm" / "Collects your sample or refers you"), hours, phone.
   - Actions: Commute directions, Walk / Drive, Copy address for Sakay.ph, Call before you go.
4. **Places list** (Section 5):
   - Search, plus filters by service, region, province or city, and government/private.
   - Sort by distance when a location is set.
   - An optional map view, list-first.
5. **Check symptoms** (Section 4):
   - The guided screening flow, unchanged.
   - Results A, B and C hand off to the planner with "the whole route" preselected.
6. **Learn**: one readable article with ten short sections and a myths-and-facts table (Section 3).
7. **The data**: the scroll story with the 724-dot field (Section 2B), then the 15 charts (Section 6).
8. **About** (Section 8).

Keep a persistent bottom navigation on mobile with Find care, Check symptoms, Learn and Data, and a language toggle in the header. The language toggle keeps the reader in place, is remembered on the device, and sets `lang` to `en` or `fil`. Filipino runs about 20–30% longer, so nothing should truncate.

## Planner behavior
- **Distance:** use the haversine distance from the user's point (GPS, or the centre of the barangay or city they typed) to each facility's `lat`/`lng`. With no location, sort by matching city, then province.
- **Typed locations:** match against a small bundled list of cities, municipalities and their centres (for the prototype, build it from the sample's city coordinates). If no match, fall back to a text search on facility city and province. No external geocoding calls from the browser.
- **Services:**
  - Medicines: `svc_free_tb_medicines`.
  - Test: `svc_tb_test` (`onsite_or_referral` shows "Collects your sample or refers you").
  - X-ray: `svc_chest_xray`. `unknown` shows "Call to confirm" and never counts as "Offers this."
  - If no place nearby has a confirmed X-ray, show the empty-state copy that sends people to their nearest TB-DOTS center for a referral.
- **Directions links** (exact formats in Section 2.3):
  - Commute: Google Maps transit directions.
  - Walk and drive: the same link with the other travel modes.
  - Sakay.ph: copy the address, then open sakay.ph.
  - Call: a `tel:` link to the first number listed.
- **Privacy:** location stays on the device and is never stored or sent. Directions links only carry the destination.
- **Shareable state:** the route URL can include the chosen need and a city name, but never GPS coordinates.

## Visual direction
Think of a transit app's clarity with the warmth of a community health worker, not a hospital portal or a SaaS dashboard. Keep the agreed palette and type, re-weighted for a utility:
- Paper `#F2F0EA` — background
- Ink `#14212B` — text, and the route line's base
- Teal `#1E6B70` — the route, stops, "Offers this," and primary buttons (care = teal)
- Coral `#E2553B` — only for "you are here," urgent states and the illness data on the Data page
- Rule `#D9D5CB` and Muted `#5E6A70` — dividers and secondary text, checked for AA contrast
- Type:
  - Atkinson Hyperlegible (or Atkinson Hyperlegible Next) for the whole planner, screening and all interface text, because it's built for legibility. Body text at least 18px on mobile, with tabular figures for distances and phone numbers.
  - Newsreader only for the Learn article, the Data story headlines and page titles.

**Signature element: the route line.** A thick teal vertical line with three stops (X-ray, test, medicines) carries the whole experience, like a jeepney route on a transit map. It appears on Home, in the results, and as a compact progress strip on place pages ("You're at stop 2 of 3"). Spend the boldness there and keep everything else plain.

On the Data page, the 724-dot field (1 dot = 1,000 people) stays as that page's opening story.

Avoid:
- All-caps eyebrow labels
- Highlighting a single word in a headline
- Numbered markers on things that aren't sequences. The route stops, the screening steps and the testing steps are real sequences.
- Identical shadowed cards (place cards are list rows with dividers, not floating tiles)
- Gradient washes
- Animating every section
- Arrows appended to button text
- Monospace labels

Use one meaningful motion only: the route line drawing in when results load. Respect `prefers-reduced-motion`. No photos of patients.

**Map:** list-first, because it's lighter on data. An optional "Map" toggle can show stops on a lightweight map (for example Leaflet with OpenStreetMap tiles, with attribution), loaded only when opened. In the prototype, a styled placeholder map is fine.

## Screening, Learn, Data, About
- **Screening:** implement Section 4 exactly — one question per screen, a step counter, Back, the URGENT result with `tel:911`, a summary card you can save or print, and nothing stored or sent.
- **Data page:** charts as lightweight SVG with exact values from `tb-ph-data.json`. Each chart gets a title, a takeaway, uncertainty bands where given, a source and "as of" line, and a "View as table" toggle. Mark provisional months. Don't rely on color alone.
- **About:** mission, partner-logo placeholders, medical review, disclaimer, privacy (including the location note), data updates and helpful numbers.

## Technical constraints
- Static and frontend-only: no accounts, no backend, no submitted forms. Facility and chart data come from bundled JSON, and the full `tb-dots-facilities.json` replaces the sample later with the same fields.
- Mobile-first and fast on 3G. The facility file is lazy-loaded, map tiles load only on request, and fonts have system fallbacks.
- WCAG 2.2 AA: keyboard support, visible focus, labelled inputs, focus moved to results after search, and sufficient contrast.
- `tel:`, Maps and Sakay links work on Android and iOS.
- Footer on every page: the safety line, "Emergency? Call 911," and the data credit.

## How to work
1. Propose the system first: tokens, type scale, the route line and stop components, the place row, service chips and buttons.
2. Build Home and the route results with the sample data, including these states:
   - no location yet
   - location set
   - "Call to confirm" X-ray
   - nothing within 10 km
3. Then build the place page, the places list with an optional map, Check symptoms, Learn, Data and About.
4. Review accessibility, Filipino text overflow, and every number against the JSON. Keep the result exportable as standalone HTML and ready to hand off to Claude Code.
