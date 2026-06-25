import { defineConfig, devices } from "@playwright/test";

const previewPort = process.env.SMOKE_PREVIEW_PORT || "4173";
const previewHost = process.env.SMOKE_PREVIEW_HOST || "127.0.0.1";
const previewUrl = `http://${previewHost}:${previewPort}`;

export default defineConfig({
  testDir: ".",
  testMatch: "production-smoke.spec.js",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || previewUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite preview --port ${previewPort} --host ${previewHost}`,
    cwd: "client",
    url: previewUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
