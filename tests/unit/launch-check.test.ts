// The release gate's decision (audit B59–B62, B73, B74): each blocking key's trigger, what
// the owner may accept, the exit-2 refusals, a build without Check, check-review clearing once
// the clinical review is recorded, reading dist/, and the script's exit codes. Synthetic
// strings and builds only.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { about } from '../../src/content/about.ts';
import { headersFile } from '../../src/lib/headers.ts';
import { PLACEHOLDER_SITE } from '../../src/lib/site.ts';
import { ACCEPTABLE, applyAccept, assess, manilaToday, parseArgs, readBuild, viewTitleDashes } from '../../scripts/launch-check.mjs';

type Str = { id: string; en: string; fil: string; origin: string; src: string[]; flags?: string[] };
const str = (id: string, flags?: string[], extra: Partial<Str> = {}): Str => ({ id, en: 'Text', fil: 'Teksto', origin: 'pack', src: ['pack', 'pack'], flags, ...extra });

const canonical = (origin: string) => `<link rel="canonical" href="${origin}/">`;
const HOME = canonical(PLACEHOLDER_SITE);
const LIVE = canonical('https://tbph.org');
const HEADERS = headersFile(true);
const BOTH = { en: true, fil: true };
const NONE = { en: false, fil: false };
const facilities = (meta: object = {}) => ({ meta: { count: 3, ...meta }, facilities: [{ accreditation_expiry: '2027-06-30', source_updated: '2026-10-01' }] });

type Input = {
  strings: Str[];
  build: { home: string; check: { en: boolean; fil: boolean }; headers: string | null } | null;
  facilities: ReturnType<typeof facilities> | null;
  today: string;
  checkMentions?: string[];
  titleDashes?: string[];
};

/** A release-ready build: real domain, production headers, real data, Check reviewed. */
/** The privacy row, supplied: every release-ready string list carries it (B82: a missing row blocks). */
const ROW = str('about.privacyServices', undefined, { en: 'Our host sees…', fil: 'Nakikita ng host…', origin: 'owner', src: ['owner', 'owner'] });
const withRow = (strings: Str[]) => (strings.some((s) => s.id === ROW.id) ? strings : [...strings, ROW]);

/** A release-ready build: real domain, production headers, real data, Check reviewed. */
const ready = (over: Partial<Input> = {}) =>
  assess({ build: { home: LIVE, check: BOTH, headers: HEADERS }, facilities: facilities(), today: '2026-11-05', ...over, strings: withRow(over.strings ?? [str('nav.home'), str('check.q1')]) } satisfies Input);
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

  it("privacy-row: a row that isn't in the dictionaries at all blocks too, never as owner-strings (B82)", () => {
    const r = assess({ strings: [str('about.privacyRow', undefined, { en: '', fil: '', origin: 'owner', src: ['owner', 'owner'] })], build: { home: LIVE, check: BOTH, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });
    expect(keys(r)).toEqual(['privacy-row', 'owner-strings']);
    expect(r.blocking[0].text).toContain("isn't in the dictionaries");
  });

  it('privacy-row: the id the gate looks for is the real dictionary row, which the owner supplies (B82)', () => {
    expect(about.privacyServices).toMatchObject({ origin: 'owner', src: ['owner', 'owner'] });
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
    expect(keys(ready({ build: { home: HOME, check: BOTH, headers: HEADERS } }))).toEqual(['domain']);
    expect(keys(ready({ build: { home: '<title>x</title>', check: BOTH, headers: HEADERS } }))).toEqual(['domain']);
  });

  it('not-production: the noindex header; no-headers: dist/_headers missing; headers: anything but the production file (B74)', () => {
    expect(keys(ready({ build: { home: LIVE, check: BOTH, headers: headersFile(false) } }))).toEqual(['not-production']);
    expect(keys(ready({ build: { home: LIVE, check: BOTH, headers: null } }))).toEqual(['no-headers']);
    expect(keys(ready({ build: { home: LIVE, check: BOTH, headers: HEADERS.replace('max-age=31536000', 'max-age=0') } }))).toEqual(['headers']);
    expect(keys(ready({ build: { home: LIVE, check: BOTH, headers: '' } }))).toEqual(['headers']);
  });

  it('check-pages: Check in one language only blocks, and its review still counts (B74)', () => {
    const r = ready({ strings: [str('check.q1', ['REVIEW'])], build: { home: LIVE, check: { en: true, fil: false }, headers: HEADERS } });
    expect(keys(r)).toEqual(['check-review', 'check-pages']);
    expect(r.blocking[0].text).toContain('1 check string still carries [REVIEW]');
  });

  it("check-review: the footer's bracketed reviewer placeholder counts even without its flag (B74)", () => {
    const foot = (en: string, fil: string) => str('check.foot', undefined, { en, fil });
    expect(keys(ready({ strings: [foot('Medical review: [partner clinicians — pending].', 'Medical review: Dr. A.')] }))).toEqual(['check-review']);
    expect(keys(ready({ strings: [foot('Medical review: Dr. A.', 'Medical review: [mga katuwang na doktor — nakabinbin].')] }))).toEqual(['check-review']);
    expect(keys(ready({ strings: [foot('Medical review: Dr. A.', 'Medical review: Dr. A.')] }))).toEqual([]);
  });

  it('check-review: the reviewer placeholder still counts once V3 rewords its dash (B82)', () => {
    const foot = (en: string) => str('check.foot', undefined, { en, fil: 'Medical review: Dr. A.' });
    expect(keys(ready({ strings: [foot('Medical review: [partner clinicians, pending].')] }))).toEqual(['check-review']);
    expect(keys(ready({ strings: [foot('Medical review: [partner clinicians: pending]')] }))).toEqual(['check-review']);
  });

  it('lists the em dashes in strings and in the page titles the views build (B74)', () => {
    const r = ready({ strings: [str('home.lede', undefined, { en: 'A — B' })], titleDashes: ['About', 'Learn'] });
    expect(r.decide.find((d) => d.startsWith('Em dashes'))).toBe('Em dashes (V3), for the owner or the v7 wording: home.lede; and the page titles built in src/views and src/islands (" — TB PH"): About, Learn.');
    expect(viewTitleDashes('src/views', 'src/islands')).toEqual(['About', 'Data', 'Install', 'Learn', 'Place', 'PlaceShell']);
  });

  it('counts a title only in code, not in a comment (B82)', () => {
    const d = mkdtempSync(join(tmpdir(), 'tbph-views-'));
    try {
      writeFileSync(join(d, 'A.astro'), "---\n// \"Home — TB PH\", from the prototype\nconst title = 'Home';\n---\n<!-- About — TB PH -->");
      writeFileSync(join(d, 'B.tsx'), "/* Page — TB PH */ const url = 'https://x.org'; document.title = `${name} — TB PH`;");
      expect(viewTitleDashes(d)).toEqual(['B']);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it("reads Check's pages as check.html: the build writes files, not folders (B82)", () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).toMatch(/build:\s*\{\s*format:\s*'file'\s*\}/);
  });

  it("names dataPage.method2 as the dictionary spells it (B74)", () => {
    expect(ready().decide.join(' ')).toContain('dataPage.method2');
  });
});

describe('dates and reading dist/ (B74)', () => {
  it("dates the accreditations by the Philippines' calendar", () => {
    expect(manilaToday(new Date('2026-11-05T15:59:00Z'))).toBe('2026-11-05');
    expect(manilaToday(new Date('2026-11-05T16:00:00Z'))).toBe('2026-11-06');
  });

  const dirs: string[] = [];
  afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));
  const dist = (files: Record<string, string>) => {
    const d = mkdtempSync(join(tmpdir(), 'tbph-gate-'));
    dirs.push(d);
    for (const [name, text] of Object.entries(files)) {
      mkdirSync(join(d, name, '..'), { recursive: true });
      writeFileSync(join(d, name), text);
    }
    return d;
  };
  const data = (meta: object) => JSON.stringify(facilities(meta));

  it('reads the build, both Check pages, _headers and the facility list', () => {
    const { build, facilities: list } = readBuild(dist({ 'index.html': LIVE, 'check.html': '', 'fil/check.html': '', _headers: HEADERS, 'data/facilities.json': data({ sample: true }) }));
    expect(build).toEqual({ home: LIVE, check: BOTH, headers: HEADERS });
    expect(list?.meta.sample).toBe(true);
  });

  it('reads a build without Check, without _headers, with synthetic data, and no build at all', () => {
    const r = readBuild(dist({ 'index.html': LIVE, 'data/facilities.json': data({ synthetic: true }) }));
    expect(r.build).toEqual({ home: LIVE, check: NONE, headers: null });
    // No check-mentions: every string that named the check has a …NoCheck twin (Q9, 7 Nov 2026).
    expect(keys(assess({ strings: [ROW], ...r, today: '2026-11-05' }))).toEqual(['synthetic', 'no-headers']);
    expect(readBuild(dist({}))).toEqual({ build: null, facilities: null });
  });
});

describe('the script: exit codes, also run through a symlink (B74)', () => {
  const run = (script: string, ...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' }).status;

  it('exits 2 on an unknown argument and on a key that can never be accepted', () => {
    expect(run('scripts/launch-check.mjs', '--bogus')).toBe(2);
    expect(run('scripts/launch-check.mjs', '--release', '--accept=domain')).toBe(2);
  });

  it('exits 1 while anything blocks, and 0 for a report, on a build of its own (B82)', () => {
    // A temporary dist/ with synthetic data, which always blocks, so the checkout's own build
    // (a clean production one, say) can't change the answer.
    const d = mkdtempSync(join(tmpdir(), 'tbph-gate-'));
    try {
      mkdirSync(join(d, 'data'));
      writeFileSync(join(d, 'index.html'), LIVE);
      writeFileSync(join(d, '_headers'), HEADERS);
      writeFileSync(join(d, 'data', 'facilities.json'), JSON.stringify(facilities({ synthetic: true })));
      const status = (...args: string[]) => spawnSync(process.execPath, ['scripts/launch-check.mjs', ...args], { encoding: 'utf8', env: { ...process.env, LAUNCH_CHECK_DIST: d } }).status;
      expect(status('--release')).toBe(1);
      expect(status()).toBe(0);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('says which folder it judged when LAUNCH_CHECK_DIST is set, and release-check ignores it (B87)', () => {
    const d = mkdtempSync(join(tmpdir(), 'tbph-gate-'));
    try {
      const env = { ...process.env, LAUNCH_CHECK_DIST: d };
      const direct = spawnSync(process.execPath, ['scripts/launch-check.mjs'], { encoding: 'utf8', env });
      expect(direct.stderr).toContain(`judging the build in ${d}`);
      const release = spawnSync('npm', ['run', '--silent', 'release-check'], { encoding: 'utf8', env });
      expect(release.stdout).toContain('launch-check: what is still open before launch'); // it ran
      expect(release.stderr).not.toContain('judging the build in');
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('runs main() through a symlinked path', () => {
    const d = mkdtempSync(join(tmpdir(), 'tbph-link-'));
    try {
      symlinkSync(join(process.cwd(), 'scripts/launch-check.mjs'), join(d, 'lc.mjs'));
      symlinkSync(join(process.cwd(), 'scripts/post-deploy-check.mjs'), join(d, 'pdc.mjs'));
      expect(run(join(d, 'lc.mjs'), '--bogus')).toBe(2);
      expect(run(join(d, 'pdc.mjs'))).toBe(2); // no origin: the usage line
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});

describe('assess: a build without Check', () => {
  const strings = [str('nav.home'), ROW, str('check.q1', ['REVIEW']), str('check.foot', ['REVIEW', 'PLACEHOLDER']), str('check.fil', ['FIL-REVIEW'], { en: 'A — B' })];
  const off = assess({ strings, build: { home: LIVE, check: NONE, headers: HEADERS }, facilities: facilities(), today: '2026-11-05', checkMentions: ['install.lead'] });

  it('blocks check-mentions, not check-review', () => {
    expect(keys(off)).toEqual(['check-mentions']);
    expect(off.decide).toContain('Check is left out of this build (TBPH_CHECK=false, Q9).');
  });

  it('blocks check-mentions only while its list has strings (B74)', () => {
    expect(keys(assess({ strings, build: { home: LIVE, check: NONE, headers: HEADERS }, facilities: facilities(), today: '2026-11-05', checkMentions: [] }))).toEqual([]);
  });

  it('ships each …NoCheck twin instead of the string that named the check (Q9, 7 Nov 2026)', () => {
    const base = str('install.lead', ['FIL-REVIEW']);
    const twin = str('install.leadNoCheck', undefined, { en: '', fil: '', origin: 'owner', src: ['owner', 'owner'] });
    const items = [str('install.off2', ['FIL-REVIEW']), str('home.bring3', ['FIL-REVIEW'])];
    const withOff = assess({ strings: [...strings, base, twin, ...items], build: { home: LIVE, check: NONE, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });
    expect(keys(withOff)).toEqual(['owner-strings']);
    expect(withOff.blocking[0].text).toContain('install.leadNoCheck');
    expect(JSON.stringify(withOff)).not.toMatch(/install\.lead[^N]|install\.off2|home\.bring3/);
    const withOn = assess({ strings: [str('nav.home'), ROW, base, twin], build: { home: LIVE, check: BOTH, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });
    expect(JSON.stringify(withOn)).not.toMatch(/NoCheck/);
  });

  it("leaves Check's page title and description out too (B74)", () => {
    const meta = [str('meta.checkTitle', undefined, { en: 'Check — TB PH' }), str('meta.checkDescription', ['FIL-REVIEW'])];
    const r = assess({ strings: [...strings, ...meta], build: { home: LIVE, check: NONE, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });
    expect(JSON.stringify(r)).not.toMatch(/meta\.check/);
  });

  it("leaves Check's strings out of every list", () => {
    expect(JSON.stringify(off)).not.toMatch(/check\.(q1|foot|fil)/);
    expect(off.queues[0]).toBe('Filipino review: 0 strings not from the pack (D10).');
  });

  it('is told apart from a build with Check by dist/check.html alone, not the nav markup', () => {
    const on = assess({ strings, build: { home: LIVE, check: BOTH, headers: HEADERS }, facilities: facilities(), today: '2026-11-05' });
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
    for (const key of ['privacy-row', 'synthetic', 'no-build', 'no-data', 'no-headers', 'headers', 'check-pages', 'domain', 'not-production']) {
      expect(ACCEPTABLE).not.toContain(key);
      expect(applyAccept([...blocking, { key, text: '' }], [key])).toHaveProperty('error');
    }
  });

  it('refuses an unknown key and an acceptable one that is not open', () => {
    expect(applyAccept(blocking, ['samples'])).toHaveProperty('error');
    expect(applyAccept(blocking, ['verify'])).toHaveProperty('error');
  });
});
