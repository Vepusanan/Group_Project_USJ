import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  globalSetup: "./global-setup.mjs",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(process.env.SKIP_E2E_WEBSERVER
    ? {}
    : {
        webServer: [
          {
            command: "npm run dev --workspace=server",
            url: "http://localhost:5001/api/health",
            reuseExistingServer: true,
            timeout: 120_000,
          },
          {
            command: "npx vite --port 3000 --host",
            cwd: "client",
            url: "http://localhost:3000",
            reuseExistingServer: true,
            timeout: 120_000,
          },
        ],
      }),
});
