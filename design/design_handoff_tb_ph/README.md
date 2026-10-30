# Handoff: TB PH — find TB care in the Philippines

## Overview
TB PH is a bilingual (English / Filipino) TB awareness and care-finding website for the Philippines. Its main job is a **care route planner**: a person types where they are (or uses their location), picks what they need, and gets a three-stop route — 1 chest X-ray, 2 sputum TB test, 3 free TB medicines — with the nearest PhilHealth-accredited TB-DOTS centers for each stop. Supporting pages: a full facility list with filters and an optional map, a shareable place page, a guided symptom check, a long-form "Learn about TB" article, a data story with 15 charts, and About.

The site is **static and frontend-only**: no accounts, no backend, no analytics. Facility and statistics data are JSON files fetched at runtime. Location is used only in the browser and is never stored or put in a URL.

## About the design files
The files in `prototype/` are **design references built in HTML** — working prototypes that show the intended look, copy and behavior. They are not production code to ship. The task is to **recreate them in the target codebase's environment** (React, Vue, Astro, etc.) using its patterns. If there is no codebase yet, a static-first framework fits best (for example Astro, or Next.js with static export), with small interactive islands for the planner, the Places filters/map, the symptom check and the dot story.

How the prototype files are built (so you can read them):
- Each page is one `*.dc.html` file. The markup is inside `<x-dc>…</x-dc>` and uses `{{ name }}` placeholders, `<sc-if value>` (conditional) and `<sc-for list as>` (loop). `style-hover="…"` means `:hover` styles. `<dc-import name="SiteHeader">` mounts the sibling file `SiteHeader.dc.html` as a child component.
- Behavior is in `<script type="text/x-dc">` at the bottom: a React-style class with `state`, lifecycle methods and `renderVals()`, which returns every value the markup uses. All copy (EN + FIL) lives in that class (`T`, `copy`, `Q`, `TITLES` objects).
- `support.js` is only the prototype runtime (it loads React 18 from unpkg). Do not port it.
- `tbph-core.js` is plain shared logic (facilities, distance, matching, links, shared strings). It can be ported almost as-is to a TypeScript module.
- All styles are inline on purpose (prototype constraint). In production, turn them into your styling system using the tokens below.

To view: serve the folder over HTTP (the pages `fetch()` JSON, so `file://` won't work) with an internet connection (fonts and React come from CDNs):
```
cd prototype && python3 -m http.server 8080
# open http://localhost:8080/Home.dc.html
```
A 404 for `data/tb-dots-facilities.json` in the console is expected: the full list doesn't exist yet, so the code falls back to the 93-row sample.

## Fidelity
**High-fidelity everywhere. Every page is final v4 (v6, 30 October 2026).**

| Part | Status |
|---|---|
| `Home.dc.html`, `SiteHeader.dc.html` (header + phone tab bar) | Final v4, approved. Unchanged in v6. Recreate pixel-accurately. |
| `Places`, `Place`, `Check`, `Learn`, `Data` + `DotStory`, `About`, `404`, `Install`, `SiteFooter` | Final v4 (v6). Recreate pixel-accurately. Specs below. |
| `Design System.dc.html` | v3 reference. Color meaning, the dot unit and chart rules still hold; surfaces, radii and type are superseded by Home and this README. |

## Design principles (keep these)
- **Red means TB, teal means care.** TB red `#C42032` marks page titles, the wordmark's "TB", "you are here", errors/urgent and illness data. It is never a button color. Teal `#1E6B70` marks the route, stops, every action and "found/treated" data.
- **One solid teal button per screen.** The action repeated on every row is a soft teal capsule; "Call before you go" is a text link.
- **Glass only on navigation** (sticky header and phone tab bar). Content never uses glass or blur. Glass turns solid white when the browser can't blur, or when Reduce Transparency or Increase Contrast is on.
- **Meaning never by color alone.** Service status chips differ by fill, outline vs dashed outline, a ring glyph, and text.
- **Only two motions:** the route line drawing in, and the dot field on the Data page. Both show their end state immediately under `prefers-reduced-motion`.
- Large, legible text (18px base), targets ≥ 44px (most are 46–60px), visible 3px focus ring everywhere.
- Avoided on purpose (generic-template signs): gradients, eyebrows/kicker labels, decorative numbering, rows of check icons, pills for chips, glass cards, emoji, dark hero.

---

## Design tokens (v4 — from Home)

### Color
| Token | Hex | Use | Contrast |
|---|---|---|---|
| Canvas | `#F1F3F4` | Page background | Ink 14.7:1 |
| Surface | `#FFFFFF` | Grouped lists, inputs, solid bars | Ink 16.4:1 |
| Ink | `#14212B` | Text, focus ring, info disc, selected language | — |
| Secondary | `#3F4B53` | Secondary body text, distances, location note | 9.0:1 on white, 8.1:1 on Canvas |
| Muted | `#56626A` | Captions, hours, footnotes, placeholder, icons | 6.3:1 on white, 5.6:1 on Canvas |
| Control edge | `#7A858C` | Input border, unselected radio ring/glyph | 3.8:1 on white (non-text ≥ 3:1) |
| Separator | `#E3E6E8` | 1px row separators inside groups | decorative |
| Track | `#DADDE0` | Undrawn route track; non-glass sheet edge | decorative |
| Link underline | `#9AA3A8` | Underline color on facility-name links (text stays Ink) | decorative |
| Chevron | `#8A949A` | "›" in "See more places" | decorative |
| Row hover | `#F6F8F8` | Hover fill on link rows | — |
| Teal | `#1E6B70` | Primary button, route line, stops, checkmarks, "Offers this" chip | 6.2:1 on white; white on it 6.2:1 |
| Teal deep | `#175458` | Teal text, primary hover | 8.6:1 on white; 7.1:1 on Teal tint 13% |
| Teal tint 13% | `rgba(30,107,112,0.13)` (≈ `#E2ECEC` on white) | Soft buttons | — |
| Teal tint 22% | `rgba(30,107,112,0.22)` (≈ `#CEDEE0`) | Soft button hover | Teal deep 6.2:1 |
| Teal tint 14% | `rgba(30,107,112,0.14)` | Active tab pill in phone tab bar | Teal deep 7.0:1 |
| TB red | `#C42032` | H1, "you are here", errors, invalid input border | 5.8:1 on white, 5.2:1 on Canvas |
| Map ground | `#DCE6E5` | Planner backdrop | — |

Data-only colors (Data page, urgent screen): Film `#0E1A22` (dark band), Film muted `#A9B4BA`, Film rule `#33434D`, Dot `#7A8C97` (people who fell ill), Dot on Film `#8FA1AC`, TB red on Film `#F0646C`, Teal on Film `#6FB5B9`, Paper 2 `#E8E4DA` (table heads).

v3 colors still present in the not-yet-migrated pages: Paper `#F2F0EA` (background, and text on teal/ink), Field `#FBFAF6` (inputs), Rule `#D9D5CB` (dividers; also used as the solid-fallback edge of the header and tab bar).

### Glass (navigation only)
| Surface | Glass | Solid fallback |
|---|---|---|
| Header | bg `rgba(255,255,255,0.72)`, `backdrop-filter: blur(24px) saturate(1.5)`, bottom 1px `rgba(20,33,43,0.12)` | `#FFFFFF`, bottom 1px `#D9D5CB` |
| Phone tab bar | bg `rgba(255,255,255,0.68)`, same blur, 1px `rgba(255,255,255,0.7)`, shadow `0 10px 30px rgba(20,33,43,0.16)` | `#FFFFFF`, 1px `#D9D5CB`, same shadow |
| Home planner sheet* | bg `rgba(255,255,255,0.64)`, `blur(28px) saturate(1.5)`, 1px `rgba(255,255,255,0.75)`, shadow `inset 0 1px 0 rgba(255,255,255,0.85), 0 20px 50px rgba(20,33,43,0.16)` | `#FFFFFF`, 1px `#DADDE0`, same shadow |

\*The planner sheet floats over the decorative map, not over content, so it is the one non-bar surface allowed to be frosted.

Fallback rule (prototype does it in JS; in production use CSS):
```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { /* solid */ }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) { /* solid */ }
```

### Typography
- **Family:** `'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible', system-ui, -apple-system, 'Segoe UI', sans-serif` — weights 400 and 700 (+400 italic). Google Fonts in the prototype; self-host in production (privacy + speed).
- **Wordmark only:** Newsreader 600 (Google Fonts, `opsz 6..72`), fallback Georgia. "TB" in TB red, " PH" in Ink. Newsreader appears only in the wordmark (settled in v6). Long reading text on Learn, Data and About is Atkinson too, 18 px with a 34 em measure.
- Base: 18px / 1.5. Sentence case everywhere. Tabular figures (`font-variant-numeric: tabular-nums`) for distances and stop numbers. `text-wrap: balance` on H1, `pretty` on paragraphs.

| Role (Home) | Size | Weight / line-height / tracking |
|---|---|---|
| H1 planner title | `clamp(2.125rem, 1.7rem + 1.8vw, 2.875rem)` (34→46px) | 700 / 1.06 / -0.02em, TB red |
| H2 route heading | `clamp(1.5rem, 1.3rem + 0.9vw, 1.875rem)` (24→30px) | 700 / 1.2 / -0.01em, max 28em |
| H2 no-match | `clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)` (22→28px) | 700 / 1.25 |
| H3 stop title | `clamp(1.25rem, 1.15rem + 0.4vw, 1.4375rem)` (20→23px) | 700 / 1.25 |
| H3 "What to bring" / primary button | 20px | 700 / 1.3 |
| Lede, input text, facility name (H4) | 19px | 400 / 1.4 (name: 700 / 1.3) |
| Choice rows, reassurance lines, links | 18px | 400 (selected 700) / 1.3–1.4 |
| Labels, legend, soft buttons, body secondary, address | 17px | 700 for labels/buttons; body 400 / 1.45–1.55 |
| Location note, hours, distance, teaser | 16px | 400 / 1.4–1.5 (distance 700) |
| Chips, badges, footnotes | 15px | 700 / 1.25 (footnotes 400 / 1.5) |
| Tab bar labels | 14px | 400, active 700 / 1.15 |

Open item: body sizes step 15/16/17/18/19/20px; the plan is to consolidate to a few fixed sizes before migrating the other pages. Not decided yet — don't invent the scale; ask.

### Radius
Planner sheet and phone tab bar 30px · active tab pill 26px · grouped lists 18px · search input 16px · chips/badges 8px · buttons and soft buttons 999px (capsule) · circles 50% · route track 3px · header language toggle 6px · skip link 4px.

### Spacing
Container max-width 1120px (header/footer 1280px), side padding `clamp(12px–16px, 4vw, 64px)`. Planner sheet: padding `clamp(20px, 4vw, 30px)`, gap 22px between blocks, 10px inside a block. Rows: 56px min height, 16px side padding. v3 spacing steps still apply elsewhere: 4, 8, 12, 16, 24, 32, 48, 72, 112.

### Focus
`:focus-visible { outline: 3px solid #14212B; outline-offset: 3px }`. Choice rows with visually hidden radios: `[data-choice]:focus-within { outline: 3px solid #14212B; outline-offset: -3px }`. On dark (Film) areas the ring is `#F2F0EA`.

### Links (global)
`a { color: #175458; text-decoration-thickness: 1.5px; text-underline-offset: 3px }` `a:hover { color: #14212B }`.

---

## Screens

### Shared: header (`SiteHeader.dc.html`)
- Wrapped by each page in `position: sticky; top: 0; z-index: 40`. Height 64px + 1px border = 65px.
- **Skip link** "Skip to content" / "Lumaktaw sa nilalaman": off-screen at `top: -64px`, on focus `top: 8px`; Ink bg, `#F2F0EA` text, 12px 16px padding, 700 16px.
- Row: max-width 1280, padding `0 clamp(16px,5vw,64px)`, flex, gap `clamp(10px,2vw,28px)` (8px under 380px wide).
- **Wordmark** "TB PH" → Home. Newsreader 600 23px, -0.01em, min-height 44px.
- **Desktop nav** (viewport ≥ 1000px in EN, ≥ 1180px in FIL — Filipino labels are longer): right-aligned; Find TB care · Check symptoms · Learn about TB · The data · About (FIL: Hanapin ang gamutan · Suriin ang sintomas · Alamin ang TB · Ang datos · Tungkol sa amin). 16px, min-height 44px, padding 0 8px. Current page: 700, 3px teal bottom border, `aria-current="page"`. Hover: teal text.
- **Language toggle** (group label "Language / Wika"): two buttons "English" / "Filipino" with `lang` attributes and `aria-pressed`; 1.5px Ink border, radius 6, min-height 44px, padding 0 12px, 700 15px (under 380px: 0 9px, 14px). Selected: Ink fill, `#F2F0EA` text.
- **Phone tab bar** (below the desktop breakpoint): fixed; left/right 12px; bottom `calc(10px + env(safe-area-inset-bottom))`; max-width 560px centered; radius 30; glass (see above); z-index 60; hidden in print. Inner grid of 4 equal columns, padding 4px, gap 2px. Each tab: min-height 60px, radius 26px, icon 24px (stroke 2, round caps/joins, `currentColor`) above a 14px label. Active: tint-14% pill, Teal deep text, 700. Tabs = first four nav items (About lives in the footer). Icon paths (24×24 viewBox):
  - Find TB care (map pin): `M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21zM12 12.6a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z`
  - Check symptoms (clipboard): `M9 3h6v3H9zM8.5 4.5h-2A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-2M9 13.5l2 2 4-4.5`
  - Learn (book): `M3 5.5c2.5-1 5.5-1 9 1 3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1zM12 6.5V20`
  - Data (bars): `M5 20v-8M12 20V5M19 20v-5M3 20h18`
- Places and Place mark "Find TB care" as current.

### Shared: footer (`SiteFooter.dc.html`) — v4
- Top separator 1px `#E3E6E8`, transparent on Canvas. Max-width 1280, padding `clamp(40px,6vw,72px) clamp(16px,5vw,64px) 32px`, gap 32px.
- Safety note, Atkinson 19px/1.5, max 40rem: "This site gives general information. It is not a diagnosis. If you've had a cough for 2 weeks or more, get tested — it's free at public health centers." Then "Emergency? **Call 911.**" 700 19px, link TB red, `tel:911`.
- Nav: Find TB care · Check symptoms · Learn about TB · The data · Accessibility (`/about#accessibility`) · Install the app · About. 16px, min-height 44px, gap 0 22px, Ink with `#9AA3A8` underline, hover Teal deep. "Install the app" is hidden when `html[data-standalone="true"]`.
- Language toggle identical to the header's (1.5px Ink border, radius 6, 44px, padding 0 12px, 700 15px; selected Ink fill, `#F2F0EA` text).
- Credit row (top rule `#E3E6E8`, 15px Muted): "Data: WHO Global Tuberculosis Report 2025, DOH, PhilHealth. Last updated 30 October 2026." + wordmark (Newsreader 600 19px).
- Below the desktop breakpoint, a spacer of `calc(92px + env(safe-area-inset-bottom))` keeps the floating tab bar off the footer.

### Shared: v4 page frame (all inner pages)
- Canvas `#F1F3F4`. Container max-width 1120px; sides `clamp(16px,4vw,64px)`; bottom `clamp(48px,7vw,80px)`; top `clamp(16px,3vw,32px)` on pages that start with a back link (Places, Place, Check), `clamp(40px,7vw,88px)` elsewhere. Reading column max 760px (Check 640px).
- H1 = Home's H1 (Atkinson 700, 34→46px, line 1.06, -0.02em, TB red). H2 = Atkinson 700 `clamp(1.375rem,1.25rem + 0.6vw,1.75rem)`, line 1.25, -0.01em. H2 → group gap 12px; sections 28–40px apart.
- Content sits in white groups (radius 18, `overflow:hidden`, no shadow) with inset `#E3E6E8` separators. Prose on Learn stays on Canvas; structured content (lists, claims, tables, charts) is on white.
- In-app back link, top left: "‹" (26px) + label, Teal deep 700 17px, min-height 44px, underline on hover. Places (when arriving from a route), Place and every Check question have one, so installed mode never depends on a browser back button.
- Offline status line (Places, Place) when `html[data-online="false"]`: 22px Ink "i" disc + 700 17px text, `role="status"`. Places: "You're offline. Showing the saved list of centers." / "Wala kang koneksiyon. Ipinapakita ang naka-save na listahan ng mga center." Place: "You're offline. Showing the saved details for this center." / "Wala kang koneksiyon. Ipinapakita ang naka-save na detalye ng center na ito."

### Home — route planner (`/`, `Home.dc.html`) — final v4
**Purpose:** say where you are, pick what you need, get the nearest places for each stop.

**Layout**
1. **Planner section** pulls up under the header (`margin-top: -65px; padding-top: 65px`) so the glass header shows the map behind it. Container max-width 1120, padding `max(84px, calc(132px - 5vw)) clamp(12px,4vw,64px) clamp(28px,5vw,80px)`.
2. **Backdrop (decorative, `aria-hidden`):** ground `#DCE6E5`. One full-bleed SVG, `viewBox="0 0 100 100" preserveAspectRatio="none"`, all strokes `vector-effect: non-scaling-stroke`:
   - streets: `M-5 30 L105 21 M-5 63 L105 76 M14 -5 L20 105 M57 -5 L51 105 M92 -5 L88 105`, white, 7px, opacity 0.85
   - route casing: `M80 -10 L80 20 L30 40 L30 68 L74 86 L74 110`, white, 42px, round joins; then the same path in Teal, 24px
   - "you are here": 30px TB-red dot at left 80% / top 9%, `box-shadow: 0 0 0 7px #FFFFFF`
   - three stops: Teal circles `clamp(48px,6vw,80px)` at (80%, 20%), (30%, 54%), (74%, 86%), `box-shadow: 0 0 0 8px #FFFFFF`
3. **Planner sheet** (`<form>`): max-width 560px, left-aligned in the container, radius 30, frosted (see Glass). Contents top to bottom:
   - H1 "Find your way to TB care." + lede "Chest X-ray, TB test and free medicines — near you, step by step."
   - Label **"Where are you?"** (700 17px) → search field: min-height 58px, padding-left 48px, 1.5px `#7A858C` border (TB red when invalid, with `aria-invalid`), radius 16, white, 19px. Placeholder "Barangay, city or landmark". Magnifier icon 22px at left 16px (circle r 6.5 at 11,11 + line `M16 16l4.5 4.5`, stroke `#56626A` 2.2). Suggestions: a `<datalist>` of known places (cities + provinces from the facility list).
   - **"Use my location"** soft capsule: min-height 48px, padding 0 20px 0 16px, Teal tint 13% bg (hover 22%), Teal deep 700 17px, with a 12px TB-red dot (3px white ring) before the label. While locating: disabled, `aria-busy`, opacity 0.6.
   - Message line (hidden unless needed), 700 17px: empty submit → TB red "Type your barangay or city, or use your location." (`role="alert"`, focus returns to the field); location denied → Ink "No problem. Type your barangay or city instead." (`role="status"`).
   - Note (16px Secondary): "We use your location only to sort places by distance. It stays on your device."
   - Fieldset, legend **"I need"** → one white group (radius 18) of four radio rows. Row = grid `56px | 1fr`, min-height 56px, text 18px. Separators 1px `#E3E6E8` on the text column only (inset, iOS-style). Selected row: label 700 + Teal "✓" (20px) at the right.
     - "The whole route (X-ray, test, medicines)" — glyph: three 8px dots joined by 6×3px bars; Teal when selected, else `#7A858C`.
     - "Chest X-ray" (1), "TB test (sputum)" (2), "Free TB medicines" (3) — glyph: 30px numbered disc, 2px ring, 15px 700 numeral. Included in the plan (selected, or "whole route" selected) → Teal fill, white numeral; otherwise white fill, `#7A858C` ring, Ink numeral.
     - Native radios are visually hidden but keyboard-focusable; the row shows the focus ring.
   - **Primary button** "Show me where to go": full width, min-height 58px, capsule, Teal, white 700 20px; hover Teal deep.
   - Centered text link "Not sure yet? Check my symptoms" → `/check` (700 18px, Teal deep, min-height 48px, no underline until hover).
4. **Results** (appears after submit; container max-width 1120, inner max-width 760, padding `clamp(32px,5vw,56px) clamp(16px,4vw,64px) 8px`). States:
   - Loading: "Loading the list of centers…" (`role="status"`, Muted 18px).
   - Load error: "The list could not be loaded. Check your connection and try again." + soft button "Try again" (`role="alert"`).
   - No match: H2 "No centers match your search." + "Type your barangay or city, or use your location."
   - **Route** (grid gap 24px):
     - H2: "Your TB care route: 3 stops. The nearest is about 3 km away." (single-service plans use the stop title, e.g. "Get a chest X-ray").
     - Ordered list, each item a grid `40px rail | 1fr`, column gap 14px.
     - **Origin row** (padding-bottom 28px): 18px TB-red dot, margin-top 5px, `box-shadow: 0 0 0 4px #F1F3F4, 0 0 0 6px #C42032`; label = the typed place or "My location" (700 18px).
     - **Rail:** under each row a 6px track (`#DADDE0`, radius 3) at left 17px from the marker centre (`top: 14px` origin / `18px` stops, `bottom: -16px`), and on top of it a Teal fill of the same size that animates (see Interactions).
     - **Stop row** (padding-bottom 36px): 36px stop disc, 3px Teal border, 16px 700 numeral (Teal fill + white numeral when drawn; white + Teal deep before). Content grid gap 12px, padding-top 4px:
       - H3 stop title — "Get a chest X-ray" / "Give a sputum sample for a TB test" / "Start free TB medicines" (screen readers also hear "1. ").
       - Explanation (17px/1.55 Secondary, max 36em) — texts in `tbph-core.js` → `STR.en.stopText`.
       - Optional note (700 17px) with a 22px Ink "i" disc: "Nothing within 10 km. Showing the nearest places in your province." or "We don't have confirmed X-ray sites near you yet. Ask your nearest TB-DOTS center; they can refer you."
       - **Facility group** (white, radius 18): up to 3 rows, each padding 14px 16px 16px, grid gap 8px, full-width 1px `#E3E6E8` separators:
         - name (H4 link to the place page, 700 19px, Ink, underline `#9AA3A8` offset 4px, hover Teal) and, right-aligned, distance (700 16px Secondary, tabular, no wrap): "about 3 km" or "2.4 km" (see Logic)
         - chips row (gap 8px): service status chip + sector badge (see Components)
         - address (17px/1.45), hours (16px Muted): "Hours: …" or "Hours not listed — call first"
         - actions (gap 8px 18px, padding-top 4px): soft capsule "Commute directions" (min-height 46px, padding 0 18px; opens Google Maps transit directions in a new tab) and text link "Call before you go" (`tel:`; only when a phone exists). Both have descriptive `aria-label`s that include the place name.
         - last row: "See more places ›" link row → Places filtered to this service (min-height 52px, padding 0 16px, Teal deep 700 17px, chevron 26px `#8A949A`, hover bg `#F6F8F8`)
     - **End row:** 26px ring marker (7px Teal border, Canvas centre) + H3 "What to bring" + white group: "A valid ID" · "Your PhilHealth ID or number, if you have one" · "Your TB check summary" · "Any old chest X-ray results" · "A face mask" (rows padding 13px 16px, 17px).
     - Footnotes (padding-left 54px, 15px/1.5 Muted, max 48em): the service-marking rule, the sample-data note (only with sample data), the PhilHealth data note, and "Sources:" with 7 links (see `SRC` in Home).
5. **Good to know** (always visible; padding `clamp(28px,4vw,44px) clamp(16px,4vw,64px) clamp(48px,7vw,80px)`, max-width 760): white group of three 18px lines — "Testing and TB medicines are free at public health centers." · "A cough that lasts 2 weeks deserves a test." · "TB is curable when you finish treatment." Then (16px Secondary) "In 2024, about 724,000 Filipinos fell ill with TB. **See the data.**" → `/data`.
6. Footer.

Filipino copy for everything above: `T.fil` in `Home.dc.html` and `STR.fil` in `tbph-core.js`.

### Places — full list (`/places`, `Places.dc.html`) — v4
- Back link "Back to your route" when `need`, `near` or `loc` is in the URL. H1 "Find TB care near you"; intro 18px Secondary, max 40em; offline line.
- ≥ 1080px: grid `320px | 1fr`, gap 40px. Left: **Filters panel** (white, radius 18, padding 20, sticky at top 88px): H2 "Filters" 20px; "Search by city, municipality or facility name"; Region select; Province or city select; Type segmented control (All / Government / Private); "Clear filters" text button when any filter is set.
- Right column (all widths): search block (`role="search"`) with "Where are you?" identical to Home's field (58px, magnifier, place suggestions) + "Use my location" capsule + denied message; "Service" segmented control (All / Chest X-ray / TB test / Free medicines; four columns, 2 × 2 under 440px).
- Toolbar: H2 count ("93 centers", `aria-live`) left; right, below 1080px only, soft capsule "Filters" or "Filters (2)" with a three-line icon that opens the sheet; then a List | Map segmented control (min-width 180px).
- "Sort by distance" switch (`role="switch"`, 51 × 31 track; on: Teal track, white knob; off: white track, 1.5px `#7A858C` edge, `#7A858C` knob), shown only once a location is known.
- Results: one white grouped list whose rows are Home's facility rows (19px name link, distance, chips, sector badge, address, hours, soft "Commute directions", text link "Call before you go"), full-width separators. With no service filter each row shows all three chips prefixed with the service ("Chest X-ray: ✓ Offers this"). Last row "Show more centers (N left)" adds 20 at a time.
- Map: white, radius 18, height 62% of the viewport (360–640px), loaded only when chosen; overlay "Loading map…" or the error with a "Try again" capsule; markers Teal with white stroke, your location TB red.
- States: loading; error + soft "Try again"; no confirmed X-ray (info line, shows all centers); empty (white panel: "No centers match your search. Try a nearby city, or clear the filters." + solid "Clear filters").
- **Filters sheet** (below 1080px): fixed overlay above the tab bar (z-index 80), scrim `rgba(20,33,43,0.32)`; sheet white, top radius 24, max-height 88vh, bottom padding includes the safe area; grabber 40 × 5 `#C3C9CD`; header "Filters" (H2, receives focus) with the live count under it and a trailing "Done" (Teal deep 700 18px). Same fields as the panel. Slides up in 240ms `cubic-bezier(.3,.7,.2,1)` (instant with reduced motion). Closes with Done, scrim tap, Escape or a downward swipe over 90px; focus is trapped while open and returns to the Filters button; page scroll is locked and `main` is `aria-hidden`.

### Place — shareable place page (`/place/{id}`, prototype `Place.dc.html?id=…`) — v4
- Params as before (`id`, `stop`, `need`, `near`, `loc=gps`). Back link; offline line.
- With `stop`: "You're at stop 2 of 3" (700 17px Teal deep) above the route motif (max 420px): a 6px `#DADDE0` track joining three 26px discs, Teal fill up to the current stop; reached discs Teal with white numerals, later ones white with a 3px Teal ring; the current disc has a `0 0 0 3px #F1F3F4, 0 0 0 5px #1E6B70` halo; service names 15px under each (current 700). The motif is `aria-hidden`; the sentence carries the meaning.
- H1 facility name (TB red, `clamp(2rem,1.6rem + 1.6vw,2.625rem)`, line 1.1, wraps anywhere); distance (700 17px Secondary) + sector badge; address 18px.
- Actions: **"Commute directions"** solid Teal capsule, full width up to 560px, 58px, 20px (the one primary); soft capsules Walk, Drive, "Copy address for Sakay.ph" (48px); "Call before you go" underlined text link; status line after copying ("Copied. Paste it into Sakay.ph." or the fallback with the address).
- "Services": white group, 56px rows, service name 700 18px + status chip. "Details": white group (`dl`): Hours (or "Not listed. Call first."), Phone, Region, Accreditation until ("31 December 2026" / "31 Disyembre 2026", from `accreditation_expiry`).
- Footnotes, then (not installed only) a quiet row "Save TB PH to your home screen for next time." / "I-save ang TB PH sa home screen mo para sa susunod." › Install page.
- Missing id: H1 "This place isn't on the list." + solid "See more places".

### Check — guided symptom check (`/check`, `Check.dc.html`) — v4, clinical review pending
- **Intro:** H1 "Check your symptoms"; lede 19px Secondary; white row with a lock icon: "Your answers stay on your device. We don't save or send them."; solid "Start" (full width up to 560px).
- **Question:** "‹ Back" top left; "Step n of N" (700 16px Secondary) over a segmented route line (N bars, 6px, gap 4px, Teal up to the current step, `#DADDE0` after; max 320px); H1 question (TB red, `clamp(1.625rem,1.5rem + 0.5vw,1.875rem)`, receives focus); hint 17px Secondary. Options are one white group built exactly like Home's "I need" rows: grid `56px | 1fr`, 60px rows, inset separators, leading glyph (24px radio circle with a 10px Teal dot, or 24px checkbox, radius 6, Teal fill when selected; unselected 2px `#7A858C`), selected label 700 with a Teal "✓" at the right. "None of these" is its own group 12px below. Inline error in TB red 700 17px. **Next / See my result** is the solid capsule, sticky at the bottom: `calc(84px + env(safe-area-inset-bottom))` below the desktop breakpoint (above the tab bar), 0 above it, on a Canvas strip.
- **Urgent:** the main area turns Film `#0E1A22` with white text; a 64 × 6 `#F0646C` bar; H1 white; "Call 911" capsule, white with TB red 22px text, 64px; Back and Start over as translucent white capsules (`rgba(255,255,255,0.16)`); footnote `#A9B4BA` above a `#33434D` rule; focus ring white.
- **Results A–D:** H1 TB red; body 19px; A's steps in a white group with 30px Teal numbered discs; notes in a white group with "i" discs; A/B/C solid "Plan my route to a test" → `/?need=all`; A soft "Save my summary". Patient card (the one bordered card): 2px Ink border, white, radius 4, 2px Ink header rule, `#DADDE0` row rules, wordmark. Then soft "Save as image", soft "Print", text "Start over", and for A–C (not installed) the install row. Printing outputs only the card.

### Learn (`/learn`, `Learn.dc.html`) — v4
- Atkinson throughout; body 18px/1.6, measure 34em; H2 Atkinson 700 `clamp(1.5rem,1.3rem + 0.9vw,1.875rem)`, -0.01em.
- Contents: below 1080px a collapsible white group (56px summary with a › that turns 90°, 48px rows); at 1080px and wider a sticky sidebar (top 96px, white panel, padding 8) with 44px rows, radius 10, current section in tint 14% with Teal deep 700 (`aria-current="location"`, scroll-spy).
- End of each section: **"By the numbers"** (H3 19px, white group, 1–3 claims: 18px text; 15px Muted "kind. source link"; "More in the data" → `Data.dc.html#claim-{id}`), then the Sources line, then "Back to top" (smooth unless reduced motion; focus moves to `main`). Mapping: L1 `burden-cases`, `burden-deaths`; L3 `gap-missed`; L4 `drivers-attributable`, `who-men`, `who-children`; L5 `test-sites`, `test-couriers`, `test-xray-yakap`; L6 `tx-success`, `tx-ltfu`, `tx-free`; L7 `tx-dr`, `tx-dr-success`; L8 `prev-tpt`, `prev-bcg`; L9 `cost-catastrophic`.
- Myths and facts: ARIA table on a white group. At 720px and wider, two columns Myth (5fr) | Fact (7fr) with a header row; narrower, each pair stacks with inline labels "Myth" (TB red 14px 700) and "Fact" (Teal deep); fact text 700.
- L5 actions: solid "Check your symptoms" + soft "Find TB care near you".

### Data (`/data`, `Data.dc.html` + `DotStory.dc.html`) — v4
- **Dot story** first (behavior unchanged): text beats in Atkinson 700 (H1 -0.02em, H2 -0.01em), stage on Canvas, closing actions solid "Check your symptoms" + soft "Find TB care near you".
- Intro: H2 "The data" (Atkinson 700, 28→36px) + 18px text. "On this page": white jump list with chevrons (one column, two at 900px and wider), 21 entries ending with "TB in numbers". "Methods and caveats": collapsible white group.
- **Every chart is a white panel** (radius 18, padding `clamp(18px,3vw,32px)`, max 1040px, no shadow): H2 title; takeaway 18px (d16–d20 use claim text); optional segmented toggle; stats as grouped rows (value 700 19px tabular | label 17px with a 15px Muted sub-line), never big-number tiles; SVG figure(s); caption 16px Secondary; source line (15px Muted under a `#E3E6E8` rule; d16–d20 link each source title); actions row: soft "View as table" (`aria-expanded`), d20's "See the 2016 survey", "Back to top".
- Tables: ARIA tables (role table/row/columnheader/cell) in a focusable, horizontally scrollable region; 2px Ink header rule, `#E3E6E8` row rules.
- Chart color: illness TB red, care Teal, context Dot `#7A8C97`, gridlines `#E3E6E8`, baseline Ink; provisional and expected values hatched (white with 3px stripes of the series color) and labelled. Below 640px chart width, time series become one row per year; under 420px legends break onto two lines and target labels stay inside the chart.
- **New charts:** d16 Testing has scaled up · d17 Who pays for TB care · d18 Protecting babies with BCG · d19 The conditions TB feeds on · d20 Regional snapshots (see "v6 changes").
- **TB in numbers** (`#numbers`): all 44 claims grouped by topic. Topic picker: a wrapping segmented grid (12 options) at 720px and wider, a select below. Each claim row has `id="claim-{id}"`, 18px text, then 15px "kind (700), year." and linked sources. Deep links (`#claim-…`, `#d16`) scroll into place after the data loads and focus the row.

### About (`/about`, `About.dc.html`) — v4
H1 "About" + mission lede, then H2 + white group per section: Our partners ("Partner hospitals (names and logos to come)"), Medical review, Disclaimer, Privacy (4 rows: no accounts; location stays on device; the app saves pages and data on the phone, no tracking or analytics; Google Fonts, OpenStreetMap tiles only if the map opens, Google Maps or Sakay.ph for directions), Data and updates (30 October 2026), **Use TB PH like an app** (hidden when installed; row "How to install ›"), Accessibility, **Helpful numbers** (rows: who 700 18px + note 16px Muted, `[VERIFY]` notes in TB red, number on the right as a 44px `tel:` link), Contact.

### 404 (`404.dc.html`) — v4
H1 "We can't find that page." (TB red), one line, solid "Find TB care" + soft "Check symptoms" capsules (58px, 20px).

### Install (`Install.dc.html`) — v4 (from v5, unchanged)

## Components

**Service status chip** (`TBPH.chip()`): inline-flex, gap 7px, min-height 30px, padding 2px 10px, radius 8 (4 in v3 pages), 700 15px.
| Status | Look | Label EN / FIL |
|---|---|---|
| `yes` | Teal fill, 1.5px Teal border, light text, "✓" | Offers this / Mayroon nito |
| `referral` (test only) | 1.5px Teal outline, Teal deep text, 11px ring glyph (2.5px Teal) | Collects your sample or refers you / Kumukuha ng sample o nagre-refer |
| `unknown` | 1.5px **dashed** `#56626A`, Ink text, dashed ring glyph | Call to confirm / Tumawag para kumpirmahin |
(Light text is `#F2F0EA` today; use `#FFFFFF` in v4.)

**Sector badge:** min-height 30px, padding 2px 10px, 1.5px border, radius 8, 700 15px. Government: Teal border, Teal deep text, "Government — free TB care". Private: `#56626A` border, Ink text, "Private — fees may apply".

**Buttons:** Primary — Teal capsule, white 700 20px, 58px (one per screen). Soft — tint-13% capsule, Teal deep 700 17px, 46–48px. Text link — Teal deep 700 17–18px, underline on hover. Language toggle — segmented, see header.

**Grouped list:** white, radius 18, `overflow: hidden`, rows ≥ 52–56px, 1px `#E3E6E8` separators, no shadows.

---

**Added in v6**
- **Segmented control:** white track, 1.5px `#7A858C` edge, radius 14, padding 3px, gap 3px; segments 44px tall, radius 10, 16px; selected Ink fill with white 700 text (16.4:1), others transparent Ink 400. Buttons with `aria-pressed` inside a labelled `role="group"`.
- **Select:** white, 1.5px `#7A858C`, radius 16, 58px, 18px text, custom chevron (`#56626A`, 18px, 16px from the right), right padding 48px.
- **Switch:** `role="switch"`, 51 × 31 track, 24px knob (see Places).
- **Info line:** 22px Ink disc with a white "i" + 700 17px text. Used for offline, "no confirmed X-ray" and route notes.
- **Link row:** full-width row in a white group, 52–56px, label + "›" (26px `#8A949A`), hover `#F6F8F8`. Used for "See more places", "How to install" and the install rows.
- **Claim row:** claim text 18px; 15px Muted line "kind, year." plus linked source titles; optional "More in the data" link (44px).

## Interactions & behavior
- **Submit** (button or Enter) → resolve origin → compute route → show results → move focus to the results H2 (`tabindex="-1"`). If that heading is outside 70px…60% of the viewport, smooth-scroll it to 90px from the top (instant under reduced motion).
- **Route draw-in** (new route only): each rail fill animates `transform: scaleY(0 → 1)` (`transform-origin: top`) over 520ms `cubic-bezier(.3,.6,.2,1)`, delayed `i × 430ms` (origin segment i = 0, then each stop). Each stop disc fills (background + numeral colour) over 260ms ease, delayed `(i + 1) × 430 − 80ms`. Changing "I need" after a route exists recomputes without re-animating. Reduced motion: no animation, drawn state immediately.
- **Use my location:** asks only on click (the note explains why first). `getCurrentPosition` with `enableHighAccuracy: false, timeout: 15000, maximumAge: 300000`. Success → field shows "My location" and the route runs. Denied/error → status message, focus back to the field.
- **Hover:** primary → Teal deep; soft buttons → tint 22%; facility names → Teal; link rows → `#F6F8F8`.
- **Language switch** (header or footer): saves `tbph-lang` in `localStorage`, sets `<html lang>`, swaps all copy, swaps "My location" in the field, and keeps the reader's place: before switching, find the last `[data-anchor]` element whose top is above 35% of the viewport, then after re-render scroll by the difference so it stays put.
- **URL state:** after each run, `history.replaceState` writes `need`, `near` (typed text) or `loc=gps` (a flag only). Incoming `?need=`, `?near=` and `?loc=gps` restore the plan (with `loc=gps` the browser is asked again).
- **External links:** Google Maps directions open in a new tab (`rel="noopener"`); `tel:` links for phones.

## Planner logic (`prototype/tbph-core.js`)
- **Data load:** fetch `data/tb-dots-facilities.json`; on failure fall back to `data/tb-dots-facilities-SAMPLE.json` (flag `sample = true`, which shows the approximate-pins note). Cache the promise; reset it on failure so "Try again" refetches.
- **Normalisation:** names/streets are title-cased with an acronym list (TB, DOTS, RHU, NCR, …); phones → first number → `tel:+63…` (NCR 8-digit numbers get `+632`).
- **Services:** X-ray counts only when `svc_chest_xray = yes`; test counts `yes` or `onsite_or_referral`; medicines `yes`. Anything else is "Call to confirm".
- **Gazetteer:** built from the facility list — one entry per city (first facility's coordinates) plus one per province (average of its cities). Typed text is matched by normalized exact / prefix / contains scoring; cities win ties. No geocoding calls from the browser.
- **Origin:** GPS → coordinates; matched place → its coordinates and province; unmatched text → text ranking (city match first, then province).
- **Per stop:** the 3 nearest places offering the service. If none within 10 km → note "Nothing within 10 km…" and the nearest in the province (from the typed place, or the nearest facility's province for GPS). If no confirmed X-ray at all → referral note and the 3 nearest centers regardless of X-ray.
- **Distance:** haversine. Shown exact ("2.4 km" under 10 km, rounded above) only when the facility's `geo_precision` is `address`/`confirmed` **and** the user used GPS; otherwise "about N km" (min 1).
- **Directions:** Google Maps `dir/?api=1&destination=…&travelmode=transit|walking|driving`; destination = coordinates only when precise, otherwise "name, street, city, province, Philippines" so nobody is routed to a city centre.

## State (Home)
`lang` ('en'|'fil'), `fac` (dataset: list, gazetteer, byId, sample flag), `facErr`, `from` (field text), `gps` ({lat,lng}|null — memory only), `locating`, `msg` ('' | 'none' | 'denied'), `need` ('all'|'xray'|'test'|'meds'), `res` ({origin, route, need} or {loading}), `drawn` (animation), `glass` (feature/preference check). Places adds `q, svc, region, prov, sector, sortDist, view ('list'|'map'), limit (20), mapState`. Check keeps `step` and answers `a` in memory only.

Prototype-only review switches (not product features): Home `demo` (live / empty / located = Quezon City / far = GPS at 18.565, 120.79), Place `placeId`, Check `preview` (flow / urgent / A–D), Data `previewBeat`, `reducedMotion`, `missedLayout` (scattered / grouped).

## Data
- `prototype/data/tb-dots-facilities-SAMPLE.json` — `{ source, title, count, note, facilities[] }`, 93 rows. Fields: `id, source_row, name, sector, phone, email, street, city_municipality, province_or_city_group, region_code, region, region_as_listed, accreditation_expiry, facility_kind, svc_free_tb_medicines, svc_tb_test, svc_chest_xray, hours, lat, lng, geo_precision, maps_url, source, source_updated`. `svc_*` ∈ `yes | no | unknown` (+ `onsite_or_referral` for tests). Sample coordinates are `approx_city_design_only`. The production file (`tb-dots-facilities.json`, ~2,100 rows) is produced by the scripts in `pipeline/`.
- `prototype/data/tb-ph-data.json` — WHO/DOH statistics for the Data page: `meta, headline_2024, end_tb_milestones, incidence_series, deaths_series, detection_gap_series, notifications_annual, notifications_monthly, notifications_monthly_annual_totals, incidence_by_age_sex_2024, notifications_by_age_sex_2024, notification_breakdown_2024, risk_factor_attributable_cases_2024, treatment_outcomes, drug_resistant_tb, tb_hiv, contacts_and_tpt_2024, global_comparison, prevalence_survey_2016, patient_costs`. Dot counts come from `headline_2024` ÷ 1,000, rounded (724 / 179 / 37).

## Accessibility requirements
WCAG 2.2 AA. One H1 per page; skip link; labelled inputs (labels always visible above fields); radios/checkboxes are real inputs; focus moved to new content (results heading, each Check question, result title); `role="status"`/`alert` for async and error messages; `aria-current` on nav; `aria-pressed` on toggles; every chart has a table; map is optional and duplicated as a list; `lang` on the page and on the language buttons; reduced motion and reduced transparency respected; text reflows (Filipino runs ~20–30% longer — nothing truncates); targets ≥ 44px. Still to do: a runtime screen-reader pass and Lighthouse on the deployed build.

## v4 migration (done in v6)
Applied to every page except Home and SiteHeader, which stayed untouched:

| v3 | v4 |
|---|---|
| Paper `#F2F0EA` background | Canvas `#F1F3F4` |
| Whitespace + Rule `#D9D5CB` | White groups, radius 18, `#E3E6E8` separators |
| Field inputs, 2px Ink, radius 10 | White, 1.5px `#7A858C`, radius 16, 58px |
| 6–10px buttons; outlined row action | Capsules; soft tint-13% row action; one solid per screen |
| Pills for filters | Segmented controls |
| Chips radius 4 | Radius 8 |
| Newsreader headings and reading text | Atkinson 700 headings, Atkinson 18px reading text; Newsreader only in the wordmark |
| `#F2F0EA` text on Teal | `#FFFFFF` (the header and footer language toggle keep `#F2F0EA`, as approved) |
| Red urgent band | Film `#0E1A22` band with a white "Call 911" capsule |

## Assets
No raster images or icon fonts. Icons are the inline SVG paths listed above (tab bar, magnifier); the planner backdrop is drawn from SVG paths and CSS circles. Third parties: Google Fonts (Atkinson Hyperlegible Next, Newsreader), Leaflet 1.9.4 + OpenStreetMap tiles (Places map only), Google Maps directions links, sakay.ph. Partner logos and an `og:image` don't exist yet.

## Open items before launch
- Type scale: body sizes still step 15/16/17/18/19/20px. Consolidate before production (needs a decision).
- Dark mode: not designed yet.
- Check: clinical review of questions and results; consider Ink question titles (see AUDIT-v6 › Check).
- Manual accessibility passes: VoiceOver, TalkBack, keyboard-only in Safari.
- Real-device install tests: iPhone (Safari › Add to Home Screen), Android (Chrome › Install).
- Lighthouse and Core Web Vitals on the production build (the prototype compiles pages in the browser).
- Generate Data d1–d15 takeaways from `claims.json` in production, as d16–d20 already are.
- Content: em dashes in existing content-pack strings; clinical review of Learn L6; DOH hotline 1555 [VERIFY]; YAKAP X-ray list; DOH-NTP lab list.
- Full facility list + geocoding; production domain for `sitemap.xml`, `robots.txt`, canonical URLs and `og:image` (`icons/og-image.png` exists).
- Placeholders: group name, contact email, partner names and logos, medical reviewer.

## Files
```
prototype/                       runnable HTML design references
  Home.dc.html                   / — route planner (v4, final direction)
  Places.dc.html                 /places — list, filters, map
  Place.dc.html                  /place/{id}
  Check.dc.html                  /check — symptom check + printable summary
  Learn.dc.html                  /learn
  Data.dc.html, DotStory.dc.html /data — dot story + 15 charts
  About.dc.html, 404.dc.html
  SiteHeader.dc.html             header, language toggle, phone tab bar
  SiteFooter.dc.html             footer
  Design System.dc.html          v3 spec (color meaning, route, chips, dots, charts)
  tbph-core.js                   shared planner logic + shared strings — port this
  support.js                     prototype runtime only — do not port
  data/                          sample facilities + statistics JSON
  robots.txt, sitemap.xml        placeholders (tbph.example.org)
reference/
  content-and-data-pack.md       canonical EN/FIL copy, chart specs, sources, glossary
  ultimate-build-source-of-truth.md   UX/SEO/accessibility checklist the build was audited against
  HANDOFF-notes-v2.md            earlier build notes: routes, logic, new strings, audit
  claude-design-prompt-v2.md     original design brief
pipeline/                        Python scripts that build the data files
  scrape_philhealth_tbdots.py, geocode_facilities.py, build_tb_ph_data.py,
  facility-services-overrides-TEMPLATE.csv, tb-dots-facilities-SAMPLE.csv
```
Not included: `v1/` (archived story-first version) and working screenshots.

---

## v5 additions (30 Oct 2026)
See the root `HANDOFF.md` › "v5" for the full list. In short:
- **Phone app (PWA):** manifest with icons and long-press shortcuts, service worker (offline after one visit; map tiles never cached), `pwa.js` (`window.TBPH_PWA`, `html[data-standalone]` and related attributes), `Install.dc.html` (v4), footer link "Install the app", `index.html` redirect, `icons/og-image.png`. When porting: rewrite `start_url` and shortcut URLs to production routes, keep HTTPS, and generate the service worker from the build tool (for example Workbox) with the same strategies.
- **Data:** `tb-ph-data.json` gains `diagnostics_network`, `financing`, `bcg_coverage` and `sdg_context`; `claims.json` holds 44 sourced EN/FIL claims. New charts d16 to d20 and the "TB in numbers" section are specified in `reference/claude-design-prompt-v3.md`.
- **Fidelity update:** Home and SiteHeader remain final v4 (approved). Install is v4. The other pages are still v3 until the v3 prompt is applied.

## v6 changes (30 October 2026)
- Every page except Home and SiteHeader moved to v4 (specs above). Footer "Last updated" is 30 October 2026.
- Bugs fixed: About › Helpful numbers rows were blank (a `<table>` with repeat blocks inside `<tbody>`); the same pattern in Data's "View as table" and Learn's myths table was replaced with ARIA tables. Data at 320px no longer scrolls sideways.
- Phone app: files and `<head>` tags unchanged; pages read `html[data-standalone|data-online]` set by `pwa.js` (via a MutationObserver) to hide install entry points when installed and to show offline lines. Entry points: footer link, About section, Place row, Check results A–C row. No launch prompt. `sw.js` VERSION bumped to `tbph-2026-10-30c`.
- Data: d16 (`diagnostics_network`; claims `test-sites`, `test-volume`; positivity sentence), d17 (`financing` received by source 2019–2024, 2025 expected and hatched; caption from `fund-cuts` and `fund-budget`), d18 (`bcg_coverage`, 2021 dip labelled; `prev-bcg`), d19 (six `sdg_context` indicators as grouped rows with year and source; `drivers-slums`), d20 (regional claims with period and source, comparability caption, link to d13), and "TB in numbers" with `#claim-{id}` anchors.
- Learn: "By the numbers" and "Back to top" per section; myths as table (wide) or rows (phone).
- `tbph-core.js`: `prep()` also returns `accr` (accreditation expiry) for the Place page.
- Evidence: `reference/AUDIT-v6.md` (Apple review ratings, contrast table, automated QA results, 20-tell check, data trace, SOT audit record). `prototype/qa-harness.html` reruns the automated checks from a local server and restores the language setting when done.
