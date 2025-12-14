-- Migration: Notification Settings
-- Date: 2025-02-15
-- Description: Add support for user notification preferences and delivery settings

-- Create notification settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Email notification toggles
  email_connection_requests BOOLEAN NOT NULL DEFAULT true,
  email_messages BOOLEAN NOT NULL DEFAULT true,
  email_profile_views BOOLEAN NOT NULL DEFAULT false,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT true,
  
  -- Notification frequency setting
  notification_frequency VARCHAR(50) NOT NULL DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),
  
  -- In-app notification toggles
  inapp_connection_requests BOOLEAN NOT NULL DEFAULT true,
  inapp_messages BOOLEAN NOT NULL DEFAULT true,
  inapp_profile_views BOOLEAN NOT NULL DEFAULT true,
  inapp_system_updates BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_settings_pkey PRIMARY KEY (id)
);

-- Create indexes for notification settings
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_frequency ON public.notification_settings(notification_frequency);

-- Add comments for documentation
COMMENT ON TABLE public.notification_settings IS 'Stores user notification preferences and delivery settings';
COMMENT ON COLUMN public.notification_settings.user_id IS 'Reference to the user who owns these settings';
COMMENT ON COLUMN public.notification_settings.email_connection_requests IS 'Whether to send email notifications for connection requests';
COMMENT ON COLUMN public.notification_settings.email_messages IS 'Whether to send email notifications for new messages';
COMMENT ON COLUMN public.notification_settings.email_profile_views IS 'Whether to send email notifications for profile views';
COMMENT ON COLUMN public.notification_settings.email_weekly_digest IS 'Whether to send weekly digest emails';
COMMENT ON COLUMN public.notification_settings.notification_frequency IS 'How often to batch email notifications: instant, daily, or weekly';
COMMENT ON COLUMN public.notification_settings.inapp_connection_requests IS 'Whether to show in-app notifications for connection requests';
COMMENT ON COLUMN public.notification_settings.inapp_messages IS 'Whether to show in-app notifications for new messages';
COMMENT ON COLUMN public.notification_settings.inapp_profile_views IS 'Whether to show in-app notifications for profile views';
COMMENT ON COLUMN public.notification_settings.inapp_system_updates IS 'Whether to show in-app notifications for system updates';
COMMENT ON COLUMN public.notification_settings.created_at IS 'Timestamp when settings were created';
COMMENT ON COLUMN public.notification_settings.updated_at IS 'Timestamp when settings were last updated';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();
