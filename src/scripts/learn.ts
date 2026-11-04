// Learn: the contents scroll-spy (aria-current="location" on the section in view) and
// "Back to top", smooth unless reduced motion, then focus on <main> (README:231).

const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-toc]')];
const sections = links.map((a) => document.getElementById(a.dataset.toc ?? '')).filter((s): s is HTMLElement => !!s);

function spy() {
  let current = sections[0]?.id;
  for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id;
  for (const a of links) {
    if (a.dataset.toc === current) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  }
}

let frame = 0;
addEventListener(
  'scroll',
  () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      spy();
    });
  },
  { passive: true },
);
spy();

for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-to-top]')) {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    document.getElementById('main')?.focus({ preventScroll: true });
  });
}
