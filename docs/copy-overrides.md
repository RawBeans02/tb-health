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

### `dotStory.b7_find`: "Find TB care near you" (step 9)
- **Pack :81 and :84 (dot story, beat 7 buttons):** "Find a TB-DOTS center" / "Hanapin ang TB-DOTS center".
- **README:236 and the prototype (ship):** "Find TB care near you" / "Hanapin ang gamutan malapit sa iyo", the soft button beside "Check your symptoms" at the end of the dot story. It leads to the planner (`/`, or `/fil`), like Learn's L5 button with the same words.

### `about.updatesText`: the data date (step 10)
- **Prototype (About › Data and updates):** "Data last updated 30 October 2026." / "Huling update ng datos: 30 Oktubre 2026."
- **Ships:** the same sentence with the date from the data files, as in the footer credit (`chrome.credit`), so it reads 4 November 2026 today and moves with the next refresh. The only other date in page copy, the Data page's "retrieved 23 October 2026" (`charts`, monthly notifications), is a retrieval date and stays as written.

## The owner's own wording (`decision` strings)

Strings whose wording the owner gave in `docs/decisions.md`; the parity test finds each one, in quotes, in the decision it names (by id, such as V4, not by line).

### `about.privacyServices` (Q5, 8 Nov 2026)
- **Ships (Q5 in decisions.md):** "TB PH serves its own fonts, so no font service sees your visit. Our web host, Cloudflare, sees your IP address, your browser and the pages you open. The map comes from OpenStreetMap, and only if you open it; OpenStreetMap then sees your IP address and the area on the map, which is around you if you used your location. Directions open in Google Maps, which then sees the place you chose. For Sakay.ph, we copy the address and open sakay.ph, which sees it only if you paste it there. Calls go through your phone." / "Ang TB PH mismo ang nagbibigay ng mga font nito, kaya walang font service na nakakakita sa pagbisita mo. Nakikita ng aming web host, ang Cloudflare, ang IP address mo, ang browser mo at ang mga pahinang binubuksan mo. Galing sa OpenStreetMap ang mapa, at kapag binuksan mo lang ito; makikita ng OpenStreetMap ang IP address mo at ang lugar na nasa mapa, na nasa paligid mo kung ginamit mo ang lokasyon mo. Sa Google Maps bumubukas ang direksiyon, kaya makikita nito ang lugar na pinili mo. Para sa Sakay.ph, kinokopya namin ang address at binubuksan ang sakay.ph; makikita lang nito ang address kung i-paste mo ito roon. Dumadaan sa phone mo ang mga tawag."

### `install.leadNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "Add it to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." / "Idagdag ito sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."

### `about.appTextNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "Add TB PH to your home screen. It opens full screen, and once it has been opened, the planner and Learn still work without a signal." / "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at kapag nabuksan na minsan, gumagana pa rin ang planner at ang Alamin kahit walang signal."

### `meta.installDescriptionNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "Add TB PH to your home screen. It opens full screen, and the planner and Learn still open without a signal." / "Idagdag ang TB PH sa home screen mo. Bumubukas ito nang full screen, at nabubuksan pa rin ang planner at ang Alamin kahit walang signal."

### `about.disclaimerTextNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "This website provides general health information and does not replace a consultation with a doctor or health worker. In an emergency, call 911." / "Pangkalahatang impormasyong pangkalusugan ang ibinibigay ng website na ito at hindi ito kapalit ng konsultasyon sa doktor o health worker. Sa emergency, tumawag sa 911."

### `about.privacy1NoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "There are no accounts, and we don't collect personal information." / "Walang account, at hindi kami kumukuha ng personal na impormasyon."

### `notFound.leadNoCheck` (Q9, 8 Nov 2026)
- **Ships (Q9 in decisions.md):** "The link may be old or mistyped. This will get you back on track:" / "Maaaring luma o mali ang link. Makatutulong ito:"

### `about.n1555_note`: the DOH hotline note (step 10, V4)
- **Prototype:** "[VERIFY] Confirm before launch" / "[VERIFY] Kumpirmahin bago ilunsad", in TB red.
- **Ships (V4 in decisions.md, the v7 wording):** "Press 2 for the National Patient Navigation and Referral Center." / "Pindutin ang 2 para sa National Patient Navigation and Referral Center.", in the muted note colour, since it is no longer a `[VERIFY]`.
