-- Migration: Append-only audit log
-- Date: 2026-06-08
-- Task: T1.6 (audit logging)
-- Description:
--   A write-only / append-only audit trail that underpins the data room,
--   verification, and admin actions. Records actor, action, target, and an
--   optional JSON detail with a timestamp. Per the PRD it must NOT be editable
--   by users OR admins, so UPDATE and DELETE are blocked at the database level
--   via rules — even a superuser-less admin connection cannot tamper with rows.
--   Retention is >= 12 months: nothing purges this table (no cron deletes it).
--
-- Reversible: yes, but intentionally awkward — you must drop the protective
--   rules first, then the table:
--     DROP RULE audit_log_no_update ON public.audit_log;
--     DROP RULE audit_log_no_delete ON public.audit_log;
--     DROP TABLE public.audit_log;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- WHO did it. NULL = system/automated action (e.g. cron). ON DELETE SET NULL
  -- so deleting a user never erases the history of what they did.
  actor_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role  VARCHAR(20),                 -- snapshot of the actor's role at the time
  -- WHAT happened. A stable machine string, e.g. 'document.access',
  -- 'verification.approved', 'connection.accepted', 'account.deleted'.
  action      VARCHAR(80) NOT NULL,
  -- WHAT it was done to. Free-form type + id so we can target any entity.
  target_type VARCHAR(50),                 -- e.g. 'document', 'user', 'connection'
  target_id   VARCHAR(100),                -- uuid or other id, kept as text for flexibility
  -- Optional structured context (no secrets / no document contents).
  detail      JSONB,
  client_ip   VARCHAR(45),
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Lookups: "everything an actor did", "everything done to a target", and
-- "recent events of an action type".
CREATE INDEX IF NOT EXISTS idx_audit_actor      ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target     ON public.audit_log (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON public.audit_log (action, created_at DESC);

-- Immutability: block UPDATE and DELETE for everyone. INSERT and SELECT remain
-- allowed. `DO INSTEAD NOTHING` turns any UPDATE/DELETE into a no-op, so rows
-- can never be altered or removed — even by an admin with table access.
CREATE OR REPLACE RULE audit_log_no_update AS
  ON UPDATE TO public.audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_log_no_delete AS
  ON DELETE TO public.audit_log DO INSTEAD NOTHING;

COMMENT ON TABLE public.audit_log IS
  'Append-only audit trail (T1.6). UPDATE/DELETE blocked by rules — immutable to users and admins. Retained >= 12 months (never purged).';
