import pool from "../config/database.js";

const VALID_STATUSES = new Set([
  "pending",
  "accepted",
  "declined",
  "connected",
]);

const normalizeStatus = (status) => {
  const raw = String(status || "").toLowerCase();
  if (raw === "connected") return "accepted";
  if (VALID_STATUSES.has(raw)) return raw;
  return null;
};

export const getUserById = async (userId) => {
  const result = await pool.query(
    "SELECT id, user_type, full_name, email FROM users WHERE id = $1",
    [userId],
  );
  return result.rows[0] || null;
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
}) => {
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

  if (existing) {
    const updated = await pool.query(
      `
        UPDATE public.connections
        SET status = 'pending', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [existing.id],
    );

    return updated.rows[0];
  }

  const inserted = await pool.query(
    `
      INSERT INTO public.connections (investor_id, startup_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `,
    [ordered.investorId, ordered.startupId],
  );

  return inserted.rows[0];
};

export const getConnectionsForUser = async (userId) => {
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
        COALESCE(ip.investor_profile_id, sp.startup_profile_id) AS other_user_profile_id
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
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        c.investor_id AS requester_user_id,
        u.full_name AS requester_name,
        u.email AS requester_email
      FROM public.connections c
      JOIN public.users u ON u.id = c.investor_id
      WHERE c.startup_id = $1 AND LOWER(c.status) = 'pending'
      ORDER BY c.created_at DESC
    `,
    [startupUserId],
  );

  return result.rows;
};

export const getPendingSentRequestsForUser = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
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
      ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

export const getPendingReceivedRequestsForUser = async (userId) => {
  const me = await getUserById(userId);
  if (!me) {
    return [];
  }

  // Investors always send requests; only startups receive them.
  if (me.user_type !== "startup") {
    return [];
  }

  const result = await pool.query(
    `
      SELECT
        c.id,
        c.status,
        c.created_at,
        c.updated_at,
        c.investor_id AS requester_user_id,
        u.full_name AS requester_name,
        u.user_type AS requester_user_type,
        u.email AS requester_email,
        ip.photo_url AS other_user_photo_url,
        ip.investor_profile_id AS requester_profile_id
      FROM public.connections c
      JOIN public.users u ON u.id = c.investor_id
      LEFT JOIN investor_profiles ip ON ip.user_id = c.investor_id
      WHERE c.startup_id = $1
        AND LOWER(c.status) = 'pending'
      ORDER BY c.created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

export const removeConnectionById = async ({ connectionId, userId }) => {
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
  if (String(connection.investor_id) !== String(userId) && String(connection.startup_id) !== String(userId)) {
    const error = new Error("You are not allowed to remove this connection");
    error.code = "FORBIDDEN";
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

  if (String(connection.startup_id) !== String(userId)) {
    const error = new Error(
      "Only the startup user can respond to this connection request",
    );
    error.code = "FORBIDDEN";
    throw error;
  }

  const updated = await pool.query(
    `
      UPDATE public.connections
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `,
    [normalized, connectionId],
  );

  return updated.rows[0];
};
