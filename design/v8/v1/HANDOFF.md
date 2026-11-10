# TB PH — handoff notes

Static, frontend-only site. Each page is one file; shared chrome is two child components.

## Files
| Route | File |
|---|---|
| `/` | `Home.dc.html` — 7-beat dot-field story (canvas) |
| `/learn` | `Learn.dc.html` |
| `/check` | `Check.dc.html` — screening flow, summary card, print stylesheet |
| `/find` | `Find.dc.html` — facility finder |
| `/data` | `Data.dc.html` — 15 charts (SVG), table toggles |
| `/about` | `About.dc.html` |
| shared | `SiteHeader.dc.html`, `SiteFooter.dc.html` (prop `brand` = swappable wordmark, default "TB PH") |
| spec | `Design System.dc.html` — tokens, type, dot unit, chart and control styles |

## Data
- `data/tb-ph-data.json` — fetched by Home and Data. Dot counts are computed: `round(headline_2024.estimated_cases / 1000)` etc.
- Facilities: pages try `data/tb-dots-facilities.json` first, then fall back to `data/tb-dots-facilities-SAMPLE.json` (a 404 for the full file is expected until it exists). Find loads it on mount; Data loads it after the main data.
- Language: `localStorage['tbph-lang']` = `en` | `fil`; `<html lang>` is set to match. Nothing else is stored. Screening answers live in component state only.

## Decisions to confirm
- **Screening:** any danger sign in Q2 goes straight to URGENT (no further questions). Add-on notes are not shown on URGENT. [REVIEW with clinicians]
- **tel: links:** first number in `phone`, split on `/ ; , to`; extensions dropped. `0…` → `+63…`; 8-digit NCR landlines → `+632…`; anything else dialed as written. Numbers are always displayed as written.
- **Regions:** tile map assumes codes `NCR CAR R1 R2 R3 R4A R4B R5–R13 BARMM`. Unknown codes from the full list are appended automatically; missing ones show as "No data yet", never zero.
- **D10** TPT line shows 2019–2024 per the spec; 2018 (5,409) is in the table.
- **Beat 6** is a 2015→2024 slope: the data has the world's change, not a yearly world series.
- **Deaths in the dot field** are drawn from dots that were found, so the hollow (179) and ink (37) counts stay exact.

## New Filipino strings (not in the content pack — need language review)
Interface: Hakbang {n} sa {m}; Bumalik; Susunod; Tingnan ang aking resulta; Piliin ang lahat ng naaangkop; Pumili ng isang sagot; error messages; Lumaktaw sa nilalaman; Isara; Nilalaman; Ipakita bilang talaan / Itago ang talaan; Mga paraan at paalala; Mga chart sa pahinang ito; Uri; Lahat; Lahat ng rehiyon; Lahat ng probinsiya at lungsod; Nakopya na; Ipakita pa ang ibang center; Subukang muli; Wala pang datos; the sample-list note.
Summary card labels: Petsa; Para kanino; Sintomas nang 2 linggo o higit pa; Dugo sa plema; Bagong sintomas; Sagot tungkol sa chest X-ray; Mga risk factor; Inirerekomendang susunod na hakbang; Wala; Hindi itinanong.
Charts: legend and axis labels (Nagkasakit, Hindi natagpuan, Namatay, Lalaki/Babae, Tantiya/Naiulat, outcome names, WHO region names, source lines), canvas descriptions on Home.
About: section headings (Paalala, Datos at mga update, Makipag-ugnayan, Mga numerong makatutulong).

## Open items carried from the content pack
Clinical review of `/check` and Learn L6; DOH hotline 1555 [VERIFY]; partner logos; group name and contact email; full facility list.

## Standalone export
Pages fetch JSON at runtime. For a single-file offline build, inline the two JSON files (e.g. as `<script type="application/json">`) and read them instead of `fetch`.
