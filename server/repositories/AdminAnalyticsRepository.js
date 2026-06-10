import pool from "../config/database.js";
import { ensureAiUsageTables } from "./AiUsageRepository.js";
import { ensureProfileReportTables } from "./ProfileReportRepository.js";

const monthLabel = (value) =>
  new Date(value).toLocaleDateString([], { month: "short", year: "numeric" });

export async function getUserRegistrationStats() {
  const totals = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE user_type = 'startup')::int AS startups,
      COUNT(*) FILTER (WHERE user_type = 'investor')::int AS investors,
      COUNT(*)::int AS total
    FROM public.users
  `);

  const monthly = await pool.query(`
    SELECT
      date_trunc('month', created_at) AS month_start,
      COUNT(*) FILTER (WHERE user_type = 'startup')::int AS startups,
      COUNT(*) FILTER (WHERE user_type = 'investor')::int AS investors
    FROM public.users
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month_start
    ORDER BY month_start ASC
  `);

  const rows = monthly.rows;
  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2];
  const latestTotal = (latest?.startups || 0) + (latest?.investors || 0);
  const previousTotal = (previous?.startups || 0) + (previous?.investors || 0);
  const growthRate =
    previousTotal > 0
      ? Math.round(((latestTotal - previousTotal) / previousTotal) * 100)
      : latestTotal > 0
        ? 100
        : 0;

  return {
    ...totals.rows[0],
    monthly_growth_rate: growthRate,
    registrations_per_month: rows.map((row) => ({
      label: monthLabel(row.month_start),
      startups: row.startups,
      investors: row.investors,
      value: row.startups + row.investors,
    })),
  };
}

export async function getMonthlyActiveUsers() {
  const result = await pool.query(`
    WITH active_users AS (
      SELECT investor_user_id AS user_id, last_viewed_at AS activity_at
      FROM public.startup_profile_views
      UNION ALL
      SELECT investor_user_id, started_at FROM public.pitch_deck_view_sessions
      UNION ALL
      SELECT startup_id, created_at FROM public.connections
      UNION ALL
      SELECT investor_id, created_at FROM public.connections
      UNION ALL
      SELECT investor_user_id, created_at FROM public.deal_pipeline_cards
      UNION ALL
      SELECT investor_user_id, added_at FROM public.investor_watchlist
    )
    SELECT COUNT(DISTINCT user_id)::int AS mau_30d
    FROM active_users
    WHERE activity_at >= NOW() - INTERVAL '30 days'
  `);

  return { mau_30d: result.rows[0]?.mau_30d || 0 };
}

export async function getVerificationStats() {
  const tiers = await pool.query(`
    SELECT verification_tier::text AS tier, COUNT(*)::int AS count
    FROM public.users
    GROUP BY verification_tier
    ORDER BY verification_tier
  `);

  const pending = await pool.query(`
    SELECT COUNT(*)::int AS pending_requests
    FROM public.verification_requests
    WHERE LOWER(status) = 'pending'
  `);

  return {
    by_tier: Object.fromEntries(
      tiers.rows.map((row) => [row.tier, row.count]),
    ),
    pending_requests: pending.rows[0]?.pending_requests || 0,
  };
}

export async function getConnectionsPerMonth() {
  const result = await pool.query(`
    SELECT
      date_trunc('month', updated_at) AS month_start,
      COUNT(*)::int AS value
    FROM public.connections
    WHERE LOWER(status) IN ('accepted', 'connected')
      AND updated_at >= NOW() - INTERVAL '12 months'
    GROUP BY month_start
    ORDER BY month_start ASC
  `);

  return result.rows.map((row) => ({
    label: monthLabel(row.month_start),
    value: row.value,
  }));
}

export async function getPitchDeckSessionsPerMonth() {
  const result = await pool.query(`
    SELECT
      date_trunc('month', started_at) AS month_start,
      COUNT(*)::int AS value
    FROM public.pitch_deck_view_sessions
    WHERE started_at >= NOW() - INTERVAL '12 months'
    GROUP BY month_start
    ORDER BY month_start ASC
  `);

  return result.rows.map((row) => ({
    label: monthLabel(row.month_start),
    value: row.value,
  }));
}

export async function getDataRoomActivityPerMonth() {
  const uploads = await pool.query(`
    SELECT
      date_trunc('month', created_at) AS month_start,
      COUNT(*)::int AS value
    FROM public.data_room_documents
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month_start
    ORDER BY month_start ASC
  `);

  const grants = await pool.query(`
    SELECT
      date_trunc('month', granted_at) AS month_start,
      COUNT(*)::int AS value
    FROM public.data_room_access_grants
    WHERE granted_at >= NOW() - INTERVAL '12 months'
      AND revoked_at IS NULL
    GROUP BY month_start
    ORDER BY month_start ASC
  `);

  return {
    uploads_per_month: uploads.rows.map((row) => ({
      label: monthLabel(row.month_start),
      value: row.value,
    })),
    grants_per_month: grants.rows.map((row) => ({
      label: monthLabel(row.month_start),
      value: row.value,
    })),
  };
}

export async function getFeatureAdoptionRates() {
  const result = await pool.query(`
    WITH mau AS (
      SELECT COUNT(DISTINCT user_id)::float AS total
      FROM (
        SELECT investor_user_id AS user_id, started_at AS activity_at
        FROM public.pitch_deck_view_sessions
        UNION ALL
        SELECT investor_user_id, last_viewed_at FROM public.startup_profile_views
        UNION ALL
        SELECT investor_id, created_at FROM public.connections
        UNION ALL
        SELECT startup_id, created_at FROM public.connections
      ) recent
      WHERE activity_at >= NOW() - INTERVAL '30 days'
    )
    SELECT
      ROUND(100.0 * (SELECT COUNT(DISTINCT investor_user_id) FROM public.investor_watchlist) / NULLIF((SELECT total FROM mau), 0))::int AS watchlist_pct,
      ROUND(100.0 * (SELECT COUNT(DISTINCT investor_user_id) FROM public.deal_pipeline_cards) / NULLIF((SELECT total FROM mau), 0))::int AS pipeline_pct,
      ROUND(100.0 * (SELECT COUNT(DISTINCT created_by) FROM public.dd_checklists) / NULLIF((SELECT total FROM mau), 0))::int AS dd_checklist_pct,
      ROUND(100.0 * (SELECT COUNT(DISTINCT investor_user_id) FROM public.pitch_deck_view_sessions WHERE started_at >= NOW() - INTERVAL '30 days') / NULLIF((SELECT total FROM mau), 0))::int AS pitch_deck_review_pct,
      ROUND(100.0 * (SELECT COUNT(DISTINCT startup_profile_id) FROM public.data_room_documents) / NULLIF((SELECT COUNT(*) FROM public.users WHERE user_type = 'startup'), 0))::int AS data_room_pct
  `);

  const row = result.rows[0] || {};
  return {
    watchlist: row.watchlist_pct,
    deal_pipeline: row.pipeline_pct,
    due_diligence: row.dd_checklist_pct,
    pitch_deck_review: row.pitch_deck_review_pct,
    data_room: row.data_room_pct,
    mau_basis: "30-day active users",
  };
}

export async function getAiUsagePerMonth() {
  await ensureAiUsageTables();

  const result = await pool.query(`
    SELECT
      feature,
      date_trunc('month', created_at) AS month_start,
      COUNT(*)::int AS value
    FROM public.ai_usage_log
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY feature, month_start
    ORDER BY month_start ASC, feature ASC
  `);

  const byFeature = {};
  for (const row of result.rows) {
    if (!byFeature[row.feature]) {
      byFeature[row.feature] = [];
    }
    byFeature[row.feature].push({
      label: monthLabel(row.month_start),
      value: row.value,
    });
  }

  const totals = await pool.query(`
    SELECT feature, COUNT(*)::int AS total
    FROM public.ai_usage_log
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY feature
    ORDER BY total DESC
  `);

  return {
    by_feature_per_month: byFeature,
    last_30_days: Object.fromEntries(
      totals.rows.map((row) => [row.feature, row.total]),
    ),
  };
}

export async function getFraudReportRate() {
  await ensureProfileReportTables();

  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS reports_30d,
      (SELECT COUNT(*)::int FROM public.users) AS total_users,
      (SELECT mau_30d FROM (
        WITH active_users AS (
          SELECT investor_user_id AS user_id, started_at AS activity_at
          FROM public.pitch_deck_view_sessions
          UNION ALL
          SELECT investor_id, created_at FROM public.connections
        )
        SELECT COUNT(DISTINCT user_id)::int AS mau_30d
        FROM active_users
        WHERE activity_at >= NOW() - INTERVAL '30 days'
      ) mau) AS mau_30d
    FROM public.profile_reports
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

  const row = result.rows[0] || {};
  const denominator = row.mau_30d || row.total_users || 0;
  const rate =
    denominator > 0
      ? Math.round(((row.reports_30d || 0) / denominator) * 1000) / 10
      : null;

  return {
    reports_last_30_days: row.reports_30d || 0,
    rate_per_100_users: rate,
  };
}
