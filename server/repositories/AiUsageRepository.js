import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureAiUsageTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.ai_usage_log (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        feature VARCHAR(50) NOT NULL,
        user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT ai_usage_log_pkey PRIMARY KEY (id)
      );
      CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature_month
        ON public.ai_usage_log (feature, created_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function logAiUsage(feature, userId = null) {
  await ensureAiUsageTables();
  await pool.query(
    `INSERT INTO public.ai_usage_log (feature, user_id) VALUES ($1, $2)`,
    [feature, userId],
  );
}
