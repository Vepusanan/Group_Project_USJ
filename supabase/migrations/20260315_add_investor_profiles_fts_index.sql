-- FTS index for investor_profiles browse & search (Story 3.2)
-- Uses || concatenation (NOT concat_ws) to satisfy IMMUTABLE requirement for GIN indexes.
-- Covers firm_name and investment_thesis — the two text fields available in the live schema.

CREATE INDEX IF NOT EXISTS idx_investor_profiles_search_fts
ON public.investor_profiles
USING GIN (
  to_tsvector(
    'english',
    coalesce(firm_name, '') || ' ' ||
    coalesce(investment_thesis, '')
  )
);
