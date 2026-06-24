import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getSupabase, BUCKETS } from "../utils/supabaseStorage.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(__dirname, "../../e2e/.fixtures.json");

export const E2E_PASSWORD = "E2eTest123!";

const MINIMAL_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF`,
);

const USERS = [
  {
    key: "startup",
    email: "e2e_startup@test.com",
    fullName: "E2E Connected Startup",
    userType: "startup",
    companyName: "E2E Connected Startup",
  },
  {
    key: "investor",
    email: "e2e_investor@test.com",
    fullName: "E2E Test Investor",
    userType: "investor",
    firmName: "E2E Ventures",
  },
  {
    key: "startupPending",
    email: "e2e_startup_pending@test.com",
    fullName: "E2E Pending Startup",
    userType: "startup",
    companyName: "E2E Pending Startup",
  },
];

async function upsertUser({ email, fullName, userType }) {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, user_type, email_verified)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        user_type = EXCLUDED.user_type,
        email_verified = true,
        deleted_at = NULL,
        account_locked_until = NULL
      RETURNING id, email, user_type, full_name
    `,
    [email.toLowerCase(), passwordHash, fullName, userType],
  );
  return result.rows[0];
}

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, userType: user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

async function ensureSession(userId) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await pool.query(
    `
      INSERT INTO public.sessions (user_id, refresh_token, is_remembered, expires_at, client_ip, device_info)
      VALUES ($1, $2, true, $3, '127.0.0.1', 'E2E seed')
    `,
    [userId, refreshToken, expiresAt],
  );

  return { refreshToken, expiresAt };
}

async function upsertStartupProfile(userId, companyName) {
  const result = await pool.query(
    `
      INSERT INTO startup_profiles (
        user_id, company_name, founder_names, tagline, detailed_description,
        industry, founded_date, current_stage, team_size, funding_stage,
        amount_seeking, previous_funding, use_of_funds, revenue_status,
        primary_contact_name, contact_email
      )
      VALUES (
        $1, $2, 'E2E Founder', 'E2E test startup tagline',
        'Automated end-to-end test startup profile for StartHub Capital.',
        'Technology', '2024-01-01', 'MVP', 5, 'SEED',
        500000, 0, 'Product development and go-to-market', 'PRE_REVENUE',
        'E2E Founder', $3
      )
      ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        updated_at = CURRENT_TIMESTAMP
      RETURNING startup_profile_id, company_name
    `,
    [userId, companyName, `e2e+${userId.slice(0, 8)}@test.com`],
  );
  return result.rows[0];
}

async function upsertInvestorProfile(userId, firmName) {
  const email = `e2e-investor-${userId.slice(0, 8)}@test.com`;
  const result = await pool.query(
    `
      INSERT INTO investor_profiles (
        user_id, name_or_firm, investor_type, years_of_experience,
        professional_background, investment_thesis, industries_of_interest,
        geographic_preference, stage_preference, min_investment_size,
        max_investment_size, investment_structure, follow_on_investment,
        investment_timeline, what_you_look_for, value_add,
        primary_contact_email, preferred_contact_method
      )
      VALUES (
        $1, $2, 'ANGEL', 8,
        'E2E automated test investor background.',
        'Backing high-conviction founders in technology.',
        '["Technology"]'::jsonb, '["Global"]'::jsonb, '["SEED"]'::jsonb,
        25000, 500000, '["Equity"]'::jsonb, true,
        '6-12 months', 'Strong teams with clear traction.',
        'Mentorship and network access.',
        $3, 'email'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        name_or_firm = EXCLUDED.name_or_firm,
        updated_at = CURRENT_TIMESTAMP
      RETURNING investor_profile_id, name_or_firm
    `,
    [userId, firmName, email],
  );
  return result.rows[0];
}

async function ensurePitchDeck(startupProfileId) {
  const supabase = getSupabase();
  const fileName = `pitch-decks/${startupProfileId}/deck_${Date.now()}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .upload(fileName, MINIMAL_PDF, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload pitch deck fixture: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .getPublicUrl(fileName);

  const publicUrl = urlData?.publicUrl;
  if (!publicUrl) {
    throw new Error("Failed to resolve public URL for pitch deck fixture");
  }

  await pool.query(
    `
      UPDATE public.startup_profiles
      SET pitch_deck_url = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE startup_profile_id = $2
    `,
    [publicUrl, startupProfileId],
  );

  return publicUrl;
}

async function ensurePrivacySettings(userId) {
  await pool.query(
    `
      INSERT INTO privacy_settings (user_id, profile_visibility, connection_request_setting, show_connections_list, show_activity_status)
      VALUES ($1, 'public', true, true, true)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userId],
  );
}

async function ensureAcceptedConnection(investorUserId, startupUserId) {
  await pool.query(
    `
      DELETE FROM public.connections
      WHERE investor_id = $1 AND startup_id = $2
    `,
    [investorUserId, startupUserId],
  );

  const result = await pool.query(
    `
      INSERT INTO public.connections (
        investor_id, startup_id, requester_id, status, request_message
      )
      VALUES ($1, $2, $1, 'accepted', 'E2E seeded connection')
      RETURNING id
    `,
    [investorUserId, startupUserId],
  );
  return result.rows[0]?.id;
}

async function ensurePendingConnection(investorUserId, startupUserId) {
  await pool.query(
    `
      DELETE FROM public.connections
      WHERE investor_id = $1 AND startup_id = $2
    `,
    [investorUserId, startupUserId],
  );

  const result = await pool.query(
    `
      INSERT INTO public.connections (
        investor_id, startup_id, requester_id, status, request_message
      )
      VALUES ($1, $2, $1, 'pending', 'E2E pending connection request')
      RETURNING id
    `,
    [investorUserId, startupUserId],
  );
  return result.rows[0]?.id;
}

export async function seedE2eFixtures() {
  console.log("🌱 Seeding E2E fixtures...\n");

  const fixtures = {
    password: E2E_PASSWORD,
    users: {},
    connections: {},
    pitchDecks: {},
  };

  for (const spec of USERS) {
    const user = await upsertUser(spec);
    await ensurePrivacySettings(user.id);
    const accessToken = generateAccessToken(user);
    const { refreshToken } = await ensureSession(user.id);

    if (spec.userType === "startup") {
      const profile = await upsertStartupProfile(user.id, spec.companyName);
      const pitchDeckUrl = await ensurePitchDeck(profile.startup_profile_id);
      fixtures.users[spec.key] = {
        ...user,
        profileId: profile.startup_profile_id,
        displayName: profile.company_name,
        pitchDeckUrl,
        auth: { access_token: accessToken, refresh_token: refreshToken },
      };
      fixtures.pitchDecks[spec.key] = {
        startupProfileId: profile.startup_profile_id,
        url: pitchDeckUrl,
      };
    } else {
      const profile = await upsertInvestorProfile(user.id, spec.firmName);
      fixtures.users[spec.key] = {
        ...user,
        profileId: profile.investor_profile_id,
        displayName: profile.name_or_firm,
        auth: { access_token: accessToken, refresh_token: refreshToken },
      };
    }
  }

  const investorId = fixtures.users.investor.id;
  const startupId = fixtures.users.startup.id;
  const pendingStartupId = fixtures.users.startupPending.id;

  fixtures.connections.accepted = await ensureAcceptedConnection(
    investorId,
    startupId,
  );
  fixtures.connections.pending = await ensurePendingConnection(
    investorId,
    pendingStartupId,
  );

  fs.mkdirSync(path.dirname(FIXTURES_PATH), { recursive: true });
  fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));

  console.log("✅ E2E fixtures written to e2e/.fixtures.json");
  console.log(`   Password for all E2E users: ${E2E_PASSWORD}`);
  return fixtures;
}

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  seedE2eFixtures()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ E2E seed failed:", error.message);
      process.exit(1);
    });
}
