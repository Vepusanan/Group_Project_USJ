CREATE INDEX IF NOT EXISTS idx_startup_profiles_search_fts
ON public.startup_profiles
USING GIN (
  to_tsvector(
    'english',
    coalesce(company_name, '') || ' ' ||
    coalesce(tagline, '') || ' ' ||
    coalesce(description, '')
  )
);