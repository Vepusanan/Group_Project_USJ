import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";

const connectedTab = (page) =>
  page.locator("button.font-label", { hasText: /^CONNECTED/i });

test.describe("Connections", () => {
  test.describe("as startup", () => {
    test.use({ storageState: "e2e/.auth/startup.json" });

    test("startup sees accepted investor connection", async ({ page }) => {
      const fixtures = loadFixtures();

      await page.goto("/connections");
      await expect(
        page.getByRole("heading", { name: /network connections/i }),
      ).toBeVisible();
      await connectedTab(page).click();
      await expect(page.getByText(fixtures.users.investor.full_name)).toBeVisible();
    });
  });

  test.describe("as investor", () => {
    test.use({ storageState: "e2e/.auth/investor.json" });

    test("investor sees accepted startup connection", async ({ page }) => {
      const fixtures = loadFixtures();

      await page.goto("/connections");
      await connectedTab(page).click();
      await expect(page.getByText(fixtures.users.startup.full_name)).toBeVisible();
    });
  });

  test.describe("as pending startup", () => {
    test.use({ storageState: "e2e/.auth/startupPending.json" });

    test("startup can accept a pending connection request", async ({ page }) => {
      const fixtures = loadFixtures();

      await page.goto("/connections");
      await page.locator("button.font-label", { hasText: /^RECEIVED/i }).click();
      await expect(page.getByText(fixtures.users.investor.full_name)).toBeVisible();

      await page.getByRole("button", { name: "Accept" }).click();
      await connectedTab(page).click();
      await expect(page.getByText(fixtures.users.investor.full_name)).toBeVisible();
    });
  });
});
