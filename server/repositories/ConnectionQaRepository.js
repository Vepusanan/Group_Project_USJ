import pool from "../config/database.js";

export const QA_CATEGORIES = [
  "MARKET",
  "PRODUCT",
  "TEAM",
  "FINANCIALS",
  "LEGAL",
];

let tablesReadyPromise = null;

export const ensureConnectionQaTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      DO $$ BEGIN
        CREATE TYPE public.qa_category_enum AS ENUM (
          'MARKET', 'PRODUCT', 'TEAM', 'FINANCIALS', 'LEGAL'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS public.connection_qa_threads (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
        asked_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        category public.qa_category_enum NOT NULL,
        question TEXT NOT NULL,
        asked_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        answer TEXT,
        answered_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT connection_qa_threads_pkey PRIMARY KEY (id)
      );

      ALTER TABLE public.connection_qa_threads
        ADD COLUMN IF NOT EXISTS checklist_item_id UUID;
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function listQaThreads(connectionId) {
  await ensureConnectionQaTables();

  const result = await pool.query(
    `
      SELECT q.*, u.full_name AS asker_name,
             i.description AS checklist_item_description
      FROM public.connection_qa_threads q
      JOIN public.users u ON u.id = q.asked_by
      LEFT JOIN public.dd_checklist_items i ON i.id = q.checklist_item_id
      WHERE q.connection_id = $1
      ORDER BY q.asked_at DESC
    `,
    [connectionId],
  );

  return result.rows;
}

export async function createQaQuestion({
  connectionId,
  askedBy,
  category,
  question,
  checklistItemId = null,
}) {
  await ensureConnectionQaTables();

  const result = await pool.query(
    `
      INSERT INTO public.connection_qa_threads
        (connection_id, asked_by, category, question, checklist_item_id)
      VALUES ($1, $2, $3::public.qa_category_enum, $4, $5)
      RETURNING *
    `,
    [connectionId, askedBy, category, question, checklistItemId],
  );

  return result.rows[0];
}

export async function answerQaThread({ threadId, answer }) {
  await ensureConnectionQaTables();

  const result = await pool.query(
    `
      UPDATE public.connection_qa_threads
      SET answer = $2, answered_at = NOW()
      WHERE id = $1 AND answer IS NULL
      RETURNING *
    `,
    [threadId, answer],
  );

  return result.rows[0] || null;
}

export async function getQaThreadById(threadId) {
  await ensureConnectionQaTables();

  const result = await pool.query(
    `SELECT * FROM public.connection_qa_threads WHERE id = $1`,
    [threadId],
  );

  return result.rows[0] || null;
}

export async function listUnansweredQuestionsForStartup(startupUserId) {
  await ensureConnectionQaTables();

  const result = await pool.query(
    `
      SELECT q.id, q.category, q.question, q.asked_at,
             u.full_name AS investor_name, c.id AS connection_id
      FROM public.connection_qa_threads q
      JOIN public.connections c ON c.id = q.connection_id
      JOIN public.users u ON u.id = c.investor_id
      WHERE c.startup_id = $1
        AND q.answer IS NULL
        AND LOWER(c.status) IN ('accepted', 'connected')
      ORDER BY q.asked_at DESC
      LIMIT 10
    `,
    [startupUserId],
  );

  return result.rows;
}

export async function listRecentQaAnswersForInvestor(investorUserId) {
  await ensureConnectionQaTables();

  const result = await pool.query(
    `
      SELECT q.id, q.category, q.answered_at,
             sp.company_name, c.id AS connection_id
      FROM public.connection_qa_threads q
      JOIN public.connections c ON c.id = q.connection_id
      JOIN public.startup_profiles sp ON sp.user_id = c.startup_id
      WHERE c.investor_id = $1
        AND q.answer IS NOT NULL
        AND q.answered_at > NOW() - INTERVAL '7 days'
      ORDER BY q.answered_at DESC
      LIMIT 10
    `,
    [investorUserId],
  );

  return result.rows;
}
