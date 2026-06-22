import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for docs-bot capture tests.
 * The base URL is read from the env var used by the bot config (SURF_CONSOLE_URL),
 * falling back to the local dev default.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: process.env['SURF_CONSOLE_URL'] ?? 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
