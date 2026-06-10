-- Registration consent + account lifecycle (NFR 17.5)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20);

COMMENT ON COLUMN public.users.terms_accepted_at IS 'When the user accepted platform terms at registration';
COMMENT ON COLUMN public.users.terms_version IS 'Version identifier of accepted terms (e.g. 2026-06)';
