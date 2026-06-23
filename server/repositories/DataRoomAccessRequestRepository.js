import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureDataRoomAccessRequestTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.data_room_access_requests (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied')),
        requested_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITHOUT TIME ZONE,
        CONSTRAINT data_room_access_requests_pkey PRIMARY KEY (id),
        CONSTRAINT data_room_access_requests_unique_pair UNIQUE (startup_profile_id, investor_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_data_room_access_requests_startup
        ON public.data_room_access_requests (startup_profile_id, requested_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function upsertDataRoomAccessRequest(startupProfileId, investorUserId) {
  await ensureDataRoomAccessRequestTables();

  const result = await pool.query(
    `
      INSERT INTO public.data_room_access_requests
        (startup_profile_id, investor_user_id, status, requested_at, resolved_at)
      VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP, NULL)
      ON CONFLICT (startup_profile_id, investor_user_id)
      DO UPDATE SET
        status = CASE
          WHEN public.data_room_access_requests.status = 'granted' THEN 'granted'
          ELSE 'pending'
        END,
        requested_at = CASE
          WHEN public.data_room_access_requests.status = 'granted' THEN public.data_room_access_requests.requested_at
          ELSE CURRENT_TIMESTAMP
        END
      RETURNING *
    `,
    [startupProfileId, investorUserId],
  );

  return result.rows[0];
}

export async function markDataRoomRequestGranted(startupProfileId, investorUserId) {
  await ensureDataRoomAccessRequestTables();

  const result = await pool.query(
    `
      UPDATE public.data_room_access_requests
      SET status = 'granted', resolved_at = CURRENT_TIMESTAMP
      WHERE startup_profile_id = $1 AND investor_user_id = $2
      RETURNING *
    `,
    [startupProfileId, investorUserId],
  );

  return result.rows[0] || null;
}

export async function countDataRoomAccessRequests(
  startupProfileId,
  { since = null, until = null } = {},
) {
  await ensureDataRoomAccessRequestTables();

  const conditions = ["startup_profile_id = $1"];
  const values = [startupProfileId];
  let idx = 2;

  if (since) {
    conditions.push(`requested_at >= $${idx}`);
    values.push(since);
    idx += 1;
  }
  if (until) {
    conditions.push(`requested_at < $${idx}`);
    values.push(until);
    idx += 1;
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE status = 'granted')::int AS granted_count
      FROM public.data_room_access_requests
      WHERE ${conditions.join(" AND ")}
    `,
    values,
  );

  return result.rows[0];
}

export async function dataRoomRequestTrendBuckets(
  startupProfileId,
  { since = null, bucket = "week" } = {},
) {
  await ensureDataRoomAccessRequestTables();

  const trunc = bucket === "day" ? "day" : "week";
  const values = [startupProfileId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = `AND requested_at >= $2`;
  }

  const result = await pool.query(
    `
      SELECT
        date_trunc('${trunc}', requested_at) AS bucket_start,
        COUNT(*)::int AS value
      FROM public.data_room_access_requests
      WHERE startup_profile_id = $1 ${sinceClause}
      GROUP BY bucket_start
      ORDER BY bucket_start ASC
    `,
    values,
  );

  return result.rows;
}

export async function getDataRoomAccessRequest(
  startupProfileId,
  investorUserId,
) {
  await ensureDataRoomAccessRequestTables();

  const result = await pool.query(
    `
      SELECT * FROM public.data_room_access_requests
      WHERE startup_profile_id = $1 AND investor_user_id = $2
    `,
    [startupProfileId, investorUserId],
  );

  return result.rows[0] || null;
}
