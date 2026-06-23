import pool from "../config/database.js";

export const PROFILE_INTENT_LEVELS = ["WATCHING", "INTERESTED"];
export const PROFILE_INTENT_SET = new Set(PROFILE_INTENT_LEVELS);

let tablesReadyPromise = null;

export const ensureInvestorProfileIntentTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.investor_profile_intents (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        intent_level VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT investor_profile_intents_pkey PRIMARY KEY (id),
        CONSTRAINT investor_profile_intents_unique UNIQUE (investor_user_id, startup_profile_id)
      );
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function upsertProfileIntent({
  investorUserId,
  startupProfileId,
  intentLevel,
}) {
  await ensureInvestorProfileIntentTables();

  const result = await pool.query(
    `
      INSERT INTO public.investor_profile_intents
        (investor_user_id, startup_profile_id, intent_level)
      VALUES ($1, $2, $3)
      ON CONFLICT (investor_user_id, startup_profile_id)
      DO UPDATE SET
        intent_level = EXCLUDED.intent_level,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
    [investorUserId, startupProfileId, intentLevel],
  );

  return result.rows[0];
}

export async function deleteProfileIntent(investorUserId, startupProfileId) {
  await ensureInvestorProfileIntentTables();

  const result = await pool.query(
    `
      DELETE FROM public.investor_profile_intents
      WHERE investor_user_id = $1 AND startup_profile_id = $2
      RETURNING id
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0] || null;
}

export async function getProfileIntent(investorUserId, startupProfileId) {
  await ensureInvestorProfileIntentTables();

  const result = await pool.query(
    `
      SELECT * FROM public.investor_profile_intents
      WHERE investor_user_id = $1 AND startup_profile_id = $2
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0] || null;
}

export async function listDiscoveredProfileIntentsForInvestor(investorUserId) {
  await ensureInvestorProfileIntentTables();

  const result = await pool.query(
    `
      SELECT
        ipi.startup_profile_id,
        ipi.intent_level,
        ipi.updated_at,
        sp.company_name AS startup_name,
        sp.logo_url AS startup_logo_url,
        sp.industry,
        sp.funding_stage
      FROM public.investor_profile_intents ipi
      JOIN public.startup_profiles sp ON sp.startup_profile_id = ipi.startup_profile_id
      WHERE ipi.investor_user_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM public.connections c
          JOIN public.startup_profiles sp2 ON sp2.user_id = c.startup_id
          WHERE c.investor_id = $1
            AND sp2.startup_profile_id = ipi.startup_profile_id
            AND LOWER(c.status) IN ('accepted', 'connected')
        )
      ORDER BY ipi.updated_at DESC
    `,
    [investorUserId],
  );

  return result.rows;
}
