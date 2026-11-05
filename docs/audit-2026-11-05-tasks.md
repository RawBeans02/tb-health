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
- iPhone landscape: the dot story's canvas labels (the beat 5 and 6 titles, the slope chart's left labels) clear the side insets (B49).
- Android Chrome: Done or Enter in the Places field closes the keyboard (B54).
- VoiceOver swipe-scrolling on /data after a language switch: charts-ready doesn't pull the reader back, because swipes send no touch events (B6, B17, B45).
- Places map: a filter refit that lands during the reader's own animated zoom (zoom buttons, double-tap) still happens (B12).
- First Cloudflare deploy: `curl -sI` on /, /sw.js and /fil/place/x. The _headers values replace Cloudflare's defaults (no doubled nosniff, Referrer-Policy or X-Robots-Tag), _headers applies to 404s too, and the custom domain has no zone-level HSTS or Managed Transforms adding headers of their own.
- A slow cold load (cache off, Slow 4G) at 390 and 768px in Filipino: any layout shift when the web font swaps and the tab labels rewrap (B68).
- Desktop Lighthouse of /places with the list made to fail: the size of the error-path shift (B66).

## Review of steps 13 and 14 (5 November 2026)

A read-only review of step 13 (6f5a77b..1b7f618) and step 14 (1b7f618..8884d65). An adversarial verifier checked every finding, and the lead re-read the serious ones at 5180cd1. Refuted findings were dropped. The rules in "How to work" apply.

### B44. Make the forced-colours block win the cascade (High)

- **Files:** src/styles/global.css, tests/e2e/forced-colors.spec.ts
- **Fix:** The `@media (forced-colors: active)` block in global.css loads before chrome.css and ui.css. Their rules have the same specificity, so they win. The block's `forced-color-adjust: none` then leaves the author colours on screen in a contrast theme: the current tab is about 2.3:1 on black, and the switch keeps its teal. Prefix each selector in the block with `html`, or move the block to the end of ui.css.
- **Acceptance:** In forced-colours emulation (Chromium), the selected segment, the current tab and the current language compute to the same colours as a probe styled `background: Highlight; color: HighlightText`. The switch track equals Canvas when off and Highlight when on. "The colours differ" is no longer enough to pass.
- **Sources:** review of step 13, finding 0 (B11)

### B45. Keep the reader's place on /data after a language switch (High)

- **Files:** src/scripts/data.ts, src/scripts/lang.ts, src/lib/anchor.ts, tests/e2e/data.spec.ts
- **Fix:** lang.ts carries `location.hash` to the twin page. Since B6, data.ts's `toHash()` acts on any id, and it runs after `restoreAnchor()` at load and after `reapplyAnchor` on `tbph:charts-ready`. So a reader who used "On this page" to reach #d5, read on to d14 and switched language lands back on d5.
  - Skip `toHash()` while an anchor was restored.
  - Drop the hash from the twin link when `saveAnchor()` saved one. Otherwise the browser's own fragment scroll still wins.
- **Acceptance:** at 390px in Chromium and WebKit:
  - On /data, follow "On this page" to #d5 and scroll so #d14 sits at 120px. Switch to Filipino and wait for the charts island to hydrate. #d14's top stays within 2px of 120.
  - Plain deep links (/data#d16, /data#claim-…) still land on target.
- **Sources:** review of step 13, findings 12 and 13 (B6)

### B46. Let the type check run on a clean checkout (Medium)

- **Files:** package.json (or .github/workflows/ci.yml)
- **Fix:** `astro check` reads src/generated/region-counts.json. That file is git-ignored and only `prepare-data` writes it, inside `build`, so CI's type check fails on its first run. Make `check` run `node scripts/prepare-data.mjs` first. It makes no network calls.
- **Acceptance:** in a throwaway worktree with no src/generated/, `npm ci && npm run check` passes.
- **Sources:** review of step 13, finding 16 (B27)

### B47. Drive Home's waiting reveal from state, not a ref (Medium)

- **Files:** src/islands/Planner.tsx, tests/e2e/home.spec.ts
- **Fix:** A second submit while `waiting` is already true changes no state, so nothing renders. The armed ref then fires on the next unrelated render, for example a keystroke, and moves focus to "Try again" mid-word. Use a counter state (`setReveal((n) => n + 1)`) and run the effect on `[reveal]`.
- **Acceptance:** with a forced list failure:
  - submit, refocus the field and submit again: "Try again" has focus;
  - refocus the field and type: the field keeps focus;
  - submit while loading, let the load fail, submit again: "Try again" has focus.
  - Measure the error's position against the 70px / 60% rule; `toBeInViewport()` passes on any overlap.
- **Sources:** review of step 13, findings 6 and 10 (B16)

### B48. List the remaining Check-off wording in launch-check (Medium)

- **Files:** scripts/launch-check.mjs
- **Fix:** Add two ids to the Check-off list:
  - `home.bring3` ("Your TB check summary" under What to bring, on every route);
  - `notFound.lead` (C8: "These" above a single button).
  Reword and hide nothing; the owner decides (owner queue, Q9).
- **Acceptance:** launch-check for a TBPH_CHECK=false build lists both ids.
- **Sources:** review of step 13, finding 3 (B25); audit C8

### B49. Clear the side safe areas in the Data story (Medium)

- **Files:** src/styles/data.css
- **Fix:** Wrap the side padding of `.story-step` and the left and right offsets of `.story-legend` (including the 60em legend's 32px) in `max(…, env(safe-area-inset-left))` and `max(…, env(safe-area-inset-right))`.
- **Acceptance:** The rules carry the insets. The landscape device check already lists the Data story.
- **Sources:** review of step 13, finding 1 (B5)

### B50. Make the text-size and QA probes look inside clipped boxes and SVG (Medium)

- **Files:** tests/e2e/textsize.spec.ts, tests/e2e/qa.spec.ts
- **Fix:**
  - Treat only `overflow: auto` and `scroll` ancestors as scrollers.
  - Inside `hidden` or `clip` ancestors, keep checking. Report an element whose box passes the clipping ancestor's box, or whose text has `scrollWidth > clientWidth`.
  - For charts, compare each SVG `<text>` box with its `<svg>` box after the charts hydrate.
- **Acceptance:**
  - textsize.spec checks `.locate` inside `.planner-sheet` and the grouped rows at 150% and 200%.
  - On /data and /fil/data at 320px and 390px, no SVG text lies outside its chart.
  - Fix any real failure this turns up, or bring it to the lead.
- **Sources:** review of step 13, findings 2 (B2) and 19 (L2)

### B51. Put the worst-case rows and the one- and zero-row lists through the matrix (Medium)

- **Files:** scripts/prepare-data.mjs, tests/e2e/qa.spec.ts
- **Fix:**
  - In the worst-case build, put the five synthetic rows first so /places shows them.
  - Add a Places state with one result and one with none, driven through the interface, to the matrix at 320px, 390px and 1280px in EN and FIL.
- **Acceptance:** The matrix probes the worst-case rows in the Places list, the one-row count and the empty panel.
- **Sources:** review of step 13, findings 17 and 18 (L2)

### B52. Make the map and sheet tests prove B7, B12 and B30 (Medium)

- **Files:** tests/e2e/places.spec.ts
- **Fix:**
  - B7: run the marker-count test on the 2,100-row synthetic build instead of pinning "93 centers", and record the draw and filter timings with the map open.
  - B12: after fast broadening input, assert that every marker is inside `map.getBounds()`.
  - B30: put the second finger on the grab strip, so the test exercises the touch-identifier guard.
- **Acceptance:** each test fails with its fix temporarily reverted (locally, never committed) and passes at the tip.
- **Sources:** review of step 13, findings 7, 9 and 8

### B53. Make the Data claim deep-link tests wait for the charts (Medium)

- **Files:** tests/e2e/data.spec.ts
- **Fix:** Pass `charts: true` in the #claim-burden-cases and Learn-link tests, so they assert after the relayout.
- **Acceptance:** Both tests wait for the island to hydrate before they assert.
- **Sources:** review of step 13, finding 14 (B6)

### B54. Guard Safari's IME Enter on the Places field (Low)

- **Files:** src/ui/controls.tsx
- **Fix:** Skip the Enter blur when `e.isComposing || e.keyCode === 229`. WebKit ends the composition before the Enter's keydown.
- **Acceptance:** A unit or e2e test: Enter with keyCode 229 doesn't blur the field.
- **Sources:** review of step 13, finding 11 (B31)

### B55. Read the newest IntersectionObserver entry in the dot story (Low)

- **Files:** src/islands/DotStory.tsx
- **Fix:** Use the last entry the callback receives, not the first.
- **Acceptance:** A unit test with two queued entries ([leave, enter]) leaves the story active.
- **Sources:** review of step 13, finding 15 (L3)

### B56. Let the dependency audit cover Workbox (Low)

- **Files:** package.json
- **Fix:** Workbox ships in dist/sw.js but sits in devDependencies, so `npm audit --omit=dev` skips it. Move the four workbox-* packages to dependencies at the same versions. Nothing new is installed.
- **Acceptance:** `npm ls --omit=dev` lists workbox-core, -precaching, -routing and -strategies.
- **Sources:** review of step 13, finding 22 (B27)

### B57. Small records (Low)

- PLAN.md: say which jobs CI runs (D22's list plus the iphone and pixel projects), not "the same jobs".
- The note on `about.privacyServices`: after the directions hand-off, add "which then see the chosen place", as in the owner queue.
- AUDIT-build.md: record two limits:
  - L3's trace was Chromium at 6x CPU; the mid-range Android trace stays a runtime check;
  - the iphone project closes the Filters sheet with Done, because WebKit can't drive the swipe (runtime check B30).
- **Sources:** review of step 13, findings 21, 5 and 20

### Step 14 items

The step 14 review confirmed 21 of 28 findings and refuted one, which B48 had already fixed. Three depended on host behaviour, and the lead checked those against the hosts' documentation on 5 Nov 2026:
- **Netlify:** `netlify deploy` builds the project locally unless given `--no-build` (cli.netlify.com, deploy command).
- **Netlify 404s:** a 404.html below the root needs a rule such as `/en/* /en/404.html 404` (Netlify docs, redirect options, custom 404 handling).
- **Cloudflare:** for Direct Upload, wrangler asks for the production branch when it creates the project, and the docs give no default (Cloudflare Pages docs, Direct Upload).

### B58. Make Cloudflare Pages the one release path in HANDOVER (High)

- **Files:** docs/HANDOVER.md, docs/AUDIT-build.md
- **Fix:** The Netlify command as written would rebuild before uploading, without SITE_URL, TBPH_PRODUCTION or TBPH_CHECK. It would ship a non-production build, and in a launch without Check it would put the unreviewed check back. Keep Cloudflare Pages as the release path. Move Netlify and GitHub Pages to a short "Other hosts (not set up)" note that says what each needs first:
  - **Netlify:** `--no-build`, plus netlify.toml 404 rules for /fil/place/*, /place/* and /fil/* (most specific first).
  - **GitHub Pages:** it can't send our security headers or the Filipino 404s, so post-deploy-check fails there by design. It also needs .nojekyll and an Actions deploy.
  - Also say that the noindex header only works on hosts that read _headers.
- **Acceptance:** HANDOVER has no deploy command that rebuilds or skips the gate. Each other host's note says what it lacks.
- **Sources:** review of step 14, findings 18, 20 and 26; host docs above

### B59. Tie the release to the build it checked (Medium)

- **Files:** scripts/launch-check.mjs, docs/HANDOVER.md
- **Fix:**
  - HANDOVER gives one chained command: `SITE_URL=… TBPH_PRODUCTION=true [TBPH_CHECK=false] npm run build && npm run launch-check -- --release [--accept=…] && npx wrangler@4.151.3 pages deploy dist --project-name=<project> --branch=main`. The upload then runs only on the build the gate just passed.
  - In launch-check:
    - read sample and synthetic from dist/data/facilities.json, not public/;
    - decide whether Check is in the build from dist/check.html, not a regex on the nav markup, which fails open;
    - block, with no override, when dist/_headers is missing;
    - exit 2 on any unknown argument.
- **Acceptance:** Covered by B62's tests. HANDOVER's release step is the chained command.
- **Sources:** review of step 14, findings 2, 4, 5, 7 and 21

### B60. Let the owner accept only the owner's own calls (Medium)

- **Files:** scripts/launch-check.mjs, docs/HANDOVER.md
- **Fix:**
  - `--accept` takes only check-review, sample, owner-strings, review, verify, placeholders and check-mentions.
  - synthetic, no-build, no-data, domain, not-production and a missing _headers can never be accepted. Naming one exits 2.
  - HANDOVER: accepted items are printed, and the owner sends the list to the lead, who records it in decisions.md. Drop "on record".
- **Acceptance:** Covered by B62's tests.
- **Sources:** review of step 14, findings 3, 9 and 25

### B61. Clear check-review when the clinical review is recorded (Medium)

- **Files:** scripts/launch-check.mjs
- **Fix:**
  - Block check-review only while Check is in the build and a check.* string still carries [REVIEW], or the check footer's reviewer placeholder is still in. Name how many are left. The [REVIEW] flags are removed only when the owner records the review.
  - In a build without Check, leave check.* strings out of every list.
  - check-mentions stays a fixed list, updated when the owner answers Q9.
- **Acceptance:** Covered by B62's tests.
- **Sources:** review of step 14, finding 1

### B62. Unit-test the release gate (Medium)

- **Files:** scripts/launch-check.mjs (move the decision into a pure function), tests/unit/launch-check.test.ts
- **Fix:** Test each key's trigger, accepting versus refusing, unknown keys and arguments (exit 2), detecting a build without Check, check-review clearing once no flags are left, and a missing _headers.
- **Acceptance:** The tests run with `npm test`, so CI runs them.
- **Sources:** review of step 14, finding 5

### B63. Check every page type's headers after deploy, against dist/_headers (Medium)

- **Files:** scripts/post-deploy-check.mjs
- **Fix:**
  - Parse dist/_headers. For one URL of each type, compare the live headers with the expected values exactly, not by pattern: /, /fil, /places, /fil/places, a place page in each language, /data, a stand-in, /sw.js, the manifest, an /_astro file, an /icons file, /data/facilities.json and each 404. A loose pattern lets an HSTS max-age of 0 pass.
  - Add 404 probes for /fil/place/… and, in a build without Check, /fil/check.
  - Give each request a timeout and its own error handling. Exit 3 when the host can't be reached or the script fails; 1 still means problems were found.
  - Warn when the origin given differs from the build's canonical origin.
- **Acceptance:** It passes against the local server, and a hand-edited header fails.
- **Sources:** review of step 14, findings 10, 11, 12, 14 and 15

### B64. Make the outside-link inventory complete and its fetch careful (Low)

- **Files:** scripts/outside-links.mjs, docs/AUDIT-build.md, docs/HANDOVER.md
- **Fix:**
  - Also scan the island props, for example Home's route sources, which only the client renders. The Devex source makes it 28 sources on 23 sites.
  - In --fetch:
    - fall back to GET after any HEAD status that isn't 2xx or 3xx;
    - don't follow redirects: report the target, so no other host is contacted;
    - give each request a 15 s timeout;
    - send a plain project User-Agent with no personal data.
- **Acceptance:** The counts in AUDIT-build and HANDOVER match the scan.
- **Sources:** review of step 14, findings 13 and 16

### B65. Give HANDOVER the plan's full owner-only list (Medium)

- **Files:** docs/HANDOVER.md, docs/AUDIT-build.md
- **Fix:** Add a "Before launch" checklist that mirrors PLAN section 5:
  - the clinical review, including whether the saved or printed card lists risk factors such as HIV;
  - the [VERIFY] items, including the Sakay.ph links, and the placeholders;
  - the Filipino review;
  - the content conflicts (resolved, V5) and D5 (the default stands);
  - type-scale consolidation (D1);
  - lapsed accreditations (Q12), the data's age and who runs the monthly refresh;
  - real-device installs;
  - VoiceOver, TalkBack and Safari keyboard passes;
  - Search Console.

  Name the strings that still mention Check by pointing to launch-check, not with a count: "six" is now eight. In AUDIT-build, record launch-check's whole report, including its "For the owner to decide or check" part.
- **Acceptance:** Every item in PLAN section 5's owner-only list appears in HANDOVER.
- **Sources:** review of step 14, findings 22, 19 and 8

### B66. Rate AUDIT-build's rows by their open items, and give a status per rule (Medium)

- **Files:** docs/AUDIT-build.md
- **Fix:**
  - **Ratings:**
    - Privacy becomes Partial (the Q5 row and C9 are open).
    - Data integrity becomes Partial (the sample list, Q8).
    - Rows whose evidence includes device-only items become "Verified (automated) / Runtime check", as Accessibility already is.
  - **Wording:**
    - The no-cookie check runs after the first deploy; it hasn't confirmed anything yet.
    - Add B40, B20 and B28 to the deliberate changes.
  - **Per-rule appendix** (SOT section > rule > status > evidence or N/A reason):
    - cover the Lighthouse release-gate list (TBT, request counts and transfer sizes from the existing reports), the Website/SEO checklist and both Website Quality Metrics tables;
    - close the "not assessed" mascot and widget items as N/A, with reasons;
    - run Lighthouse desktop on the ten pages through lowmem-run, or list it as an accepted gap.
- **Acceptance:** No row says Verified while an open owner item undercuts it. Every SOT rule that could apply has a status.
- **Sources:** review of step 14, findings 23, 17, 24 and 27

### B67. Tell the owner how to make the first Cloudflare deploy production (Low)

- **Files:** docs/HANDOVER.md
- **Fix:**
  - The first deploy, whether `wrangler pages project create` or the first `pages deploy`, asks for the production branch. Tell the owner to enter `main`, so `--branch=main` deploys to production.
  - Add: if post-deploy-check says every page differs from dist/, run `npx wrangler@4.151.3 pages deployment list --project-name=<project>` and look for a Preview deployment.
- **Acceptance:** HANDOVER says both.
- **Sources:** review of step 14, finding 26; Cloudflare Direct Upload docs

### B68. Check B14's fallback for a first-paint shift (Low)

- **Files:** none unless a shift shows
- **Fix:** Record layout-shift entries on a cold load in Chromium and WebKit:
  - /fil/offline and a Filipino 404, at 768x1024 and 1024x768;
  - English /offline at 768px, as the control.

  If anything shifts, measure the bar before first paint with a small inline script right after the tab bar, its hash added through Astro.csp the way BaseLayout does for prepaint. Keep tabbar.ts for later changes.
- **Acceptance:** The result is recorded in the resume, and any shift is fixed.
- **Sources:** review of step 14, finding 0

## Review of the fixes B44-B68 (5 November 2026)

A read-only review of 0ef9d9e..147fba6: B44-B68 and the gate fix 8dfe088. An adversarial verifier checked all 35 findings. It confirmed 30 (two of them the same B12 problem), refuted 4, and left 1 for a browser to settle. The lead settled that one (B69) with a probe in Chromium and WebKit. The rules in "How to work" apply.

- **Done as asked:** B44, B46-B49, B51, B54-B61, B63-B65, B67 and B68. The worst-case rows can't reach a release: any such build carries `meta.synthetic`, which the gate blocks and `--accept` refuses.
- **Partly done:** B45 (B69), B50's probes and B53 (B76), B52's B12 test (B70), B62 (B74), and B66 with the verdict (B71).
- **Lead rulings:**
  - B66's loading min-height on Places is accepted. It changes only the loading state, and the result looks the same.
  - Overlapping chart text is a defect, even where the prototype has it (B78).
  - The privacy row can't be accepted away (B73).

### B69. Put the hash back in the address only after load (High)

- **Files:** src/lib/anchor.ts, src/scripts/lang.ts, a new e2e test
- **Fix:** 544802d's `replaceState` runs while the module scripts run, before parsing ends. At the end of parsing, Chromium and WebKit scroll to the fragment of the document's current address. So the reader lands on the source page's hash target, not on the saved place.
  - The lead's probe at 390px, in both engines: with the hash written during module-script time, the page ended on the old target. With it written after the load event, the place held, and the address still had the hash.
  - Only /data recovers, when `tbph:charts-ready` re-applies the place (if it fires).
  - Every switch made from an address with a hash is affected: after the skip link (`#main`, which also moves focus), Learn's contents links, the footer's Accessibility link (`/about#accessibility`) and Data's "On this page".
  - Write the hash back after the load event, or at once if `document.readyState` is `complete`. Then call `refresh()`, so the language links carry it. Also call `refresh()` on `pageshow`.
- **Acceptance:** Write the test first and confirm it fails at 147fba6. At 390px in Chromium and WebKit:
  - Go to /about through the footer's Accessibility link, and to /learn through a contents link. Scroll so a later section sits at 120px, switch language and wait for load. The section's top stays within 2px of 120, focus hasn't moved, and the address ends with the hash.
  - The B45 /data test and Q2a's shell test still pass.
  - After a back-forward return, the language links carry the hash.
- **Sources:** review of the fixes, findings behaviour-1 and behaviour-3; the lead's probe (scratchpad, not in the repo)

### B70. Make the B12 refit test able to fail (Medium)

- **Files:** tests/e2e/places.spec.ts, docs/AUDIT-build.md
- **Fix:**
  - The test switches between "Bangued" (one row, fitted at maxZoom 13) and every row (about zoom 6). That jump is more than Leaflet's zoomAnimationThreshold of 4. So Leaflet resets the view instantly, with or without `animate: false`, and the path that drops a refit never runs.
  - Drive two refits that Leaflet would animate: fits no more than 4 zoom levels apart and within a screen of each other, with the second inside the 250 ms zoom animation. Two neighbouring NCR cities would do, or Region "Cordillera (CAR)" and then all. Drop the 800 ms sleep.
- **Acceptance:** The test fails with `animate: false` removed from placesMap.ts (record that run) and passes with it. AUDIT-build.md:12 no longer says every item came with its test.
- **Sources:** review of the fixes, findings behaviour-2, tests-1 and docs-7

### B71. Make AUDIT-build's verdict and ratings match the open items (Medium)

- **Files:** docs/AUDIT-build.md
- **Fix:**
  - **Release status:** add "the v7 import (V1-V3: dark mode and the v7 wording; L1, L9, B22), or the owner's decision to launch on v6".
  - **Dark mode:** rate it Missing. Replace "charts keep light colours meanwhile" and the accepted risk "Charts keep light colours in dark mode until v7" with "No dark mode until the v7 import (V2)".
  - **Risks if it launched as it stands:** add:
    - the Filipino strings without the native-speaker review (D10);
    - the unrecorded reuse terms (O12);
    - the outside links never fetched (L8);
    - the lapsed accreditations shown as listed (Q12, D24);
    - the saved card's risk-factor rows, such as HIV, pending the clinical review (O11).
  - **Appendix:** rules that an open owner item undercuts become Partial, naming the item:
    - Hick's Law (O8);
    - Empty states (O1);
    - Hover states (O5);
    - the fingerprint row (the em dashes under V3 and C5; O27);
    - Mobile menu and Mobile responsiveness (O3, O4).
  - **Master rows:**
    - Familiar interaction patterns (O7) and Responsive become Partial. Responsive's "Accepted" (O3) is still pending the owner, and O4 is open.
    - Accessibility names O2, O13, O14 and the statement's [email] placeholder.
    - Privacy and Data integrity name the card's risk-factor row.
  - **Line 12:** the code fixes carry tests, except as B70 says.
  - **Figures:** take them from the step 14 gate:
    - CLS ≤ 0.05 (Install 0.059 while its prompt shows);
    - JS ≤ 31.6 KB (Data 50.5 KB);
    - precache 60 files, 1,144 KB;
    - one island per page, two on Data;
    - Lighthouse "on a production-mode stand-in build";
    - the rest of the figures in finding docs-8.
  - **B50's record:** the "0" label was drawn into the panel's padding (the svg has `overflow: visible`), not cut off. The fix moves it about 4px, from centred to starting at x=0, on charts under 560px. d17's Filipino legend overflow was real.
  - **Gate:** record the commit the step 14 gate ran on, not only the branch.
- **Acceptance:** No row or appendix rule says Verified while an open owner item undercuts it. The release status names the v7 import. The figures match the gate.
- **Sources:** review of the fixes, findings docs-1, docs-2, docs-3, docs-7 and docs-8; the layout and docs reviewers' notes

### B72. Make the release path safe on the shared Mac (Medium)

- **Files:** docs/HANDOVER.md, package.json
- **Fix:**
  - **Release from a clean checkout** of the commit being released, never from the builder's working checkout: a fresh worktree or clone of `main`, then `npm ci`. Another session's build or test run can rewrite dist/ between the gate and the upload, and uncommitted edits would ship.
  - **Put only the build under the guard:** `SITE_URL=… TBPH_PRODUCTION=true [TBPH_CHECK=false] GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh npm run build && npm run release-check [-- --accept=…] && npx wrangler@4.151.3 pages deploy dist --project-name=<project> --branch=main`. lowmem-run starts its job in the background (`set -m; … &`), so a wrangler prompt inside it would stop the job and keep holding the machine-wide lock.
  - **Add `"release-check": "node scripts/launch-check.mjs --release"`.** Then a dropped `--` loses only the accept list, and the gate still blocks.
  - **One-time setup** before the first release:
    1. `npx wrangler@4.151.3 login`;
    2. `npx wrangler@4.151.3 whoami` shows the TB Health account (an exported CLOUDFLARE_API_TOKEN overrides the login on a shared Mac, so unset it);
    3. `npx wrangler@4.151.3 pages project create <project> --production-branch=main`. That removes the production-branch prompt; keep B67's note as the fallback.

    Check these commands and flags against Cloudflare's wrangler docs before writing them.
  - **Wrangler's usage telemetry:** say, from the docs, whether 4.151.3 sends it by default and how to turn it off (for example `WRANGLER_SEND_METRICS=false` in the release command), the way HANDOVER discloses npm audit.
  - **Placeholder:** use one the gate blocks, `https://your-domain.example`, not `https://your.address`.
  - **Step 3:** preview links are public to anyone who has them. noindex only keeps them out of search, and only on a host that reads _headers. Share them only with reviewers.
  - **Step 4:** exit 3 means the check is incomplete: run it again if the host didn't answer, and otherwise fix the cause on the "failed:" lines. Accept only keys the gate lists as open, since naming another exits 2. If every page differs, first make sure dist/ is still the build that was deployed.
- **Acceptance:** HANDOVER's commands work as written from a clean checkout. `npm run release-check` exits 1 on the current build and 2 with `-- --bogus`.
- **Sources:** review of the fixes, findings docs-4, docs-6, docs-9, gate-1 and gate-3; the gate and docs reviewers' notes

### B73. Give the privacy row its own block, one that can't be accepted (Medium)

- **Files:** scripts/launch-check.mjs, tests/unit/launch-check.test.ts, docs/HANDOVER.md, the note in src/content/about.ts
- **Fix:**
  - owner-strings covers `about.privacyServices` (Q5) together with the Filipino descriptions, and About leaves the row out while it's empty (About.astro:20). So accepting owner-strings for the descriptions would launch without saying who else sees what: the host, OpenStreetMap and Google Maps. RA 10173's transparency rule needs that said.
  - Move `about.privacyServices` into its own block, privacy-row, and leave it out of ACCEPTABLE. This is the lead's call; the owner can overrule it.
  - Correct the about.ts note:
    - Google Maps sees the chosen place.
    - For Sakay.ph, the site copies the address and opens sakay.ph, which sees it only if the reader pastes it there.

    The lead's owner-queue wording was wrong, and is corrected.
- **Acceptance:** Unit tests: privacy-row blocks while the row is empty and clears once it's supplied, and `--accept=privacy-row` exits 2.
- **Sources:** the gate and docs reviewers' notes

### B74. Harden the gate's checks (Low)

- **Files:** scripts/launch-check.mjs, scripts/post-deploy-check.mjs, scripts/prepare-data.mjs, tests/unit/launch-check.test.ts, a Check content test
- **Fix:**
  - **check-review:**
    - Also count as open any check.* string whose en or fil text still has the bracketed placeholder ("[partner clinicians — pending]", "[mga katuwang na doktor — nakabinbin]").
    - Pin Check's [REVIEW] flags in a unit test, as learn.test.ts pins L6's, so a refactor can't clear the gate unnoticed.
  - **Headers:** compare dist/_headers exactly with `headersFile(true)`, not only its presence. Any difference blocks and can't be accepted.
  - **Check detection:** read both dist/check.html and dist/fil/check.html, and block if they disagree.
  - **check-mentions:** block only while its list isn't empty.
  - **In a build without Check:** also drop `meta.checkTitle` and `meta.checkDescription` from the lists.
  - **The em-dash list:** also cover the five page titles built in views with " — TB PH" (About, Place, Data, Install, Learn).
  - **Small fixes:**
    - KNOWN's `datapage.method2` becomes `dataPage.method2`;
    - "1 check string still carries";
    - `today` is the Asia/Manila date.
  - **Test main():**
    - export `readBuild(distDir)` and test it on a temporary folder: with and without check.html and _headers, and with sample and synthetic meta;
    - add one spawnSync test each for exit 2 (`--bogus`, `--accept=domain`) and exit 1;
    - build the not-production and domain cases from `headersFile(false)` and `PLACEHOLDER_SITE`.
  - **The main-module guard** in launch-check, post-deploy-check and prepare-data compares `realpathSync(process.argv[1])` with `fileURLToPath(import.meta.url)`. Through a symlinked path it now skips main() and exits 0.
- **Acceptance:** A unit test for each change.
- **Sources:** review of the fixes, findings gate-2, gate-4, gate-5, gate-6, gate-7 and postdeploy-3; the gate and docs reviewers' notes

### B75. Make post-deploy-check and outside-links report fully (Low)

- **Files:** scripts/post-deploy-check.mjs, scripts/outside-links.mjs, scripts/serve-dist.mjs, tests/unit/post-deploy-check.test.ts
- **Fix:**
  - **Five failures in a row:** stop requesting, but still print the problems and errors found so far, and exit 3.
  - **The origin argument:** accept only http: and https:. Otherwise print the usage line and exit 2.
  - **outside-links --fetch:**
    - When HEAD answers 400 or more and the GET then fails, report the GET's failure.
    - Report `error.cause.code` (ENOTFOUND, ECONNRESET, CERT_…) instead of "no answer".
  - **outside-links header comment:** the OSM attribution and the sakay.ph target come from JS and aren't in the inventory.
  - **serve-dist.mjs:** join a header set by two matching rules, as Cloudflare does. Now the last rule wins.
  - **The resume:** record how the local HSTS max-age=0 failure was produced. Editing dist/_headers can't produce it, because the check reads the same file the server sends.
- **Acceptance:** Unit tests for the stop and for the origin check.
- **Sources:** review of the fixes, findings postdeploy-1, postdeploy-2 and postdeploy-4; the post-deploy reviewer's notes

### B76. Make the tests wait for the right thing and probe what they should (Low)

- **Files:** tests/e2e/home.spec.ts, data.spec.ts, probes.ts, qa.spec.ts, seo.spec.ts, places.spec.ts, vitest.config.ts, docs/PLAN.md
- **Fix:**
  - **home.spec, B47's second test:** wait for hydration (the Planner island without `ssr`) before filling the field.
  - **data.spec, the B45 test:** wait for the charts' relayout (each viewBox width equals its rendered width) before scrolling, and drop the 300 ms sleep.
  - **data.spec, the claim deep links:** #claim-burden-cases waits for hydration with no cap (`charts: true`). Keep the capped wait only for #claim-burden-deaths, and say why there.
  - **probes.ts:**
    - skip aria-hidden subtrees only when they carry no text;
    - check SVG text above and below its svg too;
    - on /data, run outsideProblems after the charts hydrate and lay out.
  - **qa.spec and seo.spec:** read dist/data/facilities.json, not public/.
  - **places.spec, the marker test:**
    - compare the heading with all rows and data-markers with the located rows;
    - add a synthetic-build run of it to PLAN §5's fixture runs.
  - **qa.spec, the one-result query:** take it from the build's own data.
  - **vitest.config.ts:** `passWithNoTests: false`.
  - **The B30 skip:** update its reason.
- **Acceptance:** Each test still passes, and fails with its fix reverted where it guards one.
- **Sources:** review of the fixes, findings tests-2 to tests-9; the tests reviewer's notes

### B77. Show the focus ring on selected items in forced colours (Low)

- **Files:** src/styles/global.css, tests/e2e/forced-colors.spec.ts
- **Fix:** The forced-colours rule sets `forced-color-adjust: none` on the selected segment, the current tab, the current language and the current contents link. So their focus ring keeps the author Ink (#14212B) on a black or #202020 Canvas, about 1.3:1. Add `outline-color: CanvasText` to that rule. This dates from B11, not B44.
- **Acceptance:** In forced-colours emulation, a focused selected item's outline-color equals a CanvasText probe's.
- **Sources:** review of the fixes, finding layout-1 (refuted as out of B44's scope; the defect holds)

### B78. Check the chart axis labels at phone widths (Low)

- **Files:** src/lib/charts/primitives.ts and tests/e2e/probes.ts, only if the check shows overlap
- **Fix:**
  - The review estimates, from the code's text-width estimate:
    - d17's "US$50M", "US$100M" and "US$150M" overlap by about 7-11px at 390px and 18-30px at 320px;
    - d6's labels overlap by 9-13px at 320px;
    - d15's bullet label can run into its value.
  - Screenshot /data d6, d15 and d17 at 320 and 390px in EN and FIL. If labels overlap:
    - drop any axis label that would start within 4px of the previous one, and keep every gridline;
    - put a bullet's value on its own line when it doesn't fit;
    - add a check for overlapping text boxes in one svg to the probe.

    That keeps the approved look wherever the labels fit.
- **Acceptance:** The screenshots are in the resume, and the QA matrix finds no overlapping text.
- **Sources:** review of the fixes, finding layout-2 (refuted as a design call; the lead rules overlapping text a defect)

## Review of the fixes B69-B78 (5 November 2026)

A read-only review of 147fba6..75ce0d1. An adversarial verifier checked all 25 findings. It confirmed 22 and refuted 3, and none was High. The docs reviewer checked HANDOVER's wrangler commands against developers.cloudflare.com. The lead looked at the B78 screenshots: the overlaps are gone, and every gridline stays. The rules in "How to work" apply.

- **Done as asked:** B69, B70, B73, B74, B75, B77, and B72's release-check script. The gate passes no build it must block, and blocks no valid production build.
- **Partly done:** B71 and the final-gate record (B80), B72's HANDOVER (B79), B76 (B84) and B78 (B81). B82 and B83 tighten the gate and the B69 and B77 tests.
- **Owner decision:** Q7 is answered. The host is Cloudflare Pages, in a TB Health-only account (decisions.md, 5 Nov). The domain is still open.
- **Lead ruling:** the monthly chart (d3), 2px taller so its month labels stay inside, is accepted.

### B79. Finish the release path in HANDOVER (Medium)

- **Files:** docs/HANDOVER.md, docs/PLAN.md, docs/AUDIT-build.md, package.json (if Astro's telemetry needs it)
- **Fix:**
  - **A fresh folder each release.** A second release run from the project folder fails to clone into the existing tb-health-release folder. The next pasted line then `cd`s into the old clone, and the old commit ships. Post-deploy-check passes too, because it compares against that same old dist/. Use one line, with a dated folder outside the project, so a failed clone stops it: for example `D=~/Documents/tb-health-release-$(date +%Y%m%d-%H%M) && git clone … "$D" && cd "$D" && … && npm ci`. Old release folders go to the Trash with `/usr/bin/trash`.
  - **Check the account at every release, not once.** The login is stored in a file every session of this macOS user reads, and CLOUDFLARE_API_TOKEN or the CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL pair override it. Before each deploy: `unset CLOUDFLARE_API_TOKEN CLOUDFLARE_API_KEY CLOUDFLARE_EMAIL CLOUDFLARE_ACCOUNT_ID && npx wrangler@4.151.3 whoami`, and stop unless it shows the TB Health account. Name the API key and email pair in the setup step too. In PLAN's Q7, say "login" where it says the owner holds a token, so the two agree.
  - **Telemetry:**
    - Put the disclosure above setup step 1.
    - Set `WRANGLER_SEND_METRICS=false` on every wrangler command in HANDOVER, or export it once at the top of the release shell.
    - Don't use `wrangler telemetry disable`. It's global for this macOS user, so it would change the KitaMo builders' setting too.
    - Check Astro 7's docs: if its telemetry is on by default, set `ASTRO_TELEMETRY_DISABLED=1` in the project's npm scripts (not `astro telemetry disable`, which is global for the same reason), and disclose it with npm audit and wrangler.
  - **The accept list:** show the whole one-line command with it in place, for example `… && npm run release-check -- --accept=sample && WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 pages deploy …`.
  - **A clean clone builds what's committed.** Say that the real facility list (Q8) has to be committed to `main` before a release, or the release builds the sample.
  - **Ctrl-C during the guarded build:** lowmem-run puts the job in its own process group, and its exit trap only removes the lock. So Ctrl-C ends the guard and frees the lock while the build keeps running. Say so in HANDOVER: wait for the build to end before starting another heavy job. Don't change lowmem-run.sh: it came with the project setup, so ask the lead first.
  - **The owner-only list:** add the v7 import, or the owner's decision to launch on v6.
  - **Q7:** record the owner's answer. HANDOVER's "the recommended answer to Q7" becomes the decision. AUDIT-build's verdict waits on the domain, not the host. PLAN §7.1 marks Q7's host as answered.
- **Acceptance:** Pasting the release block twice, on two different days or minutes, builds the newer commit each time. Every wrangler command carries the account check and no telemetry. PLAN, HANDOVER and AUDIT-build agree on Q7.
- **Sources:** review of the B69-B78 fixes, findings docs-1, docs-2, docs-8 and docs-9; the docs reviewer's notes; the owner's Q7 answer

### B80. Make AUDIT-build's remaining figures and ratings match (Medium)

- **Files:** docs/AUDIT-build.md
- **Fix:**
  - **SEO:** wherever it says "SEO 100" or "100 … everywhere" (lines 57, 60, 119, 209), say "SEO 100 on the ten measured pages; 92 on /fil/data, with no Filipino description until Q3". Don't count SEO towards the Performance row's Verified while Q3 is open. The SEO row says "the ten pages below".
  - **Partial, naming the open item:**
    - Broken links: the 28 outside sources aren't fetched until the owner's OK (L8, B64);
    - the Lighthouse audit rule: "on a production-mode stand-in build, before B68 except the rechecks; rerun on the release build and the deployed site";
    - Reliability (O6, O21) and Jakob's Law 2 (O7).
  - **Tests / CI:** "verified locally; the first GitHub run waits for the merge to main (D22)", not a runtime check.
  - **Wording:**
    - "one source a second (HEAD, then GET at once after a 4xx or 5xx)", here and in the script's comment;
    - Mobile menu cites only O3;
    - the audit record's "Branch / commit" names the gate's commit and the docs commit;
    - B78's probe flags two labels whose boxes cross by more than a third of a line's height;
    - text size is tested in Chromium only, so B76's "WebKit passed" applies to the other specs.
- **Acceptance:** No row or rule says Verified while an open owner item undercuts it, and every SEO figure agrees.
- **Sources:** review of the B69-B78 fixes, findings docs-3 to docs-6 and docs-11 to docs-14; the docs and charts reviewers' notes

### B81. Keep d15's value on one line wherever it fits (Medium)

- **Files:** src/lib/charts/primitives.ts, tests/unit/panels.test.ts
- **Fix:**
  - The bullet rule uses the bold estimate (×1.06) plus 12px. Your own measurement shows that estimate runs about 6% wide for these strings, so the value drops to its own line where it fits. That happens in English at 320px and in Filipino at 375px, and it changes the approved one-line look and adds 22px.
  - Calibrate the rule; without the bold factor it matches the measured 290px. Confirm with getComputedTextLength() in a browser.
  - Pin the chart widths 252 (EN on one line, FIL on its own line), 292 (FIL on its own line) and 307 (FIL on one line).
  - **B78's unit test:**
    - count the gridlines (four for d17, five for d6);
    - fix the "five gridlines" comment;
    - add the real phone chart widths, 252 and 322.
- **Acceptance:** The value moves only where label and value would touch. The unit test pins those widths and the gridline counts.
- **Sources:** review of the B69-B78 fixes, findings charts-1 and charts-6

### B82. Close the gate's last gaps (Low)

- **Files:** scripts/launch-check.mjs, tests/unit/launch-check.test.ts
- **Fix:**
  - **privacy-row by id:**
    - pin `about.privacyServices` with a test against the real dictionaries, as check.test.ts pins Check's flags;
    - have assess() raise privacy-row when the id isn't found at all, so a renamed row can't drop into the acceptable owner-strings.
  - **The reviewer-placeholder check:** match without the em dash, for example `/\[(partner clinicians|mga katuwang na doktor)\b[^\]]*\]/`, because the V3 pass will reword that dash. Add a case with the dash replaced.
  - **The V3 em-dash list:**
    - also cover PlaceShell.tsx's runtime title (`${name} — TB PH`);
    - ignore comments when counting view titles.
  - **Check detection:** tie it to `build.format: 'file'` with a comment and a test.
  - **The exit-1 test:** run it on a temporary dist/, not the checkout's own, so a checkout holding a clean production build doesn't fail it.
- **Acceptance:** A unit test for each change.
- **Sources:** review of the B69-B78 fixes, findings gate-1 and gate-2; the gate reviewer's notes

### B83. Make the B69 and B77 tests prove their fixes (Low)

- **Files:** tests/e2e/shell.spec.ts, tests/e2e/forced-colors.spec.ts
- **Fix:**
  - **The back-forward check:** it passes with or without the pageshow refresh, because the twin's links were already right. Check the source page instead: after the switch, go back and expect its Filipino link to end with the hash. To make it independent of bfcache, set a stale href in the page, dispatch `new PageTransitionEvent('pageshow', { persisted: true })`, and expect refresh() to restore it.
  - **Waits:** replace the 300 ms sleep after load with a condition: the hash back in the address, then two animation frames.
  - **The skip link:** add its case (`#main`, which has tabindex -1, so a fragment jump would move focus there). #accessibility and #l2 have no tabindex, so the focus check can't fail on them.
  - **B77:** also assert `outlineStyle` is solid, so the ring is really drawn, and cover `.toc-wide a[aria-current]`.
- **Acceptance:** Each check fails with its fix reverted (record the runs).
- **Sources:** review of the B69-B78 fixes, findings behaviour-1 and behaviour-2; the behaviour reviewer's notes

### B84. Probe /data after its charts settle (Low)

- **Files:** tests/e2e/textsize.spec.ts, tests/e2e/probes.ts, tests/e2e/qa.spec.ts
- **Fix:**
  - **textsize.spec:** in overflow(), await chartsSettled() before the scroll check and outsideProblems. Or make outsideProblems await it itself.
  - **chartsSettled():**
    - also wait until #d1's viewBox width equals the measured panel width (max 240), because at 1280px the 928px prerender already fits and the wait passes before the relayout;
    - its doc comment says it scrolls #d1 into view.
  - **The one-result query:** pick it with the app's own matching (norm and contains from src/lib/core/text.ts, over name + city + province), so exactly one row matches.
- **Acceptance:** The QA and text-size runs on /data probe the phone layout. The one-result case matches exactly one row on the sample and synthetic builds.
- **Sources:** review of the B69-B78 fixes, findings charts-3, charts-4 and charts-5

### B85. Say which Node to use when the wrong one runs (Low)

- **Files:** package.json, a new scripts/check-node.mjs
- **Fix:**
  - On Node 20, the Mac's Homebrew default, `npm run dev` fails with `ERR_UNKNOWN_FILE_EXTENSION` on src/lib/core/facility.ts. Only Node 22.18 or later strips TypeScript types. The owner's preview hit this on 5 Nov 2026.
  - Add `"engines": { "node": ">=22.18" }`.
  - Run a tiny check first in dev, build, check and the release scripts: `node scripts/check-node.mjs && …`. When `process.versions.node` is older, it prints "TB Health needs Node 22 (see .nvmrc): run nvm use" and exits 1.
  - The check has to be its own file, with no imports: a check at the top of prepare-data.mjs would run only after its static .ts imports had already failed.
- **Acceptance:** `npm run dev` under Node 20 prints that line and exits 1. Under Node 22 nothing changes.
- **Sources:** the owner's preview, 5 Nov 2026

## Review of the fixes B79-B85 (5 November 2026)

A read-only review of 75ce0d1..16c4f36. An adversarial verifier checked 11 findings. It confirmed 8 (one Medium, seven Low) and refuted 3. All seven items are done as asked.
- The reviewers checked HANDOVER's shell lines in zsh and bash 3.2 with stubs.
- They checked wrangler's and Astro's facts against developers.cloudflare.com and astro.build.
- B85's floor of 22.23.4 instead of 22.18 is accepted: @astrojs/preact 6.1.1 needs it, and .nvmrc pins it.

### B86. Keep test copies out of search, and keep Cloudflare's login out of other projects (Medium)

- **Files:** docs/HANDOVER.md, docs/PLAN.md, docs/AUDIT-build.md
- **Fix:**
  - **Test copies.** HANDOVER calls a pages.dev deploy a test, but the only command it gives is the production line: `TBPH_PRODUCTION=true` and `--branch=main`. That makes the project's production site at `<project>.pages.dev`, with no noindex, an open robots.txt, a sitemap and self-canonicals. So a "test" would be the public, indexable TB PH, with the sample list and whatever was accepted.
    - Give test copies their own line: a build without `TBPH_PRODUCTION` (it carries noindex) deployed with `--branch=test`. That's a preview, at `https://test.<project>.pages.dev`; check the address format and Cloudflare's own noindex on previews against its docs.
    - A test copy needs no release gate and no accept list. `npm run launch-check` shows what's open.
    - Say that post-deploy-check flags the noindex on a preview by design.
    - Say plainly that a `--branch=main` deploy is the public launch. If no domain is attached yet, that's `<project>.pages.dev`. Run it only when launching.
  - **Credentials (lead ruling, replaces the `wrangler login` setup).** `wrangler login` stores its login in a file that every session of this macOS user reads, KitaMo's included. Logging in for TB Health would replace any other project's Cloudflare login, and the other way round. Do it the way pushes already work (`GH_TOKEN=… git push`):
    - The owner creates a Cloudflare API token in the TB Health account with only the permissions Pages needs. Check them in Cloudflare's docs: Pages Edit, plus whatever whoami needs to name the account.
    - The owner stores it in the Mac's Keychain themselves: `security add-generic-password -a "$USER" -s tbhealth-cloudflare -w`, where a final `-w` makes it prompt.
    - Every wrangler command in HANDOVER passes it for that command only: `CLOUDFLARE_API_TOKEN=$(security find-generic-password -s tbhealth-cloudflare -w)`.
    - Every wrangler command also pins the account with `CLOUDFLARE_ACCOUNT_ID=<TB Health account ID>`, which Cloudflare documents as always respected.
    - Never run `wrangler login`.
    - Keep the whoami check at each release. Also unset the deprecated CF_API_TOKEN, CF_API_KEY, CF_EMAIL and CF_ACCOUNT_ID.
    - The token and the account ID go in no file in the repo.
    - PLAN's Q7 goes back to "a token held by you" (B79 had made it "login").
  - **The deploy line carries the check itself.** Put the unset and the pinned account on the deploy line too, not only in step 2. A second Terminal tab, or a skipped step 2, then can't deploy with another account's token.
- **Acceptance:** HANDOVER has no `wrangler login`. Every wrangler command carries the token from the Keychain, the pinned account and `WRANGLER_SEND_METRICS=false`. A test copy can't reach the production branch, and the public launch is named as such.
- **Sources:** review of the B79-B85 fixes, findings release-1 and release-3; the release reviewer's notes (the global login file, auth profiles)

### B87. Small records and guards (Low)

- **Files:** package.json, scripts/launch-check.mjs, scripts/check-node.mjs, docs/HANDOVER.md, docs/AUDIT-build.md, tests/e2e/qa.spec.ts, _handoff/JR-RESUME.md
- **Fix:**
  - **LAUNCH_CHECK_DIST:**
    - release-check ignores it: `… && LAUNCH_CHECK_DIST= node scripts/launch-check.mjs --release`;
    - main() prints the folder it judged to stderr whenever the variable is set;
    - add it to the unset list.
  - **check-node:**
    - its message names the floor ("needs Node 22.23.4 or later");
    - prepare-data and check-links run it first too, since both import .ts;
    - the records say which scripts run it, not "every script".
  - **Step 1:**
    - `git --no-pager log --oneline -1`, so a pager can't stop the chain;
    - `git clone --branch main`, so the branch is explicit.
  - **Ctrl-C:** say that after stopping a guarded build you start again from step 1, in a new folder. The stopped build keeps running and could still write into the old folder's dist/. Don't change lowmem-run.sh.
  - **AUDIT-build:**
    - Search Console is release step 7;
    - the lead's fix items that are in now run to B87;
    - the CDN line's "after Q7" becomes "after the first deploy".
  - **JR-RESUME:** item 6 records Q7's host as decided.
  - **B83:** repeat the pageshow revert run with all three cases, and record it.
  - **qa.spec:** throw a clear message if no row qualifies for the one-result query.
- **Acceptance:** Unit tests for the release-check override and the check-node message. The records match the code.
- **Sources:** review of the B79-B85 fixes, findings gate-1, gate-3, gate-4, release-4, release-6 and release-7; the reviewers' notes

## Review of the fixes B86-B87 (5 November 2026)

A read-only review of 16c4f36..e8812b5. The reviewers ran HANDOVER's lines in zsh 5.9 and bash 3.2 against stub `security` and `npx` commands with a fake token, and simulated Ctrl-C with expect. Nothing touched the real Keychain, wrangler or the network.
- A verifier checked 13 findings: three Medium, one of them still to be settled by a real run.
- B87 is done. B86 needs B88 before the owner stores a real token.
- The scripts and docs agree everywhere else.

### B88. Tighten the Cloudflare token lines before the owner uses them (Medium)

- **Files:** docs/HANDOVER.md, docs/PLAN.md, docs/AUDIT-build.md
- **Fix:**
  - **One form for every wrangler line**, in a subshell so nothing outlives it:
    `( T=$(security find-generic-password -s tbhealth-cloudflare -w) && [ -n "$T" ] && CLOUDFLARE_API_TOKEN="$T" CLOUDFLARE_ACCOUNT_ID=<account-id> WRANGLER_SEND_METRICS=false WRANGLER_SEND_ERROR_REPORTS=false env -u CLOUDFLARE_API_KEY -u CLOUDFLARE_EMAIL -u CLOUDFLARE_API_BASE_URL -u CF_API_TOKEN -u CF_API_KEY -u CF_EMAIL -u CF_ACCOUNT_ID -u CF_API_BASE_URL npx wrangler@4.151.3 … )`
    - The assignments before `env` keep the token out of env's argument list. `ps` shows argument lists to every local account.
    - `[ -n "$T" ]` stops on an empty Keychain item. Otherwise wrangler would treat the empty token as none and fall back to a stored or new login.
    - In the subshell, T is gone even after Ctrl-C in zsh, which skips a trailing `; unset T`. The line also returns wrangler's exit status, not unset's.
    - Error reports are off, and the API base-URL variables are cleared. Check `WRANGLER_SEND_ERROR_REPORTS` and `CLOUDFLARE_API_BASE_URL` in Cloudflare's docs first, and add them to "What the release tools send".
  - **Setup:**
    - **A warm-up with no token first:** `WRANGLER_SEND_METRICS=false npx wrangler@4.151.3 --version`. That answers npx's "Ok to proceed?" and runs the package install with no token in the environment.
    - **The token form:** Account Resources: Include, the TB Health account only. Permission: Account › Cloudflare Pages › Edit, plus Account Settings: Read only if whoami can't name the account.
    - **Storing it:** the prompt asks twice ("password data for new item", then "retype"). Paste the Cloudflare token both times, not the Mac password. To replace it later, add `-U`. Afterwards copy something else, so the token leaves the clipboard; Universal Clipboard shares it with nearby Apple devices.
    - **Say plainly who can read it.** Any program running as this Mac user can read the stored token, as it can gh's. The builder and lead sessions never ask for it, and only the release lines read it. For a prompt on every read, create the item with `-T ""`. Then every release needs someone at the Mac to click Allow, so it can't be run over Remote Control.
    - **Where the account ID is:** Workers & Pages › Account details, or search "Copy account ID" from Account home. An account with no domain has no zone Overview.
    - **A whoami step** between storing the token and creating the project. Stop unless it names the TB Health account, with the same ID as in the lines.
    - **The address `pages project create` prints.** The pages.dev subdomain is the project name only when that's free; otherwise Cloudflare adds characters. Use that subdomain wherever HANDOVER says `<your-project>.pages.dev`, and `test.<that subdomain>` for test copies. `--project-name` keeps the project name.
  - **Test copies:**
    - Start the test build with `TBPH_PRODUCTION=`, so an exported value can't make it a production build.
    - Say the preview is public to anyone who has its address or guesses it, and it can carry the unreviewed Check. Share it only with reviewers, or turn on the project's preview access policy in the dashboard. Cloudflare Access is free for small teams but needs its own setup.
    - Update PLAN's risk row "Unreviewed Check reachable on a public preview" to match.
- **Acceptance:** Stub runs in zsh and bash 3.2 show:
  - no argument list carries the token;
  - an empty or missing item stops before npx;
  - T isn't set in the shell after Ctrl-C;
  - the line returns wrangler's exit status.

  The records (PLAN, AUDIT-build) match HANDOVER.
- **Sources:** review of the B86-B87 fixes, findings release-1 to release-10; the release reviewer's notes (Keychain access, warm-up, base URL)

### B89. Small script fixes (Low)

- **Files:** scripts/check-node.mjs, tests/unit/check-node.test.ts, tests/unit/launch-check.test.ts
- **Fix:**
  - **check-node's comparison:** compare the core version only (`process.versions.node.split('-')[0]`), so a prerelease below the floor stops. Add '22.23.0-pre' to the stop list and '22.23.10' to the pass list.
  - **check-node's comment:** post-deploy-check runs it as a release script; it imports no TypeScript.
  - **The release-check test:** also assert a positive, that stdout has "launch-check: what is still open before launch". Then the test can't pass when launch-check never ran.
- **Acceptance:** The unit tests above.
- **Sources:** review of the B86-B87 fixes, findings scripts-1, scripts-2 and scripts-3
