import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import pool from "../config/database.js";
import {
  listReports,
  suspendUser,
  deactivateUser,
  reactivateUser,
  createProfileReport,
  dismissReport,
} from "../repositories/ProfileReportRepository.js";

async function makeUser(type = "investor") {
  const email = `pr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@test.com`;
  const hash = await bcrypt.hash("Password123!", 10);
  const { rows } = await pool.query(
    `INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
     VALUES ($1, $2, 'PR Test', $3, true) RETURNING id`,
    [email, hash, type],
  );
  return rows[0].id;
}

test("suspend / reactivate toggles account_locked_until and deleted_at", async () => {
  const uid = await makeUser();
  try {
    const suspended = await suspendUser(uid, 7);
    assert.ok(suspended.account_locked_until, "should be locked");

    const deactivated = await deactivateUser(uid);
    assert.ok(deactivated.deleted_at, "should be deactivated");

    const restored = await reactivateUser(uid);
    assert.equal(restored.account_locked_until, null);
    assert.equal(restored.deleted_at, null);
    assert.equal(restored.fraud_flagged, false);
  } finally {
    await pool.query(`DELETE FROM public.users WHERE id = $1`, [uid]).catch(() => {});
  }
});

test("listReports returns rows with reported user details", async () => {
  const reporter = await makeUser();
  const reported = await makeUser("startup");
  try {
    await pool.query(
      `INSERT INTO public.profile_reports (reporter_user_id, reported_user_id, reason)
       VALUES ($1, $2, 'Looks fraudulent, fake company details')`,
      [reporter, reported],
    );
    const rows = await listReports({});
    const mine = rows.find((r) => r.reported_user_id === reported);
    assert.ok(mine, "report should be listed");
    assert.equal(mine.reported_user_type, "startup");
    assert.ok(mine.reported_email);
  } finally {
    await pool.query(`DELETE FROM public.users WHERE id = ANY($1)`, [[reporter, reported]]).catch(() => {});
  }
});

test("dismissReport clears fraud flag/lock only after the last open report is dismissed", async () => {
  const reporterA = await makeUser();
  const reporterB = await makeUser();
  const reporterC = await makeUser();
  const reported = await makeUser("startup");
  try {
    // Three reports trip the auto-flag threshold (fraud_flagged + account_locked_until).
    const r1 = await createProfileReport({
      reporterUserId: reporterA,
      reportedUserId: reported,
      reason: "Fake company details, looks fraudulent",
    });
    const r2 = await createProfileReport({
      reporterUserId: reporterB,
      reportedUserId: reported,
      reason: "Suspicious activity, possible scam",
    });
    const r3 = await createProfileReport({
      reporterUserId: reporterC,
      reportedUserId: reported,
      reason: "Impersonating a real startup",
    });

    const flagged = await pool.query(
      `SELECT fraud_flagged, account_locked_until FROM public.users WHERE id = $1`,
      [reported],
    );
    assert.equal(flagged.rows[0].fraud_flagged, true, "should be auto-flagged");
    assert.ok(flagged.rows[0].account_locked_until, "should be auto-locked");

    // Dismiss the first two: open reports remain, so flag/lock stay in place.
    await dismissReport({ id: r1.report.id });
    await dismissReport({ id: r2.report.id });

    const stillFlagged = await pool.query(
      `SELECT fraud_flagged, account_locked_until FROM public.users WHERE id = $1`,
      [reported],
    );
    assert.equal(stillFlagged.rows[0].fraud_flagged, true, "still flagged with open reports");
    assert.ok(stillFlagged.rows[0].account_locked_until, "still locked with open reports");

    // Dismiss the last open report: flag/lock should be cleared.
    await dismissReport({ id: r3.report.id });

    const cleared = await pool.query(
      `SELECT fraud_flagged, account_locked_until FROM public.users WHERE id = $1`,
      [reported],
    );
    assert.equal(cleared.rows[0].fraud_flagged, false, "flag cleared after last dismissal");
    assert.equal(cleared.rows[0].account_locked_until, null, "lock cleared after last dismissal");
  } finally {
    await pool
      .query(`DELETE FROM public.users WHERE id = ANY($1)`, [
        [reporterA, reporterB, reporterC, reported],
      ])
      .catch(() => {});
  }
});
