-- Migration: Section 16 security enhancements

ALTER TABLE public.data_room_documents
  ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(120),
  ADD COLUMN IF NOT EXISTS storage_path TEXT;

CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type VARCHAR(60) NOT NULL,
  target_type VARCHAR(60),
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_ip VARCHAR(64),
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_action_log_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_admin_action_log_created
  ON public.admin_action_log (created_at DESC);

-- Append-only audit log at DB level (no UPDATE/DELETE for app role)
REVOKE UPDATE, DELETE ON public.data_room_audit_log FROM PUBLIC;
