-- Migration: Compatibility match scores (FR-01)
-- Stores per-investor/startup compatibility scores for discovery ranking.
-- Individual rows are private to the investor; analytics table stores aggregates only.

CREATE TABLE IF NOT EXISTS public.compatibility_match_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  match_score SMALLINT NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT compatibility_match_scores_pkey PRIMARY KEY (id),
  CONSTRAINT compatibility_match_scores_unique_pair UNIQUE (investor_user_id, startup_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_compatibility_match_scores_investor_score
  ON public.compatibility_match_scores (investor_user_id, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_compatibility_match_scores_startup
  ON public.compatibility_match_scores (startup_profile_id);

-- Aggregate analytics without investor/startup identifiers
CREATE TABLE IF NOT EXISTS public.compatibility_match_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  score SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100),
  dimension_avg JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT compatibility_match_analytics_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_compatibility_match_analytics_recorded_at
  ON public.compatibility_match_analytics (recorded_at DESC);
