import { test } from "node:test";
import assert from "node:assert/strict";

test("getCorsOrigins merges FRONTEND_URL and Vercel deployment URLs", async () => {
  const previous = {
    FRONTEND_URL: process.env.FRONTEND_URL,
    BASE_URL: process.env.BASE_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  };

  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.BASE_URL = "https://group-project-usj-client.vercel.app";
  process.env.VERCEL_URL = "group-project-usj-client-abc123.vercel.app";

  const { getCorsOrigins } = await import("../utils/corsOrigins.js");
  const origins = getCorsOrigins();

  assert.ok(origins.includes("http://localhost:3000"));
  assert.ok(origins.includes("https://group-project-usj-client.vercel.app"));
  assert.ok(
    origins.includes("https://group-project-usj-client-abc123.vercel.app"),
  );

  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
