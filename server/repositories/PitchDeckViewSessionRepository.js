import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensurePitchDeckSessionTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.pitch_deck_view_sessions (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP WITHOUT TIME ZONE,
        completed BOOLEAN NOT NULL DEFAULT false,
        pages_viewed JSONB NOT NULL DEFAULT '[]'::jsonb,
        time_per_page_ms JSONB NOT NULL DEFAULT '{}'::jsonb,
        total_duration_ms INTEGER,
        last_page INTEGER DEFAULT 1,
        total_pages INTEGER,
        CONSTRAINT pitch_deck_view_sessions_pkey PRIMARY KEY (id)
      );

      ALTER TABLE public.pitch_deck_view_sessions
        ADD COLUMN IF NOT EXISTS total_pages INTEGER;

      CREATE INDEX IF NOT EXISTS idx_pitch_deck_view_sessions_investor
        ON public.pitch_deck_view_sessions (investor_user_id, started_at DESC);

      CREATE INDEX IF NOT EXISTS idx_pitch_deck_view_sessions_startup
        ON public.pitch_deck_view_sessions (startup_profile_id, started_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function createPitchDeckViewSession(investorUserId, startupProfileId) {
  await ensurePitchDeckSessionTables();

  const result = await pool.query(
    `
      INSERT INTO public.pitch_deck_view_sessions
        (investor_user_id, startup_profile_id, started_at, pages_viewed, time_per_page_ms, last_page)
      VALUES ($1, $2, CURRENT_TIMESTAMP, '[]'::jsonb, '{}'::jsonb, 1)
      RETURNING *
    `,
    [investorUserId, startupProfileId],
  );

  return result.rows[0];
}

export async function getPitchDeckViewSessionById(sessionId) {
  await ensurePitchDeckSessionTables();

  const result = await pool.query(
    `SELECT * FROM public.pitch_deck_view_sessions WHERE id = $1`,
    [sessionId],
  );

  return result.rows[0] || null;
}

export async function updatePitchDeckViewSession(sessionId, updates = {}) {
  await ensurePitchDeckSessionTables();

  const {
    pages_viewed = null,
    time_per_page_ms = null,
    last_page = null,
    total_duration_ms = null,
    completed = null,
    ended_at = null,
    total_pages = null,
  } = updates;

  const sets = [];
  const values = [];
  let idx = 1;

  if (pages_viewed != null) {
    sets.push(`pages_viewed = $${idx}::jsonb`);
    values.push(JSON.stringify(pages_viewed));
    idx += 1;
  }

  if (time_per_page_ms != null) {
    sets.push(`time_per_page_ms = $${idx}::jsonb`);
    values.push(JSON.stringify(time_per_page_ms));
    idx += 1;
  }

  if (last_page != null) {
    sets.push(`last_page = $${idx}`);
    values.push(last_page);
    idx += 1;
  }

  if (total_duration_ms != null) {
    sets.push(`total_duration_ms = $${idx}`);
    values.push(total_duration_ms);
    idx += 1;
  }

  if (completed != null) {
    sets.push(`completed = $${idx}`);
    values.push(completed);
    idx += 1;
  }

  if (ended_at != null) {
    sets.push(`ended_at = $${idx}`);
    values.push(ended_at);
    idx += 1;
  }

  if (total_pages != null) {
    sets.push(`total_pages = $${idx}`);
    values.push(total_pages);
    idx += 1;
  }

  if (sets.length === 0) {
    return getPitchDeckViewSessionById(sessionId);
  }

  values.push(sessionId);
  const result = await pool.query(
    `
      UPDATE public.pitch_deck_view_sessions
      SET ${sets.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `,
    values,
  );

  return result.rows[0] || null;
}

export async function listPitchDeckSessionsForStartup(
  startupProfileId,
  { since = null } = {},
) {
  await ensurePitchDeckSessionTables();

  const values = [startupProfileId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = `AND started_at >= $2`;
  }

  const result = await pool.query(
    `
      SELECT
        id,
        investor_user_id,
        started_at,
        ended_at,
        completed,
        pages_viewed,
        time_per_page_ms,
        total_duration_ms,
        total_pages,
        last_page
      FROM public.pitch_deck_view_sessions
      WHERE startup_profile_id = $1 ${sinceClause}
      ORDER BY started_at DESC
    `,
    values,
  );

  return result.rows;
}
