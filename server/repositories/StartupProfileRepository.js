import pool from "../config/database.js";

// Helper to safely stringify JSON fields (only if they're objects)
const safeStringify = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const normalizeStartupPayload = (payload = {}) => {
  const city = payload.city ?? payload.location_city ?? null;
  const country = payload.country ?? payload.location_country ?? null;
  const stage = payload.stage ?? payload.funding_stage ?? null;

  return {
    ...payload,
    city,
    country,
    stage,
    location_city: payload.location_city ?? city,
    location_country: payload.location_country ?? country,
    funding_stage: payload.funding_stage ?? stage,
    revenue_status: payload.revenue_status ?? null,
  };
};

const normalizeStartupUpdates = (updates = {}) => {
  const normalizedUpdates = { ...updates };

  if (
    Object.prototype.hasOwnProperty.call(updates, "city") ||
    Object.prototype.hasOwnProperty.call(updates, "location_city")
  ) {
    const city = updates.city ?? updates.location_city ?? null;
    normalizedUpdates.city = city;
    normalizedUpdates.location_city = updates.location_city ?? city;
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, "country") ||
    Object.prototype.hasOwnProperty.call(updates, "location_country")
  ) {
    const country = updates.country ?? updates.location_country ?? null;
    normalizedUpdates.country = country;
    normalizedUpdates.location_country = updates.location_country ?? country;
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, "stage") ||
    Object.prototype.hasOwnProperty.call(updates, "funding_stage")
  ) {
    const stage = updates.stage ?? updates.funding_stage ?? null;
    normalizedUpdates.stage = stage;
    normalizedUpdates.funding_stage = updates.funding_stage ?? stage;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "revenue_status")) {
    normalizedUpdates.revenue_status = updates.revenue_status ?? null;
  }

  return normalizedUpdates;
};

const STARTUP_SEARCH_VECTOR = `to_tsvector('english', concat_ws(' ', coalesce(sp.company_name, ''), coalesce(sp.tagline, ''), coalesce(sp.description, '')))`;

let connectionTableMetaCache = null;

const normalizeConnectionStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "connected") return "accepted";
  if (["pending", "accepted", "declined"].includes(value)) return value;
  return null;
};

const getConnectionTableMeta = async () => {
  if (connectionTableMetaCache !== null) {
    return connectionTableMetaCache;
  }

  const tableResult = await pool.query(
    `SELECT to_regclass('public.connections') AS table_name`,
  );
  const hasTable = Boolean(tableResult.rows[0]?.table_name);

  if (!hasTable) {
    connectionTableMetaCache = { available: false };
    return connectionTableMetaCache;
  }

  const columnResult = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'connections'
    `,
  );

  const columns = new Set(columnResult.rows.map((row) => row.column_name));
  const hasRequesterReceiver =
    columns.has("requester_id") &&
    columns.has("receiver_id") &&
    columns.has("status");
  const hasInvestorStartup =
    columns.has("investor_id") &&
    columns.has("startup_id") &&
    columns.has("status");

  connectionTableMetaCache = {
    available: hasRequesterReceiver || hasInvestorStartup,
    schemaType: hasInvestorStartup
      ? "investor_startup"
      : hasRequesterReceiver
        ? "requester_receiver"
        : null,
  };

  return connectionTableMetaCache;
};

const buildListStartupsQuery = ({
  searchTerm,
  industries,
  locationCountry,
  locationCity,
  fundingStage,
  revenueStatus,
  requesterUserId,
}) => {
  const clauses = [];
  const values = [];

  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (searchTerm && searchTerm.trim()) {
    const queryRef = addValue(searchTerm.trim());
    clauses.push(
      `${STARTUP_SEARCH_VECTOR} @@ websearch_to_tsquery('english', ${queryRef})`,
    );
  }

  if (industries.length > 0) {
    const queryRef = addValue(
      industries.map((industry) => industry.toLowerCase()),
    );
    clauses.push(`LOWER(sp.industry) = ANY(${queryRef})`);
  }

  if (locationCountry) {
    const queryRef = addValue(locationCountry.trim().toLowerCase());
    clauses.push(
      `LOWER(COALESCE(sp.location_country, sp.country)) = ${queryRef}`,
    );
  }

  if (locationCity) {
    const queryRef = addValue(locationCity.trim().toLowerCase());
    clauses.push(`LOWER(COALESCE(sp.location_city, sp.city)) = ${queryRef}`);
  }

  if (fundingStage) {
    const queryRef = addValue(fundingStage.trim().toLowerCase());
    clauses.push(`LOWER(COALESCE(sp.funding_stage, sp.stage)) = ${queryRef}`);
  }

  if (revenueStatus) {
    const queryRef = addValue(revenueStatus.trim().toLowerCase());
    clauses.push(`LOWER(sp.revenue_status) = ${queryRef}`);
  }

  if (requesterUserId) {
    const queryRef = addValue(requesterUserId);
    clauses.push(
      `(sp.user_id = ${queryRef} OR COALESCE(ps.profile_visibility, 'public') = 'public')`,
    );
  } else {
    clauses.push(`COALESCE(ps.profile_visibility, 'public') = 'public'`);
  }

  const whereClause =
    clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return { whereClause, values };
};

const getSortClause = (sort) => {
  switch (sort) {
    case "alphabetical":
      return "ORDER BY sp.company_name ASC NULLS LAST";
    case "recently_updated":
      return "ORDER BY sp.updated_at DESC NULLS LAST";
    case "newest":
    default:
      return "ORDER BY sp.created_at DESC NULLS LAST";
  }
};

/**
 * Create a new startup profile in the database
 * @param {string} userId - User ID
 * @param {Object} payload - Profile data
 * @returns {Promise<Object>} Created profile
 */
export async function createStartupProfile(userId, payload) {
  const normalizedPayload = normalizeStartupPayload(payload);
  const q = `INSERT INTO startup_profiles
    (user_id, company_name, founders, logo_url, city, country, website, linkedin, tagline, description, industry, founded_date, stage, team, funding, traction, documents, primary_contact_name, contact_email, contact_phone, social_media, location_country, location_city, funding_stage, revenue_status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
    RETURNING *`;

  const values = [
    userId,
    normalizedPayload.company_name || null,
    safeStringify(normalizedPayload.founders),
    normalizedPayload.logo_url || null,
    normalizedPayload.city || null,
    normalizedPayload.country || null,
    normalizedPayload.website || null,
    normalizedPayload.linkedin || null,
    normalizedPayload.tagline || null,
    normalizedPayload.description || null,
    normalizedPayload.industry || null,
    normalizedPayload.founded_date || null,
    normalizedPayload.stage || null,
    safeStringify(normalizedPayload.team),
    safeStringify(normalizedPayload.funding),
    safeStringify(normalizedPayload.traction),
    safeStringify(normalizedPayload.documents),
    normalizedPayload.primary_contact_name || null,
    normalizedPayload.contact_email || null,
    normalizedPayload.contact_phone || null,
    safeStringify(normalizedPayload.social_media),
    normalizedPayload.location_country || null,
    normalizedPayload.location_city || null,
    normalizedPayload.funding_stage || null,
    normalizedPayload.revenue_status || null,
  ];

  const result = await pool.query(q, values);
  return result.rows[0];
}

/**
 * Get startup profile by ID
 * @param {string} id - Profile ID
 * @returns {Promise<Object|null>} Profile or null
 */
export async function getStartupProfileById(id) {
  const q = "SELECT * FROM startup_profiles WHERE id = $1";
  const result = await pool.query(q, [id]);
  return result.rows[0] || null;
}

/**
 * Get startup profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile or null
 */
export async function getStartupProfileByUserId(userId) {
  const q = "SELECT * FROM startup_profiles WHERE user_id = $1";
  const result = await pool.query(q, [userId]);
  return result.rows[0] || null;
}

/**
 * Update startup profile
 * @param {string} id - Profile ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated profile or null
 */
export async function updateStartupProfile(id, userId, updates) {
  const normalizedUpdates = normalizeStartupUpdates(updates);
  const allowed = [
    "company_name",
    "founders",
    "logo_url",
    "city",
    "country",
    "website",
    "linkedin",
    "tagline",
    "description",
    "industry",
    "founded_date",
    "stage",
    "team",
    "funding",
    "traction",
    "documents",
    "primary_contact_name",
    "contact_email",
    "contact_phone",
    "social_media",
    "location_country",
    "location_city",
    "funding_stage",
    "revenue_status",
  ];

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, key)) {
      let val = normalizedUpdates[key];
      if (
        [
          "founders",
          "team",
          "funding",
          "traction",
          "documents",
          "social_media",
        ].includes(key) &&
        val !== undefined
      ) {
        val = safeStringify(val);
      }
      sets.push(`${key} = $${idx}`);
      values.push(val);
      idx += 1;
    }
  }

  if (sets.length === 0) {
    return getStartupProfileById(id);
  }

  // updated_at will use DB trigger if available; otherwise update manually
  const q = `UPDATE startup_profiles SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  values.push(id, userId);

  const result = await pool.query(q, values);
  return result.rows[0] || null;
}

/**
 * List startups with search, filtering, sorting, and pagination.
 * @param {Object} options - Query options
 * @returns {Promise<{rows: Object[], total: number}>}
 */
export async function listStartups(options = {}) {
  const {
    page = 1,
    limit = 20,
    q,
    industry,
    location_country,
    location_city,
    funding_stage,
    revenue_status,
    sort = "newest",
    requesterUserId = null,
  } = options;

  const industries = Array.isArray(industry)
    ? industry
    : typeof industry === "string"
      ? industry
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  const { whereClause, values } = buildListStartupsQuery({
    searchTerm: q,
    industries,
    locationCountry: location_country,
    locationCity: location_city,
    fundingStage: funding_stage,
    revenueStatus: revenue_status,
    requesterUserId,
  });

  const offset = (page - 1) * limit;
  const paginationValues = [...values, limit, offset];
  const limitRef = `$${paginationValues.length - 1}`;
  const offsetRef = `$${paginationValues.length}`;

  const selectQuery = `
    SELECT sp.*
    FROM startup_profiles sp
    LEFT JOIN privacy_settings ps ON ps.user_id = sp.user_id
    ${whereClause}
    ${getSortClause(sort)}
    LIMIT ${limitRef} OFFSET ${offsetRef}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM startup_profiles sp
    LEFT JOIN privacy_settings ps ON ps.user_id = sp.user_id
    ${whereClause}
  `;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(selectQuery, paginationValues),
    pool.query(countQuery, values),
  ]);

  return {
    rows: rowsResult.rows,
    total: countResult.rows[0]?.total || 0,
  };
}

/**
 * Resolve connection statuses between requester and listed startup users.
 * Gracefully returns an empty map if a compatible connections table is unavailable.
 * @param {string|null} requesterUserId
 * @param {string[]} startupUserIds
 * @returns {Promise<Map<string, string>>}
 */
export async function getConnectionStatusesForStartups(
  requesterUserId,
  startupUserIds = [],
) {
  if (!requesterUserId || startupUserIds.length === 0) {
    return new Map();
  }

  const uniqueStartupUserIds = [...new Set(startupUserIds.filter(Boolean))];
  if (uniqueStartupUserIds.length === 0) {
    return new Map();
  }

  const connectionMeta = await getConnectionTableMeta();
  if (!connectionMeta.available) {
    return new Map();
  }

  if (connectionMeta.schemaType === "investor_startup") {
    const connectionResult = await pool.query(
      `
        SELECT c.startup_id::text AS startup_user_id, c.status
        FROM public.connections c
        WHERE c.investor_id::text = $1
          AND c.startup_id::text = ANY($2::text[])
      `,
      [requesterUserId, uniqueStartupUserIds],
    );

    return new Map(
      connectionResult.rows
        .map((row) => [
          row.startup_user_id,
          normalizeConnectionStatus(row.status),
        ])
        .filter(([, status]) => Boolean(status)),
    );
  }

  const connectionResult = await pool.query(
    `
      SELECT
        CASE
          WHEN c.requester_id::text = $1 THEN c.receiver_id::text
          ELSE c.requester_id::text
        END AS startup_user_id,
        c.status
      FROM public.connections c
      WHERE (
        (c.requester_id::text = $1 AND c.receiver_id::text = ANY($2::text[]))
        OR
        (c.receiver_id::text = $1 AND c.requester_id::text = ANY($2::text[]))
      )
    `,
    [requesterUserId, uniqueStartupUserIds],
  );

  return new Map(
    connectionResult.rows
      .map((row) => [
        row.startup_user_id,
        normalizeConnectionStatus(row.status),
      ])
      .filter(([, status]) => Boolean(status)),
  );
}
