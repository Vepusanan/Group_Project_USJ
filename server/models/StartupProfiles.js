import pool from "../config/database.js";

// Note: This model assumes a `startup_profiles` table exists in the database with
// sensible columns like: id, user_id, company_name, founders (jsonb), logo_url,
// location, website, linkedin, tagline, description, industry, founded_date,
// stage, team (jsonb), funding (jsonb), traction (jsonb), documents (jsonb),
// contact_email, contact_phone, created_at, updated_at

export async function createStartupProfile(userId, payload) {
  const q = `INSERT INTO startup_profiles
    (user_id, company_name, founders, logo_url, city, country, website, linkedin, tagline, description, industry, founded_date, stage, team, funding, traction, documents, contact_email, contact_phone)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    RETURNING *`;

  // Helper to safely stringify JSON fields (only if they're objects)
  const safeStringify = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };

  const values = [
    userId,
    payload.company_name || null,
    safeStringify(payload.founders),
    payload.logo_url || null,
    payload.city || null,
    payload.country || null,
    payload.website || null,
    payload.linkedin || null,
    payload.tagline || null,
    payload.description || null,
    payload.industry || null,
    payload.founded_date || null,
    payload.stage || null,
    safeStringify(payload.team),
    safeStringify(payload.funding),
    safeStringify(payload.traction),
    safeStringify(payload.documents),
    payload.contact_email || null,
    payload.contact_phone || null,
  ];

  const result = await pool.query(q, values);
  return result.rows[0];
}

export async function getStartupProfileById(id) {
  const q = "SELECT * FROM startup_profiles WHERE id = $1";
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
    "contact_email",
    "contact_phone",
  ];

  const sets = [];
  const values = [];
  let idx = 1;

  // Helper to safely stringify JSON fields
  const safeStringify = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      let val = updates[key];
      if (["founders", "team", "funding", "traction", "documents"].includes(key) && val !== undefined) {
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
//Startup profile operations