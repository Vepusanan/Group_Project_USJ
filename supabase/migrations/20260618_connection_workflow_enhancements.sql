-- Connection workflow: optional request message, decline cooling period tracking
ALTER TABLE public.connections
  ADD COLUMN IF NOT EXISTS request_message VARCHAR(300),
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
