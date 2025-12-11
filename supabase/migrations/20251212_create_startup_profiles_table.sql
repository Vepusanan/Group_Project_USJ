-- Migration: Create startup_profiles table
-- Date: 2025-12-12
-- Description: Stores additional profile information for startups (tagline, description)

CREATE TABLE IF NOT EXISTS public.startup_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tagline TEXT,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT startup_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT startup_profiles_user_id_key UNIQUE (user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON public.startup_profiles(user_id);

-- GIN Index for Full Text Search (optional, but good for performance)
-- We will index the concatenation of tagline and description
CREATE INDEX IF NOT EXISTS idx_startup_profiles_search ON public.startup_profiles USING GIN (to_tsvector('english', coalesce(tagline, '') || ' ' || coalesce(description, '')));

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_startup_profiles_updated_at ON public.startup_profiles;
CREATE TRIGGER update_startup_profiles_updated_at 
    BEFORE UPDATE ON public.startup_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
