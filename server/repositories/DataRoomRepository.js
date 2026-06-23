import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ensureDataRoomTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.data_room_folders (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT data_room_folders_pkey PRIMARY KEY (id)
      );

      CREATE TABLE IF NOT EXISTS public.data_room_documents (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        folder_id UUID REFERENCES public.data_room_folders(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        storage_bucket VARCHAR(120),
        storage_path TEXT,
        mime_type VARCHAR(120),
        file_size_bytes BIGINT,
        uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT data_room_documents_pkey PRIMARY KEY (id)
      );

      ALTER TABLE public.data_room_documents
        ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(120),
        ADD COLUMN IF NOT EXISTS storage_path TEXT;

      CREATE TABLE IF NOT EXISTS public.data_room_access_grants (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        granted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        granted_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP WITHOUT TIME ZONE,
        CONSTRAINT data_room_access_grants_pkey PRIMARY KEY (id),
        CONSTRAINT data_room_access_grants_unique_pair UNIQUE (startup_profile_id, investor_user_id)
      );

      CREATE TABLE IF NOT EXISTS public.data_room_audit_log (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        investor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        document_id UUID REFERENCES public.data_room_documents(id) ON DELETE SET NULL,
        folder_id UUID REFERENCES public.data_room_folders(id) ON DELETE SET NULL,
        action_type VARCHAR(50) NOT NULL,
        performed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT data_room_audit_log_pkey PRIMARY KEY (id)
      );
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function recordDataRoomAudit({
  startupProfileId,
  investorUserId = null,
  documentId = null,
  folderId = null,
  actionType,
  performedBy,
  metadata = {},
}) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      INSERT INTO public.data_room_audit_log
        (startup_profile_id, investor_user_id, document_id, folder_id, action_type, performed_by, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING *
    `,
    [
      startupProfileId,
      investorUserId,
      documentId,
      folderId,
      actionType,
      performedBy,
      JSON.stringify(metadata),
    ],
  );

  return result.rows[0];
}

export function recordDataRoomAuditAsync(params) {
  recordDataRoomAudit(params).catch((error) => {
    console.error("Data room audit write failed:", error.message);
  });
}

export async function listFoldersForStartup(startupProfileId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      SELECT id, startup_profile_id, name, created_at, updated_at
      FROM public.data_room_folders
      WHERE startup_profile_id = $1
      ORDER BY name ASC
    `,
    [startupProfileId],
  );

  return result.rows;
}

export async function createFolder(startupProfileId, name) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      INSERT INTO public.data_room_folders (startup_profile_id, name)
      VALUES ($1, $2)
      RETURNING *
    `,
    [startupProfileId, name.trim()],
  );

  return result.rows[0];
}

export async function getFolderById(folderId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `SELECT * FROM public.data_room_folders WHERE id = $1`,
    [folderId],
  );

  return result.rows[0] || null;
}

export async function updateFolder(folderId, name) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      UPDATE public.data_room_folders
      SET name = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [folderId, name.trim()],
  );

  return result.rows[0] || null;
}

export async function deleteFolder(folderId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `DELETE FROM public.data_room_folders WHERE id = $1 RETURNING *`,
    [folderId],
  );

  return result.rows[0] || null;
}

export async function listDocumentsForStartup(startupProfileId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      SELECT
        d.id,
        d.startup_profile_id,
        d.folder_id,
        d.name,
        d.file_name,
        d.description,
        d.mime_type,
        d.file_size_bytes,
        d.uploaded_by,
        d.created_at,
        d.updated_at,
        u.full_name AS uploaded_by_name
      FROM public.data_room_documents d
      LEFT JOIN public.users u ON u.id = d.uploaded_by
      WHERE d.startup_profile_id = $1
      ORDER BY d.created_at DESC
    `,
    [startupProfileId],
  );

  return result.rows;
}

export async function getDocumentById(documentId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `SELECT * FROM public.data_room_documents WHERE id = $1`,
    [documentId],
  );

  return result.rows[0] || null;
}

export async function createDocument({
  startupProfileId,
  folderId,
  name,
  fileName,
  description,
  fileUrl,
  storageBucket = null,
  storagePath = null,
  mimeType,
  fileSizeBytes,
  uploadedBy,
}) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      INSERT INTO public.data_room_documents
        (startup_profile_id, folder_id, name, file_name, description, file_url, storage_bucket, storage_path, mime_type, file_size_bytes, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
    [
      startupProfileId,
      folderId || null,
      name.trim(),
      fileName,
      description?.trim() || null,
      fileUrl,
      storageBucket,
      storagePath,
      mimeType || null,
      fileSizeBytes || null,
      uploadedBy,
    ],
  );

  return result.rows[0];
}

export async function updateDocument(documentId, updates) {
  await ensureDataRoomTables();

  const fields = [];
  const values = [documentId];
  let idx = 2;

  if (updates.name != null) {
    fields.push(`name = $${idx++}`);
    values.push(updates.name.trim());
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(updates.description?.trim() || null);
  }
  if (updates.folder_id !== undefined) {
    fields.push(`folder_id = $${idx++}`);
    values.push(updates.folder_id || null);
  }

  if (fields.length === 0) return getDocumentById(documentId);

  const result = await pool.query(
    `
      UPDATE public.data_room_documents
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    values,
  );

  return result.rows[0] || null;
}

export async function deleteDocument(documentId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `DELETE FROM public.data_room_documents WHERE id = $1 RETURNING *`,
    [documentId],
  );

  return result.rows[0] || null;
}

export async function hasActiveDataRoomAccess(startupProfileId, investorUserId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      SELECT id
      FROM public.data_room_access_grants
      WHERE startup_profile_id = $1
        AND investor_user_id = $2
        AND revoked_at IS NULL
      LIMIT 1
    `,
    [startupProfileId, investorUserId],
  );

  return result.rows.length > 0;
}

export async function listAccessGrantsForStartup(startupProfileId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      SELECT
        g.id,
        g.startup_profile_id,
        g.investor_user_id,
        g.granted_by,
        g.granted_at,
        g.revoked_at,
        u.full_name AS investor_name,
        u.email AS investor_email,
        ip.investor_profile_id,
        ip.name_or_firm AS investor_firm
      FROM public.data_room_access_grants g
      JOIN public.users u ON u.id = g.investor_user_id
      LEFT JOIN public.investor_profiles ip ON ip.user_id = g.investor_user_id
      WHERE g.startup_profile_id = $1
      ORDER BY g.granted_at DESC
    `,
    [startupProfileId],
  );

  return result.rows;
}

export async function grantDataRoomAccess({
  startupProfileId,
  investorUserId,
  grantedBy,
}) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      INSERT INTO public.data_room_access_grants
        (startup_profile_id, investor_user_id, granted_by, granted_at, revoked_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, NULL)
      ON CONFLICT (startup_profile_id, investor_user_id)
      DO UPDATE SET
        granted_by = EXCLUDED.granted_by,
        granted_at = CURRENT_TIMESTAMP,
        revoked_at = NULL
      RETURNING *
    `,
    [startupProfileId, investorUserId, grantedBy],
  );

  return result.rows[0];
}

export async function revokeDataRoomAccess(grantId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      UPDATE public.data_room_access_grants
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND revoked_at IS NULL
      RETURNING *
    `,
    [grantId],
  );

  return result.rows[0] || null;
}

export async function getAccessGrantById(grantId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `SELECT * FROM public.data_room_access_grants WHERE id = $1`,
    [grantId],
  );

  return result.rows[0] || null;
}

export async function listRecentAccessGrantsForInvestor(investorUserId) {
  await ensureDataRoomTables();

  const result = await pool.query(
    `
      SELECT
        g.id,
        g.startup_profile_id,
        g.investor_user_id,
        g.granted_at,
        sp.company_name,
        u.full_name AS granted_by_name
      FROM public.data_room_access_grants g
      JOIN public.startup_profiles sp ON sp.startup_profile_id = g.startup_profile_id
      JOIN public.users u ON u.id = g.granted_by
      WHERE g.investor_user_id = $1
        AND g.revoked_at IS NULL
        AND g.granted_at > NOW() - INTERVAL '90 days'
      ORDER BY g.granted_at DESC
    `,
    [investorUserId],
  );

  return result.rows;
}

export async function listAuditLogForStartup(
  startupProfileId,
  {
    limit = 50,
    investorUserId = null,
    documentId = null,
    actionType = null,
  } = {},
) {
  await ensureDataRoomTables();

  const conditions = ["a.startup_profile_id = $1"];
  const values = [startupProfileId];
  let idx = 2;

  if (investorUserId) {
    conditions.push(`a.investor_user_id = $${idx}`);
    values.push(investorUserId);
    idx += 1;
  }

  if (documentId) {
    conditions.push(`a.document_id = $${idx}`);
    values.push(documentId);
    idx += 1;
  }

  if (actionType) {
    conditions.push(`a.action_type = $${idx}`);
    values.push(actionType);
    idx += 1;
  }

  values.push(Math.min(Math.max(Number(limit) || 50, 1), 500));

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.startup_profile_id,
        a.investor_user_id,
        a.document_id,
        a.folder_id,
        a.action_type,
        a.performed_by,
        a.metadata,
        a.created_at,
        performer.full_name AS performed_by_name,
        investor.full_name AS investor_name,
        d.name AS document_name,
        f.name AS folder_name
      FROM public.data_room_audit_log a
      LEFT JOIN public.users performer ON performer.id = a.performed_by
      LEFT JOIN public.users investor ON investor.id = a.investor_user_id
      LEFT JOIN public.data_room_documents d ON d.id = a.document_id
      LEFT JOIN public.data_room_folders f ON f.id = a.folder_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.created_at DESC
      LIMIT $${idx}
    `,
    values,
  );

  return result.rows;
}
