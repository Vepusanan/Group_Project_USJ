-- Migration: Add country, city, and website_url columns to startup_profiles
-- Date: 2026-04-25

ALTER TABLE public.startup_profiles
  ADD COLUMN IF NOT EXISTS location_country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_city    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS website_url      VARCHAR(500);
