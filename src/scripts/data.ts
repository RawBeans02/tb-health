// The Data page: "Back to top", the "TB in numbers" topic picker (segmented from 720px, a
// select below) and deep links: to a claim (#claim-…), which focuses its row (README:242),
// or to a chart, the numbers or the methods. The charts are laid out again at the phone's
// width once they hydrate, which moves everything below them: the link is applied again
// then, unless the reader has started scrolling (audit B6).

document.addEventListener('click', (event) => {
  const link = event.target instanceof Element ? event.target.closest('[data-to-top]') : null;
  if (!link) return;
  const top = document.getElementById('top');
  if (!top) return;
  event.preventDefault();
  // To the charts' intro (below the dot story), clear of the sticky header.
  scrollTo({ top: top.getBoundingClientRect().top + scrollY - 80, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  top.focus({ preventScroll: true });
});

const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-topic]')];
const select = document.getElementById('topic') as HTMLSelectElement | null;
const groups = [...document.querySelectorAll<HTMLElement>('[data-group]')];

function showTopic(topic: string) {
  for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.topic === topic));
  if (select) select.value = topic;
  for (const g of groups) g.hidden = topic !== 'all' && g.dataset.group !== topic;
}

for (const b of buttons) b.addEventListener('click', () => showTopic(b.dataset.topic ?? 'all'));
select?.addEventListener('change', () => showTopic(select.value));

function toHash() {
  // Ids are lowercase words and dashes; anything else (#%) is ignored, never decoded (B37).
  const id = /^#([a-z0-9-]+)$/.exec(location.hash)?.[1];
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  const claim = id!.startsWith('claim-');
  if (claim) showTopic('all');
  target.scrollIntoView({ block: 'start', behavior: 'instant' }); // clear of the header: global.css scroll-padding-top
  if (claim) target.focus({ preventScroll: true });
}

let following = true;
for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown']) addEventListener(type, () => (following = false), { once: true, passive: true });

addEventListener('hashchange', toHash);
document.addEventListener('tbph:charts-ready', () => {
  if (following) toHash();
});
toHash();
