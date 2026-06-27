import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import { loadFixtures } from "./helpers/fixtures.mjs";
import { loginViaUi } from "./helpers/auth.mjs";
import { AUTH_STATUS } from "../shared/authStateMachine.mjs";

async function fetchAuthMe(page) {
  return page.evaluate(async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const data = await res.json();
    return { status: res.status, data };
  });
}

async function registerUser(page, { email, password, userType = "startup" }) {
  return page.evaluate(
    async ({ email, password, userType }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          fullName: "E2E State User",
          userType,
          agreedToTerms: true,
        }),
      });
      const data = await res.json();
      return { status: res.status, data };
    },
    { email, password, userType },
  );
}

test.describe("Auth state machine (E2E)", () => {
  test("signup → EMAIL_UNVERIFIED via /auth/me", async ({ page }) => {
    const email = `e2e_state_${crypto.randomBytes(4).toString("hex")}@test.com`;
    const password = "E2eStateTest123!";

    const register = await registerUser(page, { email, password });
    expect(register.status).toBe(201);
    expect(register.data.authState.status).toBe(AUTH_STATUS.EMAIL_UNVERIFIED);

    const me = await fetchAuthMe(page);
    expect(me.status).toBe(200);
    expect(me.data.authState.status).toBe(AUTH_STATUS.EMAIL_UNVERIFIED);
  });

  test.describe("verified startup", () => {
    test.use({ storageState: "e2e/.auth/startup.json" });

    test("session is AUTHENTICATED_READY after onboarding", async ({ page }) => {
      loadFixtures();
      await page.goto("/connections");
      const me = await fetchAuthMe(page);
      expect(me.status).toBe(200);
      expect(me.data.authState.status).toBe(AUTH_STATUS.AUTHENTICATED_READY);
      expect(me.data.authState.onboardingCompletedAt).toBeTruthy();
    });

    test("refresh preserves AUTHENTICATED_READY", async ({ page }) => {
      loadFixtures();
      await page.goto("/connections");
      await page.reload();
      const me = await fetchAuthMe(page);
      expect(me.data.authState.status).toBe(AUTH_STATUS.AUTHENTICATED_READY);
    });
  });

  test.describe("incomplete onboarding", () => {
    test.use({ storageState: "e2e/.auth/startupPending.json" });

    test("session is ONBOARDING_REQUIRED", async ({ page }) => {
      loadFixtures();
      await page.goto("/onboarding");
      const me = await fetchAuthMe(page);
      expect(me.data.authState.status).toBe(AUTH_STATUS.ONBOARDING_REQUIRED);
      expect(me.data.authState.onboardingCompletedAt).toBeNull();
    });

    test("refresh preserves ONBOARDING_REQUIRED", async ({ page }) => {
      loadFixtures();
      await page.goto("/onboarding");
      await page.reload();
      const me = await fetchAuthMe(page);
      expect(me.data.authState.status).toBe(AUTH_STATUS.ONBOARDING_REQUIRED);
      await expect(page).toHaveURL(/\/onboarding/);
    });
  });

  test.describe("multi-tab sync", () => {
    test.use({ storageState: "e2e/.auth/startup.json" });

    test("logout in one tab clears auth state in another", async ({ browser }) => {
      loadFixtures();
      const context = await browser.newContext({
        storageState: "e2e/.auth/startup.json",
      });
      const tabA = await context.newPage();
      const tabB = await context.newPage();

      await tabA.goto("/connections");
      await tabB.goto("/connections");

      await tabA.evaluate(async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        localStorage.setItem("auth:revision", String(Date.now()));
        new BroadcastChannel("startupconnect-auth-sync").postMessage({
          type: "auth-changed",
        });
      });

      await tabB.goto("/connections");
      await expect(tabB).toHaveURL(/\/login/, { timeout: 20000 });

      await context.close();
    });
  });

  test("token expiry triggers revalidation path", async ({ page, context }) => {
    loadFixtures();
    await context.clearCookies();
    await page.goto("/login");
    const fixtures = loadFixtures();
    await loginViaUi(page, {
      email: fixtures.users.startup.email,
      password: fixtures.password,
    });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
    const me = await fetchAuthMe(page);
    expect(me.data.authState.status).toBe(AUTH_STATUS.AUTHENTICATED_READY);
  });
});
