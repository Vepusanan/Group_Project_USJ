-- Migration: composite index for conversation message history (NFR 17.1 / 3.3)
-- Date: 2026-06-28
-- Description: The conversation history query orders messages by
--   (conversation_id, created_at DESC). A standalone conversation_id index
--   filters but still forces a sort on created_at. This composite index lets
--   Postgres satisfy both the filter and the ordering from the index, removing
--   the sort step for message-history reads (the hottest messaging path).
-- Additive and idempotent; does not replace the existing single-column index.

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON public.messages (conversation_id, created_at DESC);
