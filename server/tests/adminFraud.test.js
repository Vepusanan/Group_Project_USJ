import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";

function token({ id, email, user_type }) {
  return jwt.sign({ userId: id, email, userType: user_type }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}
async function startServer() {
  const server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}
async function makeUser(type = "investor") {
  const email = `af_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@test.com`;
  const hash = await bcrypt.hash("Password123!", 10);
  const { rows } = await pool.query(
    `INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
     VALUES ($1,$2,'AF Test',$3,true) RETURNING id, email, user_type`,
    [email, hash, type],
  );
  return rows[0];
}

test("admin can list reports and suspend a user; non-admin is 403", async () => {
  assert.ok(process.env.JWT_SECRET);
  const admin = await makeUser();
  const reporter = await makeUser();
  const reported = await makeUser("startup");
  await pool.query(
    `INSERT INTO public.profile_reports (reporter_user_id, reported_user_id, reason)
     VALUES ($1,$2,'Fake company, fraudulent pitch deck')`,
    [reporter.id, reported.id],
  );
  const prev = process.env.ADMIN_EMAILS;
  const srv = await startServer();
  try {
    // non-admin
    process.env.ADMIN_EMAILS = "";
    let res = await fetch(`${srv.baseUrl}/api/admin/reports`, {
      headers: { Cookie: `access_token=${token(reporter)}` },
    });
    assert.equal(res.status, 403);

    // admin lists + suspends
    process.env.ADMIN_EMAILS = admin.email;
    res = await fetch(`${srv.baseUrl}/api/admin/reports`, {
      headers: { Cookie: `access_token=${token(admin)}` },
    });
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.ok(list.data.some((r) => r.reported_user_id === reported.id));

    res = await fetch(`${srv.baseUrl}/api/admin/users/${reported.id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `access_token=${token(admin)}` },
      body: JSON.stringify({ days: 7, reason: "Confirmed fraud" }),
    });
    assert.equal(res.status, 200, JSON.stringify(await res.json().catch(() => null)));

    const { rows } = await pool.query(`SELECT account_locked_until FROM public.users WHERE id=$1`, [reported.id]);
    assert.ok(rows[0].account_locked_until);
  } finally {
    process.env.ADMIN_EMAILS = prev;
    await srv.close();
    await pool.query(`DELETE FROM public.users WHERE id = ANY($1)`, [[admin.id, reporter.id, reported.id]]).catch(() => {});
  }
});

test("admin cannot suspend their own account", async () => {
  const admin = await makeUser();
  const prev = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = admin.email;
  const srv = await startServer();
  try {
    const res = await fetch(`${srv.baseUrl}/api/admin/users/${admin.id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `access_token=${token(admin)}` },
      body: JSON.stringify({ days: 7, reason: "x" }),
    });
    assert.equal(res.status, 400);
  } finally {
    process.env.ADMIN_EMAILS = prev;
    await srv.close();
    await pool.query(`DELETE FROM public.users WHERE id=$1`, [admin.id]).catch(() => {});
  }
});
