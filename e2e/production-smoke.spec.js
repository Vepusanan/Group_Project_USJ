import { test, expect } from "@playwright/test";
import {
  assertAppMounted,
  assertRuntimeGuards,
  installRuntimeGuards,
} from "./helpers/runtimeGuards.mjs";

test.beforeEach(async ({ page }) => {
  installRuntimeGuards(page);

  // Static preview has no Express API — mock auth probe so smoke tests isolate
  // frontend startup (ReferenceError, blank #root) from backend availability.
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Not authenticated",
          authState: { status: "UNAUTHENTICATED" },
        }),
      });
    }
    if (path === "/api/auth/token") {
      return route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false }),
      });
    }
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "Not found" }),
    });
  });
});

test.afterEach(async ({ page }) => {
  await assertRuntimeGuards(page);
});

test.describe("Production build smoke", () => {
  test("homepage mounts with critical content", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    await expect(
      page.getByRole("heading", { name: /scale your vision/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    await expect(
      page.getByRole("button", { name: /sign in to starthub/i }),
    ).toBeVisible();
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });

  test("email verification page renders", async ({ page }) => {
    await page.goto("/verify-email", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    await expect(
      page.getByRole("heading", { name: /verify your email address/i }),
    ).toBeVisible();
  });

  test("onboarding route resolves without runtime errors", async ({ page }) => {
    await page.goto("/onboarding", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    // Unauthenticated users are redirected to login; authenticated incomplete users see onboarding.
    await expect(page).toHaveURL(/\/(login|onboarding)/);
  });

  test("investor onboarding route resolves without runtime errors", async ({
    page,
  }) => {
    await page.goto("/investor-onboarding", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    await expect(page).toHaveURL(/\/(login|investor-onboarding)/);
  });

  test("dashboard route resolves without runtime errors", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await assertAppMounted(page);
    await expect(page).not.toHaveURL(/^about:blank/);
    // Anonymous → login; authed users land on role home.
    await expect(page).toHaveURL(/\/(login|startups|investors|dashboard|onboarding)/);
  });
});
