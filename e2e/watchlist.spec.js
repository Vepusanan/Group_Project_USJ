import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";

test.describe("Watchlist", () => {
  test.use({ storageState: "e2e/.auth/investor.json" });

  test("investor can add and remove a startup from watchlist", async ({ page }) => {
    loadFixtures();

    await page.goto("/startups");
    await expect(
      page.getByRole("heading", { name: /discover the next/i }),
    ).toBeVisible({ timeout: 20000 });

    const firstWatchlistButton = page
      .getByRole("button", { name: /^watchlist$|^saved$/i })
      .first();
    await expect(firstWatchlistButton).toBeVisible();
    await firstWatchlistButton.click();
    await expect(firstWatchlistButton).toHaveText(/saved/i, { timeout: 15000 });

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { name: "Watchlist" })).toBeVisible();

    await expect(page.getByRole("button", { name: /remove/i }).first()).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /remove/i }).first().click();

    await expect(page.getByText(/no saved startups/i)).toBeVisible({
      timeout: 15000,
    });
  });
});

