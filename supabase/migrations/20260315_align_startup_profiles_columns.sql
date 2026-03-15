ALTER TABLE public.startup_profiles
ADD COLUMN IF NOT EXISTS location_country VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS funding_stage VARCHAR(50),
ADD COLUMN IF NOT EXISTS revenue_status VARCHAR(100);

UPDATE public.startup_profiles
SET
  location_country = COALESCE(location_country, country),
  location_city = COALESCE(location_city, city),
  funding_stage = COALESCE(funding_stage, stage)
WHERE location_country IS NULL
   OR location_city IS NULL
   OR funding_stage IS NULL;

CREATE INDEX IF NOT EXISTS idx_startup_profiles_location_country ON public.startup_profiles(location_country);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_location_city ON public.startup_profiles(location_city);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_funding_stage ON public.startup_profiles(funding_stage);
CREATE INDEX IF NOT EXISTS idx_startup_profiles_revenue_status ON public.startup_profiles(revenue_status);