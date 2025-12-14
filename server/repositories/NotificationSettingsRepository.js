import pool from "../config/database.js";

/**
 * Get notification settings for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Notification settings or null if not found
 */
export async function getNotificationSettingsByUserId(userId) {
  const query = `
    SELECT 
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates,
      created_at,
      updated_at
    FROM notification_settings
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create default notification settings for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created notification settings
 */
export async function createDefaultNotificationSettings(userId) {
  const query = `
    INSERT INTO notification_settings (
      user_id,
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates
    ) VALUES ($1, true, true, false, true, 'instant', true, true, true, true)
    RETURNING 
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Create notification settings with custom values for a user
 * @param {string} userId - User ID
 * @param {Object} settings - Notification settings data
 * @returns {Promise<Object>} Created notification settings
 */
export async function createNotificationSettings(userId, settings) {
  const query = `
    INSERT INTO notification_settings (
      user_id,
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING 
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates,
      created_at,
      updated_at
  `;

  const values = [
    userId,
    settings.email_connection_requests !== undefined ? settings.email_connection_requests : true,
    settings.email_messages !== undefined ? settings.email_messages : true,
    settings.email_profile_views !== undefined ? settings.email_profile_views : false,
    settings.email_weekly_digest !== undefined ? settings.email_weekly_digest : true,
    settings.notification_frequency || "instant",
    settings.inapp_connection_requests !== undefined ? settings.inapp_connection_requests : true,
    settings.inapp_messages !== undefined ? settings.inapp_messages : true,
    settings.inapp_profile_views !== undefined ? settings.inapp_profile_views : true,
    settings.inapp_system_updates !== undefined ? settings.inapp_system_updates : true,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update notification settings for a user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated notification settings
 */
export async function updateNotificationSettings(userId, updates) {
  // Build dynamic update query for only provided fields
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (updates.email_connection_requests !== undefined) {
    updateFields.push(`email_connection_requests = $${paramCount}`);
    values.push(updates.email_connection_requests);
    paramCount++;
  }
  if (updates.email_messages !== undefined) {
    updateFields.push(`email_messages = $${paramCount}`);
    values.push(updates.email_messages);
    paramCount++;
  }
  if (updates.email_profile_views !== undefined) {
    updateFields.push(`email_profile_views = $${paramCount}`);
    values.push(updates.email_profile_views);
    paramCount++;
  }
  if (updates.email_weekly_digest !== undefined) {
    updateFields.push(`email_weekly_digest = $${paramCount}`);
    values.push(updates.email_weekly_digest);
    paramCount++;
  }
  if (updates.notification_frequency !== undefined) {
    updateFields.push(`notification_frequency = $${paramCount}`);
    values.push(updates.notification_frequency);
    paramCount++;
  }
  if (updates.inapp_connection_requests !== undefined) {
    updateFields.push(`inapp_connection_requests = $${paramCount}`);
    values.push(updates.inapp_connection_requests);
    paramCount++;
  }
  if (updates.inapp_messages !== undefined) {
    updateFields.push(`inapp_messages = $${paramCount}`);
    values.push(updates.inapp_messages);
    paramCount++;
  }
  if (updates.inapp_profile_views !== undefined) {
    updateFields.push(`inapp_profile_views = $${paramCount}`);
    values.push(updates.inapp_profile_views);
    paramCount++;
  }
  if (updates.inapp_system_updates !== undefined) {
    updateFields.push(`inapp_system_updates = $${paramCount}`);
    values.push(updates.inapp_system_updates);
    paramCount++;
  }

  // If no updates provided, return null
  if (updateFields.length === 0) {
    return null;
  }

  // Add user_id to values array
  values.push(userId);

  const query = `
    UPDATE notification_settings
    SET ${updateFields.join(", ")}
    WHERE user_id = $${paramCount}
    RETURNING 
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates,
      created_at,
      updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Check if notification settings exist for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if settings exist
 */
export async function notificationSettingsExist(userId) {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM notification_settings WHERE user_id = $1
    ) AS exists
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0].exists;
}

/**
 * Delete notification settings for a user (mainly for cleanup/testing)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteNotificationSettings(userId) {
  const query = `
    DELETE FROM notification_settings
    WHERE user_id = $1
    RETURNING id
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0;
}
