import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";
import { AUTH_STATUS } from "../../shared/authStateMachine.mjs";
import {
  createStartupProfile,
  markUserOnboardingComplete,
  markStartupProfileFieldsComplete,
} from "./helpers/securityTestHarness.js";

function randomEmail(prefix = "onboard-route") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@test.com`;
}

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

function parseCookies(setCookieHeader) {
  if (!setCookieHeader) return "";
  const parts = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  return parts.map((c) => c.split(";")[0]).join("; ");
}

async function cleanupUser(userId) {
  if (!userId) return;
  await pool
    .query("DELETE FROM public.startup_profiles WHERE user_id = $1", [userId])
    .catch(() => undefined);
  await pool
    .query("DELETE FROM public.sessions WHERE user_id = $1", [userId])
    .catch(() => undefined);
  await pool.query("DELETE FROM public.users WHERE id = $1", [userId]).catch(() => undefined);
}

test("verified user with partial profile but no onboarding timestamp is ONBOARDING_REQUIRED", async () => {
  const email = randomEmail("partial");
  const password = "OnboardRoute123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'Partial Profile User', 'startup', true)
      RETURNING id
    `,
    [email, passwordHash],
  );
  const userId = insert.rows[0].id;
  await createStartupProfile(userId);

  const srv = await startServer();
  try {
    const loginRes = await fetch(`${srv.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200, JSON.stringify(loginData));
    assert.equal(loginData.authState.status, AUTH_STATUS.ONBOARDING_REQUIRED);
    assert.equal(loginData.redirectPath, "/onboarding");
    assert.equal(loginData.authState.onboardingComplete, false);
    assert.equal(loginData.authState.onboardingCompletedAt, null);
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});

test("verified user without profile is ONBOARDING_REQUIRED", async () => {
  const email = randomEmail("no-profile");
  const password = "OnboardRoute123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'No Profile User', 'startup', true)
      RETURNING id
    `,
    [email, passwordHash],
  );
  const userId = insert.rows[0].id;

  const srv = await startServer();
  try {
    const loginRes = await fetch(`${srv.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginData.authState.status, AUTH_STATUS.ONBOARDING_REQUIRED);
    assert.equal(loginData.redirectPath, "/onboarding");
    assert.equal(loginData.authState.onboardingComplete, false);
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});

test("onboarding_completed_at grants AUTHENTICATED_READY regardless of profile %", async () => {
  const email = randomEmail("legacy");
  const password = "OnboardRoute123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'Legacy User', 'startup', true)
      RETURNING id
    `,
    [email, passwordHash],
  );
  const userId = insert.rows[0].id;
  await createStartupProfile(userId);
  await markUserOnboardingComplete(userId);

  const srv = await startServer();
  try {
    const loginRes = await fetch(`${srv.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginData.authState.status, AUTH_STATUS.AUTHENTICATED_READY);
    assert.equal(loginData.redirectPath, "/dashboard");
    assert.ok(loginData.authState.onboardingCompletedAt);

    const completionRes = await fetch(
      `${srv.baseUrl}/api/startups/profile/completion`,
      { headers: { Cookie: parseCookies(loginRes.headers.get("set-cookie")) } },
    );
    const completionData = await completionRes.json();
    assert.equal(completionData.data?.isComplete, false);
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});

test("profile field completion is not required for AUTHENTICATED_READY routing", async () => {
  const email = randomEmail("fields-complete");
  const password = "OnboardRoute123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'Fields Complete User', 'startup', true)
      RETURNING id
    `,
    [email, passwordHash],
  );
  const userId = insert.rows[0].id;
  await createStartupProfile(userId, { complete: true });
  await markUserOnboardingComplete(userId);

  const srv = await startServer();
  try {
    const loginRes = await fetch(`${srv.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json();
    assert.equal(loginData.authState.status, AUTH_STATUS.AUTHENTICATED_READY);

    const completionRes = await fetch(
      `${srv.baseUrl}/api/startups/profile/completion`,
      { headers: { Cookie: parseCookies(loginRes.headers.get("set-cookie")) } },
    );
    const completionData = await completionRes.json();
    assert.equal(completionData.data?.isComplete, true);
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});
