ALTER TABLE public.deal_pipeline_cards
  ADD COLUMN IF NOT EXISTS decision_outcome VARCHAR(20)
    CHECK (decision_outcome IS NULL OR decision_outcome IN ('INVEST', 'PASS', 'DEFER'));
