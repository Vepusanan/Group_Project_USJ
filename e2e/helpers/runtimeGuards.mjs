/**
 * Fail tests on browser runtime failures that cause blank screens in production.
 */

const CONSOLE_ERROR_ALLOWLIST = [
  /favicon\.ico/i,
  /Failed to load resource.*favicon/i,
  /AbortError/i,
];

/** Application-thrown errors that must fail smoke tests. */
const CONSOLE_ERROR_DENYLIST = [
  /is not defined/i,
  /ReferenceError/i,
  /TypeError/i,
  /SyntaxError/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
];

function isAllowedConsoleError(text) {
  return CONSOLE_ERROR_ALLOWLIST.some((pattern) => pattern.test(text));
}

/**
 * Attach strict runtime guards to a Playwright page.
 * @param {import('@playwright/test').Page} page
 * @param {{ label?: string }} [options]
 */
export function installRuntimeGuards(page, { label = "page" } = {}) {
  const failures = [];

  page.on("pageerror", (error) => {
    failures.push(`[${label}] pageerror: ${error.message}`);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isAllowedConsoleError(text)) return;
    const isAppCrash = CONSOLE_ERROR_DENYLIST.some((pattern) =>
      pattern.test(text),
    );
    const isNetworkNoise = /Failed to load resource/i.test(text);
    if (!isAppCrash && isNetworkNoise) return;
    failures.push(`[${label}] console.error: ${text}`);
  });

  page.on("crash", () => {
    failures.push(`[${label}] browser tab crashed`);
  });

  page._runtimeGuardFailures = failures;

  page.evaluate(() => {
    window.addEventListener("unhandledrejection", (event) => {
      window.__playwrightUnhandledRejections =
        window.__playwrightUnhandledRejections || [];
      const reason =
        event.reason?.message || event.reason?.toString?.() || String(event.reason);
      window.__playwrightUnhandledRejections.push(reason);
    });
  }).catch(() => undefined);
}

export async function assertRuntimeGuards(page) {
  const rejections = await page
    .evaluate(() => window.__playwrightUnhandledRejections || [])
    .catch(() => []);

  const failures = [...(page._runtimeGuardFailures || [])];
  for (const reason of rejections) {
    if (!isAllowedConsoleError(reason)) {
      failures.push(`unhandledrejection: ${reason}`);
    }
  }

  if (failures.length) {
    throw new Error(`Runtime guard failures:\n${failures.join("\n")}`);
  }
}

/**
 * Assert the SPA mounted (no blank white screen).
 * @param {import('@playwright/test').Page} page
 */
export async function assertAppMounted(page) {
  const root = page.locator("#root");
  await root.waitFor({ state: "attached", timeout: 15_000 });

  await page.waitForFunction(
    () => {
      const el = document.getElementById("root");
      return el && el.innerHTML.trim().length > 50;
    },
    { timeout: 20_000 },
  );

  const text = (await page.locator("body").innerText()).trim();
  if (text.length < 10) {
    throw new Error("#root attached but body text is empty — blank screen");
  }
}
