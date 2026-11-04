// Shared UI parts (README "Components"), as Preact so islands and static pages render the
// same markup. Styles are classes in src/styles/ui.css: no style attributes, which the
// CSP would block in prerendered HTML.
import type { ComponentChildren } from 'preact';
import type { Status } from '../lib/core/facility.ts';

/**
 * Service status: fill, outline or dashed outline, a ring glyph and text, so never colour
 * alone. With `prefix` (Places with no service filter) it reads "Chest X-ray: ✓ Offers this"
 * (README:208).
 */
export function Chip({ status, label, prefix }: { status: Status; label: string; prefix?: string }) {
  const kind = status === 'yes' ? 'yes' : status === 'referral' ? 'referral' : 'unknown';
  // One text run after the ring, as in the prototype, so a long chip wraps under itself:
  // ring + " TB test (sputum): Collects…", or "Chest X-ray: ✓ Offers this" (README order).
  const lead = prefix ? `${prefix} ` : '';
  return (
    <span class={`chip chip--${kind}`}>
      {kind !== 'yes' && <span class="chip-ring" aria-hidden="true" />}
      {kind === 'yes' ? `${lead}✓ ${label}` : ` ${lead}${label}`}
    </span>
  );
}

/** The chip label for a status: "Offers this", "Collects your sample or refers you" or "Call to confirm". */
export function statusLabel(t: { status_yes: string; status_referral: string; status_unknown: string }, status: Status): string {
  return status === 'yes' ? t.status_yes : status === 'referral' ? t.status_referral : t.status_unknown;
}

export function SectorBadge({ gov, label }: { gov: boolean; label: string }) {
  return <span class={`badge${gov ? ' badge--gov' : ''}`}>{label}</span>;
}

/** 22px Ink "i" disc + 700 17px text: offline, "no confirmed X-ray" and route notes. */
export function InfoLine({ children, role }: { children: ComponentChildren; role?: 'status' | 'alert' }) {
  return (
    <p class="info-line" role={role}>
      <span class="info-disc" aria-hidden="true">
        i
      </span>
      <span>{children}</span>
    </p>
  );
}

/** Full-width row in a white group: label + "›". */
export function LinkRow({ href, children }: { href: string; children: ComponentChildren }) {
  return (
    <a class="link-row" href={href}>
      <span>{children}</span>
      <span class="link-row-chevron" aria-hidden="true">
        ›
      </span>
    </a>
  );
}
