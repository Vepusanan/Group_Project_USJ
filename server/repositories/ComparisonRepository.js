import pool from "../config/database.js";
import { getStartupProfileById } from "./StartupProfileRepository.js";
import { getConnectionBetweenUsers } from "./ConnectionRepository.js";
import { getMatchScoreMapForInvestor } from "../services/compatibilityMatchService.js";
import { getUserVerification } from "./VerificationRepository.js";

let tablesReadyPromise = null;

export const ensureComparisonTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.comparison_snapshots (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        startup_profile_ids UUID[] NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT comparison_snapshots_pkey PRIMARY KEY (id)
      );
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

const STAGE_LABELS = {
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
  SERIES_D_PLUS: "Series D+",
};

const REVENUE_LABELS = {
  PRE_REVENUE: "Pre-revenue",
  REVENUE_GENERATING: "Revenue-generating",
  PROFITABLE: "Profitable",
};

const formatAmount = (value) => {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
};

export async function buildComparisonData(investorUserId, startupProfileIds) {
  const uniqueIds = [...new Set(startupProfileIds.map(String))].slice(0, 4);
  if (uniqueIds.length === 0) {
    return [];
  }

  const profiles = await Promise.all(
    uniqueIds.map((id) => getStartupProfileById(id)),
  );

  const validProfiles = profiles.filter(Boolean);
  const matchScoreMap = await getMatchScoreMapForInvestor(
    investorUserId,
    validProfiles,
  );

  const rows = [];

  for (const profile of validProfiles) {
    const connection = await getConnectionBetweenUsers(
      profile.user_id,
      investorUserId,
    );
    const isConnected = ["accepted", "connected"].includes(
      String(connection?.normalized_status || connection?.status || "").toLowerCase(),
    );

    const verification = await getUserVerification(profile.user_id);
    const scoreEntry = matchScoreMap.get(String(profile.startup_profile_id));

    const location = [profile.location_city, profile.location_country]
      .filter(Boolean)
      .join(", ");

    rows.push({
      startup_profile_id: profile.startup_profile_id,
      company_name: profile.company_name,
      industry: profile.industry,
      funding_stage:
        STAGE_LABELS[profile.funding_stage] || profile.funding_stage,
      amount_seeking: formatAmount(profile.amount_seeking),
      revenue_status:
        REVENUE_LABELS[profile.revenue_status] || profile.revenue_status,
      location: location || null,
      founding_date: profile.founded_date
        ? new Date(profile.founded_date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        : null,
      team_size: profile.team_size,
      match_score: scoreEntry?.match_score ?? null,
      verification_level: verification?.verification_tier || "UNVERIFIED",
      is_connected: isConnected,
      has_founder_video: Boolean(profile.founder_video_url),
      logo_url: profile.logo_url || null,
    });
  }

  return rows;
}

export async function listSnapshots(investorUserId) {
  await ensureComparisonTables();

  const result = await pool.query(
    `
      SELECT * FROM public.comparison_snapshots
      WHERE investor_user_id = $1
      ORDER BY created_at DESC
    `,
    [investorUserId],
  );

  return result.rows;
}

export async function createSnapshot({ investorUserId, name, startupProfileIds }) {
  await ensureComparisonTables();

  const ids = [...new Set(startupProfileIds.map(String))].slice(0, 4);
  if (ids.length === 0) {
    throw new Error("At least one startup is required");
  }

  const result = await pool.query(
    `
      INSERT INTO public.comparison_snapshots
        (investor_user_id, name, startup_profile_ids)
      VALUES ($1, $2, $3::uuid[])
      RETURNING *
    `,
    [investorUserId, name.trim(), ids],
  );

  return result.rows[0];
}

export async function deleteSnapshot(snapshotId, investorUserId) {
  await ensureComparisonTables();

  const result = await pool.query(
    `
      DELETE FROM public.comparison_snapshots
      WHERE id = $1 AND investor_user_id = $2
      RETURNING id
    `,
    [snapshotId, investorUserId],
  );

  return result.rows[0] || null;
}
