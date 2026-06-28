import pool from "../config/database.js";
import { ensureUserActivityColumns } from "./UserActivityRepository.js";

let tablesReadyPromise = null;

export const ensureProfileReportTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      DO $$ BEGIN
        CREATE TYPE public.report_status_enum AS ENUM (
          'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS public.profile_reports (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        reporter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        status public.report_status_enum NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP WITHOUT TIME ZONE,
        CONSTRAINT profile_reports_pkey PRIMARY KEY (id),
        CONSTRAINT profile_reports_no_self_report CHECK (reporter_user_id <> reported_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_profile_reports_reported
        ON public.profile_reports (reported_user_id, status, created_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

const FRAUD_REPORT_THRESHOLD = 3;
const FRAUD_SUSPENSION_DAYS = 7;

export async function createProfileReport({
  reporterUserId,
  reportedUserId,
  reason,
}) {
  await ensureProfileReportTables();
  await ensureUserActivityColumns();

  const result = await pool.query(
    `
      INSERT INTO public.profile_reports (reporter_user_id, reported_user_id, reason)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [reporterUserId, reportedUserId, reason],
  );

  const report = result.rows[0];

  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS pending_count
      FROM public.profile_reports
      WHERE reported_user_id = $1
        AND status IN ('PENDING', 'UNDER_REVIEW')
    `,
    [reportedUserId],
  );

  const pendingCount = countResult.rows[0]?.pending_count || 0;
  let autoFlagged = false;

  if (pendingCount >= FRAUD_REPORT_THRESHOLD) {
    await pool.query(
      `
        UPDATE public.users
        SET fraud_flagged = TRUE,
            account_locked_until = CURRENT_TIMESTAMP + ($2::int * INTERVAL '1 day')
        WHERE id = $1
      `,
      [reportedUserId, FRAUD_SUSPENSION_DAYS],
    );
    autoFlagged = true;
  }

  return { report, pendingCount, autoFlagged };
}

export async function countPendingReportsForUser(reportedUserId) {
  await ensureProfileReportTables();

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM public.profile_reports
      WHERE reported_user_id = $1
        AND status IN ('PENDING', 'UNDER_REVIEW')
    `,
    [reportedUserId],
  );

  return result.rows[0]?.count || 0;
}

export async function listReports({ status } = {}) {
  await ensureProfileReportTables();
  await ensureUserActivityColumns();

  const params = [];
  let where = "";
  if (status) {
    params.push(status);
    where = `WHERE pr.status = $1`;
  }

  const { rows } = await pool.query(
    `
      SELECT pr.id, pr.reason, pr.status, pr.created_at,
             pr.reported_user_id,
             ru.email AS reported_email,
             ru.full_name AS reported_name,
             ru.user_type AS reported_user_type,
             ru.fraud_flagged,
             ru.account_locked_until,
             ru.deleted_at,
             rp.email AS reporter_email
      FROM public.profile_reports pr
      JOIN public.users ru ON ru.id = pr.reported_user_id
      JOIN public.users rp ON rp.id = pr.reporter_user_id
      ${where}
      ORDER BY pr.created_at DESC
    `,
    params,
  );
  return rows;
}

export async function getReportById(id) {
  await ensureProfileReportTables();
  const { rows } = await pool.query(
    `SELECT * FROM public.profile_reports WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function resolveReportsForUser({ userId, status, reviewedBy }) {
  await ensureProfileReportTables();
  const { rowCount } = await pool.query(
    `
      UPDATE public.profile_reports
      SET status = $2, reviewed_at = CURRENT_TIMESTAMP
      WHERE reported_user_id = $1 AND status IN ('PENDING', 'UNDER_REVIEW')
    `,
    [userId, status],
  );
  // reviewedBy is recorded in the admin action log by the controller.
  void reviewedBy;
  return rowCount;
}

export async function dismissReport({ id, reviewedBy }) {
  await ensureProfileReportTables();
  const { rows } = await pool.query(
    `
      UPDATE public.profile_reports
      SET status = 'DISMISSED', reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [id],
  );
  // reviewedBy is recorded in the admin action log by the controller.
  void reviewedBy;
  const report = rows[0];
  if (!report) return undefined;

  // If no open reports remain, clear the auto-flag only. An admin suspension
  // (account_locked_until) is deliberate and must persist — lifting it requires
  // the explicit Reactivate action.
  const remaining = await countPendingReportsForUser(report.reported_user_id);
  if (remaining === 0) {
    await pool.query(
      `
        UPDATE public.users
        SET fraud_flagged = FALSE
        WHERE id = $1 AND deleted_at IS NULL
      `,
      [report.reported_user_id],
    );
  }
  return report;
}

export async function suspendUser(userId, days) {
  await ensureUserActivityColumns();
  const safeDays = Math.max(1, Math.min(365, Number(days) || 7));
  const { rows } = await pool.query(
    `
      UPDATE public.users
      SET fraud_flagged = TRUE,
          account_locked_until = CURRENT_TIMESTAMP + ($2::int * INTERVAL '1 day')
      WHERE id = $1
      RETURNING id, account_locked_until, deleted_at, fraud_flagged
    `,
    [userId, safeDays],
  );
  return rows[0];
}

export async function deactivateUser(userId) {
  await ensureUserActivityColumns();
  const { rows } = await pool.query(
    `
      UPDATE public.users
      SET deleted_at = CURRENT_TIMESTAMP, fraud_flagged = TRUE
      WHERE id = $1
      RETURNING id, account_locked_until, deleted_at, fraud_flagged
    `,
    [userId],
  );
  return rows[0];
}

export async function reactivateUser(userId) {
  await ensureUserActivityColumns();
  const { rows } = await pool.query(
    `
      UPDATE public.users
      SET deleted_at = NULL, account_locked_until = NULL, fraud_flagged = FALSE
      WHERE id = $1
      RETURNING id, account_locked_until, deleted_at, fraud_flagged
    `,
    [userId],
  );
  return rows[0];
}
