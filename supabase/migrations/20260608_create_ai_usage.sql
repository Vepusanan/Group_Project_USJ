-- Migration: AI usage counter
-- Date: 2026-06-08
-- Task: T1.4 (server-side AI service wrapper)
-- Description:
--   Tracks per-user AI calls per day so the wrapper can enforce a daily limit
--   (cost control) and so T8.3 (admin analytics) can report AI calls + cost.
--   One row per user per UTC day; `count` increments on each successful call.
--
-- Reversible: yes (DROP TABLE public.ai_usage).

CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count      INTEGER NOT NULL DEFAULT 0,
  -- rough cost bookkeeping for T8.3 (admin AI-cost metric); optional to populate
  input_tokens  BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_usage_pkey PRIMARY KEY (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON public.ai_usage(usage_date);

COMMENT ON TABLE public.ai_usage IS
  'Per-user per-day AI call counter for daily-limit enforcement and cost analytics (T1.4, T8.3).';
