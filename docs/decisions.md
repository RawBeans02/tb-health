# TB Health — owner decisions

Decisions the owner (Rovince) made, recorded by the TB Health lead. Question numbers refer to `docs/PLAN.md` §7.1. A decision counts only once the owner has given it; recommendations and defaults in PLAN.md are not decisions until they're listed here (or, for §7.2 defaults, until the owner overrides them).

The lead keeps this file. The Jr. Builder reads it and doesn't edit it.

## 6 November 2026 (owner, in chat with the lead)

### D22. Linux tests without GitHub Actions (amends D22)
- **The release audit doesn't wait for GitHub Actions.** The owner answered "Yes, skip Actions" to the lead's question "Should the release audit use the builder's Docker run instead of GitHub's CI?"
- **Why:** GitHub refused all five CI runs before any step started (42047181969, 42049823367, 42130658469, 42161612422 and 42169442426, 5–6 Nov). The cause was a billing hold on the GitHub account, not the code. Nothing else in TB Health uses Actions: pushes are plain git, and deploys go from the Mac to Cloudflare Pages (Q7).
- **The test evidence for step 14:**
  - the builder's full run on the Mac (the b941275 gate);
  - `ci.yml`'s steps, in its order, run on Linux in Docker on the Mac:
    - The owner approved this run on 6 Nov, answering "Yes, run them".
    - It runs against a fresh export of the pushed commit, with Node 22.23.4 and `CI=true`, in Microsoft's Playwright image for our version (`mcr.microsoft.com/playwright:v1.64.1-noble`).
    - Like CI, it ends with `npm audit`, which sends the dependency list to the npm registry that `npm install` already uses.
    - It differs from GitHub's machine in two ways: it runs on arm64 instead of x86_64, and it uses the image's fonts and libraries instead of the runner's.
- **`.github/workflows/ci.yml` stays,** with its manual trigger only. It never runs unless someone starts it, so it costs nothing, and it works again if the hold is lifted. Launch doesn't need it.

## 5 November 2026 (owner, in chat with the lead)

### Q7. Host: Cloudflare Pages (the domain is still open)
- **Cloudflare Pages, in a Cloudflare account used only for TB Health**, which the owner controls. The owner answered "Yes, Cloudflare" to the lead's question "Host TB Health on Cloudflare Pages, in an account used only for TB Health?" No KitaMo account, project or token is used.
- *Lead's reading, 5 Nov 2026, for the owner to overrule:*
  - Deploys are HANDOVER's direct upload with wrangler, run by the owner from a clean checkout of `main` (B72). No Git integration and no automatic previews.
  - Until launch, test copies are preview deploys: non-production builds with noindex, on a branch other than `main`, at a `*.pages.dev` address. A deploy to `main` is the public launch (B86).
  - The owner creates the Cloudflare account and an API token for it, and keeps the token in the Mac's Keychain. Wrangler gets it per command, like `GH_TOKEN` for pushes. There is no global `wrangler login`, because other projects on this Mac share that login (B86). The builder and lead sessions never ask for the token or use it. Only the release lines the owner runs read it. Like gh's token, it can be read by any program running as this Mac user (B88).
- **Still open:** the real domain. It's needed before launch, because it fixes the installed app's address, and HSTS then gets `includeSubDomains`.

## 4 November 2026, third batch (owner, written to the lead)

Why: PLAN.md was written from the v6 handoff. The owner asked for more changes after v6, and they're in the v7 prototype (`TB-PH-project.zip`, 4 Nov 2026). **Where v6 and v7 differ, v7 wins.**

### V1. v7 is the newer design reference
- `TB-PH-project.zip` goes into the repo unzipped to `design/v7/`. `design/v7/HANDOFF.md` › "v7" lists every change. *(Pending: the zip isn't on the Mac yet; the owner is adding it to `~/Downloads`.)*
- `design/design_handoff_tb_ph/` (v6) stays untouched, except `pipeline/build_claims.py` (V5).

### V2. Dark mode ships (overrides D2)
- Use `design/v7/theme.css`. Its light values are the existing tokens; its dark values apply under `prefers-color-scheme: dark`. **No in-app switch.**
- These stay fixed (not themed) on purpose:
  - the urgent Film screen and its white "Call 911" button;
  - the saved summary image, which is always light;
  - the map tiles and markers.
- Contrast results are in HANDOFF › v7.
- In dark mode the dot story's TB red is `#F26A72`, the red token's dark value (amends D14).
- QA covers every page in light and dark.

### V3. No em dashes in copy (overrides D6)
- Where v7 changed a string, **the v7 wording is the owner's approved wording.** Ship it, log each case in `docs/copy-overrides.md`, and run the parity test against the v7 wording for those strings. This covers:
  - page titles (e.g. "Check symptoms | TB PH");
  - the footer safety line;
  - the sector badges "Government (free TB care)" and "Private (fees may apply)";
  - "Hours not listed. Call first.";
  - the Check intro and result texts;
  - "[partner clinicians, pending]" (the clinical review itself is still pending);
  - the Learn and Data lines listed in HANDOFF › v7.
- Any other copy string that still has an em dash: **list it for the owner. Don't reword it.**

### V4. DOH hotline 1555 is verified (closes that `[VERIFY]`)
- About's note uses the v7 wording:
  - EN: "Press 2 for the National Patient Navigation and Referral Center."
  - FIL: "Pindutin ang 2 para sa National Patient Navigation and Referral Center."
- Sources the owner gave:
  - GMA News, 2025: a DOH official named 1555 as the DOH hotline, alongside 911. https://www.gmanetwork.com/news/topstories/nation/953374/doh-habagat-evacuation-drinking-water/story
  - DOH-led inter-agency advisory, 29 Sep 2023: callers choose option 2 at 1555 for patient navigation and referral. https://bmb.gov.ph/wp-content/uploads/2023/10/PhiICZ_Advisory_on_Henipavirus_29Sep2023.pdf
  - Daily Tribune, 28 Apr 2025: DOH hotline 1555, option 2, for medical emergencies. https://tribune.net.ph/2025/04/28/bulusan-volcano-erupts-alert-level-1-raised
- The Sakay.ph deep links stay `[VERIFY]`.

### V5. The content conflicts are resolved (the list under D5 and §7.3)
- The claims now use the content pack's rounding:
  - about 7,500 deaths (the 2025 milestone, `target-endtb`);
  - 27,900 people with drug-resistant TB (`tx-dr`);
  - 14% and 12% for the trend since 2015 (`burden-trend`).
- `data/claims.json` and `design/design_handoff_tb_ph/pipeline/build_claims.py` are replaced with the owner's versions. The owner chose to overwrite the v6 copy of `build_claims.py`. The lead checked that only those three claims changed (EN and FIL); ids, order and sources are the same, and only `meta.generated` moved to 2026-11-04.
- No pipeline run is needed. D5's default (the d1–d15 takeaways stay the pack's text) still applies.

### Still open
Q7 (host and domain), Q8 (full clinic list), Q11 (WHO 2026 report), Q12 (lapsed accreditations), the Filipino descriptions (Q3) and the privacy text (Q5).

## 4 November 2026 (owner, in chat with the lead)

### Plan
- **`docs/PLAN.md` approved** as revised after the independent review (commit `7ea78ff`). The builder may start step 1 (scaffold) on `build/01-scaffold`.
- Q4–Q13 stay open. The lead asks the owner before the steps that need them (grouping as in §7.1). Until then, §7.2 defaults apply.

### Q2. Language URLs
- **Filipino at `/fil/…`**, English at `/…`, both prerendered (PLAN §4.2).
- **(a) Toggle:** two links with `aria-current` on the current language, replacing README's buttons with `aria-pressed`. Log it in `docs/copy-overrides.md` as a deliberate change from the README.
- **(b) Saved choice:** a reader whose saved choice (`tbph-lang`) is Filipino is sent from **every English page** to its `/fil/` twin, keeping query and hash. Not only `/` and app launch.
- (c), (d): accepted as the costs of this option (Filipino titles and descriptions; both-language copy on Check, Places and Home).

### Q3. Copy source
- **Approved as proposed:**
  - Content-pack copy (incl. §1 global and §5 Places) ships verbatim and parity-tested.
  - Where the pack has nothing (planner, Place, Install, 404), the prototype's strings ship verbatim, flagged for EN/FIL review.
  - Where README wording differs from the pack, **README wins**. Every case is listed in `docs/copy-overrides.md` for the owner to confirm.
  - The stop explanations ("Get a chest X-ray…", "usually in 6 months") ship flagged `[REVIEW]` with Learn L6.
- **No newer content pack.** `design/design_handoff_tb_ph/reference/content-and-data-pack.md` is the latest; build from it. (The `tb-ph-content-and-data.md` cited in design prompt v2 isn't coming.)
- **Filipino descriptions for About, Data, Install, Learn and Place: the owner will supply them later.** The builder lists the strings needed (origin `owner`) and writes none. They stay blocking items in `launch-check` until supplied; the build carries on meanwhile.
- Follows from Q3 = yes: defaults D10 and D11 apply as written.

### Q4. Privacy in URLs and location (asked ahead of step 3–4)
- **Approved as recommended:**
  - `near` goes in a URL only when it matches a known city or province, never free text such as a home address.
  - Location is asked for only when the visitor taps "Use my location", including on `?loc=gps` links, which show that button instead of prompting.
  - Fix the prototype bugs: the one-letter search (82 rows), the reused stale location fix, and Retry re-prompting.
- **(a) Place links carry only `id` and `stop`.** No `need`, `near` or `loc` in links into a place page (`need=meds` hints at treatment, and links reach browser history and host logs).
- **(b) No GPS distance on the Place page.** It shows a distance only from a typed `near` (a known city or province); there's no new location control and no new copy.

### Q6. Facility data (asked ahead of step 4)
- **Approved as recommended:**
  - If the facility list fails to load, production shows "could not be loaded / Try again". It never silently falls back to the 93-row sample.
  - Stable place ids derived from the normalised name + city + province, with a suffix on collisions and an alias map so old links keep working. `prepare-data` reports which ids changed between refreshes.
  - One prerendered page per place and language.

### Q5. OpenStreetMap tiles and the privacy text (asked ahead of steps 5 and 10)
- **Use the public OpenStreetMap tile server** for the optional Places map, as specced. Add `tile.openstreetmap.org` to the CSP's `img-src` (and nothing else) when the map is built.
- **The owner writes the new EN/FIL About privacy rows** (self-hosted fonts, map tiles, the host). The builder writes none: they're `owner` strings that block in `launch-check` until supplied.

### Q9. Launching without Check (asked ahead of step 7)
- **Yes: the site may go live without `/check`** if the clinical review isn't done by launch. Check is still built in full. One build-time switch leaves it out of the nav, the phone tab bar, the manifest shortcuts and the sitemap; the tab bar then shows the remaining tabs.
- *Lead's reading, 4 Nov 2026, for the owner to overrule:* "without `/check`" means the page isn't published at all. With the switch off:
  - `/check` and `/fil/check` aren't built, so they get the 404, and the service worker doesn't precache them;
  - every standalone link or button to Check in page content (the 404's "Check symptoms" button, and later Home and Learn) is dropped by the same switch;
  - where dropping a link would leave a sentence that still mentions the check, the builder lists it for the owner and doesn't reword it.

### Q10. Check question titles (asked ahead of step 7)
- **TB red, as specced** in the README (not Ink as AUDIT-v6 suggests).

### Q13. No-X-ray rule (asked ahead of step 3)
- **README:293's rule:** the referral note shows only when no confirmed X-ray site exists at all, not when none is within 10 km.

### Search quirks kept from the prototype (asked during step 4)
- **Fix all three.** None needs new copy:
  - common abbreviations find their place, e.g. "QC" finds Quezon City. A short abbreviation list is kept as data, and each entry is listed for the owner;
  - two letters match only the start of a word ("ab" no longer matches Malabon, Cabanatuan or Tabuk);
  - a typed city is placed at the centre of its clinics' pins, worked out from our own data, not at its first clinic's pin (which made the nearest clinic read "about 1 km").

## 30 October 2026 (owner, via the Account Admin)

### Q1. Node
- Node 22 LTS through nvm for tb-health only, pinned in `.nvmrc`. nvm's default alias and the global/Homebrew Node stay unchanged (the KitaMo builders use them).
