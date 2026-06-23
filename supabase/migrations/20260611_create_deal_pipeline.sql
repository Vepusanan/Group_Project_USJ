-- Migration: Investor Deal Pipeline Dashboard (US-05)

CREATE TABLE IF NOT EXISTS public.deal_pipeline_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  stage VARCHAR(30) NOT NULL DEFAULT 'CONNECTED',
  private_notes TEXT,
  stage_entered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT deal_pipeline_cards_pkey PRIMARY KEY (id),
  CONSTRAINT deal_pipeline_cards_connection_unique UNIQUE (connection_id),
  CONSTRAINT deal_pipeline_cards_stage_check CHECK (
    stage IN ('DISCOVERED', 'CONNECTED', 'REVIEWING', 'DUE_DILIGENCE', 'DECISION', 'ARCHIVED')
  )
);

CREATE INDEX IF NOT EXISTS idx_deal_pipeline_cards_investor_stage
  ON public.deal_pipeline_cards (investor_user_id, stage);

CREATE TABLE IF NOT EXISTS public.deal_pipeline_stage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.deal_pipeline_cards(id) ON DELETE CASCADE,
  stage VARCHAR(30) NOT NULL,
  entered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exited_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT deal_pipeline_stage_events_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_deal_pipeline_stage_events_card
  ON public.deal_pipeline_stage_events (card_id, entered_at DESC);

COMMENT ON TABLE public.deal_pipeline_cards IS 'Kanban pipeline cards for investor deal tracking (US-05)';
COMMENT ON TABLE public.deal_pipeline_stage_events IS 'Stage duration history for pipeline analytics';
