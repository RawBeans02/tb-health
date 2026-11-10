#!/usr/bin/env python3
"""
Turn PhilHealth's "List of Accredited TB DOTS Clinics" PDF into clean CSV + JSON
for the TB PH facility finder.

PhilHealth publishes the list (about 85 pages / 2,000+ facilities as of the
30 Sep 2026 update) at:
  https://www.philhealth.gov.ph/partners/providers/facilities/accredited/
  -> "TB-DOTS Centers" (e.g. DOTS_093026.pdf)

Usage
  pip install pdfplumber requests
  python scrape_philhealth_tbdots.py                    # finds the newest TB-DOTS PDF automatically
  python scrape_philhealth_tbdots.py --pdf DOTS_093026.pdf
  python scrape_philhealth_tbdots.py --url https://www.philhealth.gov.ph/partners/providers/facilities/accredited/DOTS_093026.pdf
  python scrape_philhealth_tbdots.py --pdf DOTS_093026.pdf --debug-page 1   # print how page 1 was read

Outputs (in --out, default current folder)
  tb-dots-facilities.csv            one row per facility (same columns as tb-dots-facilities-SAMPLE.csv)
  tb-dots-facilities.json           same data as JSON (what the website loads)
  tb-dots-facilities-by-region.json counts per region / province-or-city / sector (for the overview map)
  scrape-report.txt                 checks: row-number gaps, duplicates, empty fields. Read it before publishing.

How it reads the PDF
  1. Ruling-line table extraction (works when the PDF has cell borders, which
     Excel-exported lists usually do). Wrapped names stay in one cell.
  2. Fallback when no borders are found: words are put into columns using the
     header positions (NAME / TEL_NO / EMAIL / STREET / MUNICIPALITY / EXPIRE / SEC),
     and rows are anchored on the accreditation-expiry date, which every facility row has.
  Region headers (e.g. "REGION I", "NATIONAL CAPITAL REGION & RIZAL") and
  province/city headers (e.g. "ABRA", "BAGUIO CITY") are carried down to each row.
"""
import argparse, csv, datetime as dt, io, json, re, statistics, sys
from collections import Counter, defaultdict
from urllib.parse import quote_plus, urljoin

INDEX_URL = "https://www.philhealth.gov.ph/partners/providers/facilities/accredited/"
DATE_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$")
IDX_RE = re.compile(r"^\d{1,5}$")
REGION_RE = re.compile(r"REGION|NATIONAL CAPITAL|CORDILLERA|CARAGA|BARMM|BANGSAMORO|MIMAROPA|CALABARZON|SOCCSKSARGEN|NEGROS ISLAND", re.I)
SKIP_RE = re.compile(r"^(List of Accredited|NAME OF HEALTH FACILITY|Page \d+ of \d+|Regional clustering)", re.I)
HEADER_KEYS = ["NAME", "TEL_NO", "EMAIL", "STREET", "MUNICIPALITY", "EXPIRE", "SEC"]
COLS = ["idx", "name", "phone", "email", "street", "municipality", "expire", "sec"]

REGION_NORMAL = [  # (pattern, code, display)
    (r"NATIONAL CAPITAL", "NCR", "NCR & Rizal"),
    (r"CORDILLERA", "CAR", "Cordillera (CAR)"),
    (r"REGION\s+XIII|CARAGA", "R13", "Caraga"),
    (r"REGION\s+XII\b|SOCCSKSARGEN", "R12", "Region XII (SOCCSKSARGEN)"),
    (r"REGION\s+XI\b", "R11", "Region XI (Davao)"),
    (r"REGION\s+X\b", "R10", "Region X (Northern Mindanao)"),
    (r"REGION\s+IX\b", "R9", "Region IX (Zamboanga Peninsula)"),
    (r"REGION\s+VIII\b", "R8", "Region VIII (Eastern Visayas)"),
    (r"REGION\s+VII\b", "R7", "Region VII (Central Visayas)"),
    (r"REGION\s+VI\b", "R6", "Region VI (Western Visayas)"),
    (r"REGION\s+V\b", "R5", "Region V (Bicol)"),
    (r"REGION\s+IV-?\s*B|MIMAROPA", "R4B", "MIMAROPA"),
    (r"REGION\s+IV-?\s*A|CALABARZON", "R4A", "Region IV-A (CALABARZON)"),
    (r"REGION\s+III\b", "R3", "Region III (Central Luzon)"),
    (r"REGION\s+II\b", "R2", "Region II (Cagayan Valley)"),
    (r"REGION\s+I\b", "R1", "Region I (Ilocos)"),
    (r"NEGROS ISLAND", "NIR", "Negros Island Region"),
    (r"BARMM|BANGSAMORO|ARMM", "BARMM", "BARMM"),
]


def normalize_region(raw):
    for pat, code, display in REGION_NORMAL:
        if re.search(pat, raw, re.I):
            return code, display
    return "", raw.title()


def clean(s):
    return re.sub(r"\s+", " ", (s or "").replace("\n", " ")).strip(" ,;")


def nice_title(s):
    small = {"of", "de", "del", "ng", "and", "sa", "na", "y"}
    words = (s or "").title().split(" ")
    return " ".join(w.lower() if i and w.lower() in small else w for i, w in enumerate(words))


def facility_kind(name):
    n = (name or "").upper()
    if re.search(r"HOSPITAL|MEDICAL CENTER|MEDICAL CTR|SANITARIUM|INFIRMARY|LUNG CENTER|INSTITUTE", n):
        return "hospital"
    if re.search(r"HEALTH CENTER|HEALTH UNIT|RHU|HEALTH OFFICE|PUSO CENTER|PRIMARY CARE|HEALTH STATION|CHO\b|MHO\b", n):
        return "health_center"
    return "clinic"


def iso_date(s):
    try:
        return dt.datetime.strptime(s.strip(), "%m/%d/%Y").date().isoformat()
    except Exception:
        return ""


# ---------------------------------------------------------------- download
def find_latest_pdf_url():
    import requests
    html = requests.get(INDEX_URL, timeout=60, headers={"User-Agent": "TB-PH data refresh"}).text
    links = re.findall(r'href="([^"]*DOTS_\d{6}\.pdf)"', html, re.I)
    if not links:
        sys.exit("Could not find a TB-DOTS PDF link on " + INDEX_URL + " — pass --url or --pdf instead.")
    return urljoin(INDEX_URL, links[0])


def fetch_pdf(url):
    import requests
    r = requests.get(url, timeout=120, headers={"User-Agent": "TB-PH data refresh"})
    r.raise_for_status()
    return io.BytesIO(r.content)


# ---------------------------------------------------------------- parsing helpers
def header_positions(words):
    """x0 of each header keyword, read from the header band around "TEL_NO".
    Tolerates wrapped headers such as SEC -> "SE" / "C" or EXPIRE / DATE on two lines."""
    tel = [w for w in words if w["text"].upper().startswith("TEL")]
    if not tel:
        return None
    band_top = tel[0]["top"]
    band = [w for w in words if abs(w["top"] - band_top) <= 12]
    pos = {}
    for k in HEADER_KEYS:
        cands = [w for w in band if len(w["text"]) >= 2 and (w["text"].upper().startswith(k) or k.startswith(w["text"].upper()))]
        if not cands:
            return None
        w = min(cands, key=lambda w: w["x0"]) if k != "SEC" else max(cands, key=lambda w: w["x0"])
        pos[k] = (w["x0"], max(x["bottom"] for x in band))
    return pos


def classify_header_text(text, state):
    """A row with no facility number is either a region or a province/city header."""
    t = clean(text)
    if not t or SKIP_RE.search(t):
        return
    if REGION_RE.search(t) and len(t) < 80:
        state["region"] = t
        state["group"] = ""
    else:
        state["group"] = t


def emit(rows, state, cells, page_no):
    r = {c: clean(cells.get(c, "")) for c in COLS}
    if not IDX_RE.match(r["idx"]):
        return
    r["region_raw"], r["group"], r["page"] = state["region"], state["group"], page_no
    rows.append(r)


# ---------------------------------------------------------------- strategy 1: ruled table
def parse_page_lines(page, state, rows, page_no):
    tables = page.extract_tables({"vertical_strategy": "lines", "horizontal_strategy": "lines",
                                  "intersection_tolerance": 5, "snap_tolerance": 3})
    tables = [t for t in tables if t and max(len(r) for r in t) >= 7]
    if not tables:
        return False
    for t in tables:
        for raw in t:
            cells = [c if c is not None else "" for c in raw]
            joined = clean(" ".join(cells))
            if not joined or SKIP_RE.search(joined) or "TEL_NO" in joined.upper():
                continue
            # Some exports put the row number in its own column, some merge it with the name.
            if len(cells) >= 8:
                vals = cells[:8]
            else:
                m = re.match(r"^\s*(\d{1,5})\s+(.*)$", cells[0] or "", re.S)
                vals = ([m.group(1), m.group(2)] if m else ["", cells[0]]) + cells[1:7]
            cell_map = dict(zip(COLS, vals))
            if IDX_RE.match(clean(cell_map["idx"])) and DATE_RE.match(clean(cell_map["expire"]) or "x"):
                emit(rows, state, cell_map, page_no)
            elif not any(clean(v) for v in vals[2:]):
                classify_header_text(joined, state)
    return True


# ---------------------------------------------------------------- strategy 2: words + anchors
def parse_page_words(page, state, rows, page_no, debug=False):
    words = page.extract_words(x_tolerance=1.5, y_tolerance=2, keep_blank_chars=False, extra_attrs=["fontname", "size"])
    pos = header_positions(words)
    if not pos:
        if debug:
            print(f"[page {page_no}] header not found")
        return
    hdr_bottom = max(v[1] for v in pos.values())
    margin = 3.0
    starts = [pos[k][0] - margin for k in HEADER_KEYS]  # name, phone, email, street, municipality, expire, sec

    def col_of(w):
        x = w["x0"]
        if x < starts[0]:
            return "idx"
        for i in range(len(starts) - 1, -1, -1):
            if x >= starts[i]:
                return COLS[i + 1]
        return "idx"

    body = [w for w in words if w["top"] > hdr_bottom + 1 and not SKIP_RE.search(w["text"])]
    body = [w for w in body if not re.match(r"^(Page|of)$", w["text"]) or w["top"] < page.height - 40]
    body.sort(key=lambda w: (round(w["top"]), w["x0"]))
    lines = []
    for w in body:
        if lines and abs(lines[-1]["top"] - w["top"]) <= 2.5:
            lines[-1]["words"].append(w)
        else:
            lines.append({"top": w["top"], "words": [w]})
    for ln in lines:
        ln["cols"] = defaultdict(list)
        for w in ln["words"]:
            ln["cols"][col_of(w)].append(w["text"])
        ln["is_anchor"] = any(DATE_RE.match(t) for t in ln["cols"].get("expire", []))
        txt = " ".join(w["text"] for w in ln["words"])
        ln["skip"] = bool(SKIP_RE.search(txt)) or bool(re.match(r"^Page \d+ of \d+$", txt))
        ln["name_only"] = set(ln["cols"].keys()) <= {"idx", "name"}
        ln["bold"] = all(re.search(r"Bold|Black|Heavy|Semibold", w.get("fontname", ""), re.I) for w in ln["words"])
        ln["has_idx"] = any(IDX_RE.match(t) for t in ln["cols"].get("idx", []))
    anchors = [i for i, ln in enumerate(lines) if ln["is_anchor"]]
    sizes = [w.get("size", 8) for w in body] or [8]
    leading = statistics.median(sizes) * 1.25
    bold_is_signal = any(l["bold"] for l in lines) and any(not l["bold"] for l in lines)
    owner = {}
    for i, ln in enumerate(lines):
        if ln["skip"]:
            continue
        if ln["is_anchor"]:
            owner[i] = i
            continue
        nearest = min(anchors, key=lambda a: abs(lines[a]["top"] - ln["top"])) if anchors else None
        dist = abs(lines[nearest]["top"] - ln["top"]) if nearest is not None else 1e9
        if ln["has_idx"] or not ln["name_only"]:
            if nearest is not None:
                owner[i] = nearest
            continue
        # name-only line without a row number: wrapped name, or a region/province header?
        if bold_is_signal:
            is_header = ln["bold"]
        else:
            is_header = dist > 1.6 * leading
        owner[i] = ("H", i) if is_header else nearest
    grouped = defaultdict(list)
    for i, o in owner.items():
        grouped[o].append(i)
    for key in sorted(grouped, key=lambda k: lines[k if isinstance(k, int) else k[1]]["top"]):
        members = sorted(grouped[key], key=lambda i: lines[i]["top"])
        if isinstance(key, tuple):
            classify_header_text(" ".join(" ".join(lines[i]["cols"].get("idx", []) + lines[i]["cols"].get("name", [])) for i in members), state)
            continue
        cells = defaultdict(list)
        for i in members:
            for c, toks in lines[i]["cols"].items():
                cells[c].extend(toks)
        emit(rows, state, {c: " ".join(v) for c, v in cells.items()}, page_no)
    if debug:
        print(f"[page {page_no}] column starts: {dict(zip(HEADER_KEYS, [round(x, 1) for x in starts]))}; "
              f"rows anchored: {len(anchors)}; bold headers: {bold_is_signal}; leading: {leading:.1f}")


# ---------------------------------------------------------------- main
def parse_pdf(fp, debug_page=None):
    import pdfplumber
    rows, state, strategy = [], {"region": "", "group": ""}, Counter()
    with pdfplumber.open(fp) as pdf:
        title = (pdf.pages[0].extract_text() or "").splitlines()[0] if pdf.pages else ""
        for n, page in enumerate(pdf.pages, start=1):
            dbg = debug_page == n
            if parse_page_lines(page, state, rows, n):
                strategy["ruled-table"] += 1
            else:
                parse_page_words(page, state, rows, n, debug=dbg)
                strategy["word-columns"] += 1
            if dbg:
                for r in [r for r in rows if r["page"] == n][:8]:
                    print(r)
    return rows, title, strategy


def finalize(rows, source_name, title):
    m = re.search(r"as of (\w+ \d{1,2}, \d{4})", title or "")
    updated = dt.datetime.strptime(m.group(1), "%B %d, %Y").date().isoformat() if m else ""
    out = []
    for r in rows:
        code, display = normalize_region(r["region_raw"])
        name, street, city, group = r["name"], r["street"], nice_title(r["municipality"]), nice_title(r["group"])
        parts, seen = [], set()
        for x in [name, street, city, group, "Philippines"]:
            if x and x.lower() not in seen:
                parts.append(x); seen.add(x.lower())
        q = ", ".join(parts)
        out.append({
            "id": f"PH-DOTS-{int(r['idx']):05d}",
            "source_row": int(r["idx"]),
            "name": name,
            "sector": {"G": "Government", "P": "Private"}.get(r["sec"].upper()[:1], r["sec"]),
            "phone": r["phone"],
            "email": r["email"].replace(" ", ""),
            "street": street,
            "city_municipality": city,
            "province_or_city_group": group,
            "region_code": code,
            "region": display,
            "region_as_listed": r["region_raw"],
            "accreditation_expiry": iso_date(r["expire"]),
            "facility_kind": facility_kind(name),
            # Services for the route planner. PhilHealth TB-DOTS clinics give free TB medicines and
            # either test on site or send your sputum sample to a TB lab. X-ray is unknown until
            # confirmed (YAKAP list, partner hospitals, or a phone call): "yes" | "no" | "unknown".
            "svc_free_tb_medicines": "yes",
            "svc_tb_test": "onsite_or_referral",
            "svc_chest_xray": "unknown",
            "hours": "",
            "lat": None, "lng": None, "geo_precision": "",
            "maps_url": "https://www.google.com/maps/search/?api=1&query=" + quote_plus(q),
            "source": f"PhilHealth list of accredited TB DOTS clinics ({source_name})",
            "source_updated": updated,
        })
    return out


def report(facilities, strategy):
    lines = [f"Parsed facilities: {len(facilities)}", f"Pages by strategy: {dict(strategy)}"]
    nums = sorted(f["source_row"] for f in facilities)
    if nums:
        missing = sorted(set(range(nums[0], nums[-1] + 1)) - set(nums))
        dup = [k for k, v in Counter(nums).items() if v > 1]
        lines += [f"Row numbers: {nums[0]}..{nums[-1]}", f"Missing row numbers ({len(missing)}): {missing[:60]}",
                  f"Duplicate row numbers ({len(dup)}): {dup[:60]}"]
    for field in ["city_municipality", "phone", "region", "accreditation_expiry"]:
        empty = [f["source_row"] for f in facilities if not f[field]]
        lines.append(f"Empty {field} ({len(empty)}): {empty[:40]}")
    lines.append("\nFacilities per region:")
    for k, v in Counter(f["region"] for f in facilities).most_common():
        lines.append(f"  {v:5d}  {k}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pdf"); ap.add_argument("--url"); ap.add_argument("--out", default=".")
    ap.add_argument("--debug-page", type=int)
    a = ap.parse_args()
    if a.pdf:
        fp, source_name = open(a.pdf, "rb"), a.pdf.split("/")[-1]
    else:
        url = a.url or find_latest_pdf_url()
        print("Downloading", url)
        fp, source_name = fetch_pdf(url), url.rsplit("/", 1)[-1]
    rows, title, strategy = parse_pdf(fp, a.debug_page)
    facilities = finalize(rows, source_name, title)
    cols = list(facilities[0].keys()) if facilities else []
    with open(f"{a.out}/tb-dots-facilities.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(facilities)
    json.dump({"source": source_name, "title": title, "count": len(facilities), "facilities": facilities},
              open(f"{a.out}/tb-dots-facilities.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    by_region = defaultdict(lambda: {"total": 0, "government": 0, "private": 0, "groups": Counter()})
    for fct in facilities:
        b = by_region[fct["region"]]
        b["total"] += 1
        b["government" if fct["sector"] == "Government" else "private"] += 1
        b["groups"][fct["province_or_city_group"]] += 1
    json.dump({k: {**v, "groups": dict(v["groups"])} for k, v in by_region.items()},
              open(f"{a.out}/tb-dots-facilities-by-region.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    rep = report(facilities, strategy)
    open(f"{a.out}/scrape-report.txt", "w", encoding="utf-8").write(rep)
    print(rep)


if __name__ == "__main__":
    main()
