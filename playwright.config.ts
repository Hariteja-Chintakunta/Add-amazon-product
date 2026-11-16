import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env so PRODUCT_NAME and other settings are available to the config.
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  // Amazon can be slow; give each test up to 2 minutes.
  timeout: 120 * 1000,
  expect: { timeout: 15 * 1000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // One retry locally (Amazon is flaky), two on CI.
  retries: process.env.CI ? 2 : 1,
  // A single shopping flow — run one worker only.
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.amazon.in',
    // Set HEADLESS=false in .env to watch the browser.
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1366, height: 768 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    // A realistic desktop Chrome user agent reduces bot-check friction.
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20 * 1000,
    navigationTimeout: 60 * 1000,
    // Optional: reuse a storage state saved after a manual sign-in.
    // Set AUTH_STATE_PATH in .env (e.g. auth.json). Leave empty to run signed-out;
    // the framework stops gracefully if Amazon asks for sign-in.
    ...(process.env.AUTH_STATE_PATH ? { storageState: process.env.AUTH_STATE_PATH } : {}),
  },
  projects: [{ name: 'chromium', use: {} }],
});
