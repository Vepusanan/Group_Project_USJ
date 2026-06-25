import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const ENV_KEYS = [
  "NODE_ENV",
  "FRONTEND_URL",
  "CLIENT_URL",
  "APP_URL",
  "BASE_URL",
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
];

function snapshotEnv() {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot) {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
}

async function loadAppUrls() {
  return import(`../utils/appUrls.js?test=${Date.now()}`);
}

test("getFrontendBaseUrl prefers FRONTEND_URL in production", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_URL = "https://app.example.com";
    process.env.BASE_URL = "https://other.example.com";
    delete process.env.VERCEL_URL;

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.equal(getFrontendBaseUrl(), "https://app.example.com");
  } finally {
    restoreEnv(saved);
  }
});

test("getFrontendBaseUrl uses VERCEL_URL in production when explicit URL is unset", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    delete process.env.FRONTEND_URL;
    delete process.env.BASE_URL;
    process.env.VERCEL_URL = "group-project-usj-client.vercel.app";

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.equal(
      getFrontendBaseUrl(),
      "https://group-project-usj-client.vercel.app",
    );
  } finally {
    restoreEnv(saved);
  }
});

test("getFrontendBaseUrl never returns localhost in production", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    delete process.env.FRONTEND_URL;
    delete process.env.BASE_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.throws(
      () => getFrontendBaseUrl(),
      /App URL not configured for production/,
    );
  } finally {
    restoreEnv(saved);
  }
});

test("getFrontendBaseUrl defaults to localhost in development", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "development";
    delete process.env.FRONTEND_URL;
    delete process.env.BASE_URL;

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.equal(getFrontendBaseUrl(), "http://localhost:3000");
  } finally {
    restoreEnv(saved);
  }
});

test("buildVerifyEmailCallbackUrl uses production frontend origin", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_URL = "https://app.example.com";

    const { buildVerifyEmailCallbackUrl } = await loadAppUrls();
    const url = buildVerifyEmailCallbackUrl("abc123");
    assert.equal(
      url,
      "https://app.example.com/verify-email?token=abc123",
    );
    assert.ok(!url.includes("localhost"));
  } finally {
    restoreEnv(saved);
  }
});
