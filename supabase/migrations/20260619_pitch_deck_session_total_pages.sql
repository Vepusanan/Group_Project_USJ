ALTER TABLE public.pitch_deck_view_sessions
  ADD COLUMN IF NOT EXISTS total_pages INTEGER;
