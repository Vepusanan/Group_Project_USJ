import pool from "../config/database.js";
import { ensurePitchDeckSessionTables } from "./PitchDeckViewSessionRepository.js";

export async function countPitchDeckViews(
  startupProfileId,
  { since = null, until = null } = {},
) {
  await ensurePitchDeckSessionTables();

  const conditions = ["startup_profile_id = $1"];
  const values = [startupProfileId];
  let idx = 2;

  if (since) {
    conditions.push(`started_at >= $${idx}`);
    values.push(since);
    idx += 1;
  }
  if (until) {
    conditions.push(`started_at < $${idx}`);
    values.push(until);
    idx += 1;
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_views,
        COUNT(DISTINCT investor_user_id)::int AS unique_investors,
        ROUND(AVG(NULLIF(total_duration_ms, 0)))::int AS avg_duration_ms
      FROM public.pitch_deck_view_sessions
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  return result.rows[0];
}

export async function countProfileViewToConnectionConversion(
  startupProfileId,
  startupUserId,
  { since = null, until = null } = {},
) {
  const conditions = ["spv.startup_profile_id = $1"];
  const values = [startupProfileId, startupUserId];
  let idx = 3;

  if (since) {
    conditions.push(`spv.last_viewed_at >= $${idx}`);
    values.push(since);
    idx += 1;
  }
  if (until) {
    conditions.push(`spv.last_viewed_at < $${idx}`);
    values.push(until);
    idx += 1;
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(DISTINCT spv.investor_user_id)::int AS unique_viewers,
        COUNT(DISTINCT spv.investor_user_id) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM public.connections c
            WHERE c.startup_id = $2
              AND c.investor_id = spv.investor_user_id
              AND c.requester_id = spv.investor_user_id
          )
        )::int AS viewers_who_requested
      FROM public.startup_profile_views spv
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  const row = result.rows[0] || {};
  const uniqueViewers = row.unique_viewers || 0;
  const viewersWhoRequested = row.viewers_who_requested || 0;

  return {
    unique_viewers: uniqueViewers,
    viewers_who_requested: viewersWhoRequested,
    conversion_rate:
      uniqueViewers > 0
        ? Math.round((viewersWhoRequested / uniqueViewers) * 100)
        : null,
  };
}

export async function pitchDeckViewTrendBuckets(
  startupProfileId,
  { since = null, bucket = "week" } = {},
) {
  await ensurePitchDeckSessionTables();

  const trunc = bucket === "day" ? "day" : "week";
  const values = [startupProfileId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = `AND started_at >= $2`;
  }

  const result = await pool.query(
    `
      SELECT
        date_trunc('${trunc}', started_at) AS bucket_start,
        COUNT(*)::int AS value
      FROM public.pitch_deck_view_sessions
      WHERE startup_profile_id = $1 ${sinceClause}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC
    `,
    values,
  );

  return result.rows;
}

export async function pitchDeckViewsByConnectedInvestor(
  startupProfileId,
  startupUserId,
  { since = null } = {},
) {
  await ensurePitchDeckSessionTables();

  const values = [startupProfileId, startupUserId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = `AND p.started_at >= $3`;
  }

  const result = await pool.query(
    `
      SELECT
        p.investor_user_id,
        u.full_name AS investor_name,
        ip.investor_profile_id,
        COUNT(*)::int AS view_count,
        GREATEST(COUNT(*) - 1, 0)::int AS revisit_count,
        COUNT(*) FILTER (WHERE p.completed = true)::int AS completed_sessions,
        MAX(p.started_at) AS last_viewed_at,
        COALESCE(SUM(p.total_duration_ms), 0)::int AS total_duration_ms
      FROM public.pitch_deck_view_sessions p
      JOIN public.users u ON u.id = p.investor_user_id
      LEFT JOIN public.investor_profiles ip ON ip.user_id = p.investor_user_id
      JOIN public.connections c
        ON c.investor_id = p.investor_user_id
        AND c.startup_id = $2
        AND LOWER(c.status) IN ('accepted', 'connected')
      WHERE p.startup_profile_id = $1 ${sinceClause}
      GROUP BY p.investor_user_id, u.full_name, ip.investor_profile_id
      ORDER BY view_count DESC, last_viewed_at DESC
    `,
    values,
  );

  return result.rows;
}

export async function getLastPitchDeckViewDate(startupProfileId) {
  await ensurePitchDeckSessionTables();

  const result = await pool.query(
    `
      SELECT MAX(started_at) AS last_viewed_at
      FROM public.pitch_deck_view_sessions
      WHERE startup_profile_id = $1
    `,
    [startupProfileId],
  );

  return result.rows[0]?.last_viewed_at || null;
}

export async function countConnectionMetrics(
  startupUserId,
  { since = null, until = null } = {},
) {
  const receivedConditions = [
    "c.startup_id = $1",
    "c.requester_id IS NOT NULL",
    "c.requester_id != $1",
  ];
  const values = [startupUserId];
  let idx = 2;

  if (since) {
    receivedConditions.push(`c.created_at >= $${idx}`);
    values.push(since);
    idx += 1;
  }
  if (until) {
    receivedConditions.push(`c.created_at < $${idx}`);
    values.push(until);
    idx += 1;
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS received,
        COUNT(*) FILTER (
          WHERE LOWER(c.status) IN ('accepted', 'connected')
        )::int AS accepted
      FROM public.connections c
      WHERE ${receivedConditions.join(" AND ")}
    `,
    values,
  );

  const activeResult = await pool.query(
    `
      SELECT COUNT(*)::int AS active
      FROM public.connections c
      WHERE c.startup_id = $1
        AND LOWER(c.status) IN ('accepted', 'connected')
    `,
    [startupUserId],
  );

  const newlyAcceptedConditions = [
    "c.startup_id = $1",
    "LOWER(c.status) IN ('accepted', 'connected')",
  ];
  const newlyValues = [startupUserId];
  let newlyIdx = 2;

  if (since) {
    newlyAcceptedConditions.push(`c.updated_at >= $${newlyIdx}`);
    newlyValues.push(since);
    newlyIdx += 1;
  }
  if (until) {
    newlyAcceptedConditions.push(`c.updated_at < $${newlyIdx}`);
    newlyValues.push(until);
    newlyIdx += 1;
  }

  const newlyAcceptedResult = await pool.query(
    `
      SELECT COUNT(*)::int AS newly_accepted
      FROM public.connections c
      WHERE ${newlyAcceptedConditions.join(" AND ")}
    `,
    newlyValues,
  );

  return {
    received: result.rows[0]?.received || 0,
    accepted: result.rows[0]?.accepted || 0,
    active_connected: activeResult.rows[0]?.active || 0,
    newly_accepted: newlyAcceptedResult.rows[0]?.newly_accepted || 0,
  };
}

export async function connectionTrendBuckets(
  startupUserId,
  { since = null, bucket = "week", metric = "received" } = {},
) {
  const trunc = bucket === "day" ? "day" : "week";
  const values = [startupUserId];
  let filterClause = `AND c.requester_id IS NOT NULL AND c.requester_id != $1`;
  let dateColumn = "c.created_at";

  if (metric === "active") {
    filterClause = `AND LOWER(c.status) IN ('accepted', 'connected')`;
  } else if (metric === "accepted") {
    filterClause = `AND LOWER(c.status) IN ('accepted', 'connected')`;
    dateColumn = "c.updated_at";
  }

  let sinceClause = "";
  if (since) {
    values.push(since);
    sinceClause = `AND ${dateColumn} >= $2`;
  }

  const result = await pool.query(
    `
      SELECT
        date_trunc('${trunc}', ${dateColumn}) AS bucket_start,
        COUNT(*)::int AS value
      FROM public.connections c
      WHERE c.startup_id = $1 ${filterClause} ${sinceClause}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC
    `,
    values,
  );

  return result.rows;
}

export async function countDataRoomGrants(
  startupProfileId,
  { since = null, until = null } = {},
) {
  const conditions = [
    "startup_profile_id = $1",
    "revoked_at IS NULL",
  ];
  const values = [startupProfileId];
  let idx = 2;

  if (since) {
    conditions.push(`granted_at >= $${idx}`);
    values.push(since);
    idx += 1;
  }
  if (until) {
    conditions.push(`granted_at < $${idx}`);
    values.push(until);
    idx += 1;
  }

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS grant_count
      FROM public.data_room_access_grants
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  return result.rows[0];
}

export async function dataRoomGrantTrendBuckets(
  startupProfileId,
  { since = null, bucket = "week" } = {},
) {
  const trunc = bucket === "day" ? "day" : "week";
  const values = [startupProfileId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = `AND granted_at >= $2`;
  }

  const result = await pool.query(
    `
      SELECT
        date_trunc('${trunc}', granted_at) AS bucket_start,
        COUNT(*)::int AS value
      FROM public.data_room_access_grants
      WHERE startup_profile_id = $1 AND revoked_at IS NULL ${sinceClause}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC
    `,
    values,
  );

  return result.rows;
}

export async function countPendingConnectionRequests(startupUserId) {
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS pending
      FROM public.connections c
      WHERE c.startup_id = $1
        AND LOWER(c.status) = 'pending'
        AND c.requester_id IS NOT NULL
        AND c.requester_id != $1
    `,
    [startupUserId],
  );

  return result.rows[0]?.pending || 0;
}

export async function countDataRoomDocuments(startupProfileId) {
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS document_count
      FROM public.data_room_documents
      WHERE startup_profile_id = $1
    `,
    [startupProfileId],
  );

  return result.rows[0]?.document_count || 0;
}

export async function getPlatformAverageProfileCompletion() {
  const result = await pool.query(`
    SELECT AVG(
      (
        CASE WHEN company_name IS NOT NULL AND TRIM(company_name) <> '' THEN 1 ELSE 0 END +
        CASE WHEN founder_names IS NOT NULL AND TRIM(founder_names) <> '' THEN 1 ELSE 0 END +
        CASE WHEN tagline IS NOT NULL AND TRIM(tagline) <> '' THEN 1 ELSE 0 END +
        CASE WHEN detailed_description IS NOT NULL AND TRIM(detailed_description) <> '' THEN 1 ELSE 0 END +
        CASE WHEN industry IS NOT NULL AND TRIM(industry) <> '' THEN 1 ELSE 0 END +
        CASE WHEN founded_date IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN current_stage IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN team_size IS NOT NULL AND team_size > 0 THEN 1 ELSE 0 END +
        CASE WHEN funding_stage IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN amount_seeking IS NOT NULL AND amount_seeking > 0 THEN 1 ELSE 0 END +
        CASE WHEN use_of_funds IS NOT NULL AND TRIM(use_of_funds) <> '' THEN 1 ELSE 0 END +
        CASE WHEN revenue_status IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN primary_contact_name IS NOT NULL AND TRIM(primary_contact_name) <> '' THEN 1 ELSE 0 END +
        CASE WHEN contact_email IS NOT NULL AND TRIM(contact_email) <> '' THEN 1 ELSE 0 END +
        CASE WHEN key_team_members IS NOT NULL AND TRIM(key_team_members) <> '' THEN 1 ELSE 0 END +
        CASE WHEN previous_funding IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN key_metrics IS NOT NULL AND TRIM(key_metrics) <> '' THEN 1 ELSE 0 END +
        CASE WHEN major_achievements IS NOT NULL AND TRIM(major_achievements) <> '' THEN 1 ELSE 0 END +
        CASE WHEN customer_testimonials IS NOT NULL AND TRIM(customer_testimonials) <> '' THEN 1 ELSE 0 END +
        CASE WHEN team_photo_url IS NOT NULL AND TRIM(team_photo_url) <> '' THEN 1 ELSE 0 END +
        CASE WHEN pitch_deck_url IS NOT NULL AND TRIM(pitch_deck_url) <> '' THEN 1 ELSE 0 END +
        CASE WHEN business_plan_url IS NOT NULL AND TRIM(business_plan_url) <> '' THEN 1 ELSE 0 END +
        CASE WHEN product_demo_url IS NOT NULL AND TRIM(product_demo_url) <> '' THEN 1 ELSE 0 END +
        CASE WHEN founder_video_url IS NOT NULL AND TRIM(founder_video_url) <> '' THEN 1 ELSE 0 END +
        CASE WHEN phone_number IS NOT NULL AND TRIM(phone_number) <> '' THEN 1 ELSE 0 END +
        CASE WHEN social_media_links IS NOT NULL AND social_media_links::text <> '{}' AND social_media_links::text <> 'null' THEN 1 ELSE 0 END
      )::float / 26.0 * 100
    ) AS avg_completion
    FROM public.startup_profiles
  `);

  const avg = Number(result.rows[0]?.avg_completion);
  return Number.isFinite(avg) ? Math.round(avg) : 0;
}
