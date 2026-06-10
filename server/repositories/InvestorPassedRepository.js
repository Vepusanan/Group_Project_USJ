import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureInvestorPassedTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.investor_passed_startups (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        passed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT investor_passed_startups_pkey PRIMARY KEY (id),
        CONSTRAINT investor_passed_startups_unique_pair UNIQUE (investor_user_id, startup_profile_id)
      );
      CREATE INDEX IF NOT EXISTS idx_investor_passed_startups_investor
        ON public.investor_passed_startups (investor_user_id);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function passStartupForInvestor(investorUserId, startupProfileId) {
  await ensureInvestorPassedTables();

  const result = await pool.query(
    `
      INSERT INTO public.investor_passed_startups (investor_user_id, startup_profile_id)
      VALUES ($1, $2)
      ON CONFLICT (investor_user_id, startup_profile_id)
      DO UPDATE SET passed_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0] || null;
}

export async function removePassedStartup(investorUserId, startupProfileId) {
  await ensureInvestorPassedTables();

  const result = await pool.query(
    `
      DELETE FROM public.investor_passed_startups
      WHERE investor_user_id = $1 AND startup_profile_id = $2
      RETURNING id
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0] || null;
}

export async function getPassedStartupIdsForInvestor(investorUserId) {
  await ensureInvestorPassedTables();
  if (!investorUserId) return new Set();

  const result = await pool.query(
    `
      SELECT startup_profile_id::text AS startup_profile_id
      FROM public.investor_passed_startups
      WHERE investor_user_id = $1
    `,
    [investorUserId],
  );

  return new Set(result.rows.map((row) => row.startup_profile_id));
}

export async function listPassedStartupsForInvestor(investorUserId) {
  await ensureInvestorPassedTables();
  if (!investorUserId) return [];

  const result = await pool.query(
    `
      SELECT
        ips.id,
        ips.startup_profile_id,
        ips.passed_at,
        sp.company_name AS startup_name,
        sp.logo_url AS startup_logo_url,
        sp.industry,
        sp.funding_stage
      FROM public.investor_passed_startups ips
      JOIN public.startup_profiles sp ON sp.startup_profile_id = ips.startup_profile_id
      WHERE ips.investor_user_id = $1
      ORDER BY ips.passed_at DESC
    `,
    [investorUserId],
  );

  return result.rows;
}
