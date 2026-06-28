-- Widen user_type to allow 'admin'. users.user_type is VARCHAR(20) + CHECK
-- (separate from user_type_enum which is only used by refined profile tables).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('startup', 'investor', 'admin'));

-- Promote the admin account: real admin type, skip onboarding, ensure verified.
UPDATE public.users
  SET user_type = 'admin',
      onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
      email_verified = TRUE
  WHERE LOWER(email) = LOWER('vepu2003nanthan@gmail.com');
