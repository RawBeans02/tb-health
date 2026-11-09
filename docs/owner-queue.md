# Waiting on the owner

Kept by the TB Health lead. Updated 9 November 2026. Answer in chat in any order; each answer is recorded in `docs/decisions.md`. The O and C numbers point to `docs/audit-2026-11-05.md`, which gives the options and the reasons. What changed for the launch, and its test evidence, is in `docs/launch-2026-11-08.md`.

## Before the public launch

1. **Facts for the About page.** The release check blocks on its placeholders (`about.lede`, `about.a11yText`, `about.contactRow`):
   - the group's name;
   - whether the intro is true as written: "a team of researchers and data scientists, working with partner hospitals that care for people with TB". With no partner hospitals named at launch (A1), "working with partner hospitals" may need to go or change;
   - the contact email, for the Contact row and the accessibility row ("tell us at [email]").
2. **Cloudflare.** HANDOVER's one-time setup (the account, a Pages-only API token in the Keychain, the project), then the `*.pages.dev` address, which the release build takes as `SITE_URL`.

## Decided (in `docs/decisions.md`)

- **Q7, 7 Nov:** a public launch on a free `*.pages.dev` address, built without Check (`TBPH_CHECK=false`).
- **Q8, 7 Nov:** the full PhilHealth list, geocoded with Nominatim; the run and its 8 Nov corrections are in `docs/data-refresh-2026-11-07.md`.
- **Q5, Q3 and Q9, 8 Nov ("Approve all"):** the privacy row, the Filipino page descriptions and the wording without Check.
- **Q8, 8 Nov ("Approve the credit"):** the OpenStreetMap credit for the clinic positions, in every page's footer.
- **R2, 9 Nov ("Yes, v6 defaults"):** the v6 design, no Linux check before launch, O2–O27 as they are, no alt text for the link-preview image.
- **R1, 8 Nov ("Yes, ship them"):** the 13 strings that wait on the clinical review ship with the launch (`--accept=review`); the review itself stays open.
- **A1, 8 Nov ("Yes, drop both"):** no "Our partners" or "Medical review" section on About at launch; About's description no longer mentions how the health content is reviewed.

## After the launch

- **Place search** (`src/lib/core/geo.ts`, reviewed three times on 8 Nov; see `docs/launch-2026-11-08.md`). Choices the lead made for you to confirm: in "<barangay>, <town>" the town after the comma wins a tie ("San Isidro, Tanauan" is Tanauan), which costs "<town>, <barangay>" written town-first ("Lubao, San Isidro" goes to San Isidro, Bohol); "…, Cebu" and "…, Iloilo" keep the cities; "Carmen, Cotabato" is Carmen, North Cotabato; "Rizal, Palawan" is the town Rizal (Marcos). Still open: island groups ("…, Luzon"); a city typed without "City" with its province ("Zamboanga, Zamboanga del Sur", "Tacloban, Leyte"), which needs city-to-province data; spellings the list doesn't hold ("General Trias" for "Gen. Trias", "Abra de Ilog" for "Abra del Ilog"); "M.M." for Metro Manila; namesake towns still tie by label order. O1's hint asking for a city or province would help.
- **Phones:** 30 clinics list only numbers that can't be dialled and 60 only a local number without its area code (row numbers in `docs/data-refresh-2026-11-07.md`). Partners could confirm them.
- **The clinic list:**
  - who refreshes it each month, and the oldest list date you'll accept (launch-check shows the current date);
  - Q12, the 85 lapsed accreditations (D24 applies until you decide);
  - pipeline fixes before the next run: look up city groups with their province, read "Sta."/"Sto.", reject generic address text, and stop on a pin far from its province's other clinics.
- **The sample fixture** (`data/tb-dots-facilities-SAMPLE.json`, the browser tests' 93 rows) carries the clinics' email column on 92 rows. Dropping it is a repository clean-up for your OK.
- **Still open from earlier:**
  - O11: four symptom-check cases for the clinical review, and whether the summary card should list risk factors such as HIV (RA 10173), when Check returns;
  - the copy overrides in `docs/copy-overrides.md`;
  - C4–C11 with the content owner;
  - Q11 (the WHO 2026 report);
  - O12: the reuse terms for the WHO data and the PhilHealth list;
  - O18 and O28, and the device checks in the audit report (a real iPhone and Android phone, VoiceOver, TalkBack, a Safari keyboard pass);
  - the Sakay.ph deep links stay [VERIFY]; the site copies the address and opens sakay.ph instead.
