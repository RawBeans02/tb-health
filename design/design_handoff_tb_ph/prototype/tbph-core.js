/* TB PH shared logic: facilities, distance, places gazetteer, directions links, place-card strings. Exposes window.TBPH. */
(function () {
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  var SMALL = new Set(['and', 'of', 'the', 'for', 'ng', 'sa', 'at', 'to', 'in', 'on', 'or', 'de', 'del', 'dela']);
  var ACR = new Set(['TB', 'DOTS', 'IDOTS', 'RHU', 'PPMD', 'LCP', 'NCPR', 'EDSA', 'QI', 'BF', 'RITM', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'XIII', 'NCR', 'CAR', 'PGH', 'OPD', 'HIV', 'LGU', 'C3', 'DOH', 'UP', 'UST', 'UERM', 'FEU', 'BGHMC', 'MMC']);
  function tc(s) {
    var first = true;
    return String(s || '').split(/(\s+|\/|-|\(|\))/).map(function (tok) {
      if (!tok || /^(\s+|\/|-|\(|\))$/.test(tok)) return tok;
      if (/^([A-Za-z]\.){1,3}$/.test(tok)) { first = false; return tok.toUpperCase(); }
      var core = tok.replace(/[.,;:]+$/, ''), trail = tok.slice(core.length), up = core.toUpperCase(), out;
      if (ACR.has(up)) out = up;
      else if (/^\d/.test(core)) out = core.replace(/^(\d+)(ST|ND|RD|TH)$/i, function (m, d, x) { return d + x.toLowerCase(); });
      else if (!first && SMALL.has(core.toLowerCase())) out = core.toLowerCase();
      else out = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
      first = false;
      return out + trail;
    }).join('');
  }
  function firstPhone(p) { return String(p || '').split(/\s*(?:\/|;|,|\bto\b)\s*/i)[0].trim(); }
  function telHref(p, code) {
    if (!p) return '';
    var d = p.split(/\s*loc\.?\s*/i)[0].replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('63') === 0) return 'tel:+' + d;
    if (d.charAt(0) === '0') return 'tel:+63' + d.slice(1);
    if (code === 'NCR' && d.length >= 8 && (d.charAt(0) === '8' || d.charAt(0) === '7')) return 'tel:+632' + d.slice(0, 8);
    return 'tel:' + d;
  }
  function stat(v, k) {
    v = String(v || '').toLowerCase();
    if (k === 'test' && v === 'onsite_or_referral') return 'referral';
    if (v === 'yes') return 'yes';
    if (v === 'no') return 'no';
    return 'unknown';
  }
  function prep(f) {
    var city = f.city_municipality || '', prov = f.province_or_city_group || '';
    var place = city && prov && city !== prov && city.indexOf(prov) < 0 ? city + ', ' + prov : (city || prov);
    var street = tc(f.street || ''), phone = String(f.phone || '').trim(), first = firstPhone(phone);
    var lat = parseFloat(f.lat), lng = parseFloat(f.lng), xy = isFinite(lat) && isFinite(lng);
    return {
      id: f.id, name: tc(f.name), raw: f.name, street: street, rawStreet: f.street || '', city: city, prov: prov, place: place,
      address: [street, place].filter(Boolean).join(', '), phone: phone, first: first, tel: telHref(first, f.region_code),
      gov: /gov/i.test(f.sector || ''), code: f.region_code, region: f.region, kind: f.facility_kind || '', accr: String(f.accreditation_expiry || '').trim(), hours: String(f.hours || '').trim(),
      lat: xy ? lat : null, lng: xy ? lng : null, precise: xy && (f.geo_precision === 'address' || f.geo_precision === 'confirmed'),
      svc: { xray: stat(f.svc_chest_xray, 'xray'), test: stat(f.svc_tb_test, 'test'), meds: stat(f.svc_free_tb_medicines, 'meds') },
      key: norm([f.name, city, prov].join(' ')), ckey: norm(city), pkey: norm(prov)
    };
  }
  function offers(p, k) { return p.svc[k] === 'yes' || p.svc[k] === 'referral'; }
  function km(a, b) {
    var r = function (x) { return x * Math.PI / 180; }, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
    var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  }
  function gazetteer(list) {
    var m = new Map(), provs = new Map(), out;
    list.forEach(function (p) { if (p.lat == null || !p.city) return; var k = p.city + '|' + p.prov; if (!m.has(k)) m.set(k, { name: p.city, prov: p.prov, lat: p.lat, lng: p.lng, kind: 'city' }); });
    out = Array.from(m.values());
    out.forEach(function (c) { var a = provs.get(c.prov) || { lat: 0, lng: 0, n: 0 }; a.lat += c.lat; a.lng += c.lng; a.n++; provs.set(c.prov, a); });
    provs.forEach(function (a, name) { if (name && !out.some(function (c) { return c.name === name; })) out.push({ name: name, prov: name, lat: a.lat / a.n, lng: a.lng / a.n, kind: 'prov' }); });
    return out.map(function (g) {
      g.key = norm(g.name); g.key2 = g.key.replace(/^city of /, '').replace(/ city$/, '');
      g.label = g.kind === 'city' && g.prov && g.prov !== g.name && g.name.indexOf(g.prov) < 0 ? g.name + ', ' + g.prov : g.name;
      g.full = norm(g.label);
      return g;
    }).sort(function (a, b) { return a.label.localeCompare(b.label); });
  }
  function matchPlace(text, gaz) {
    var t = norm(text), best = null, bs = 0;
    if (t.length < 2) return null;
    gaz.forEach(function (g) {
      var s = 0;
      if (g.full === t || g.key === t || g.key2 === t) s = 100;
      else if (g.full.indexOf(t) === 0 || g.key2.indexOf(t) === 0) s = 80;
      else if ((' ' + t + ' ').indexOf(' ' + g.full + ' ') >= 0) s = 75;
      else if (g.key2.length >= 4 && (' ' + t + ' ').indexOf(' ' + g.key2 + ' ') >= 0) s = 70;
      else if (t.length >= 3 && g.key.indexOf(t) >= 0) s = 60;
      if (s && g.kind === 'city') s += 1;
      if (s > bs) { bs = s; best = g; }
    });
    return best;
  }
  function route(list, origin, keys) {
    var xy = !!(origin && origin.lat != null), t = origin && origin.text ? norm(origin.text) : '', prov = origin && origin.prov ? origin.prov : '';
    var rank = function (x) { var c = x.p.ckey, pv = x.p.pkey; if (c && (c === t || t.indexOf(c) >= 0 || c.indexOf(t) >= 0)) return 0; if (pv && (pv.indexOf(t) >= 0 || t.indexOf(pv) >= 0)) return 1; return 2; };
    var all = list.map(function (p) { return { p: p, d: xy && p.lat != null ? km(origin, p) : null }; });
    var pool = xy ? all.filter(function (x) { return x.d != null; }).sort(function (a, b) { return a.d - b.d; })
      : (t ? all.filter(function (x) { return rank(x) < 2; }).sort(function (a, b) { return rank(a) - rank(b) || a.p.name.localeCompare(b.p.name); }) : []);
    if (xy && !prov && pool[0]) prov = pool[0].p.prov;
    var stops = keys.map(function (k) {
      var off = pool.filter(function (x) { return offers(x.p, k); }), near = xy ? off.filter(function (x) { return x.d <= 10; }) : off, mode = 'ok', items;
      if (!near.length && k === 'xray') { mode = 'noXray'; items = pool.slice(0, 3); }
      else if (xy && !near.length) { mode = 'far'; var inProv = off.filter(function (x) { return x.p.prov === prov; }); items = (inProv.length ? inProv : off).slice(0, 3); }
      else items = off.slice(0, 3);
      return { k: k, mode: mode, items: items, total: off.length };
    });
    var ds = [];
    stops.forEach(function (s) { s.items.forEach(function (x) { if (x.d != null) ds.push(x.d); }); });
    return { stops: stops, nearest: ds.length ? Math.min.apply(null, ds) : null, empty: pool.length === 0, prov: prov };
  }
  function dist(d, precise, lang) {
    if (d == null) return '';
    if (precise) return (d < 10 ? d.toFixed(1) : String(Math.round(d))) + ' km';
    return (lang === 'fil' ? 'mga ' : 'about ') + Math.max(1, Math.round(d)) + ' km';
  }
  function dirUrl(p, mode) {
    var dest = p.precise ? p.lat + ',' + p.lng : [p.raw, p.rawStreet, p.city, p.prov, 'Philippines'].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(dest) + '&travelmode=' + mode;
  }
  function copy(text) {
    var fallback = function () {
      var ta = document.createElement('textarea'), ok = false;
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove();
      return ok;
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    return Promise.resolve(fallback());
  }
  function sakay(p) {
    var w = window.open('https://sakay.ph', '_blank', 'noopener');
    return copy(p.name + ', ' + p.address).then(function (ok) { return { ok: ok, opened: !!w }; });
  }
  function locate() {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej({ code: 2 });
      navigator.geolocation.getCurrentPosition(function (pos) { res({ lat: pos.coords.latitude, lng: pos.coords.longitude }); }, function (e) { rej(e || { code: 2 }); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
    });
  }
  function params() { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(''); } }
  function setParams(obj) {
    try {
      var u = new URL(location.href);
      Object.keys(obj).forEach(function (k) { if (obj[k] == null || obj[k] === '') u.searchParams.delete(k); else u.searchParams.set(k, obj[k]); });
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }
  function href(page, obj) {
    var q = Object.keys(obj || {}).filter(function (k) { return obj[k] != null && obj[k] !== ''; }).map(function (k) { return k + '=' + encodeURIComponent(obj[k]); }).join('&');
    return page + (q ? '?' + q : '');
  }
  var facP = null;
  function facilities() {
    if (!facP) {
      var get = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); };
      facP = get('data/tb-dots-facilities.json').then(function (j) { return { j: j, sample: false }; }, function () {
        return get('data/tb-dots-facilities-SAMPLE.json').then(function (j) { return { j: j, sample: true }; });
      }).then(function (r) {
        var list = (r.j.facilities || []).map(prep);
        return { list: list, sample: r.sample, gaz: gazetteer(list), byId: new Map(list.map(function (p) { return [p.id, p]; })), regions: new Set(list.map(function (p) { return p.code; })).size };
      });
      facP.catch(function () { facP = null; });
    }
    return facP;
  }
  var STR = {
    en: {
      svc: { xray: 'Chest X-ray', test: 'TB test (sputum)', meds: 'Free TB medicines' },
      stopTitle: { xray: 'Get a chest X-ray', test: 'Give a sputum sample for a TB test', meds: 'Start free TB medicines' },
      stopText: {
        xray: 'An X-ray shows whether your lungs need a closer look. PhilHealth members registered at a YAKAP clinic (formerly Konsulta) can get it covered. DOH also runs free X-ray screening in communities. Ask about fees anywhere else.',
        test: "A rapid test such as Xpert checks for TB and for drug resistance, and testing is free in the National TB Program. You usually don't have to go to the lab yourself: many health centers collect your sample and send it to a lab by courier. Ask when your result will be ready.",
        meds: "If you have TB, a TB-DOTS center gives you free medicines and checks on you until you finish, usually in 6 months. Pick one near your home or work, because you'll go back often."
      },
      offers: 'Offers this', confirm: 'Call to confirm', referral: 'Collects your sample or refers you',
      commute: 'Commute directions', walkDrive: 'Walk / Drive', walk: 'Walk', drive: 'Drive', sakay: 'Copy address for Sakay.ph', call: 'Call before you go',
      gov: 'Government — free TB care', priv: 'Private — fees may apply',
      hours: function (h) { return 'Hours: ' + h; }, noHours: 'Hours not listed — call first',
      rule: 'We mark a service as available only when an official list or the facility confirms it.',
      far: 'Nothing within 10 km. Showing the nearest places in your province.',
      noXray: "We don't have confirmed X-ray sites near you yet. Ask your nearest TB-DOTS center; they can refer you.",
      dataNote: "Facility details come from PhilHealth. If a number doesn't work, contact your city or municipal health office.",
      copied: 'Copied. Paste it into Sakay.ph.', copyFail: 'Copy this address into Sakay.ph:',
      seeMore: 'See more places', backRoute: 'Back to your route', myLoc: 'My location',
      stopOf: function (n, m) { return "You're at stop " + n + ' of ' + m; },
      approxPins: 'Sample data: places are pinned at approximate city centres, so distances are approximate.'
    },
    fil: {
      svc: { xray: 'Chest X-ray', test: 'TB test (plema)', meds: 'Libreng gamot sa TB' },
      stopTitle: { xray: 'Magpa-chest X-ray', test: 'Magbigay ng plema para sa TB test', meds: 'Simulan ang libreng gamot sa TB' },
      stopText: {
        xray: 'Ipinapakita ng X-ray kung kailangang suriing mabuti ang iyong baga. Sakop ito para sa mga miyembro ng PhilHealth na rehistrado sa isang YAKAP clinic (dating Konsulta). Nagsasagawa rin ang DOH ng libreng X-ray screening sa mga komunidad. Sa ibang lugar, itanong muna ang bayad.',
        test: 'Tinitingnan ng mabilis na test gaya ng Xpert kung may TB at kung drug-resistant ito, at libre ang pagsusuri sa National TB Program. Kadalasan, hindi mo na kailangang pumunta mismo sa laboratoryo: maraming health center ang kumukuha ng iyong sample at ipinapadala ito sa laboratoryo sa pamamagitan ng courier. Itanong kung kailan lalabas ang resulta.',
        meds: 'Kung may TB ka, bibigyan ka ng TB-DOTS center ng libreng gamot at susubaybayan ka hanggang matapos, karaniwang sa loob ng 6 na buwan. Pumili ng malapit sa bahay o trabaho, dahil madalas kang babalik doon.'
      },
      offers: 'Mayroon nito', confirm: 'Tumawag para kumpirmahin', referral: 'Kumukuha ng sample o nagre-refer',
      commute: 'Paano mag-commute', walkDrive: 'Lakad / Sasakyan', walk: 'Lakad', drive: 'Sasakyan', sakay: 'Kopyahin ang address para sa Sakay.ph', call: 'Tumawag bago pumunta',
      gov: 'Pampubliko — libreng gamutan sa TB', priv: 'Pribado — maaaring may bayad',
      hours: function (h) { return 'Oras: ' + h; }, noHours: 'Walang nakalistang oras — tumawag muna',
      rule: 'Minamarkahan lang naming mayroon ang isang serbisyo kapag kinumpirma ito ng opisyal na listahan o ng mismong pasilidad.',
      far: 'Walang malapit sa loob ng 10 km. Ipinapakita ang pinakamalapit sa inyong probinsiya.',
      noXray: 'Wala pa kaming kumpirmadong X-ray site malapit sa iyo. Magtanong sa pinakamalapit na TB-DOTS center; maaari ka nilang i-refer.',
      dataNote: 'Galing sa PhilHealth ang detalye ng mga pasilidad. Kung hindi gumagana ang numero, makipag-ugnayan sa inyong city o municipal health office.',
      copied: 'Nakopya na. I-paste ito sa Sakay.ph.', copyFail: 'Kopyahin ang address na ito sa Sakay.ph:',
      seeMore: 'Tingnan ang iba pang lugar', backRoute: 'Bumalik sa iyong daan', myLoc: 'Ang aking lokasyon',
      stopOf: function (n, m) { return 'Hintuan ' + n + ' sa ' + m; },
      approxPins: 'Halimbawang datos: nakalagay ang mga lugar sa tinatayang gitna ng lungsod, kaya tinatayang layo lang ang ipinapakita.'
    }
  };
  function chip(status, lang) {
    var s = STR[lang === 'fil' ? 'fil' : 'en'];
    if (status === 'yes') return { label: s.offers, bg: '#1E6B70', fg: '#F2F0EA', border: '1.5px solid #1E6B70', mark: '✓', ring: 'none', ringBorder: '0' };
    if (status === 'referral') return { label: s.referral, bg: 'transparent', fg: '#175458', border: '1.5px solid #1E6B70', mark: '', ring: 'inline-block', ringBorder: '2.5px solid #1E6B70' };
    return { label: s.confirm, bg: 'transparent', fg: '#14212B', border: '1.5px dashed #56626A', mark: '', ring: 'inline-block', ringBorder: '2px dashed #56626A' };
  }
  window.TBPH = {
    v: 2, norm: norm, tc: tc, prep: prep, offers: offers, km: km, gazetteer: gazetteer, matchPlace: matchPlace, route: route, dist: dist,
    dirUrl: dirUrl, copy: copy, sakay: sakay, locate: locate, params: params, setParams: setParams, href: href, facilities: facilities,
    STR: STR, chip: chip, STOPS: ['xray', 'test', 'meds']
  };
  window.dispatchEvent(new Event('tbph-core-ready'));
})();
