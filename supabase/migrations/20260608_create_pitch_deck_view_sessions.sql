-- Migration: Pitch deck view sessions (US-02 / pitch engagement analytics)
-- Records investor viewing behaviour for in-platform pitch deck sessions.

CREATE TABLE IF NOT EXISTS public.pitch_deck_view_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITHOUT TIME ZONE,
  completed BOOLEAN NOT NULL DEFAULT false,
  pages_viewed JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_per_page_ms JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_duration_ms INTEGER,
  last_page INTEGER DEFAULT 1,
  CONSTRAINT pitch_deck_view_sessions_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_pitch_deck_view_sessions_investor
  ON public.pitch_deck_view_sessions (investor_user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_pitch_deck_view_sessions_startup
  ON public.pitch_deck_view_sessions (startup_profile_id, started_at DESC);
