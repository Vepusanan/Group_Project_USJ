import { test, expect } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";

test.describe("Pitch deck viewer", () => {
  test.use({ storageState: "e2e/.auth/investor.json" });

  test("investor can open a startup pitch deck", async ({ page }) => {
    const fixtures = loadFixtures();
    const startupProfileId = fixtures.users.startup.profileId;

    await page.goto(`/startups/${startupProfileId}/pitch-deck`);

    await expect(page.getByText(/secure viewer/i)).toBeVisible({
      timeout: 30000,
    });
    await expect(
      page.getByRole("button", { name: /analyse with ai/i }),
    ).toBeVisible();
  });
});

