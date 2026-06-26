import pool from "../config/database.js";

/**
 * Onboarding wizard completed at least once (persistent users column).
 * Must NOT use profile completion percentage.
 */
export const hasCompletedOnboarding = (user) =>
  Boolean(user?.onboarding_completed_at);

/**
 * Mark onboarding complete idempotently (wizard submit).
 */
export async function markOnboardingCompleted(userId, db = pool) {
  const result = await db.query(
    `
      UPDATE public.users
      SET
        onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING onboarding_completed_at
    `,
    [userId],
  );
  return result.rows[0]?.onboarding_completed_at ?? null;
}
