import pool from "../config/database.js";

// Helper to safely stringify JSON fields (only if they're objects)
const safeStringify = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

let investorProfileColumnsCache = null;

async function getInvestorProfileColumns() {
  if (investorProfileColumnsCache) {
    return investorProfileColumnsCache;
  }

  const schemaQuery = `
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'investor_profiles'
  `;

  const result = await pool.query(schemaQuery);
  const columns = {};
  for (const row of result.rows) {
    columns[row.column_name] = {
      dataType: row.data_type,
      udtName: row.udt_name,
    };
  }

  investorProfileColumnsCache = columns;
  return columns;
}

function normalizeValueForColumn(columnMeta, value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const isJson =
    columnMeta &&
    (columnMeta.dataType === "json" || columnMeta.dataType === "jsonb");
  const isTextArray =
    columnMeta && columnMeta.dataType === "ARRAY" && columnMeta.udtName === "_text";

  if (isJson) {
    return safeStringify(value);
  }

  if (isTextArray) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch (e) {
        // Fall through to best-effort single item array.
      }

      return [value];
    }

    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : null;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

function getLocationFromPayload(payload) {
  if (payload.location) return payload.location;
  const parts = [payload.city, payload.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function getFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

function assignIfColumnExists(target, columns, columnName, rawValue) {
  if (!columns[columnName]) return;

  const normalized = normalizeValueForColumn(columns[columnName], rawValue);
  if (normalized !== undefined) {
    target[columnName] = normalized;
  }
}

function buildCreatePayloadForExistingSchema(columns, payload) {
  const mapped = {};

  assignIfColumnExists(mapped, columns, "name", payload.name || null);
  assignIfColumnExists(mapped, columns, "firm_name", payload.firm_name || null);
  assignIfColumnExists(mapped, columns, "photo_url", payload.photo_url || null);
  assignIfColumnExists(mapped, columns, "location", getLocationFromPayload(payload));
  assignIfColumnExists(mapped, columns, "city", payload.city || null);
  assignIfColumnExists(mapped, columns, "country", payload.country || null);
  assignIfColumnExists(mapped, columns, "website", payload.website || null);
  assignIfColumnExists(mapped, columns, "linkedin", payload.linkedin || null);
  assignIfColumnExists(mapped, columns, "investor_type", payload.investor_type || null);

  const experience = getFirstDefined(
    payload.years_of_experience,
    payload.experience_years,
    null,
  );
  assignIfColumnExists(mapped, columns, "years_of_experience", experience);
  assignIfColumnExists(mapped, columns, "experience_years", experience);
  assignIfColumnExists(mapped, columns, "background", payload.background || null);

  assignIfColumnExists(
    mapped,
    columns,
    "investment_thesis",
    payload.investment_thesis || null,
  );
  assignIfColumnExists(mapped, columns, "industries", payload.industries || null);
  assignIfColumnExists(mapped, columns, "geography", payload.geography || null);
  assignIfColumnExists(
    mapped,
    columns,
    "investment_stage",
    payload.investment_stage || null,
  );

  const investmentMin = getFirstDefined(
    payload.investment_size_min,
    payload.min_investment_size,
    null,
  );
  const investmentMax = getFirstDefined(
    payload.investment_size_max,
    payload.max_investment_size,
    null,
  );

  assignIfColumnExists(mapped, columns, "investment_size_min", investmentMin);
  assignIfColumnExists(mapped, columns, "investment_size_max", investmentMax);
  assignIfColumnExists(mapped, columns, "min_investment_size", investmentMin);
  assignIfColumnExists(mapped, columns, "max_investment_size", investmentMax);

  const followOn =
    payload.follow_on_investment !== undefined
      ? payload.follow_on_investment
      : true;
  assignIfColumnExists(mapped, columns, "investment_structure", payload.investment_structure || null);
  assignIfColumnExists(mapped, columns, "follow_on_investment", followOn);
  assignIfColumnExists(
    mapped,
    columns,
    "investment_timeline",
    payload.investment_timeline || null,
  );

  assignIfColumnExists(
    mapped,
    columns,
    "portfolio_companies",
    payload.portfolio_companies || null,
  );
  assignIfColumnExists(mapped, columns, "notable_exits", payload.notable_exits || null);
  assignIfColumnExists(
    mapped,
    columns,
    "total_investments",
    payload.total_investments || null,
  );

  assignIfColumnExists(
    mapped,
    columns,
    "investment_criteria",
    payload.investment_criteria || null,
  );
  assignIfColumnExists(mapped, columns, "red_flags", payload.red_flags || null);
  assignIfColumnExists(
    mapped,
    columns,
    "ideal_founder_profile",
    payload.ideal_founder_profile || null,
  );
  assignIfColumnExists(
    mapped,
    columns,
    "notable_achievements",
    payload.notable_achievements || null,
  );
  assignIfColumnExists(mapped, columns, "value_add", payload.value_add || null);
  assignIfColumnExists(
    mapped,
    columns,
    "network_resources",
    payload.network_resources || null,
  );
  assignIfColumnExists(mapped, columns, "social_media", payload.social_media || null);

  assignIfColumnExists(mapped, columns, "contact_email", payload.contact_email || null);
  assignIfColumnExists(mapped, columns, "contact_phone", payload.contact_phone || null);
  assignIfColumnExists(
    mapped,
    columns,
    "preferred_contact_method",
    payload.preferred_contact_method || null,
  );

  const isActive =
    payload.is_actively_investing !== undefined
      ? payload.is_actively_investing
      : true;
  assignIfColumnExists(mapped, columns, "is_actively_investing", isActive);
  assignIfColumnExists(
    mapped,
    columns,
    "profile_visibility",
    payload.profile_visibility || "public",
  );

  return mapped;
}

/**
 * Create a new investor profile in the database
 * @param {string} userId - User ID
 * @param {Object} payload - Profile data
 * @returns {Promise<Object>} Created profile
 */
export async function createInvestorProfile(userId, payload) {
  const columns = await getInvestorProfileColumns();
  const mappedPayload = buildCreatePayloadForExistingSchema(columns, payload);

  const insertColumns = ["user_id", ...Object.keys(mappedPayload)];
  const placeholders = insertColumns.map((_, i) => `$${i + 1}`);
  const values = [userId, ...Object.values(mappedPayload)];

  const q = `INSERT INTO investor_profiles (${insertColumns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;

  const result = await pool.query(q, values);
  return result.rows[0];
}

/**
 * Get investor profile by ID
 * @param {string} id - Profile ID
 * @returns {Promise<Object|null>} Profile or null
 */
export async function getInvestorProfileById(id) {
  const q = "SELECT * FROM investor_profiles WHERE id = $1";
  const result = await pool.query(q, [id]);
  return result.rows[0] || null;
}

/**
 * Get investor profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile or null
 */
export async function getInvestorProfileByUserId(userId) {
  const q = "SELECT * FROM investor_profiles WHERE user_id = $1";
  const result = await pool.query(q, [userId]);
  return result.rows[0] || null;
}

/**
 * Update investor profile
 * @param {string} id - Profile ID
 * @param {string} userId - User ID (for ownership verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated profile or null
 */
export async function updateInvestorProfile(id, userId, updates) {
  const columns = await getInvestorProfileColumns();

  const allowed = [
    "name",
    "firm_name",
    "photo_url",
    "city",
    "country",
    "website",
    "linkedin",
    "investor_type",
    "years_of_experience",
    "background",
    "investment_thesis",
    "industries",
    "geography",
    "investment_stage",
    "investment_size_min",
    "investment_size_max",
    "investment_structure",
    "follow_on_investment",
    "investment_timeline",
    "portfolio_companies",
    "notable_exits",
    "total_investments",
    "investment_criteria",
    "red_flags",
    "ideal_founder_profile",
    "notable_achievements",
    "value_add",
    "network_resources",
    "social_media",
    "contact_email",
    "contact_phone",
    "preferred_contact_method",
    "is_actively_investing",
    "profile_visibility",
  ];

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key) && columns[key]) {
      let val = updates[key];

      val = normalizeValueForColumn(columns[key], val);
      sets.push(`${key} = $${idx}`);
      values.push(val);
      idx += 1;
    }
  }

  if (sets.length === 0) {
    return getInvestorProfileById(id);
  }

  // updated_at will use DB trigger if available; otherwise update manually
  const q = `UPDATE investor_profiles SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  values.push(id, userId);

  const result = await pool.query(q, values);
  return result.rows[0] || null;
}

// ─── Investor list / search ────────────────────────────────────────────────

const INVESTOR_SEARCH_VECTOR = `to_tsvector('english', coalesce(ip.firm_name, '') || ' ' || coalesce(ip.investment_thesis, ''))`;

const buildListInvestorsQuery = ({
  searchTerm,
  investorType,
  location,
  industries,
  investmentStage,
  investmentMin,
  investmentMax,
  requesterUserId,
}) => {
  const clauses = [];
  const values = [];

  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (searchTerm && searchTerm.trim()) {
    const ref = addValue(searchTerm.trim());
    clauses.push(
      `${INVESTOR_SEARCH_VECTOR} @@ websearch_to_tsquery('english', ${ref})`,
    );
  }

  if (investorType) {
    const ref = addValue(investorType.trim().toLowerCase());
    clauses.push(`LOWER(ip.investor_type) = ${ref}`);
  }

  if (location) {
    const ref = addValue(`%${location.trim().toLowerCase()}%`);
    clauses.push(`LOWER(COALESCE(ip.location, '')) LIKE ${ref}`);
  }

  if (industries.length > 0) {
    const normalized = industries.map((i) => i.trim().toLowerCase());
    const ref = addValue(normalized);
    clauses.push(
      `EXISTS (SELECT 1 FROM unnest(ip.industries) AS ind WHERE LOWER(ind) = ANY(${ref}))`,
    );
  }

  if (investmentStage) {
    const ref = addValue(investmentStage.trim().toLowerCase());
    clauses.push(`LOWER(ip.investment_stage) = ${ref}`);
  }

  if (investmentMin != null) {
    const ref = addValue(investmentMin);
    clauses.push(`ip.max_investment_size >= ${ref}`);
  }

  if (investmentMax != null) {
    const ref = addValue(investmentMax);
    clauses.push(`ip.min_investment_size <= ${ref}`);
  }

  // Privacy: owner always sees their own profile; others need public visibility
  if (requesterUserId) {
    const ref = addValue(requesterUserId);
    clauses.push(
      `(ip.user_id = ${ref} OR COALESCE(ps.profile_visibility, 'public') = 'public')`,
    );
  } else {
    clauses.push(`COALESCE(ps.profile_visibility, 'public') = 'public'`);
  }

  const whereClause =
    clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  return { whereClause, values };
};

const getInvestorSortClause = (sort) => {
  switch (sort) {
    case "alphabetical":
      return "ORDER BY ip.firm_name ASC NULLS LAST";
    case "most_experienced":
      return "ORDER BY ip.experience_years DESC NULLS LAST";
    default: // newest
      return "ORDER BY ip.created_at DESC NULLS LAST";
  }
};

export async function listInvestors(options = {}) {
  const {
    page = 1,
    limit = 20,
    q,
    investor_type,
    location,
    industries: industryParam,
    investment_stage,
    investment_min,
    investment_max,
    sort = "newest",
    requesterUserId = null,
  } = options;

  const industries = Array.isArray(industryParam)
    ? industryParam
    : typeof industryParam === "string"
      ? industryParam
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  const { whereClause, values } = buildListInvestorsQuery({
    searchTerm: q,
    investorType: investor_type,
    location,
    industries,
    investmentStage: investment_stage,
    investmentMin: investment_min != null ? Number(investment_min) : null,
    investmentMax: investment_max != null ? Number(investment_max) : null,
    requesterUserId,
  });

  const offset = (page - 1) * limit;
  const paginationValues = [...values, limit, offset];
  const limitRef = `$${paginationValues.length - 1}`;
  const offsetRef = `$${paginationValues.length}`;

  const selectSql = `
    SELECT ip.*
    FROM investor_profiles ip
    LEFT JOIN privacy_settings ps ON ps.user_id = ip.user_id
    ${whereClause}
    ${getInvestorSortClause(sort)}
    LIMIT ${limitRef} OFFSET ${offsetRef}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM investor_profiles ip
    LEFT JOIN privacy_settings ps ON ps.user_id = ip.user_id
    ${whereClause}
  `;

  const [rowsResult, countResult] = await Promise.all([
    pool.query(selectSql, paginationValues),
    pool.query(countSql, values),
  ]);

  return {
    rows: rowsResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
}
