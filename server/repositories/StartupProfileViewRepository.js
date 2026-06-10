import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureStartupProfileViewTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.startup_profile_views (
        startup_profile_id UUID NOT NULL
          REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        investor_user_id UUID NOT NULL
          REFERENCES public.users(id) ON DELETE CASCADE,
        view_date DATE NOT NULL DEFAULT CURRENT_DATE,
        view_count INTEGER NOT NULL DEFAULT 1,
        first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT startup_profile_views_pkey
          PRIMARY KEY (startup_profile_id, investor_user_id, view_date)
      );

      CREATE INDEX IF NOT EXISTS idx_startup_profile_views_startup_date
        ON public.startup_profile_views (startup_profile_id, view_date DESC);

      CREATE INDEX IF NOT EXISTS idx_startup_profile_views_investor
        ON public.startup_profile_views (investor_user_id, last_viewed_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function recordStartupProfileView(startupProfileId, investorUserId) {
  await ensureStartupProfileViewTables();

  const result = await pool.query(
    `
      INSERT INTO public.startup_profile_views
        (startup_profile_id, investor_user_id, view_date, view_count, first_viewed_at, last_viewed_at)
      VALUES ($1, $2, CURRENT_DATE, 1, NOW(), NOW())
      ON CONFLICT (startup_profile_id, investor_user_id, view_date)
      DO UPDATE SET
        view_count = public.startup_profile_views.view_count + 1,
        last_viewed_at = NOW()
      RETURNING *
    `,
    [startupProfileId, investorUserId],
  );

  return result.rows[0];
}

export async function countProfileViews(
  startupProfileId,
  { since = null, until = null } = {},
) {
  await ensureStartupProfileViewTables();

  const conditions = ["startup_profile_id = $1"];
  const values = [startupProfileId];
  let idx = 2;

  if (since) {
    conditions.push(`last_viewed_at >= $${idx}`);
    values.push(since);
    idx += 1;
  }
  if (until) {
    conditions.push(`last_viewed_at < $${idx}`);
    values.push(until);
    idx += 1;
  }

  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(view_count), 0)::int AS total_views,
        COUNT(DISTINCT investor_user_id)::int AS unique_investors
      FROM public.startup_profile_views
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  return result.rows[0];
}

export async function profileViewTrendBuckets(
  startupProfileId,
  { since = null, bucket = "week" } = {},
) {
  await ensureStartupProfileViewTables();

  const trunc = bucket === "day" ? "day" : "week";
  const values = [startupProfileId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = `AND last_viewed_at >= $2`;
  }

  const result = await pool.query(
    `
      SELECT
        date_trunc('${trunc}', last_viewed_at) AS bucket_start,
        COALESCE(SUM(view_count), 0)::int AS value
      FROM public.startup_profile_views
      WHERE startup_profile_id = $1 ${sinceClause}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC
    `,
    values,
  );

  return result.rows;
}
