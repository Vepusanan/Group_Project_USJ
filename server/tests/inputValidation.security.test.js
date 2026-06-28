// Validation middleware tests (NFR 17.2).
//
// These exercise the express-validator chains wired onto /api/auth and
// /api/account. They assert that malformed input is rejected with a 400 in the
// project's standard error shape BEFORE the controller (and therefore the DB)
// runs — so they don't require a database connection.

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function postJson(baseUrl, path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

test("register rejects missing email with 400 in standard shape", async () => {
  const srv = await startServer();
  try {
    const { status, json } = await postJson(srv.baseUrl, "/api/auth/register", {
      password: "longenough1",
      fullName: "Jane Doe",
      userType: "startup",
      agreedToTerms: true,
    });
    assert.equal(status, 400);
    assert.equal(json.success, false);
    assert.ok(typeof json.error === "string" && json.error.length > 0);
    assert.ok(Array.isArray(json.errors));
  } finally {
    await srv.close();
  }
});

test("register rejects invalid email format", async () => {
  const srv = await startServer();
  try {
    const { status, json } = await postJson(srv.baseUrl, "/api/auth/register", {
      email: "not-an-email",
      password: "longenough1",
      fullName: "Jane Doe",
      userType: "startup",
      agreedToTerms: true,
    });
    assert.equal(status, 400);
    assert.equal(json.success, false);
  } finally {
    await srv.close();
  }
});

test("register rejects bad userType", async () => {
  const srv = await startServer();
  try {
    const { status } = await postJson(srv.baseUrl, "/api/auth/register", {
      email: "user@example.com",
      password: "longenough1",
      fullName: "Jane Doe",
      userType: "hacker",
      agreedToTerms: true,
    });
    assert.equal(status, 400);
  } finally {
    await srv.close();
  }
});

test("register rejects when terms not accepted", async () => {
  const srv = await startServer();
  try {
    const { status } = await postJson(srv.baseUrl, "/api/auth/register", {
      email: "user@example.com",
      password: "longenough1",
      fullName: "Jane Doe",
      userType: "startup",
      agreedToTerms: false,
    });
    assert.equal(status, 400);
  } finally {
    await srv.close();
  }
});

test("login rejects missing password (validation runs before DB)", async () => {
  const srv = await startServer();
  try {
    const { status, json } = await postJson(srv.baseUrl, "/api/auth/login", {
      email: "user@example.com",
    });
    assert.equal(status, 400);
    assert.equal(json.success, false);
  } finally {
    await srv.close();
  }
});

test("login does NOT length-check password (legacy short passwords allowed past validation)", async () => {
  const srv = await startServer();
  try {
    // A short password must NOT be rejected by the validator. It will fail at
    // the controller/DB stage instead — so we only assert it is NOT a 400
    // validation error with our validator message shape.
    const { status, json } = await postJson(srv.baseUrl, "/api/auth/login", {
      email: "user@example.com",
      password: "short",
    });
    // Either it proceeds to the controller (non-400) or the DB is unreachable
    // (500). The one thing it must not be is a *validation* 400 for length.
    if (status === 400 && json) {
      assert.notMatch(
        String(json.error || ""),
        /at least 8 characters/i,
        "login must not enforce password length",
      );
    }
  } finally {
    await srv.close();
  }
});

test("reset-password rejects missing token", async () => {
  const srv = await startServer();
  try {
    const { status } = await postJson(
      srv.baseUrl,
      "/api/auth/reset-password",
      { newPassword: "longenough1" },
    );
    assert.equal(status, 400);
  } finally {
    await srv.close();
  }
});

test("forgot-password rejects malformed email", async () => {
  const srv = await startServer();
  try {
    const { status } = await postJson(
      srv.baseUrl,
      "/api/auth/forgot-password",
      { email: "nope" },
    );
    assert.equal(status, 400);
  } finally {
    await srv.close();
  }
});

test("account routes require auth before validation (no auth bypass)", async () => {
  const srv = await startServer();
  try {
    // No auth cookie/header → protect middleware should reject (401), proving
    // validation was inserted AFTER protect and didn't open a hole.
    const res = await fetch(`${srv.baseUrl}/api/account/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 401);
  } finally {
    await srv.close();
  }
});
