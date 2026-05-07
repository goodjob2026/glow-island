import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../.allforai/bootstrap/e2e-html-report' }],
    ['json', { outputFile: '../.allforai/bootstrap/e2e-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'on',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // WebGL server must be started externally before running tests:
  //   npx serve game-client/dist/webgl -p 8080
  webServer: undefined,
})
