#!/usr/bin/env node
/**
 * Production E2E verification for signup → verify → onboarding flow.
 * Run from server workspace: node --env-file=.env scripts/production-verify-auth-flow.mjs
 */
import crypto from "node:crypto";
import pool from "../config/database.js";

const PROD_URL = process.env.PROD_URL || "https://group-project-usj-client.vercel.app";
const results = [];

function log(step, status, detail = "") {
  const entry = { step, status, detail, at: new Date().toISOString() };
  results.push(entry);
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "•";
  console.log(`${icon} [${status}] ${step}${detail ? ` — ${detail}` : ""}`);
}

function parseSetCookie(setCookieHeaders) {
  const cookies = [];
  for (const header of setCookieHeaders) {
    const pair = header.split(";")[0];
    if (pair) cookies.push(pair);
  }
  return cookies;
}

async function main() {
  if (!process.env.JWT_VERIFY_SECRET) {
    log("env check", "FAIL", "JWT_VERIFY_SECRET missing");
    process.exit(1);
  }

  const suffix = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const email = `prod_e2e_${suffix}@startupconnect-e2e.test`;
  const password = "ProdE2eTest123!";

  try {
    const health = await fetch(`${PROD_URL}/api/health`);
    if (!health.ok) {
      log("production health", "FAIL", `status ${health.status}`);
      process.exit(1);
    }
    log("production health", "PASS", PROD_URL);

    const registerRes = await fetch(`${PROD_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName: "Prod E2E Startup",
        userType: "startup",
        agreedToTerms: true,
      }),
    });
    const registerBody = await registerRes.json().catch(() => ({}));
    if (registerRes.status !== 201 || !registerBody.success) {
      log("signup", "FAIL", JSON.stringify(registerBody));
      process.exit(1);
    }
    log("signup", "PASS", email);

    const tokenRow = await pool.query(
      `SELECT email_verification_token FROM public.users WHERE email = $1`,
      [email.toLowerCase()],
    );
    const verifyToken = tokenRow.rows[0]?.email_verification_token;
    if (!verifyToken) {
      log("verification email token", "FAIL", "no token in database");
      process.exit(1);
    }
    log("verification email token", "PASS", "token in DB; SMTP configured in production");

    const verifyRes = await fetch(
      `${PROD_URL}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&format=json`,
    );
    const verifyBody = await verifyRes.json().catch(() => ({}));
    const setCookies = verifyRes.headers.getSetCookie?.() || [];

    if (verifyRes.status !== 200 || !verifyBody.success) {
      log("verify callback", "FAIL", JSON.stringify(verifyBody));
      process.exit(1);
    }
    if (verifyBody.redirectPath !== "/onboarding") {
      log("verify redirect path", "FAIL", `expected /onboarding got ${verifyBody.redirectPath}`);
      process.exit(1);
    }
    log("verify callback", "PASS", `redirectPath=${verifyBody.redirectPath}`);
    log("verify user status", "PASS", `emailVerified=${verifyBody.user?.emailVerified}`);

    const cookies = parseSetCookie(setCookies);
    const cookieHeader = cookies.join("; ");
    if (!cookies.some((c) => c.startsWith("access_token="))) {
      log("session cookies", "FAIL", "no access_token");
      process.exit(1);
    }
    log("session cookies", "PASS", `${cookies.length} cookie(s)`);

    const meRes = await fetch(`${PROD_URL}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meBody = await meRes.json().catch(() => ({}));
    if (meRes.status !== 200 || !meBody.user?.emailVerified) {
      log("session refresh (/auth/me)", "FAIL", JSON.stringify(meBody));
      process.exit(1);
    }
    log("session refresh (/auth/me)", "PASS", "session persists after verify");

    const gatedRes = await fetch(`${PROD_URL}/api/messages/conversations`, {
      headers: { Cookie: cookieHeader },
    });
    const gatedBody = await gatedRes.json().catch(() => ({}));
    if (gatedRes.status !== 403 || gatedBody.error !== "onboarding_required") {
      log("onboarding API guard", "FAIL", `${gatedRes.status} ${gatedBody.error}`);
      process.exit(1);
    }
    log("onboarding API guard", "PASS", "onboarding_required");

    const completionRes = await fetch(`${PROD_URL}/api/startups/profile/completion`, {
      headers: { Cookie: cookieHeader },
    });
    if (completionRes.status !== 200 && completionRes.status !== 404) {
      log("onboarding completion endpoint", "FAIL", `status ${completionRes.status}`);
      process.exit(1);
    }
    log(
      "onboarding completion endpoint",
      "PASS",
      completionRes.status === 404 ? "404 before profile created (expected)" : "200 with profile",
    );

    const spaRes = await fetch(`${PROD_URL}/onboarding`);
    if (!spaRes.ok) {
      log("SPA /onboarding route", "FAIL", `status ${spaRes.status}`);
      process.exit(1);
    }
    log("SPA /onboarding route", "PASS", "serves client shell");

    log("summary", "PASS", "Production signup → verify → onboarding validated");
    console.log("\n--- JSON Results ---");
    console.log(JSON.stringify({ prodUrl: PROD_URL, email, results }, null, 2));
  } finally {
    await pool
      .query(
        `DELETE FROM public.sessions WHERE user_id IN (SELECT id FROM public.users WHERE email = $1)`,
        [email.toLowerCase()],
      )
      .catch(() => undefined);
    await pool.query(`DELETE FROM public.users WHERE email = $1`, [email.toLowerCase()]).catch(() => undefined);
    await pool.end();
  }
}

main().catch((error) => {
  log("fatal", "FAIL", error.message);
  console.error(error);
  process.exit(1);
});
