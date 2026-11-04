// The guided symptom check (README:222–226, pack §4), ported from Check.dc.html. It owns
// <main> and always switches language in place, so answers survive (PLAN §4.2). Answers
// live only in this component's memory: nothing is stored, sent, logged or put in the URL,
// and steps add no history entries (D19). [REVIEW]: clinical review pending.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { check } from '../content/check.ts';
import { fill } from '../content/types.ts';
import { after, answered, before, blank, cardRows, evaluate, MULTI, notes, optionsFor, pickSingle, sequence, toggleMulti, type Answers, type MultiStep, type SingleStep, type Step } from '../lib/check/flow.ts';
import { drawCard, saveImage } from '../lib/check/image.ts';
import { formatDate, todayIso } from '../lib/format-date.ts';
import { href, isLang, type Lang } from '../lib/i18n.ts';

export type CheckStrings = Record<keyof typeof check, string>;

interface Props {
  lang: Lang;
  strings: Record<Lang, CheckStrings>;
}

type View = 'intro' | Step | 'result';

export default function CheckFlow(props: Props) {
  const [lang, setLang] = useState<Lang>(props.lang);
  const t = props.strings[lang];
  const [view, setView] = useState<View>('intro');
  const [a, setA] = useState<Answers>(blank);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Check holds answers, so the language always switches in place.
  useEffect(() => {
    document.documentElement.dataset.langSwitch = 'inplace';
    const onLang = (event: Event) => {
      const next = (event as CustomEvent<{ lang?: unknown }>).detail?.lang;
      if (isLang(next)) setLang(next);
    };
    document.addEventListener('tbph:lang', onLang);
    return () => {
      document.removeEventListener('tbph:lang', onLang);
      delete document.documentElement.dataset.langSwitch;
    };
  }, []);

  // Each new screen starts at the top with focus on its H1.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [view]);

  function go(next: View) {
    moved.current = true;
    setError(false);
    setSaved(false);
    setView(next);
  }

  const result = view === 'result' ? evaluate(a) : null;

  function onNext() {
    if (view === 'intro' || view === 'result') return;
    if (!answered(a, view)) {
      setError(true);
      return;
    }
    go(after(a, view));
  }

  function restart() {
    setA(blank());
    go('intro');
  }

  async function onSaveImage() {
    if (!result || result === 'urgent') return;
    const style = getComputedStyle(document.documentElement);
    const blob = await drawCard({
      title: t.cardTitle,
      rows: rows(),
      foot: t.foot,
      privacy: t.cardPrivacy,
      bodyFont: getComputedStyle(document.body).fontFamily,
      markFont: style.getPropertyValue('--font-newsreader') || 'Georgia, serif',
    });
    if (blob && (await saveImage(blob, t.cardTitle))) setSaved(true);
  }

  const rows = () =>
    cardRows(a, {
      fields: [t.card_field1, t.card_field2, t.card_field3, t.card_field4, t.card_field5, t.card_field6, t.card_field7, t.card_field8],
      label: (list, key) => t[`opt_${list}_${key}` as keyof CheckStrings] ?? '',
      yes: t.yes,
      no: t.no,
      noneVal: t.noneVal,
      notAsked: t.notAsked,
      resultTitle: (r) => t[`res_${r}_title`],
      date: formatDate(todayIso(), lang),
    });

  return (
    <div class={`check-stage${result === 'urgent' ? ' check-stage--film' : ''}`}>
      <div class="frame frame--back">
        <div class="check">
          {view === 'intro' && (
            <div class="check-intro">
              <div class="check-head">
                <h1 class="h1" ref={heading} tabindex={-1}>
                  {t.introTitle}
                </h1>
                <p class="check-lede">{t.introBody}</p>
              </div>
              <ul class="group" role="list">
                <li class="privacy-row">
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="10.5" width="12" height="9" rx="2" />
                    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
                  </svg>
                  <span>{t.privacyLine}</span>
                </li>
              </ul>
              <button type="button" class="btn btn--primary check-wide" onClick={() => go('who')}>
                {t.start}
              </button>
            </div>
          )}

          {view !== 'intro' && view !== 'result' && <Question view={view} a={a} t={t} lang={lang} error={error} heading={heading} onBack={() => go(before(a, view))} onNext={onNext} setA={(next) => {
            setA(next);
            setError(false);
          }} />}

          {result === 'urgent' && (
            <div class="urgent">
              <span class="urgent-bar" aria-hidden="true" />
              <h1 ref={heading} tabindex={-1}>
                {t.res_urgent_title}
              </h1>
              <p class="urgent-body">{t.res_urgent_body}</p>
              <a class="urgent-call" href="tel:911">
                {t.res_urgent_call}
              </a>
              <div class="urgent-actions">
                <button type="button" onClick={() => go(before(a, 'result'))}>
                  {t.back}
                </button>
                <button type="button" onClick={restart}>
                  {t.startOver}
                </button>
              </div>
              <p class="urgent-foot">{t.foot}</p>
            </div>
          )}

          {result && result !== 'urgent' && (
            <div class="result">
              <div class="result-main" data-noprint>
                <h1 class="h1" ref={heading} tabindex={-1}>
                  {t[`res_${result}_title`]}
                </h1>
                <p class="result-body">{t[`res_${result}_body`]}</p>
                {result === 'A' && (
                  <ol class="group result-steps">
                    {[t.res_A_step1, t.res_A_step2, t.res_A_step3].map((text, i) => (
                      <li key={i}>
                        <span class="result-num" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span>
                          <span class="visually-hidden">{i + 1}. </span>
                          {text}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                {notes(a, result).length > 0 && (
                  <ul class="group result-notes" role="list">
                    {notes(a, result).map((n) => (
                      <li key={n}>
                        <span class="info-disc" aria-hidden="true">
                          i
                        </span>
                        <span>{t[`note_${n}`]}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {result !== 'D' && (
                  <div class="result-handoff">
                    <a class="btn btn--primary check-wide" href={href('home', lang, { query: { need: 'all' } })}>
                      {t.res_A_find}
                    </a>
                    {result === 'A' && (
                      <button type="button" class="btn btn--soft btn--md" onClick={onSaveImage}>
                        {t.res_A_save}
                      </button>
                    )}
                  </div>
                )}
                <p class="result-foot">{t.foot}</p>
              </div>

              <section class="patient-card" aria-labelledby="card-title">
                <div class="patient-card-head">
                  <h2 id="card-title">{t.cardTitle}</h2>
                  <p class="wordmark">
                    <span class="wordmark-tb">TB</span> PH
                  </p>
                </div>
                <dl>
                  {rows().map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <p class="patient-card-foot">{t.foot}</p>
              </section>
              <p class="card-privacy">{t.cardPrivacy}</p>
              <div class="card-actions" data-noprint>
                <button type="button" class="btn btn--soft btn--md" onClick={onSaveImage}>
                  {t.saveImg}
                </button>
                <button type="button" class="btn btn--soft btn--md" onClick={() => print()}>
                  {t.print}
                </button>
                <button type="button" class="clear-link" onClick={restart}>
                  {t.startOver}
                </button>
              </div>
              <p class="saved-msg" role="status" data-noprint>
                {saved ? t.saved : ''}
              </p>
              {result !== 'D' && (
                <ul class="group install-entry" role="list" data-noprint>
                  <li>
                    <a class="install-row" href={href('install', lang)}>
                      <span>{t.install}</span>
                      <span class="link-row-chevron" aria-hidden="true">
                        ›
                      </span>
                    </a>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface QuestionProps {
  view: Step;
  a: Answers;
  t: CheckStrings;
  lang: Lang;
  error: boolean;
  heading: { current: HTMLHeadingElement | null };
  onBack: () => void;
  onNext: () => void;
  setA: (a: Answers) => void;
}

function Question({ view, a, t, error, heading, onBack, onNext, setA }: QuestionProps) {
  const multi = MULTI.includes(view);
  const child = a.who === 'child';
  const steps = sequence(a);
  const index = Math.max(0, steps.indexOf(view));
  const options = optionsFor(view, a);
  const title =
    view === 'sym' ? (child ? t.q_symChild : t.q_symAdult) : view === 'recent' ? (child ? t.q_recentChild : t.q_recentAdult) : view === 'risk' && child ? t.q_riskChild : t[`q_${view}` as keyof CheckStrings];
  const choices = options
    ? options.keys.map((key) => ({ key, label: t[`opt_${options.list}_${key}` as keyof CheckStrings] }))
    : [
        { key: 'yes', label: t.yes },
        { key: 'no', label: t.no },
      ];
  const value = a[view];
  const isOn = (key: string) => (Array.isArray(value) ? value.includes(key) : value === key);
  const pick = (key: string) => setA(multi ? toggleMulti(a, view as MultiStep, key) : pickSingle(a, view as SingleStep, key));
  const last = index === steps.length - 1;

  return (
    <div class="question">
      <div class="question-top">
        <button type="button" class="back-link back-button" onClick={onBack}>
          <span aria-hidden="true">‹</span>
          <span>{t.back}</span>
        </button>
        <div class="progress">
          <p class="progress-label">{fill(t.step, { n: String(index + 1), m: String(steps.length) })}</p>
          <div class="progress-bars" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s} class={i <= index ? 'is-done' : undefined} />
            ))}
          </div>
        </div>
      </div>
      <div class="question-head">
        <h1 id="q-title" class="question-title" ref={heading} tabindex={-1}>
          {title}
        </h1>
        {a.who === 'other_adult' && view !== 'who' && <p class="question-other">{t.other}</p>}
        <p id="q-hint" class="question-hint">
          {multi ? t.all : t.one}
        </p>
      </div>
      <div role={multi ? 'group' : 'radiogroup'} aria-labelledby="q-title" aria-describedby="q-hint" class="question-options">
        <div class="group">
          {choices.map((c) => (
            <Choice key={c.key} name={`q-${view}`} multi={multi} on={isOn(c.key)} label={c.label} indent={c.key === 'dr_contact'} onPick={() => pick(c.key)} />
          ))}
        </div>
        {multi && (
          <div class="group">
            <Choice name={`q-${view}`} multi on={isOn('none')} label={t.none} onPick={() => pick('none')} />
          </div>
        )}
      </div>
      {error && (
        <p class="question-error" role="alert">
          {multi ? t.errMulti : t.errOne}
        </p>
      )}
      <div class="next-bar">
        <button type="button" class="btn btn--primary check-wide" onClick={onNext}>
          {last ? t.see : t.next}
        </button>
      </div>
    </div>
  );
}

function Choice(props: { name: string; multi: boolean; on: boolean; label: string; indent?: boolean; onPick: () => void }) {
  return (
    <label class={`check-choice${props.on ? ' is-on' : ''}${props.indent ? ' is-indented' : ''}${props.multi ? ' is-multi' : ''}`} data-choice>
      <input type={props.multi ? 'checkbox' : 'radio'} name={props.name} checked={props.on} onChange={props.onPick} />
      <span class="check-glyph" aria-hidden="true">
        <span class="check-mark">
          <span />
        </span>
      </span>
      <span class="check-text">
        <span>{props.label}</span>
        <span class="choice-check" aria-hidden="true">
          {props.on ? '✓' : ''}
        </span>
      </span>
    </label>
  );
}
