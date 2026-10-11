import { defineConfig, devices } from "@playwright/test"

/**
 * End-to-end tests. They expect the backend on NEXT_PUBLIC_API_URL (default http://localhost:8000)
 * running with LLM_FAKE_RESPONSES=true (deterministic AI replies) and a migrated database.
 * The frontend is started by Playwright unless E2E_BASE_URL points at a running one.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // PW_CHANNEL=chrome uses the locally installed Chrome instead of Playwright's Chromium.
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL || undefined },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start -- -p 3000",
        url: "http://localhost:3000/login",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
