import pool from "../config/database.js";

export const INTENT_LEVELS = ["WATCHING", "INTERESTED", "PASSED"];
export const INTENT_LEVEL_SET = new Set(INTENT_LEVELS);

let tablesReadyPromise = null;

export const ensureInvestorIntentTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.investor_startup_intents (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        intent_level VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT investor_startup_intents_pkey PRIMARY KEY (id),
        CONSTRAINT investor_startup_intents_connection_unique UNIQUE (connection_id)
      );
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function getIntentMapForInvestor(investorUserId) {
  await ensureInvestorIntentTables();
  if (!investorUserId) return new Map();

  const result = await pool.query(
    `
      SELECT connection_id::text AS connection_id, intent_level, updated_at
      FROM public.investor_startup_intents
      WHERE investor_user_id = $1
    `,
    [investorUserId],
  );

  return new Map(
    result.rows.map((row) => [
      row.connection_id,
      { intent_level: row.intent_level, updated_at: row.updated_at },
    ]),
  );
}

export async function upsertInvestorIntent({
  investorUserId,
  connectionId,
  startupProfileId,
  intentLevel,
}) {
  await ensureInvestorIntentTables();

  const result = await pool.query(
    `
      INSERT INTO public.investor_startup_intents
        (investor_user_id, connection_id, startup_profile_id, intent_level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (connection_id)
      DO UPDATE SET
        intent_level = EXCLUDED.intent_level,
        updated_at = CURRENT_TIMESTAMP
      WHERE public.investor_startup_intents.investor_user_id = EXCLUDED.investor_user_id
      RETURNING *
    `,
    [investorUserId, connectionId, startupProfileId, intentLevel],
  );

  return result.rows[0] || null;
}

export async function deleteInvestorIntent(investorUserId, connectionId) {
  await ensureInvestorIntentTables();

  const result = await pool.query(
    `
      DELETE FROM public.investor_startup_intents
      WHERE investor_user_id = $1 AND connection_id = $2
      RETURNING id
    `,
    [investorUserId, connectionId],
  );

  return result.rows[0] || null;
}

export async function getIntentForConnection(investorUserId, connectionId) {
  await ensureInvestorIntentTables();

  const result = await pool.query(
    `
      SELECT intent_level, updated_at
      FROM public.investor_startup_intents
      WHERE investor_user_id = $1 AND connection_id = $2
    `,
    [investorUserId, connectionId],
  );

  return result.rows[0] || null;
}

export async function assertInvestorOwnsConnection(investorUserId, connectionId) {
  const result = await pool.query(
    `
      SELECT c.id, sp.startup_profile_id
      FROM public.connections c
      JOIN public.startup_profiles sp ON sp.user_id = c.startup_id
      WHERE c.id = $1
        AND c.investor_id = $2
        AND LOWER(c.status) IN ('accepted', 'connected')
    `,
    [connectionId, investorUserId],
  );

  return result.rows[0] || null;
}
