-- Migration: AI feature usage logging for administrator analytics

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  feature VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_usage_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_feature_month
  ON public.ai_usage_log (feature, created_at DESC);
