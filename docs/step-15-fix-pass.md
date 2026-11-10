# Step 15: the v8 fix pass

The owner's brief, sent to the lead on 10 November 2026 with `TB-PH-v8.zip` and copied here word for word. The owner's decisions 1 to 9 are V6 to V14 in `docs/decisions.md` (its "decision 2" is V7). The design reference is `design/v8/`; the skills are in the checkout's `.claude/skills/`, which isn't in the repository. Preview deploys follow HANDOVER's "Test copies".

## Then: the builder runs step 15, the fix pass, on `build/15-fix-pass`
The same rules apply as before:
- It reports when done.
- It stops only for an open question, new text, an outside service or a data download, or failing tests it can't fix.
- It writes no new copy. Every string it needs is in the v8 pack or above.

**15.1 Copy and titles**
- Move the copy dictionaries to the v8 pack.
- Change the title and `og:title` pattern on every route, English and Filipino.
- Put "Aksesibilidad" in the Filipino footer and the About heading.
- Done when:
  - the parity test passes against the v8 pack
  - a scan of `dist/` finds no "—" in any text node, `<title>`, meta description or `og:*` tag
  - the head-tag tests pass on every route

**15.2 Dark mode**
- **Tokens:** port the tokens from `design/v8/theme.css` into `tokens.css` and keep the light values identical. Add `<meta name="color-scheme" content="light dark">` and one `theme-color` per scheme: `#F1F3F4` for light, `#0E1417` for dark. The manifest stays light.
- **Charts:** colour them through classes or `currentColor` so the tokens reach SVG.
- **Dot story:** the canvas switches palette and repaints when the system appearance changes. The dark values are in `design/v8/DotStory.dc.html` › `applyScheme`:
  - canvas `#0E1417`
  - ink `#E7ECEF`
  - dots `#8798A3`
  - muted `#97A4AB`
  - separator `#2A353B`
  - red `#F26A72`, which is D14's TB red in dark mode
- **Glass:** the header and tab bar glass use the dark glass tokens, and still turn solid under reduced transparency, increased contrast, or no blur support.
- **Fixed colours:** keep the three listed in decision 2.
- Done when:
  - a contrast test passes AA for every dark token pair (the pairs are in HANDOFF › v7)
  - Playwright takes dark screenshots of every route, in English and Filipino, at 390 and 1280px
  - axe passes in dark mode
  - light-mode screenshots still match the previous ones

**15.3 Phone feel**
Run the `mobile-native` skill on the codebase and apply its fixes. At minimum:
- every `:hover` style sits behind `@media (hover: hover) and (pointer: fine)`
- `-webkit-tap-highlight-color: transparent`, plus a visible pressed state (`:active`)
- `touch-action: manipulation` on controls
- `100dvh` for page shells and anything pinned to the bottom, and `100svh` for the dot story's sticky stage
- no overscroll in the installed app (`@media (display-mode: standalone)`)
- `user-select: none` on controls only
- inputs stay at 16px or larger

Done when nothing from the skill's "Never ship" table is left in `src/`, with the grep commands recorded in the report.

**15.4 Worst-case data**
Run `break-ui` on the Home result rows, Places and Place, using the full 2,097-clinic list.
- Build a worst-case fixture behind a dev-only `?data=worst` switch. It must include:
  - the longest real names, for example "MANILA CENTRAL UNIVERSITY- DR. FILEMON D. TANCHOCO SR. MEDICAL FOUNDATION, INC."
  - phone fields like "0939-2859794, 2754585 / 0977-815-2444"
  - a clinic with no phone, no hours and no email
  - the Filipino strings
  - a 403-result list (NCR), a single result, and zero results
- Fix what breaks using the skill's fix table:
  - `min-width: 0` on text columns
  - `overflow-wrap: anywhere` on names and addresses
  - `white-space: nowrap; flex-shrink: 0` on badges
  - `tabular-nums` on distances
  - "Call" dials the first number, and the full text stays visible
- Done when:
  - screenshots at 320 and 390px, in English and Filipino, light and dark, show no overflow, clipping or orphaned labels
  - "Show more" on the 403-result list has no long task over 200 ms, with the trace in the report

**15.5 Motion review**
Run `review-animations` and `animation-performance` on the route draw-in, the filter bottom sheet, the dot story and the pressed and hover transitions. Also run `apple-motion` on the bottom sheet's drag, spring and interruptibility.
- Done when:
  - there are no Block-level findings
  - only compositor-friendly properties animate
  - reduced motion still shows the end states

**15.6 Small fixes**
- **Install page:** without JavaScript, "TB PH is installed" and the Install button must stay hidden. Give them the `hidden` attribute by default and let the app script reveal them, so only the steps show.
- **Chevrons:** check that every "›" is `aria-hidden="true"`. The design reference already does this.
- Done when a no-JavaScript Playwright run of `/install` and `/fil/install` shows only the steps, and the accessibility tree has no "›".

**15.7 QA, audit and preview**
- Re-run the step 13 matrix, axe and Lighthouse, with dark mode added.
- Update `docs/AUDIT-build.md` with:
  - a short Apple HIG review per page
  - SOT tell #16 (em dashes) marked as passing
- Deploy to a preview with `noindex` for my check.
- Production deploys only after my OK, by direct upload as before.

## When it's done
Send me:
- a short summary per item, with evidence: test names, screenshot paths, grep results
- the preview URL
- any open question
