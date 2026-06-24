import { seedE2eFixtures } from "../server/scripts/seed-e2e-fixtures.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { loadFixtures } from "./helpers/fixtures.mjs";

export default async function globalSetup() {
  await seedE2eFixtures();

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const authDir = path.join(__dirname, ".auth");
  fs.mkdirSync(authDir, { recursive: true });

  const fixtures = loadFixtures();
  const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

  const browser = await chromium.launch();
  const makeState = async (key, user) => {
    const context = await browser.newContext({ baseURL });
    await context.addCookies([
      {
        name: "access_token",
        value: user.auth.access_token,
        url: baseURL,
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
      },
      {
        name: "refresh_token",
        value: user.auth.refresh_token,
        url: baseURL,
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
      },
    ]);
    await context.storageState({ path: path.join(authDir, `${key}.json`) });
    await context.close();
  };

  await makeState("startup", fixtures.users.startup);
  await makeState("investor", fixtures.users.investor);
  await makeState("startupPending", fixtures.users.startupPending);

  await browser.close();
}
