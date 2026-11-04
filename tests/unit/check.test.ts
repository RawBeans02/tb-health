// The symptom check's decision logic (pack §4) as decision tables. Synthetic answers only.
import { describe, expect, it } from 'vitest';
import { after, before, blank, cardRows, evaluate, notes, optionsFor, pickSingle, sequence, toggleMulti, type Answers, type CardText } from '../../src/lib/check/flow.ts';

const adult = (patch: Partial<Answers> = {}): Answers => ({ ...blank(), who: 'self', danger: ['none'], sym: ['none'], blood: 'no', recent: 'no', xray: 'no', risk: ['none'], ...patch });
const child = (patch: Partial<Answers> = {}): Answers => ({ ...blank(), who: 'child', danger: ['none'], sym: ['none'], recent: 'no', risk: ['none'], ...patch });

describe('evaluate: first match wins (pack §4 decision logic)', () => {
  const table: [string, Answers, string][] = [
    ['any danger sign', adult({ danger: ['breath'], sym: ['cough'] }), 'urgent'],
    ['a child danger sign', child({ danger: ['convulsions'] }), 'urgent'],
    ['a 2-week symptom', adult({ sym: ['cough'] }), 'A'],
    ['blood in phlegm, no 2-week symptom', adult({ blood: 'yes' }), 'A'],
    ['an X-ray that might show TB', adult({ xray: 'yes' }), 'A'],
    ['a child 2-week symptom', child({ sym: ['c_tired'] }), 'A'],
    ['recent symptoms and a high-risk factor', adult({ recent: 'yes', risk: ['diabetes'] }), 'B'],
    ['recent symptoms and only a lower-risk factor', adult({ recent: 'yes', risk: ['smoke_alcohol'] }), 'C'],
    ['no symptoms, a risk factor', adult({ risk: ['crowded'] }), 'C'],
    ['recent symptoms, no risk factor', adult({ recent: 'yes' }), 'D'],
    ['nothing at all', adult(), 'D'],
    ['a child under 5 with recent symptoms', child({ recent: 'yes', risk: ['under5'] }), 'B'],
  ];
  for (const [name, answers, result] of table) {
    it(`${name} → ${result}`, () => expect(evaluate(answers)).toBe(result));
  }
});

describe('notes', () => {
  it('adds the notes that apply, never on the urgent screen', () => {
    expect(notes(adult({ sym: ['cough'], blood: 'yes', risk: ['prev_tb', 'hiv'], xray: 'unsure' }), 'A')).toEqual(['blood', 'dr', 'hiv', 'xray_unsure']);
    expect(notes(adult({ risk: ['contact', 'dr_contact'] }), 'C')).toEqual(['dr']);
    expect(notes(child({ sym: ['c_cough'] }), 'A')).toEqual(['child']);
    expect(notes(adult({ recent: 'yes' }), 'D')).toEqual(['recent']);
    expect(notes(adult({ recent: 'yes', risk: ['hiv'] }), 'B')).toEqual(['hiv']);
    expect(notes(adult({ danger: ['breath'], blood: 'yes' }), 'urgent')).toEqual([]);
  });
});

describe('sequence', () => {
  it('asks adults about blood and X-ray, children neither; "recent" only after "None of these"', () => {
    expect(sequence(adult({ sym: ['cough'] }))).toEqual(['who', 'danger', 'sym', 'blood', 'xray', 'risk']);
    expect(sequence(adult())).toEqual(['who', 'danger', 'sym', 'blood', 'recent', 'xray', 'risk']);
    expect(sequence(child())).toEqual(['who', 'danger', 'sym', 'recent', 'risk']);
    expect(sequence(child({ sym: ['c_fever'] }))).toEqual(['who', 'danger', 'sym', 'risk']);
  });

  it('goes straight to the result on a danger sign, and back to it from the urgent screen', () => {
    const a = adult({ danger: ['drowsy'] });
    expect(after(a, 'danger')).toBe('result');
    expect(before(a, 'result')).toBe('danger');
    expect(before(adult(), 'result')).toBe('risk');
    expect(before(adult(), 'who')).toBe('intro');
    expect(after(adult(), 'risk')).toBe('result');
  });
});

describe('options by path', () => {
  it('shows each path its own options, and the drug-resistance option only after contact', () => {
    expect(optionsFor('danger', adult())?.keys).toEqual(['blood_lots', 'breath', 'chest', 'drowsy']);
    expect(optionsFor('danger', child())?.keys).toEqual(['breath', 'drowsy', 'no_drink', 'vomit_all', 'convulsions']);
    expect(optionsFor('risk', adult())?.keys).not.toContain('dr_contact');
    expect(optionsFor('risk', adult({ risk: ['contact'] }))?.keys).toContain('dr_contact');
    expect(optionsFor('risk', child())?.keys).toEqual(['contact', 'hiv', 'prev_tb', 'under5', 'underweight', 'immuno']);
    expect(optionsFor('blood', adult())).toBeNull();
  });
});

describe('stale answers never leak across paths', () => {
  it('switching between adult and child clears every later answer', () => {
    const a = adult({ sym: ['cough'], blood: 'yes', xray: 'yes', risk: ['diabetes'] });
    const switched = pickSingle(a, 'who', 'child');
    expect(switched).toEqual({ ...blank(), who: 'child' });
    // Self ↔ another adult keeps the path, so it keeps the answers.
    expect(pickSingle(a, 'who', 'other_adult')).toEqual({ ...a, who: 'other_adult' });
  });

  it('"None of these" is exclusive, and leaving it on Q3 drops the recent answer', () => {
    let a = adult({ sym: ['none'], recent: 'yes' });
    a = toggleMulti(a, 'sym', 'cough');
    expect(a.sym).toEqual(['cough']);
    expect(a.recent).toBeNull();
    expect(toggleMulti(a, 'sym', 'none').sym).toEqual(['none']);
    expect(toggleMulti(adult({ sym: ['none'] }), 'sym', 'none').sym).toEqual([]);
  });

  it('unticking contact drops the drug-resistance answer', () => {
    const a = toggleMulti(adult({ risk: ['contact', 'dr_contact', 'hiv'] }), 'risk', 'contact');
    expect(a.risk).toEqual(['hiv']);
    expect(evaluate(a)).toBe('C'); // what's left still counts (B43)
  });
});

describe('cardRows', () => {
  const t: CardText = {
    fields: ['Date', 'Checked for', 'Symptoms for 2 weeks or more', 'Blood in phlegm', 'Recent symptoms', 'Chest X-ray answer', 'Risk factors', 'Recommended next step'],
    label: (list, key) => `${list}:${key}`,
    yes: 'Yes',
    no: 'No',
    noneVal: 'None',
    notAsked: 'Not asked',
    resultTitle: (r) => `title ${r}`,
    date: '4 November 2026',
  };

  it('lists the answers in the pack order', () => {
    expect(cardRows(adult({ sym: ['cough', 'sweats'], blood: 'no', recent: null, xray: 'unsure', risk: ['hiv'] }), t).map((r) => r.value)).toEqual([
      '4 November 2026',
      'who:self',
      'symAdult:cough; symAdult:sweats',
      'No',
      'Not asked',
      'xray:unsure',
      'risk:hiv',
      'title A',
    ]);
  });

  it('marks what a child was not asked', () => {
    const rows = cardRows(child({ sym: ['none'], recent: 'yes' }), t);
    expect(rows.map((r) => r.value)).toEqual(['4 November 2026', 'who:child', 'None', 'Not asked', 'Yes', 'Not asked', 'None', 'title D']);
  });
});

describe('the child path and add-on notes (audit B43)', () => {
  it('a child with a household contact gets C, with the child note', () => {
    const a = child({ risk: ['contact'] });
    expect(evaluate(a)).toBe('C');
    expect(notes(a, 'C')).toEqual(['child']);
  });

  it('the urgent screen carries no notes, for a child too', () => {
    const a = child({ danger: ['convulsions'], risk: ['contact'] });
    expect(evaluate(a)).toBe('urgent');
    expect(notes(a, 'urgent')).toEqual([]);
  });

  it("an adult's 'not sure' about an X-ray adds its note on C and on D", () => {
    const c = adult({ xray: 'unsure', risk: ['diabetes'] });
    expect(evaluate(c)).toBe('C');
    expect(notes(c, 'C')).toEqual(['xray_unsure']);
    const d = adult({ xray: 'unsure' });
    expect(evaluate(d)).toBe('D');
    expect(notes(d, 'D')).toEqual(['xray_unsure']);
  });

  it("Back from 'recent' goes to the symptoms for a child, to blood for an adult", () => {
    expect(before(child(), 'recent')).toBe('sym');
    expect(before(adult(), 'recent')).toBe('blood');
  });
});
