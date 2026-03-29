CREATE TABLE IF NOT EXISTS public.connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL,
  startup_id uuid NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (id),
  CONSTRAINT connections_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES public.users(id),
  CONSTRAINT connections_startup_id_fkey FOREIGN KEY (startup_id) REFERENCES public.users(id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'connections_status_check'
      AND conrelid = 'public.connections'::regclass
  ) THEN
    ALTER TABLE public.connections
      ADD CONSTRAINT connections_status_check
      CHECK (LOWER(status) IN ('pending', 'accepted', 'declined', 'connected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_connections_investor_startup
  ON public.connections (investor_id, startup_id);

CREATE INDEX IF NOT EXISTS idx_connections_investor_status
  ON public.connections (investor_id, status);

CREATE INDEX IF NOT EXISTS idx_connections_startup_status
  ON public.connections (startup_id, status);
