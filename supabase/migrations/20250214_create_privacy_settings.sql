-- Migration: Privacy Settings
-- Date: 2025-02-14
-- Description: Add support for user privacy settings

-- Create privacy settings table
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(50) NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections_only')),
  connection_request_setting BOOLEAN NOT NULL DEFAULT true,
  show_connections_list BOOLEAN NOT NULL DEFAULT true,
  show_activity_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT privacy_settings_pkey PRIMARY KEY (id)
);

-- Create indexes for privacy settings
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_profile_visibility ON public.privacy_settings(profile_visibility);

-- Add comments for documentation
COMMENT ON TABLE public.privacy_settings IS 'Stores user privacy settings and preferences';
COMMENT ON COLUMN public.privacy_settings.user_id IS 'Reference to the user who owns these settings';
COMMENT ON COLUMN public.privacy_settings.profile_visibility IS 'Controls who can view the user profile: public or connections_only';
COMMENT ON COLUMN public.privacy_settings.connection_request_setting IS 'Whether the user accepts connection requests';
COMMENT ON COLUMN public.privacy_settings.show_connections_list IS 'Whether to show the user connections list on profile';
COMMENT ON COLUMN public.privacy_settings.show_activity_status IS 'Whether to show when user was last active';
COMMENT ON COLUMN public.privacy_settings.created_at IS 'Timestamp when settings were created';
COMMENT ON COLUMN public.privacy_settings.updated_at IS 'Timestamp when settings were last updated';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_settings_updated_at();
