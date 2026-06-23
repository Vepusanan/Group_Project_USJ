import pool from "../config/database.js";
import { sendFailedLoginAttemptEmail } from "./emailServices.js";

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_HOURS = 1;
// Send the heads-up email once the attempt count crosses this threshold
// (before the account locks at MAX_ATTEMPTS). Tuned so users are warned
// during an active attack but not on a single typo.
const NOTIFY_AT_ATTEMPT = 3;

/**
 * Append a row to the failed_login_attempts audit log (TC-SEC-004).
 * Best-effort: failures here MUST NOT break the login flow.
 */
export const logFailedLoginAttempt = async ({
  userId,
  email,
  clientIp,
  userAgent,
}) => {
  try {
    await pool.query(
      `INSERT INTO failed_login_attempts (user_id, email, client_ip, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [userId || null, email, clientIp || null, userAgent || null],
    );
  } catch (err) {
    console.error("Failed to log failed-login attempt:", err.message);
  }
};

/**
 * Handle a failed password attempt for a known user. Updates the rolling
 * counter, locks the account at MAX_ATTEMPTS, and triggers a one-time
 * notification email once activity crosses NOTIFY_AT_ATTEMPT (TC-SEC-005).
 */
export const lockAccountIfNecessary = async (
  userId,
  currentAttempts,
  email,
  { clientIp, fullName } = {},
) => {
  console.log(
    `[LOCK HELPER] Processing failed login for User ID: ${userId}. Current attempts: ${currentAttempts}`,
  );
  const newAttempts = currentAttempts + 1;

  // Send the security email exactly once, on the transition past the threshold,
  // so a sustained attack doesn't spam the user.
  if (
    newAttempts === NOTIFY_AT_ATTEMPT &&
    currentAttempts < NOTIFY_AT_ATTEMPT
  ) {
    sendFailedLoginAttemptEmail(email, fullName, newAttempts, clientIp).catch(
      (err) =>
        console.error("Failed-login email dispatch error:", err.message),
    );
  }

  if (newAttempts >= MAX_ATTEMPTS) {
    const lockUntil = new Date(
      Date.now() + LOCK_DURATION_HOURS * 60 * 60 * 1000,
    );

    await pool.query(
      `UPDATE users
       SET failed_login_attempts = $1, account_locked_until = $2
       WHERE id = $3`,
      [newAttempts, lockUntil, userId],
    );

    console.warn(
      `Account ID ${userId} locked until ${lockUntil.toISOString()} after ${newAttempts} attempts.`,
    );

    return { locked: true, lockUntil };
  }

  await pool.query(
    "UPDATE users SET failed_login_attempts = $1 WHERE id = $2",
    [newAttempts, userId],
  );
  return { locked: false, attempts: newAttempts };
};
