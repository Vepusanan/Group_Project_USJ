import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";

test.describe("Messaging", () => {
  test.describe("as startup", () => {
    test.use({ storageState: "e2e/.auth/startup.json" });

    test("connected startup can send a message to investor", async ({ page }) => {
      const fixtures = loadFixtures();
      const uniqueText = `E2E message ${Date.now()}`;

      await page.goto("/connections");
      await page.locator("button.font-label", { hasText: /^CONNECTED/i }).click();
      await page.getByRole("button", { name: "Message" }).first().click();

      await expect(page.getByRole("heading", { name: /messages/i })).toBeVisible();
      await page.getByPlaceholder("Type a message…").fill(uniqueText);
      await page.locator('form button[type="submit"]').click();

      await expect(page.getByText(uniqueText)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe("as investor", () => {
    test.use({ storageState: "e2e/.auth/investor.json" });

    test("investor sees conversation with connected startup", async ({ page }) => {
      const fixtures = loadFixtures();

      await page.goto("/messages");
      await expect(
        page.getByText(fixtures.users.startup.full_name).first(),
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
