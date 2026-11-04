// Reads out updates that don't move focus (audit B28): an island or page script dispatches
// `tbph:announce` with the text, and it goes into the one role="status" node every page has
// (BaseLayout). Emptied first, so the same text is read again. An event, not an import, so
// no extra chunk is shared between the islands and this script.
document.addEventListener('tbph:announce', (event) => {
  const node = document.getElementById('tbph-announce');
  const text = (event as CustomEvent<string>).detail;
  if (!node || typeof text !== 'string') return;
  node.textContent = '';
  requestAnimationFrame(() => (node.textContent = text));
});
