import pool from "../config/database.js";

/**
 * Get privacy settings for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Privacy settings or null if not found
 */
export async function getPrivacySettingsByUserId(userId) {
  const query = `
    SELECT 
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status,
      created_at,
      updated_at
    FROM privacy_settings
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create default privacy settings for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created privacy settings
 */
export async function createDefaultPrivacySettings(userId) {
  const query = `
    INSERT INTO privacy_settings (
      user_id,
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status
    ) VALUES ($1, 'public', true, true, true)
    RETURNING 
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Create privacy settings with custom values for a user
 * @param {string} userId - User ID
 * @param {Object} settings - Privacy settings data
 * @returns {Promise<Object>} Created privacy settings
 */
export async function createPrivacySettings(userId, settings) {
  const query = `
    INSERT INTO privacy_settings (
      user_id,
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING 
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status,
      created_at,
      updated_at
  `;

  const values = [
    userId,
    settings.profile_visibility || "public",
    settings.connection_request_setting !== undefined ? settings.connection_request_setting : true,
    settings.show_connections_list !== undefined ? settings.show_connections_list : true,
    settings.show_activity_status !== undefined ? settings.show_activity_status : true,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update privacy settings for a user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated privacy settings
 */
export async function updatePrivacySettings(userId, updates) {
  // Build dynamic update query for only provided fields
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updates.profile_visibility !== undefined) {
    updateFields.push(`profile_visibility = $${paramCount}`);
    values.push(updates.profile_visibility);
    paramCount++;
  }
  if (updates.connection_request_setting !== undefined) {
    updateFields.push(`connection_request_setting = $${paramCount}`);
    values.push(updates.connection_request_setting);
    paramCount++;
  }
  if (updates.show_connections_list !== undefined) {
    updateFields.push(`show_connections_list = $${paramCount}`);
    values.push(updates.show_connections_list);
    paramCount++;
  }
  if (updates.show_activity_status !== undefined) {
    updateFields.push(`show_activity_status = $${paramCount}`);
    values.push(updates.show_activity_status);
    paramCount++;
  }

  // If no updates provided, return null
  if (updateFields.length === 0) {
    return null;
  }

  // Add user_id to values array
  values.push(userId);

  const query = `
    UPDATE privacy_settings
    SET ${updateFields.join(", ")}
    WHERE user_id = $${paramCount}
    RETURNING 
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Check if privacy settings exist for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if settings exist
 */
export async function privacySettingsExist(userId) {
  const query = "SELECT id FROM privacy_settings WHERE user_id = $1";
  const result = await pool.query(query, [userId]);
  return result.rows.length > 0;
}
