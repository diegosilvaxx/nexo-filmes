import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/vercel',
  globalSetup: './tests/vercel/global-setup.ts',
  outputDir: 'test-results-vercel',
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-vercel', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4500',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
