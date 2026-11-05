// The release gate's decision (audit B59–B62): each blocking key's trigger, what the owner
// may accept, the exit-2 refusals, a build without Check, and check-review clearing once the
// clinical review is recorded. Synthetic strings and builds only.
import { describe, expect, it } from 'vitest';
import { ACCEPTABLE, applyAccept, assess, parseArgs } from '../../scripts/launch-check.mjs';

type Str = { id: string; en: string; fil: string; origin: string; src: string[]; flags?: string[] };
const str = (id: string, flags?: string[], extra: Partial<Str> = {}): Str => ({ id, en: 'Text', fil: 'Teksto', origin: 'pack', src: ['pack', 'pack'], flags, ...extra });

const HOME = '<link rel="canonical" href="https://tb.example.org/">';
const LIVE = '<link rel="canonical" href="https://tbph.org/">';
const HEADERS = '/*\n  Strict-Transport-Security: max-age=31536000\n';
const facilities = (meta: object = {}) => ({ meta: { count: 3, ...meta }, facilities: [{ accreditation_expiry: '2027-06-30', source_updated: '2026-10-01' }] });

type Input = {
  strings: Str[];
  build: { home: string; checkBuilt: boolean; headers: string | null } | null;
  facilities: ReturnType<typeof facilities> | null;
  today: string;
};

/** A release-ready build: real domain, production headers, real data, Check reviewed. */
const ready = (over: Partial<Input> = {}) =>
  assess({ strings: [str('nav.home'), str('check.q1')], build: { home: LIVE, checkBuilt: true, headers: HEADERS }, facilities: facilities(), today: '2026-11-05', ...over } satisfies Input);
const keys = (r: { blocking: { key: string }[] }) => r.blocking.map((b) => b.key);

describe('assess: each key and its trigger', () => {
  it('passes a release-ready build', () => {
    expect(keys(ready())).toEqual([]);
  });

  it('owner-strings: a string the owner supplies is still empty', () => {
    expect(keys(ready({ strings: [str('meta.aboutDescription', undefined, { fil: '', src: ['pack', 'owner'] })] }))).toEqual(['owner-strings']);
  });

  it('privacy-row: the privacy row blocks on its own while it is empty, and clears once supplied (B73)', () => {
    const row = (en: string, fil: string) => str('about.privacyServices', undefined, { en, fil, origin: 'owner', src: ['owner', 'owner'] });
    expect(keys(ready({ strings: [row('', '')] }))).toEqual(['privacy-row']);
    expect(keys(ready({ strings: [row('Our host sees…', '')] }))).toEqual(['privacy-row']);
    expect(keys(ready({ strings: [row('Our host sees…', 'Nakikita ng host…')] }))).toEqual([]);
  });

  it('review, verify and placeholders: flagged copy outside Check', () => {
    expect(keys(ready({ strings: [str('learn.l6', ['REVIEW']), str('place.sakay', ['VERIFY']), str('about.group', ['PLACEHOLDER'])] }))).toEqual(['review', 'verify', 'placeholders']);
  });

  it('check-review: Check is built and a check string carries [REVIEW], or the reviewer placeholder is in; it says how many are left', () => {
    const r = ready({ strings: [str('check.q1', ['REVIEW']), str('check.q2', ['REVIEW']), str('check.foot', ['REVIEW', 'PLACEHOLDER'])] });
    expect(keys(r)).toEqual(['check-review']);
    expect(r.blocking[0].text).toContain('3 check strings still carry [REVIEW]');
    expect(r.blocking[0].text).toContain('reviewer placeholder is still in (check.foot)');
    expect(keys(ready({ strings: [str('check.foot', ['PLACEHOLDER'])] }))).toEqual(['check-review']);
  });

  it('check-review clears once the review is recorded (no [REVIEW] flags, no reviewer placeholder)', () => {
    expect(keys(ready({ strings: [str('check.q1'), str('check.foot')] }))).toEqual([]);
  });

  it('sample and synthetic: read from the built facility list', () => {
    expect(keys(ready({ facilities: facilities({ sample: true }) }))).toEqual(['sample']);
    expect(keys(ready({ facilities: facilities({ synthetic: true, sample: true }) }))).toEqual(['synthetic']);
  });

  it('no-data and no-build: nothing built yet', () => {
    expect(keys(ready({ facilities: null }))).toEqual(['no-data']);
    expect(keys(ready({ build: null, facilities: null }))).toEqual(['no-data', 'no-build']);
  });

  it('domain: the placeholder address', () => {
    expect(keys(ready({ build: { home: HOME, checkBuilt: true, headers: HEADERS } }))).toEqual(['domain']);
    expect(keys(ready({ build: { home: '<title>x</title>', checkBuilt: true, headers: HEADERS } }))).toEqual(['domain']);
  });

  it('not-production: the noindex header; no-headers: dist/_headers missing', () => {
    expect(keys(ready({ build: { home: LIVE, checkBuilt: true, headers: `${HEADERS}  X-Robots-Tag: noindex\n` } }))).toEqual(['not-production']);
    expect(keys(ready({ build: { home: LIVE, checkBuilt: true, headers: null } }))).toEqual(['no-headers']);
  });
});

describe('assess: a build without Check', () => {
  const strings = [str('nav.home'), str('check.q1', ['REVIEW']), str('check.foot', ['REVIEW', 'PLACEHOLDER']), str('check.fil', ['FIL-REVIEW'], { en: 'A — B' })];
  const off = assess({ strings, build: { home: LIVE, checkBuilt: false, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });

  it('blocks check-mentions, not check-review', () => {
    expect(keys(off)).toEqual(['check-mentions']);
    expect(off.decide).toContain('Check is left out of this build (TBPH_CHECK=false, Q9).');
  });

  it("leaves Check's strings out of every list", () => {
    expect(JSON.stringify(off)).not.toMatch(/check\.(q1|foot|fil)/);
    expect(off.queues[0]).toBe('Filipino review: 0 strings not from the pack (D10).');
  });

  it('is told apart from a build with Check by dist/check.html alone, not the nav markup', () => {
    const on = assess({ strings, build: { home: LIVE, checkBuilt: true, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });
    expect(keys(on)).toEqual(['check-review']);
  });
});

describe('parseArgs and applyAccept: the exit-2 refusals', () => {
  it('takes --release and --accept=key,key; any other argument is an error', () => {
    expect(parseArgs(['--release', '--accept=sample,review'])).toEqual({ release: true, accept: ['sample', 'review'] });
    expect(parseArgs([])).toEqual({ release: false, accept: [] });
    for (const bad of [['--relase'], ['--accept', 'sample'], ['release'], ['--release', '--force']]) expect(parseArgs(bad)).toHaveProperty('error');
  });

  const blocking = [
    { key: 'sample', text: '' },
    { key: 'check-review', text: '' },
    { key: 'domain', text: '' },
  ];

  it('accepts the owner’s own calls that are open, and keeps the rest open', () => {
    expect(applyAccept(blocking, ['sample', 'check-review'])).toEqual({ open: [blocking[2]], accepted: [blocking[0], blocking[1]] });
  });

  it('refuses the keys that can never be accepted', () => {
    for (const key of ['privacy-row', 'synthetic', 'no-build', 'no-data', 'no-headers', 'domain', 'not-production']) {
      expect(ACCEPTABLE).not.toContain(key);
      expect(applyAccept([...blocking, { key, text: '' }], [key])).toHaveProperty('error');
    }
  });

  it('refuses an unknown key and an acceptable one that is not open', () => {
    expect(applyAccept(blocking, ['samples'])).toHaveProperty('error');
    expect(applyAccept(blocking, ['verify'])).toHaveProperty('error');
  });
});
