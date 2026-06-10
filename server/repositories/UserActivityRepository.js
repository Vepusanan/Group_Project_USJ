import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureUserActivityColumns = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS inactive_cleanup_notice_at TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN IF NOT EXISTS fraud_flagged BOOLEAN NOT NULL DEFAULT FALSE;
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function touchUserActivity(userId) {
  if (!userId) return;
  await ensureUserActivityColumns();
  await pool.query(
    `UPDATE public.users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [userId],
  );
}

export async function logAuthEvent({ userId = null, eventType, clientIp = null }) {
  await ensureUserActivityColumns();
  await pool
    .query(
      `
        INSERT INTO public.auth_event_log (user_id, event_type, client_ip)
        VALUES ($1, $2, $3)
      `,
      [userId, eventType, clientIp],
    )
    .catch(() => undefined);
}

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
};
