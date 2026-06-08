// Async notification queue (in-app + email) — Task T1.5
//
// Problem this solves: today, sending a notification email happens inline in the
// request handler, so a slow SMTP call blocks the user's request; and there is
// no stored notification feed for V2 events (deck uploaded, round closing, etc.).
//
// Design (Postgres-backed queue + in-process worker):
//   - enqueueNotification(...) INSERTs ONE row into `notifications` and returns
//     immediately. The request never waits for email. The row is both the stored
//     in-app feed entry AND the email work item.
//   - startNotificationWorker() runs a setInterval loop that claims due, pending
//     email rows, sends them via nodemailer (respecting the suppression list and
//     the user's notification preferences), and marks them sent/failed with
//     exponential backoff retry.
//   - Suppression list (email_suppression) handles unsubscribe; a bounce hook is
//     stubbed for if a bounce-capable provider is ever added.
//
// No new infrastructure (no Redis): the queue is a table, the worker is a timer.

import nodemailer from "nodemailer";
import pool from "../config/database.js";
import { shouldSendEmailNotification } from "./notificationDelivery.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const MAX_ATTEMPTS = 5;
const WORKER_INTERVAL_MS = Number(process.env.NOTIFY_WORKER_INTERVAL_MS || 15_000);
const BATCH_SIZE = Number(process.env.NOTIFY_WORKER_BATCH || 10);

// ---------------------------------------------------------------------------
// Enqueue — called from request handlers. Returns fast; never blocks on SMTP.
// ---------------------------------------------------------------------------

/**
 * Enqueue a notification. INSERTs a row (in-app feed + email queue item) and
 * returns immediately. Email is delivered later by the worker.
 *
 * @param {Object} n
 *   @param {string}  n.userId   required — recipient
 *   @param {string}  n.type     required — e.g. 'connection_request'
 *   @param {string}  n.title    required — short headline
 *   @param {string} [n.body]    longer text
 *   @param {Object} [n.data]    arbitrary JSON payload (ids, etc.)
 *   @param {string} [n.link]    in-app deep link
 *   @param {boolean}[n.email=true] whether to also send an email
 * @returns {Promise<string|null>} the new notification id (or null on failure)
 */
export async function enqueueNotification(n = {}) {
  const { userId, type, title, body = null, data = null, link = null, email = true } = n;
  if (!userId || !type || !title) {
    console.error("enqueueNotification: missing userId/type/title");
    return null;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO public.notifications
         (user_id, type, title, body, data, link, email_enabled, email_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        type,
        title,
        body,
        data ? JSON.stringify(data) : null,
        link,
        email,
        email ? "pending" : "skipped",
      ],
    );
    return rows[0]?.id ?? null;
  } catch (error) {
    // A notification failure must never break the originating action.
    console.error("enqueueNotification failed:", error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Suppression (unsubscribe / bounce)
// ---------------------------------------------------------------------------

export async function suppressEmail(email, reason = "unsubscribed") {
  if (!email) return;
  try {
    await pool.query(
      `INSERT INTO public.email_suppression (email, reason)
       VALUES (LOWER($1), $2)
       ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason`,
      [email, reason],
    );
  } catch (error) {
    console.error("suppressEmail failed:", error.message);
  }
}

export async function isSuppressed(email) {
  if (!email) return false;
  try {
    const { rows } = await pool.query(
      "SELECT 1 FROM public.email_suppression WHERE email = LOWER($1)",
      [email],
    );
    return rows.length > 0;
  } catch (error) {
    console.error("isSuppressed check failed:", error.message);
    return false; // fail-open: don't silently drop all email if the table is down
  }
}

// ---------------------------------------------------------------------------
// Worker — claims due pending rows and delivers email with retry backoff.
// ---------------------------------------------------------------------------

const FROM = () => `"StartHub Capital" <${process.env.EMAIL_USER}>`;
const backoffMinutes = (attempt) => Math.min(60, 2 ** attempt); // 2,4,8,16,32,60

function buildUnsubscribeFooter(email) {
  const base = process.env.BASE_URL || "";
  const url = `${base}/api/notifications/unsubscribe?email=${encodeURIComponent(email)}`;
  return `<hr/><p style="font-size:12px;color:#888">
    Don't want these emails? <a href="${url}">Unsubscribe</a>.</p>`;
}

async function deliverOne(row) {
  // Look up recipient + their email preference for this type.
  const userRes = await pool.query(
    "SELECT email, full_name FROM users WHERE id = $1",
    [row.user_id],
  );
  const user = userRes.rows[0];
  if (!user?.email) {
    return markSkipped(row.id, "recipient has no email");
  }

  if (await isSuppressed(user.email)) {
    return markSkipped(row.id, "address suppressed");
  }

  // Respect per-user email preferences (reuses existing settings logic).
  const allowed = await shouldSendEmailNotification(row.user_id, row.type).catch(
    () => true,
  );
  if (!allowed) {
    return markSkipped(row.id, "user disabled email for this type");
  }

  const html = `
    <h2>${escapeHtml(row.title)}</h2>
    ${row.body ? `<p>${escapeHtml(row.body)}</p>` : ""}
    ${row.link ? `<p><a href="${(process.env.BASE_URL || "") + row.link}">View in StartHub</a></p>` : ""}
    ${buildUnsubscribeFooter(user.email)}
  `;

  await transporter.sendMail({
    from: FROM(),
    to: user.email,
    subject: row.title,
    html,
  });

  await pool.query(
    `UPDATE public.notifications
       SET email_status = 'sent', email_sent_at = NOW(), email_attempts = email_attempts + 1
     WHERE id = $1`,
    [row.id],
  );
}

async function markSkipped(id, reason) {
  await pool.query(
    `UPDATE public.notifications
       SET email_status = 'skipped', email_last_error = $2,
           email_attempts = email_attempts + 1
     WHERE id = $1`,
    [id, reason],
  );
}

async function markFailure(row, error) {
  const attempts = row.email_attempts + 1;
  const giveUp = attempts >= MAX_ATTEMPTS;
  await pool.query(
    `UPDATE public.notifications
       SET email_status = $2,
           email_attempts = $3,
           email_last_error = $4,
           next_attempt_at = NOW() + ($5 || ' minutes')::interval
     WHERE id = $1`,
    [
      row.id,
      giveUp ? "failed" : "pending",
      attempts,
      String(error).slice(0, 500),
      giveUp ? 0 : backoffMinutes(attempts),
    ],
  );
}

let processing = false;

async function processBatch() {
  if (processing) return; // never overlap ticks
  processing = true;
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, type, title, body, link, email_attempts
         FROM public.notifications
        WHERE email_enabled = true
          AND email_status = 'pending'
          AND next_attempt_at <= NOW()
        ORDER BY next_attempt_at ASC
        LIMIT $1`,
      [BATCH_SIZE],
    );

    for (const row of rows) {
      try {
        await deliverOne(row);
      } catch (error) {
        console.error(`notification ${row.id} email failed:`, error.message);
        await markFailure(row, error.message).catch(() => {});
      }
    }
  } catch (error) {
    // Table missing or DB hiccup — log once per tick, keep the worker alive.
    if (error.code === "42P01") {
      console.warn("notifications table not found — run the T1.5 migration.");
    } else {
      console.error("notification worker batch error:", error.message);
    }
  } finally {
    processing = false;
  }
}

let workerTimer = null;

/** Start the in-process worker. Call once from server boot. Idempotent. */
export function startNotificationWorker() {
  if (workerTimer) return workerTimer;
  workerTimer = setInterval(() => {
    processBatch().catch((e) => console.error("worker tick error:", e.message));
  }, WORKER_INTERVAL_MS);
  // Don't keep the process alive solely for this timer.
  if (workerTimer.unref) workerTimer.unref();
  console.log(`📨 Notification worker started (every ${WORKER_INTERVAL_MS}ms).`);
  return workerTimer;
}

/** Stop the worker (tests / graceful shutdown). */
export function stopNotificationWorker() {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
