import pool from "../config/database.js";

const ACTIVE_WINDOW_MINUTES = 2;

let ensurePromise = null;

async function ensurePresenceTable() {
  if (ensurePromise) return ensurePromise;
  ensurePromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.user_presence (
        user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    .then(() => undefined)
    .catch(() => undefined);
  return ensurePromise;
}

export async function recordUserPresence(userId) {
  await ensurePresenceTable();
  await pool.query(
    `INSERT INTO user_presence (user_id, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET last_seen_at = NOW()`,
    [userId],
  );
}

export async function isUserRecentlyActive(userId) {
  await ensurePresenceTable();
  const result = await pool.query(
    `SELECT 1
     FROM user_presence
     WHERE user_id = $1
       AND last_seen_at > NOW() - ($2::text || ' minutes')::interval
     LIMIT 1`,
    [userId, ACTIVE_WINDOW_MINUTES],
  );
  return result.rows.length > 0;
}
