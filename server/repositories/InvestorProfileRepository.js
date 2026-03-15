import pool from "../config/database.js";

// Helper to safely stringify JSON fields (only if they're objects)
const safeStringify = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

/**
 * Create a new investor profile in the database
 * @param {string} userId - User ID
 * @param {Object} payload - Profile data
 * @returns {Promise<Object>} Created profile
 */
export async function createInvestorProfile(userId, payload) {
  const q = `INSERT INTO investor_profiles
    (user_id, name, firm_name, photo_url, city, country, website, linkedin, 
     investor_type, years_of_experience, background, investment_thesis, 
     industries, geography, investment_stage, investment_size_min, investment_size_max, 
     investment_structure, follow_on_investment, investment_timeline, 
     portfolio_companies, notable_exits, total_investments, 
     investment_criteria, red_flags, ideal_founder_profile, 
     notable_achievements, value_add, network_resources, social_media, 
     contact_email, contact_phone, preferred_contact_method, 
     is_actively_investing, profile_visibility)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35)
    RETURNING *`;

  const values = [
    userId,
    payload.name || null,
    payload.firm_name || null,
    payload.photo_url || null,
    payload.city || null,
    payload.country || null,
    payload.website || null,
    payload.linkedin || null,
    payload.investor_type || null,
    payload.years_of_experience || null,
    payload.background || null,
    payload.investment_thesis || null,
    safeStringify(payload.industries),
    safeStringify(payload.geography),
    safeStringify(payload.investment_stage),
    payload.investment_size_min || null,
    payload.investment_size_max || null,
    safeStringify(payload.investment_structure),
    payload.follow_on_investment !== undefined
      ? payload.follow_on_investment
      : true,
    payload.investment_timeline || null,
    safeStringify(payload.portfolio_companies),
    safeStringify(payload.notable_exits),
    payload.total_investments || null,
    payload.investment_criteria || null,
    payload.red_flags || null,
    payload.ideal_founder_profile || null,
    payload.notable_achievements || null,
    payload.value_add || null,
    safeStringify(payload.network_resources),
    safeStringify(payload.social_media),
    payload.contact_email || null,
    payload.contact_phone || null,
    payload.preferred_contact_method || null,
    payload.is_actively_investing !== undefined
      ? payload.is_actively_investing
      : true,
    payload.profile_visibility || "public",
  ];

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
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      let val = updates[key];
      if (
        [
          "industries",
          "geography",
          "investment_stage",
          "investment_structure",
          "portfolio_companies",
          "notable_exits",
          "network_resources",
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
