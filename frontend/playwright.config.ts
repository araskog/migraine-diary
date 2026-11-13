import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  forbidOnly: !!process.env.CI,
  workers: 1,
  globalTimeout: 120_000,
  timeout: 20_000,
  use: {
    baseURL: 'http://127.0.0.1:5190/static/app/',
    browserName: 'chromium',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5190',
    url: 'http://127.0.0.1:5190/static/app/tests/diary-interactions.html',
    reuseExistingServer: false,
  },
})
