export async function loginViaUi(page, { email, password }) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign In to StartHub" }).click();
}

export async function waitForAuthenticatedShell(page) {
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30000,
  });
  await page.waitForLoadState("domcontentloaded");
}

export async function logoutViaUi(page) {
  await page.goto("/settings");
  const logoutButton = page.getByRole("button", { name: /log out|sign out/i });
  if (await logoutButton.count()) {
    await logoutButton.first().click();
  }
}
