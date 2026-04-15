import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for Waya E2E tests.
 *
 * These tests boot the Vite dev server and use network interception to mock
 * Supabase edge function responses. That way the suite runs without requiring
 * a real Supabase project, env vars, or network access — which keeps CI fast
 * and deterministic.
 *
 * To run: `npm run test:e2e`
 * To debug interactively: `npm run test:e2e -- --ui`
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // Dummy envs so src/lib/supabase.ts doesn't log. Network is mocked per-test.
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
