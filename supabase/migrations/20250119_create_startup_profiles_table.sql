-- Migration: Create startup_profiles table
-- Date: 2025-01-19
-- Description: Startup profiles table for company information and onboarding

CREATE TABLE IF NOT EXISTS public.startup_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info fields
  company_name VARCHAR(255),
  founders JSONB, -- array of founder objects: [{name, role, linkedin}, ...]
  logo_url VARCHAR(500),
  city VARCHAR(255),
  country VARCHAR(255),
  website VARCHAR(500),
  linkedin VARCHAR(500),
  
  -- Business description fields
  tagline TEXT,
  description TEXT,
  industry VARCHAR(100),
  founded_date DATE,
  stage VARCHAR(50), -- e.g., 'Seed', 'Series A', 'Pre-seed', etc.
  
  -- Team info
  team JSONB, -- array of team member objects: [{name, role}, ...]
  
  -- Funding details
  funding JSONB, -- e.g., {amount_raised, current_round, valuation, ...}
  
  -- Traction metrics
  traction JSONB, -- e.g., {revenue, users, growth_rate, ...}
  
  -- Documents
  documents JSONB, -- array: [{name, url}, {name, url}, ...]
  
  -- Contact info
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT startup_profiles_pkey PRIMARY KEY (id)
);

-- Create indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON public.startup_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_company_name ON public.startup_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_industry ON public.startup_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_city ON public.startup_profiles(city);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_country ON public.startup_profiles(country);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_stage ON public.startup_profiles(stage);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_startup_profiles_updated_at ON public.startup_profiles;
CREATE TRIGGER update_startup_profiles_updated_at 
    BEFORE UPDATE ON public.startup_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.startup_profiles IS 'Stores startup company profiles and details';
COMMENT ON COLUMN public.startup_profiles.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN public.startup_profiles.company_name IS 'Name of the startup company';
COMMENT ON COLUMN public.startup_profiles.founders IS 'JSONB array of founder information';
COMMENT ON COLUMN public.startup_profiles.logo_url IS 'URL to company logo image';
COMMENT ON COLUMN public.startup_profiles.stage IS 'Funding stage: Pre-seed, Seed, Series A, etc.';
COMMENT ON COLUMN public.startup_profiles.documents IS 'JSONB array of document URLs (pitch deck, business plan, etc.)';
