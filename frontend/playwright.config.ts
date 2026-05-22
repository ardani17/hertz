import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.REVIEW_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'https://horizon.cloudnexify.com');

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL,
    colorScheme: 'dark',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { browserName: 'chromium' } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 5'] } },
  ],
});
