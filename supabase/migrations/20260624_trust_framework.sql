-- Migration: Verification & trust framework (Section 15)

DO $$ BEGIN
  CREATE TYPE public.report_status_enum AS ENUM (
    'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS inactive_cleanup_notice_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS fraud_flagged BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.profile_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 10 AND char_length(reason) <= 2000),
  status public.report_status_enum NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT profile_reports_pkey PRIMARY KEY (id),
  CONSTRAINT profile_reports_no_self_report CHECK (reporter_user_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_reports_reported
  ON public.profile_reports (reported_user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.auth_event_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type VARCHAR(30) NOT NULL,
  client_ip VARCHAR(64),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auth_event_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_auth_event_log_user
  ON public.auth_event_log (user_id, created_at DESC);
