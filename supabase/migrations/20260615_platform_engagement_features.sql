-- Migration: FR-10–FR-14 engagement features (connection notes, verification, watchlist, milestones, meetings)

DO $$ BEGIN
  CREATE TYPE public.verification_tier_enum AS ENUM (
    'UNVERIFIED',
    'IDENTITY_VERIFIED',
    'BUSINESS_VERIFIED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS verification_tier public.verification_tier_enum NOT NULL DEFAULT 'UNVERIFIED';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_profile_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_tier VARCHAR(30) NOT NULL CHECK (requested_tier IN ('IDENTITY_VERIFIED', 'BUSINESS_VERIFIED')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  linkedin_profile_url VARCHAR(500),
  document_url TEXT,
  document_name VARCHAR(255),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT verification_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status
  ON public.verification_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.connection_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT connection_notes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_connection_notes_connection
  ON public.connection_notes (connection_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.investor_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  added_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT investor_watchlist_pkey PRIMARY KEY (id),
  CONSTRAINT investor_watchlist_unique_pair UNIQUE (investor_user_id, startup_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_investor_watchlist_user
  ON public.investor_watchlist (investor_user_id, added_at DESC);

DO $$ BEGIN
  CREATE TYPE public.milestone_category_enum AS ENUM (
    'PRODUCT_LAUNCH',
    'REVENUE_MILESTONE',
    'NEW_CUSTOMER',
    'STRATEGIC_PARTNERSHIP',
    'TEAM_EXPANSION',
    'FUNDING_ACHIEVEMENT',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.startup_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  category public.milestone_category_enum NOT NULL,
  headline VARCHAR(200) NOT NULL,
  description VARCHAR(500) NOT NULL,
  milestone_date DATE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT startup_milestones_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_startup_milestones_startup
  ON public.startup_milestones (startup_profile_id, created_at DESC);

DO $$ BEGIN
  CREATE TYPE public.meeting_format_enum AS ENUM ('VIDEO_CALL', 'PHONE_CALL', 'IN_PERSON');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.connection_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proposed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  format public.meeting_format_enum NOT NULL,
  agenda TEXT NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT connection_meetings_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_connection_meetings_connection
  ON public.connection_meetings (connection_id, proposed_at DESC);

CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.connection_meetings(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT meeting_notes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting
  ON public.meeting_notes (meeting_id, created_at DESC);
