import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/docker',
  outputDir: 'test-results-docker',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-docker', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4100',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
