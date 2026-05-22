-- Migration: add location columns to investor_profiles
-- Date: 2026-05-22
-- Description: The investor onboarding wizard collects location_country and
-- location_city as required fields, but the investor_profiles table had no
-- columns to store them. Adds the columns + an index so investor search can
-- eventually filter by country/city instead of the free-form
-- geographic_preference text field.

ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS location_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_city    VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_investor_profiles_location_country
    ON public.investor_profiles (location_country);

COMMENT ON COLUMN public.investor_profiles.location_country IS 'Country selected during onboarding (Step 1).';
COMMENT ON COLUMN public.investor_profiles.location_city    IS 'City entered during onboarding (Step 1).';
