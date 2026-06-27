import pool from "../config/database.js";
import { normalizeFilterToken } from "../utils/filterNormalize.js";
import { ensureCompatibilityTables } from "./CompatibilityMatchScoreRepository.js";

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
  locationCountry,
  requesterUserId,
  minVerification,
  excludePassedForInvestorId,
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
      industries.map((industry) => normalizeFilterToken(industry)),
    );
    clauses.push(
      `regexp_replace(LOWER(COALESCE(sp.industry, '')), '[^a-z0-9]', '', 'g') = ANY(${queryRef})`,
    );
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

  if (locationCountry && locationCountry.trim()) {
    const ref = addValue(`%${locationCountry.trim().toLowerCase()}%`);
    clauses.push(
      `(LOWER(COALESCE(sp.location_country, '')) LIKE ${ref} OR LOWER(COALESCE(sp.location_city, '')) LIKE ${ref})`,
    );
  }

  if (requesterUserId) {
    const queryRef = addValue(requesterUserId);
    clauses.push(
      `(sp.user_id = ${queryRef} OR COALESCE(ps.profile_visibility, 'public') = 'public')`,
    );
  } else {
    clauses.push(`COALESCE(ps.profile_visibility, 'public') = 'public'`);
  }

  if (minVerification) {
    const tier = String(minVerification).toUpperCase();
    if (tier === "IDENTITY_VERIFIED") {
      clauses.push(
        `COALESCE(u.verification_tier::text, 'UNVERIFIED') IN ('IDENTITY_VERIFIED', 'BUSINESS_VERIFIED')`,
      );
    } else if (tier === "BUSINESS_VERIFIED") {
      clauses.push(`u.verification_tier = 'BUSINESS_VERIFIED'::public.verification_tier_enum`);
    }
  }

  if (excludePassedForInvestorId) {
    const ref = addValue(excludePassedForInvestorId);
    clauses.push(`
      NOT EXISTS (
        SELECT 1
        FROM public.investor_passed_startups ips
        WHERE ips.investor_user_id = ${ref}
          AND ips.startup_profile_id = sp.startup_profile_id
      )`);
  }

  const whereClause =
    clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return { whereClause, values };
};

const verificationRankSql = `CASE COALESCE(u.verification_tier::text, 'UNVERIFIED')
  WHEN 'BUSINESS_VERIFIED' THEN 2
  WHEN 'IDENTITY_VERIFIED' THEN 1
  ELSE 0
END DESC`;

const getSortClause = (sort, investorUserIdForScoring = null) => {
  if (sort === "connection_recent") {
    // conn.updated_at (acceptance time) comes from the connected-only INNER JOIN.
    return `ORDER BY conn.updated_at DESC NULLS LAST, sp.startup_profile_id DESC`;
  }

  if (sort === "match_score" && investorUserIdForScoring) {
    return `ORDER BY ${verificationRankSql}, cms.match_score DESC NULLS LAST, sp.created_at DESC NULLS LAST, sp.startup_profile_id DESC`;
  }

  switch (sort) {
    case "alphabetical":
      return `ORDER BY ${verificationRankSql}, sp.company_name ASC NULLS LAST`;
    case "recently_updated":
      return `ORDER BY ${verificationRankSql}, sp.updated_at DESC NULLS LAST, sp.startup_profile_id DESC`;
    case "newest":
    default:
      return `ORDER BY ${verificationRankSql}, sp.created_at DESC NULLS LAST, sp.startup_profile_id DESC`;
  }
};

// Builds an INNER JOIN onto public.connections that restricts results to the
// requester's ACCEPTED connections and exposes `conn.connected_at` (acceptance
// time) for sorting. Returns "" when not applicable. Handles both connection
// schema variants.
const buildConnectedOnlyJoin = (schemaType, requesterRef) => {
  if (schemaType === "investor_startup") {
    return `
      INNER JOIN public.connections conn
        ON conn.startup_id::text = sp.user_id::text
       AND conn.investor_id::text = ${requesterRef}
       AND LOWER(conn.status) IN ('accepted', 'connected')`;
  }
  // requester_receiver schema: the other party may be requester or receiver.
  return `
      INNER JOIN public.connections conn
        ON (
             (conn.requester_id::text = ${requesterRef} AND conn.receiver_id::text = sp.user_id::text)
          OR (conn.receiver_id::text = ${requesterRef} AND conn.requester_id::text = sp.user_id::text)
        )
       AND LOWER(conn.status) IN ('accepted', 'connected')`;
};

export async function createStartupProfile(userId, payload) {
  const q = `INSERT INTO startup_profiles
    (user_id, company_name, founder_names, tagline, detailed_description, industry, founded_date,
     current_stage, team_size, key_team_members, logo_url, team_photo_url, funding_stage, amount_seeking,
     previous_funding, use_of_funds, revenue_status, key_metrics, major_achievements,
     customer_testimonials, pitch_deck_url, business_plan_url, product_demo_url,
     founder_video_url, founder_video_thumbnail_url,
     primary_contact_name, contact_email, phone_number, social_media_links,
     location_country, location_city, website_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
    RETURNING *`;

  const values = [
    userId,
    payload.company_name || null,
    payload.founder_names || null,
    payload.tagline || null,
    payload.detailed_description || null,
    payload.industry || null,
    payload.founded_date || null,
    payload.current_stage || null,
    payload.team_size || null,
    payload.key_team_members || null,
    payload.logo_url || null,
    payload.team_photo_url || null,
    payload.funding_stage || null,
    payload.amount_seeking || null,
    payload.previous_funding || 0,
    payload.use_of_funds || null,
    payload.revenue_status || null,
    payload.key_metrics || null,
    payload.major_achievements || null,
    payload.customer_testimonials || null,
    payload.pitch_deck_url || null,
    payload.business_plan_url || null,
    payload.product_demo_url || null,
    payload.founder_video_url || null,
    payload.founder_video_thumbnail_url || null,
    payload.primary_contact_name || null,
    payload.contact_email || null,
    payload.phone_number || null,
    safeStringify(payload.social_media_links),
    payload.location_country || null,
    payload.location_city || null,
    payload.website_url || null,
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
    "founder_names",
    "tagline",
    "detailed_description",
    "industry",
    "founded_date",
    "current_stage",
    "team_size",
    "key_team_members",
    "logo_url",
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
    "founder_video_url",
    "founder_video_thumbnail_url",
    "primary_contact_name",
    "contact_email",
    "phone_number",
    "social_media_links",
    "location_country",
    "location_city",
    "website_url",
  ];

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      let val = updates[key];
      if (key === "social_media_links") {
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
    location_country,
    min_verification,
    sort = "newest",
    requesterUserId = null,
    investorUserIdForScoring = null,
    excludePassedForInvestorId = null,
    connectedOnly = false,
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
    locationCountry: location_country,
    requesterUserId,
    minVerification: min_verification,
    excludePassedForInvestorId,
  });

  // Connected-only restriction: INNER JOIN accepted connections. The join param
  // (requesterUserId) is appended to the shared `values` array so the same
  // placeholder is valid in both the select and count queries.
  const connectionMeta =
    connectedOnly && requesterUserId ? await getConnectionTableMeta() : null;
  const useConnectedOnly = Boolean(connectionMeta?.available);
  let connectedOnlyJoin = "";
  if (useConnectedOnly) {
    values.push(requesterUserId);
    const requesterRef = `$${values.length}`;
    connectedOnlyJoin = buildConnectedOnlyJoin(
      connectionMeta.schemaType,
      requesterRef,
    );
  }

  // connection_recent sort is only meaningful with the connected-only join.
  const effectiveSort =
    sort === "connection_recent" && !useConnectedOnly ? "newest" : sort;

  const offset = (page - 1) * limit;
  const useMatchScoreSort =
    effectiveSort === "match_score" && investorUserIdForScoring;

  if (useMatchScoreSort) {
    await ensureCompatibilityTables();
  }
  const scoringValues = useMatchScoreSort
    ? [...values, investorUserIdForScoring]
    : values;
  const investorRef = useMatchScoreSort ? `$${scoringValues.length}` : null;
  const paginationValues = [...scoringValues, limit, offset];
  const limitRef = `$${paginationValues.length - 1}`;
  const offsetRef = `$${paginationValues.length}`;

  const matchScoreJoin = useMatchScoreSort
    ? `
    LEFT JOIN compatibility_match_scores cms
      ON cms.startup_profile_id = sp.startup_profile_id
     AND cms.investor_user_id = ${investorRef}`
    : "";

  const selectQuery = `
    SELECT sp.*, COALESCE(u.verification_tier::text, 'UNVERIFIED') AS verification_tier
      ${useMatchScoreSort ? ", cms.match_score" : ""}
    FROM startup_profiles sp
    LEFT JOIN privacy_settings ps ON ps.user_id = sp.user_id
    LEFT JOIN users u ON u.id = sp.user_id
    ${connectedOnlyJoin}
    ${matchScoreJoin}
    ${whereClause}
    ${getSortClause(effectiveSort, investorUserIdForScoring)}
    LIMIT ${limitRef} OFFSET ${offsetRef}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM startup_profiles sp
    LEFT JOIN privacy_settings ps ON ps.user_id = sp.user_id
    LEFT JOIN users u ON u.id = sp.user_id
    ${connectedOnlyJoin}
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
        SELECT c.id::text AS connection_id,
               c.startup_id::text AS startup_user_id,
               c.requester_id::text AS requester_id,
               c.status,
               c.declined_at
        FROM public.connections c
        WHERE c.investor_id::text = $1
          AND c.startup_id::text = ANY($2::text[])
      `,
      [requesterUserId, uniqueStartupUserIds],
    );

    return new Map(
      connectionResult.rows
        .map((row) => {
          const status = normalizeConnectionStatus(row.status);
          if (!status) return null;
          return [
            row.startup_user_id,
            {
              status,
              connection_id: row.connection_id,
              requester_id: row.requester_id,
              declined_at: row.declined_at || null,
            },
          ];
        })
        .filter(Boolean),
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
