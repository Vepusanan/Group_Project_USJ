-- Migration: failed login attempts log
-- Date: 2026-05-22
-- Description: Persistent audit log of failed login attempts for security
-- monitoring (TC-SEC-004). Allows post-incident review of which IPs targeted
-- which accounts and when. Also feeds the rolling-threshold email
-- notification in authController (TC-SEC-005).

CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email       VARCHAR(255) NOT NULL,
    client_ip   VARCHAR(45),
    user_agent  TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for "give me recent attempts for this user" lookups
CREATE INDEX IF NOT EXISTS idx_failed_login_user_id_attempted_at
    ON public.failed_login_attempts (user_id, attempted_at DESC);

-- Index for "give me recent attempts from this IP" lookups (cross-user analysis)
CREATE INDEX IF NOT EXISTS idx_failed_login_client_ip_attempted_at
    ON public.failed_login_attempts (client_ip, attempted_at DESC);

COMMENT ON TABLE public.failed_login_attempts IS 'Audit log of failed login attempts for security monitoring.';
COMMENT ON COLUMN public.failed_login_attempts.user_id IS 'Resolved user id when the email matched an account; NULL when the email did not match any user.';
COMMENT ON COLUMN public.failed_login_attempts.client_ip IS 'IP address of the request that produced the failed attempt.';
