-- Migration: Startup profile view events (US-06 analytics)
-- One row per investor per startup per calendar day (deduplicated).

CREATE TABLE IF NOT EXISTS public.startup_profile_views (
  startup_profile_id UUID NOT NULL
    REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL
    REFERENCES public.users(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 1,
  first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT startup_profile_views_pkey
    PRIMARY KEY (startup_profile_id, investor_user_id, view_date)
);

CREATE INDEX IF NOT EXISTS idx_startup_profile_views_startup_date
  ON public.startup_profile_views (startup_profile_id, view_date DESC);

CREATE INDEX IF NOT EXISTS idx_startup_profile_views_investor
  ON public.startup_profile_views (investor_user_id, last_viewed_at DESC);

COMMENT ON TABLE public.startup_profile_views IS 'Daily deduplicated investor profile view events for startup analytics';
