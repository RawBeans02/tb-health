// Facilities as the site uses them, ported from tbph-core.js (stat, prep, offers).
import { callNumber } from './phone.ts';
import { norm, titleCase } from './text.ts';

export type Service = 'xray' | 'test' | 'meds';

/** Route order: 1 chest X-ray, 2 sputum TB test, 3 free TB medicines. */
export const SERVICES: readonly Service[] = ['xray', 'test', 'meds'];

/** `referral` exists only for the TB test ("Collects your sample or refers you"). */
export type Status = 'yes' | 'referral' | 'no' | 'unknown';

/** One row of public/data/facilities.json, as scripts/prepare-data.mjs writes it. */
export interface FacilityRow {
  id: string;
  name: string;
  sector?: string;
  phone?: string;
  street?: string;
  city_municipality?: string;
  province_or_city_group?: string;
  region_code?: string;
  region?: string;
  accreditation_expiry?: string;
  facility_kind?: string;
  svc_free_tb_medicines?: string;
  svc_tb_test?: string;
  svc_chest_xray?: string;
  hours?: string;
  lat?: number | string | null;
  lng?: number | string | null;
  geo_precision?: string;
  source_updated?: string;
}

export interface Place {
  id: string;
  /** Title-cased for display. */
  name: string;
  /** As listed, for directions searches. */
  raw: string;
  street: string;
  rawStreet: string;
  city: string;
  prov: string;
  /** "City, Province", or one of them when they're the same. */
  place: string;
  address: string;
  phone: string;
  /** The number the Call link dials (the first that can be dialled, else the first listed), and its tel: link ('' for none). */
  first: string;
  tel: string;
  gov: boolean;
  code: string;
  region: string;
  kind: string;
  accr: string;
  hours: string;
  lat: number | null;
  lng: number | null;
  /** Geocoded to the street address or confirmed: exact distances and coordinate directions. */
  precise: boolean;
  svc: Record<Service, Status>;
  /** Normalised keys for matching: name + city + province, city, province. */
  key: string;
  ckey: string;
  pkey: string;
}

/** Only `yes` (and `onsite_or_referral` for the test) counts; anything else is "Call to confirm". */
export function serviceStatus(value: unknown, service: Service): Status {
  const v = String(value ?? '').toLowerCase();
  if (service === 'test' && v === 'onsite_or_referral') return 'referral';
  if (v === 'yes') return 'yes';
  if (v === 'no') return 'no';
  return 'unknown';
}

export function prepare(row: FacilityRow): Place {
  const city = row.city_municipality ?? '';
  const prov = row.province_or_city_group ?? '';
  const place = city && prov && city !== prov && !city.includes(prov) ? `${city}, ${prov}` : city || prov;
  const street = titleCase(row.street ?? '');
  const phone = String(row.phone ?? '').trim();
  const { first, tel } = callNumber(phone, row.region_code);
  const lat = parseFloat(String(row.lat));
  const lng = parseFloat(String(row.lng));
  const located = Number.isFinite(lat) && Number.isFinite(lng);
  return {
    id: row.id,
    name: titleCase(row.name),
    raw: row.name,
    street,
    rawStreet: row.street ?? '',
    city,
    prov,
    place,
    address: [street, place].filter(Boolean).join(', '),
    phone,
    first,
    tel,
    gov: /gov/i.test(row.sector ?? ''),
    code: row.region_code ?? '',
    region: row.region ?? '',
    kind: row.facility_kind ?? '',
    accr: String(row.accreditation_expiry ?? '').trim(),
    hours: String(row.hours ?? '').trim(),
    lat: located ? lat : null,
    lng: located ? lng : null,
    precise: located && (row.geo_precision === 'address' || row.geo_precision === 'confirmed'),
    svc: {
      xray: serviceStatus(row.svc_chest_xray, 'xray'),
      test: serviceStatus(row.svc_tb_test, 'test'),
      meds: serviceStatus(row.svc_free_tb_medicines, 'meds'),
    },
    key: norm([row.name, city, prov].join(' ')),
    ckey: norm(city),
    pkey: norm(prov),
  };
}

export function offers(place: Place, service: Service): boolean {
  return place.svc[service] === 'yes' || place.svc[service] === 'referral';
}
