import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";
import { loginViaUi } from "./helpers/auth.mjs";

test.describe("Authentication", () => {
  test("rejects invalid credentials", async ({ page }) => {
    await loginViaUi(page, {
      email: "not-a-real-user@test.com",
      password: "WrongPass123!",
    });

    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    await expect(
      page.getByText(/invalid email or password|login failed/i),
    ).toBeVisible({ timeout: 15000 });
  });

  test.describe("authenticated startup", () => {
    test.use({ storageState: "e2e/.auth/startup.json" });

    test("startup can reach discovery workspace", async ({ page }) => {
      loadFixtures();
      await page.goto("/startups");
      await expect(
        page.getByRole("heading", { name: /discover the next/i }),
      ).toBeVisible({ timeout: 20000 });
    });

    test("session persists after page reload", async ({ page }) => {
      loadFixtures();
      await page.goto("/connections");
      await page.reload();
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /network connections/i }),
      ).toBeVisible();
    });
  });

  test.describe("authenticated investor", () => {
    test.use({ storageState: "e2e/.auth/investor.json" });

    test("investor can reach investor workspace", async ({ page }) => {
      loadFixtures();
      await page.goto("/investors");
      await expect(
        page.getByRole("heading", { name: /discover your next/i }),
      ).toBeVisible({ timeout: 20000 });
    });
  });
});
