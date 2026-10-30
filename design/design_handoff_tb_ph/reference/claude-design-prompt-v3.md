# Prompt for Claude Design — TB PH v3 (v4 look everywhere, phone app, more data)

**How to use:** In the same Claude Design project, upload `TB-PH-build-v5.zip` and tell Claude Design to use it as the source of truth. Also make sure `apple-design-skill-main.zip` and `ultimate_build_source_of_truth.md` are in the project. Then paste everything under the line.

---

Continue the TB PH build. **Home is approved.** This round brings every other page up to Home's look, makes the site feel like a real phone app, and adds more data and sourced claims. Work from the uploaded `TB-PH-build-v5.zip`. It already contains the phone-app layer, the new data and the claims registry, so don't rebuild those.

## Sources of truth, in this order
1. **The approved Home:** `Home.dc.html` and `SiteHeader.dc.html` (header and phone tab bar). This is the v4 look.
   - Do not change Home's layout, copy, styles or behavior.
   - Its `<head>` now carries app tags. Keep them.
2. **`design_handoff_tb_ph/README.md`:**
   - the v4 tokens and components
   - the "Migrating the other pages to v4" table
   - page specs, planner logic and accessibility requirements
3. **The Apple design skill** (`apple-design-skill-main`). Run its five lenses on every page:
   - accessibility
   - platform conventions
   - visual craft
   - interaction
   - writing

   Load its always-load set plus `tab-bars`, `buttons`, `lists-and-tables`, `search-fields`, `sheets`, `charts`, `charting-data`, `loading`, `feedback`, `writing`, `app-icons` and `launching`. Cite `file › heading` for the decisions you make.
4. **`ultimate_build_source_of_truth.md`:** the release gates. These cover the web quality metrics, the Lighthouse gate, accessibility, privacy and the 20 "vibe-coded" tells. Finish with an audit record in its format.
5. **Data:**
   - `data/tb-ph-data.json`, including the new sections `diagnostics_network`, `financing`, `bcg_coverage` and `sdg_context`
   - `data/claims.json`, which holds 44 claims in English and Filipino, each with a source

   Never invent, re-round or restate a number differently. Every claim on screen shows its source link.

## Already done in this zip (keep it working)
- **Phone app:** `manifest.webmanifest`, `sw.js`, `pwa.js`, `icons/`, `index.html`, `Install.dc.html`, a footer link "Install the app", and app tags in the `<head>` of every top-level page.
  - It is installable and has long-press shortcuts.
  - Every page opens offline after one online visit.
  - Map tiles are never cached.
- **Data:** the new sections and the claims registry, both built by scripts in `design_handoff_tb_ph/pipeline/`.
- **Share image:** `icons/og-image.png` (1200×630).

## Job 1 — Bring every other page to the approved look
**Global rules**, taken from the README migration table and Home:
- **Background:** Canvas `#F1F3F4`.
- **Surfaces:** content sits on white grouped surfaces (radius 18) with inset `#E3E6E8` separators. No shadows and no glass on content.
- **Inputs:** white, 1.5px `#7A858C` border, radius 16, 58px tall.
- **Buttons:** capsules (999px). Use **one solid teal button per screen**. Repeated row actions are soft teal capsules (13% tint), and "Call before you go" stays a text link.
- **Chips:** radius 8, keeping the service-status chip rules (fill, outline, dashed and text).
- **Type:**
  - Headings are Atkinson Hyperlegible Next 700: H1 at -0.02em in TB red, H2 at -0.01em.
  - Long reading text on Learn, Data and About moves to Atkinson too, 18–19px with a 34em measure. This settles the README's open question, for legibility and consistency with Home.
  - Newsreader stays only in the wordmark.
- **Text on teal or ink:** `#FFFFFF`.
- **Avoid:** eyebrow labels, decorative numbering, rows of check icons, pills, glass on content, gradients, fade-in on every section, and big-number-over-label tiles outside the dot story. Also avoid em dashes in new copy, which is SOT tell 16.

**Per page:**
- **SiteFooter:**
  - Restyle to v4: Atkinson safety note at 19px, the same segmented language toggle as the header, and `#E3E6E8` separators.
  - Keep "Install the app" and hide it when `html[data-standalone="true"]`.
  - Change "Last updated" to 30 October 2026.
- **Places:**
  - On phone: a search field identical to Home's, plus the "Use my location" capsule.
  - Service filter: a segmented control (All / Chest X-ray / TB test / Free medicines). Not pills.
  - Region, Province or city, and Type move into a **Filters sheet**: a bottom sheet with a grabber and a Done button on phone, and the left panel at 1080px and wider.
  - Results: one grouped list using Home's facility rows exactly. List / Map is a segmented control.
  - States: loading, error, empty and "no confirmed X-ray", all in v4.
  - Offline status line when `html[data-online="false"]`:
    - EN: "You're offline. Showing the saved list of centers."
    - FIL: "Wala kang koneksiyon. Ipinapakita ang naka-save na listahan ng mga center."
- **Place:**
  - An iOS-style detail page:
    - H1: the facility name.
    - Below it: distance, the sector badge and the address.
    - Actions: "Commute directions" is the one solid teal button; Walk, Drive and "Copy address for Sakay.ph" are soft capsules; "Call before you go" is a text link.
  - Grouped sections: "Services" (status chips) and "Details" (Hours, Phone, Region, Accreditation until).
  - "You're at stop n of 3" uses the route-line motif: a short teal line with three small stop discs.
  - At the bottom, only when not installed, add a quiet row that opens the Install page:
    - EN: "Save TB PH to your home screen for next time."
    - FIL: "I-save ang TB PH sa home screen mo para sa susunod."
- **Check:**
  - Each question is an H1 plus a grouped option list identical to Home's "I need" rows (56–60px rows, inset separators, teal ✓ on selected).
  - Progress is a short segmented route line plus "Step n of N".
  - Back is a text link at the top left. Next is the one primary capsule, pinned above the phone tab bar (respect `env(safe-area-inset-bottom)`).
  - Results use the same grouped style.
  - The urgent screen keeps its dark Film band and Call 911.
  - The patient-card summary stays the one bordered card.
  - Keep the [REVIEW] flags.
- **Learn:**
  - Atkinson throughout.
  - On phone, contents is a collapsible grouped list. At 1080px and wider, it's a sticky sidebar with scroll-spy.
  - Myths and facts: myth/fact pairs as grouped rows on phone, a table on desktop.
  - Add the "By the numbers" blocks (Job 3) and a "Back to top" text link at the end of each section. The page is long, so the SOT's "when applicable" applies.
- **Data:**
  - Keep the dot story; it's the signature here. Restyle its text beats to v4 type.
  - Every chart sits on a white panel (radius 18, no shadow) with title, takeaway, chart, caption, source, and a soft "View as table" capsule.
  - Colors: illness in TB red, care in teal, context in grey, gridlines `#E3E6E8`, baseline Ink. Provisional data stays hatched and labelled.
  - On phone, "On this page" is a grouped jump list. Add "Back to top". The page is about 19,600px tall on a phone.
- **About:**
  - Grouped sections.
  - Replace the hatched partner placeholders with a grouped list: "Partner hospitals (names and logos to come)".
  - **Fix the bug:** in "Helpful numbers", `{{ n.who }}` and `{{ n.note }}` never resolve, so every row must show who, number and note.
  - Add a "Use TB PH like an app" section linking to the Install page.
  - In Privacy, add that the app saves its pages and data on the phone so it works offline, that there is no tracking, and that Google Fonts, map tiles (only if the map is opened) and Google Maps links are third parties.
- **404:** v4. H1 in Atkinson TB red. Two capsules: solid "Find TB care" and soft "Check symptoms".
- **Install:** already v4. Only follow any global tweaks.

## Job 2 — Make it feel like a phone app
- Keep every phone-app file and `<head>` tag. If your export rewrites `<head>`, also put the same tags in each page's `<helmet>`.
- **Installed mode:** `pwa.js` sets `html[data-standalone]`, `data-platform`, `data-online` and `data-installable`, and fires the events `tbph:installable`, `tbph:installed`, `tbph:offline` and `tbph:online`. Use these attributes, not your own detection.
  - When installed, hide every install link and row.
  - In installed mode there's no browser back button, so check that every inner page has an in-app way back. Places, Place and Check already do.
- **Install entry points:**
  - the footer link
  - the About section
  - the Place-page row, shown after someone has found a place
  - optionally a row on Check results A to C

  Never show a modal or banner on launch, and don't touch Home. To offer one-tap install, call `window.TBPH_PWA.promptInstall()`. `pwa.js` already holds back Chrome's automatic banner.
- **Offline:** offline status lines on Places and Place only. Directions and Call stay visible, since they hand off to other apps.
- **App icon and shortcuts:** keep the concept, a winding route from a red "you are here" dot to a stop. You may refine the art, but keep it opaque, centered and free of text.
- **Weight:** don't add libraries. Charts stay hand-built SVG. The prototype already downloads about 3.1 MB of Babel on a first visit; the production build via Claude Code handoff will remove that.

## Job 3 — More data and more claims
**New Data sections**, after d15. Each gets a title, takeaway, source line and table toggle. Use the claim text from `claims.json` as each takeaway (`en` / `fil`).
- **d16 "Testing has scaled up" / "Lumawak ang pagsusuri":**
  - Bars for `diagnostics_network.series` `rapid_molecular_test_sites`, 2020 to 2024 (519 to 992).
  - A line for `rapid_tests_performed`, 2021 to 2024.
  - The positivity rate (20.7%) as a sentence.
  - Claims `test-sites` and `test-volume`. Source S1.
- **d17 "Who pays for TB care" / "Sino ang nagbabayad para sa gamutan sa TB":**
  - Stacked bars of `financing.series` `received_*` by source (government, Global Fund, USAID), 2019 to 2024.
  - 2025 from `available_*`, hatched and labelled "expected".
  - Under the chart, show `financing.caveat_2025` (plain-language version: claim `fund-cuts`).
  - Neutral wording, no commentary.
  - Claims `fund-2024`, `fund-2025`, `fund-cuts` and `fund-budget`. Sources S1, S28, S29, S12.
- **d18 "Protecting babies with BCG" / "Proteksiyon ng mga sanggol gamit ang BCG":**
  - A line for `bcg_coverage.series`, 2015 to 2024, with the 2021 dip labelled.
  - Claim `prev-bcg`.
- **d19 "The conditions TB feeds on" / "Ang mga kalagayang nagpapalala sa TB":**
  - A grouped list (not tiles) of six rows from `sdg_context.indicators`: urban slums, smoking (with the men/women split), adult undernutrition, diabetes, alcohol use disorders, and the UHC index.
  - Each row shows its year and source.
  - Claims `drivers-*`.
- **d20 "Regional snapshots" / "Mga sulyap mula sa mga rehiyon":**
  - The claims with topic `regional`, as a grouped list with the period and source on every row.
  - Caption:
    - EN: "These come from different years and sources, so they can't be compared with each other."
    - FIL: "Galing ang mga ito sa iba't ibang taon at pinagmulan, kaya hindi sila maihahambing sa isa't isa."
  - Link to d13 (2016 survey).
- **"TB in numbers" / "Ang TB sa mga numero" (end of the Data page):**
  - Every claim in `claims.json`, grouped by topic, with a topic selector (a segmented control on wide screens, a select on phone).
  - Each claim shows its text, its `kind` label (for example "WHO estimate"), and source links.
  - Give each claim an anchor `#claim-{id}` so Learn can link to it.

**"By the numbers" blocks on Learn:** 1–3 claims per section as a small grouped list, each with its source link and a "More in the data" link to `Data.dc.html#claim-{id}`. Mapping:

| Learn section | Claim ids |
|---|---|
| L1 What is TB? | `burden-cases`, `burden-deaths` |
| L3 Signs and symptoms | `gap-missed` |
| L4 Who's at higher risk | `drivers-attributable`, `who-men`, `who-children` |
| L5 Getting tested | `test-sites`, `test-couriers`, `test-xray-yakap` |
| L6 Treatment | `tx-success`, `tx-ltfu`, `tx-free` |
| L7 Drug-resistant TB | `tx-dr`, `tx-dr-success` |
| L8 Preventing TB | `prev-tpt`, `prev-bcg` |
| L9 Living with TB | `cost-catastrophic` |

**Claim rules:**
- Show the source link with every claim.
- Show `kind` for estimates and provisional numbers.
- Regional claims always show their period.
- Never edit numbers in copy. If the wording must change, change the generator (`pipeline/build_claims.py`) and re-run it.

## Job 4 — Quality gates (finish with evidence)
- **Apple skill review:** run a short review per page (Summary plus any Critical or High findings), fix them, and report the final rating per page. The target is "Good" or better everywhere.
- **Accessibility, WCAG 2.2 AA:**
  - contrast figures for any new color pair
  - targets of 44px or more
  - logical focus order and focus moved on step changes
  - labels on every control
  - reduced motion and reduced transparency respected
  - Filipino text never truncated at 320px
- **Responsive:** no horizontal scroll at 320, 390, 768 and 1280px (the current build passes at 320 and 390), and the tab bar never covers content or the last control.
- **Phone app:**
  - Still installable.
  - All pages open offline after one visit.
  - Check installed mode on a real iPhone (Safari → Add to Home Screen) and a real Android phone (Chrome → Install).
- **SOT web checklist:**
  - skip link
  - loading, empty and error states
  - real 404
  - print (Check summary)
  - copy feedback
  - last-updated date
  - title and description per page
  - one H1 per page
  - canonical and `og:image` tags using the production domain once known (the image exists)
- **Generic-look check:** go through the SOT's list of 20 tells and report any that remain, and why.
- **Data trace:** every number on screen maps to a JSON key or a claim id.
- **Deliver:**
  - the updated files
  - the README "Fidelity" table with every page marked final v4
  - updated HANDOFF notes
  - the SOT audit record

## Don't
- Change Home in any way.
- Add colors outside the token set, put glass on content, or build big-number tiles outside the dot story.
- Invent data, or editorialize about funding.
- Remove the service worker, the manifest or the app tags, or cache map tiles.
