# Waiting on the owner

Kept by the TB Health lead. Updated 13 November 2026, after the step 15 release. Answer in chat in any order; each answer is recorded in `docs/decisions.md`. The O and C numbers point to `docs/audit-2026-11-05.md`, which gives the options and the reasons. What changed for the launch, and its test evidence, is in `docs/launch-2026-11-08.md`; step 15's checks and the per-page design review are in `docs/AUDIT-build.md` (its first section); the step 15 release is in `docs/release-2026-11-13.md`.

## Now

- **Step 15 is live** at https://tb-ph.pages.dev since 13 November, and you reported your phone check the same night: "check done, its great, even the night mode" (R4). If something from the device list in `docs/AUDIT-build.md` ("The device list (step 15)") shows up later, tell the lead: the phone, the browser or the installed app, and the page.

Step 15.4 (worst-case data) went live on these defaults; say if any should change.
- **Badges on one line?** The brief lists `white-space: nowrap` for badges. In Filipino, the Government badge, "Pampubliko (libreng gamutan sa TB)", is wider than a clinic's row on a 320px phone, so on one line it would run off the screen. Default: it wraps onto two even lines and nothing is cut. The other choice is a shorter badge, which is new text for you to write.
- **Which number Call dials.** The brief says Call "dials the first number". Since the launch (audit O10, option a, kept by R2), it dials the first number any phone can dial, and the whole phone field stays under Details. The two differ only when the first number listed can't be dialled from a mobile, as on Renmar Specialists' Hospital's row (`0935665572/0783052743/…`) or a field such as `518-2632/0922-8162458`. Default: keep the launch rule.
- **Two small departures from v8**, each only where v8's numbers break a label: the Commute button in a route row pads 14px instead of 18px (at 320px in Filipino, "Paano mag-commute" broke after "mag-"), and the filter segments are at least as wide as their longest word (v8's rule split "Government" mid-word at 1280px). Default: keep both.

The lead's calls in step 15 that you can overrule (each report explains them):
- **No GitHub Actions (V21):** step 15.7 removed `.github/workflows/ci.yml`, which only ran when started by hand. The Linux check is `scripts/linux-check.sh`, in Docker on the Mac.
- **Phone feel (15.3):** Home's "I need" rows and Check's answers get the pressed state too; a do-nothing touch listener lets iPhones show it; the Filters sheet is sized in `dvh`, though v8's Places prototype keeps `vh`.
- **The Places map (V22):** the device's main pointer decides, so a touch-screen laptop keeps one-finger drag; no hint about two fingers (a hint would be new text for you).
- **The Filters sheet (15.5):** no spring or rubber band when it's pulled up; the device check decides whether it needs them.

## Before a later release

- **The Linux check?** `scripts/linux-check.sh` (Docker on the Mac, HANDOVER's "Linux check on the Mac") has never run: the launch (R2) and step 15 went without it, on the default. Your call before the next release; every other suite runs on the Mac.
- **The clinical review's 13 strings:** R1 and R3 each accepted them for one release, so the next release asks again unless the review is recorded first.

## Decided (in `docs/decisions.md`)

- **R3, 13 Nov ("Yes, release"):** step 15 went live with the 13 strings that wait on the clinical review, as at the launch (`--accept=review`); the review itself stays open.
- **R4, 13 Nov ("I'll check them"):** you check step 15's device list on your phones, after the release. Done the same night: "check done, its great, even the night mode".

- **Q7, 7 Nov:** a public launch on a free `*.pages.dev` address, built without Check (`TBPH_CHECK=false`).
- **Q8, 7 Nov:** the full PhilHealth list, geocoded with Nominatim; the run and its 8 Nov corrections are in `docs/data-refresh-2026-11-07.md`.
- **Q5, Q3 and Q9, 8 Nov ("Approve all"):** the privacy row, the Filipino page descriptions and the wording without Check.
- **Q8, 8 Nov ("Approve the credit"):** the OpenStreetMap credit for the clinic positions, in every page's footer.
- **A2 and A3, 9 Nov:** About names Amazing Research Labs, without the partner hospitals ("Yes, drop it"), and the site launches without a contact email ("launch without one"): no Contact section, no "tell us at …".
- **R2, 9 Nov ("Yes, v6 defaults"):** the v6 design, no Linux check before launch, O2–O27 as they are, no alt text for the link-preview image.
- **R1, 8 Nov ("Yes, ship them"):** the 13 strings that wait on the clinical review ship with the launch (`--accept=review`); the review itself stays open.
- **A1, 8 Nov ("Yes, drop both"):** no "Our partners" or "Medical review" section on About at launch; About's description no longer mentions how the health content is reviewed.
- **Step 15:** V6 to V14, the fourth batch sent on 10 Nov (v8, dark mode, no em dashes, " | " titles, Learn L5, "Aksesibilidad", the claims' rounding, no glisse, the skills); V15 to V20, 11 Nov ("Use the defaults"); V21, 11 Nov (no GitHub Actions); V22, 11 Nov ("Yes, fix O9": one finger scrolls past the map).

## After the launch

- **Place search** (`src/lib/core/geo.ts`, reviewed three times on 8 Nov; see `docs/launch-2026-11-08.md`). Choices the lead made for you to confirm: in "<barangay>, <town>" the town after the comma wins a tie ("San Isidro, Tanauan" is Tanauan), which costs "<town>, <barangay>" written town-first ("Lubao, San Isidro" goes to San Isidro, Bohol); "…, Cebu" and "…, Iloilo" keep the cities; "Carmen, Cotabato" is Carmen, North Cotabato; "Rizal, Palawan" is the town Rizal (Marcos). Still open: island groups ("…, Luzon"); a city typed without "City" with its province ("Zamboanga, Zamboanga del Sur", "Tacloban, Leyte"), which needs city-to-province data; spellings the list doesn't hold ("General Trias" for "Gen. Trias", "Abra de Ilog" for "Abra del Ilog"); "M.M." for Metro Manila; namesake towns still tie by label order. O1's hint asking for a city or province would help.
- **Phones:** 30 clinics list only numbers that can't be dialled and 60 only a local number without its area code (row numbers in `docs/data-refresh-2026-11-07.md`). Partners could confirm them.
- **The clinic list:**
  - who refreshes it each month, and the oldest list date you'll accept (launch-check shows the current date);
  - Q12, the lapsed accreditations: 85 at the launch, 91 on 12 Nov, with 1,530 more ending by 31 Dec (launch-check counts them; D24 applies until you decide);
  - pipeline fixes before the next run: look up city groups with their province, read "Sta."/"Sto.", reject generic address text, and stop on a pin far from its province's other clinics.
- **The sample fixture** (`data/tb-dots-facilities-SAMPLE.json`, the browser tests' 93 rows) carries the clinics' email column on 92 rows. Dropping it is a repository clean-up for your OK.
- **Filipino review (V20):** the dot story's screen-reader label for beat 4 (`src/content/dotstory.ts`) calls the died dots "itim" (black), but in dark mode they're near-white.
- **From the per-page design review (step 15.7, both Low; details in `docs/AUDIT-build.md`):**
  - the "Offers this" chip on Places and Place rows is the solid teal of the main button, while the other chips are outlined, so a status looks like an action on every row: an outlined chip would match the others;
  - in dark mode the map tiles stay light (V7), so a bright map sits in a dark page: Apple's guidelines suggest darkening such images slightly, which would change V7.
- **Still open from earlier:**
  - O11: four symptom-check cases for the clinical review, and whether the summary card should list risk factors such as HIV (RA 10173), when Check returns;
  - the copy overrides in `docs/copy-overrides.md`;
  - C4–C11 with the content owner;
  - Q11 (the WHO 2026 report);
  - O12: the reuse terms for the WHO data and the PhilHealth list;
  - O2, O3, O5's hover half, O18, O24, O27 and O28 (step 15 fixed O4, O5's pressed half and O9), and the device checks in the audit report (a real iPhone and Android phone, VoiceOver, TalkBack, a Safari keyboard pass);
  - the Sakay.ph deep links stay [VERIFY]; the site copies the address and opens sakay.ph instead.
