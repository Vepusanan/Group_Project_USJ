-- Migration: Async notification queue + email suppression
-- Date: 2026-06-08
-- Task: T1.5 (async notification queue: in-app + email)
-- Description:
--   V1 in-app notifications are DERIVED live (pending connections + unread
--   messages). V2 features (deck uploaded, round closing, verification approved,
--   watched-startup updated, ...) have nowhere to store a notification, and email
--   sending currently blocks the request. This migration adds:
--     1. `notifications`  — a persisted notification feed AND the email work queue.
--                           Requests INSERT a row and return; a worker delivers email.
--     2. `email_suppression` — addresses that must not be emailed (unsubscribed/bounced).
--
-- Reversible: yes (DROP both tables).

-- 1) Notifications: stored in-app feed + email delivery queue ----------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL,        -- e.g. 'connection_request', 'deck_uploaded'
  title         VARCHAR(255) NOT NULL,
  body          TEXT,
  data          JSONB,                       -- arbitrary payload (ids, links, ...)
  link          VARCHAR(500),                -- optional in-app deep link

  -- in-app read state
  read_at       TIMESTAMPTZ,

  -- email delivery queue state
  email_enabled BOOLEAN NOT NULL DEFAULT true,   -- whether this should be emailed
  email_status  VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|sent|failed|skipped
  email_attempts INTEGER NOT NULL DEFAULT 0,
  email_sent_at TIMESTAMPTZ,
  email_last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- worker picks up when due

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_email_status_check
    CHECK (email_status IN ('pending', 'sent', 'failed', 'skipped'))
);

-- Worker query: pending + due, oldest first.
CREATE INDEX IF NOT EXISTS idx_notifications_email_pending
  ON public.notifications (next_attempt_at)
  WHERE email_status = 'pending' AND email_enabled = true;

-- Feed query: a user's notifications newest first.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- 2) Email suppression list --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_suppression (
  email       VARCHAR(255) NOT NULL,
  reason      VARCHAR(30) NOT NULL DEFAULT 'unsubscribed', -- unsubscribed|bounced|complaint
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_suppression_pkey PRIMARY KEY (email)
);

COMMENT ON TABLE public.notifications IS
  'Persisted in-app notification feed and email delivery queue (T1.5).';
COMMENT ON TABLE public.email_suppression IS
  'Addresses that must not receive email (unsubscribed/bounced/complaint) (T1.5).';
