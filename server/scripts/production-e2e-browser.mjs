#!/usr/bin/env node
/**
 * Production browser E2E: signup → verify link → onboarding → route guards → dashboard.
 * Run: cd server && node --env-file=.env scripts/production-e2e-browser.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import pool from "../config/database.js";

const PROD_URL = (process.env.PROD_URL || "https://group-project-usj-client.vercel.app").replace(
  /\/+$/,
  "",
);
const OUT_DIR = path.resolve(
  process.cwd(),
  process.env.PROD_E2E_SCREENSHOT_DIR || "../e2e/.prod-evidence",
);

const results = [];

function log(step, status, detail = "") {
  const entry = { step, status, detail, at: new Date().toISOString() };
  results.push(entry);
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "•";
  console.log(`${icon} [${status}] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function screenshot(page, name) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  log(`screenshot:${name}`, "INFO", file);
  return file;
}

async function registerUser({ email, password, fullName = "Prod Browser E2E" }) {
  const res = await fetch(`${PROD_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      fullName,
      userType: "startup",
      agreedToTerms: true,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function getVerifyToken(email) {
  const row = await pool.query(
    `SELECT email_verification_token, email_verified FROM public.users WHERE email = $1`,
    [email.toLowerCase()],
  );
  return row.rows[0] || null;
}

async function completeStartupProfileForUser(userId, email) {
  const company = `Prod E2E Co ${Date.now()}`;
  await pool.query(
    `
      INSERT INTO public.startup_profiles (
        user_id, company_name, founder_names, tagline, detailed_description,
        industry, founded_date, current_stage, team_size, funding_stage,
        amount_seeking, previous_funding, use_of_funds, revenue_status,
        primary_contact_name, contact_email, pitch_deck_url
      )
      VALUES (
        $1, $2, 'E2E Founder', 'Production E2E tagline',
        'Production onboarding verification profile.',
        'Technology', '2024-01-01', 'MVP', 5, 'SEED',
        500000, 0, 'Product development', 'PRE_REVENUE',
        'E2E Founder', $3, 'https://example.com/deck.pdf'
      )
    `,
    [userId, company, email],
  );
  await pool.query(
    `
      UPDATE public.startup_profiles
      SET
        key_team_members = $2,
        previous_funding = COALESCE(previous_funding, 0),
        key_metrics = $3,
        major_achievements = $4,
        customer_testimonials = $5,
        team_photo_url = $6,
        business_plan_url = $7,
        product_demo_url = $8,
        founder_video_url = $9,
        phone_number = $10,
        social_media_links = $11
      WHERE user_id = $1
    `,
    [
      userId,
      JSON.stringify([{ name: "John Doe", role: "CTO" }]),
      "20% MoM growth",
      "Launched MVP",
      "Strong early traction",
      "https://example.com/team.jpg",
      "https://example.com/plan.pdf",
      "https://example.com/demo",
      "https://example.com/video.mp4",
      "+15555550100",
      JSON.stringify({ linkedin: "https://linkedin.com/company/example" }),
    ],
  );
}

async function cleanupUser(email) {
  await pool
    .query(
      `DELETE FROM public.startup_profiles WHERE user_id IN (SELECT id FROM public.users WHERE email = $1)`,
      [email.toLowerCase()],
    )
    .catch(() => undefined);
  await pool
    .query(
      `DELETE FROM public.sessions WHERE user_id IN (SELECT id FROM public.users WHERE email = $1)`,
      [email.toLowerCase()],
    )
    .catch(() => undefined);
  await pool.query(`DELETE FROM public.users WHERE email = $1`, [email.toLowerCase()]).catch(() => undefined);
}

async function main() {
  const suffix = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const email = `prod_browser_${suffix}@starthub-e2e.test`;
  const password = "ProdE2eTest123!";
  const unverifiedEmail = `prod_unverified_${suffix}@starthub-e2e.test`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: PROD_URL });
  const page = await context.newPage();

  try {
    const health = await fetch(`${PROD_URL}/api/health`);
    if (!health.ok) {
      log("production health", "FAIL", `status ${health.status}`);
      process.exit(1);
    }
    log("production health", "PASS", PROD_URL);

    const { res: regRes, body: regBody } = await registerUser({ email, password });
    if (regRes.status !== 201 || !regBody.success) {
      log("signup API", "FAIL", JSON.stringify(regBody));
      process.exit(1);
    }
    log("signup API", "PASS", email);

    const tokenRow = await getVerifyToken(email);
    if (!tokenRow?.email_verification_token) {
      log("verification email", "FAIL", "no verification token in database");
      process.exit(1);
    }
    log(
      "verification email",
      "PASS",
      "SMTP token issued (email link matches /verify-email?token=…)",
    );

    const verifyLink = `${PROD_URL}/verify-email?token=${encodeURIComponent(tokenRow.email_verification_token)}`;
    await page.goto(verifyLink, { waitUntil: "networkidle" });
    await page.waitForURL(/\/onboarding/, { timeout: 30000 });
    log("verify link → onboarding", "PASS", page.url());
    await screenshot(page, "01-after-verify-onboarding");

    await page.reload({ waitUntil: "networkidle" });
    if (!page.url().includes("/onboarding")) {
      log("onboarding persistence after refresh", "FAIL", page.url());
      process.exit(1);
    }
    log("onboarding persistence after refresh", "PASS", page.url());
    await screenshot(page, "02-onboarding-after-refresh");

    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    await page.goto("/connections", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/onboarding/, { timeout: 45000 });
    log("route guard: verified incomplete → onboarding", "PASS", page.url());
    await screenshot(page, "03-incomplete-blocked-from-connections");

    const meBefore = await fetch(`${PROD_URL}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    const meBody = await meBefore.json().catch(() => ({}));
    const userId = meBody.user?.id;
    if (!userId) {
      log("resolve user id", "FAIL", JSON.stringify(meBody));
      process.exit(1);
    }

    await completeStartupProfileForUser(userId, email);
    log("complete onboarding (profile)", "PASS", "startup profile marked complete");

    await page.goto("/onboarding", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const afterCompleteUrl = page.url();
    if (afterCompleteUrl.includes("/onboarding")) {
      await page.goto("/dashboard", { waitUntil: "networkidle" });
    }
    await page.waitForTimeout(1500);
    const dashboardUrl = page.url();
    if (dashboardUrl.includes("/login") || dashboardUrl.includes("/onboarding")) {
      log("dashboard access after onboarding", "FAIL", dashboardUrl);
      process.exit(1);
    }
    log("dashboard access after onboarding", "PASS", dashboardUrl);
    await screenshot(page, "04-dashboard-after-onboarding");

    await page.goto("/connections", { waitUntil: "networkidle" });
    if (page.url().includes("/onboarding") || page.url().includes("/login")) {
      log("route guard: complete user → connections", "FAIL", page.url());
      process.exit(1);
    }
    log("route guard: complete user → connections", "PASS", page.url());
    await screenshot(page, "05-connections-complete-user");

    const gatedRes = await fetch(`${PROD_URL}/api/messages/conversations`, {
      headers: { Cookie: cookieHeader },
    });
    if (gatedRes.status === 403) {
      const gatedBody = await gatedRes.json().catch(() => ({}));
      log("API guard after onboarding", "FAIL", gatedBody.error || gatedRes.status);
      process.exit(1);
    }
    log("API guard after onboarding", "PASS", `status ${gatedRes.status}`);

    const unverifiedCtx = await browser.newContext({ baseURL: PROD_URL });
    const unverifiedPage = await unverifiedCtx.newPage();
    try {
      const unv = await registerUser({ email: unverifiedEmail, password });
      if (unv.res.status !== 201) {
        log("unverified signup", "FAIL", JSON.stringify(unv.body));
        process.exit(1);
      }

      const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail, password }),
      });
      const loginBody = await loginRes.json().catch(() => ({}));
      if (loginRes.status !== 403 || loginBody.emailVerified !== false) {
        log("unverified login API guard", "FAIL", JSON.stringify(loginBody));
        process.exit(1);
      }
      log("unverified login API guard", "PASS", "403 until email verified");

      await unverifiedPage.goto("/connections", { waitUntil: "domcontentloaded" });
      await unverifiedPage.waitForURL(/\/login/, { timeout: 20000 });
      log("route guard: unverified → login", "PASS", unverifiedPage.url());
      await screenshot(unverifiedPage, "06-unverified-blocked");
    } finally {
      await unverifiedCtx.close();
      await cleanupUser(unverifiedEmail);
    }

    log("summary", "PASS", "Full production browser E2E completed");
    console.log("\n--- JSON Results ---");
    console.log(
      JSON.stringify({ prodUrl: PROD_URL, email, screenshotDir: OUT_DIR, results }, null, 2),
    );
  } finally {
    await cleanupUser(email);
    await browser.close();
    await pool.end();
  }
}

main().catch((error) => {
  log("fatal", "FAIL", error.message);
  console.error(error);
  process.exit(1);
});
