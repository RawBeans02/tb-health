// Loads the facility list (README:288), ported from tbph-core.js (facilities). Per Q6 a
// failed load is an error the page shows with "Try again"; it never falls back to the
// 93-row sample. The promise is cached, and cleared on failure so "Try again" refetches.
import { prepare, type FacilityRow, type Place } from './facility.ts';
import { buildGazetteer, type GazEntry } from './geo.ts';

export const FACILITIES_URL = '/data/facilities.json';

/** public/data/facilities.json, as scripts/prepare-data.mjs writes it. */
export interface FacilitiesFile {
  meta: { title: string; source: string; count: number; sample: boolean; synthetic: boolean };
  /** Old place id → current id, so old links keep working (Q6). */
  aliases: Record<string, string>;
  facilities: FacilityRow[];
}

export interface Dataset {
  list: Place[];
  gaz: GazEntry[];
  byId: Map<string, Place>;
  aliases: Record<string, string>;
  /** The 93-row design sample: pages show the approximate-pins note. */
  sample: boolean;
  synthetic: boolean;
  regions: number;
}

export function buildDataset(file: FacilitiesFile): Dataset {
  const list = file.facilities.map(prepare);
  return {
    list,
    gaz: buildGazetteer(list),
    byId: new Map(list.map((p) => [p.id, p])),
    aliases: file.aliases ?? {},
    sample: file.meta.sample,
    synthetic: file.meta.synthetic,
    regions: new Set(list.map((p) => p.code)).size,
  };
}

let pending: Promise<Dataset> | null = null;

export function loadFacilities(fetcher: typeof fetch = fetch): Promise<Dataset> {
  if (!pending) {
    const request = fetcher(FACILITIES_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`${FACILITIES_URL}: HTTP ${response.status}`);
        return response.json() as Promise<FacilitiesFile>;
      })
      .then(buildDataset);
    pending = request;
    request.catch(() => {
      if (pending === request) pending = null;
    });
  }
  return pending;
}
