import pool from "../config/database.js";
import { encryptNote, decryptNote } from "../utils/noteEncryption.js";

let tablesReadyPromise = null;

export const ensureConnectionNotesTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.connection_notes (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
        author_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 4000),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT connection_notes_pkey PRIMARY KEY (id)
      );
      CREATE INDEX IF NOT EXISTS idx_connection_notes_connection
        ON public.connection_notes (connection_id, created_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function listConnectionNotes(connectionId, authorUserId) {
  await ensureConnectionNotesTables();

  const result = await pool.query(
    `
      SELECT id, connection_id, author_user_id, content, created_at
      FROM public.connection_notes
      WHERE connection_id = $1 AND author_user_id = $2
      ORDER BY created_at DESC
    `,
    [connectionId, authorUserId],
  );

  return result.rows.map((row) => ({
    ...row,
    content: decryptNote(row.content),
  }));
}

export async function createConnectionNote(connectionId, authorUserId, content) {
  await ensureConnectionNotesTables();

  const result = await pool.query(
    `
      INSERT INTO public.connection_notes (connection_id, author_user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [connectionId, authorUserId, encryptNote(content)],
  );

  const row = result.rows[0];
  return { ...row, content: decryptNote(row.content) };
}
