import pool from "../config/database.js";

const VALID_STATUSES = new Set([
  "pending",
  "accepted",
  "declined",
  "connected",
]);

export const CONNECTION_COOLING_DAYS = 30;
const COOLING_MS = CONNECTION_COOLING_DAYS * 24 * 60 * 60 * 1000;

let connectionColumnsEnsured = false;

export const ensureConnectionColumns = async () => {
  if (connectionColumnsEnsured) return;
  await pool.query(`
    ALTER TABLE public.connections
      ADD COLUMN IF NOT EXISTS request_message VARCHAR(300),
      ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ
  `);
  connectionColumnsEnsured = true;
};

const normalizeStatus = (status) => {
  const raw = String(status || "").toLowerCase();
  if (raw === "connected") return "accepted";
  if (VALID_STATUSES.has(raw)) return raw;
  return null;
};

export const isInConnectionCooling = (declinedAt, now = Date.now()) => {
  if (!declinedAt) return false;
  const declinedMs = new Date(declinedAt).getTime();
  if (Number.isNaN(declinedMs)) return false;
  return now - declinedMs < COOLING_MS;
};

const trimRequestMessage = (message) => {
  if (message == null || message === "") return null;
  const trimmed = String(message).trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 300);
};

export const getUserById = async (userId) => {
  const result = await pool.query(
    "SELECT id, user_type, full_name, email FROM users WHERE id = $1",
    [userId],
  );
  return result.rows[0] || null;
};

export const getUserProfileDetailsForConnection = async (userId) => {
  const user = await getUserById(userId);
  if (!user) return null;

  if (user.user_type === "investor") {
    const result = await pool.query(
      `
        SELECT investor_profile_id, photo_url
        FROM public.investor_profiles
        WHERE user_id = $1
      `,
      [userId],
    );
    const row = result.rows[0] || {};
    return {
      ...user,
      profile_id: row.investor_profile_id || null,
      photo_url: row.photo_url || null,
    };
  }

  const result = await pool.query(
    `
      SELECT startup_profile_id, logo_url
      FROM public.startup_profiles
      WHERE user_id = $1
    `,
    [userId],
  );
  const row = result.rows[0] || {};
  return {
    ...user,
    profile_id: row.startup_profile_id || null,
    photo_url: row.logo_url || null,
  };
};

const orderUsersForConnection = (userA, userB) => {
  if (userA.user_type === userB.user_type) {
    return null;
  }

  if (userA.user_type === "investor" && userB.user_type === "startup") {
    return { investorId: userA.id, startupId: userB.id };
  }

  if (userA.user_type === "startup" && userB.user_type === "investor") {
    return { investorId: userB.id, startupId: userA.id };
  }

  return null;
};

export const getConnectionBetweenUsers = async (userIdA, userIdB) => {
  await ensureConnectionColumns();

  const result = await pool.query(
    `
      SELECT *
      FROM public.connections
      WHERE (investor_id = $1 AND startup_id = $2)
         OR (investor_id = $2 AND startup_id = $1)
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    `,
    [userIdA, userIdB],
  );

  if (!result.rows[0]) {
    return null;
  }

  const connection = result.rows[0];
  return {
    ...connection,
    normalized_status: normalizeStatus(connection.status),
  };
};

export const isUsersConnected = async (userIdA, userIdB) => {
  const connection = await getConnectionBetweenUsers(userIdA, userIdB);
  return connection?.normalized_status === "accepted";
};

export const createConnectionRequest = async ({
  requesterId,
  targetUserId,
  message,
}) => {
  await ensureConnectionColumns();

  const requestMessage = trimRequestMessage(message);

  const [requester, target] = await Promise.all([
    getUserById(requesterId),
    getUserById(targetUserId),
  ]);

  if (!requester || !target) {
    const error = new Error("One or both users were not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if (requester.id === target.id) {
    const error = new Error("Cannot connect to yourself");
    error.code = "SELF_CONNECTION";
    throw error;
  }

  const ordered = orderUsersForConnection(requester, target);
  if (!ordered) {
    const error = new Error("Connections require one investor and one startup");
    error.code = "INVALID_USER_TYPES";
    throw error;
  }

  const existing = await getConnectionBetweenUsers(
    ordered.investorId,
    ordered.startupId,
  );
  if (existing?.normalized_status === "accepted") {
    const error = new Error("Users are already connected");
    error.code = "ALREADY_CONNECTED";
    throw error;
  }

  if (existing?.normalized_status === "pending") {
    const error = new Error("A connection request is already pending");
    error.code = "REQUEST_PENDING";
    throw error;
  }

  if (
    existing?.normalized_status === "declined" &&
    isInConnectionCooling(existing.declined_at)
  ) {
    const coolingEndsAt = new Date(
      new Date(existing.declined_at).getTime() + COOLING_MS,
    );
    const error = new Error(
      `You can send a new connection request after the 30-day cooling period ends on ${coolingEndsAt.toLocaleDateString()}`,
    );
    error.code = "COOLING_PERIOD";
    error.coolingEndsAt = coolingEndsAt.toISOString();
    throw error;
  }

  if (existing) {
    const updated = await pool.query(
      `
        UPDATE public.connections
        SET status = 'pending',
            requester_id = $2,
            request_message = $3,
            declined_at = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [existing.id, requester.id, requestMessage],
    );

    return updated.rows[0];
  }

  const inserted = await pool.query(
    `
      INSERT INTO public.connections (
        investor_id,
        startup_id,
        requester_id,
        status,
        request_message
      )
      VALUES ($1, $2, $3, 'pending', $4)
      RETURNING *
    `,
    [ordered.investorId, ordered.startupId, requester.id, requestMessage],
  );

  return inserted.rows[0];
};

export const getConnectionsForUser = async (userId) => {
  await ensureConnectionColumns();

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        CASE WHEN c.investor_id = $1 THEN c.startup_id ELSE c.investor_id END AS other_user_id,
        u.full_name AS other_user_name,
        u.user_type AS other_user_type,
        COALESCE(ip.photo_url, sp.logo_url) AS other_user_photo_url,
        COALESCE(ip.investor_profile_id, sp.startup_profile_id) AS other_user_profile_id,
        COALESCE(u.verification_tier::text, 'UNVERIFIED') AS other_user_verification_tier
      FROM public.connections c
      JOIN public.users u
        ON u.id = CASE WHEN c.investor_id = $1 THEN c.startup_id ELSE c.investor_id END
      LEFT JOIN investor_profiles ip ON ip.user_id = u.id AND u.user_type = 'investor'
      LEFT JOIN startup_profiles sp ON sp.user_id = u.id AND u.user_type = 'startup'
      WHERE c.investor_id = $1 OR c.startup_id = $1
      ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    ...row,
    normalized_status: normalizeStatus(row.status),
  }));
};

export const getPendingRequestsForStartup = async (startupUserId) => {
  await ensureConnectionColumns();

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        c.requester_id AS requester_user_id,
        u.full_name AS requester_name,
        u.user_type AS requester_user_type,
        u.email AS requester_email,
        c.request_message AS message,
        COALESCE(ip.photo_url, sp.logo_url) AS other_user_photo_url,
        COALESCE(ip.investor_profile_id, sp.startup_profile_id) AS requester_profile_id
      FROM public.connections c
      JOIN public.users u ON u.id = c.requester_id
      LEFT JOIN investor_profiles ip ON ip.user_id = u.id AND u.user_type = 'investor'
      LEFT JOIN startup_profiles sp ON sp.user_id = u.id AND u.user_type = 'startup'
      WHERE c.startup_id = $1
        AND LOWER(c.status) = 'pending'
        AND c.requester_id <> $1
      ORDER BY c.created_at DESC
    `,
    [startupUserId],
  );

  return result.rows;
};

export const getPendingSentRequestsForUser = async (userId) => {
  await ensureConnectionColumns();

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        c.request_message AS message,
        CASE WHEN c.investor_id = $1 THEN c.startup_id ELSE c.investor_id END AS target_user_id,
        u.full_name AS target_user_name,
        u.user_type AS target_user_type,
        u.email AS target_user_email,
        COALESCE(ip.photo_url, sp.logo_url) AS other_user_photo_url,
        COALESCE(ip.investor_profile_id, sp.startup_profile_id) AS target_user_profile_id
      FROM public.connections c
      JOIN public.users u
        ON u.id = CASE WHEN c.investor_id = $1 THEN c.startup_id ELSE c.investor_id END
      LEFT JOIN investor_profiles ip ON ip.user_id = u.id AND u.user_type = 'investor'
      LEFT JOIN startup_profiles sp ON sp.user_id = u.id AND u.user_type = 'startup'
      WHERE (c.investor_id = $1 OR c.startup_id = $1)
        AND LOWER(c.status) = 'pending'
        AND c.requester_id = $1
      ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

export const getPendingReceivedRequestsForUser = async (userId) => {
  await ensureConnectionColumns();

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        c.requester_id AS requester_user_id,
        u.full_name AS requester_name,
        u.user_type AS requester_user_type,
        u.email AS requester_email,
        c.request_message AS message,
        COALESCE(ip.photo_url, sp.logo_url) AS other_user_photo_url,
        COALESCE(ip.investor_profile_id, sp.startup_profile_id) AS requester_profile_id
      FROM public.connections c
      JOIN public.users u ON u.id = c.requester_id
      LEFT JOIN investor_profiles ip ON ip.user_id = u.id AND u.user_type = 'investor'
      LEFT JOIN startup_profiles sp ON sp.user_id = u.id AND u.user_type = 'startup'
      WHERE (c.investor_id = $1 OR c.startup_id = $1)
        AND LOWER(c.status) = 'pending'
        AND c.requester_id <> $1
      ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

export const getRecentlyAcceptedConnectionsForUser = async (userId) => {
  await ensureConnectionColumns();

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.updated_at,
        c.requester_id,
        CASE WHEN c.investor_id = $1 THEN c.startup_id ELSE c.investor_id END AS other_user_id,
        u.full_name AS other_user_name,
        u.user_type AS other_user_type,
        COALESCE(ip.photo_url, sp.logo_url) AS other_user_photo_url,
        COALESCE(ip.investor_profile_id, sp.startup_profile_id) AS other_user_profile_id
      FROM public.connections c
      JOIN public.users u
        ON u.id = CASE WHEN c.investor_id = $1 THEN c.startup_id ELSE c.investor_id END
      LEFT JOIN investor_profiles ip ON ip.user_id = u.id AND u.user_type = 'investor'
      LEFT JOIN startup_profiles sp ON sp.user_id = u.id AND u.user_type = 'startup'
      WHERE (c.investor_id = $1 OR c.startup_id = $1)
        AND LOWER(c.status) IN ('accepted', 'connected')
        AND c.updated_at >= NOW() - INTERVAL '30 days'
      ORDER BY c.updated_at DESC
      LIMIT 20
    `,
    [userId],
  );

  return result.rows;
};

export const removeConnectionById = async ({ connectionId, userId }) => {
  await ensureConnectionColumns();

  const existing = await pool.query(
    "SELECT * FROM public.connections WHERE id = $1",
    [connectionId],
  );

  if (!existing.rows[0]) {
    const error = new Error("Connection not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  const connection = existing.rows[0];
  if (
    String(connection.investor_id) !== String(userId) &&
    String(connection.startup_id) !== String(userId)
  ) {
    const error = new Error("You are not allowed to remove this connection");
    error.code = "FORBIDDEN";
    throw error;
  }

  if (normalizeStatus(connection.status) === "pending") {
    const error = new Error(
      "Pending connection requests cannot be cancelled. Wait for the recipient to accept or decline.",
    );
    error.code = "PENDING_CANNOT_DELETE";
    throw error;
  }

  await pool.query("DELETE FROM public.connections WHERE id = $1", [
    connectionId,
  ]);
  return { id: connectionId };
};

export const updateConnectionStatus = async ({
  connectionId,
  userId,
  status,
}) => {
  await ensureConnectionColumns();

  const normalized = normalizeStatus(status);
  if (!normalized || !["accepted", "declined"].includes(normalized)) {
    const error = new Error(
      "Invalid status. Allowed values: accepted, declined",
    );
    error.code = "INVALID_STATUS";
    throw error;
  }

  const existing = await pool.query(
    "SELECT * FROM public.connections WHERE id = $1",
    [connectionId],
  );

  if (!existing.rows[0]) {
    const error = new Error("Connection request not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  const connection = existing.rows[0];

  const isInvestor = String(connection.investor_id) === String(userId);
  const isStartup = String(connection.startup_id) === String(userId);
  if (!isInvestor && !isStartup) {
    const error = new Error("You are not part of this connection request");
    error.code = "FORBIDDEN";
    throw error;
  }

  if (String(connection.requester_id) === String(userId)) {
    const error = new Error(
      "You cannot respond to your own connection request — only the other party can accept or decline.",
    );
    error.code = "FORBIDDEN";
    throw error;
  }

  const declinedAtClause =
    normalized === "declined" ? ", declined_at = NOW()" : ", declined_at = NULL";

  const updated = await pool.query(
    `
      UPDATE public.connections
      SET status = $1, updated_at = NOW()${declinedAtClause}
      WHERE id = $2
      RETURNING *
    `,
    [normalized, connectionId],
  );

  return updated.rows[0];
};
