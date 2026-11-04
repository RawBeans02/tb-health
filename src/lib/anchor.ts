// Keeps the reader's place across a language switch (README:283): the last [data-anchor]
// element whose top is above 35% of the viewport, and where it sat. A navigation carries
// it in sessionStorage for one page load, then deletes it (PLAN §4.5).

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

/** Before navigating to `path` in the other language. */
export function saveAnchor(path: string): void {
  const anchor = findAnchor();
  if (!anchor) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, ...anchor }));
  } catch {
    // Storage blocked: the switch still works, from the top of the page.
  }
}

/** On load: applies and deletes a saved anchor meant for this page. */
export function restoreAnchor(): void {
  let saved: string | null;
  try {
    saved = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
  if (!saved) return;
  try {
    const { path, id, top } = JSON.parse(saved) as Record<string, unknown>;
    if (path === location.pathname && typeof id === 'string' && typeof top === 'number') keepAnchor({ id, top });
  } catch {
    // Ignore a malformed entry; it's already deleted.
  }
}
