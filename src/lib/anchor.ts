// Keeps the reader's place across a language switch (README:283): the last [data-anchor]
// element whose top is above 35% of the viewport, and where it sat. A navigation carries
// it in sessionStorage for one page load, then deletes it (PLAN §4.5). The address's hash
// travels with it: the twin link leaves it off, so the browser's own jump to it can't beat
// the saved place (B45), and the twin puts it back in its address without scrolling (Q2a),
// after the load event: written earlier, the browser would still scroll to it when parsing
// ends (B69).

const KEY = 'tbph-anchor';

export interface Anchor {
  id: string;
  top: number;
}

export function findAnchor(): Anchor | null {
  const limit = window.innerHeight * 0.35;
  let found: Anchor | null = null;
  for (const el of document.querySelectorAll<HTMLElement>('[data-anchor][id]')) {
    const top = el.getBoundingClientRect().top;
    if (top < limit) found = { id: el.id, top };
  }
  return found;
}

/** Scrolls so the anchor is back where it was. */
export function keepAnchor(anchor: Anchor | null): void {
  if (!anchor) return;
  const el = document.getElementById(anchor.id);
  if (!el?.hasAttribute('data-anchor')) return;
  window.scrollBy({ top: el.getBoundingClientRect().top - anchor.top, behavior: 'instant' });
}

/** Before navigating to `path` in the other language. True when a place was saved. */
export function saveAnchor(path: string, hash = ''): boolean {
  const anchor = findAnchor();
  if (!anchor) return false;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, hash, ...anchor }));
    return true;
  } catch {
    return false; // storage blocked: the switch still works, from the top of the page
  }
}

// This load's restored anchor, kept until the reader scrolls: content that lays itself out
// again after load (Data's charts, audit B6), or appears only then (Home's route, B17), can
// apply it once more.
let restored: Anchor | null = null;

/** Applies this load's restored anchor again, if the reader hasn't scrolled since. */
export function reapplyAnchor(): void {
  keepAnchor(restored);
}

/** Whether this load came from a language switch whose anchor is still waiting to be applied. */
export function hasRestoredAnchor(): boolean {
  return restored !== null;
}

/**
 * On load: applies and deletes a saved anchor meant for this page. `onHash` runs once the
 * address has its hash back.
 */
export function restoreAnchor(onHash?: () => void): void {
  let saved: string | null;
  try {
    saved = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
  if (!saved) return;
  try {
    const { path, hash, id, top } = JSON.parse(saved) as Record<string, unknown>;
    if (path === location.pathname && typeof id === 'string' && typeof top === 'number') {
      restored = { id, top };
      keepAnchor(restored);
      if (typeof hash === 'string' && hash.startsWith('#')) {
        const putBack = () => {
          if (!location.hash) history.replaceState(history.state, '', location.pathname + location.search + hash);
          onHash?.();
        };
        if (document.readyState === 'complete') putBack();
        else addEventListener('load', putBack, { once: true });
      }
      for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown']) addEventListener(type, () => (restored = null), { once: true, passive: true });
    }
  } catch {
    // Ignore a malformed entry; it's already deleted.
  }
}
