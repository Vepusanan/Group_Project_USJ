// src/utils/loginSecurity.js (New File)

import pool from "../config/database.js";
// Assume MAX_ATTEMPTS = 5 and LOCK_DURATION_HOURS = 1 defined elsewhere or hardcoded here
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_HOURS = 1;

// NOTE: You would need a dedicated function here to send the email notification.
// import { sendAccountLockedEmail } from './emailService.js';

export const lockAccountIfNecessary = async (
  userId,
  currentAttempts,
  email
) => {
  console.log(
    `[LOCK HELPER] Attempting to process failed login for User ID: ${userId}. Current attempts: ${currentAttempts}`
  );
  const newAttempts = currentAttempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    // Lock the account for 1 hour
    const lockUntil = new Date(
      Date.now() + LOCK_DURATION_HOURS * 60 * 60 * 1000
    );

    await pool.query(
      `UPDATE users 
             SET failed_login_attempts = $1, account_locked_until = $2 
             WHERE id = $3`,
      [newAttempts, lockUntil, userId]
    );

    console.warn(
      `🔒 Account ID ${userId} locked until ${lockUntil.toISOString()} after ${newAttempts} attempts.`
    );

    // TODO: Call email service here
    // sendAccountLockedEmail(email, lockUntil);

    return { locked: true, lockUntil: lockUntil };
  } else {
    // Just update the attempt count
    await pool.query(
      "UPDATE users SET failed_login_attempts = $1 WHERE id = $2",
      [newAttempts, userId]
    );
    return { locked: false, attempts: newAttempts };
  }
};
