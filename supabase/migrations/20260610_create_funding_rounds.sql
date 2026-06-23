-- Migration: Funding Round Tracker (US-04)

CREATE TABLE IF NOT EXISTS public.funding_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  funding_stage VARCHAR(50) NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  committed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  opening_date DATE NOT NULL,
  target_closing_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT funding_rounds_pkey PRIMARY KEY (id),
  CONSTRAINT funding_rounds_status_check CHECK (status IN ('active', 'closed')),
  CONSTRAINT funding_rounds_dates_check CHECK (target_closing_date >= opening_date),
  CONSTRAINT funding_rounds_committed_lte_target CHECK (committed_amount <= target_amount)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_funding_rounds_active_per_startup
  ON public.funding_rounds (startup_profile_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_funding_rounds_startup
  ON public.funding_rounds (startup_profile_id, status);

COMMENT ON TABLE public.funding_rounds IS 'Active and historical funding rounds for startup fundraising tracker (US-04)';
