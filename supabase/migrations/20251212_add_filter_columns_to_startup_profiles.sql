-- Migration: Add filter columns to startup_profiles
-- Date: 2025-12-12
-- Description: Adds industry, location, funding stage, and revenue status columns

-- Add columns
ALTER TABLE public.startup_profiles 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS funding_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS revenue_status VARCHAR(50);

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_startup_profiles_industry ON public.startup_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_country ON public.startup_profiles(location_country);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_city ON public.startup_profiles(location_city);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_funding ON public.startup_profiles(funding_stage);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_revenue ON public.startup_profiles(revenue_status);
