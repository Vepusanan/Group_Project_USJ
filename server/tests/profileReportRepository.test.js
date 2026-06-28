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
