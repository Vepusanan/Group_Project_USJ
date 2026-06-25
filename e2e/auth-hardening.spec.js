import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";
import { loginViaUi } from "./helpers/auth.mjs";

test.describe("Auth hardening", () => {
  test("protected route shows spinner then resolves (no login flash)", async ({
    page,
  }) => {
    await page.goto("/connections");
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test.describe("incomplete onboarding", () => {
    test.use({ storageState: "e2e/.auth/startupPending.json" });

    test("blocks access to connections until onboarding complete", async ({
      page,
    }) => {
      loadFixtures();
      await page.goto("/connections");
      await expect(page).toHaveURL(/\/onboarding/, { timeout: 20000 });
    });

    test("session persists after refresh while onboarding incomplete", async ({
      page,
    }) => {
      loadFixtures();
      await page.goto("/onboarding");
      await expect(page).toHaveURL(/\/onboarding/);
      await page.reload();
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page).toHaveURL(/\/onboarding/);
    });
  });

  test.describe("authenticated startup", () => {
    test.use({ storageState: "e2e/.auth/startup.json" });

    test("multi-tab login sync via storage event", async ({ browser }) => {
      loadFixtures();
      const fixtures = loadFixtures();
      const email = fixtures.users.startup.email;
      const password = fixtures.password;

      const context = await browser.newContext();
      const tabA = await context.newPage();
      const tabB = await context.newPage();

      await tabA.goto("/login");
      await tabB.goto("/login");

      await loginViaUi(tabA, { email, password });
      await expect(tabA).not.toHaveURL(/\/login/, { timeout: 30000 });

      await tabB.goto("/connections");
      await expect(tabB).not.toHaveURL(/\/login/, { timeout: 30000 });

      await context.close();
    });
  });
});
