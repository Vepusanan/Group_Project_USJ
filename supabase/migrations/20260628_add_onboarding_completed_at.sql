-- Migration: Add persistent onboarding completion timestamp
-- Date: 2026-06-28
-- Description: Onboarding completion is set when the wizard is submitted once.
--              Profile field completion % is a separate concern for API gating.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN public.users.onboarding_completed_at IS
  'Set when the user completes the onboarding wizard at least once. Independent of profile field completion %.';

CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed_at
  ON public.users (onboarding_completed_at)
  WHERE onboarding_completed_at IS NOT NULL;

-- Backfill legacy users who already created a profile (first profile row timestamp).
UPDATE public.users u
SET onboarding_completed_at = sub.first_profile_at,
    updated_at = CURRENT_TIMESTAMP
FROM (
  SELECT user_id, MIN(created_at) AS first_profile_at
  FROM (
    SELECT user_id, created_at FROM public.startup_profiles
    UNION ALL
    SELECT user_id, created_at FROM public.investor_profiles
  ) profiles
  GROUP BY user_id
) sub
WHERE u.id = sub.user_id
  AND u.onboarding_completed_at IS NULL;
