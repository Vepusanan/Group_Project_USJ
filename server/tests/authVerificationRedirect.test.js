import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";

function randomEmail(prefix = "verify") {
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

test("verify email json callback redirects new startup to onboarding", async () => {
  assert.ok(process.env.JWT_VERIFY_SECRET, "JWT_VERIFY_SECRET required");

  const email = randomEmail("startup");
  const verifyToken = jwt.sign(
    { email },
    process.env.JWT_VERIFY_SECRET,
    { expiresIn: "1h" },
  );
  const passwordHash = await bcrypt.hash("VerifyTest123!", 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (
        email, password_hash, full_name, user_type, email_verified,
        email_verification_token, email_verification_token_expires
      )
      VALUES ($1, $2, 'Verify Flow', 'startup', false, $3, NOW() + interval '1 hour')
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
    assert.equal(data.success, true);
    assert.equal(data.redirectPath, "/onboarding");
    assert.equal(data.user.emailVerified, true);

    const cookies = res.headers.get("set-cookie") || "";
    assert.match(cookies, /access_token=/);
  } finally {
    await srv.close();
    await pool.query("DELETE FROM public.sessions WHERE user_id = $1", [userId]).catch(() => undefined);
    await pool.query("DELETE FROM public.users WHERE id = $1", [userId]).catch(() => undefined);
  }
});

test("verify email json callback redirects new investor to investor onboarding", async () => {
  const email = randomEmail("investor");
  const verifyToken = jwt.sign(
    { email },
    process.env.JWT_VERIFY_SECRET,
    { expiresIn: "1h" },
  );
  const passwordHash = await bcrypt.hash("VerifyTest123!", 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (
        email, password_hash, full_name, user_type, email_verified,
        email_verification_token, email_verification_token_expires
      )
      VALUES ($1, $2, 'Verify Investor', 'investor', false, $3, NOW() + interval '1 hour')
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
    assert.equal(data.redirectPath, "/investor-onboarding");
  } finally {
    await srv.close();
    await pool.query("DELETE FROM public.sessions WHERE user_id = $1", [userId]).catch(() => undefined);
    await pool.query("DELETE FROM public.users WHERE id = $1", [userId]).catch(() => undefined);
  }
});

test("verify email rejects expired token", async () => {
  const email = randomEmail("expired");
  const verifyToken = jwt.sign(
    { email },
    process.env.JWT_VERIFY_SECRET,
    { expiresIn: -10 },
  );

  const srv = await startServer();
  try {
    const res = await fetch(
      `${srv.baseUrl}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&format=json`,
    );
    const data = await res.json();
    assert.equal(res.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.reason, "expired");
  } finally {
    await srv.close();
  }
});
