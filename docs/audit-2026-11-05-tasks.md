# Audit tasks for the builder (5 November 2026)

From the interim build audit (docs/audit-2026-11-05.md), snapshot 6f759ff. Every task was verified against the code at that commit and keeps the approved look, layout and copy. The TB Health lead keeps this file; the builder reads it and reports back.

## How to work

- Fix in this order: Critical, High, Medium, Low (the SOT remediation order). Commit by path, one task or a small related group per commit, with the task id in the message.
- First check that the problem still exists at your current tip; the audit predates steps 11-13. Report any task that no longer reproduces instead of changing code.
- Each task has an acceptance test. Add it to the suite unless it says otherwise. Heavy runs go through _handoff/lowmem-run.sh.
- Stop and ask the lead when a task would need new copy, a new dependency or service, or a change to the approved look. Owner questions (O1-O28) are in docs/owner-queue.md; do not act on them until the lead sends the decision.
- B22 waits for the v7 import. B23 is confirmed: the Q3 quote "Get a chest X-ray..." is a stop title, so the titles get [REVIEW] like the texts.

## B1. Draw the focus ring inside full-width rows and around the map frame (Critical, step now)

- **Files:** src/styles/ui.css, src/styles/data.css, src/styles/learn.css, src/styles/places.css, tests/e2e
- **Fix:** outline-offset: -3px on .link-row, .install-row, the Data Methods summary and Learn's narrow contents summary when focus-visible (as README:116 does for choice rows). For the map: .map-frame:has(> .map:focus-visible) { outline: var(--focus-ring); outline-offset: 3px }. Focus state only; nothing else changes.
- **Acceptance:** At 390px in Chromium and WebKit, Tab to the Place and Check install rows, the closed Data Methods summary, Learn's closed contents summary, About's install link row and the Places map: each shows a complete 3px ring (e2e screenshot or bounding-box check).
- **Sources:** wf1:apple-a11y:focus-ring-clipped; delta-a11y limit (Learn, Data, About rows); focus-and-selection.md > Tablet (iPadOS); README:40, :116; WCAG 2.4.7

## B2. Make text sizes follow the browser text-size setting (High, step now)

- **Files:** src/styles/tokens.css, global.css, chrome.css, ui.css, home.css, learn.css, check.css, place.css, data.css
- **Fix:** Redefine --text-14 to --text-20 and the raw px font sizes as max(px, rem), e.g. --text-18: max(18px, 1.125rem); width media queries in em (1000px = 62.5em); footer spacer and Check's sticky offset rem-based or from B14; tab labels may stay px; let .locate wrap (drop nowrap, keep min-height 48px). Nothing moves at the 16px default (D1).
- **Acceptance:** At a 24px browser default, body text is 27px and the heading hierarchy holds; at 320 and 390px in EN and FIL no element overflows its container (element-level check, including .locate inside .planner-sheet); header, tab bar, segmented controls, Check's Next and Data charts checked at 150% and 200% root.
- **Sources:** wf1:apple-a11y:text-ignores-font-size; wf1:apple-craft:px-body-vs-rem-headings; accessibility.md > Vision; typography.md > Supporting Dynamic Type

## B3. Bring Check's unanswered-question error into view and link it to the question (High, step now)

- **Files:** src/islands/CheckFlow.tsx, src/styles/check.css, tests/e2e/check.spec.ts
- **Fix:** After a failed Next: error.scrollIntoView({ block: 'nearest' }) without smooth scrolling; scroll-margin-bottom about 162px plus env(safe-area-inset-bottom) below the desktop breakpoint, about 78px above; id='q-error' added to the group's aria-describedby while shown; re-mount the alert on a repeat failed tap. Copy, colour and position unchanged.
- **Acceptance:** At 390x844 in EN and FIL on the adult risk step and the child symptoms step, Next with nothing chosen leaves the whole error visible above the Next bar; the group's aria-describedby includes q-error; a second failed tap replaces the alert node.
- **Sources:** new:check-error-offscreen; README:224, :307; WCAG 3.3.1

## B4. Contain Leaflet's layers inside the map frame (High, step now)

- **Files:** src/styles/places.css, tests/e2e/places.spec.ts
- **Fix:** isolation: isolate on .map-frame (the technique .planner already uses). .map-status keeps working inside it.
- **Acceptance:** At 390px in Map view, after scrolling the map under the tab bar, elementFromPoint at a tab's centre returns the tab link; with Filters open the sheet is topmost.
- **Sources:** wf1:apple-conventions:map-covers-functional-layer; tab-bars.md > Best practices; liquid-glass.md > The two layers

## B5. Respect left and right safe areas (High, step now)

- **Files:** src/styles/ui.css, src/styles/home.css, src/styles/chrome.css, src/styles/data.css
- **Fix:** Wrap each side gutter as max(current gutter, env(safe-area-inset-left)) and a right twin (e.g. --gutter-left and --gutter-right tokens) on .frame, .planner-inner, .results, .reassure, .data, .turn-wrap, .site-header-row, .site-footer-inner and the skip link offset; max(16px, env(...)) on .sheet-grab and .sheet-body. Backgrounds stay full-bleed.
- **Acceptance:** Portrait and desktop screenshots unchanged; on a real notch or Dynamic Island iPhone in landscape, Home, the Places sheet, a Check question and the Data story keep text and controls clear of the sensor housing; one WebKit 844x390 screenshot added at step 13.
- **Sources:** wf1:apple-conventions:safe-area-left-right; wf1:apple-craft:landscape-safe-area; layout.md > Guides and safe areas

## B6. Re-apply Data deep links after the charts hydrate (High, step now)

- **Files:** src/islands/DataCharts.tsx, src/scripts/data.ts, src/scripts/lang.ts, src/lib/anchor.ts, src/views/Data.astro, src/styles/data.css, tests/e2e/data.spec.ts
- **Fix:** Dispatch one tbph:charts-ready event after the first real-width render. On it, data.ts re-runs hash handling for any id (claim-, dN, numbers, methods) at top minus 88px and focuses claim rows; lang.ts re-applies an anchor restored on this load (kept in memory). Widen client:visible's rootMargin or hydrate at once when the hash targets the charts or below. scroll-margin-top on [data-anchor] (or B10). Keep D13; no look or copy change.
- **Acceptance:** At 390px, /data#d12, /data#d16 and /data#claim-<first id> end with the target in the viewport after hydration and the claim row focused; a Learn 'More in the data' link lands on its claim; a language switch on /data keeps the section.
- **Sources:** new:data-charts-phone-relayout-shift; new:data-deeplink-reflow; README:242; PLAN 4.6

## B7. Draw every located center on the Places map (High, step now)

- **Files:** src/islands/placesMap.ts, scripts/prepare-data.mjs, tests/unit or tests/e2e
- **Fix:** Use Leaflet's canvas renderer for the circle markers (L.canvas() or preferCanvas), remove the 800 cap and build popups lazily (bindPopup with a function); keep colours, radius and stroke. Make the synthetic fixture group rows by region. If a cap must stay, the 'showing N of M' line is owner copy: stop and ask.
- **Acceptance:** On a region-grouped 2,100-row synthetic build the marker count equals the located rows; a test asserts every located row gets a marker; pan and filter timings recorded for step 13.
- **Sources:** new:map-marker-cap-silent; break-ui/CATALOG.md > Collections; prototype Places.dc.html:324

## B8. Keep focus after 'Show more' and 'Try again' (Medium, step now)

- **Files:** src/islands/Places.tsx, src/islands/Planner.tsx, tests/e2e/places.spec.ts, tests/e2e/home.spec.ts
- **Fix:** After the limit grows, focus the first newly shown row's name link (remember the old limit). Before a 'Try again' unmounts, focus the loading line (tabindex -1), then the field (Home), the count heading (Places list) or the map frame (map). Nothing visible changes.
- **Acceptance:** E2E: after each 'Show more' tap, including the last, the active element is the first new row's link; after a forced failure and a successful 'Try again' on Home, the Places list and the map, the active element is not body and lands as described.
- **Sources:** wf1:apple-a11y:focus-lost-after-updates; wf1:apple-interaction:show-more-focus; wf1:apple-interaction:async-feedback-out-of-view; focus-and-selection.md > Best practices

## B9. Mirror Home's location failure handling on Places (Medium, step now)

- **Files:** src/islands/Places.tsx, src/ui/controls.tsx, tests/e2e/places.spec.ts
- **Fix:** Pass an inputRef to Places' LocationField and focus the field on failure; keep the status node mounted (empty) and point the input's aria-describedby at it; on success, focus the field if focus fell to body.
- **Acceptance:** The Places twin of Home's denial test passes: after a denied location, focus is on the field, the message is in a pre-mounted role=status node and aria-describedby points to it.
- **Sources:** wf1:apple-a11y:places-locate-feedback; wf1:apple-interaction:places-locate-focus; README:281, :205; voiceover.md > Navigation

## B10. Add scroll padding for the sticky header and tab bar (Medium, step now)

- **Files:** src/styles/global.css, src/styles/check.css
- **Fix:** html { scroll-padding-top: 80px }; below 1000px (EN) and 1180px (FIL), scroll-padding-bottom: calc(108px + env(safe-area-inset-bottom)); about 162px plus the inset on Check question views (or take both from B14's measured bar height). Nothing moves at rest.
- **Acceptance:** At 390px a Learn contents link, a Data index row, #numbers and /about#accessibility put the target heading below the header; Shift+Tab through Places at 200% and 400% zoom keeps the focused item visible in Chromium and WebKit (WCAG 2.4.11).
- **Sources:** wf1:apple-a11y:sticky-bars-cover-focus; SOT Sticky header row; layout.md > Guides and safe areas

## B11. Show selected states in forced colours (Medium, step now)

- **Files:** src/styles/global.css or src/styles/ui.css, tests/e2e
- **Fix:** One @media (forced-colors: active) block: forced-color-adjust: none with Highlight and HighlightText on .lang-toggle a[aria-current], .segmented button[aria-pressed='true'], .tab-bar a[aria-current], .toc-wide a[aria-current] and .choice.is-included .num-disc; a system-colour knob (e.g. CanvasText) and a Highlight checked track for the switch.
- **Acceptance:** Chromium e2e with emulateMedia({ forcedColors: 'active' }): the selected segment, current tab, current language and the switch's on and off states differ in computed colours; normal-mode screenshots unchanged.
- **Sources:** wf1:apple-a11y:forced-colors-and-map-motion; wf1:apple-craft:forced-colors-selection; color.md > Inclusive color

## B12. Make Places map refits instant and honour reduced motion (Medium, step now)

- **Files:** src/islands/placesMap.ts, tests/e2e/places.spec.ts
- **Fix:** animate: false on fitBounds (keep padding [36,36] and maxZoom 13) and on setView; when (prefers-reduced-motion: reduce) matches, create the map with zoomAnimation, fadeAnimation and markerZoomAnimation false.
- **Acceptance:** E2E under emulated reduced motion: no leaflet-fade-anim class; after fast broadening input every marker is inside map.getBounds().
- **Sources:** wf1:apple-a11y:forced-colors-and-map-motion; wf2:motion-review:map-refit-motion; README:39, :307; PLAN:223

## B13. Flatten the Place Details list for valid dl grouping (Medium, step now)

- **Files:** src/islands/PlaceDetails.tsx, src/styles/ui.css, src/styles/place.css, tests/e2e/place.spec.ts
- **Fix:** Remove the outer wrapper so each div.detail-row sits directly under the dl; rebuild the 16px inset and the separators in CSS so the pixels stay the same; add one axe check on a Place page (@axe-core/playwright is already installed).
- **Acceptance:** axe's dlitem and definition-list rules pass on /place/<id> and /fil/place/<id>; screenshots at 390 and 1280px unchanged.
- **Sources:** new:place-dl-nesting; README:217, :307

## B14. Measure the tab bar so Check's Next and the footer spacer clear it (Medium, step now)

- **Files:** src/components/SiteHeader.astro or a small script in src/layouts/BaseLayout.astro, src/styles/chrome.css, src/styles/check.css
- **Fix:** Publish the real tab-bar height as a custom property (ResizeObserver on .tab-bar) and use it for .site-footer-spacer, .next-bar's bottom offset and B10's scroll-padding-bottom. No visual change with a one-line bar. Part (b) of the tab-label finding; the label wording is O3.
- **Acceptance:** At 360, 375 and 390px in EN and FIL, Check's Next button keeps the same 14px clearance above the tab bar as with a one-line bar; the footer is never covered.
- **Sources:** wf1:apple-conventions:tab-labels-wrap (option b); mobile-native limit
- **Lead ruling, 5 Nov 2026.** The builder measured the bar at 81px, because English labels already take two lines at 390px. So there is no one-line bar at rest, and the first fix (calibrated to 81px) left about 3px above it.
  - **Ruling:** calibrate to the README's one-line bar (about 70px) instead:
    - Next's offset is the measured bar plus 14px;
    - the footer spacer is the bar plus 22px;
    - Check's scroll padding moves with Next.
  - **Result:** a one-line bar gives exactly the README's 84px and 92px. With today's labels, Next sits 11px higher than in the prototype. This is the one task that moves something at rest; short labels (O3) bring it back.
  - **Why:** the README puts Next "above the tab bar", and at 3px a slightly low tap lands on a tab and leaves the check.
  - The owner can overrule this in favour of the prototype's 3px.

## B15. Close the Filters sheet on the system Back gesture (Medium, step now)

- **Files:** src/ui/controls.tsx
- **Fix:** When 'CloseWatcher' in window, create one on open whose close calls onClose; destroy it in cleanup; guard against a double close with the Escape listener. No visual or copy change, no dependency.
- **Acceptance:** Where supported, a CloseWatcher exists only while the sheet is open; on an Android phone, Back with the sheet open closes it and stays on Places with the filters kept.
- **Sources:** wf1:sot-ux:sheet-ignores-system-back; SOT Jakob's Law rule 2; cross-platform.md > Conventions to check

## B16. Remember a submit made while the list is loading or failed (Medium, step now)

- **Files:** src/islands/Planner.tsx, tests/e2e/home.spec.ts
- **Fix:** On submit while load is loading or error, set waiting (prototype parity) so the route runs after a successful retry; bring the status or error into view with the 70px / 60% rule (instant under reduced motion) and focus 'Try again' on error; do the same for a location fix during an error.
- **Acceptance:** E2E: a submit during a forced list error moves focus to 'Try again' with the error in the viewport; a successful retry then renders the route with no second submit.
- **Sources:** wf1:apple-interaction:async-feedback-out-of-view; wf1:sot-ux:error-state-dead-primary; prototype Home.dc.html:293, :324; SOT Loading states row

## B17. Keep the reader's place on a language switch from a typed-place route (Medium, step now)

- **Files:** src/islands/Planner.tsx, src/scripts/lang.ts, src/lib/anchor.ts, tests/e2e/home.spec.ts
- **Fix:** Keep the saved anchor for the planner (restore it after the first restored render, or let lang.ts skip deletion when the target is missing), apply it instead of the heading scroll, and don't replay the draw-in for a route restored after a switch.
- **Acceptance:** E2E: with a typed city, scroll into stop 2 and switch language: same offset within a few px and no rail animation running.
- **Sources:** wf1:apple-interaction:lang-switch-loses-place; README:283; PLAN 4.2

## B18. Show 'Find TB care' on Place when no route can be restored (Medium, step now)

- **Files:** src/islands/PlaceDetails.tsx, src/styles/place.css, tests/e2e/place.spec.ts
- **Fix:** At hydration, when history.length < 2 or the referrer isn't same-origin Home, set html[data-back='home'] so CSS shows the existing 'Find TB care' label; skip history.go(-2).
- **Acceptance:** E2E: /place/<id>?stop=2 opened directly shows 'Find TB care'; after a language switch on Place the label is the Filipino home label; from Home's route it still reads 'Back to your route' and history.back() restores the route.
- **Sources:** new:place-back-route-false-promise; README:151

## B19. Size the dot story stage in svh on phones (Medium, step now)

- **Files:** src/styles/data.css (optionally src/styles/global.css, src/styles/chrome.css)
- **Fix:** Phone path only: 52svh at data.css:412 and 100svh at :500, each after a vh fallback line; not dvh; the desktop rule stays. Optional: min-height 100svh with a vh fallback on body and .page.
- **Acceptance:** On an iPhone with the toolbar shown at 390 and 375px, the stage is about 0.52 x innerHeight at load (prototype parity) and the beat doesn't snap when the toolbar hides; desktop unchanged.
- **Sources:** new:dot-story-vh-large-viewport; mobile-native/SKILL.md > Layout has the wrong height

## B20. Give every NCR 8-digit number +632 (Medium, step now)

- **Files:** src/lib/core/phone.ts, tests/unit/core.test.ts
- **Fix:** Drop the first-digit condition for NCR: 8 or more digits give tel:+632 plus the first 8 digits (README:289).
- **Acceptance:** Unit: NCR '5310-1983 loc 110' gives tel:+63253101983 and '5318-6600' gives tel:+63253186600; a 3xxx-xxxx case passes; the Region I 8-digit case is unchanged.
- **Sources:** new:ncr-tel-prefix-narrower-than-spec; README:289

## B21. Add the three missing hatch patterns to the chart defs (Medium, step now)

- **Files:** src/islands/DataCharts.tsx, tests/unit/panels.test.ts
- **Fix:** Copy dh-teal, dh-ink and dh-dot from Data.dc.html:35-37 (a 6x6 white rect plus a 3px line in #1E6B70, #14212B and #7A8C97); optional test that every url(#id) in buildPanels output has a matching def.
- **Acceptance:** d17's 2025 bar shows hatched segments matching the legend; the url(#id) test passes.
- **Sources:** new:d17-hatch-patterns-missing; README:240

## B22. Make chart colours themeable at the v7 dark-mode import (Medium, step v7 import (before 13))

- **Files:** src/lib/charts/panels.ts, src/lib/charts/primitives.ts, src/islands/DataCharts.tsx, src/styles/data.css
- **Fix:** Emit semantic classes styled from tokens, or read computed tokens and re-render on a colour-scheme change as DotStory does; theme the hatch patterns; use v7's dark chart values if given; if v7 says charts stay light, raise it with the lead.
- **Acceptance:** Light mode pixel-identical; in emulated dark mode chart text meets 4.5:1 and marks 3:1 against the dark surface.
- **Sources:** new:charts-hardcoded-light-hex; decisions.md V2

## B23. Flag the three stop titles [REVIEW] (Medium, step now)

- **Files:** src/content/care.ts
- **Fix:** Add ['REVIEW'] flags to care.stopTitle_xray, stopTitle_test and stopTitle_meds; wording unchanged. The lead confirms the Q3 reading first.
- **Acceptance:** launch-check lists six stop strings under [REVIEW] (three titles, three texts); parity test green.
- **Sources:** wf1:apple-writing:stop-titles-outside-review; decisions.md Q3

## B25. Extend launch-check's lists for the owner (Medium, step now)

- **Files:** scripts/launch-check.mjs
- **Fix:** (1) List every dictionary string containing U+2014 by id, replacing the hand-kept list in JR-RESUME. (2) When TBPH_CHECK=false, list install.off2, install.lead, about.disclaimerText, about.privacy1, about.appText and meta.installDescription as blocking. (3) Add about.updatesText and datapage.method2 to the Q11 KNOWN line. (4) Add a KNOWN line for the unrecorded WHO and PhilHealth reuse terms. (5) Optional: list pack Filipino strings for the register pass. No wording changes.
- **Acceptance:** launch-check output shows each list; with TBPH_CHECK=false, --release exits 1 until the owner resolves the Check strings.
- **Sources:** wf1:apple-writing:em-dash-inventory; wf1:sot-ux:em-dashes-in-shipped-copy; new:q9-check-mentions-outside-gate; new:check-off-variant-untested; new:freshness-copy-goes-stale; new:data-reuse-terms-unrecorded; wf1:apple-writing:fil-register-switch

## B26. Build and smoke-test the Check-off variant (Medium, step now)

- **Files:** package.json (script), tests/e2e
- **Fix:** Add a guarded job: a TBPH_CHECK=false build, check-links and one smoke e2e (no /check, no Check tab or links; after step 11 also no Check shortcut or precache entry). Add it to the step 13 matrix. Hiding Install's off2 row in that build is the owner's call (C3).
- **Acceptance:** The job passes under GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh; /check returns the 404 page in that build.
- **Sources:** new:check-off-variant-untested; decisions.md Q9

## B27. Add the D22 CI workflow and a dependency check (Medium, step now)

- **Files:** .github/workflows/ci.yml, docs/PLAN.md
- **Fix:** Write a workflow_dispatch-only workflow: setup-node from .nvmrc, npm ci, check, test, build, a TBPH_CHECK=false build with check-links, Playwright against dist; no external link checking. Add 'npm audit --omit=dev' as a step 14 evidence line, telling the owner in one line before it runs in CI (it sends the dependency list to the npm registry). Record in PLAN which step owns D22; hand the push to the owner as one command.
- **Acceptance:** The owner triggers the workflow once and it passes, including a clean npm ci from the lockfile; the audit result is recorded at step 14.
- **Sources:** new:ci-and-dep-audit-missing; PLAN D22; SOT Evaluate open-source components and external APIs

## B24. Widen the brief note on the owner's privacy row (Low, step now)

- **Files:** src/content/about.ts
- **Fix:** Update the note on about.privacyServices (a code comment, not copy) to list what the row must cover: fonts served by TB PH; the host sees IP, browser and pages; OpenStreetMap only if the map is opened (IP and area viewed); directions hand off to Google Maps or Sakay.ph; calls go through the phone.
- **Acceptance:** The note matches the lead's Q5 request to the owner; nothing rendered changes.
- **Sources:** new:owner-row-scope-too-narrow; new:map-fit-reveals-area; PLAN 4.5:156, :166

## B28. Announce route and language updates and fix the H2-to-H4 skip (Low, step now)

- **Files:** src/layouts/BaseLayout.astro, src/islands/Planner.tsx, src/scripts/inplace.ts
- **Fix:** Mount one visually hidden role=status node from load; write the route heading text after a focus:false recompute and document.title after an in-place switch (no new copy); pass heading={single ? 'h3' : 'h4'} to FacilityRow.
- **Acceptance:** E2E: an 'I need' change updates the status node; an in-place switch on Places and Check writes the new title; a single-service route goes H2 then H3.
- **Sources:** wf1:apple-a11y:silent-updates-and-heading-skip; voiceover.md > Navigation

## B29. Gate hover styles to hover-capable fine pointers (Low, step now)

- **Files:** src/styles/global.css, ui.css, chrome.css, home.css, check.css, place.css, data.css, about.css, learn.css
- **Fix:** Wrap each existing :hover rule where it stands in @media (hover: hover) and (pointer: fine), keeping selectors, values and order. No new pressed states (that is O5).
- **Acceptance:** Touch-emulated Playwright check: tap 'Use my location' with location denied and the background returns to rest; hover at 1280px unchanged.
- **Sources:** wf2:glisse-reference:hover-sticks-on-touch; wf2:motion-review:press-state-missing; wf1:apple-conventions:pointer-hover-gaps; mobile-native/SKILL.md > Hover state stuck after tap

## B30. Make the Filters sheet drag robust (Low, step now)

- **Files:** src/ui/controls.tsx, tests/e2e/places.spec.ts
- **Fix:** onTouchCancel resets startY and drag and never closes; track one touch by identifier and ignore extra fingers; clear shown and drag before onClose on every close path (or use a layout effect); optional reset on visibilitychange; optional downward drag on .sheet-body when scrollTop is 0. Keep 90px, 240ms and the CSS.
- **Acceptance:** Chromium touchscreen e2e: touchstart, move 50px, touchcancel leaves no inline transform and no .is-dragging; a release past 90px starts the slide-out at once; a second finger causes no jump.
- **Sources:** wf1:apple-conventions:sheet-drag-touchcancel; wf1:apple-interaction:sheet-swipe-dismiss; wf2:motion-review:sheet-drag-robustness; wf2:glisse-reference:sheet-drag-no-cancel

## B31. Set keyboard hints on the place field (Low, step now)

- **Files:** src/ui/controls.tsx
- **Fix:** autocorrect='off', spellcheck={false}, enterkeyhint 'go' on Home and 'done' on Places (where Enter blurs the field). Try a keydown Enter calling form.requestSubmit() (skipped while composing) only if a WebKit test shows arrow-key suggestion picking still works; otherwise log the double Enter as native behaviour.
- **Acceptance:** Attributes present on both fields; Enter on Places hides the keyboard; the WebKit result is recorded.
- **Sources:** wf1:apple-interaction:place-field-keyboard; virtual-keyboards.md > Best practices; README:279

## B32. Stop the long-press callout on tab, segment and switch controls (Low, step now)

- **Files:** src/styles/chrome.css, src/styles/ui.css
- **Fix:** -webkit-touch-callout: none; -webkit-user-select: none; user-select: none on .tab-bar a, .segmented button and .switch only (consider Check's choice rows); never on content people copy. Optional touch-action: manipulation on the same selectors.
- **Acceptance:** Computed styles present only on those selectors; long-press checked on a real iPhone (owner device list).
- **Sources:** wf2:glisse-reference:control-long-press-callout; mobile-native/SKILL.md > Long-press selects button text

## B33. Replay the route draw-in for every new route (Low, step now)

- **Files:** src/styles/home.css, tests/e2e/home.spec.ts
- **Fix:** transition: none on .route[data-drawn='false'] .rail-fill and .route[data-drawn='false'] .stop-disc. Timings, curves, delays and the reduced-motion block unchanged.
- **Acceptance:** E2E: two different places on one page load leave running animations on rail segments 1 to 3 after the second; an 'I need' change still doesn't animate.
- **Sources:** wf2:motion-review:draw-in-no-replay; README:280

## B34. Share the contents chevron's base style (Low, step now)

- **Files:** src/styles/learn.css, src/styles/ui.css
- **Fix:** Move the .toc-chevron base rule and its reduced-motion guard from learn.css to ui.css; keep each page's [open] rule; the duration follows O20.
- **Acceptance:** On /data the Methods chevron computes to 26px and #8A949A; Learn unchanged.
- **Sources:** new:data-methods-chevron-unstyled; prototype Data.dc.html:61

## B35. Label the estimated or notified toggle with its own label (Low, step now)

- **Files:** src/islands/DataCharts.tsx, src/lib/charts/panels.ts
- **Fix:** Add toggleLabel to the Panel type and use aria-label={p.toggleLabel ?? title}.
- **Acceptance:** The d5 group's accessible name is 'Show estimated or notified cases' in EN and its approved twin in FIL.
- **Sources:** new:data-toggle-group-label; README:239

## B36. Pin the map popup colours (Low, step now)

- **Files:** src/styles/places.css
- **Fix:** .map .map-popup-name and .map .map-popup-address with literal #175458 and #14212B, fixed like the markers (V2).
- **Acceptance:** A popup name computes to rgb(23, 84, 88) in Chromium and WebKit.
- **Sources:** wf1:apple-conventions:map-popup-colours; prototype Places.dc.html:332

## B37. Validate the /data hash before decoding (Low, step now)

- **Files:** src/scripts/data.ts, tests/e2e/data.spec.ts
- **Fix:** Test the raw hash against /^claim-[a-z0-9-]+$/ before decodeURIComponent, or wrap the decode in try/catch and return.
- **Acceptance:** E2E: /data#% loads with no page error.
- **Sources:** new:data-hash-urierror; PLAN 4.5

## B38. Contain overscroll in Data's table scrollers (Low, step now)

- **Files:** src/styles/data.css
- **Fix:** overscroll-behavior-x: contain on .dtable-scroll.
- **Acceptance:** Computed style present; on an Android phone a left-edge swipe inside a wide table doesn't show the back arrow.
- **Sources:** new:table-scroll-overscroll-chain; mobile-native/SKILL.md > Pull-to-refresh hijacks scroll

## B39. Give long Filipino chart sub-labels room (Low, step now)

- **Files:** src/lib/charts/primitives.ts, src/islands/DataCharts.tsx, tests/unit/charts.test.ts
- **Fix:** Widen ts()'s right gutter only when a measured sub-label is wider than R minus 14; English and every label that fits keep the prototype geometry.
- **Acceptance:** Unit test with the Filipino worst cases: every sub-label ends inside the viewBox; English geometry identical.
- **Sources:** new:svg-label-gutters-fixed; break-ui/CATALOG.md > Labels, titles, and copy from data

## B40. Add a thousands separator to distances (Low, step now)

- **Files:** src/lib/core/geo.ts, tests/unit/core.test.ts
- **Fix:** Format the rounded distance with toLocaleString('en-US').
- **Acceptance:** Unit: 1234 gives 'about 1,234 km'; values under 1,000 unchanged.
- **Sources:** new:km-no-thousands-separator; break-ui/CATALOG.md > Numbers and money

## B41. Test alias place pages and head-link targets (Low, step now)

- **Files:** tests/unit, scripts/check-links.mjs
- **Fix:** Unit test of placePaths with a stubbed alias. At step 12, resolve link[rel=canonical] and link[rel=alternate] in check-links.
- **Acceptance:** The test asserts canonicalId is the target and that canonical and hreflang for /place/<old> and /fil/place/<old> point to the current id; check-links fails on a canonical to an unbuilt page.
- **Sources:** new:alias-and-headlink-untested; PLAN Q6

## B42. Add two phone device projects to Playwright (Low, step now)

- **Files:** playwright.config.ts, tests/e2e
- **Fix:** Add iPhone 13 (WebKit) and Pixel 7 (Chromium) projects limited by grep to an @phone smoke subset: sheet open and swipe-close, Place actions, Check's Next above the tab bar, Install order. Run each as its own lowmem-run job.
- **Acceptance:** Both projects pass; data-platform reads the phone value in them.
- **Sources:** new:no-phone-device-projects; mobile-native/SKILL.md > Right in Chrome, wrong on phone

## B43. Cover the child path in Check unit tests (Low, step now)

- **Files:** tests/unit/check.test.ts
- **Fix:** Add: child with contact gives C with the child note; child urgent gives no notes; adult X-ray 'unsure' on C and D gives xray_unsure; before() from 'recent' is 'sym' on the child path and 'blood' on the adult path; replace the redundant evaluate({ ...a, risk: [] }) assertion with one that toggleMulti's result evaluates to C.
- **Acceptance:** New cases pass; deliberately breaking the child-note rule in flow.ts makes a test fail.
- **Sources:** new:check-tests-gaps; PLAN step 7

## Later-step notes

- **Step v7 import; 13.** L1. Dark-mode import: give every derived token (on-ink, on-teal, paper as text, glass and tint rgba, scrim, grabber, chevron, shadows) a dark value or v7 role; add color-scheme: light dark and the dark theme-color meta; keep Film, the saved image and the map fixed; theme the charts (B22). *Acceptance:* Step 13's contrast test enumerates the real text and background pairs in both schemes, including Ink- and Teal-filled controls and a worst case on glass, and passes; native controls follow the scheme; Film, the saved image and the map are unchanged.
- **Step 13.** L2. A worst-case content fixture (long hyphenated name, ñ and an apostrophe, 'loc' and ';' phones, a 7-digit landline, an NCR 5xxx number, an empty phone, long hours, no coordinates, one-row and zero-row lists) plus a region-grouped 2,100-row variant. *Acceptance:* The EN and FIL matrix at 320, 390 and 1280px passes on both fixtures, including Check, About and Install at 320px, with no SVG text outside its chart.
- **Step 13.** L3. Measure the dot story's off-screen scroll work on a mid-range Android phone. *Acceptance:* A trace is recorded; if the scroll handlers cost frames off-screen, an IntersectionObserver gate on .story removes them, with beats, easing and durations unchanged.
- **Step 13 (cache keys in 11).** L4. Add the missing PLAN 4.5 privacy tests: a host allowlist keyed to the final Q5 row, and no coordinates in local or session storage after Use my location and Map. *Acceptance:* Every page contacts only our origin, plus tile.openstreetmap.org after Map; storage snapshots match before and after; no Cache Storage key has a query string.
- **Step 12.** L5. Pin Referrer-Policy: strict-origin-when-cross-origin in _headers. *Acceptance:* The post-deploy check reads the header on every page type, and OSM tiles still load.
- **Step 12.** L6. Cache-Control rules in _headers: /_astro/* immutable for a year; HTML, /data/*, /icons/*, sw.js and the manifest max-age=0, must-revalidate. *Acceptance:* The post-deploy check reads back each rule, and every file under /_astro is content-hashed.
- **Step 12.** L7. Sitemap from canonical ids only (no alias ids) plus core routes with hreflang; og:title, og:description, absolute og:image, og:url set to the canonical, og:locale; Check out of the sitemap under Q9. *Acceptance:* Every canonical, hreflang, sitemap and og:url answers 200 with no redirect; no alias id appears in the sitemap.
- **Step 14.** L8. A one-off outside-link report over every outside href in dist/, run only with the owner's OK (network). *Acceptance:* The report is in docs/AUDIT-build.md, and dead sources have gone to the content owner.
- **Step v7 import.** L9. Apply the v7 wording for every string V3 names (titles, footer safety line, sector badges, hours line, Check intro and results, partner-clinicians placeholder, listed Learn and Data lines) and log each in copy-overrides.md. *Acceptance:* The parity test runs against v7 for those strings, and launch-check's em-dash list shows only owner-pending ids.
- **Step 11 (built after this snapshot).** L10. Re-audit step 11: About's and Install's offline promises, the manifest's colours, and the Check-off build's shortcuts and precache. *Acceptance:* Pages work offline after one visit as About and Install say; manifest theme and background colours are #F1F3F4 with a dark twin planned for v7; a Check-off build has no Check shortcut or precache entry; the cache-key test passes.

## Runtime checks (device or deployed host)

- iPhone landscape (notch and Dynamic Island): Home, the Places sheet, a Check question and the Data story clear the side insets after B5.
- iPhone Safari at 390px: /data#d16, /data#claim-<id> and a Learn 'More in the data' link land on target after the charts hydrate (B6); time client:visible hydration on a low-end Android phone over 3G.
- iPhone with the toolbar shown at 390 and 375px: dot story stage height and text window against the prototype (B19); the Filters sheet's 88vh max-height keeps the grabber and Done visible.
- iPhone Safari and Android Chrome: Filters sheet swipe, a system-cancelled touch and a second finger (B30); Android system Back with the sheet open (B15); iOS edge swipe with the sheet open.
- iPhone, browser and standalone: long-press on a tab, a segment and the switch shows no callout or text selection (B32).
- iPhone and Android: tap Call on the urgent screen or an install row, return, and confirm no stuck hover colour (B29).
- iPhone: Save as image, whether navigator.share survives the await and which path runs, and whether the share title appears in Mail or Messages; desktop Safari and Firefox: the download survives the immediate object-URL revoke.
- iPhone Safari and Android Chrome: after a Check result's handoff link, does Back restore the answers from the back-forward cache on a shared phone (owner decides whether to clear them on pagehide).
- iPhone Safari and Android Chrome: 'Back to your route' after a GPS route, Place's back link from Places, and standalone edge-swipe back (O7, B18).
- iPhone Safari and Android Chrome: printing a Check result prints only the card.
- iPhone and Android: one-finger scrolling past the Places map (O9); the Places search field in the sheet with the keyboard open.
- iPhone: Reduce Transparency and Increase Contrast on Home's planner card (O27).
- iOS, Android and Windows: how the ✓ tick renders next to bold labels (O24).
- Android Chrome: a left-edge swipe inside a wide Data table doesn't trigger back navigation (B38).
- Chrome desktop and Android with TalkBack: trigger the install prompt, dismiss it, and record where focus and the next Tab or swipe land (Install button hides while focused).
- Low-end Android: Leaflet with 2,100 markers, canvas against SVG, and the map redraw on each filter or search change (B7); frame rate under the glass bars while scrolling Data.
- Low-end Android Chrome and iOS Safari: Filipino month names from Intl on the Check card and in dates.
- Chromium and WebKit at 390px: Tab to the Place and Check install rows, the closed Methods and contents summaries, About's install row and the Places map; a full ring shows (B1).
- Chrome with a Very large default font size: body text scales and hierarchy holds; /fil/ at 320px with the location capsule inside the sheet (B2).
- Keyboard only on /places: Show more then Tab; Try again after a forced failure; record document.activeElement (B8).
- Chromium and WebKit at 200% and 400% zoom: Shift+Tab through Places keeps the focused item visible (B10).
- Chromium forced-colours emulation and Windows contrast themes in Edge: segments, switch, tab bar and the Data charts' SVG fills (B11, O2).
- Reduced-motion emulation while changing a filter in Map view (B12); Map view taps on tabs while the map is under the tab bar (B4).
- Check risk step at 390x844 in EN and FIL: where the error lands after an unanswered Next (B3).
- Check's Next button under a three-line Filipino tab bar at 360 and 375px, and a two-line English bar at 390px (B14).
- iPhone Safari: Enter in the place field while the suggestion list is open. The double Enter is logged as native behaviour (B31).
- WebKit and Chromium at 390 and 393px: where Filipino tab labels break with kerning (O3).
- Chromium and WebKit: the dashed ring's dash pattern in 'Call to confirm' chips (O26).
- Filipino /data at 744 to 768px: where the chart sub-label spill lands (B39).
- 320px: 'Muntinlupa/Poblacion' in the Place H1; the Filipino Sakay capsule on two lines still reads as a button; bold rewrap of Filipino Check choices on tap.
- VoiceOver on iOS Safari and NVDA on Chrome: a location denial on /places is announced and focus lands on the field (B9).
- VoiceOver and TalkBack: the dot story's canvas label per beat, the myths and data tables, and Place's Details list (B13).
- Step 13: Lighthouse, LCP, INP and CLS; re-measure JS per page at 6f759ff and on the synthetic build (estimates came from a local dist built just before 217ea0f).
- Facility JSON gzip size at 2,100 rows (synthetic and the real list) against the 200KB budget.
- Chosen host (Q7): /fil served from fil.html beside fil/, nested 404s return 404, default Cache-Control, no injected scripts or cookies, served HTML matches dist/.
- Search Console (step 12): Google recognises the hreflang 'fil' alternates.
- Real device: OSM tile requests after Use my location, a province filter and Map (tiles requested and the Referer sent).
- Check-off build: any /check link rendered only by islands after hydration, which check-links can't see.
- An iPad-width (768 to 1024px) layout pass in EN and FIL.
