// Copying text, ported from tbph-core.js (copy, sakay): the Clipboard API where allowed,
// else a hidden textarea and execCommand.

export function copyText(text: string): Promise<boolean> {
  const fallback = () => {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.className = 'copy-buffer';
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  };
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => fallback(),
    );
  }
  return Promise.resolve(fallback());
}

/**
 * "Copy address for Sakay.ph": starts the copy, then opens sakay.ph in the same tap so
 * the browser doesn't block the new tab. Resolves to whether the copy worked.
 */
export function copyForSakay(text: string): Promise<boolean> {
  const copying = copyText(text);
  window.open('https://sakay.ph', '_blank', 'noopener');
  return copying;
}
