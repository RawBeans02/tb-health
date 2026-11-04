// The symptom check's logic (pack §4, Check.dc.html: seq, evaluate, notes, pickSingle,
// toggleMulti, cardRows) as pure functions. Answers live only in memory (pack §4 rules):
// nothing here stores, sends or logs them. [REVIEW]: the clinical review is pending.

export type Who = 'self' | 'other_adult' | 'child';
export type YesNo = 'yes' | 'no';
export type Xray = 'yes' | 'no' | 'unsure' | 'none';
export type Result = 'urgent' | 'A' | 'B' | 'C' | 'D';
export type Note = 'blood' | 'dr' | 'hiv' | 'child' | 'xray_unsure' | 'recent';

export interface Answers {
  who: Who | null;
  /** Multi-selects hold option keys, or ['none'] for "None of these". */
  danger: string[];
  sym: string[];
  blood: YesNo | null;
  recent: YesNo | null;
  xray: Xray | null;
  risk: string[];
}

export type Step = 'who' | 'danger' | 'sym' | 'blood' | 'recent' | 'xray' | 'risk';
export type MultiStep = 'danger' | 'sym' | 'risk';
export type SingleStep = 'who' | 'blood' | 'recent' | 'xray';

type Path = 'adult' | 'child' | 'both';
interface Option {
  key: string;
  path: Path;
  /** Risk factors: counts toward result B (pack §4, "High risk?"). */
  high?: boolean;
}

// Option keys and paths, in the pack's order. Labels are in src/content/check.ts as
// opt_{question}_{key}.
export const OPTIONS = {
  who: [
    { key: 'self', path: 'both' },
    { key: 'other_adult', path: 'both' },
    { key: 'child', path: 'both' },
  ],
  danger: [
    { key: 'blood_lots', path: 'adult' },
    { key: 'breath', path: 'both' },
    { key: 'chest', path: 'adult' },
    { key: 'drowsy', path: 'both' },
    { key: 'no_drink', path: 'child' },
    { key: 'vomit_all', path: 'child' },
    { key: 'convulsions', path: 'child' },
  ],
  symAdult: [
    { key: 'cough', path: 'adult' },
    { key: 'fever', path: 'adult' },
    { key: 'weight', path: 'adult' },
    { key: 'sweats', path: 'adult' },
  ],
  symChild: [
    { key: 'c_cough', path: 'child' },
    { key: 'c_fever', path: 'child' },
    { key: 'c_weight', path: 'child' },
    { key: 'c_tired', path: 'child' },
    { key: 'c_antibiotic', path: 'child' },
    { key: 'c_viral', path: 'child' },
  ],
  xray: [
    { key: 'yes', path: 'adult' },
    { key: 'no', path: 'adult' },
    { key: 'unsure', path: 'adult' },
    { key: 'none', path: 'adult' },
  ],
  risk: [
    { key: 'contact', path: 'both', high: true },
    { key: 'dr_contact', path: 'both', high: true },
    { key: 'hiv', path: 'both', high: true },
    { key: 'diabetes', path: 'adult', high: true },
    { key: 'prev_tb', path: 'both', high: true },
    { key: 'age60', path: 'adult', high: true },
    { key: 'under5', path: 'child', high: true },
    { key: 'underweight', path: 'both', high: true },
    { key: 'immuno', path: 'both', high: true },
    { key: 'smoke_alcohol', path: 'adult', high: false },
    { key: 'crowded', path: 'adult', high: false },
  ],
} as const satisfies Record<string, readonly Option[]>;

export const MULTI: readonly Step[] = ['danger', 'sym', 'risk'];

export function blank(): Answers {
  return { who: null, danger: [], sym: [], blood: null, recent: null, xray: null, risk: [] };
}

const isChild = (a: Answers) => a.who === 'child';
const some = (keys: readonly string[]) => keys.some((k) => k !== 'none');

/** The questions this person sees, in order. "Recent symptoms" only after "None of these" on Q3. */
export function sequence(a: Answers): Step[] {
  const child = isChild(a);
  const steps: Step[] = ['who', 'danger', 'sym'];
  if (!child) steps.push('blood');
  if (a.sym.includes('none')) steps.push('recent');
  if (!child) steps.push('xray');
  steps.push('risk');
  return steps;
}

/** Which option list a step shows, by path. `dr_contact` only once `contact` is chosen. */
export function optionsFor(step: Step, a: Answers): { list: keyof typeof OPTIONS; keys: string[] } | null {
  const path = isChild(a) ? 'child' : 'adult';
  const list: keyof typeof OPTIONS | null =
    step === 'who' ? 'who' : step === 'danger' ? 'danger' : step === 'sym' ? (path === 'child' ? 'symChild' : 'symAdult') : step === 'xray' ? 'xray' : step === 'risk' ? 'risk' : null;
  if (!list) return null; // yes/no questions
  const keys = (OPTIONS[list] as readonly Option[])
    .filter((o) => o.path === 'both' || o.path === path)
    .filter((o) => o.key !== 'dr_contact' || a.risk.includes('contact'))
    .map((o) => o.key);
  return { list, keys };
}

/** Pack §4 decision logic: top to bottom, first match wins. */
export function evaluate(a: Answers): Result {
  if (some(a.danger)) return 'urgent';
  if (some(a.sym) || a.blood === 'yes' || a.xray === 'yes') return 'A';
  const high = a.risk.some((k) => OPTIONS.risk.find((o) => o.key === k)?.high);
  if (a.recent === 'yes' && high) return 'B';
  if (some(a.risk)) return 'C';
  return 'D';
}

/** Add-on notes shown inside the result (none on the urgent screen). */
export function notes(a: Answers, r: Result): Note[] {
  if (r === 'urgent') return [];
  const out: Note[] = [];
  if (a.blood === 'yes') out.push('blood');
  if (a.risk.includes('prev_tb') || a.risk.includes('dr_contact')) out.push('dr');
  if (a.risk.includes('hiv')) out.push('hiv');
  if (isChild(a)) out.push('child');
  if (a.xray === 'unsure') out.push('xray_unsure');
  if (a.recent === 'yes' && r === 'D') out.push('recent');
  return out;
}

/** A single choice. Switching between the adult and child paths clears every later answer. */
export function pickSingle(a: Answers, step: SingleStep, key: string): Answers {
  const next = { ...a, [step]: key } as Answers;
  if (step === 'who' && a.who && (a.who === 'child') !== (key === 'child')) {
    return { ...blank(), who: key as Who };
  }
  return next;
}

/**
 * A multi-select toggle. "None of these" clears the others and the others clear it;
 * unticking `contact` drops `dr_contact`; leaving "None of these" on Q3 drops the
 * recent-symptoms answer, so no stale answer reaches the result or the card.
 */
export function toggleMulti(a: Answers, step: MultiStep, key: string): Answers {
  let v = a[step].slice();
  if (key === 'none') v = v.includes('none') ? [] : ['none'];
  else {
    v = v.filter((x) => x !== 'none');
    v = v.includes(key) ? v.filter((x) => x !== key) : [...v, key];
    if (step === 'risk' && !v.includes('contact')) v = v.filter((x) => x !== 'dr_contact');
  }
  const next = { ...a, [step]: v };
  if (step === 'sym' && !v.includes('none')) next.recent = null;
  return next;
}

export function answered(a: Answers, step: Step): boolean {
  const v = a[step];
  return Array.isArray(v) ? v.length > 0 : v !== null;
}

/** After Next: the following step, or the result. A danger sign goes straight to the urgent screen. */
export function after(a: Answers, step: Step): Step | 'result' {
  if (step === 'danger' && some(a.danger)) return 'result';
  const steps = sequence(a);
  const i = steps.indexOf(step);
  return i >= steps.length - 1 ? 'result' : steps[i + 1];
}

/** After Back. From a result: the danger question for urgent, else the last question. */
export function before(a: Answers, step: Step | 'result'): Step | 'intro' {
  if (step === 'result') return evaluate(a) === 'urgent' ? 'danger' : sequence(a).at(-1)!;
  const steps = sequence(a);
  const i = steps.indexOf(step);
  return i <= 0 ? 'intro' : steps[i - 1];
}

export interface CardText {
  fields: readonly string[];
  /** Option label by list and key; '' when unknown. */
  label: (list: keyof typeof OPTIONS, key: string) => string;
  yes: string;
  no: string;
  noneVal: string;
  notAsked: string;
  resultTitle: (r: Exclude<Result, 'urgent'>) => string;
  date: string;
}

/** The summary card's rows (pack §4 "Summary card"), for results A–D. */
export function cardRows(a: Answers, t: CardText): { label: string; value: string }[] {
  const child = isChild(a);
  const many = (list: keyof typeof OPTIONS, keys: readonly string[]) => {
    const labels = keys.filter((k) => k !== 'none').map((k) => t.label(list, k)).filter(Boolean);
    return labels.length ? labels.join('; ') : t.noneVal;
  };
  const yn = (v: YesNo | null) => (v === 'yes' ? t.yes : v === 'no' ? t.no : t.notAsked);
  const r = evaluate(a);
  return [
    { label: t.fields[0], value: t.date },
    { label: t.fields[1], value: (a.who && t.label('who', a.who)) || t.notAsked },
    { label: t.fields[2], value: many(child ? 'symChild' : 'symAdult', a.sym) },
    { label: t.fields[3], value: child ? t.notAsked : yn(a.blood) },
    { label: t.fields[4], value: yn(a.recent) },
    { label: t.fields[5], value: child ? t.notAsked : (a.xray && t.label('xray', a.xray)) || t.notAsked },
    { label: t.fields[6], value: many('risk', a.risk) },
    { label: t.fields[7], value: r === 'urgent' ? '' : t.resultTitle(r) },
  ];
}
