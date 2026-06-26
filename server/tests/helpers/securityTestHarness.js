import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../../config/database.js";
import { createApp } from "../../app.js";
import { markOnboardingCompleted } from "../../services/onboardingService.js";

export function uid(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

export function signAccessToken({ id, email, user_type }) {
  return jwt.sign(
    { userId: id, email, userType: user_type },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

export async function startServer() {
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

export async function jsonRequest(baseUrl, method, path, { body, cookies } = {}) {
  const headers = {};
  if (cookies?.length) headers.Cookie = cookies.join("; ");
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${baseUrl}${method === "GET" || method === "HEAD" ? path : path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => "");
  return { res, data };
}

export async function createUser({ email, userType, fullName }) {
  const passwordHash = await bcrypt.hash("E2eTest123!", 10);
  const result = await pool.query(
    `
      INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, email, user_type, full_name
    `,
    [email.toLowerCase(), passwordHash, fullName, userType],
  );
  return result.rows[0];
}

export async function createStartupProfile(userId, { pitchDeckUrl = null, complete = false } = {}) {
  const profile = await pool.query(
    `
      INSERT INTO public.startup_profiles (
        user_id, company_name, founder_names, tagline, detailed_description,
        industry, founded_date, current_stage, team_size, funding_stage,
        amount_seeking, previous_funding, use_of_funds, revenue_status,
        primary_contact_name, contact_email, pitch_deck_url
      )
      VALUES (
        $1, $2, 'E2E Founder', 'E2E test startup tagline',
        'Security integration test profile.',
        'Technology', '2024-01-01', 'MVP', 5, 'SEED',
        500000, 0, 'Testing', 'PRE_REVENUE',
        'E2E Founder', $3, $4
      )
      RETURNING startup_profile_id, company_name, user_id
    `,
    [
      userId,
      `SecTest Startup ${Date.now()}`,
      `e2e+${userId.slice(0, 8)}@test.com`,
      pitchDeckUrl,
    ],
  );
  const row = profile.rows[0];
  if (complete) {
    await markStartupProfileFieldsComplete(userId);
    await markOnboardingCompleted(userId);
  }
  return row;
}

export async function markUserOnboardingComplete(userId) {
  return markOnboardingCompleted(userId);
}

export async function markStartupProfileFieldsComplete(userId) {
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
        pitch_deck_url = COALESCE(pitch_deck_url, $7),
        business_plan_url = $8,
        product_demo_url = $9,
        founder_video_url = $10,
        phone_number = $11,
        social_media_links = $12
      WHERE user_id = $1
    `,
    [
      userId,
      JSON.stringify([{ name: "CTO", role: "CTO" }]),
      "Monthly active users growing 20% MoM",
      "Launched MVP with first paying customers",
      "Best startup we have seen this year",
      "https://example.com/team.jpg",
      "https://example.com/deck.pdf",
      "https://example.com/plan.pdf",
      "https://example.com/demo",
      "https://example.com/video.mp4",
      "+15551234567",
      JSON.stringify({ linkedin: "https://linkedin.com/company/test" }),
    ],
  );
}

export async function createInvestorProfile(userId, { complete = false } = {}) {
  const result = await pool.query(
    `
      INSERT INTO public.investor_profiles (
        user_id, name_or_firm, investor_type, years_of_experience,
        professional_background, investment_thesis, industries_of_interest,
        geographic_preference, stage_preference, min_investment_size,
        max_investment_size, investment_structure, follow_on_investment,
        investment_timeline, what_you_look_for, value_add,
        primary_contact_email, preferred_contact_method
      )
      VALUES (
        $1, $2, 'ANGEL', 8,
        'E2E security test investor background.',
        'Security testing.',
        '["Technology"]'::jsonb, '["Global"]'::jsonb, '["SEED"]'::jsonb,
        25000, 500000, '["Equity"]'::jsonb, true,
        '6-12 months', 'Strong teams.', 'Value add.',
        $3, 'email'
      )
      RETURNING investor_profile_id
    `,
    [userId, `SecTest Investor ${Date.now()}`, `e2e-investor-${userId.slice(0, 8)}@test.com`],
  );
  if (complete) {
    await markInvestorProfileFieldsComplete(userId);
    await markOnboardingCompleted(userId);
  }
  return result.rows[0];
}

export async function markInvestorProfileFieldsComplete(userId) {
  await pool.query(
    `
      UPDATE public.investor_profiles
      SET
        number_of_investments = 12,
        portfolio_companies = $2,
        successful_exits = $3,
        deal_breakers = $4,
        network_resources = $5,
        notable_achievements = $6,
        phone_number = $7,
        social_media = $8
      WHERE user_id = $1
    `,
    [
      userId,
      JSON.stringify(["Acme Corp", "Beta Labs"]),
      "2 successful exits in SaaS",
      "No tobacco or gambling",
      "Strong founder network across APAC",
      "Led top-quartile angel syndicate",
      "+15559876543",
      JSON.stringify({ linkedin: "https://linkedin.com/in/test-investor" }),
    ],
  );
}

export async function setProfileVisibility(userId, visibility) {
  await pool.query(
    `
      INSERT INTO public.privacy_settings (user_id, profile_visibility)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET profile_visibility = EXCLUDED.profile_visibility
    `,
    [userId, visibility],
  );
}

export async function ensureAcceptedConnection(investorUserId, startupUserId) {
  await pool.query(
    `DELETE FROM public.connections WHERE investor_id = $1 AND startup_id = $2`,
    [investorUserId, startupUserId],
  );
  const result = await pool.query(
    `
      INSERT INTO public.connections (investor_id, startup_id, requester_id, status, request_message)
      VALUES ($1, $2, $1, 'accepted', 'Seeded for security integration tests')
      RETURNING id
    `,
    [investorUserId, startupUserId],
  );
  return result.rows[0].id;
}

export function authCookies(user) {
  return [`access_token=${signAccessToken(user)}`];
}
