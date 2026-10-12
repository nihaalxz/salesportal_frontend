import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration with two explicit test projects:
 *
 * 1. `mocked` — Contract-mocked browser tests.
 *    - API responses are intercepted via page.route() so tests pass without a running backend.
 *    - Tests the UI rendering, navigation, state management, and error handling.
 *    - Command: npm run test:e2e:mocked
 *    - Requires: SvelteKit dev server (npm run dev) on port 5173.
 *
 * 2. `real-backend` — Real-backend browser tests.
 *    - No API interception. Connects to the actual ASP.NET Core API.
 *    - Tests the full browser-to-database path.
 *    - Command: npm run test:e2e:real
 *    - Requires: SvelteKit dev server on 5173 AND ASP.NET Core API on 7272 (HTTPS).
 *    - Requires: SQL Server database with deterministic test data seeded.
 *    - If backend is unreachable, tests fail with clear setup messages (not silent skips).
 */
export default defineConfig({
  // Default settings shared by both projects
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  // SvelteKit dev server — required by both projects
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    // Allow SvelteKit SSR to call https://localhost:7272 (dev self-signed cert)
    env: {
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    }
  },

  projects: [
    // -----------------------------------------------------------------------
    // Project 1: Mocked — uses page.route() to intercept Sales API responses.
    // Safe to run offline, without a backend.
    // -----------------------------------------------------------------------
    {
      name: 'mocked',
      testDir: 'tests/mocked',
      testMatch: /(.+\.)?(test|spec)\.[jt]s/,
      use: {
        ...devices['Desktop Chrome'],
        // No backend API server needed for mocked tests
      },
    },

    // -----------------------------------------------------------------------
    // Project 2: real-backend — no route interception allowed.
    // Connects to real ASP.NET Core API + SQL Server.
    // -----------------------------------------------------------------------
    {
      name: 'real-backend',
      testDir: 'tests/real-backend',
      testMatch: /(.+\.)?(test|spec)\.[jt]s/,
      use: {
        ...devices['Desktop Chrome'],
        // Increase timeout for real network calls + DB queries
        actionTimeout: 15_000,
        navigationTimeout: 20_000,
      },
    },
  ],
});
