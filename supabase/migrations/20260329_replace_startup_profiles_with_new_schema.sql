-- Migration: Replace startup_profiles table with new schema including enums
-- Date: 2026-03-29
-- Description: Create new startup_profiles table with refined schema and enum types

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.startup_profiles CASCADE;

-- Create enum types for startup_profiles
CREATE TYPE public.startup_stage_enum AS ENUM (
  'IDEA',
  'MVP',
  'EARLY_REVENUE',
  'GROWTH',
  'SCALING'
);

CREATE TYPE public.funding_stage_enum AS ENUM (
  'PRE_SEED',
  'SEED',
  'SERIES_A',
  'SERIES_B',
  'SERIES_C',
  'SERIES_D_PLUS'
);

CREATE TYPE public.revenue_status_enum AS ENUM (
  'PRE_REVENUE',
  'REVENUE_GENERATING',
  'PROFITABLE'
);

-- Create the new startup_profiles table
CREATE TABLE IF NOT EXISTS public.startup_profiles (
  startup_profile_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic company information
  company_name VARCHAR(255),
  founder_names JSONB,
  industry VARCHAR(100),
  founded_date DATE,
  
  -- Company description
  tagline VARCHAR(500),
  detailed_description TEXT,
  
  -- Startup stage and status
  current_status public.startup_stage_enum,
  
  -- Team information
  team_size INT,
  key_team_members TEXT,
  team_photo_url VARCHAR(500),
  
  -- Funding information
  funding_status public.funding_stage_enum,
  amount_seeking NUMERIC(15, 2),
  previous_funding NUMERIC(15, 2),
  use_of_funds TEXT,
  
  -- Business metrics and achievements
  revenue_status public.revenue_status_enum,
  key_metrics TEXT,
  major_achievements TEXT,
  customer_testimonials TEXT,
  
  -- Document URLs
  pitch_deck_url VARCHAR(500),
  business_plan_url VARCHAR(500),
  product_demo_url VARCHAR(500),
  
  -- Contact information
  primary_contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  phone_number VARCHAR(50),
  
  -- Social media and links
  social_media_links JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT startup_profiles_pkey PRIMARY KEY (startup_profile_id),
  CONSTRAINT startup_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON public.startup_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_industry ON public.startup_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_current_status ON public.startup_profiles(current_status);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_funding_status ON public.startup_profiles(funding_status);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_revenue_status ON public.startup_profiles(revenue_status);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_created_at ON public.startup_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_company_name ON public.startup_profiles(company_name);

-- Create full-text search index for company name, tagline, and detailed description
CREATE INDEX IF NOT EXISTS idx_startup_profiles_fts ON public.startup_profiles
  USING gin(to_tsvector('english', 
    coalesce(company_name, '') || ' ' ||
    coalesce(tagline, '') || ' ' ||
    coalesce(detailed_description, '')
  ));
