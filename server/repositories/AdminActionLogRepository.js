import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureAdminActionLogTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.admin_action_log (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        action_type VARCHAR(60) NOT NULL,
        target_type VARCHAR(60),
        target_id UUID,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        client_ip VARCHAR(64),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT admin_action_log_pkey PRIMARY KEY (id)
      );
      CREATE INDEX IF NOT EXISTS idx_admin_action_log_created
        ON public.admin_action_log (created_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function logAdminAction({
  adminUserId,
  actionType,
  targetType = null,
  targetId = null,
  metadata = {},
  clientIp = null,
}) {
  await ensureAdminActionLogTables();

  await pool.query(
    `
      INSERT INTO public.admin_action_log
        (admin_user_id, action_type, target_type, target_id, metadata, client_ip)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
    `,
    [
      adminUserId,
      actionType,
      targetType,
      targetId,
      JSON.stringify(metadata),
      clientIp,
    ],
  );
}
