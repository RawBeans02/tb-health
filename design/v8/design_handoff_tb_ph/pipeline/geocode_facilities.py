#!/usr/bin/env python3
"""
Add map coordinates to tb-dots-facilities.json so the route planner can sort places
by distance and draw them on a map. Run once after each scrape; results are cached.

  pip install requests
  python geocode_facilities.py --in tb-dots-facilities.json --out tb-dots-facilities.json
  python geocode_facilities.py --in ... --google-key YOUR_KEY     # optional, usually more precise in PH

Default geocoder: OpenStreetMap Nominatim. Its usage policy allows at most 1 request per
second with an identifying User-Agent (set --contact to your email). About 2,100 facilities
take roughly 40–70 minutes the first time; reruns use geocode-cache.json.

Each facility gets lat, lng and geo_precision:
  "address" = matched the street address, "name" = matched the facility name,
  "city" = only the city/municipality centre (show distance as approximate).
Then apply facility-services-overrides.csv (partner-confirmed services, hours, exact pins).
"""
import argparse, csv, json, os, time

def nominatim(q, contact, structured=None):
    import requests
    params = {"format": "json", "limit": 1, "countrycodes": "ph"}
    params.update(structured or {"q": q})
    r = requests.get("https://nominatim.openstreetmap.org/search", params=params,
                     headers={"User-Agent": f"TB-PH-route-planner ({contact})"}, timeout=30)
    time.sleep(1.1)
    js = r.json() if r.ok else []
    return (float(js[0]["lat"]), float(js[0]["lon"])) if js else None

def google(q, key):
    import requests
    js = requests.get("https://maps.googleapis.com/maps/api/geocode/json",
                      params={"address": q, "region": "ph", "key": key}, timeout=30).json()
    if js.get("results"):
        loc = js["results"][0]["geometry"]["location"]; return (loc["lat"], loc["lng"])
    return None

def attempts(f):
    city, prov = f["city_municipality"], f["province_or_city_group"]
    yield "address", None, {"street": f["street"], "city": city, "county": prov, "country": "Philippines"}
    yield "name", f'{f["name"]}, {city}, {prov}, Philippines', None
    yield "city", f'{city}, {prov}, Philippines', None

def apply_overrides(facs, path):
    if not os.path.exists(path):
        return 0
    by_id = {f["id"]: f for f in facs}; n = 0
    for row in csv.DictReader(open(path, encoding="utf-8")):
        f = by_id.get(row.get("id", "").strip())
        if not f:
            continue
        for k in ["svc_chest_xray", "svc_tb_test", "svc_free_tb_medicines", "hours"]:
            if row.get(k, "").strip():
                f[k] = row[k].strip()
        if row.get("lat") and row.get("lng"):
            f["lat"], f["lng"], f["geo_precision"] = float(row["lat"]), float(row["lng"]), "confirmed"
        f["confirmed_by"], f["confirmed_date"] = row.get("confirmed_by", ""), row.get("confirmed_date", "")
        n += 1
    return n

def main(geocode_fn=None):
    ap = argparse.ArgumentParser(); ap.add_argument("--in", dest="inp", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--google-key"); ap.add_argument("--contact", default="tbph@example.org")
    ap.add_argument("--cache", default="geocode-cache.json"); ap.add_argument("--overrides", default="facility-services-overrides.csv")
    a = ap.parse_args()
    doc = json.load(open(a.inp, encoding="utf-8")); facs = doc["facilities"]
    cache = json.load(open(a.cache)) if os.path.exists(a.cache) else {}
    for i, f in enumerate(facs):
        if f.get("lat") is not None and f.get("geo_precision") in ("confirmed", "address", "name"):
            continue
        for precision, q, structured in attempts(f):
            key = q or json.dumps(structured, sort_keys=True)
            if key not in cache:
                if geocode_fn:
                    cache[key] = geocode_fn(q, structured)
                elif a.google_key:
                    cache[key] = google(q or ", ".join(v for v in structured.values() if v), a.google_key)
                else:
                    cache[key] = nominatim(q, a.contact, structured)
                json.dump(cache, open(a.cache, "w"))
            if cache[key]:
                f["lat"], f["lng"], f["geo_precision"] = cache[key][0], cache[key][1], precision
                break
        if i % 50 == 0:
            print(f"{i}/{len(facs)}")
    n = apply_overrides(facs, a.overrides)
    json.dump(doc, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    print("geo_precision:", dict(Counter(f.get("geo_precision") or "none" for f in facs)), "| overrides applied:", n)

if __name__ == "__main__":
    main()
