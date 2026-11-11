// Loads the facility list (README:288), ported from tbph-core.js (facilities). Per Q6 a
// failed load is an error the page shows with "Try again"; it never falls back to the
// 93-row sample. The promise is cached, and cleared on failure so "Try again" refetches.
import { prepare, type FacilityRow, type Place } from './facility.ts';
import { buildGazetteer, fromCompact, type GazBase, type GazEntry } from './geo.ts';

export const FACILITIES_URL = '/data/facilities.json';

// Set by astro.config.mjs: true only in `npm run build:worst` (TBPH_WORST=true).
declare const __TBPH_WORST__: boolean;

/**
 * The list to load. With ?data=worst, the dev-only worst-case list (step 15.4, the break-ui
 * skill; scripts/prepare-data.mjs --with-worst): only `astro dev` and `npm run build:worst`
 * compile this branch in. A production build drops it, and scripts/check-dev-only.mjs fails a
 * build that didn't.
 */
function listUrl(): string {
  if ((import.meta.env.DEV || __TBPH_WORST__) && typeof location !== 'undefined' && new URLSearchParams(location.search).get('data') === 'worst') {
    return '/data/facilities-worst.json';
  }
  return FACILITIES_URL;
}

/** public/data/facilities.json, as scripts/prepare-data.mjs writes it. */
export interface FacilitiesFile {
  /** `worst`: the dev-only worst-case list (step 15.4). */
  meta: { title: string; source: string; count: number; sample: boolean; synthetic: boolean; worst?: boolean };
  /** Old place id → current id, so old links keep working (Q6). */
  aliases: Record<string, string>;
  /** Cities and provinces with their abbreviations, built by prepare-data. */
  gazetteer?: GazBase[];
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
    gaz: file.gazetteer ? fromCompact(file.gazetteer) : buildGazetteer(list),
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
    const url = listUrl();
    const request = fetcher(url)
      .then((response) => {
        if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
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
