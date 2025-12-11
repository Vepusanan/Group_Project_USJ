-- Migration: Create investor_profiles table
-- Description: Stores detailed profile information for investors for search and filtering

DROP TABLE IF EXISTS public.investor_profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  firm_name VARCHAR(255),
  location VARCHAR(255),
  investor_type VARCHAR(50), -- e.g., 'Angel', 'VC', 'PE'
  investment_stage VARCHAR(50), -- e.g., 'Seed', 'Series A'
  min_investment_size INTEGER,
  max_investment_size INTEGER,
  industries TEXT[], -- Array of strings
  experience_years INTEGER,
  website VARCHAR(255),
  investment_thesis TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT investor_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT investor_profiles_user_id_key UNIQUE (user_id)
);

-- Indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON public.investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_firm_name ON public.investor_profiles(firm_name);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_location ON public.investor_profiles(location);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_industries ON public.investor_profiles USING GIN (industries);
CREATE INDEX IF NOT EXISTS idx_investor_profiles_investment_size ON public.investor_profiles(min_investment_size, max_investment_size);

-- Update timestamp trigger
CREATE TRIGGER update_investor_profiles_updated_at 
    BEFORE UPDATE ON public.investor_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
