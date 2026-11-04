// Every test page is watched for CSP violations, console errors and uncaught exceptions,
// so the real policy (on since step 1) is exercised by every test (PLAN §5, step 2).
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ expectedErrors: RegExp[]; pageProblems: string[] }>({
  /** Console errors a test expects, e.g. the browser's note about a 404 response. */
  expectedErrors: [[], { option: true }],
  pageProblems: [
    async ({ page, expectedErrors }, use) => {
      const problems: string[] = [];
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          console.error(`CSP violation: ${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`);
        });
      });
      page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        if (!expectedErrors.some((pattern) => pattern.test(text))) problems.push(`console: ${text}`);
      });
      page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
      await use(problems);
      expect(problems, 'CSP violations, console errors or uncaught exceptions').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
