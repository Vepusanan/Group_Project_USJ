import pool from "../config/database.js";

export const DD_ITEM_STATUSES = ["REQUESTED", "IN_REVIEW", "COMPLETED"];

let tablesReadyPromise = null;

export const ensureDdChecklistTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      DO $$ BEGIN
        CREATE TYPE public.dd_item_status_enum AS ENUM ('REQUESTED', 'IN_REVIEW', 'COMPLETED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS public.dd_checklists (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
        created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        is_shared BOOLEAN NOT NULL DEFAULT FALSE,
        shared_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT dd_checklists_pkey PRIMARY KEY (id),
        CONSTRAINT dd_checklists_connection_unique UNIQUE (connection_id)
      );

      CREATE TABLE IF NOT EXISTS public.dd_checklist_items (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        checklist_id UUID NOT NULL REFERENCES public.dd_checklists(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        status public.dd_item_status_enum NOT NULL DEFAULT 'REQUESTED',
        due_date DATE,
        response_document_url TEXT,
        response_document_name VARCHAR(255),
        response_submitted_at TIMESTAMP WITHOUT TIME ZONE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT dd_checklist_items_pkey PRIMARY KEY (id)
      );

      ALTER TABLE public.dd_checklist_items
        ADD COLUMN IF NOT EXISTS response_type VARCHAR(30) DEFAULT 'upload',
        ADD COLUMN IF NOT EXISTS data_room_document_id UUID,
        ADD COLUMN IF NOT EXISTS data_room_folder_id UUID;
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function getChecklistByConnectionId(connectionId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `SELECT * FROM public.dd_checklists WHERE connection_id = $1`,
    [connectionId],
  );

  return result.rows[0] || null;
}

export async function getOrCreateChecklist({ connectionId, createdBy }) {
  await ensureDdChecklistTables();

  const existing = await getChecklistByConnectionId(connectionId);
  if (existing) return existing;

  const result = await pool.query(
    `
      INSERT INTO public.dd_checklists (connection_id, created_by)
      VALUES ($1, $2)
      RETURNING *
    `,
    [connectionId, createdBy],
  );

  return result.rows[0];
}

const CHECKLIST_ITEM_SELECT = `
  SELECT
    i.*,
    drd.name AS linked_document_name,
    drd.file_name AS linked_document_file_name,
    drd.file_url AS linked_document_url,
    drd.mime_type AS linked_document_mime_type,
    drf.name AS linked_folder_name
  FROM public.dd_checklist_items i
  LEFT JOIN public.data_room_documents drd ON drd.id = i.data_room_document_id
  LEFT JOIN public.data_room_folders drf ON drf.id = i.data_room_folder_id
`;

export async function listChecklistItems(checklistId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      ${CHECKLIST_ITEM_SELECT}
      WHERE i.checklist_id = $1
      ORDER BY i.sort_order ASC, i.created_at ASC
    `,
    [checklistId],
  );

  return result.rows;
}

export async function addChecklistItem({
  checklistId,
  description,
  dueDate = null,
}) {
  await ensureDdChecklistTables();

  const orderResult = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
     FROM public.dd_checklist_items WHERE checklist_id = $1`,
    [checklistId],
  );
  const sortOrder = orderResult.rows[0]?.next_order || 0;

  const result = await pool.query(
    `
      INSERT INTO public.dd_checklist_items
        (checklist_id, description, due_date, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [checklistId, description, dueDate, sortOrder],
  );

  return result.rows[0];
}

export async function updateChecklistItem(itemId, updates) {
  await ensureDdChecklistTables();

  const allowed = ["description", "status", "due_date"];
  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      if (key === "status") {
        sets.push(`status = $${idx}::public.dd_item_status_enum`);
      } else {
        sets.push(`${key} = $${idx}`);
      }
      values.push(updates[key]);
      idx += 1;
    }
  }

  if (sets.length === 0) return null;

  sets.push(`updated_at = NOW()`);
  values.push(itemId);

  const result = await pool.query(
    `UPDATE public.dd_checklist_items SET ${sets.join(", ")}
     WHERE id = $${idx} RETURNING *`,
    values,
  );

  return result.rows[0] || null;
}

export async function deleteChecklistItem(itemId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `DELETE FROM public.dd_checklist_items WHERE id = $1 RETURNING id`,
    [itemId],
  );

  return result.rows[0] || null;
}

export async function shareChecklist(checklistId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      UPDATE public.dd_checklists
      SET is_shared = TRUE, shared_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [checklistId],
  );

  return result.rows[0] || null;
}

export async function submitItemResponse({
  itemId,
  documentUrl,
  documentName,
}) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      UPDATE public.dd_checklist_items
      SET response_document_url = $2,
          response_document_name = $3,
          response_type = 'upload',
          data_room_document_id = NULL,
          data_room_folder_id = NULL,
          response_submitted_at = NOW(),
          status = 'IN_REVIEW'::public.dd_item_status_enum,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [itemId, documentUrl, documentName],
  );

  return result.rows[0] || null;
}

export async function submitDataRoomLinkResponse({
  itemId,
  responseType,
  dataRoomDocumentId = null,
  dataRoomFolderId = null,
  documentUrl = null,
  documentName = null,
}) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      UPDATE public.dd_checklist_items
      SET response_type = $2,
          data_room_document_id = $3,
          data_room_folder_id = $4,
          response_document_url = $5,
          response_document_name = $6,
          response_submitted_at = NOW(),
          status = 'IN_REVIEW'::public.dd_item_status_enum,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      itemId,
      responseType,
      dataRoomDocumentId,
      dataRoomFolderId,
      documentUrl,
      documentName,
    ],
  );

  return result.rows[0] || null;
}

export async function getChecklistItemById(itemId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      ${CHECKLIST_ITEM_SELECT}
      WHERE i.id = $1
    `,
    [itemId],
  );

  return result.rows[0] || null;
}

export async function areAllChecklistItemsCompleted(checklistId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed
      FROM public.dd_checklist_items
      WHERE checklist_id = $1
    `,
    [checklistId],
  );

  const row = result.rows[0] || { total: 0, completed: 0 };
  return row.total > 0 && row.total === row.completed;
}

export async function listRecentDdResponsesForInvestor(investorUserId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      SELECT i.id AS item_id, i.description, i.response_submitted_at,
             c.id AS connection_id, sp.company_name
      FROM public.dd_checklist_items i
      JOIN public.dd_checklists cl ON cl.id = i.checklist_id
      JOIN public.connections c ON c.id = cl.connection_id
      JOIN public.startup_profiles sp ON sp.user_id = c.startup_id
      WHERE c.investor_id = $1
        AND i.response_submitted_at IS NOT NULL
        AND i.response_submitted_at > NOW() - INTERVAL '7 days'
      ORDER BY i.response_submitted_at DESC
      LIMIT 10
    `,
    [investorUserId],
  );

  return result.rows;
}

export async function listSharedChecklistsForStartup(startupUserId) {
  await ensureDdChecklistTables();

  const result = await pool.query(
    `
      SELECT cl.id AS checklist_id, cl.connection_id, cl.shared_at,
             u.full_name AS investor_name
      FROM public.dd_checklists cl
      JOIN public.connections c ON c.id = cl.connection_id
      JOIN public.users u ON u.id = c.investor_id
      WHERE c.startup_id = $1
        AND cl.is_shared = TRUE
        AND cl.shared_at > NOW() - INTERVAL '7 days'
        AND LOWER(c.status) IN ('accepted', 'connected')
      ORDER BY cl.shared_at DESC NULLS LAST
      LIMIT 10
    `,
    [startupUserId],
  );

  return result.rows;
}
