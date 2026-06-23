-- Upgrade legacy event-per-row startup_profile_views to daily deduplicated schema.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'startup_profile_views'
      AND column_name = 'id'
  ) THEN
    CREATE TABLE public.startup_profile_views_daily (
      startup_profile_id UUID NOT NULL
        REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
      investor_user_id UUID NOT NULL
        REFERENCES public.users(id) ON DELETE CASCADE,
      view_date DATE NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 1,
      first_viewed_at TIMESTAMPTZ NOT NULL,
      last_viewed_at TIMESTAMPTZ NOT NULL,
      CONSTRAINT startup_profile_views_daily_pkey
        PRIMARY KEY (startup_profile_id, investor_user_id, view_date)
    );

    INSERT INTO public.startup_profile_views_daily (
      startup_profile_id,
      investor_user_id,
      view_date,
      view_count,
      first_viewed_at,
      last_viewed_at
    )
    SELECT
      startup_profile_id,
      investor_user_id,
      viewed_at::date AS view_date,
      COUNT(*)::int AS view_count,
      MIN(viewed_at) AS first_viewed_at,
      MAX(viewed_at) AS last_viewed_at
    FROM public.startup_profile_views
    GROUP BY startup_profile_id, investor_user_id, viewed_at::date;

    DROP TABLE public.startup_profile_views;
    ALTER TABLE public.startup_profile_views_daily
      RENAME TO startup_profile_views;

    CREATE INDEX IF NOT EXISTS idx_startup_profile_views_startup_date
      ON public.startup_profile_views (startup_profile_id, view_date DESC);

    CREATE INDEX IF NOT EXISTS idx_startup_profile_views_investor
      ON public.startup_profile_views (investor_user_id, last_viewed_at DESC);
  END IF;
END $$;
