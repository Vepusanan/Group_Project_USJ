import pool from "../config/database.js";

const safeStringify = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const STARTUP_SEARCH_VECTOR = `to_tsvector('english', concat_ws(' ', coalesce(sp.company_name, ''), coalesce(sp.tagline, ''), coalesce(sp.detailed_description, '')))`;

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
  currentStage,
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

  if (currentStage) {
    const queryRef = addValue(currentStage.toUpperCase());
    clauses.push(`sp.current_stage = ${queryRef}::public.startup_stage_enum`);
  }

  if (fundingStage) {
    const queryRef = addValue(fundingStage.toUpperCase());
    clauses.push(`sp.funding_stage = ${queryRef}::public.funding_stage_enum`);
  }

  if (revenueStatus) {
    const queryRef = addValue(revenueStatus.toUpperCase());
    clauses.push(`sp.revenue_status = ${queryRef}::public.revenue_status_enum`);
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
    case "newest":
    default:
      return "ORDER BY sp.founded_date DESC NULLS LAST, sp.startup_profile_id DESC";
  }
};

export async function createStartupProfile(userId, payload) {
  const q = `INSERT INTO startup_profiles
    (user_id, company_name, startup_logo_url, founder_names, tagline, detailed_description, industry, founded_date,
     current_stage, team_size, key_team_members, team_photo_url, funding_stage, amount_seeking,
     previous_funding, use_of_funds, revenue_status, key_metrics, major_achievements,
     customer_testimonials, pitch_deck_url, business_plan_url, product_demo_url,
     primary_contact_name, contact_email, phone_number, social_media_links)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
    RETURNING *`;

  const values = [
    userId,
    payload.company_name || null,
    payload.startup_logo_url || null,
    safeStringify(payload.founder_names),
    payload.tagline || null,
    payload.detailed_description || null,
    payload.industry || null,
    payload.founded_date || null,
    payload.current_stage || null,
    payload.team_size || null,
    payload.key_team_members || null,
    payload.team_photo_url || null,
    payload.funding_stage || null,
    payload.amount_seeking || null,
    payload.previous_funding || 0,
    payload.use_of_funds || null,
    payload.revenue_status || null,
    safeStringify(payload.key_metrics),
    safeStringify(payload.major_achievements),
    payload.customer_testimonials || null,
    payload.pitch_deck_url || null,
    payload.business_plan_url || null,
    payload.product_demo_url || null,
    payload.primary_contact_name || null,
    payload.contact_email || null,
    payload.phone_number || null,
    safeStringify(payload.social_media_links),
  ];

  const result = await pool.query(q, values);
  return result.rows[0];
}

export async function getStartupProfileById(id) {
  const q = "SELECT * FROM startup_profiles WHERE startup_profile_id = $1";
  const result = await pool.query(q, [id]);
  return result.rows[0] || null;
}

export async function getStartupProfileByUserId(userId) {
  const q = "SELECT * FROM startup_profiles WHERE user_id = $1";
  const result = await pool.query(q, [userId]);
  return result.rows[0] || null;
}

export async function updateStartupProfile(id, userId, updates) {
  const allowed = [
    "company_name",
    "startup_logo_url",
    "founder_names",
    "tagline",
    "detailed_description",
    "industry",
    "founded_date",
    "current_stage",
    "team_size",
    "key_team_members",
    "team_photo_url",
    "funding_stage",
    "amount_seeking",
    "previous_funding",
    "use_of_funds",
    "revenue_status",
    "key_metrics",
    "major_achievements",
    "customer_testimonials",
    "pitch_deck_url",
    "business_plan_url",
    "product_demo_url",
    "primary_contact_name",
    "contact_email",
    "phone_number",
    "social_media_links",
  ];

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      let val = updates[key];
      if (key === "social_media_links" || key === "key_metrics" || key === "major_achievements") {
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

  const q = `UPDATE startup_profiles SET ${sets.join(", ")} WHERE startup_profile_id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  values.push(id, userId);

  const result = await pool.query(q, values);
  return result.rows[0] || null;
}

export async function listStartups(options = {}) {
  const {
    page = 1,
    limit = 20,
    q,
    industry,
    current_stage,
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
    currentStage: current_stage,
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
