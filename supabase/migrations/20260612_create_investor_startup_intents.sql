-- Migration: Investor Intent Tracking (private to assigning investor)

CREATE TABLE IF NOT EXISTS public.investor_startup_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  intent_level VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT investor_startup_intents_pkey PRIMARY KEY (id),
  CONSTRAINT investor_startup_intents_connection_unique UNIQUE (connection_id),
  CONSTRAINT investor_startup_intents_investor_connection_unique UNIQUE (investor_user_id, connection_id),
  CONSTRAINT investor_startup_intents_level_check CHECK (
    intent_level IN ('WATCHING', 'INTERESTED', 'PASSED')
  )
);

CREATE INDEX IF NOT EXISTS idx_investor_startup_intents_investor
  ON public.investor_startup_intents (investor_user_id);

COMMENT ON TABLE public.investor_startup_intents IS 'Private investor intent levels per connected startup — never exposed to startups';
