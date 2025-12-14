import pool from "../config/database.js"; // Your database connection pool

/**
 * Deletes user accounts that have not been email verified and are older than 7 days.
 */
export const deleteStaleUnverifiedUsers = async () => {
  const cutoffDate = "7 days"; // PostgreSQL interval syntax for 7 days

  try {
    const result = await pool.query(
      `DELETE FROM users
       WHERE email_verified = false
       AND created_at < NOW() - INTERVAL $1
       RETURNING id, email, created_at;`,
      [cutoffDate]
    );

    if (result.rowCount > 0) {
      console.log(
        `🧹 Cleanup Job: Successfully deleted ${result.rowCount} stale, unverified users.`
      );
      // Optionally log the IDs of deleted users
      // console.log('Deleted Users:', result.rows);
    } else {
      console.log("🧹 Cleanup Job: No stale unverified users found to delete.");
    }
    return result.rowCount;
  } catch (error) {
    console.error("❌ Cleanup Job Error:", error);
    // Depending on your requirements, you might want to alert monitoring here
    throw error;
  }
};

/**
 * Deletes expired data export tokens (older than expiration time).
 */
export const deleteExpiredExportTokens = async () => {
  try {
    const result = await pool.query(
      `DELETE FROM data_export_tokens
       WHERE expires_at < NOW()
       RETURNING id, user_id, created_at;`
    );

    if (result.rowCount > 0) {
      console.log(
        `🧹 Cleanup Job: Successfully deleted ${result.rowCount} expired export tokens.`
      );
    } else {
      console.log("🧹 Cleanup Job: No expired export tokens found to delete.");
    }
    return result.rowCount;
  } catch (error) {
    console.error("❌ Cleanup Job Error (Export Tokens):", error);
    // Table might not exist yet, which is okay
    if (error.code !== '42P01') { // PostgreSQL error code for "undefined table"
      throw error;
    }
    return 0;
  }
};
