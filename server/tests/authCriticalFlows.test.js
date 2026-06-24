import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";

function randomEmail(prefix = "e2e") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@test.com`;
}

function generateAccessToken({ id, email, user_type }) {
  return jwt.sign(
    { userId: id, email, userType: user_type },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
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

async function jsonRequest(baseUrl, method, path, { body, cookies } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookies?.length) headers.Cookie = cookies.join("; ");
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

test("auth critical flows: refresh, password reset, account deletion", async () => {
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be set for tests");

  const email = randomEmail("authflow");
  const originalPassword = "OrigPass123!";
  const newPassword = "NewPass123!";

  const passwordHash = await bcrypt.hash(originalPassword, 10);
  const insert = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'E2E Auth Flow', 'investor', true)
      RETURNING id, email, user_type
    `,
    [email, passwordHash],
  );
  const user = insert.rows[0];

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  await pool.query(
    `
      INSERT INTO public.sessions (user_id, refresh_token, is_remembered, expires_at, client_ip, device_info)
      VALUES ($1, $2, true, NOW() + interval '30 days', '127.0.0.1', 'node:test')
    `,
    [user.id, refreshToken],
  );

  const cookies = [`access_token=${accessToken}`, `refresh_token=${refreshToken}`];

  const srv = await startServer();
  try {
    // Session refresh flow (rotates refresh token + sets new cookies).
    const refresh = await jsonRequest(srv.baseUrl, "POST", "/api/auth/token", {
      body: {},
      cookies,
    });
    assert.equal(refresh.res.status, 200, JSON.stringify(refresh.data));
    assert.equal(refresh.data?.success, true, JSON.stringify(refresh.data));

    // Password reset flow (non-enumerating response + token stored + reset works).
    const forgot = await jsonRequest(srv.baseUrl, "POST", "/api/auth/forgot-password", {
      body: { email },
    });
    assert.equal(forgot.res.status, 200, JSON.stringify(forgot.data));
    assert.equal(forgot.data?.success, true, JSON.stringify(forgot.data));

    const tokenRow = await pool.query(
      `
        SELECT token
        FROM public.password_reset_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [user.id],
    );
    assert.ok(tokenRow.rows[0]?.token, "expected password reset token row");

    const reset = await jsonRequest(srv.baseUrl, "POST", "/api/auth/reset-password", {
      body: { token: tokenRow.rows[0].token, newPassword },
    });
    assert.equal(reset.res.status, 200, JSON.stringify(reset.data));
    assert.equal(reset.data?.success, true, JSON.stringify(reset.data));

    // Deletion flow requires password confirmation + revokes sessions.
    const deletionAccessToken = generateAccessToken(user);
    const deletionRefreshToken = generateRefreshToken();
    await pool.query(
      `
        INSERT INTO public.sessions (user_id, refresh_token, is_remembered, expires_at, client_ip, device_info)
        VALUES ($1, $2, true, NOW() + interval '30 days', '127.0.0.1', 'node:test delete')
      `,
      [user.id, deletionRefreshToken],
    );

    const del = await jsonRequest(srv.baseUrl, "DELETE", "/api/account", {
      body: { password: newPassword },
      cookies: [
        `access_token=${deletionAccessToken}`,
        `refresh_token=${deletionRefreshToken}`,
      ],
    });
    assert.equal(del.res.status, 200, JSON.stringify(del.data));
    assert.equal(del.data?.success, true, JSON.stringify(del.data));

    const deleted = await pool.query(
      `SELECT deleted_at FROM public.users WHERE id = $1`,
      [user.id],
    );
    assert.ok(deleted.rows[0]?.deleted_at, "expected deleted_at to be set");
  } finally {
    await srv.close();
    await pool.query(`DELETE FROM public.users WHERE id = $1`, [user.id]).catch(() => undefined);
  }
});

