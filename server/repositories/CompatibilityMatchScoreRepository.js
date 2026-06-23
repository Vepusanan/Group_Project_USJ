import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureCompatibilityTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool.query(`
    CREATE TABLE IF NOT EXISTS public.compatibility_match_scores (
      id UUID NOT NULL DEFAULT gen_random_uuid(),
      investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
      match_score SMALLINT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
      dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
      calculated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT compatibility_match_scores_pkey PRIMARY KEY (id),
      CONSTRAINT compatibility_match_scores_unique_pair UNIQUE (investor_user_id, startup_profile_id)
    );

    CREATE INDEX IF NOT EXISTS idx_compatibility_match_scores_investor_score
      ON public.compatibility_match_scores (investor_user_id, match_score DESC);

    CREATE INDEX IF NOT EXISTS idx_compatibility_match_scores_startup
      ON public.compatibility_match_scores (startup_profile_id);

    CREATE TABLE IF NOT EXISTS public.compatibility_match_analytics (
      id UUID NOT NULL DEFAULT gen_random_uuid(),
      score SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100),
      dimension_avg JSONB NOT NULL DEFAULT '{}'::jsonb,
      recorded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT compatibility_match_analytics_pkey PRIMARY KEY (id)
    );
  `).then(() => undefined);

  return tablesReadyPromise;
};

export async function getMatchScoresForInvestor(investorUserId, startupProfileIds = []) {
  await ensureCompatibilityTables();

  if (!investorUserId || startupProfileIds.length === 0) {
    return new Map();
  }

  const result = await pool.query(
    `
      SELECT startup_profile_id::text AS startup_profile_id,
             match_score,
             dimension_scores,
             calculated_at
      FROM public.compatibility_match_scores
      WHERE investor_user_id = $1
        AND startup_profile_id::text = ANY($2::text[])
    `,
    [investorUserId, startupProfileIds],
  );

  return new Map(
    result.rows.map((row) => [
      row.startup_profile_id,
      {
        match_score: row.match_score,
        dimension_scores: row.dimension_scores,
        calculated_at: row.calculated_at,
      },
    ]),
  );
}

export async function upsertMatchScores(investorUserId, scoreRows = []) {
  await ensureCompatibilityTables();

  if (!investorUserId || scoreRows.length === 0) return;

  const values = [];
  const placeholders = scoreRows.map((row, index) => {
    const base = index * 4;
    values.push(
      investorUserId,
      row.startup_profile_id,
      row.match_score,
      JSON.stringify(row.dimension_scores || {}),
    );
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::jsonb, CURRENT_TIMESTAMP)`;
  });

  await pool.query(
    `
      INSERT INTO public.compatibility_match_scores
        (investor_user_id, startup_profile_id, match_score, dimension_scores, calculated_at)
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (investor_user_id, startup_profile_id)
      DO UPDATE SET
        match_score = EXCLUDED.match_score,
        dimension_scores = EXCLUDED.dimension_scores,
        calculated_at = CURRENT_TIMESTAMP
    `,
    values,
  );
}

export async function recordAggregateAnalytics(scoreRows = []) {
  await ensureCompatibilityTables();
  if (scoreRows.length === 0) return;

  const values = [];
  const placeholders = scoreRows.map((row, index) => {
    const base = index * 2;
    values.push(row.match_score, JSON.stringify(row.dimension_scores || {}));
    return `($${base + 1}, $${base + 2}::jsonb)`;
  });

  await pool.query(
    `
      INSERT INTO public.compatibility_match_analytics (score, dimension_avg)
      VALUES ${placeholders.join(", ")}
    `,
    values,
  );
}

export async function deleteScoresForInvestor(investorUserId) {
  await ensureCompatibilityTables();
  if (!investorUserId) return;

  await pool.query(
    `DELETE FROM public.compatibility_match_scores WHERE investor_user_id = $1`,
    [investorUserId],
  );
}

export async function deleteScoresForStartup(startupProfileId) {
  await ensureCompatibilityTables();
  if (!startupProfileId) return;

  await pool.query(
    `DELETE FROM public.compatibility_match_scores WHERE startup_profile_id = $1`,
    [startupProfileId],
  );
}

export async function listStaleStartupProfilesForInvestor(
  investorUserId,
  investorUpdatedAt,
) {
  await ensureCompatibilityTables();
  if (!investorUserId) return [];

  const result = await pool.query(
    `
      SELECT sp.*
      FROM public.startup_profiles sp
      LEFT JOIN public.privacy_settings ps ON ps.user_id = sp.user_id
      LEFT JOIN public.compatibility_match_scores cms
        ON cms.startup_profile_id = sp.startup_profile_id
       AND cms.investor_user_id = $1
      WHERE COALESCE(ps.profile_visibility, 'public') = 'public'
        AND (
          cms.id IS NULL
          OR cms.calculated_at < GREATEST(
            COALESCE(sp.updated_at, sp.created_at),
            COALESCE($2::timestamp, sp.created_at)
          )
        )
    `,
    [investorUserId, investorUpdatedAt || null],
  );

  return result.rows;
}
