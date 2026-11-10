// Step 2: header, tab bar, footer, skip link, language links and 404s (PLAN §5).
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';
import { chromeSnapshot } from './helpers.ts';

const header = (page: Page) => page.locator('.site-header');
const langLink = (page: Page, lang: 'en' | 'fil') => page.locator(`.site-header [data-lang-link="${lang}"]`);

test.describe('breakpoints', () => {
  for (const [path, edge] of [
    ['/', 1000],
    ['/fil', 1180],
  ] as const) {
    test(`${path}: desktop nav from ${edge}px, tab bar below`, async ({ page }) => {
      await page.setViewportSize({ width: edge - 1, height: 800 });
      await page.goto(path);
      await expect(page.locator('.site-nav')).toBeHidden();
      await expect(page.locator('.tab-bar')).toBeVisible();
      await expect(page.locator('.site-footer-spacer')).toBeVisible();
      await page.setViewportSize({ width: edge, height: 800 });
      await expect(page.locator('.site-nav')).toBeVisible();
      await expect(page.locator('.tab-bar')).toBeHidden();
      await expect(page.locator('.site-footer-spacer')).toBeHidden();
    });
  }

  for (const path of ['/', '/fil', '/no-such-page', '/fil/wala-rito']) {
    test.describe(() => {
      test.use({ expectedErrors: path.includes('-') ? [/status of 404/] : [] });
      test(`${path}: no sideways scroll at 320px`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto(path);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      });
    });
  }
});

test.describe('header and tab bar', () => {
  test('match the spec at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    expect((await header(page).boundingBox())?.height).toBe(65);
    const current = page.locator('.site-nav a[aria-current="page"]');
    await expect(current).toHaveText('Find TB care');
    await expect(current).toHaveCSS('border-bottom-color', 'rgb(30, 107, 112)');
    await expect(current).toHaveCSS('font-weight', '700');
    await expect(page.locator('.site-nav a')).toHaveText(['Find TB care', 'Check symptoms', 'Learn about TB', 'The data', 'About']);
    await expect(langLink(page, 'en')).toHaveAttribute('aria-current', 'true');
    await expect(langLink(page, 'en')).toHaveCSS('background-color', 'rgb(20, 33, 43)');
    await expect(langLink(page, 'fil')).not.toHaveAttribute('aria-current');
    await expect(page.locator('.site-header [role="group"]')).toHaveAttribute('aria-label', 'Language / Wika');
  });

  test('tab bar: four tabs, 60px tall, current one marked', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/fil');
    const tabs = page.locator('.tab-bar a');
    await expect(tabs).toHaveText(['Hanapin ang gamutan', 'Suriin ang sintomas', 'Alamin ang TB', 'Ang datos']);
    for (const box of await tabs.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(60);
    await expect(tabs.first()).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.tab-bar')).toHaveAttribute('aria-label', 'Pangunahing nabigasyon');
  });

  test('glass turns solid under more contrast', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    const glass = page.locator('.site-header-glass');
    const bar = page.locator('.tab-bar');
    await expect(glass).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.72)');
    await expect(bar).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.68)');
    await page.emulateMedia({ contrast: 'more' });
    await expect(glass).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(glass).toHaveCSS('border-bottom-color', 'rgb(217, 213, 203)');
    await expect(glass).toHaveCSS('backdrop-filter', 'none');
    await expect(bar).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(bar).toHaveCSS('border-top-color', 'rgb(217, 213, 203)');
  });

  test('glass turns solid under reduced transparency', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Only Chromium can emulate prefers-reduced-transparency (through CDP).');
    await page.goto('/');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    await expect(page.locator('.site-header-glass')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.locator('.tab-bar')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  test('glass has a solid fallback where blur is unsupported', async ({ page }) => {
    // No browser here lacks backdrop-filter, so check the @supports rule itself.
    await page.goto('/');
    const fallback = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((sheet) => [...sheet.cssRules])
        .filter((rule): rule is CSSSupportsRule => rule instanceof CSSSupportsRule && /^not\b/.test(rule.conditionText) && rule.conditionText.includes('backdrop-filter'))
        .flatMap((rule) => [...rule.cssRules].map((r) => r.cssText)),
    );
    expect(fallback.join('\n')).toMatch(/\.site-header-glass \{[^}]*background: var\(--surface\)/);
    expect(fallback.join('\n')).toMatch(/\.tab-bar \{[^}]*background: var\(--surface\)/);
  });
});

test.describe('skip link', () => {
  test('appears on the first Tab and moves focus to the main content', async ({ page, browserName }) => {
    await page.goto('/');
    // Safari moves focus to links with Option+Tab.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toHaveText('Skip to content');
    expect((await skip.boundingBox())?.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });
});

test.describe('footer', () => {
  test('has the pack safety and emergency lines and the data date', async ({ page }) => {
    await page.goto('/fil');
    const footer = page.locator('.site-footer');
    await expect(footer.locator('.site-footer-emergency a')).toHaveAttribute('href', 'tel:911');
    await expect(footer).toContainText('Emergency? Tumawag sa 911.');
    // The v8 pack's safety line: a full stop where the em dash was (V8).
    await expect(footer).toContainText('Kung dalawang linggo ka nang inuubo o higit pa, magpasuri. Libre ito sa mga pampublikong health center.');
    await expect(footer).toContainText(/Datos: WHO Global Tuberculosis Report 2025, DOH, PhilHealth\. Huling update: \d{1,2} \p{L}+ \d{4}\./u);
    // "Aksesibilidad" in Filipino (V11).
    await expect(footer.locator('nav a')).toHaveText(['Hanapin ang gamutan', 'Suriin ang sintomas', 'Alamin ang TB', 'Ang datos', 'Aksesibilidad', 'I-install ang app', 'Tungkol sa amin']);
    await expect(footer.locator('nav a', { hasText: 'Aksesibilidad' })).toHaveAttribute('href', '/fil/about#accessibility');
    await page.goto('/');
    await expect(footer).toContainText("If you've had a cough for 2 weeks or more, get tested. It's free at public health centers.");
    await expect(footer.locator('nav a', { hasText: 'Accessibility' })).toHaveAttribute('href', '/about#accessibility');
  });

  test('hides "Install the app" in the installed app', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-standalone', 'false');
    await expect(html).toHaveAttribute('data-online', 'true');
    await expect(html).toHaveAttribute('data-platform', 'desktop');
    const install = page.locator('.site-footer .install-entry');
    await expect(install).toBeVisible();
    await page.evaluate(() => document.documentElement.setAttribute('data-standalone', 'true'));
    await expect(install).toBeHidden();
  });
});

test.describe('language links', () => {
  test('carry the query and hash, save the choice and switch pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?need=all#x');
    await expect(langLink(page, 'fil')).toHaveAttribute('href', '/fil?need=all#x');
    await langLink(page, 'fil').click();
    await page.waitForURL((url) => url.pathname === '/fil');
    expect(page.url()).toMatch(/\/fil\?need=all#x$/);
    expect(await page.evaluate(() => localStorage.getItem('tbph-lang'))).toBe('fil');
    await expect(langLink(page, 'fil')).toHaveAttribute('aria-current', 'true');

    await langLink(page, 'en').click();
    await page.waitForURL((url) => url.pathname === '/');
    expect(await page.evaluate(() => localStorage.getItem('tbph-lang'))).toBe('en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  // A switch from an address with a hash (B69): the twin opens without it, so the browser's
  // jump can't beat the saved place, and gets it back only after load. Written earlier, at
  // the end of parsing the browser would scroll to it after all, and to #main (tabindex -1)
  // it would move focus too (B83).
  for (const [name, start, follow, later, hash] of [
    ["About, from the footer's Accessibility link", '/', '.site-footer a[href="/about#accessibility"]', '#numbers', '#accessibility'],
    ['Learn, from a contents link', '/learn', '.toc-narrow a[href="#l2"]', '#l6', '#l2'],
    ['About, from the skip link', '/about', '.skip-link', '#numbers', '#main'],
  ] as const) {
    test(`${name}: a switch keeps the place and the hash, and focus doesn't move (B69)`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(start);
      await page.locator(follow).evaluate((link: HTMLElement) => link.click());
      await page.waitForURL((url) => url.hash === hash);
      await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
      await page.locator(later).evaluate((el) => scrollBy({ top: el.getBoundingClientRect().top - 120, behavior: 'instant' }));
      await expect.poll(async () => Math.abs((await page.locator(later).boundingBox())!.y - 120)).toBeLessThanOrEqual(1);
      const before = (await page.locator(later).boundingBox())!.y;
      await page.locator('.site-header [data-lang-link="fil"]').evaluate((link: HTMLElement) => link.click());
      await page.waitForURL((url) => url.pathname.startsWith('/fil/'), { waitUntil: 'load' });
      // The hash is back in the address, and two frames have passed.
      await expect.poll(() => new URL(page.url()).hash).toBe(hash);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
      expect(Math.abs((await page.locator(later).boundingBox())!.y - before)).toBeLessThanOrEqual(2);
      await expect(langLink(page, 'en')).toHaveAttribute('href', new RegExp(`${hash}$`));

      // Back on the source page, its Filipino link carries the hash again. Independent of the
      // back-forward cache: a stale link, then a pageshow from the cache, which refreshes it.
      await page.goBack({ waitUntil: 'load' });
      expect(new URL(page.url()).hash).toBe(hash);
      await expect(langLink(page, 'fil')).toHaveAttribute('href', new RegExp(`${hash}$`));
      await langLink(page, 'fil').evaluate((link) => link.setAttribute('href', '/stale'));
      await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      await expect(langLink(page, 'fil')).toHaveAttribute('href', new RegExp(`${hash}$`));
    });
  }

  test('a saved Filipino choice sends English pages to their twin, keeping query and hash (Q2b)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tbph-places option').first()).toBeAttached(); // Home's list has loaded
    await page.evaluate(() => localStorage.setItem('tbph-lang', 'fil'));
    await page.goto('/?need=all#x');
    await page.waitForURL((url) => url.pathname === '/fil');
    expect(page.url()).toMatch(/\/fil\?need=all#x$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  });

  test('switch in place on pages holding state, matching a fresh load of the other language', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/fil');
    const fil = await chromeSnapshot(page);
    await page.goto('/');
    await expect(page.locator('#tbph-places option').first()).toBeAttached(); // Home's island has hydrated
    const en = await chromeSnapshot(page);

    // An island holding state (e.g. a location fix on Home) sets this.
    await page.evaluate(() => {
      document.documentElement.dataset.langSwitch = 'inplace';
      (window as unknown as { stayed: boolean }).stayed = true;
    });
    const events = page.evaluate(() => new Promise<string>((resolve) => document.addEventListener('tbph:lang', (e) => resolve((e as CustomEvent).detail.lang), { once: true })));
    await langLink(page, 'fil').click();
    expect(await events).toBe('fil');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
    expect(new URL(page.url()).pathname).toBe('/fil');
    expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
    expect(await chromeSnapshot(page)).toEqual(fil);

    await page.locator('.site-footer [data-lang-link="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await chromeSnapshot(page)).toEqual(en);
    expect(await page.evaluate(() => localStorage.getItem('tbph-lang'))).toBe('en');
  });
});

test.describe('404', () => {
  test.use({ expectedErrors: [/status of 404/] });

  for (const [path, lang, h1, twin] of [
    ['/no-such-page?a=1', 'en', "We can't find that page.", '/fil/no-such-page?a=1'],
    ['/fil/wala-rito', 'fil', 'Hindi namin mahanap ang pahinang iyon.', '/wala-rito'],
  ] as const) {
    test(`${path} is a 404 in ${lang}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('h1')).toHaveCSS('color', 'rgb(196, 32, 50)');
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(langLink(page, lang === 'en' ? 'fil' : 'en')).toHaveAttribute('href', twin);
      await expect(page.locator('main .btn')).toHaveCount(2);
    });
  }

  test('a saved Filipino choice turns an English 404 into the Filipino one', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tbph-places option').first()).toBeAttached(); // Home's list has loaded
    await page.evaluate(() => localStorage.setItem('tbph-lang', 'fil'));
    await page.goto('/no-such-page');
    await page.waitForURL((url) => url.pathname === '/fil/no-such-page');
    await expect(page.locator('h1')).toHaveText('Hindi namin mahanap ang pahinang iyon.');
  });

  test('an English 404 served at a /fil address stays put (a host with one root 404)', async ({ page }) => {
    const english404 = await (await page.request.get('/no-such-page')).text();
    await page.route('**/fil/no-such-page', (route) => route.fulfill({ status: 404, contentType: 'text/html', body: english404 }));
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('tbph-lang', 'fil'));
    await page.goto('/fil/no-such-page');
    await expect(page.locator('h1')).toHaveText("We can't find that page.");
    expect(new URL(page.url()).pathname).toBe('/fil/no-such-page');
  });
});
