import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // RoutePilot uses a shared SQLite database.
  // Run database-mutating E2E tests sequentially.
  fullyParallel: false,
  workers: 1,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});