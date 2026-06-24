import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";

test.describe("Startup comparison", () => {
  test.use({ storageState: "e2e/.auth/investor.json" });

  test("investor can select startups and open comparison", async ({ page }) => {
    loadFixtures();

    await page.goto("/startups");
    await expect(
      page.getByRole("heading", { name: /discover the next/i }),
    ).toBeVisible();

    const firstCard = page.locator('[class*="cursor-pointer"]').filter({
      has: page.locator('label:has-text("Compare") input[type="checkbox"]').first(),
    }).first();
    const pickedName = await firstCard.locator("h3").first().innerText();

    // Select one startup for compare and open the compare page.
    const firstCompareCheckbox = firstCard.locator(
      'label:has-text("Compare") input[type="checkbox"]',
    );
    await expect(firstCompareCheckbox).toBeVisible();
    await firstCompareCheckbox.check();

    await page.getByRole("button", { name: /compare 1 startup/i }).click();
    await expect(page).toHaveURL(/\/compare\?ids=/);
    await expect(
      page.getByRole("heading", { name: /startup comparison/i }),
    ).toBeVisible();

    await expect(page.getByText(pickedName)).toBeVisible({
      timeout: 15000,
    });
  });
});

