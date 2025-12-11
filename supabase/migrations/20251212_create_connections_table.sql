-- Migration: Create connections table
-- Date: 2025-12-12
-- Description: Table to track connections between investors and startups

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'connected', 'rejected')),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT connections_pkey PRIMARY KEY (id),
  CONSTRAINT connections_unique_pair UNIQUE (investor_id, startup_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connections_investor ON public.connections(investor_id);
CREATE INDEX IF NOT EXISTS idx_connections_startup ON public.connections(startup_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- Update timestamp trigger (reusing existing function if available, or redefining)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_connections_updated_at ON public.connections;
CREATE TRIGGER update_connections_updated_at 
    BEFORE UPDATE ON public.connections 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
