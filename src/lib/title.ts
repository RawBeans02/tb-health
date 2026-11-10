// Page titles (V9, 4 Nov 2026): the page and the brand joined by " | ", never an em dash
// (V8). Home puts the brand first ("TB PH | Find your way to TB care", meta.homeTitle); every
// other page ends with it ("Learn about TB | TB PH"). og:title is the same text
// (BaseLayout.astro), and the place shell sets its title with this too.
export const BRAND = 'TB PH';

/** "<page> | TB PH". */
export function pageTitle(page: string): string {
  return `${page} | ${BRAND}`;
}
