// The prepared facility list, read at build time. prepare-data runs before astro build.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FacilitiesFile } from './core/data.ts';

let cached: FacilitiesFile | null = null;

export function readFacilities(): FacilitiesFile {
  cached ??= JSON.parse(readFileSync(join(process.cwd(), 'public/data/facilities.json'), 'utf8')) as FacilitiesFile;
  return cached;
}

/** Every place page to build: one per id, plus one per old id kept by an alias (Q6). */
export function placePaths() {
  const file = readFacilities();
  const byId = new Map(file.facilities.map((row) => [row.id, row]));
  const pages = file.facilities.map((row) => ({ params: { id: row.id }, props: { row, canonicalId: row.id } }));
  for (const [from, to] of Object.entries(file.aliases)) {
    const row = byId.get(to);
    if (row) pages.push({ params: { id: from }, props: { row, canonicalId: to } });
  }
  return pages;
}
