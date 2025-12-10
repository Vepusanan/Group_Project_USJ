import pool from "../config/database.js";

// Helper to safely stringify JSON fields (only if they're objects)
const safeStringify = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
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
    payload.follow_on_investment !== undefined ? payload.follow_on_investment : true,
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
    payload.is_actively_investing !== undefined ? payload.is_actively_investing : true,
    payload.profile_visibility || 'public',
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
      if ([
        "industries", 
        "geography", 
        "investment_stage", 
        "investment_structure", 
        "portfolio_companies", 
        "notable_exits",
        "network_resources",
        "social_media"
      ].includes(key) && val !== undefined) {
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
