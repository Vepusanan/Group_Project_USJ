import pool from "../config/database.js";
import { normalizeFilterToken, normalizeFilterTokenList } from "../utils/filterNormalize.js";

const safeStringify = (value) => {
  if (value === undefined || value === null) return null;
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

  if (isJson) {
    return safeStringify(value);
  }

  if (Array.isArray(value)) {
    return safeStringify(value);
  }

  if (typeof value === "object") {
    return safeStringify(value);
  }

  return value;
}

function getFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

const toIntegerOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toBooleanOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};

function buildCreatePayload(columns, payload) {
  const mapped = {
    name_or_firm: getFirstDefined(
      payload.name_or_firm,
      payload.name,
      payload.firm_name,
    ),
    investor_type: payload.investor_type,
    years_of_experience: toIntegerOrNull(payload.years_of_experience),
    professional_background: getFirstDefined(
      payload.professional_background,
      payload.background,
    ),
    investment_thesis: payload.investment_thesis,
    industries_of_interest: getFirstDefined(
      payload.industries_of_interest,
      payload.industries,
    ),
    geographic_preference: getFirstDefined(
      payload.geographic_preference,
      payload.geography,
    ),
    stage_preference: getFirstDefined(
      payload.stage_preference,
      payload.investment_stage,
    ),
    min_investment_size: toNumberOrNull(
      getFirstDefined(payload.min_investment_size, payload.investment_size_min),
    ),
    max_investment_size: toNumberOrNull(
      getFirstDefined(payload.max_investment_size, payload.investment_size_max),
    ),
    investment_structure: payload.investment_structure,
    follow_on_investment: toBooleanOrNull(payload.follow_on_investment),
    investment_timeline: payload.investment_timeline,
    number_of_investments: toIntegerOrNull(
      getFirstDefined(payload.number_of_investments, payload.total_investments),
    ),
    portfolio_companies: payload.portfolio_companies,
    successful_exits: getFirstDefined(
      payload.successful_exits,
      payload.notable_exits,
    ),
    notable_achievements: payload.notable_achievements,
    what_you_look_for: getFirstDefined(
      payload.what_you_look_for,
      payload.investment_criteria,
    ),
    deal_breakers: getFirstDefined(payload.deal_breakers, payload.red_flags),
    value_add: payload.value_add,
    network_resources: payload.network_resources,
    primary_contact_email: getFirstDefined(
      payload.primary_contact_email,
      payload.contact_email,
    ),
    phone_number: getFirstDefined(payload.phone_number, payload.contact_phone),
    social_media: payload.social_media,
    preferred_contact_method: payload.preferred_contact_method,
    photo_url: payload.photo_url,
    location_country: payload.location_country,
    location_city: payload.location_city,
  };

  const normalized = {};
  for (const [columnName, rawValue] of Object.entries(mapped)) {
    if (!Object.prototype.hasOwnProperty.call(columns, columnName)) continue;
    const value = normalizeValueForColumn(columns[columnName], rawValue);
    if (value !== undefined) {
      normalized[columnName] = value;
    }
  }

  return normalized;
}

const INVESTOR_SEARCH_VECTOR = `to_tsvector('english', coalesce(ip.name_or_firm, '') || ' ' || coalesce(ip.investment_thesis, ''))`;

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
    const ref = addValue(investorType.trim().toUpperCase());
    clauses.push(`ip.investor_type = ${ref}::public.investor_type_enum`);
  }

  if (location) {
    const ref = addValue(`%${location.trim().toLowerCase()}%`);
    // Match either the physical location (country/city) OR the geographic
    // preference jsonb (regions the investor targets). The user typing
    // "Sri Lanka" likely means "show investors who are in OR target Sri Lanka".
    clauses.push(
      `(LOWER(COALESCE(ip.location_country, '')) LIKE ${ref}
        OR LOWER(COALESCE(ip.location_city, '')) LIKE ${ref}
        OR LOWER(COALESCE(ip.geographic_preference::text, '')) LIKE ${ref})`,
    );
  }

  if (industries.length > 0) {
    const normalized = normalizeFilterTokenList(industries);
    const ref = addValue(normalized);
    clauses.push(
      `EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          CASE jsonb_typeof(ip.industries_of_interest)
            WHEN 'array' THEN ip.industries_of_interest
            ELSE '[]'::jsonb
          END
        ) AS ind
        WHERE regexp_replace(LOWER(ind), '[^a-z0-9]', '', 'g') = ANY(${ref})
      )`,
    );
  }

  if (investmentStage) {
    const stageToken = normalizeFilterToken(investmentStage);
    const ref = addValue(stageToken);
    clauses.push(
      `EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(
          CASE jsonb_typeof(ip.stage_preference)
            WHEN 'array' THEN ip.stage_preference
            ELSE '[]'::jsonb
          END
        ) AS stage
        WHERE regexp_replace(LOWER(stage), '[^a-z0-9]', '', 'g') = ${ref}
      )`,
    );
  }

  // Check-size filter (amounts in whole USD, same scale as profile cards):
  // - min only  → investor can write at least that much
  // - max only  → investor's minimum ticket fits a raise up to that size
  // - both set  → investor can participate in [min,max] AND their max check ≤ your max
  //   (excludes e.g. $25K–$2M when you filter up to $100K)
  if (investmentMin != null && investmentMax != null) {
    const minRef = addValue(investmentMin);
    const maxRef = addValue(investmentMax);
    clauses.push(
      `(ip.min_investment_size <= ${maxRef}
        AND ip.max_investment_size >= ${minRef}
        AND ip.max_investment_size <= ${maxRef})`,
    );
  } else if (investmentMin != null) {
    const ref = addValue(investmentMin);
    clauses.push(`ip.max_investment_size >= ${ref}`);
  } else if (investmentMax != null) {
    const ref = addValue(investmentMax);
    clauses.push(`ip.min_investment_size <= ${ref}`);
  }

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

const investorVerificationRankSql = `CASE COALESCE(u.verification_tier::text, 'UNVERIFIED')
  WHEN 'BUSINESS_VERIFIED' THEN 2
  WHEN 'IDENTITY_VERIFIED' THEN 1
  ELSE 0
END DESC`;

const getInvestorSortClause = (sort) => {
  switch (sort) {
    case "alphabetical":
      return `ORDER BY ${investorVerificationRankSql}, ip.name_or_firm ASC NULLS LAST`;
    case "most_experienced":
      return `ORDER BY ${investorVerificationRankSql}, ip.years_of_experience DESC NULLS LAST`;
    default:
      return `ORDER BY ${investorVerificationRankSql}, ip.investor_profile_id DESC`;
  }
};

export async function createInvestorProfile(userId, payload) {
  const columns = await getInvestorProfileColumns();
  const mappedPayload = buildCreatePayload(columns, payload);

  const insertColumns = ["user_id", ...Object.keys(mappedPayload)];
  const placeholders = insertColumns.map((_, i) => `$${i + 1}`);
  const values = [userId, ...Object.values(mappedPayload)];

  const q = `INSERT INTO investor_profiles (${insertColumns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;

  const result = await pool.query(q, values);
  return result.rows[0];
}

export async function getInvestorProfileById(id) {
  const q = "SELECT * FROM investor_profiles WHERE investor_profile_id = $1";
  const result = await pool.query(q, [id]);
  return result.rows[0] || null;
}

export async function getInvestorProfileByUserId(userId) {
  const q = "SELECT * FROM investor_profiles WHERE user_id = $1";
  const result = await pool.query(q, [userId]);
  return result.rows[0] || null;
}

export async function updateInvestorProfile(id, userId, updates) {
  const columns = await getInvestorProfileColumns();

  const allowed = [
    "name_or_firm",
    "investor_type",
    "years_of_experience",
    "professional_background",
    "investment_thesis",
    "industries_of_interest",
    "geographic_preference",
    "stage_preference",
    "min_investment_size",
    "max_investment_size",
    "investment_structure",
    "follow_on_investment",
    "investment_timeline",
    "number_of_investments",
    "portfolio_companies",
    "successful_exits",
    "notable_achievements",
    "what_you_look_for",
    "deal_breakers",
    "value_add",
    "network_resources",
    "primary_contact_email",
    "phone_number",
    "social_media",
    "preferred_contact_method",
    "photo_url",
  ];

  const aliasToColumn = {
    name: "name_or_firm",
    firm_name: "name_or_firm",
    background: "professional_background",
    industries: "industries_of_interest",
    geography: "geographic_preference",
    investment_stage: "stage_preference",
    investment_size_min: "min_investment_size",
    investment_size_max: "max_investment_size",
    total_investments: "number_of_investments",
    notable_exits: "successful_exits",
    contact_email: "primary_contact_email",
    contact_phone: "phone_number",
    investment_criteria: "what_you_look_for",
    red_flags: "deal_breakers",
  };

  const normalizedUpdates = { ...updates };
  for (const [alias, canonical] of Object.entries(aliasToColumn)) {
    if (
      Object.prototype.hasOwnProperty.call(normalizedUpdates, alias) &&
      !Object.prototype.hasOwnProperty.call(normalizedUpdates, canonical)
    ) {
      normalizedUpdates[canonical] = normalizedUpdates[alias];
    }
  }

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (
      Object.prototype.hasOwnProperty.call(normalizedUpdates, key) &&
      columns[key]
    ) {
      let val = normalizedUpdates[key];

      if (["years_of_experience", "number_of_investments"].includes(key)) {
        val = toIntegerOrNull(val);
      }

      if (["min_investment_size", "max_investment_size"].includes(key)) {
        val = toNumberOrNull(val);
      }

      if (key === "follow_on_investment") {
        val = toBooleanOrNull(val);
      }

      val = normalizeValueForColumn(columns[key], val);
      sets.push(`${key} = $${idx}`);
      values.push(val);
      idx += 1;
    }
  }

  if (sets.length === 0) {
    return getInvestorProfileById(id);
  }

  const q = `UPDATE investor_profiles SET ${sets.join(", ")} WHERE investor_profile_id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  values.push(id, userId);

  const result = await pool.query(q, values);
  return result.rows[0] || null;
}

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
    SELECT ip.*, COALESCE(u.verification_tier::text, 'UNVERIFIED') AS verification_tier
    FROM investor_profiles ip
    LEFT JOIN privacy_settings ps ON ps.user_id = ip.user_id
    LEFT JOIN users u ON u.id = ip.user_id
    ${whereClause}
    ${getInvestorSortClause(sort)}
    LIMIT ${limitRef} OFFSET ${offsetRef}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM investor_profiles ip
    LEFT JOIN privacy_settings ps ON ps.user_id = ip.user_id
    LEFT JOIN users u ON u.id = ip.user_id
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

const normalizeConnectionStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "connected") return "accepted";
  if (["pending", "accepted", "declined"].includes(value)) return value;
  return null;
};

export async function getConnectionStatusesForInvestors(
  requesterUserId,
  investorUserIds = [],
) {
  if (!requesterUserId || investorUserIds.length === 0) {
    return new Map();
  }

  const uniqueInvestorUserIds = [...new Set(investorUserIds.filter(Boolean))];
  if (uniqueInvestorUserIds.length === 0) {
    return new Map();
  }

  const tableResult = await pool.query(
    `SELECT to_regclass('public.connections') AS table_name`,
  );

  if (!tableResult.rows[0]?.table_name) {
    return new Map();
  }

  const connectionsResult = await pool.query(
    `
      SELECT c.id::text AS connection_id,
             c.investor_id::text AS investor_user_id,
             c.requester_id::text AS requester_id,
             c.status,
             c.declined_at
      FROM public.connections c
      WHERE c.startup_id::text = $1
        AND c.investor_id::text = ANY($2::text[])
    `,
    [requesterUserId, uniqueInvestorUserIds],
  );

  return new Map(
    connectionsResult.rows
      .map((row) => {
        const status = normalizeConnectionStatus(row.status);
        if (!status) return null;
        return [
          row.investor_user_id,
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
