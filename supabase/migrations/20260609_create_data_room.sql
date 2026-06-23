-- Migration: Private Data Room (US-03)
-- Secure, permission-gated document repository per startup.

CREATE TABLE IF NOT EXISTS public.data_room_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT data_room_folders_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_data_room_folders_startup
  ON public.data_room_folders (startup_profile_id);

CREATE TABLE IF NOT EXISTS public.data_room_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.data_room_folders(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(120),
  file_size_bytes BIGINT,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT data_room_documents_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_data_room_documents_startup
  ON public.data_room_documents (startup_profile_id);

CREATE INDEX IF NOT EXISTS idx_data_room_documents_folder
  ON public.data_room_documents (folder_id);

CREATE TABLE IF NOT EXISTS public.data_room_access_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT data_room_access_grants_pkey PRIMARY KEY (id),
  CONSTRAINT data_room_access_grants_unique_pair UNIQUE (startup_profile_id, investor_user_id)
);

CREATE INDEX IF NOT EXISTS idx_data_room_access_grants_investor
  ON public.data_room_access_grants (investor_user_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.data_room_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  investor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.data_room_documents(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES public.data_room_folders(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT data_room_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT data_room_audit_log_action_check CHECK (
    action_type IN (
      'grant_access',
      'revoke_access',
      'upload_document',
      'update_document',
      'delete_document',
      'view_document',
      'download_document',
      'create_folder',
      'update_folder',
      'delete_folder',
      'view_data_room'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_data_room_audit_log_startup
  ON public.data_room_audit_log (startup_profile_id, created_at DESC);

COMMENT ON TABLE public.data_room_folders IS 'Named folders within a startup private data room';
COMMENT ON TABLE public.data_room_documents IS 'Documents stored in a startup data room';
COMMENT ON TABLE public.data_room_access_grants IS 'Per-investor data room access grants (revoked_at NULL = active)';
COMMENT ON TABLE public.data_room_audit_log IS 'Audit trail for all data room access and management events';
