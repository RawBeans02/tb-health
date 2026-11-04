// Learn's structure against its data: every claim, source and string it names exists.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { learn } from '../../src/content/learn.ts';
import { italics, NUMBERS, SECTION_SOURCES, SECTIONS, SOURCES } from '../../src/lib/learn.ts';

const claims = JSON.parse(readFileSync('data/claims.json', 'utf8'));
const ids = new Set(claims.claims.map((c: { id: string }) => c.id));

describe('Learn', () => {
  it('has ten sections, each with a heading string', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10']);
    for (const s of SECTIONS) expect(learn).toHaveProperty(`${s.id}_h`);
  });

  it('names only claims in claims.json (17 of them) and sources it can link', () => {
    const named = Object.values(NUMBERS).flat();
    expect(named).toHaveLength(17);
    for (const id of named) expect(ids.has(id), id).toBe(true);
    for (const list of Object.values(SECTION_SOURCES)) for (const sid of list) expect(SOURCES, sid).toHaveProperty(sid);
  });

  it('turns pack-style *italics* into runs', () => {
    expect(italics('caused by *Mycobacterium tuberculosis*. It')).toEqual([
      { text: 'caused by ', italic: false },
      { text: 'Mycobacterium tuberculosis', italic: true },
      { text: '. It', italic: false },
    ]);
  });

  it('flags every L6 string for the clinical review', () => {
    const l6 = Object.entries(learn).filter(([k]) => k.startsWith('l6_'));
    expect(l6.length).toBeGreaterThan(5);
    for (const [, str] of l6) expect(str.flags).toContain('REVIEW');
  });
});
