import pool from "../config/database.js";

export const MEETING_FORMATS = ["VIDEO_CALL", "PHONE_CALL", "IN_PERSON"];

let tablesReadyPromise = null;

export const ensureMeetingTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      DO $$ BEGIN
        CREATE TYPE public.meeting_format_enum AS ENUM ('VIDEO_CALL', 'PHONE_CALL', 'IN_PERSON');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS public.connection_meetings (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
        requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        proposed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        format public.meeting_format_enum NOT NULL,
        agenda TEXT NOT NULL,
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        responded_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT connection_meetings_pkey PRIMARY KEY (id)
      );

      CREATE TABLE IF NOT EXISTS public.meeting_notes (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        meeting_id UUID NOT NULL REFERENCES public.connection_meetings(id) ON DELETE CASCADE,
        author_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT meeting_notes_pkey PRIMARY KEY (id)
      );

      ALTER TABLE public.connection_meetings
        ADD COLUMN IF NOT EXISTS ai_brief JSONB,
        ADD COLUMN IF NOT EXISTS ai_brief_generated_at TIMESTAMP WITHOUT TIME ZONE;
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function createMeetingRequest({
  connectionId,
  requestedBy,
  proposedAt,
  format,
  agenda,
  message = null,
}) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      INSERT INTO public.connection_meetings
        (connection_id, requested_by, proposed_at, format, agenda, message)
      VALUES ($1, $2, $3, $4::public.meeting_format_enum, $5, $6)
      RETURNING *
    `,
    [connectionId, requestedBy, proposedAt, format, agenda, message],
  );

  return result.rows[0];
}

export async function getMeetingById(meetingId) {
  await ensureMeetingTables();

  const result = await pool.query(
    `SELECT * FROM public.connection_meetings WHERE id = $1`,
    [meetingId],
  );

  return result.rows[0] || null;
}

export async function listMeetingsForConnection(connectionId) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      SELECT m.*, u.full_name AS requested_by_name
      FROM public.connection_meetings m
      JOIN public.users u ON u.id = m.requested_by
      WHERE m.connection_id = $1
      ORDER BY m.proposed_at DESC, m.created_at DESC
    `,
    [connectionId],
  );

  return result.rows;
}

export async function respondToMeeting(meetingId, status) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      UPDATE public.connection_meetings
      SET status = $2, responded_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `,
    [meetingId, status],
  );

  return result.rows[0] || null;
}

export async function listMeetingNotes(meetingId) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      SELECT n.*, u.full_name AS author_name
      FROM public.meeting_notes n
      JOIN public.users u ON u.id = n.author_user_id
      WHERE n.meeting_id = $1
      ORDER BY n.created_at ASC
    `,
    [meetingId],
  );

  return result.rows;
}

export async function createMeetingNote(meetingId, authorUserId, content) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      INSERT INTO public.meeting_notes (meeting_id, author_user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [meetingId, authorUserId, content],
  );

  return result.rows[0];
}

export async function listMeetingNotesForUser(meetingId, userId) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      SELECT n.*, u.full_name AS author_name
      FROM public.meeting_notes n
      JOIN public.users u ON u.id = n.author_user_id
      WHERE n.meeting_id = $1 AND n.author_user_id = $2
      ORDER BY n.created_at ASC
    `,
    [meetingId, userId],
  );

  return result.rows;
}

export async function listRecentMeetingUpdatesForUser(userId) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      SELECT
        m.id,
        m.connection_id,
        m.proposed_at,
        m.agenda,
        m.format,
        m.status,
        m.responded_at,
        u.full_name AS other_party_name
      FROM public.connection_meetings m
      JOIN public.connections c ON c.id = m.connection_id
      JOIN public.users u ON u.id = CASE
        WHEN c.investor_id = $1 THEN c.startup_id
        ELSE c.investor_id
      END
      WHERE (c.investor_id = $1 OR c.startup_id = $1)
        AND m.status IN ('accepted', 'declined')
        AND m.responded_at > NOW() - INTERVAL '7 days'
        AND LOWER(c.status) IN ('accepted', 'connected')
      ORDER BY m.responded_at DESC
      LIMIT 10
    `,
    [userId],
  );

  return result.rows;
}

export async function saveMeetingBrief(meetingId, brief) {
  await ensureMeetingTables();

  const result = await pool.query(
    `
      UPDATE public.connection_meetings
      SET ai_brief = $2::jsonb,
          ai_brief_generated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, ai_brief, ai_brief_generated_at
    `,
    [meetingId, JSON.stringify(brief)],
  );

  return result.rows[0] || null;
}
