# TB PH v6 audit (30 October 2026)

Scope: every page except Home moved to the approved v4 look; phone-app layer kept; Data gained d16–d20 and "TB in numbers"; Learn gained "By the numbers". Home and SiteHeader were not changed.

## 1. Apple design review (apple-design skill, five lenses)

Files opened: `accessibility.md`, `layout.md`, `typography.md`, `color.md`, `designing-for-ios.md`, `tab-bars.md`, `buttons.md`, `lists-and-tables.md`, `search-fields.md`, `sheets.md`, `charts.md`, `charting-data.md`, `loading.md`, `feedback.md`, `writing.md`, `app-icons.md`, `launching.md`, `materials.md`, plus `cross-platform.md` (web app, so platform conventions apply as principles). Ratings are after the v6 fixes.

### Shared chrome (header, tab bar, footer): Good
Thesis: quiet navigation that never competes with the route line. Glass stays on the floating bars only (`materials.md › Liquid Glass`: "Don't use Liquid Glass in the content layer."). The four tabs stay visible on every page (`tab-bars.md › Best practices`: "Make sure the tab bar is visible when people navigate to different sections of your app."). Footer now matches the header toggle and hides "Install the app" when installed.
- Medium: About lives only in the desktop nav and footer, not in the tab bar. Accepted: four tabs keep labels readable at 320 px.

### Places: Good
Thesis: one list of centers you can narrow without leaving it.
- Fixed (High): five stacked filter controls competed with the results. Region, Province or city, Type and name search now sit in a Filters sheet on phones and a left panel at 1080 px and wider (`layout.md › Visual hierarchy`: "Group related items to clearly express related information or functions."). The sheet has a grabber, a trailing Done, swipe-to-dismiss, Escape and scrim tap (`sheets.md › Mobile`: "Include a grabber in a resizable sheet." / "Support swiping to dismiss a sheet."; `sheets.md › Best practices`: "Provide an alternative to the Done button.").
- Fixed (High): pill toggles for Service and List/Map read as buttons with no shared state. Both are segmented controls now (`buttons.md › Style`: "Use style, not size, to visually distinguish the preferred choice among multiple options.").
- Medium: two text fields (location and name search). Mitigated by labels and by moving name search into Filters; the location field stays first because it drives distance (`search-fields.md › Best practices`: "Use placeholder text to help people know what they can search for.").
- Medium: the map works best with a pointer. The same places are always in the list (stated in the accessibility statement).

### Place: Excellent
Thesis: one place, one primary action. "Commute directions" is the only solid button (`buttons.md › Style`: "use a button that has a prominent visual style for the most likely action in a view"). Services and Details are grouped lists (`lists-and-tables.md › Style`). The stop indicator reuses the route line, which ties the page to Home. Offline status lives in the page, not an alert (`feedback.md › Best practices`: "Consider integrating status feedback into your interface.").

### Check: Good
Thesis: one question at a time, answered with one thumb.
- Fixed (High): Next sat below long option lists and under the tab bar on phones. It is pinned above the tab bar with the safe area respected (`designing-for-ios.md › Best practices`; `layout.md › Guides and safe areas`).
- Fixed (Medium): progress was a thin bar with no relation to the site. It is now a short segmented route line plus "Step n of N" (`writing.md › Best practices`: "Give clear guidance and use consistent language throughout processes with multiple steps.").
- Medium (open): every question H1 is TB red, per the global H1 rule. On a symptom flow this repeats the urgency color on calm screens (`color.md › Best practices`: "Avoid using the same color to mean different things."). Recommendation for the next round: keep red for the intro and result titles, use Ink for question titles. Not changed here because the brief fixes H1 color.
- Clinical review of questions and results is still pending ([REVIEW] flags kept).

### Learn: Good
Thesis: a calm reference you can jump around in. Atkinson throughout at 18 px with a 34 em measure (`typography.md › Ensuring legibility`: "Use font sizes that most people can read easily."). Contents is a collapsible grouped list on phones and a sticky sidebar with scroll-spy at 1080 px and wider. Each section ends with "By the numbers" (sourced claims linking to the Data page) and "Back to top".
- Medium: the page is long (10 sections). The contents list and back-to-top links are the mitigation.

### Data: Good
Thesis: the dot field, then the evidence. Every chart is a white panel with a plain-language takeaway (`charts.md › Descriptive content`: "Summarize the main message of your chart to help make it approachable and useful for everyone."), a table version (`charts.md › Best practices`: "Make every chart in your app accessible."), and a source. Stats tiles became grouped rows, so big-number-over-label tiles appear only in the dot story.
- Fixed (High): at 320 px two chart labels pushed the page 16–19 px sideways (d7 legend, d15 target label). Legends now wrap and target labels stay inside the chart.
- Fixed (High): chart tables used a `<table>` with repeat blocks inside `<tbody>`, the same pattern that left About's numbers blank. They are ARIA tables built from rows now.
- Medium: "TB in numbers" offers 12 topics. On wide screens they form a wrapping segmented grid, on phones a select. Twelve segments is more than a segmented control usually holds; acceptable because each is a filter, not navigation.
- Medium: the page is about 19,600 px tall on a phone. Mitigated by the grouped jump list and "Back to top" in every panel (`charting-data.md › Best practices`: "Keep a chart simple, letting people choose when they want additional details.").

### About: Good
Grouped sections throughout. Fixed (Critical): Helpful numbers showed numbers without who or note. Rebuilt as a grouped list; every row shows who, number (tap to call) and note. Privacy now covers offline storage, no tracking, and the three outside services.

### 404: Excellent
Real 404 with one solid and one soft capsule. Nothing to remove.

### Install: Good (from v5)
No launch prompt or banner (`launching.md › Launch screens`: "Don't advertise."). Entry points: footer link, About section, Place row, Check results A–C row; all hidden when installed. App icon keeps the route concept, centered and text-free (`app-icons.md › Icon shape`: "Keep primary content centered…"; `app-icons.md › Design`: "Include text only when it's essential…").

## 2. Accessibility (WCAG 2.2 AA) evidence

New color pairs (computed from hex):

| Pair | Values | Ratio |
|---|---|---|
| White on Ink (selected segment, topic button) | `#FFFFFF` on `#14212B` | 16.4:1 |
| Ink on white (unselected segment) | `#14212B` on `#FFFFFF` | 16.4:1 |
| White on Film (urgent screen text) | `#FFFFFF` on `#0E1A22` | 17.7:1 |
| Film muted on Film (urgent footnote) | `#A9B4BA` on `#0E1A22` | 8.3:1 |
| TB red on white (Call 911 label, H1 on panels) | `#C42032` on `#FFFFFF` | 5.8:1 |
| White on 16% white over Film (Back / Start over) | `#FFFFFF` on `#353F45` | 10.8:1 |
| Secondary on white (details labels, hints in groups) | `#3F4B53` on `#FFFFFF` | 9.0:1 |
| Secondary on Canvas (ledes, step label) | `#3F4B53` on `#F1F3F4` | 8.1:1 |
| Muted on white (sources, meta lines) | `#56626A` on `#FFFFFF` | 6.3:1 |
| Teal deep on tint 13% (soft capsules) | `#175458` on `#E2ECEC` | 7.1:1 |
| Teal deep on tint 14% (Learn sidebar current) | `#175458` on `#DFEAEB` | 7.0:1 |
| Control edge on white (inputs, segment track, switch off), non-text | `#7A858C` on `#FFFFFF` | 3.8:1 |
| Control edge on separator grey, non-text | `#7A858C` on `#E3E6E8` | 3.0:1 |
| Teal on white (switch on, checks), non-text | `#1E6B70` on `#FFFFFF` | 6.2:1 |
| TB red on Canvas (H1, error) | `#C42032` on `#F1F3F4` | 5.2:1 |

Automated pass (`prototype/qa-harness.html`, Chromium, 45 loads: 9 pages × 320/390/768/1280 px in English plus 320 px in Filipino):
- Horizontal scroll: 0 px on every load after the two Data fixes above.
- Unresolved template text: 0. One H1 per page: 9 of 9.
- Visible controls under 44 px tall: 0 (Home's four are visually hidden native radios inside 56 px rows).
- Text under 14 px inside `<main>`: 0.
- Focus on step change: Check moves focus to the question H1; Places sheet moves focus to its heading and back to the Filters button on close; results headings on Home unchanged.
- Tab bar: Check's pinned Next sits above it (offset `calc(84px + env(safe-area-inset-bottom))`); the footer spacer keeps the last link clear.
- Reduced motion: sheet slide, route draw, dot story, smooth scroll all switch off. Reduced transparency and Increase Contrast: bars turn solid (unchanged).
- Still to do by hand: VoiceOver (iOS) and TalkBack (Android) pass; keyboard-only pass in Safari.

## 3. Generic-look check (SOT, 20 tells)

| # | Tell | Status |
|---|---|---|
| 1 | Purple-to-blue gradients | None |
| 2 | Gradient hero text | None |
| 3 | Emojis in headings | None |
| 4 | Inter everywhere | No. Atkinson Hyperlegible Next, chosen for low-vision legibility |
| 5 | Colored-border cards | None. The only bordered element is the patient-card summary, a deliberate clinic artifact |
| 6 | Glassmorphism cards | No. Glass on header and tab bar only, plus Home's planner sheet over the decorative map (approved) |
| 7 | Low-contrast dark mode | No dark mode yet. The Film urgent screen is 8.3:1 or better |
| 8 | Three icon boxes in a row | None |
| 9 | Badge above the headline | None |
| 10 | Lucide icons everywhere | No. Seven hand-drawn stroke icons, all functional |
| 11 | Default shadcn | Not used |
| 12 | Fade-in on scroll | None. Motion is the route draw, the dot story and the sheet slide |
| 13 | Cursor effects | None |
| 14 | Buttons that fade on hover | No. Hover changes fill color; opacity changes only while "Use my location" is busy |
| 15 | Inconsistent spacing | Mostly resolved. Remaining: body sizes still step through 15/16/17/18/19/20 px (open item: type scale) |
| 16 | Em dashes everywhere | New v6 copy has none. Existing content-pack strings still use them (footer safety note, Check intro, sector badges, page titles). Remains for the content owner to decide |
| 17 | Buzzword copy | None |
| 18 | Serif italic accent text | None. Newsreader only in the wordmark |
| 19 | Trendy font pairing | No |
| 20 | Grain over gradient | None |

## 4. Data trace

| On screen | Comes from |
|---|---|
| Dot story counts (724 / 179 / 37 dots, beat numbers) | `tb-ph-data.json › headline_2024` (claims `burden-cases`, `gap-missed`, `burden-deaths`) |
| Data d1–d15 charts and tables | `incidence_series`, `detection_gap_series`, `notifications_monthly`, `deaths_series`, `incidence_by_age_sex_2024`, `notifications_by_age_sex_2024`, `risk_factor_attributable_cases_2024`, `treatment_outcomes`, `drug_resistant_tb`, `tb_hiv`, `contacts_and_tpt_2024`, `global_comparison`, `patient_costs`, `prevalence_survey_2016`, facility counts from the facility file, `end_tb_milestones` |
| Data d1–d15 takeaway sentences | Literal strings in `Data.dc.html` (unchanged from v5). They match the JSON values; in production generate them from `claims.json` like d16–d20 |
| d16 | Takeaway: claims `test-sites`, `test-volume`. Chart/table/positivity: `diagnostics_network.series[].rapid_molecular_test_sites`, `rapid_tests_performed`, `rapid_tests_positive`, `rapid_test_positivity_pct` |
| d17 | Takeaway: `fund-2024`, `fund-2025`. Caption: `fund-cuts`, `fund-budget`. Bars/table: `financing.series[].received_domestic_usd`, `received_global_fund_usd`, `received_usaid_usd`, `received_usd`; 2025 from `available_*_usd`, hatched and labelled expected (`financing.caveat_2025`) |
| d18 | Takeaway: `prev-bcg`. Line/table: `bcg_coverage.series[].coverage_pct` |
| d19 | Takeaway: `drivers-slums`. Rows: `sdg_context.indicators[]` keys `urban_slum_pct`, `smoking_pct_15plus` (+`by_sex`), `adult_undernutrition_pct`, `diabetes_pct_18plus`, `alcohol_use_disorders_pct_15plus`, `uhc_service_coverage_index` (value, year, source as stored) |
| d20 | Every claim with `topic: regional` (`region-ncr`, `region-r3`, `region-r11`, `region-tondo`, `survey-2016`), period = claim `year` |
| TB in numbers | All 44 claims; anchors `#claim-{id}` |
| Learn "By the numbers" | Claim ids per the mapping in the brief |
| Home teaser "724,000" | `headline_2024` / claim `burden-cases` (Home unchanged) |
| Places, Place | Facility file fields; distance computed (haversine) |
| About phone numbers | PhilHealth TB-DOTS list; DOH 1555 marked [VERIFY] |

No number was re-rounded in v6 copy. Where a claim and a JSON value differ in precision (claim `drivers-uhc` says 58, the indicator is 58.2), each is shown as its source states it.

## 5. SOT per-build audit record

```md
Project / Build: TB PH, v6 (all pages on v4; phone app; more data and claims)
Platform: Web (installable PWA)
Environment audited: Design prototype (.dc.html pages, support.js runtime) served from the project; Chromium preview
Branch / commit / release: design project, 30 Oct 2026 (sw.js VERSION tbph-2026-10-30c)
Audit date: 30 October 2026
Auditor: Claude (design agent)

Blocking findings:
- None in the design. Release blockers that need the production build: Lighthouse run, real-device install tests, production domain.

Accepted exceptions / N/A rationale:
- Accounts, payments, cookie banner, analytics: N/A (no accounts, no tracking; only the language preference is stored).
- Dark mode: not designed yet (open item).
- Lighthouse and Core Web Vitals: not measurable on the prototype (it compiles pages in the browser with Babel, about 3.1 MB on first visit). Run on the production build.
- Em dashes in existing content-pack copy: left for the content owner.
```

Master Build Audit (applicable rows):

| Domain | Status | Evidence / blockers |
|---|---|---|
| Core UX / decision friction | ✅ | One solid teal button per screen on every page; filters behind a sheet on phones |
| Empty-state / first-value activation | ✅ | Places empty, no X-ray, error, loading; Place missing; Check error; Data load error |
| System handoff / in-context flow | ✅ | Directions, Sakay copy, tel links; back links on Places, Place, Check |
| Familiar interaction patterns | ✅ | Tab bar, grouped lists, segmented controls, bottom sheet, switch |
| Responsive/mobile behavior | ✅ | 0 px sideways scroll at 320/390/768/1280; Filipino at 320 |
| Accessibility | 🟡 | Automated checks pass (section 2); screen-reader and keyboard passes by hand still to do |
| Website technical SEO | 🟡 | Title and description per page, one H1, real 404, robots and sitemap; canonical and og:image wait for the production domain (image exists) |
| Frontend quality metrics | 🟡 | No console errors in the QA pass; Lighthouse to run on the production build |
| Performance / Lighthouse | 🔍 | Needs the deployed build |
| Privacy / retention / deletion | ✅ | No accounts, no tracking; About › Privacy lists offline storage and the three outside services |
| Reliability / retries / failure handling | ✅ | Retry on facility and map loads; offline status lines; service worker fallback page |
| Release-build verification | 🔍 | Real iPhone (Safari › Add to Home Screen) and Android (Chrome › Install) still to test |
| Legal links / policies / support | 🟡 | Disclaimer, privacy and accessibility statement present; contact email and group name are placeholders |
| Growth / store assets / localization | ✅ | EN/FIL everywhere; app icon, shortcuts and share image exist |

SOT web checklist: skip link ✅ · loading/empty/error states ✅ · real 404 ✅ · print (Check summary) ✅ · copy feedback (Sakay) ✅ · last-updated date (30 October 2026) ✅ · title and description per page ✅ · one H1 per page ✅ · canonical and og:image 🟡 (production domain).
