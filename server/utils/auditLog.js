// Audit logging — Task T1.6
//
// A write-only audit trail. Later tasks just call logAudit(...) to record
// security/compliance-relevant events: document access (data room), verification
// decisions, connection state changes, account deletions, and admin actions.
//
// The table (public.audit_log) is append-only and immutable — UPDATE/DELETE are
// blocked at the DB level (see migration 20260608_create_audit_log.sql), so even
// an admin cannot tamper with history. Retention is >= 12 months (nothing purges
// it).
//
// Per the §9.6 requirement, audit writes happen in REAL TIME (no batching): we
// await the INSERT. But a logging failure must never break the user's action, so
// errors are swallowed and logged to the server console only.

import pool from "../config/database.js";

// Stable action strings. Use these constants so call sites stay consistent and
// the admin panel (T8.3) can filter reliably.
export const AuditAction = {
  // Data room (T3.2 / T7.5)
  DOCUMENT_ACCESS: "document.access",
  DOCUMENT_GRANT: "document.grant",
  DOCUMENT_REVOKE: "document.revoke",
  DOCUMENT_UPLOAD: "document.upload",
  DOCUMENT_DELETE: "document.delete",
  // Verification (T2.1)
  VERIFICATION_SUBMIT: "verification.submit",
  VERIFICATION_APPROVE: "verification.approved",
  VERIFICATION_REJECT: "verification.rejected",
  // Connections
  CONNECTION_REQUEST: "connection.request",
  CONNECTION_ACCEPT: "connection.accepted",
  CONNECTION_DECLINE: "connection.declined",
  CONNECTION_REMOVE: "connection.removed",
  // Account lifecycle
  ACCOUNT_DELETE_REQUEST: "account.delete_requested",
  ACCOUNT_DELETED: "account.deleted",
  // Generic admin action bucket
  ADMIN_ACTION: "admin.action",
};

/**
 * Append one entry to the audit log. Never throws.
 *
 * @param {Object} entry
 *   @param {string} entry.action       required — use an AuditAction constant
 *   @param {string} [entry.actorId]    who did it (omit/null for system actions)
 *   @param {string} [entry.actorRole]  actor's role snapshot (startup/investor/admin)
 *   @param {string} [entry.targetType] what it was done to ('document', 'user', ...)
 *   @param {string} [entry.targetId]   the target's id
 *   @param {Object} [entry.detail]     small structured context (NO secrets/content)
 *   @param {string} [entry.clientIp]   request IP, if available
 * @returns {Promise<string|null>} the audit row id, or null on failure
 */
export async function logAudit(entry = {}) {
  const {
    action,
    actorId = null,
    actorRole = null,
    targetType = null,
    targetId = null,
    detail = null,
    clientIp = null,
  } = entry;

  if (!action) {
    console.error("logAudit: missing action");
    return null;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.audit_log
         (actor_id, actor_role, action, target_type, target_id, detail, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        actorId,
        actorRole,
        action,
        targetType,
        targetId != null ? String(targetId) : null,
        detail ? JSON.stringify(detail) : null,
        clientIp,
      ],
    );
    return rows[0]?.id ?? null;
  } catch (error) {
    // Audit failure must not break the originating action. Log and move on.
    console.error("logAudit failed:", error.message);
    return null;
  }
}

/**
 * Convenience: derive actor fields straight from an Express req (set by `protect`)
 * and merge with the rest of the entry. Saves call sites repeating req.user plumbing.
 *
 *   await logAuditFromReq(req, { action: AuditAction.DOCUMENT_ACCESS, targetType: 'document', targetId });
 */
export async function logAuditFromReq(req, entry = {}) {
  return logAudit({
    actorId: req?.user?.id ?? null,
    actorRole: req?.user?.user_type ?? null,
    clientIp:
      req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req?.socket?.remoteAddress ||
      null,
    ...entry,
  });
}

/**
 * Query helper: most-recent audit entries for a given target (e.g. the startup
 * viewing the access trail of one data-room document — T3.2). Read-only.
 */
export async function getAuditForTarget(targetType, targetId, limit = 100) {
  try {
    const { rows } = await pool.query(
      `SELECT id, actor_id, actor_role, action, detail, client_ip, created_at
         FROM public.audit_log
        WHERE target_type = $1 AND target_id = $2
        ORDER BY created_at DESC
        LIMIT $3`,
      [targetType, String(targetId), limit],
    );
    return rows;
  } catch (error) {
    console.error("getAuditForTarget failed:", error.message);
    return [];
  }
}
