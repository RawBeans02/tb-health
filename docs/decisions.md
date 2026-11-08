# TB Health — owner decisions

Decisions the owner (Rovince) made, recorded by the TB Health lead. Question numbers refer to `docs/PLAN.md` §7.1. A decision counts only once the owner has given it; recommendations and defaults in PLAN.md are not decisions until they're listed here (or, for §7.2 defaults, until the owner overrides them).

The lead keeps this file. The Jr. Builder reads it and doesn't edit it.

## 8 November 2026 (owner, in chat with the lead)

### R1. The launch ships the strings that wait on the clinical review (release key [review])
- **The owner accepts the release check's [review] key for the launch:** the 13 strings flagged [REVIEW] ship before their clinical review. They are the route's step titles and texts (`care.stopTitle_xray`, `care.stopTitle_test`, `care.stopTitle_meds`, `care.stopText_xray`, `care.stopText_test`, `care.stopText_meds`) and Learn's Treatment section (L6: `learn.l6_h`, `learn.l6_p1` to `learn.l6_p6`), all verbatim from the content pack. The owner answered "Yes, ship them" to the lead's question "Ship the 13 strings still awaiting clinical review with the launch?" on 8 Nov 2026.
- **What follows:** the release command runs `npm run release-check -- --accept=review` (HANDOVER, "Each release", step 4). Check stays out of the launch build (Q9).
- **Still open:** the clinical review itself. The [REVIEW] flags stay on these strings until it is recorded, and launch-check keeps listing them.

### A1. About: no partner-hospitals or medical-reviewer rows at launch
- **The About page launches without the prototype's "Our partners" and "Medical review" sections** (README:245 lists them; their rows were placeholders: "Partner hospitals (names and logos to come)" and "Health content reviewed by [name, credentials, hospital] on [date]"). The owner answered "Yes, drop both" to the lead's question "Drop the partner-hospitals and medical-reviewer rows for launch?" on 8 Nov 2026.
- **What follows:** About's page description no longer promises how the health content is reviewed: `meta.aboutDescription` EN "Who makes TB PH, privacy, accessibility, data updates and helpful phone numbers." FIL "Kung sino ang gumagawa ng TB PH, privacy, accessibility, mga update sa datos at mga numerong makatutulong." (the prototype's and Q3's wording without that clause, as the owner queue said it would be).
- **Still open:** the clinical review itself (Check, Learn L6) is unchanged and still pending; the sections come back when there are partner names or a reviewer to name.

### Q8. The OpenStreetMap credit (the owner's wording)
- **The owner approved the lead's draft** of the credit for the clinic positions. They are OpenStreetMap data, from the Nominatim lookups of the Q8 run (7 Nov), and OpenStreetMap asks for a credit wherever its data is used (PLAN.md, Q8: "wording yours"). The owner answered "Approve the credit" to the lead's question "Approve the OpenStreetMap credit for the site footer?" on 8 Nov 2026.
  - `chrome.creditOsm`: EN "Clinic positions:" FIL "Mga lokasyon ng klinika:". In every page's footer, under the data credit, it's followed by "© OpenStreetMap contributors", a link to https://www.openstreetmap.org/copyright, the same in both languages (the map already credits OpenStreetMap the same way).

### Q5. The privacy row (the owner's wording)
- **The owner approved the lead's draft** of `about.privacyServices`, the About › Privacy row on outside services (item 5 of the lead's launch wording list, drafted 7 Nov 2026). The owner answered "Approve all" to the lead's question "Do you approve the launch wording file as drafted?" on 8 Nov 2026. That approves items 5–17; items 1–4 (group name, contact email, partner hospitals, medical reviewer) ask for facts and are still open. It ships as written:
  - `about.privacyServices`: EN "TB PH serves its own fonts, so no font service sees your visit. Our web host, Cloudflare, sees your IP address, your browser and the pages you open. The map comes from OpenStreetMap, and only if you open it; OpenStreetMap then sees your IP address and the area on the map, which is around you if you used your location. Directions open in Google Maps, which then sees the place you chose. For Sakay.ph, we copy the address and open sakay.ph, which sees it only if you paste it there. Calls go through your phone." FIL "Ang TB PH mismo ang nagbibigay ng mga font nito, kaya walang font service na nakakakita sa pagbisita mo. Nakikita ng aming web host, ang Cloudflare, ang IP address mo, ang browser mo at ang mga pahinang binubuksan mo. Galing sa OpenStreetMap ang mapa, at kapag binuksan mo lang ito; makikita ng OpenStreetMap ang IP address mo at ang lugar na nasa mapa, na nasa paligid mo kung ginamit mo ang lokasyon mo. Sa Google Maps bumubukas ang direksiyon, kaya makikita nito ang lugar na pinili mo. Para sa Sakay.ph, kinokopya namin ang address at binubuksan ang sakay.ph; makikita lang nito ang address kung i-paste mo ito roon. Dumadaan sa phone mo ang mga tawag."

### Q3. Filipino page descriptions (the owner's wording)
- **The owner approved the lead's drafts** of the Filipino descriptions (items 13–17). The English stays the prototype's. `meta.installDescription` is the version for a build with Check; a build without Check ships `meta.installDescriptionNoCheck` (Q9 below).
  - `meta.aboutDescription`: "Kung sino ang gumagawa ng TB PH, paano sinusuri ang nilalamang pangkalusugan, privacy, accessibility, mga update sa datos at mga numerong makatutulong."
  - `meta.dataDescription`: "Ang TB sa Pilipinas sa mga numero: mga kaso, pagkamatay, mga kasong hindi natutukoy, pagsusuri, gamutan, pondo at pag-iwas, kasama ang mga pinagmulan at talaan ng bawat chart."
  - `meta.installDescription`: "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at nabubuksan pa rin ang planner, ang symptom check at ang Alamin kahit walang signal."
  - `meta.learnDescription`: "Ano ang TB, paano ito kumakalat, mga senyales at sintomas, sino ang mas nanganganib, libreng pagsusuri at gamutan, drug-resistant TB, pag-iwas, pamumuhay nang may TB, at mga maling akala."
  - `meta.placeDescription`: "Mga serbisyo, oras, telepono at direksiyon ng isang TB-DOTS center sa Pilipinas."

### Q9. Launch wording without Check (the owner's wording)
- **The owner approved the lead's drafts** for a build without Check (items 6–12). Each cuts the symptom check from a string that named it; the 404's lead says "This" above its single button. A build without Check ships these instead of the strings they replace, and leaves out `install.off2` and `home.bring3` (no new words):
  - `install.leadNoCheck`: EN "Add it to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." FIL "Idagdag ito sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."
  - `about.appTextNoCheck`: EN "Add TB PH to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." FIL "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."
  - `meta.installDescriptionNoCheck`: EN "Add TB PH to your home screen. It opens full screen, and the planner and Learn still open without a signal." FIL "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at nabubuksan pa rin ang planner at ang Alamin kahit walang signal."
  - `about.disclaimerTextNoCheck`: EN "This website provides general health information and does not replace a consultation with a doctor or health worker. In an emergency, call 911." FIL "Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Sa emergency, tumawag sa 911."
  - `about.privacy1NoCheck`: EN "There are no accounts, and we don't collect personal information." FIL "Walang account, at hindi kami kumukuha ng personal na impormasyon."
  - `notFound.leadNoCheck`: EN "The link may be old or mistyped. This will get you back on track:" FIL "Maaaring luma o mali ang link. Makatutulong ito:"

## 7 November 2026 (owner, in chat with the lead)

### Q7. Public launch tonight, at the free pages.dev address (answers Q7 in part)
- **The site goes public tonight, 7 November 2026, at the free `*.pages.dev` address** that Cloudflare gives the project. The owner answered "Public, free address" to the lead's question "What must be live tonight?". The other options were a public launch on a real domain, which would have to be bought and set up tonight, and a test copy only.
- **Why:** the owner's deadline is tonight.
- **What follows:**
  - The release is built with `SITE_URL=https://<subdomain>.pages.dev`, the address `pages project create` prints (HANDOVER, "Each release").
  - Installed apps are tied to that address. If a domain comes later, anyone who installed the app before the move has to install it again.
  - Under Q9 (4 Nov), the clinical review isn't done, so the launch is built with `TBPH_CHECK=false`.
- **Still open:** the domain (Q7), and the rest of what the launch needs from the owner (`docs/owner-queue.md`).

### Q8. The full clinic list: run the pipeline now
- **The owner approved the pipeline run.** The owner answered "Yes, run it" to the lead's question "May the builder fetch the full clinic list from PhilHealth now?". The question said what the run does:
  - downloads PhilHealth's TB-DOTS list, one PDF;
  - looks up about 2,100 clinic addresses on OpenStreetMap's Nominatim, one per second;
  - installs two Python packages, pdfplumber and requests.
- **The lead ran it** in the lead's scratch folder, not the builder's checkout, so the hour of lookups could start at once.
  - **The PDF:** `DOTS_093026.pdf`, "List of Accredited TB DOTS Clinics for CY 2026 Updated as of September 30, 2026".
    - It was the only TB-DOTS list on PhilHealth's page on 7 Nov 2026 (Last-Modified 15 Oct 2026).
    - 4,017,609 bytes, SHA-256 `afb171c6aff3a3a0ba0591b6f765b1afeebb746379ffd05c4f51803d77ecf612`.
  - **The parse:** 2,097 facilities in all 17 regions, rows 1–2,097 with no gaps or duplicates, and all 85 pages read as ruled tables.
  - **The lookups:** the pipeline's queries, parameters and 1.1-second pause, in one thread, with every result cached.
    - No contact email was given, so the User-Agent names the project's public repository: `TB-PH-route-planner (https://github.com/RawBeans02/tb-health)`. The owner can give an email instead.
    - Every city is looked up first. Then come the address and name lookups, starting with the cities that have the most clinics.
    - A clinic the lookups don't reach before the launch keeps its city's pin, and the site marks its distance as approximate.

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
