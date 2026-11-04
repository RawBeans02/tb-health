// The Data page: "Back to top", the "TB in numbers" topic picker (segmented from 720px, a
// select below) and deep links to a claim (#claim-…), which focus its row (README:242).

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

function focusClaim() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id.startsWith('claim-')) return;
  const row = document.getElementById(id);
  if (!row) return;
  showTopic('all');
  row.scrollIntoView({ block: 'center' });
  row.focus({ preventScroll: true });
}

addEventListener('hashchange', focusClaim);
focusClaim();
