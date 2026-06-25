import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const ENV_KEYS = [
  "NODE_ENV",
  "VERCEL",
  "FRONTEND_URL",
  "BASE_URL",
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

test("getFrontendBaseUrl uses FRONTEND_URL in production", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    process.env.FRONTEND_URL = "https://app.example.com";
    delete process.env.VERCEL;

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.equal(getFrontendBaseUrl(), "https://app.example.com");
  } finally {
    restoreEnv(saved);
  }
});

test("getFrontendBaseUrl throws when FRONTEND_URL missing in production", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    delete process.env.FRONTEND_URL;
    delete process.env.BASE_URL;

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.throws(
      () => getFrontendBaseUrl(),
      /FRONTEND_URL is required in production/,
    );
  } finally {
    restoreEnv(saved);
  }
});

test("getFrontendBaseUrl throws when FRONTEND_URL is localhost in production", async () => {
  const saved = snapshotEnv();
  try {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    process.env.FRONTEND_URL = "http://localhost:3000";

    const { getFrontendBaseUrl } = await loadAppUrls();
    assert.throws(
      () => getFrontendBaseUrl(),
      /cannot be localhost in production/,
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
    delete process.env.VERCEL;

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
    assert.equal(url, "https://app.example.com/verify-email?token=abc123");
    assert.ok(!url.includes("localhost"));
  } finally {
    restoreEnv(saved);
  }
});
