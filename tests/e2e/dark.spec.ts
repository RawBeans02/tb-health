// Step 15.2, dark mode (V7, docs/step-15-fix-pass.md): the head tags; every page dark when the
// system is; the dot story repainting when the system appearance flips; the glass; and what
// keeps its light colours on purpose: the urgent Film screen and its "Call 911" button, the
// saved summary image, the map's tiles and markers, and print. Then axe on every page in dark.
// Against the sample build (npm run build:sample).
import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.ts';

type Rgb = [number, number, number];

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const fil = (path: string) => (path === '/' ? '/fil' : `/fil${path}`);
const ROUTES = ['/', '/places', '/place/bangued-rural-health-unit-abra', '/learn', '/data', '/about', '/install', '/check', '/offline'];

// The canvas, ink, dot, muted, separator and TB red tokens in each scheme (tokens.css; the dark
// ones are DotStory.dc.html's applyScheme palette).
const LIGHT = { canvas: [241, 243, 244], ink: [20, 33, 43], dot: [122, 140, 151], red: [196, 32, 50] } satisfies Record<string, Rgb>;
const DARK = { canvas: [14, 20, 23], ink: [231, 236, 239], dot: [135, 152, 163], red: [242, 106, 114] } satisfies Record<string, Rgb>;
const css = ([r, g, b]: Rgb) => `rgb(${r}, ${g}, ${b})`;

test.describe('head tags', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'requests only: one project is enough');

  test('every page has both schemes and a theme colour for each; the manifest stays light', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const sitemap = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    // The sitemap's pages, the 404 page and the service worker's stand-ins.
    const paths = [...sitemap, '/no-such-page', '/offline', '/fil/offline', '/place', '/fil/place'];
    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) {
      const html = await (await request.get(path, { maxRedirects: 0 })).text();
      const head = html.slice(0, html.indexOf('</head>'));
      expect(head.match(/<meta name="color-scheme"[^>]*>/g), path).toEqual(['<meta name="color-scheme" content="light dark">']);
      expect(head.match(/<meta name="theme-color"[^>]*>/g), path).toEqual([
        '<meta name="theme-color" content="#F1F3F4" media="(prefers-color-scheme: light)">',
        '<meta name="theme-color" content="#0E1417" media="(prefers-color-scheme: dark)">',
      ]);
    }
    const manifest = await (await request.get('/manifest.webmanifest')).json();
    expect([manifest.theme_color, manifest.background_color]).toEqual(['#F1F3F4', '#F1F3F4']);
  });
});

test.describe('pages in dark mode', () => {
  // The 404 page's own response shows in the console.
  test.use({ expectedErrors: [/status of 404/] });

  test('every route takes the dark canvas and ink, in English and Filipino; light is unchanged', async ({ page }) => {
    const look = () => page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, fg: getComputedStyle(document.body).color, scheme: getComputedStyle(document.documentElement).colorScheme }));
    await page.emulateMedia({ colorScheme: 'dark' });
    for (const path of [...ROUTES, '/no-such-page']) {
      for (const url of [path, fil(path)]) {
        await page.goto(url);
        expect(await look(), url).toEqual({ bg: css(DARK.canvas), fg: css(DARK.ink), scheme: 'light dark' });
      }
    }
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await look()).toEqual({ bg: css(LIGHT.canvas), fg: css(LIGHT.ink), scheme: 'light dark' });
  });

  test('print stays light with the system set to dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', media: 'print' });
    await page.goto('/about');
    expect(await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.body).color, getComputedStyle(document.documentElement).colorScheme])).toEqual([css(LIGHT.canvas), css(LIGHT.ink), 'light']);
  });
});

test.describe('glass in dark mode', () => {
  test('the header and tab bar take the dark glass, and turn solid with more contrast, less transparency or no blur', async ({ page, browserName }) => {
    const glass = page.locator('.site-header-glass');
    const bar = page.locator('.tab-bar');
    const solid = async () => {
      await expect(glass).toHaveCSS('background-color', 'rgb(24, 33, 38)');
      await expect(glass).toHaveCSS('border-bottom-color', 'rgb(54, 66, 74)');
      await expect(glass).toHaveCSS('backdrop-filter', 'none');
      await expect(bar).toHaveCSS('background-color', 'rgb(24, 33, 38)');
      await expect(bar).toHaveCSS('border-top-color', 'rgb(54, 66, 74)');
      await expect(bar).toHaveCSS('backdrop-filter', 'none');
    };
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    await expect(glass).toHaveCSS('background-color', 'rgba(24, 33, 38, 0.76)');
    await expect(glass).toHaveCSS('border-bottom-color', 'rgba(255, 255, 255, 0.08)');
    await expect(glass).not.toHaveCSS('backdrop-filter', 'none');
    await expect(bar).toHaveCSS('background-color', 'rgba(24, 33, 38, 0.72)');
    await expect(bar).toHaveCSS('border-top-color', 'rgba(255, 255, 255, 0.1)');
    await expect(page.locator('.planner-sheet')).toHaveCSS('background-color', 'rgba(24, 33, 38, 0.7)');

    await page.emulateMedia({ colorScheme: 'dark', contrast: 'more' });
    await solid();
    await expect(page.locator('.planner-sheet')).toHaveCSS('background-color', 'rgb(24, 33, 38)');
    await page.emulateMedia({ colorScheme: 'dark', contrast: 'no-preference' });
    await expect(glass).toHaveCSS('background-color', 'rgba(24, 33, 38, 0.76)');

    // No browser here lacks backdrop-filter: its fallback is the same solid tokens (shell.spec.ts
    // checks the rule), and they read dark.
    const fallback = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'background-color: var(--surface); color: var(--rule)';
      document.body.append(probe);
      const colours = [getComputedStyle(probe).backgroundColor, getComputedStyle(probe).color];
      probe.remove();
      return colours;
    });
    expect(fallback).toEqual(['rgb(24, 33, 38)', 'rgb(54, 66, 74)']);

    if (browserName === 'chromium') {
      // Only Chromium can emulate prefers-reduced-transparency (through CDP), which replaces
      // the emulated features: the scheme goes with it.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-transparency', value: 'reduce' }] });
      await solid();
    }
  });
});

test.describe("the owner's answers of 11 November 2026 (docs/decisions.md)", () => {
  test('a selected segment and the current language: an Ink fill with Surface text in dark (V17); light is unchanged', async ({ page }) => {
    await page.goto('/places');
    await expect(page.locator('.places-toolbar h2')).toHaveText('93 centers');
    const segment = page.locator('.segmented button[aria-pressed="true"]').first();
    const language = page.locator('.lang-toggle a[aria-current]').first();
    const looks = [
      ['dark', 'rgb(231, 236, 239)', 'rgb(24, 33, 38)', 'rgb(24, 33, 38)'],
      ['light', 'rgb(20, 33, 43)', 'rgb(255, 255, 255)', 'rgb(242, 240, 234)'],
    ] as const;
    for (const [scheme, fill, text, languageText] of looks) {
      await page.emulateMedia({ colorScheme: scheme });
      await expect(segment).toHaveCSS('background-color', fill);
      await expect(segment).toHaveCSS('color', text);
      await expect(language).toHaveCSS('background-color', fill);
      await expect(language).toHaveCSS('color', languageText);
    }
  });

  test('over the Places map the header and tab bar turn solid in dark (V18); in light they stay glass', async ({ page }) => {
    const glass = page.locator('.site-header-glass');
    const bar = page.locator('.tab-bar');
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/places');
    await expect(page.locator('.places-toolbar h2')).toHaveText('93 centers');
    await expect(glass).toHaveCSS('background-color', 'rgba(24, 33, 38, 0.76)');
    await expect(bar).toHaveCSS('background-color', 'rgba(24, 33, 38, 0.72)');
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.map')).toHaveAttribute('data-markers', '93');
    await expect(glass).toHaveCSS('background-color', 'rgb(24, 33, 38)');
    await expect(glass).toHaveCSS('border-bottom-color', 'rgb(54, 66, 74)');
    await expect(glass).toHaveCSS('backdrop-filter', 'none');
    await expect(bar).toHaveCSS('background-color', 'rgb(24, 33, 38)');
    await expect(bar).toHaveCSS('border-top-color', 'rgb(54, 66, 74)');
    await expect(bar).toHaveCSS('backdrop-filter', 'none');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(glass).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.72)');
    await expect(glass).not.toHaveCSS('backdrop-filter', 'none');
    await expect(bar).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.68)');
  });
});

test.describe('dot story', () => {
  const canvas = (page: Page) => page.locator('#story canvas');

  /** Scrolls a beat's text to the middle of the window, past the trigger line. */
  async function toBeat(page: Page, n: number) {
    await page.locator(`#beat-${n} [data-beat]`).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  }

  /** How many opaque canvas pixels are each colour of `palette` (within 2 a channel). */
  function count(page: Page, palette: Record<string, Rgb>) {
    return canvas(page).evaluate(async (c: HTMLCanvasElement, palette) => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      const found: Record<string, number> = Object.fromEntries(Object.keys(palette).map((k) => [k, 0]));
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 250) continue;
        for (const [k, [r, g, b]] of Object.entries(palette)) if (Math.abs(data[i] - r) <= 2 && Math.abs(data[i + 1] - g) <= 2 && Math.abs(data[i + 2] - b) <= 2) found[k]++;
      }
      return found;
    }, palette);
  }

  /** The palette the canvas is drawn in: every colour of one scheme, none of the other's. */
  async function drawnIn(page: Page, scheme: 'light' | 'dark') {
    const [own, other] = scheme === 'light' ? [LIGHT, DARK] : [DARK, LIGHT];
    await expect.poll(async () => {
      const seen = await count(page, own);
      const stray = await count(page, other);
      // Beat 4: dots, hollow red rings cut out in the canvas colour, and solid ink.
      return seen.dot > 1000 && seen.red > 500 && seen.canvas > 100 && seen.ink > 500 && Object.values(stray).every((n) => n === 0);
    }, { message: `canvas drawn in the ${scheme} palette` }).toBe(true);
  }

  test('switches palette and repaints when the system appearance flips, and prints light', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/data');
    await toBeat(page, 4);
    await expect(canvas(page)).toHaveAttribute('aria-label', '37 dots are solid ink: people who died.');
    await drawnIn(page, 'light');

    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await drawnIn(page, 'dark');
    await expect(page.locator('.story-stage')).toHaveCSS('background-color', css(DARK.canvas));
    await expect(page.locator('.story-swatch--died')).toHaveCSS('background-color', css(DARK.ink));
    await expect(page.locator('.story-swatch--missed')).toHaveCSS('border-top-color', css(DARK.red));
    await expect(page.locator('main h1')).toHaveCSS('color', css(DARK.red));

    // Printing: the page's CSS is light in print, and the canvas paints light just before.
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark', media: 'print' });
    await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
    await drawnIn(page, 'light');
    await expect(page.locator('.story-stage')).toHaveCSS('background-color', css(LIGHT.canvas));
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark', media: 'screen' });
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    await drawnIn(page, 'dark');

    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await drawnIn(page, 'light');
  });
});

test.describe('kept light on purpose (V7)', () => {
  const h1 = (page: Page) => page.locator('main h1');

  /** Ticks options by their labels and presses Next (check.spec.ts). */
  async function answer(page: Page, ...labels: string[]) {
    for (const label of labels) await page.locator('.check-choice', { hasText: new RegExp(`^${label.replace(/[()]/g, '\\$&')}`) }).first().click();
    await page.locator('.next-bar button').click();
  }

  async function start(page: Page) {
    await page.goto('/check');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(h1(page)).toBeFocused();
  }

  test('the urgent Film screen and its white "Call 911" button keep their colours, hover included', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await start(page);
    await answer(page, 'Myself');
    await answer(page, 'Severe difficulty breathing');
    await expect(h1(page)).toHaveText('Get emergency care now.');
    const call = page.locator('.urgent-call');
    const soft = page.locator('.urgent-actions button').first();
    const look = () =>
      page.evaluate(() => {
        const style = (selector: string) => {
          const cs = getComputedStyle(document.querySelector(selector)!);
          return `${cs.backgroundColor} / ${cs.color}`;
        };
        return ['.check-stage', '.urgent h1', '.urgent-bar', '.urgent-call', '.urgent-actions button', '.urgent-foot'].map(style);
      });
    const film = ['rgb(14, 26, 34) / rgb(255, 255, 255)', 'rgba(0, 0, 0, 0) / rgb(255, 255, 255)', 'rgb(240, 100, 108) / rgb(255, 255, 255)', 'rgb(255, 255, 255) / rgb(196, 32, 50)', 'rgba(255, 255, 255, 0.16) / rgb(255, 255, 255)', 'rgba(0, 0, 0, 0) / rgb(169, 180, 186)'];
    expect(await look()).toEqual(film);
    // The page around it is dark.
    await expect(page.locator('body')).toHaveCSS('background-color', css(DARK.canvas));
    await call.hover();
    await expect(call).toHaveCSS('background-color', 'rgb(241, 243, 244)');
    await expect(call).toHaveCSS('color', 'rgb(196, 32, 50)');
    await soft.hover();
    await expect(soft).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.26)');
    await page.mouse.move(0, 0);
    // The same in light.
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await look()).toEqual(film);
  });

  test('the saved summary image is light when it is made in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    // Keeps the image the page hands to the download.
    await page.addInitScript(() => {
      const create = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob: Blob | MediaSource) => {
        (window as unknown as { saved: Blob }).saved = blob as Blob;
        return create(blob);
      };
    });
    await start(page);
    await answer(page, 'Myself');
    await answer(page, 'None of these');
    await answer(page, 'Cough, with or without phlegm');
    await answer(page, 'No');
    await answer(page, "I'm not sure");
    await answer(page, 'None of these');
    await expect(h1(page)).toHaveText('Get tested for TB this week.');
    await expect(page.locator('.patient-card')).toHaveCSS('background-color', 'rgb(24, 33, 38)');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save as image' }).click();
    await download;
    const image = await page.evaluate(async () => {
      const bitmap = await createImageBitmap((window as unknown as { saved: Blob }).saved);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const at = (x: number, y: number) => [...ctx.getImageData(x, y, 1, 1).data];
      const tally = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        tally.set(key, (tally.get(key) ?? 0) + 1);
      }
      return { corner: at(10, 10), frame: at(28, 200), tally: Object.fromEntries(tally) };
    });
    expect(image.corner).toEqual([242, 240, 234, 255]); // paper
    expect(image.frame).toEqual([20, 33, 43, 255]); // the ink frame
    // Paper, ink, muted and the rule, and none of the dark canvas, surface or ink.
    for (const light of ['242,240,234', '20,33,43', '86,98,106', '217,213,203']) expect(image.tally[light], light).toBeGreaterThan(0);
    for (const dark of ['14,20,23', '24,33,38', '231,236,239']) expect(image.tally[dark], dark).toBeUndefined();
  });

  test('the map keeps its tiles, markers and popups as they are', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 }));
    await page.goto('/places');
    await expect(page.locator('.places-toolbar h2')).toHaveText('93 centers');
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).click();
    await expect(page.locator('.map')).toHaveAttribute('data-markers', '93');
    // Tiles: no filter anywhere on the way to them.
    await expect(page.locator('.leaflet-tile').first()).toBeAttached();
    const filters = await page.locator('.leaflet-tile').first().evaluate((tile) => {
      const out: string[] = [];
      for (let el: Element | null = tile; el; el = el.parentElement) out.push(getComputedStyle(el).filter);
      return [...new Set(out)];
    });
    expect(filters).toEqual(['none']);
    // Markers, drawn on Leaflet's canvas: the light Teal with a white edge, never dark Teal.
    const markers = await page.locator('.leaflet-overlay-pane canvas').evaluate((c: HTMLCanvasElement) => {
      const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      const near = (i: number, [r, g, b]: number[]) => data[i + 3] > 200 && Math.abs(data[i] - r) <= 3 && Math.abs(data[i + 1] - g) <= 3 && Math.abs(data[i + 2] - b) <= 3;
      let teal = 0;
      let white = 0;
      let darkTeal = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (near(i, [30, 107, 112])) teal++;
        if (near(i, [255, 255, 255])) white++;
        if (near(i, [34, 119, 124])) darkTeal++;
      }
      return { teal, white, darkTeal };
    });
    expect(markers.teal).toBeGreaterThan(100);
    expect(markers.white).toBeGreaterThan(100);
    expect(markers.darkTeal).toBe(0);
    // A popup's content as placesMap.ts builds it (places.spec.ts): the map's fixed colours.
    await page.evaluate(() => {
      const box = document.createElement('div');
      box.className = 'leaflet-popup-content';
      box.innerHTML = '<a class="map-popup-name" href="#">Name</a><div class="map-popup-address">Address</div>';
      document.querySelector('.leaflet-container')!.append(box);
    });
    await expect(page.locator('.leaflet-popup-content .map-popup-name')).toHaveCSS('color', 'rgb(23, 84, 88)');
    await expect(page.locator('.leaflet-popup-content .map-popup-address')).toHaveCSS('color', 'rgb(20, 33, 43)');

    // Keyboard focus: the zoom buttons, the attribution and the popups stay white, so the ring
    // inside the map is the map's own ink, the light ring's colour (dark mode's --ink is
    // near-white). The map's frame, on the dark page, keeps the page's ring.
    const ring = (target: Locator) =>
      target.evaluate((el) => {
        const cs = getComputedStyle(el);
        return `${el.matches(':focus-visible') ? 'shown' : 'not shown'}: ${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`;
      });
    const mapRing = 'shown: solid 3px rgb(20, 33, 43)';
    await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Map' }).focus();
    for (let i = 0; i < 10 && !(await page.locator('.leaflet-container').evaluate((m) => m === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(page.locator('.leaflet-container')).toBeFocused();
    await expect(page.locator('.map-frame')).toHaveCSS('outline-color', css(DARK.ink));
    // Moving on from keyboard focus keeps the ring showing (forced-colors.spec.ts).
    const inside = [page.locator('.leaflet-control-zoom-in'), page.locator('.leaflet-control-attribution a').first(), page.locator('.leaflet-popup-content .map-popup-name')];
    for (const target of inside) {
      await target.focus();
      expect(await ring(target)).toBe(mapRing);
    }
    await page.emulateMedia({ colorScheme: 'light' });
    expect(await ring(inside[2])).toBe(mapRing);
  });
});

test.describe('charts', () => {
  /**
   * The chart shapes and labels, and the hatch patterns: each fill and stroke comes from a class
   * that reads a token (DataCharts.tsx paint(), data.css), never a colour attribute, and each class
   * computes to its token's current value. Lists what doesn't.
   */
  function audit(page: Page) {
    return page.evaluate(() => {
      const probe = document.createElement('span');
      document.body.append(probe);
      const token = (name: string) => {
        probe.style.color = `var(--${name})`;
        return getComputedStyle(probe).color;
      };
      const problems: string[] = [];
      let painted = 0;
      const shapes = [...document.querySelectorAll('svg.chart-defs :is(rect, line), section.panel svg[role="img"] :is(rect, path, circle, text)')];
      for (const el of shapes) {
        const cs = getComputedStyle(el);
        for (const kind of ['fill', 'stroke'] as const) {
          const attr = el.getAttribute(kind);
          if (attr !== null && attr !== 'none' && !/^url\(#[\w-]+\)$/.test(attr)) problems.push(`${el.localName} ${kind}="${attr}"`);
          const cls = [...el.classList].find((c) => c.startsWith(`${kind}-`));
          if (!cls) continue;
          painted++;
          const want = token(cls.slice(kind.length + 1));
          if (cs[kind] !== want) problems.push(`${el.localName}.${cls} is ${cs[kind]}, not ${want}`);
        }
        // Neither would leave SVG's default fill, black.
        if (el.localName !== 'line' && el.getAttribute('fill') === null && ![...el.classList].some((c) => c.startsWith('fill-'))) problems.push(`${el.localName} has no fill`);
      }
      probe.remove();
      return { shapes: shapes.length, painted, problems: [...new Set(problems)] };
    });
  }

  test('take every colour from the tokens, hatches included, and follow the scheme without a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/data');
    await page.locator('#d1').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    const SURFACE = { light: [255, 255, 255], dark: [24, 33, 38] } satisfies Record<string, Rgb>;
    for (const scheme of ['dark', 'light'] as const) {
      const T = scheme === 'dark' ? DARK : LIGHT;
      await page.emulateMedia({ colorScheme: scheme });
      const { shapes, painted, problems } = await audit(page);
      expect(problems, scheme).toEqual([]);
      expect(shapes, scheme).toBeGreaterThan(400);
      expect(painted, scheme).toBeGreaterThan(400);
      // d1's labels in ink; the hatch: the panel colour, with lines in Dot.
      const seen = await page.evaluate(() => {
        const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
        return [style('#d1 svg[role="img"] text.fill-ink').fill, style('#dhatch rect').fill, style('#dhatch line').stroke];
      });
      expect(seen, scheme).toEqual([css(T.ink), css(SURFACE[scheme]), css(T.dot)]);
    }
  });
});

/** WCAG 2.2 AA rules, as axe tags them (qa.spec.ts). */
async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(', ')}`);
}

test.describe('axe in dark mode (WCAG 2.2 AA)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'axe reads the DOM: one engine is enough');
  test.use({ colorScheme: 'dark' });

  // qa.spec.ts's pages: a place with a route stop, and the 404 page; and the offline page.
  const PAGES = ['/', '/places', '/place/bangued-rural-health-unit-abra?stop=2&need=all&near=Bangued', '/check', '/learn', '/data', '/about', '/no-such-page', '/install', '/offline'];
  for (const lang of ['en', 'fil'] as const) {
    for (const base of PAGES) {
      const path = lang === 'fil' ? fil(base) : base;
      test.describe(path, () => {
        if (base === '/no-such-page') test.use({ expectedErrors: [/status of 404/] });
        for (const width of [390, 1280]) {
          test(`at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 820 });
            await page.goto(path, { waitUntil: 'networkidle' });
            expect(await axe(page)).toEqual([]);
          });
        }
      });
    }
  }

  test('Home with a route', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('#from').fill('Quezon City');
    await page.getByRole('button', { name: 'Show me where to go' }).click();
    await expect(page.locator('.results h2')).toBeFocused();
    expect(await axe(page)).toEqual([]);
  });

  test('Places with the filters sheet open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/places', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('Check: a question, the urgent screen and a result', async ({ page }) => {
    await page.goto('/check', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('main h1')).toBeFocused();
    expect(await axe(page)).toEqual([]);
    await page.locator('.check-choice', { hasText: /^Myself/ }).click();
    await page.locator('.next-bar button').click();
    await page.locator('.check-choice', { hasText: /^Severe difficulty breathing/ }).click();
    await page.locator('.next-bar button').click();
    await expect(page.locator('main h1')).toHaveText('Get emergency care now.');
    expect(await axe(page)).toEqual([]);
    await page.getByRole('button', { name: 'Back' }).click();
    await page.locator('.check-choice', { hasText: /^None of these/ }).click();
    await page.locator('.next-bar button').click();
    for (const label of [/^Cough, with or without phlegm/, /^No$/, /^I'm not sure/, /^None of these/]) {
      await page.locator('.check-choice', { hasText: label }).first().click();
      await page.locator('.next-bar button').click();
    }
    await expect(page.locator('main h1')).toHaveText('Get tested for TB this week.');
    expect(await axe(page)).toEqual([]);
  });

  test('Data, a chart table open', async ({ page }) => {
    await page.goto('/data', { waitUntil: 'networkidle' });
    await page.locator('#d1').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has(section.panel)')).not.toHaveAttribute('ssr');
    const toggle = page.locator('#d1 button[aria-expanded]');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await axe(page)).toEqual([]);
  });
});
