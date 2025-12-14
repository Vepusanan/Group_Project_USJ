-- Migration: Create data_export_tokens table
-- Date: 2025-02-14
-- Description: Table for storing user data export tokens with 24-hour expiration

-- Create data_export_tokens table
CREATE TABLE IF NOT EXISTS public.data_export_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  export_data JSONB NOT NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  downloaded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT data_export_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_data_export_tokens_user_id ON public.data_export_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_tokens_token ON public.data_export_tokens(token);
CREATE INDEX IF NOT EXISTS idx_data_export_tokens_expires_at ON public.data_export_tokens(expires_at);

-- Add comments for documentation
COMMENT ON TABLE public.data_export_tokens IS 'Stores data export requests with download tokens';
COMMENT ON COLUMN public.data_export_tokens.id IS 'Unique identifier for each export token';
COMMENT ON COLUMN public.data_export_tokens.user_id IS 'Reference to the user who requested the export';
COMMENT ON COLUMN public.data_export_tokens.token IS 'Unique token for downloading the export (valid for 24 hours)';
COMMENT ON COLUMN public.data_export_tokens.export_data IS 'JSON data containing all user information';
COMMENT ON COLUMN public.data_export_tokens.expires_at IS 'Expiration timestamp for the download link';
COMMENT ON COLUMN public.data_export_tokens.downloaded IS 'Whether the export has been downloaded';
COMMENT ON COLUMN public.data_export_tokens.created_at IS 'Timestamp when the export was requested';
