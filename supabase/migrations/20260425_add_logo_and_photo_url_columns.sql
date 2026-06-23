-- Migration: Add logo_url to startup_profiles and photo_url to investor_profiles
-- Date: 2026-04-25

ALTER TABLE public.startup_profiles
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);

ALTER TABLE public.investor_profiles
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
