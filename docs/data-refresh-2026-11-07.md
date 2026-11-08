# Clinic list refresh, 7 November 2026

The first full run of the clinic-list pipeline (Q8, approved by the owner on 7 Nov 2026), run by the TB Health lead. It replaces the 93-row design sample with PhilHealth's full list. The decision and the approval are in `docs/decisions.md` (Q8, 7 Nov).

## Source

- **PhilHealth, "List of Accredited TB DOTS Clinics for CY 2026 Updated as of September 30, 2026"** (`DOTS_093026.pdf`), from https://www.philhealth.gov.ph/partners/providers/facilities/accredited/, the only TB-DOTS list on that page on 7 Nov 2026 (Last-Modified 15 Oct 2026). 4,017,609 bytes, SHA-256 `afb171c6aff3a3a0ba0591b6f765b1afeebb746379ffd05c4f51803d77ecf612`, 85 pages.
- **Parse** (`design/design_handoff_tb_ph/pipeline/scrape_philhealth_tbdots.py`, unchanged): 2,097 facilities, PDF rows 1–2,097 with no gaps or duplicates, every page read as a ruled table, 17 regions.

## Checks of the parse against the PDF

Three independent checks, each with its own reading of the PDF (character-level cell assignment, a ruling-free word layout, and header fonts and colours), compared every row with the parse:
- **Rows:** names, sectors and expiry dates match on all rows; cities match apart from title-casing; no row is missing, duplicated, merged, shifted or invented.
- **Region and province headings:** all 118 changes between consecutive rows match a PDF heading, including the 9 at page breaks; no town sits under the wrong province.
- **Anomalies:** no duplicates and no spelling splits within a province. The defects found all come from the parser's text clean-up (below), or are in the PDF itself.

## Corrections

`corrections.py`, saved with the run (below), applies 127 corrections to 94 rows. Each names the row, the field, the exact parsed value and the value that ships, and stops if the parsed value differs. By field: city_municipality 15, facility_kind 6, name 1, phone 39, region 30, region_code 30, street 6.

| Row | Field | Parsed | Ships | Why |
|---|---|---|---|---|
| 277 | phone | 09365042316/078375817/092742 71363 | 09365042316/078375817/09274271363 | soft wrap in the PDF cell: the parser inserted a space |
| 304 | phone | 0995220403/09175741693/09175 7416931 | 0995220403/09175741693/091757416931 | soft wrap in the PDF cell: the parser inserted a space |
| 320 | phone | 09975363101/09081138072/0952 6212292 | 09975363101/09081138072/09526212292 | soft wrap in the PDF cell: the parser inserted a space |
| 333 | phone | 09670751636/09085117973/0917 6800046 | 09670751636/09085117973/09176800046 | soft wrap in the PDF cell: the parser inserted a space |
| 368 | phone | 0935665572/0783052743/091759 29887/09356655121 | 0935665572/0783052743/09175929887/09356655121 | soft wrap in the PDF cell: the parser inserted a space |
| 1319 | phone | 5228614/09088137889/09388388 343 | 5228614/09088137889/09388388343 | soft wrap in the PDF cell: the parser inserted a space |
| 1343 | phone | 3234741/09178822034/09283882 98 | 3234741/09178822034/0928388298 | soft wrap in the PDF cell: the parser inserted a space |
| 222 | phone | 09338678423/075-6327543/075- 6157141/09126602826 | 09338678423/075-6327543/075-6157141/09126602826 | soft wrap in the PDF cell: the parser inserted a space |
| 623 | phone | 518-2632/0922-8162458 / 0939- 796-9422 | 518-2632/0922-8162458 / 0939-796-9422 | soft wrap in the PDF cell: the parser inserted a space |
| 678 | phone | 0967-2188707/8342-7789/0967- 2188707 | 0967-2188707/8342-7789/0967-2188707 | soft wrap in the PDF cell: the parser inserted a space |
| 714 | phone | 0939-2859794, 2754585 / 0977- 815-2444 | 0939-2859794, 2754585 / 0977-815-2444 | soft wrap in the PDF cell: the parser inserted a space |
| 908 | phone | 0961-8758481/642-1262/ 0922- 8191943 | 0961-8758481/642-1262/ 0922-8191943 | soft wrap in the PDF cell: the parser inserted a space |
| 935 | phone | 0947-5804428/459-7006 /0917- 8821392 | 0947-5804428/459-7006 /0917-8821392 | soft wrap in the PDF cell: the parser inserted a space |
| 1904 | phone | 083-228-7522/229- 2768/092855520261 | 083-228-7522/229-2768/092855520261 | soft wrap in the PDF cell: the parser inserted a space |
| 432 | street | BLK5 LOT1&2 PHASE E, BRGY. FRANCISCO HOMES- MULAWIN | BLK5 LOT1&2 PHASE E, BRGY. FRANCISCO HOMES-MULAWIN | soft wrap in the PDF cell: the parser inserted a space |
| 581 | street | PUROK MATULUNGIN, BARANGAY BARAS- BARAS | PUROK MATULUNGIN, BARANGAY BARAS-BARAS | soft wrap in the PDF cell: the parser inserted a space |
| 714 | street | 715 A UNIT 7 3RD FLR ANGLO BLDG, BRGY WACK- WACK, SHAW BLVD. | 715 A UNIT 7 3RD FLR ANGLO BLDG, BRGY WACK-WACK, SHAW BLVD. | soft wrap in the PDF cell: the parser inserted a space |
| 837 | street | 35 ROAD 9 COR. ROAD 10, BRGY. BAGONG PAG- ASA | 35 ROAD 9 COR. ROAD 10, BRGY. BAGONG PAG-ASA | soft wrap in the PDF cell: the parser inserted a space |
| 1173 | street | PRIMM BLDG SPS GOVT CENTER BANCAO- BANCAO | PRIMM BLDG SPS GOVT CENTER BANCAO-BANCAO | soft wrap in the PDF cell: the parser inserted a space |
| 1668 | street | P U ROK 3, LABUAN | PUROK 3, LABUAN | the PDF draws 8 space glyphs over "PU"; the parser interleaved them |
| 1372 | name | HINOBA-AN RURAL HEALTH UNIT AND BIRTHING FACILITY HINOBA- AN,NEGROS OCCEDENTAL | HINOBA-AN RURAL HEALTH UNIT AND BIRTHING FACILITY HINOBA-AN,NEGROS OCCEDENTAL | soft wrap in the PDF cell: the parser inserted a space |
| 17 | city_municipality | Sal-Lapadan | Sal-lapadan | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 286 | city_municipality | Lal-Lo | Lal-lo | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1113 | city_municipality | Mataas-Na-Kahoy | Mataas-na-Kahoy | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1170 | city_municipality | Brooke'S Point | Brooke's Point | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1274 | city_municipality | Anini-Y | Anini-y | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1281 | city_municipality | Lawa-An | Lawa-an | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1305 | city_municipality | Sapi-An | Sapi-an | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1372 | city_municipality | Hinoba-An (Asia) | Hinoba-an (Asia) | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1562 | city_municipality | Can-Avid | Can-avid | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1566 | city_municipality | Lawa-An | Lawa-an | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1596 | city_municipality | Matag-Ob | Matag-ob | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1660 | city_municipality | Tagapul-An | Tagapul-an | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1758 | city_municipality | Balo-I | Balo-i | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1965 | city_municipality | San Francisco (Anao-Aon) | San Francisco (Anao-aon) | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 1974 | city_municipality | Tagana-An | Tagana-an | title-casing capitalised the letter after an apostrophe or a glottal-stop hyphen |
| 228 | phone | 0917891341309518648252 | 09178913413/09518648252 | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1759 | phone | 063-341621909750175427 | 063-3416219/09750175427 | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 389 | phone | 047 - 633 4352 09610891262 | 047 - 633 4352/09610891262 | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 575 | phone | 045-4918595 09257176353 | 045-4918595/09257176353 | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1939 | phone | 09217266820 09567145655 HOF | 09217266820/09567145655 HOF | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1944 | phone | 09475716115 09176382660 HOF | 09475716115/09176382660 HOF | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1957 | phone | 09851725417 09173768508 HOF | 09851725417/09173768508 HOF | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1960 | phone | 09985390970 09559741179 HOF | 09985390970/09559741179 HOF | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1990 | phone | 09673548743 09178104451 HoF | 09673548743/09178104451 HoF | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1997 | phone | 09647580349 09853442868 HOF | 09647580349/09853442868 HOF | two numbers with only a space (or nothing) between them, so the Call button dialled them run together; a "/" separates them, no digit changes |
| 1209 | phone |  | 0917-3228990 | the PDF prints this clinic's number in its email column, and the email column is not published |
| 2085 | phone | (an email address, not repeated here) |  | an email address in the phone column (a personal one); the site shows no emails (PLAN.md D23, least data) and it is not a number to call |
| 1794 | phone | (82) 224-4569 | (082) 224-4569 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1796 | phone | (82) 224-4567 / 0995-0311076 | (082) 224-4567 / 0995-0311076 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1813 | phone | (82) 2228000 | (082) 2228000 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1815 | phone | (82) 2272731 | (082) 2272731 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1832 | phone | (84) 8297120 | (084) 8297120 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1836 | phone | (84) 823-0981 | (084) 823-0981 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1838 | phone | (84) 628-5234 | (084) 628-5234 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1841 | phone | (84) 8290315 | (084) 8290315 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1842 | phone | (84) 2167043 | (084) 2167043 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1843 | phone | (84) 655-6747 | (084) 655-6747 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1859 | phone | (87) 388-4429 | (087) 388-4429 | the PDF writes the area code without its 0, so the Call button dialled 9 bare digits; the 0 is added, no digit of the number changes |
| 1513 | phone | (032) 253-9891-99 | (032) 253-9891 to 99 | a trunk-line range written with a hyphen, so the Call button dialled 12 digits; written with "to", as elsewhere in the list |
| 323 | phone | /09515430392 | 09515430392 | a stray "/" before the only number, so no Call button showed |
| 670 | facility_kind | clinic | hospital | a hospital by its name ("Ospital ng", "Medical City", a university medical foundation), which the parser's rules (HOSPITAL, MEDICAL CENTER) miss |
| 591 | facility_kind | clinic | hospital | a hospital by its name ("Ospital ng", "Medical City", a university medical foundation), which the parser's rules (HOSPITAL, MEDICAL CENTER) miss |
| 734 | facility_kind | clinic | hospital | a hospital by its name ("Ospital ng", "Medical City", a university medical foundation), which the parser's rules (HOSPITAL, MEDICAL CENTER) miss |
| 1172 | facility_kind | clinic | hospital | a hospital by its name ("Ospital ng", "Medical City", a university medical foundation), which the parser's rules (HOSPITAL, MEDICAL CENTER) miss |
| 809 | facility_kind | clinic | hospital | a hospital by its name ("Ospital ng", "Medical City", a university medical foundation), which the parser's rules (HOSPITAL, MEDICAL CENTER) miss |
| 636 | facility_kind | clinic | hospital | a hospital by its name ("Ospital ng", "Medical City", a university medical foundation), which the parser's rules (HOSPITAL, MEDICAL CENTER) miss |
| 1098–1127 (30 rows, every Batangas clinic) | region_code, region | R4B, MIMAROPA | R4A, Region IV-A (CALABARZON) | The PDF files Batangas under its REGION IV-B heading; Batangas is in Region IV-A. `region_as_listed` keeps the PDF's heading. |

Left as PhilHealth lists them (faithful to the PDF, noted for the next refresh):
- Region groupings that are PhilHealth's clusters, not today's administrative regions: Province of Rizal under "NCR & Rizal", Bacolod and Negros Occidental under Region VI, Negros Oriental and Siquijor under Region VII (no Negros Island Region), Sulu under BARMM, Isabela City under Basilan (BARMM).
- Phones the PDF gives as "NONE" (1808, 1809), "N/A" (1442) or an area code only (1285), and 26 numbers of impossible length, most of them mobiles with a digit missing or extra (75, 113, 239, 313, 318, 319, 596, 810, 899, 1008, 1014, 1064, 1086, 1281, 1367, 1385, 1613, 1621, 1655, 1771, 1784, 1787, 1829, 1873, 2057, 2095). They show as listed under the place's Details, with no Call button. Since the launch review (8 Nov), the Call button dials the first number on a clinic's list that any phone can dial (`src/lib/core/phone.ts`); 1,961 clinics have one. 60 list only a local 7- or 8-digit number without its area code (among them Region I's 195, 199, 204, 237, 240 and 258, which start 63 and used to be read as +63 numbers); their Call button dials it as listed, which works only from a landline in that area. 46 list no number. The 30 and the 60 are for the owner or partners to confirm at the next refresh.
- Town spellings that differ from official names (for example Manabu, Jetafe, Pozorubio), and the PDF's own typos in names. The site publishes neither emails nor Google Maps links (prepare-data drops them, PLAN.md D23). The committed `data/tb-dots-facilities.json` also leaves out the email column, since some are staff's personal addresses; the full parse, emails included, is kept with the run.
- Government health units whose names the type rules don't recognise, classed as "clinic" (for example 1326 Dumangas Main Primary Health Care Facility and 71 "Lagawe Rural Healht Unit", a PDF typo), and 1029 Pagamutang Bayan ng Noveleta.
- 85 accreditations that ended before 7 Nov 2026, shown as listed (D24, Q12 open).

## Map positions

OpenStreetMap's Nominatim, with the pipeline's queries, request parameters and 1.1-second pause, one request at a time, every result cached. The User-Agent names the project's public repository (`TB-PH-route-planner (https://github.com/RawBeans02/tb-health)`); no contact email was given.
1. Every clinic's town (the pipeline's city attempt).
2. For clinics still without a pin, the town with the province's plain name ("Cebu" for the PDF's "Cebu Province", "Iloilo" for "Iloilo Province") and, for 15 towns, the official spelling (for example Getafe for the PDF's "Jetafe"), free-form and then structured. This is used for the lookup only; the text shown is the PDF's.
3. The pipeline's address, then name, attempts for every clinic, starting with the towns that have the most clinics (finished at 23:45 on 7 Nov).
4. **8 Nov: corrections from an independent review.** It found 11 pins in the wrong town (19 clinics) and 22 clinics with no pin. The wrong pins came from lookups whose text repeated a city as its own province ("Dagupan City, Dagupan City" matched Tondo, Manila), the PDF's "Cebu Province", "Sta." names, towns named like their province, and generic address or name text ("BARANGAY 1", "RURAL HEALTH UNIT - …") that matched another town. The unpinned clinics' town names, as the PDF writes them (old names in parentheses, "Sto.", "Magpit" for Magpet), found nothing. 30 more lookups on 8 Nov (`fix_lookups.py`: the same rules, each town's official name and province; every answer was checked as that town, in that province, near the province's other clinics) and, for 3 rows, the run's own town lookup give each a town-centre pin (`pins.py`, which stops if a pin isn't what it expects). Every clinic now has a pin.

Result: address 168, city 1645, name 284. "address" and "name" pins are where the lookup matched the clinic; "city" is the town centre, and the site marks distances from it as approximate. Every clinic has a pin.

### Pins corrected on 8 Nov

| Rows | Town (as listed) | Was | Ships (town centre) | Why |
|---|---|---|---|---|
| 367, 368, 369 | Santiago City, Santiago City | 8.2511858,124.2447733 (city) | 16.6915963,121.5478637 (city) | the lookup "Santiago City, Santiago City" (the PDF lists the city as its own group) matched Iligan City, Mindanao, about 980 km away |
| 98, 99, 100, 101, 102, 103, 104 | Dagupan City, Dagupan City | 14.6089143,120.9719369 (city) | 16.043021,120.3337627 (city) | the lookup "Dagupan City, Dagupan City" matched Tondo, Manila, about 174 km away |
| 1468 | Carmen, Cebu Province | 7.1068858,125.0435952 (city) | 10.5873302,124.0180859 (city) | the lookup "Carmen, Cebu Province" matched Carmen in North Cotabato, about 400 km away |
| 1566 | Lawa-an, Eastern Samar | 11.8100406,124.8342097 (city) | 11.1403377,125.3009712 (city) | the lookup "Lawa-An, Eastern Samar" matched a point next to Catbalogan, Samar, about 90 km away |
| 1593 | Leyte, Leyte | 11.0601098,125.0368721 (address) | 11.3704698,124.4867592 (city) | the address lookup matched a street of the same name on Leyte's east coast, 50-80 km from the town |
| 1204 | Sta. Elena, Camarines Norte | 14.1601289,122.9322696 (city) | 14.1799094,122.3923266 (city) | the lookup "Sta. Elena, Camarines Norte" matched a point between Talisay and Vinzons, about 58 km east of the town |
| 1497 | Sta. Fe, Cebu Province | 11.0930893,123.9455402 (city) | 11.1537949,123.8068632 (city) | the lookup "Sta. Fe, Cebu" matched San Remigio on mainland Cebu, across the channel from Santa Fe on Bantayan Island |
| 400 | Bulacan, Bulacan | 14.8414965,120.8387409 (city) | 14.7946733,120.8792703 (city) | the lookup "Bulacan, Bulacan" matched a point near Malolos, about 7 km from Bulakan |
| 1952 | San Jose, Dinagat Islands | 10.1780404,125.5624584 (name) | 10.0084315,125.5695546 (city) | the name lookup matched a point 19 km north of San Jose; the run's own town lookup is used |
| 1962 | Del Carmen, Surigao del Norte | 9.9365668,126.0865041 (name) | 9.8687641,125.9705006 (city) | the name lookup matched a point 15 km from Del Carmen, nearer Pilar; the run's own town lookup is used |
| 1968 | Dapa, Surigao del Norte | 9.8378622,126.1093758 (address) | 9.7577166,126.0528849 (city) | the address lookup on "BARANGAY 1" matched a point near Pilar, 11 km from Dapa; the run's own town lookup is used |
| 17 | Sal-lapadan, Abra | no pin | 17.4552536,120.7599735 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 141 | Salcedo (Baugen), Ilocos Sur | no pin | 17.1509597,120.5366314 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 181 | Sto. Tomas, La Union | no pin | 16.2823499,120.3867155 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 299 | Sto. Nino (Faire), Cagayan | no pin | 17.8839124,121.5692104 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 336 | San Manuel (Callang), Isabela | no pin | 17.0269105,121.6308091 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1133 | Calintaan (San Miguel), Occidental Mindoro | no pin | 12.5713842,120.9409823 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1134 | Abra del Ilog, Occidental Mindoro | no pin | 13.4444905,120.7288218 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1185 | Daraga (Locsin), Albay | no pin | 13.1479697,123.7120775 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1200 | San Lorenzo Ruiz (Imelda), Camarines Norte | no pin | 14.0368579,122.8687332 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1216 | Presentacion (Parubcan), Camarines Sur | no pin | 13.7101578,123.7456585 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1281 | Lawa-an, Antique | no pin | 11.1429506,122.0416027 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1519 | Amlan (Ayuquitan), Negros Oriental | no pin | 9.4647598,123.2230669 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1692 | Pinan (New Pinan), Zamboanga del Norte | no pin | 8.4816541,123.4507182 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1704 | Dinas/Guipos, Zamboanga del Sur | no pin | 7.61586,123.3391016 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1762 | Linamon (Tomas L. Cabili), Lanao del Norte | no pin | 8.1839585,124.1569454 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1853 | Banay-Banay, Davao Oriental | no pin | 6.9668999,126.0107563 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1874 | Magpit, North Cotabato | no pin | 7.102802,125.1247716 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1917 | Sen. Ninoy Aquino, Sultan Kudarat | no pin | 6.4596414,124.3221058 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1950 | Basilisa (Rizal), Dinagat Islands | no pin | 9.9981678,125.5098276 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 1967 | Santa Monica (Sapao), Surigao del Norte | no pin | 10.0188427,126.0364378 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 2057 | Datu Angal Midtimbang, Maguindanao del Sur | no pin | 6.9931618,124.3415426 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |
| 2095 | Sitangkai (Sibatu), Tawi-Tawi | no pin | 4.6625499,119.3938939 (city) | no pin: the PDF's spelling found nothing; looked up under the official name |

## Clinics per region

- NCR & Rizal: 403
- Region III (Central Luzon): 229
- Region I (Ilocos): 165
- Region VII (Central Visayas): 158
- Region VI (Western Visayas): 133
- Region IV-A (CALABARZON): 126
- Region VIII (Eastern Visayas): 113
- Region II (Cagayan Valley): 107
- BARMM: 99
- Cordillera (CAR): 97
- Caraga: 80
- Region V (Bicol): 74
- Region IX (Zamboanga Peninsula): 72
- Region XI (Davao): 68
- Region X (Northern Mindanao): 59
- Region XII (SOCCSKSARGEN): 58
- MIMAROPA: 56

## Saved with the run

Outside the repository, in `/Users/rovs/Documents/tb-health-pipeline-runs/2026-11-07`: the PDF, the parse and its report, the lookup cache (reruns reuse it), the corrections log and the scripts. The fixes for the parser's clean-up (join soft-wrapped lines without a space, keep a separator between two emails, title-case without capitalising after an apostrophe or a glottal-stop hyphen) belong in the pipeline before the next monthly refresh.
