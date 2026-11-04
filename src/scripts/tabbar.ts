// The phone tab bar's real height, as --tabbar-h on <html> (audit B14). Its labels can wrap
// onto two or three lines (Filipino, narrow phones), and what sits above it (Check's Next,
// the footer spacer, scroll padding) is offset by it. CSS falls back to the one-line bar;
// tabbar-prepaint.js sets the first value before first paint (B68), this keeps it current.
const bar = document.querySelector<HTMLElement>('.tab-bar');
if (bar) {
  const root = document.documentElement;
  new ResizeObserver(() => {
    const height = bar.getBoundingClientRect().height;
    if (height > 0) root.style.setProperty('--tabbar-h', `${Math.round(height)}px`);
  }).observe(bar);
}
