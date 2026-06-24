import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";

function generateAccessToken({ id, email, user_type }) {
  return jwt.sign(
    { userId: id, email, userType: user_type },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
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

async function jsonGet(baseUrl, path, cookies = []) {
  const headers = {};
  if (cookies.length) headers.Cookie = cookies.join("; ");
  const res = await fetch(`${baseUrl}${path}`, { headers });
  const data = await res.json().catch(() => null);
  return { res, data };
}

test("admin routes require admin email allowlist", async () => {
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be set for tests");

  const email = `rbac_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@test.com`;
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const inserted = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, 'E2E RBAC', 'investor', true)
      RETURNING id, email, user_type
    `,
    [email, passwordHash],
  );
  const user = inserted.rows[0];
  const accessToken = generateAccessToken(user);

  const previousAdmins = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "";

  const srv = await startServer();
  try {
    const notAdmin = await jsonGet(srv.baseUrl, "/api/admin/analytics", [
      `access_token=${accessToken}`,
    ]);
    assert.equal(notAdmin.res.status, 403, JSON.stringify(notAdmin.data));

    process.env.ADMIN_EMAILS = email;
    const asAdmin = await jsonGet(srv.baseUrl, "/api/admin/analytics", [
      `access_token=${accessToken}`,
    ]);
    assert.equal(asAdmin.res.status, 200, JSON.stringify(asAdmin.data));
    assert.equal(asAdmin.data?.success, true, JSON.stringify(asAdmin.data));
  } finally {
    process.env.ADMIN_EMAILS = previousAdmins;
    await srv.close();
    await pool.query(`DELETE FROM public.users WHERE id = $1`, [user.id]).catch(() => undefined);
  }
});

