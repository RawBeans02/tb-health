# Waiting on the owner

Kept by the TB Health lead. Updated 5 November 2026 (after the review of the fixes B44-B68). Answer in chat in any order; each answer is recorded in `docs/decisions.md`. The O and C numbers point to `docs/audit-2026-11-05.md`, which gives the options and the reasons.

## Decide now

1. **Q7. The web address (domain).** The host is decided: Cloudflare Pages, in a TB Health-only account you control (`docs/decisions.md`, 5 Nov). Still open is the real domain. It's needed before the public launch, because an installed app is tied to its address. Until then, test copies use the free `*.pages.dev` address. The builder reads the address from one setting (`SITE_URL`), so your answer is a config change. Once the domain is known, HSTS also gets `includeSubDomains`.
   - **When you're ready:** create the Cloudflare account yourself (with an email that isn't KitaMo's). Then run HANDOVER's one-time setup: log in, check the account, create the project. The lead sends you the exact commands.
2. **O1. Typed barangays and landmarks hit a dead end.** The field asks for a barangay, but the site only knows cities and provinces. Recommended: the field's hint asks for a city or province (you write the new hint in EN and FIL), and the no-match state links to the full list. Revisit after the full clinic list (Q8).
3. **O11. Four symptom-check cases for the clinical reviewers.** The code follows the content pack exactly, and two independent checks found no routing difference. In four cases, though, the pack's own wording conflicts, e.g. "No signs of TB right now" for someone who reported current symptoms. Recommended: add them to the clinical review list.
   - **Also for the clinical review:** whether the saved or printed summary card should list risk factors such as HIV. That is sensitive health information under the Data Privacy Act (RA 10173).
4. **Place abbreviations** the builder added to the place search: QC, CDO, GenSan, SJDM, Dasma, CamSur, CamNorte, NegOcc, NegOr. Confirm them or strike any that are wrong or too local.
5. **Seven wording overrides** in `docs/copy-overrides.md`, where the README's or the prototype's wording ships instead of the content pack's (e.g. "Commute directions", "Call before you go", "Find TB care"). Confirm or change them.
6. **The smaller design items, in one go.** Accept my recommendations for O2 to O7, O9, O10, O13 to O17, O19 to O21 and O24 to O26 (O16 means "keep as designed"). Also record O23 (don't adopt Glisse; port three small behaviours) and O27 (keep the frosted Home card as an approved exception). Several need a short line of wording from you; they're listed below.
   - **O3 (short tab labels) matters more than the audit said.** The builder measured the phone tab bar:
     - English labels already take two lines at 390px;
     - "Check symptoms" overflows its tab by 6px at 320px, even at the default text size.

     Until short labels land, Check's Next button sits 11px higher on phones than in the prototype. That keeps the README's 14px gap above the bar (my call; say if you'd rather keep the prototype's 3px). With short labels it goes back to the README position.

## Wording only you can write (EN and FIL)

- **The privacy row** (`about.privacyServices`, Q5). The site can't launch publicly without it: the release check blocks until it's written, because the Data Privacy Act (RA 10173) expects visitors to be told who else sees what. It must cover:
  - fonts are served by TB PH itself;
  - the web host sees IP address, browser and pages visited;
  - OpenStreetMap sees IP and the map area, and only if the map is opened;
  - directions hand off to Google Maps, which then sees the chosen place;
  - for Sakay.ph, the site copies the address and opens sakay.ph, which sees the place only if the reader pastes it there;
  - calls go through the phone.
- **Filipino page descriptions** for About, Data, Install, Learn and Place (Q3), and description templates for place pages (C10).
- **If you accept them:**
  - short tab labels (O3);
  - a city-or-province hint for the location field (O1);
  - a message for a location timeout (O6);
  - Filipino names for the map's buttons (O13);
  - a hidden "opens Google Maps in a new tab" phrase for screen readers (O14);
  - a message for locations outside the Philippines (O21);
  - "shared" and "couldn't save" lines for the summary image (O22).
- **Alt text** for the link-preview image.
- **Launch without Check (Q9):** versions without the check, or a yes to keep these as they are: `install.off2`, `install.lead`, `about.disclaimerText`, `about.privacy1`, `about.appText`, `meta.installDescription`, the 404 lead (C3, C8), and `home.bring3`, "Your TB check summary" in every route's What to bring list (found in the step 13 review).
- **Placeholders:** group name, partners, medical reviewer, contact emails (`launch-check` lists them).
- **Calls to make with the content owner:**
  - C4: explain jargon at first use;
  - C5: em dashes outside v7's list;
  - C6: one name for a listed facility;
  - C7: one Filipino register;
  - C9: "never saved" lines beside Save, Share and Print;
  - C11: lines that go stale with the WHO 2026 report.

## Waiting on something else

- **The v7 design** (`TB-PH-project.zip`): not on the Mac yet. Dark mode and the v7 wording wait for it, and so does the public launch, unless you decide to launch on the current design (v6) without them.
- **Q8. The full clinic list** (a pipeline run with your OK), then O8 (the same centers repeated under every stop).
- **Q11** (WHO 2026 report) and **Q12** (lapsed accreditations; default D24 applies until you decide).
- **O12.** Record the reuse terms for the WHO data and the PhilHealth list, before step 14.
- **O18 and O28:** try them on a real iPhone and Android phone first.
- **Device checks:** the runtime checks listed in the audit report, including installing the app on a real iPhone and Android phone, VoiceOver, TalkBack and a Safari keyboard pass.
- **Type sizes (D1):** the build uses the exact sizes the design specifies. Merging them into a smaller set later is a one-file change. Recommended: keep them as they are for launch.
- **Keeping the clinic list fresh:** who refreshes the list each month, and the oldest list date you'll accept. launch-check shows the current date.
- **Sakay.ph:** the site copies the address and opens sakay.ph, so no deep link ships. The deep links stay [VERIFY] until someone confirms Sakay's link format.
- **The first CI run (D22).** It comes after the merge to `main`: GitHub runs a manual workflow only once its file is on the default branch. Then start "CI" from the repository's Actions tab; it never runs on its own. One step, `npm audit`, sends the list of dependencies to the npm registry, the same registry `npm install` already uses. The run's result is step 14 evidence.
