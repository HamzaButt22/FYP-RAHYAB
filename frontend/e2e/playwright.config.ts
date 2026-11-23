// Browser tests for the parts of Rahyaab that run in a browser (README.md in this folder):
// the family report page served by the API (/p/<token>) and the staff dashboard (Vite dev server on :5173).
// Needs the local Docker stack (python tools/dev.py up). global-setup.ts loads fresh synthetic data each run.
import { defineConfig, devices } from '@playwright/test';

const DASHBOARD = process.env.E2E_DASHBOARD_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  // One worker: the parent page is rate limited per address (30 a minute) and the teacher signs in once.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'pnpm --dir ../dashboard exec vite --port 5173 --strictPort',
    url: DASHBOARD,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
