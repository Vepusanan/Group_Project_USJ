-- Migration: Allow 'admin' as a user_type
-- Date: 2026-06-08
-- Task: T1.2 (RBAC) — adds the third role required by V2 (verification review, admin analytics).
-- Description:
--   The original users table constrained user_type to ('startup', 'investor').
--   V2 needs an 'admin' role. This widens the CHECK constraint to include 'admin'.
--   No account can self-register as admin: the public /api/auth/register endpoint
--   still whitelists only 'startup'/'investor'. Admins are promoted manually via SQL.
--
-- Reversible: yes (re-add the old constraint), but only if no admin rows exist.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_user_type_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('startup', 'investor', 'admin'));

COMMENT ON COLUMN public.users.user_type IS
  'Type of user: startup, investor, or admin (admin set manually via SQL only)';

-- ---------------------------------------------------------------------------
-- To PROMOTE an existing, already-registered account to admin, run separately
-- (replace the email with the real one):
--
--   UPDATE public.users SET user_type = 'admin'
--   WHERE email = 'youradmin@example.com';
--
-- The account must already exist (sign it up normally first as startup/investor,
-- verify its email, then promote it).
-- ---------------------------------------------------------------------------
