import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";
import { AUTH_STATUS } from "../../shared/authStateMachine.mjs";

function randomEmail(prefix = "state") {
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
  await pool.query("DELETE FROM public.sessions WHERE user_id = $1", [userId]).catch(() => undefined);
  await pool.query("DELETE FROM public.users WHERE id = $1", [userId]).catch(() => undefined);
}

test("register then /auth/me returns EMAIL_UNVERIFIED", async () => {
  const email = randomEmail("register");
  const password = "StateTest123!";
  const srv = await startServer();
  let userId;

  try {
    const registerRes = await fetch(`${srv.baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName: "State Test",
        userType: "startup",
        agreedToTerms: true,
      }),
    });
    const registerData = await registerRes.json();
    assert.equal(registerRes.status, 201, JSON.stringify(registerData));
    assert.equal(registerData.authState.status, AUTH_STATUS.EMAIL_UNVERIFIED);
    userId = registerData.user?.id;

    const cookies = parseCookies(registerRes.headers.get("set-cookie"));
    const meRes = await fetch(`${srv.baseUrl}/api/auth/me`, {
      headers: { Cookie: cookies },
    });
    const meData = await meRes.json();
    assert.equal(meRes.status, 200, JSON.stringify(meData));
    assert.equal(meData.authState.status, AUTH_STATUS.EMAIL_UNVERIFIED);
    assert.ok(meData.authState.requiredRoute?.startsWith("/verify-email"));
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});

test("email verification transitions to ONBOARDING_REQUIRED", async () => {
  assert.ok(process.env.JWT_VERIFY_SECRET, "JWT_VERIFY_SECRET required");

  const email = randomEmail("verify-state");
  const verifyToken = jwt.sign(
    { email },
    process.env.JWT_VERIFY_SECRET,
    { expiresIn: "1h" },
  );
  const passwordHash = await bcrypt.hash("StateTest123!", 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (
        email, password_hash, full_name, user_type, email_verified,
        email_verification_token, email_verification_token_expires
      )
      VALUES ($1, $2, 'State Verify', 'startup', false, $3, NOW() + interval '1 hour')
      RETURNING id
    `,
    [email, passwordHash, verifyToken],
  );
  const userId = insert.rows[0].id;

  const srv = await startServer();
  try {
    const res = await fetch(
      `${srv.baseUrl}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&format=json`,
    );
    const data = await res.json();
    assert.equal(res.status, 200, JSON.stringify(data));
    assert.equal(data.authState.status, AUTH_STATUS.ONBOARDING_REQUIRED);
    assert.equal(data.redirectPath, "/onboarding");

    const cookies = parseCookies(res.headers.get("set-cookie"));
    const meRes = await fetch(`${srv.baseUrl}/api/auth/me`, {
      headers: { Cookie: cookies },
    });
    const meData = await meRes.json();
    assert.equal(meData.authState.status, AUTH_STATUS.ONBOARDING_REQUIRED);
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});

test("unverified login creates EMAIL_UNVERIFIED session", async () => {
  const email = randomEmail("login-unverified");
  const password = "StateTest123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'Unverified Login', 'startup', false)
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
    assert.equal(loginRes.status, 200, JSON.stringify(loginData));
    assert.equal(loginData.authState.status, AUTH_STATUS.EMAIL_UNVERIFIED);

    const cookies = parseCookies(loginRes.headers.get("set-cookie"));
    const meRes = await fetch(`${srv.baseUrl}/api/auth/me`, {
      headers: { Cookie: cookies },
    });
    const meData = await meRes.json();
    assert.equal(meData.authState.status, AUTH_STATUS.EMAIL_UNVERIFIED);
  } finally {
    await srv.close();
    await cleanupUser(userId);
  }
});
