import { defineConfig, devices } from '@playwright/test';

// Browser tests run against a built dist/ (run `npm run build` first), served the way the
// host serves it. On the 8 GB Mac run one project per guarded job (PLAN §5): chromium,
// webkit, pwa (the service worker's own project, step 11), iphone and pixel (the @phone
// smoke set); no-check runs through `npm run test:no-check`, which builds without Check:
//   GUARD_NO_DOCKER=1 _handoff/lowmem-run.sh bash -c '. ~/.nvm/nvm.sh && nvm use >/dev/null && npm run test:e2e -- --project=chromium'
const port = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: Number(process.env.E2E_WORKERS ?? 1),
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    // The service worker has its own project (pwa); elsewhere it would serve saved pages.
    serviceWorkers: 'block',
    // Never the machine's real location: a fixed synthetic point, and no permission
    // unless a test grants it.
    geolocation: { latitude: 14.6, longitude: 121.0 },
    permissions: [],
    locale: 'en-PH',
    timezoneId: 'Asia/Manila',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /(pwa|no-check|phone)\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: /(pwa|no-check|phone)\.spec\.ts/ },
    { name: 'pwa', use: { ...devices['Desktop Chrome'], serviceWorkers: 'allow' }, testMatch: /pwa\.spec\.ts/ },
    // Against a build without Check (Q9): run through `npm run test:no-check`, which builds it.
    { name: 'no-check', use: { ...devices['Desktop Chrome'] }, testMatch: /no-check\.spec\.ts/ },
    // Real phone settings (user agent, touch, screen) on the @phone smoke set (audit B42).
    { name: 'iphone', use: { ...devices['iPhone 13'] }, grep: /@phone/, testIgnore: /(pwa|no-check)\.spec\.ts/ },
    { name: 'pixel', use: { ...devices['Pixel 7'] }, grep: /@phone/, testIgnore: /(pwa|no-check)\.spec\.ts/ },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs --port ${port}`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
});
