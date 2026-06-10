import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureWatchlistTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.investor_watchlist (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        added_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT investor_watchlist_pkey PRIMARY KEY (id),
        CONSTRAINT investor_watchlist_unique_pair UNIQUE (investor_user_id, startup_profile_id)
      );
      CREATE INDEX IF NOT EXISTS idx_investor_watchlist_user
        ON public.investor_watchlist (investor_user_id, added_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function addToWatchlist(investorUserId, startupProfileId) {
  await ensureWatchlistTables();

  const result = await pool.query(
    `
      INSERT INTO public.investor_watchlist (investor_user_id, startup_profile_id)
      VALUES ($1, $2)
      ON CONFLICT (investor_user_id, startup_profile_id) DO UPDATE SET added_at = investor_watchlist.added_at
      RETURNING *
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0];
}

export async function removeFromWatchlist(investorUserId, startupProfileId) {
  await ensureWatchlistTables();

  const result = await pool.query(
    `
      DELETE FROM public.investor_watchlist
      WHERE investor_user_id = $1 AND startup_profile_id = $2
      RETURNING id
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0] || null;
}

export async function isOnWatchlist(investorUserId, startupProfileId) {
  await ensureWatchlistTables();

  const result = await pool.query(
    `
      SELECT id, added_at FROM public.investor_watchlist
      WHERE investor_user_id = $1 AND startup_profile_id = $2
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0] || null;
}

export async function listWatchlistForInvestor(investorUserId) {
  await ensureWatchlistTables();

  const result = await pool.query(
    `
      SELECT
        w.id,
        w.added_at,
        sp.startup_profile_id,
        sp.user_id AS startup_user_id,
        sp.company_name,
        sp.tagline,
        sp.detailed_description,
        sp.industry,
        sp.funding_stage,
        sp.revenue_status,
        sp.location_city,
        sp.location_country,
        sp.logo_url,
        sp.current_stage,
        sp.team_size,
        u.verification_tier
      FROM public.investor_watchlist w
      JOIN public.startup_profiles sp ON sp.startup_profile_id = w.startup_profile_id
      JOIN public.users u ON u.id = sp.user_id
      WHERE w.investor_user_id = $1
      ORDER BY w.added_at DESC
    `,
    [investorUserId],
  );

  return result.rows;
}

export async function getWatchlistIdsForInvestor(investorUserId, startupProfileIds = []) {
  await ensureWatchlistTables();

  if (!startupProfileIds.length) return new Set();

  const result = await pool.query(
    `
      SELECT startup_profile_id
      FROM public.investor_watchlist
      WHERE investor_user_id = $1
        AND startup_profile_id = ANY($2::uuid[])
    `,
    [investorUserId, startupProfileIds],
  );

  return new Set(result.rows.map((row) => String(row.startup_profile_id)));
}
