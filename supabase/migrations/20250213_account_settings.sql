-- Migration: Account Settings Features
-- Date: 2025-02-13
-- Description: Add support for email change verification and soft delete functionality

-- Create email change verification tokens table
CREATE TABLE IF NOT EXISTS public.email_change_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  new_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT email_change_tokens_pkey PRIMARY KEY (id)
);

-- Create indexes for email change tokens
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user_id ON public.email_change_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON public.email_change_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_expires_at ON public.email_change_tokens(expires_at);

-- Add soft delete columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP WITHOUT TIME ZONE;

-- Create index for soft deleted users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled_at ON public.users(deletion_scheduled_at);

-- Add comments for documentation
COMMENT ON TABLE public.email_change_tokens IS 'Stores tokens for email change verification';
COMMENT ON COLUMN public.email_change_tokens.user_id IS 'Reference to the user changing their email';
COMMENT ON COLUMN public.email_change_tokens.new_email IS 'New email address to be verified';
COMMENT ON COLUMN public.email_change_tokens.token IS 'Verification token sent to new email';
COMMENT ON COLUMN public.email_change_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN public.email_change_tokens.used_at IS 'Timestamp when token was used (null if unused)';
COMMENT ON COLUMN public.users.deleted_at IS 'Timestamp when account deletion was initiated (soft delete)';
COMMENT ON COLUMN public.users.deletion_scheduled_at IS 'Timestamp when permanent deletion is scheduled (30 days after soft delete)';
