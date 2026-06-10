-- Migration: Investor-passed startups (discovery archive without connection)

CREATE TABLE IF NOT EXISTS public.investor_passed_startups (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  passed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT investor_passed_startups_pkey PRIMARY KEY (id),
  CONSTRAINT investor_passed_startups_unique_pair UNIQUE (investor_user_id, startup_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_investor_passed_startups_investor
  ON public.investor_passed_startups (investor_user_id);

COMMENT ON TABLE public.investor_passed_startups IS 'Startups an investor passed on from discovery — hidden from feed, shown in pipeline archive';
