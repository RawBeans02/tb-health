# Copy overrides

Places where the build uses README or prototype wording instead of the content pack, or changes a specced behaviour, for the owner to confirm (approved in principle, Q3 and Q2a in `docs/decisions.md`). The rule: where README differs from the pack, README wins (Q3).

Each string entry names its dictionary id (`src/content/…`). `tests/unit/parity.test.ts` fails if a string marked `override` isn't listed here.

## Behaviour

### Language toggle: links instead of buttons (Q2a, step 2)
- **README:131 and :143:** two buttons, "English" / "Filipino", with `lang` and `aria-pressed`, in a group labelled "Language / Wika".
- **Ships:** two links with the same labels, `lang`, `hreflang` and look, in the same group. The current language has `aria-current="true"` instead of `aria-pressed`. Each link goes to the same page in the other language, keeping the query and hash (Filipino at `/fil/…`, Q2). On Check, Places and Home while a location fix is held, the switch happens in place without a navigation (PLAN §4.2).
- **Why:** each language has its own URL now, so the toggle navigates. Links work without JavaScript and can be opened in a new tab.
- One visual detail: the toggle's corners are rounded on the links rather than clipped with `overflow: hidden`, so the focus ring isn't cut off. It looks the same.

## Strings

### `chrome.nav_home`: "Find TB care" (step 2)
- **Pack :17 and :20:** the Home page is "Home" / "Simula" at `/`, and the facility finder is "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center" at `/find`.
- **README:130 (ships):** "Find TB care" / "Hanapin ang gamutan" for the first nav item and tab. It leads to `/` (the planner), and the full list lives at `/places`, which marks the same item as current (README:133).

### `chrome.credit`: the data date (step 2)
- **Pack :35–36:** "… Last updated 23 October 2026." / "… Huling update: 23 Oktubre 2026."
- **README:144 and the prototype footer (ships):** "… Last updated 30 October 2026." / "… Huling update: 30 Oktubre 2026."
- The date isn't typed into the string: it is the newest `generated` date in `data/tb-ph-data.json` and `data/claims.json`, so it follows the data. The pack's 23 October and the README's 30 October were each the newest data-file date at the time; since the owner's new `claims.json` (V5, 4 November 2026) the footer reads 4 November 2026.

### `care.commute`, `care.call`, `care.sakay`: place actions (steps 4–6)
- **Pack :406–408 (Places card buttons):** "Call" / "Tumawag", "Get directions" / "Paano pumunta", "Copy address" / "Kopyahin ang address".
- **README:193, :208, :217 and the prototype (ship):** "Call before you go" / "Tumawag bago pumunta" (a text link), "Commute directions" / "Paano mag-commute" (Google Maps transit directions in a new tab, with Walk and Drive beside it on the Place page), and "Copy address for Sakay.ph" / "Kopyahin ang address para sa Sakay.ph" (copies the address, then opens sakay.ph). The Sakay.ph link itself stays `[VERIFY]`.

### `check.res_A_find`: "Plan my route to a test" (step 7, D11)
- **Pack :321 and :328 (result A buttons):** "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center".
- **README:226 and the prototype (ship):** "Plan my route to a test" / "Planuhin ang daan papunta sa pagsusuri", the solid button on results A, B and C, leading to the planner with the whole route (`/?need=all`, or `/fil?need=all`).

## Still to come (added with their steps)
- Other 23 vs 30 October dates in page copy (steps 8–10).
