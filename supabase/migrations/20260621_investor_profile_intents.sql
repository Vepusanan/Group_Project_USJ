-- Pre-connection investor intent (Watching / Interested) for DISCOVERED pipeline tracking
CREATE TABLE IF NOT EXISTS public.investor_profile_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  intent_level VARCHAR(20) NOT NULL CHECK (intent_level IN ('WATCHING', 'INTERESTED')),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT investor_profile_intents_pkey PRIMARY KEY (id),
  CONSTRAINT investor_profile_intents_unique UNIQUE (investor_user_id, startup_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_investor_profile_intents_investor
  ON public.investor_profile_intents (investor_user_id, updated_at DESC);
