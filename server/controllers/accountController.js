import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../config/database.js";
import {
  sendEmailChangeVerificationEmail,
  sendEmailChangeNotificationToOldEmail,
  sendPasswordChangeConfirmationEmail,
  sendAccountDeletionConfirmationEmail,
} from "../utils/emailServices.js";
import { logAuthEvent, getClientIp } from "../repositories/UserActivityRepository.js";

// Helper function to generate a secure token
const generateEmailChangeToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Change Email - Step 1: Request email change
 * PUT /api/account/email
 * 
 * Process:
 * 1. Validate new email
 * 2. Check if new email is already in use
 * 3. Generate verification token
 * 4. Send verification email to new address
 * 5. Send notification to old address
 */
export const changeEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;
    const currentEmail = req.user.email;

    // 1. Validate input
    if (!newEmail) {
      return res.status(400).json({
        success: false,
        error: "New email address is required",
      });
    }

    // Check if new email is same as current
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: "New email must be different from current email",
      });
    }

    // 2. Check if new email is already in use by another user
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [newEmail.toLowerCase(), userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "This email address is already in use",
      });
    }

    // 3. Generate verification token
    const token = generateEmailChangeToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // 4. Store token in database
    await pool.query(
      `INSERT INTO email_change_tokens (user_id, new_email, token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, newEmail.toLowerCase(), token, expiresAt]
    );

    // 5. Send verification email to new address (non-blocking)
    try {
      await sendEmailChangeVerificationEmail(newEmail.toLowerCase(), token);
    } catch (emailError) {
      console.error("Failed to send email change verification:", emailError.message);
    }

    // 6. Send notification to old email (non-blocking)
    try {
      await sendEmailChangeNotificationToOldEmail(currentEmail, newEmail.toLowerCase());
    } catch (emailError) {
      console.error("Failed to send email change notification:", emailError.message);
    }

    res.status(200).json({
      success: true,
      message: "Email change request processed. Please check your inbox for verification.",
    });
  } catch (error) {
    console.error("Change email error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while processing email change request",
    });
  }
};

/**
 * Verify Email Change - Step 2: Confirm new email
 * GET /api/account/verify-email-change?token=xxx
 * 
 * Process:
 * 1. Validate token
 * 2. Check expiration
 * 3. Update user's email
 * 4. Invalidate token
 */
export const verifyEmailChange = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Email change verification failed: Token is missing.");
    }

    // 1. Find valid token
    const tokenResult = await pool.query(
      `SELECT user_id, new_email, expires_at, used_at 
       FROM email_change_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).send("Invalid verification token.");
    }

    const tokenData = tokenResult.rows[0];

    // 2. Check if already used
    if (tokenData.used_at) {
      return res.status(400).send("This verification token has already been used.");
    }

    // 3. Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(400).send("Verification token has expired. Please request a new email change.");
    }

    // 4. Update user's email
    await pool.query(
      "UPDATE users SET email = $1 WHERE id = $2",
      [tokenData.new_email, tokenData.user_id]
    );

    // 5. Mark token as used
    await pool.query(
      "UPDATE email_change_tokens SET used_at = NOW() WHERE token = $1",
      [token]
    );

    res.send("Email address updated successfully! You can now use your new email to log in.");
  } catch (error) {
    console.error("Verify email change error:", error);
    res.status(500).send("Server error during email verification.");
  }
};

/**
 * Change Password
 * PUT /api/account/password
 * 
 * Process:
 * 1. Verify current password
 * 2. Update password hash
 * 3. Terminate all sessions (force re-login)
 * 4. Send confirmation email
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // 1. Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Check password strength (basic validation)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 8 characters long",
      });
    }

    // 2. Verify current password
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userResult.rows[0].password_hash
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from current password",
      });
    }

    // 3. Hash new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHashedPassword, userId]
    );

    // 5. Terminate all sessions (force re-login on all devices)
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);

    // 6. Send confirmation email (non-blocking - don't fail if email fails)
    try {
      await sendPasswordChangeConfirmationEmail(userEmail);
    } catch (emailError) {
      console.error("Failed to send password change confirmation email:", emailError.message);
      // Continue anyway - password was changed successfully
    }

    await logAuthEvent({
      userId,
      eventType: "password_change",
      clientIp: getClientIp(req),
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again with your new password.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while changing password",
    });
  }
};

/**
 * Delete Account (Soft Delete)
 * DELETE /api/account
 * 
 * Process:
 * 1. Require password confirmation
 * 2. Soft delete with 30-day grace period
 * 3. Schedule permanent deletion
 * 4. Terminate all sessions
 * 5. Send confirmation email
 */
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // 1. Validate password confirmation
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password confirmation is required to delete account",
      });
    }

    // 2. Verify password
    const userResult = await pool.query(
      "SELECT password_hash, deleted_at FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = userResult.rows[0];

    // Check if account is already marked for deletion
    if (user.deleted_at) {
      return res.status(400).json({
        success: false,
        error: "Account is already scheduled for deletion",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Password is incorrect",
      });
    }

    // 3. Soft delete: mark account with deletion timestamps
    const deletedAt = new Date();
    const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await pool.query(
      "UPDATE users SET deleted_at = $1, deletion_scheduled_at = $2 WHERE id = $3",
      [deletedAt, deletionScheduledAt, userId]
    );

    // 4. Terminate all sessions (log out from all devices)
    await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);

    // 5. Send confirmation email (non-blocking)
    try {
      await sendAccountDeletionConfirmationEmail(
        userEmail,
        deletionScheduledAt.toLocaleDateString()
      );
    } catch (emailError) {
      console.error("Failed to send account deletion confirmation email:", emailError.message);
      // Continue anyway - account was marked for deletion successfully
    }

    res.status(200).json({
      success: true,
      message: "Account deletion initiated. You have 30 days to cancel by logging in again.",
      deletionScheduledAt: deletionScheduledAt.toISOString(),
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while processing account deletion",
    });
  }
};

/**
 * Export all personal data (GDPR / CCPA data portability).
 * GET /api/account/export
 */
export const exportAccountData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      userResult,
      startupResult,
      investorResult,
      connectionsResult,
      sentMessagesResult,
      receivedMessagesResult,
      privacyResult,
      notificationResult,
      watchlistResult,
      sessionsResult,
    ] = await Promise.all([
      pool.query(
        `SELECT id, email, full_name, user_type, email_verified, created_at,
                terms_accepted_at, terms_version, last_activity_at
         FROM users WHERE id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT * FROM startup_profiles WHERE user_id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT * FROM investor_profiles WHERE user_id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT id, requester_id, recipient_id, status, created_at, updated_at
         FROM connections
         WHERE requester_id = $1 OR recipient_id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT id, conversation_id, sender_id, receiver_id, text, attachment_url, created_at, read_at
         FROM messages WHERE sender_id = $1 ORDER BY created_at DESC LIMIT 500`,
        [userId],
      ),
      pool.query(
        `SELECT id, conversation_id, sender_id, receiver_id, text, attachment_url, created_at, read_at
         FROM messages WHERE receiver_id = $1 ORDER BY created_at DESC LIMIT 500`,
        [userId],
      ),
      pool.query(
        `SELECT * FROM privacy_settings WHERE user_id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT * FROM notification_settings WHERE user_id = $1`,
        [userId],
      ),
      pool.query(
        `SELECT startup_profile_id, added_at FROM investor_watchlist WHERE investor_user_id = $1`,
        [userId],
      ).catch(() => ({ rows: [] })),
      pool.query(
        `SELECT id, device_info, client_ip, created_at, last_used_at, expires_at
         FROM sessions WHERE user_id = $1`,
        [userId],
      ),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      format_version: "1.0",
      user: userResult.rows[0] || null,
      startup_profile: startupResult.rows[0] || null,
      investor_profile: investorResult.rows[0] || null,
      connections: connectionsResult.rows,
      messages_sent: sentMessagesResult.rows,
      messages_received: receivedMessagesResult.rows,
      privacy_settings: privacyResult.rows[0] || null,
      notification_settings: notificationResult.rows[0] || null,
      watchlist: watchlistResult.rows,
      active_sessions: sessionsResult.rows.map((s) => ({
        id: s.id,
        device_info: s.device_info,
        created_at: s.created_at,
        last_used_at: s.last_used_at,
        expires_at: s.expires_at,
      })),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="account-export-${userId}.json"`,
    );

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error("Export account data error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while exporting account data",
    });
  }
};
