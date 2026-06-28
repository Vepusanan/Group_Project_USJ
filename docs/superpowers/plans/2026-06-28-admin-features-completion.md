# Admin Features Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-side fraud-report management (view reports, suspend/deactivate/dismiss/reactivate) and set up a proper admin account (real `admin` user_type that skips onboarding), without breaking existing functionality.

**Architecture:** Backend follows the existing repository → controller → route layering; new endpoints mount on the already-protected `/api/admin` router (`protect` + `requireAdmin`). Login-blocking for suspended/deactivated users is already enforced by `middleware/auth.js`, so moderation actions only set DB columns (`account_locked_until`, `deleted_at`, `fraud_flagged`). Frontend adds one lazy-loaded admin page + service, matching `AdminAnalyticsPage`/`adminAnalyticsService`. Admin authority stays email-based (`ADMIN_EMAILS`); `user_type='admin'` is a routing label only.

**Tech Stack:** Express 5 (ESM), pg Pool, Node test runner (`node:test`), React 18 + react-router-dom 6, axios via shared `apiClient`, Tailwind.

## Global Constraints

- Admin authority is `isAdminUser()` (email in `ADMIN_EMAILS`) — NEVER grant admin power from `user_type` alone.
- Do not rewrite type-branching in non-admin controllers; only touch routing entry points an admin traverses.
- Repositories use the existing pattern: `import pool from "../config/database.js"`, lazy `ensure*Tables` promise, named exports.
- All admin endpoints sit behind the existing `router.use(protect, requireAdmin)` in `routes/admin.js`.
- Every admin moderation action writes an audit row via `logAdminAction(...)`.
- Tests use `node:test` + `node --test`; harness pattern from `server/tests/adminRbac.test.js`.
- Client services return `{ success, data }` or `{ success: false, error }`.
- Run `npm run build` in `client/` before final commit; it must pass.

---

### Task 1: Database migration — `admin` user_type + admin account setup

**Files:**
- Create: `supabase/migrations/20260628_add_admin_user_type.sql`

**Interfaces:**
- Produces: `users.user_type` CHECK now allows `'admin'`; admin row has `user_type='admin'`, `onboarding_completed_at` set, `email_verified=true`.

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260628_add_admin_user_type.sql`:

```sql
-- Widen user_type to allow 'admin'. users.user_type is VARCHAR(20) + CHECK
-- (separate from user_type_enum which is only used by refined profile tables).
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('startup', 'investor', 'admin'));

-- Promote the admin account: real admin type, skip onboarding, ensure verified.
UPDATE public.users
  SET user_type = 'admin',
      onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
      email_verified = TRUE
  WHERE LOWER(email) = LOWER('vepu2003nanthan@gmail.com');
```

- [ ] **Step 2: Apply the migration on Supabase**

Run the SQL in the Supabase SQL editor (or `psql`). Expected: `ALTER TABLE` ×2, `UPDATE 1`.

- [ ] **Step 3: Verify**

Run in Supabase SQL editor:
```sql
SELECT email, user_type, onboarding_completed_at, email_verified
FROM public.users WHERE LOWER(email) = LOWER('vepu2003nanthan@gmail.com');
```
Expected: one row, `user_type = admin`, `onboarding_completed_at` non-null, `email_verified = true`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260628_add_admin_user_type.sql
git commit -m "feat(db): allow admin user_type and promote admin account"
```

---

### Task 2: Route admin user to the admin dashboard

**Files:**
- Modify: `client/src/utils/roleUtils.js`
- Test: `client/src/utils/roleUtils.test.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `getRoleHomePath('admin') === '/admin/analytics'`; existing startup/investor results unchanged.

- [ ] **Step 1: Write the failing test**

Create `client/src/utils/roleUtils.test.js`:

```js
import { describe, it, expect } from "vitest";
import { getRoleHomePath } from "./roleUtils";

describe("getRoleHomePath", () => {
  it("sends admins to the admin dashboard", () => {
    expect(getRoleHomePath("admin")).toBe("/admin/analytics");
  });
  it("sends investors to startups discovery", () => {
    expect(getRoleHomePath("investor")).toBe("/startups");
  });
  it("sends startups (and unknown) to investors discovery", () => {
    expect(getRoleHomePath("startup")).toBe("/investors");
    expect(getRoleHomePath(undefined)).toBe("/investors");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/utils/roleUtils.test.js`
Expected: FAIL — `getRoleHomePath("admin")` returns `/investors`, not `/admin/analytics`.

(If vitest is not configured, skip the test file and instead verify manually in Step 4 by logging in as admin; note this in the commit. Check `client/package.json` for a `test` script first.)

- [ ] **Step 3: Implement**

Edit `client/src/utils/roleUtils.js`:

```js
export const getRoleHomePath = (userType) => {
  if (userType === "admin") return "/admin/analytics";
  return userType === "investor" ? "/startups" : "/investors";
};

export const onboardingPathFor = (userType) =>
  userType === "investor" ? "/investor-onboarding" : "/onboarding";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/utils/roleUtils.test.js`
Expected: PASS (all 3).

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/roleUtils.js client/src/utils/roleUtils.test.js
git commit -m "feat(client): route admin user_type to /admin/analytics"
```

---

### Task 3: Repository — fraud-report listing & moderation queries

**Files:**
- Modify: `server/repositories/ProfileReportRepository.js`
- Test: `server/tests/profileReportRepository.test.js` (create)

**Interfaces:**
- Consumes: existing `ensureProfileReportTables()`, `pool`.
- Produces (named exports):
  - `listReports({ status }) -> Promise<Array<{ id, reason, status, created_at, reported_user_id, reported_email, reported_name, reported_user_type, fraud_flagged, account_locked_until, deleted_at, reporter_email }>>`
  - `getReportById(id) -> Promise<row | undefined>`
  - `resolveReportsForUser({ userId, status, reviewedBy }) -> Promise<number>` (rows updated)
  - `dismissReport({ id, reviewedBy }) -> Promise<row | undefined>`
  - `suspendUser(userId, days) -> Promise<row>`
  - `deactivateUser(userId) -> Promise<row>`
  - `reactivateUser(userId) -> Promise<row>`

- [ ] **Step 1: Write the failing test**

Create `server/tests/profileReportRepository.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && node --test tests/profileReportRepository.test.js`
Expected: FAIL — `listReports`/`suspendUser`/etc. are not exported.

- [ ] **Step 3: Implement**

Append to `server/repositories/ProfileReportRepository.js` (keep existing exports):

```js
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

export async function dismissReport({ id }) {
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
  const report = rows[0];
  if (!report) return undefined;

  // If no open reports remain for that user, clear the auto-flag + auto-lock.
  const remaining = await countPendingReportsForUser(report.reported_user_id);
  if (remaining === 0) {
    await pool.query(
      `
        UPDATE public.users
        SET fraud_flagged = FALSE,
            account_locked_until = NULL
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && node --test tests/profileReportRepository.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add server/repositories/ProfileReportRepository.js server/tests/profileReportRepository.test.js
git commit -m "feat(server): fraud-report listing and moderation queries"
```

---

### Task 4: Controller + routes — admin fraud endpoints

**Files:**
- Create: `server/controllers/adminFraudController.js`
- Modify: `server/routes/admin.js`
- Test: `server/tests/adminFraud.test.js` (create)

**Interfaces:**
- Consumes: Task 3 exports; `logAdminAction` from `AdminActionLogRepository`; `getClientIp` from `UserActivityRepository`.
- Produces (controller named exports): `listFraudReports`, `dismissFraudReport`, `suspendUserAccount`, `deactivateUserAccount`, `reactivateUserAccount`. Routes:
  - `GET    /api/admin/reports?status=`
  - `POST   /api/admin/reports/:id/dismiss`
  - `POST   /api/admin/users/:userId/suspend`     `{ days, reason }`
  - `POST   /api/admin/users/:userId/deactivate`  `{ reason }`
  - `POST   /api/admin/users/:userId/reactivate`

- [ ] **Step 1: Write the failing test**

Create `server/tests/adminFraud.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { createApp } from "../app.js";

function token({ id, email, user_type }) {
  return jwt.sign({ userId: id, email, userType: user_type }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}
async function startServer() {
  const server = http.createServer(createApp());
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}
async function makeUser(type = "investor") {
  const email = `af_${Date.now()}_${crypto.randomBytes(4).toString("hex")}@test.com`;
  const hash = await bcrypt.hash("Password123!", 10);
  const { rows } = await pool.query(
    `INSERT INTO public.users (email, password_hash, full_name, user_type, email_verified)
     VALUES ($1,$2,'AF Test',$3,true) RETURNING id, email, user_type`,
    [email, hash, type],
  );
  return rows[0];
}

test("admin can list reports and suspend a user; non-admin is 403", async () => {
  assert.ok(process.env.JWT_SECRET);
  const admin = await makeUser();
  const reporter = await makeUser();
  const reported = await makeUser("startup");
  await pool.query(
    `INSERT INTO public.profile_reports (reporter_user_id, reported_user_id, reason)
     VALUES ($1,$2,'Fake company, fraudulent pitch deck')`,
    [reporter.id, reported.id],
  );
  const prev = process.env.ADMIN_EMAILS;
  const srv = await startServer();
  try {
    // non-admin
    process.env.ADMIN_EMAILS = "";
    let res = await fetch(`${srv.baseUrl}/api/admin/reports`, {
      headers: { Cookie: `access_token=${token(reporter)}` },
    });
    assert.equal(res.status, 403);

    // admin lists + suspends
    process.env.ADMIN_EMAILS = admin.email;
    res = await fetch(`${srv.baseUrl}/api/admin/reports`, {
      headers: { Cookie: `access_token=${token(admin)}` },
    });
    assert.equal(res.status, 200);
    const list = await res.json();
    assert.ok(list.data.some((r) => r.reported_user_id === reported.id));

    res = await fetch(`${srv.baseUrl}/api/admin/users/${reported.id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `access_token=${token(admin)}` },
      body: JSON.stringify({ days: 7, reason: "Confirmed fraud" }),
    });
    assert.equal(res.status, 200, JSON.stringify(await res.json().catch(() => null)));

    const { rows } = await pool.query(`SELECT account_locked_until FROM public.users WHERE id=$1`, [reported.id]);
    assert.ok(rows[0].account_locked_until);
  } finally {
    process.env.ADMIN_EMAILS = prev;
    await srv.close();
    await pool.query(`DELETE FROM public.users WHERE id = ANY($1)`, [[admin.id, reporter.id, reported.id]]).catch(() => {});
  }
});

test("admin cannot suspend their own account", async () => {
  const admin = await makeUser();
  const prev = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = admin.email;
  const srv = await startServer();
  try {
    const res = await fetch(`${srv.baseUrl}/api/admin/users/${admin.id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `access_token=${token(admin)}` },
      body: JSON.stringify({ days: 7, reason: "x" }),
    });
    assert.equal(res.status, 400);
  } finally {
    process.env.ADMIN_EMAILS = prev;
    await srv.close();
    await pool.query(`DELETE FROM public.users WHERE id=$1`, [admin.id]).catch(() => {});
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && node --test tests/adminFraud.test.js`
Expected: FAIL — `/api/admin/reports` returns 404 (routes not mounted).

- [ ] **Step 3: Implement the controller**

Create `server/controllers/adminFraudController.js`:

```js
import {
  listReports,
  getReportById,
  dismissReport,
  resolveReportsForUser,
  suspendUser,
  deactivateUser,
  reactivateUser,
} from "../repositories/ProfileReportRepository.js";
import { getUserById } from "../repositories/ConnectionRepository.js";
import { logAdminAction } from "../repositories/AdminActionLogRepository.js";
import { getClientIp } from "../repositories/UserActivityRepository.js";

export const listFraudReports = async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const reports = await listReports({ status });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

export const dismissFraudReport = async (req, res, next) => {
  try {
    const existing = await getReportById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    const report = await dismissReport({ id: req.params.id });
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "fraud_report_dismissed",
      targetType: "profile_report",
      targetId: req.params.id,
      metadata: { reported_user_id: existing.reported_user_id },
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const ensureTargetUser = async (req, res) => {
  const userId = req.params.userId;
  if (String(userId) === String(req.user.id)) {
    res.status(400).json({ success: false, error: "You cannot moderate your own account" });
    return null;
  }
  const target = await getUserById(userId);
  if (!target) {
    res.status(404).json({ success: false, error: "User not found" });
    return null;
  }
  return userId;
};

export const suspendUserAccount = async (req, res, next) => {
  try {
    const userId = await ensureTargetUser(req, res);
    if (!userId) return;
    const days = Number(req.body.days);
    if (!Number.isFinite(days) || days < 1) {
      return res.status(400).json({ success: false, error: "Provide a suspension length in days (>= 1)" });
    }
    const reason = String(req.body.reason || "").trim();
    const result = await suspendUser(userId, days);
    await resolveReportsForUser({ userId, status: "RESOLVED", reviewedBy: req.user.id });
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "user_suspended",
      targetType: "user",
      targetId: userId,
      metadata: { days, reason },
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deactivateUserAccount = async (req, res, next) => {
  try {
    const userId = await ensureTargetUser(req, res);
    if (!userId) return;
    const reason = String(req.body.reason || "").trim();
    const result = await deactivateUser(userId);
    await resolveReportsForUser({ userId, status: "RESOLVED", reviewedBy: req.user.id });
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "user_deactivated",
      targetType: "user",
      targetId: userId,
      metadata: { reason },
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const reactivateUserAccount = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const target = await getUserById(userId);
    if (!target) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const result = await reactivateUser(userId);
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "user_reactivated",
      targetType: "user",
      targetId: userId,
      metadata: {},
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

- [ ] **Step 4: Wire the routes**

Edit `server/routes/admin.js` — add imports and routes (keep existing):

```js
import {
  listFraudReports,
  dismissFraudReport,
  suspendUserAccount,
  deactivateUserAccount,
  reactivateUserAccount,
} from "../controllers/adminFraudController.js";

// ...after the existing verification routes:
router.get("/reports", listFraudReports);
router.post("/reports/:id/dismiss", dismissFraudReport);
router.post("/users/:userId/suspend", suspendUserAccount);
router.post("/users/:userId/deactivate", deactivateUserAccount);
router.post("/users/:userId/reactivate", reactivateUserAccount);
```

- [ ] **Step 5: Verify `getUserById` and `getClientIp` exist with expected signatures**

Run: `cd server && grep -n "export.*getUserById" repositories/ConnectionRepository.js && grep -n "export.*getClientIp" repositories/UserActivityRepository.js`
Expected: both found. If `getUserById` is not exported there, find the correct user-fetch helper (`grep -rn "FROM public.users WHERE id" repositories/`) and use it instead.

- [ ] **Step 6: Run test to verify it passes**

Run: `cd server && node --test tests/adminFraud.test.js`
Expected: PASS (2 tests).

- [ ] **Step 7: Run the full admin test suite (no regressions)**

Run: `cd server && node --test tests/adminRbac.test.js tests/adminFraud.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add server/controllers/adminFraudController.js server/routes/admin.js server/tests/adminFraud.test.js
git commit -m "feat(server): admin fraud-report management endpoints"
```

---

### Task 5: Frontend service — admin fraud API

**Files:**
- Create: `client/src/services/adminFraudService.js`

**Interfaces:**
- Consumes: shared `apiClient` (default export `api`).
- Produces: `adminFraudService.listReports(status?)`, `.dismiss(reportId)`, `.suspend(userId, { days, reason })`, `.deactivate(userId, { reason })`, `.reactivate(userId)` — each returns `{ success, data }` or `{ success: false, error }`.

- [ ] **Step 1: Implement the service**

Create `client/src/services/adminFraudService.js`:

```js
import api from "./apiClient";

const wrap = async (promise, fallback) => {
  try {
    const response = await promise;
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || fallback };
  }
};

export const adminFraudService = {
  listReports: (status) =>
    wrap(
      api.get("/admin/reports", { params: status ? { status } : {} }),
      "Failed to load reports",
    ),
  dismiss: (reportId) =>
    wrap(api.post(`/admin/reports/${reportId}/dismiss`), "Failed to dismiss report"),
  suspend: (userId, { days, reason }) =>
    wrap(api.post(`/admin/users/${userId}/suspend`, { days, reason }), "Failed to suspend user"),
  deactivate: (userId, { reason }) =>
    wrap(api.post(`/admin/users/${userId}/deactivate`, { reason }), "Failed to deactivate user"),
  reactivate: (userId) =>
    wrap(api.post(`/admin/users/${userId}/reactivate`), "Failed to reactivate user"),
};
```

- [ ] **Step 2: Verify apiClient default export name**

Run: `cd client && grep -n "export default" src/services/apiClient.js`
Expected: a default export (used as `api`). If it differs, adjust the import.

- [ ] **Step 3: Commit**

```bash
git add client/src/services/adminFraudService.js
git commit -m "feat(client): admin fraud-report service"
```

---

### Task 6: Frontend page + route — Admin fraud reports

**Files:**
- Create: `client/src/pages/AdminFraudReportsPage.jsx`
- Modify: `client/src/routes/lazyPages.js`
- Modify: `client/src/App.jsx`
- Modify: `client/src/pages/AdminAnalyticsPage.jsx` (add cross-link)

**Interfaces:**
- Consumes: `adminFraudService` (Task 5), `AdminRoute`, `PageLayout`, `SectionCard`.
- Produces: route `/admin/reports` (admin-guarded); lazy export `AdminFraudReportsPage`.

- [ ] **Step 1: Implement the page**

Create `client/src/pages/AdminFraudReportsPage.jsx`:

```jsx
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Ban, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { adminFraudService } from "../services/adminFraudService";

const StatusBadge = ({ row }) => {
  if (row.deleted_at)
    return <span className="text-xs font-medium text-error">Deactivated</span>;
  if (row.account_locked_until && new Date(row.account_locked_until) > new Date())
    return <span className="text-xs font-medium text-warning">Suspended</span>;
  if (row.fraud_flagged)
    return <span className="text-xs font-medium text-warning">Flagged</span>;
  return <span className="text-xs font-medium text-success">Active</span>;
};

const AdminFraudReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await adminFraudService.listReports();
    if (!result.success) {
      setError(result.error);
      setReports([]);
    } else {
      setReports(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (key, fn) => {
    setBusyId(key);
    const result = await fn();
    setBusyId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const onSuspend = (row) => {
    const days = Number(window.prompt("Suspend for how many days?", "7"));
    if (!days || days < 1) return;
    const reason = window.prompt("Reason (optional):", "") || "";
    act(`s-${row.id}`, () =>
      adminFraudService.suspend(row.reported_user_id, { days, reason }),
    );
  };
  const onDeactivate = (row) => {
    if (!window.confirm(`Permanently deactivate ${row.reported_email}?`)) return;
    const reason = window.prompt("Reason (optional):", "") || "";
    act(`d-${row.id}`, () =>
      adminFraudService.deactivate(row.reported_user_id, { reason }),
    );
  };
  const onDismiss = (row) =>
    act(`x-${row.id}`, () => adminFraudService.dismiss(row.id));
  const onReactivate = (row) =>
    act(`r-${row.id}`, () => adminFraudService.reactivate(row.reported_user_id));

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-sm font-medium">Trust &amp; safety</span>
            </div>
            <h1 className="text-3xl font-bold text-content">Fraud Reports</h1>
            <p className="text-content-secondary text-sm mt-1">
              Review reported profiles and take moderation action.
            </p>
          </div>
          <Link to="/admin/analytics" className="text-sm text-primary hover:underline">
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-error text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center text-content-secondary">
            No reports to review.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((row) => {
              const suspended =
                row.account_locked_until &&
                new Date(row.account_locked_until) > new Date();
              const disabled = busyId !== null;
              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-line bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-content">
                          {row.reported_name || row.reported_email}
                        </p>
                        <span className="text-xs text-content-muted">
                          ({row.reported_user_type})
                        </span>
                        <StatusBadge row={row} />
                      </div>
                      <p className="text-sm text-content-secondary mt-1">{row.reason}</p>
                      <p className="text-xs text-content-muted mt-1">
                        Reported by {row.reporter_email} ·{" "}
                        {new Date(row.created_at).toLocaleString()} · {row.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(suspended || row.deleted_at) ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onReactivate(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-alt disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" /> Reactivate
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSuspend(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-warning/40 px-3 py-1.5 text-sm font-medium text-warning hover:bg-warning/10 disabled:opacity-50"
                          >
                            <Clock className="w-4 h-4" /> Suspend
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onDeactivate(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-50"
                          >
                            <Ban className="w-4 h-4" /> Deactivate
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onDismiss(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-surface-alt disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminFraudReportsPage;
```

- [ ] **Step 2: Add the lazy export**

Edit `client/src/routes/lazyPages.js` — after the `AdminVerificationPage` line:

```js
export const AdminFraudReportsPage = lazyWithRetry(() => import("../pages/AdminFraudReportsPage"));
```

- [ ] **Step 3: Add the route**

Edit `client/src/App.jsx`:
1. Add `AdminFraudReportsPage` to the import block that includes `AdminAnalyticsPage, AdminVerificationPage`.
2. After the `/admin/verification` route, add:

```jsx
<Route
  path="/admin/reports"
  element={
    <AdminRoute>
      <AdminFraudReportsPage />
    </AdminRoute>
  }
/>
```

- [ ] **Step 4: Add cross-link from the analytics dashboard**

Edit `client/src/pages/AdminAnalyticsPage.jsx` — replace the single `Verification queue →` Link with two links:

```jsx
<div className="flex items-center gap-4">
  <Link to="/admin/verification" className="text-sm text-primary hover:underline">
    Verification queue →
  </Link>
  <Link to="/admin/reports" className="text-sm text-primary hover:underline">
    Fraud reports →
  </Link>
</div>
```

- [ ] **Step 5: Build**

Run: `cd client && npm run build`
Expected: build succeeds, no unresolved imports.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/AdminFraudReportsPage.jsx client/src/routes/lazyPages.js client/src/App.jsx client/src/pages/AdminAnalyticsPage.jsx
git commit -m "feat(client): admin fraud-reports page and route"
```

---

### Task 7: Manual end-to-end verification + CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md` (Endpoint Map + Known Project Quirks + Last Updated)

- [ ] **Step 1: Manual E2E**

With backend + frontend running:
1. As a normal user, report another profile 3× (different reporter accounts) → 3rd response says account flagged.
2. Log in as admin (`vepu2003nanthan@gmail.com` / `admin12345`) → you land on `/admin/analytics` (not `/investors`), no onboarding prompt.
3. Go to `/admin/reports` → the reported user appears.
4. Suspend 7 days → status shows "Suspended"; the suspended user is blocked at login with the locked-account message.
5. Reactivate → suspended user can log in again.
6. Dismiss a different report → it leaves the open list.

- [ ] **Step 2: Update CLAUDE.md**

Add the new admin endpoints under the Endpoint Map (`GET /api/admin/reports`, `POST /api/admin/reports/:id/dismiss`, `POST /api/admin/users/:userId/{suspend,deactivate,reactivate}`); add a Known Project Quirk noting `admin` is now a valid `user_type` (authority still email-based via `ADMIN_EMAILS`) and the admin account skips onboarding via `onboarding_completed_at`; add a Last Updated entry dated 2026-06-28.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document admin fraud endpoints and admin user_type"
```

---

## Self-Review

**Spec coverage:**
- §1 Admin account setup → Task 1 (SQL) + Task 2 (routing). ✓
- §2 admin user_type safely → Task 1 (constraint) + Task 2 (`getRoleHomePath`); authority stays email-based (unchanged). ✓
- §3 repository queries → Task 3. ✓
- §3 controller + routes → Task 4. ✓
- §3 frontend service → Task 5; page + route + cross-link → Task 6. ✓
- Error handling (401/403 via middleware, 404, 400, self-action guard) → Task 4 controller. ✓
- Testing (RBAC 403, repo logic, E2E) → Tasks 3, 4, 7. ✓
- Out-of-scope items (emails, controller rewrites, verification/analytics changes) → not present. ✓

**Placeholder scan:** No TBD/TODO; all code blocks complete; tests have real assertions. Tasks 4 Step 5 and 5 Step 2 are explicit verification guards (not placeholders) with a fallback action. ✓

**Type consistency:** `listReports({status})`, `dismissReport({id})`, `suspendUser(userId, days)`, `deactivateUser(userId)`, `reactivateUser(userId)`, `resolveReportsForUser({userId,status,reviewedBy})` used identically in repo (Task 3), controller (Task 4), service (Task 5). Controller exports (`listFraudReports`…`reactivateUserAccount`) match route wiring. Service method names (`listReports/dismiss/suspend/deactivate/reactivate`) match page usage (Task 6). ✓
