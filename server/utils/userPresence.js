import pool from "../config/database.js";

const ACTIVE_WINDOW_MINUTES = 2;

export async function recordUserPresence(userId) {
  await pool.query(
    `INSERT INTO user_presence (user_id, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET last_seen_at = NOW()`,
    [userId],
  );
}

export async function isUserRecentlyActive(userId) {
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
