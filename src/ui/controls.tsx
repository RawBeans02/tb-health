// Shared controls (README "Components" and "Added in v6"), used by Home and Places.
// Classes only: styles in src/styles/ui.css.
import type { ComponentChildren, Ref, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { Place, Status } from '../lib/core/facility.ts';
import type { GazEntry } from '../lib/core/geo.ts';
import { directionsUrl } from '../lib/core/links.ts';
import { Chip, SectorBadge } from './parts.tsx';

/** Buttons with aria-pressed in a labelled group; the selected one is Ink-filled. */
export function SegmentedControl<K extends string>(props: {
  label: string;
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  class?: string;
}) {
  return (
    <div role="group" aria-label={props.label} class={`segmented${props.class ? ` ${props.class}` : ''}`}>
      {props.options.map((o) => (
        <button key={o.key} type="button" aria-pressed={o.key === props.value ? 'true' : 'false'} onClick={() => props.onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select(props: { id: string; label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <div class="field">
      <label class="field-label" for={props.id}>
        {props.label}
      </label>
      <span class="select">
        <select id={props.id} value={props.value} onChange={(e) => props.onChange(e.currentTarget.value)}>
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    </div>
  );
}

export function Switch(props: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" role="switch" class="switch" aria-checked={props.checked ? 'true' : 'false'} onClick={() => props.onChange(!props.checked)}>
      <span class="switch-track" aria-hidden="true">
        <span class="switch-knob" />
      </span>
      <span>{props.label}</span>
    </button>
  );
}

/** "Where are you?": the search field with place suggestions and "Use my location". */
export function LocationField(props: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onInput: (value: string) => void;
  gaz: readonly GazEntry[] | null;
  locLabel: string;
  locating: boolean;
  onLocate: () => void;
  inputRef?: Ref<HTMLInputElement>;
  invalid?: boolean;
  /** Message under the button, and whether it's an error (TB red, role="alert"). */
  message?: { text: string; error: boolean } | null;
  /** Home's note, which also describes the field. */
  note?: string;
  /** The Enter key: 'go' submits Home's form; 'done' (Places, which filters as you type)
      closes the keyboard (audit B31). */
  enter: 'go' | 'done';
}) {
  const msgId = `${props.id}-msg`;
  const noteId = `${props.id}-note`;
  return (
    <div class="field-group">
      <label class="field-label" for={props.id}>
        {props.label}
      </label>
      <div class="search">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke-width="2.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          id={props.id}
          ref={props.inputRef}
          type="text"
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          placeholder={props.placeholder}
          list="tbph-places"
          autocomplete="off"
          autocorrect="off"
          spellcheck={false}
          enterkeyhint={props.enter}
          onKeyDown={(e) => {
            if (props.enter === 'done' && e.key === 'Enter' && !e.isComposing) e.currentTarget.blur();
          }}
          aria-describedby={props.note ? `${msgId} ${noteId}` : msgId}
          aria-invalid={props.note ? (props.invalid ? 'true' : 'false') : undefined}
        />
      </div>
      <datalist id="tbph-places">
        {props.gaz?.map((g) => (
          <option key={`${g.kind}:${g.label}`} value={g.label} />
        ))}
      </datalist>
      <button type="button" class="locate" onClick={props.onLocate} disabled={props.locating} aria-busy={props.locating ? 'true' : 'false'}>
        <span class="locate-dot" aria-hidden="true" />
        <span>{props.locLabel}</span>
      </button>
      {/* Always mounted, so screen readers hear a message the moment it is written (audit B9). */}
      <p id={msgId} class={`field-msg${props.message?.error ? ' field-msg--error' : ''}`} role={props.message?.error ? 'alert' : 'status'}>
        {props.message?.text ?? ''}
      </p>
      {props.note !== undefined && (
        <p id={noteId} class="field-note">
          {props.note}
        </p>
      )}
    </div>
  );
}

export interface FacilityStrings {
  commute: string;
  call: string;
  gov: string;
  priv: string;
  hours: string;
  noHours: string;
}

/** One facility in a white group: name link, distance, chips, badge, address, hours, actions. */
export function FacilityRow(props: {
  place: Place;
  href: string;
  distance: string;
  chips: readonly { status: Status; label: string; prefix?: string }[];
  heading: 'h3' | 'h4';
  t: FacilityStrings;
}) {
  const { place: p, t } = props;
  const Heading = props.heading;
  return (
    <li class="facility">
      <div class="facility-head">
        <Heading class="facility-name">
          <a href={props.href}>{p.name}</a>
        </Heading>
        {props.distance && <span class="facility-dist">{props.distance}</span>}
      </div>
      <div class="facility-tags">
        {props.chips.map((c, i) => (
          <Chip key={i} status={c.status} label={c.label} prefix={c.prefix} />
        ))}
        <SectorBadge gov={p.gov} label={p.gov ? t.gov : t.priv} />
      </div>
      <p class="facility-address">{p.address}</p>
      <p class="facility-hours">{p.hours ? t.hours.replace('{hours}', p.hours) : t.noHours}</p>
      <div class="facility-actions">
        <a class="btn btn--soft" href={directionsUrl(p, 'transit')} target="_blank" rel="noopener" aria-label={`${t.commute}: ${p.name}`}>
          {t.commute}
        </a>
        {p.tel && (
          <a class="call-link" href={p.tel} aria-label={`${t.call}: ${p.name}, ${p.first}`}>
            {t.call}
          </a>
        )}
      </div>
    </li>
  );
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A bottom sheet dialog (README:211): slides up in 240ms (instant with reduced motion),
 * closes with Done, a scrim tap, Escape or a downward swipe over 90px. While open, focus
 * is trapped, the page can't scroll, and everything else is inert. Focus returns to
 * `returnFocus` on close. The parent unmounts it after `onClosed`.
 */
export function BottomSheet(props: {
  title: string;
  subtitle: string;
  doneLabel: string;
  closing: boolean;
  onClose: () => void;
  onClosed: () => void;
  returnFocus: RefObject<HTMLElement | null>;
  /** The page content next to the sheet, made inert while it's open. */
  background: RefObject<HTMLElement | null>;
  children: ComponentChildren;
}) {
  const [shown, setShown] = useState(reduced());
  const [drag, setDrag] = useState(0);
  const sheet = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const startY = useRef<number | null>(null);
  const touchId = useRef<number | null>(null); // the one finger the sheet follows (B30)

  // Open: lock scroll, make the rest inert, slide in, focus the heading.
  useEffect(() => {
    const others = [document.querySelector('.site-header'), document.querySelector('.site-footer'), props.background.current].filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    for (const el of others) el.inert = true;
    const id = requestAnimationFrame(() => {
      setShown(true);
      head.current?.focus();
    });
    // One close however it's asked for: Escape and a CloseWatcher can both fire for one key.
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      dismiss();
    };
    // Escape anywhere: Safari doesn't move focus to a button it clicks, so focus can be on <body>.
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onEscape);
    // The system Back gesture (Android) closes it too, where the browser has CloseWatcher (B15).
    const Watcher = (window as unknown as { CloseWatcher?: new () => { onclose: (() => void) | null; destroy(): void } }).CloseWatcher;
    const watcher = Watcher ? new Watcher() : null;
    if (watcher) watcher.onclose = close;
    return () => {
      watcher?.destroy();
      document.removeEventListener('keydown', onEscape);
      cancelAnimationFrame(id);
      document.body.style.overflow = overflow;
      for (const el of others) el.inert = false;
      props.returnFocus.current?.focus();
    };
  }, []);

  // Close: slide out, then tell the parent to unmount.
  useEffect(() => {
    if (!props.closing) return;
    if (reduced()) {
      props.onClosed();
      return;
    }
    setShown(false);
    setDrag(0);
    const id = setTimeout(props.onClosed, 220);
    return () => clearTimeout(id);
  }, [props.closing]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !sheet.current) return;
    const focusable = [...sheet.current.querySelectorAll<HTMLElement>('button, input, select, a[href], [tabindex="-1"]')].filter(
      (el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null,
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Every close starts the slide-out at once, from wherever a drag left the sheet (B30).
  function dismiss() {
    startY.current = null;
    touchId.current = null;
    setDrag(0);
    setShown(false);
    props.onClose();
  }

  // The finger the sheet follows, if it's among these touches.
  const ours = (list: TouchList) => [...list].find((t) => t.identifier === touchId.current);

  function onTouchStart(event: TouchEvent) {
    if (touchId.current !== null) return; // a second finger: ignored
    const touch = event.changedTouches[0];
    touchId.current = touch.identifier;
    startY.current = touch.clientY;
  }

  function onTouchMove(event: TouchEvent) {
    const touch = ours(event.touches);
    if (touch && startY.current !== null) setDrag(Math.max(0, touch.clientY - startY.current));
  }

  function onTouchEnd(event: TouchEvent) {
    if (!ours(event.changedTouches)) return;
    if (drag > 90) {
      dismiss();
      return;
    }
    startY.current = null;
    touchId.current = null;
    setDrag(0);
  }

  // The system took the touch (a scroll, a gesture, a call): back to rest, never a close.
  function onTouchCancel(event: TouchEvent) {
    if (!ours(event.changedTouches)) return;
    startY.current = null;
    touchId.current = null;
    setDrag(0);
  }

  return (
    <div class="sheet-layer">
      <div class={`sheet-scrim${shown ? ' is-shown' : ''}`} aria-hidden="true" onClick={dismiss} />
      <div
        ref={sheet}
        class={`sheet${shown ? ' is-shown' : ''}${drag ? ' is-dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-h"
        onKeyDown={onKeyDown}
        // Follows the finger while dragging (CSSOM, which the CSP allows).
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <div class="sheet-grab" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel}>
          <span class="sheet-grabber" aria-hidden="true" />
          <div class="sheet-head">
            <div>
              <h2 id="sheet-h" ref={head} tabindex={-1}>
                {props.title}
              </h2>
              <p class="sheet-count" aria-live="polite">
                {props.subtitle}
              </p>
            </div>
            <button type="button" class="sheet-done" onClick={dismiss}>
              {props.doneLabel}
            </button>
          </div>
        </div>
        <div class="sheet-body">{props.children}</div>
      </div>
    </div>
  );
}
