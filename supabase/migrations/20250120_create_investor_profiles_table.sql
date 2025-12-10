-- Migration: Create investor_profiles table
-- Date: 2025-01-20
-- Description: Investor profiles table for investor information and onboarding

CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info fields
  name VARCHAR(255),
  firm_name VARCHAR(255),
  photo_url VARCHAR(500),
  city VARCHAR(255),
  country VARCHAR(255),
  website VARCHAR(500),
  linkedin VARCHAR(500),
  
  -- Classification fields
  investor_type VARCHAR(100), -- e.g., 'Angel', 'VC', 'Corporate VC', 'Family Office', 'Accelerator', 'Syndicate'
  years_of_experience INTEGER,
  background TEXT, -- Professional background and expertise
  
  -- Investment focus fields
  investment_thesis TEXT, -- Investment philosophy and approach
  industries JSONB, -- array of industries: ["FinTech", "HealthTech", "AI/ML", ...]
  geography JSONB, -- array of regions/countries: ["North America", "Southeast Asia", ...]
  investment_stage JSONB, -- array: ["Pre-seed", "Seed", "Series A", ...]
  
  -- Investment details fields
  investment_size_min DECIMAL(15, 2), -- Minimum investment amount
  investment_size_max DECIMAL(15, 2), -- Maximum investment amount
  investment_structure JSONB, -- array: ["Equity", "Convertible Note", "SAFE", ...]
  follow_on_investment BOOLEAN DEFAULT false, -- Whether they do follow-on investments
  investment_timeline VARCHAR(100), -- e.g., '2-4 weeks', '1-3 months'
  
  -- Portfolio fields
  portfolio_companies JSONB, -- array: [{name, industry, stage, year}, ...]
  notable_exits JSONB, -- array: [{company, exit_type, year, value}, ...]
  total_investments INTEGER, -- Total number of investments made
  
  -- Criteria fields
  investment_criteria TEXT, -- Specific requirements and preferences
  red_flags TEXT, -- Deal-breakers or things to avoid
  ideal_founder_profile TEXT, -- What they look for in founders
  
  -- Contact info fields
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  preferred_contact_method VARCHAR(50), -- e.g., 'Email', 'LinkedIn', 'Phone'
  
  -- Visibility and status
  is_actively_investing BOOLEAN DEFAULT true,
  profile_visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'private', 'connections_only'
  
  -- Timestamps
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT investor_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT investor_profiles_user_id_unique UNIQUE (user_id)
);

-- Create indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON public.investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_name ON public.investor_profiles(name);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_firm_name ON public.investor_profiles(firm_name);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_investor_type ON public.investor_profiles(investor_type);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_city ON public.investor_profiles(city);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_country ON public.investor_profiles(country);

-- GIN indexes for JSONB array fields (for efficient search within arrays)
CREATE INDEX IF NOT EXISTS idx_investor_profiles_industries ON public.investor_profiles USING GIN (industries);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_geography ON public.investor_profiles USING GIN (geography);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_investment_stage ON public.investor_profiles USING GIN (investment_stage);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_investor_profiles_updated_at ON public.investor_profiles;
CREATE TRIGGER update_investor_profiles_updated_at 
    BEFORE UPDATE ON public.investor_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.investor_profiles IS 'Stores investor profiles and investment preferences';
COMMENT ON COLUMN public.investor_profiles.user_id IS 'Foreign key to users table (unique)';
COMMENT ON COLUMN public.investor_profiles.name IS 'Investor full name';
COMMENT ON COLUMN public.investor_profiles.firm_name IS 'Investment firm or organization name';
COMMENT ON COLUMN public.investor_profiles.investor_type IS 'Type of investor: Angel, VC, Corporate VC, etc.';
COMMENT ON COLUMN public.investor_profiles.industries IS 'JSONB array of target industries';
COMMENT ON COLUMN public.investor_profiles.geography IS 'JSONB array of target geographical regions';
COMMENT ON COLUMN public.investor_profiles.investment_stage IS 'JSONB array of preferred investment stages';
COMMENT ON COLUMN public.investor_profiles.portfolio_companies IS 'JSONB array of portfolio company details';
COMMENT ON COLUMN public.investor_profiles.is_actively_investing IS 'Whether the investor is currently active';
