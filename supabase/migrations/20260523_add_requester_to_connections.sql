-- Allow either side (investor or startup) to initiate a connection request.
-- Previously the model was "investors initiate, startups respond" which was
-- enforced both at the application layer (INVALID_INITIATOR) and implicitly
-- by the schema (no requester_id, so updateConnectionStatus had to hardcode
-- "only the startup can accept").
--
-- We now track who initiated each request so the OTHER party can accept it.

ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS requester_id uuid;

-- Backfill: every existing row was investor-initiated under the old rule.
UPDATE public.connections
  SET requester_id = investor_id
  WHERE requester_id IS NULL;

-- Going forward the column must be populated on insert.
ALTER TABLE public.connections
  ALTER COLUMN requester_id SET NOT NULL;

-- Sanity constraint: requester must be one of the two parties.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'connections_requester_check'
      AND conrelid = 'public.connections'::regclass
  ) THEN
    ALTER TABLE public.connections
      ADD CONSTRAINT connections_requester_check
      CHECK (requester_id = investor_id OR requester_id = startup_id);
  END IF;
END $$;
