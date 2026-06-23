import pool from "../config/database.js";
import { ensureUserActivityColumns } from "../repositories/UserActivityRepository.js";
import { sendInactiveAccountNoticeEmail } from "./emailServices.js";

/**
 * Deletes user accounts that have not been email verified and are older than 7 days.
 */
export const deleteStaleUnverifiedUsers = async () => {
  const cutoffDate = "7 days";

  try {
    const result = await pool.query(
      `DELETE FROM users
       WHERE email_verified = false
       AND created_at < NOW() - INTERVAL $1
       RETURNING id, email, created_at;`,
      [cutoffDate],
    );

    if (result.rowCount > 0) {
      console.log(
        `🧹 Cleanup Job: Successfully deleted ${result.rowCount} stale, unverified users.`,
      );
    } else {
      console.log("🧹 Cleanup Job: No stale unverified users found to delete.");
    }
    return result.rowCount;
  } catch (error) {
    console.error("❌ Cleanup Job Error:", error);
    throw error;
  }
};

/**
 * Tier-1 (UNVERIFIED) accounts inactive 90+ days receive a 7-day deletion notice.
 */
export const notifyInactiveUnverifiedUsers = async () => {
  await ensureUserActivityColumns();

  const result = await pool.query(
    `
      SELECT id, email, full_name, last_activity_at
      FROM public.users
      WHERE verification_tier = 'UNVERIFIED'
        AND email_verified = TRUE
        AND COALESCE(last_activity_at, created_at) < NOW() - INTERVAL '90 days'
        AND inactive_cleanup_notice_at IS NULL
    `,
  );

  let sent = 0;
  for (const user of result.rows) {
    try {
      await sendInactiveAccountNoticeEmail({
        email: user.email,
        fullName: user.full_name,
      });
      await pool.query(
        `UPDATE public.users SET inactive_cleanup_notice_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [user.id],
      );
      sent += 1;
    } catch (error) {
      console.error(
        `Failed to send inactive notice to ${user.email}:`,
        error.message,
      );
    }
  }

  if (sent > 0) {
    console.log(`🧹 Cleanup Job: Sent ${sent} inactive account notice(s).`);
  }

  return sent;
};

/**
 * Remove tier-1 accounts that remained inactive 7+ days after notice.
 */
export const deleteInactiveUnverifiedAfterNotice = async () => {
  await ensureUserActivityColumns();

  const result = await pool.query(
    `
      DELETE FROM public.users
      WHERE verification_tier = 'UNVERIFIED'
        AND email_verified = TRUE
        AND inactive_cleanup_notice_at IS NOT NULL
        AND inactive_cleanup_notice_at < NOW() - INTERVAL '7 days'
        AND COALESCE(last_activity_at, created_at) < NOW() - INTERVAL '90 days'
      RETURNING id, email
    `,
  );

  if (result.rowCount > 0) {
    console.log(
      `🧹 Cleanup Job: Deleted ${result.rowCount} inactive UNVERIFIED account(s) after notice period.`,
    );
  }

  return result.rowCount;
};

/**
 * Permanently delete accounts whose 30-day grace period has elapsed.
 */
export const purgeScheduledAccountDeletions = async () => {
  const result = await pool.query(
    `
      DELETE FROM public.users
      WHERE deletion_scheduled_at IS NOT NULL
        AND deletion_scheduled_at <= NOW()
      RETURNING id, email
    `,
  );

  if (result.rowCount > 0) {
    console.log(
      `🧹 Cleanup Job: Permanently deleted ${result.rowCount} scheduled account(s).`,
    );
  }

  return result.rowCount;
};

export const runTrustCleanupJobs = async () => {
  await deleteStaleUnverifiedUsers();
  await notifyInactiveUnverifiedUsers();
  await deleteInactiveUnverifiedAfterNotice();
  await purgeScheduledAccountDeletions();
};
