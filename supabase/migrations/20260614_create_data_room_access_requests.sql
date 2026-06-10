-- Migration: Data room access requests (US-06 analytics)
-- Connected investors request access; startups grant via existing grants table.

CREATE TABLE IF NOT EXISTS public.data_room_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
  investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied')),
  requested_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT data_room_access_requests_pkey PRIMARY KEY (id),
  CONSTRAINT data_room_access_requests_unique_pair UNIQUE (startup_profile_id, investor_user_id)
);

CREATE INDEX IF NOT EXISTS idx_data_room_access_requests_startup
  ON public.data_room_access_requests (startup_profile_id, requested_at DESC);

COMMENT ON TABLE public.data_room_access_requests IS 'Investor requests for data room access pending startup approval';
