CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  user_id UUID NOT NULL,
  notification_key TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_key)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_reads_user
  ON public.user_notification_reads (user_id, read_at DESC);
