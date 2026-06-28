# Admin Features Completion + Admin Account Setup — Design

Date: 2026-06-28
Status: Approved (pending spec review)

## Goal

Complete the Verification & Admin feature set (spec sections 5.1–5.3) and set up a
proper admin account. Most of this already exists; this spec documents what is
**already built** (to avoid re-doing it) and specifies the **one missing feature**
(admin-side fraud-report management) plus two admin-account tweaks.

Hard constraint: **do not break existing working functionality.**

## Current State (verified against live code)

| Requirement | Status | Evidence |
|---|---|---|
| 5.1 Submit doc → admin review queue | ✅ Built | `verificationController`, `VerificationRepository`, `VerificationSettingsTab` |
| 5.1 Admin approve/reject with reason | ✅ Built | `adminVerificationController.approve/reject`, `routes/admin.js` |
| 5.1 Applicant gets result email | ✅ Built | `sendVerificationDecisionEmail` |
| 5.1 Badge on profile + discovery card | ✅ Built | `VerificationBadge` in `MyProfilePage`, `StartupsPage` |
| 5.1 Discovery filter by min verification level | ✅ Built | `listingFilters.min_verification`, `StartupsPage`/`InvestorsPage` selects |
| 5.2 Admin platform dashboard (all metrics) | ✅ Built | `adminAnalyticsController.getPlatformAnalytics`, `AdminAnalyticsPage` |
| 5.3 User reports a profile (+ auto-flag at 3) | ✅ Built | `profileReportController`, `ProfileReportRepository.createProfileReport` |
| **5.3 Admin views reports + suspend/deactivate/dismiss** | ❌ **Missing** | no admin endpoint or page |
| Admin account: no onboarding | ⚠️ To do | — |
| Admin account: `user_type = admin` | ⚠️ To do | constraint currently `IN ('startup','investor')` |

## Decisions (confirmed with user)

1. **`admin` becomes a real `user_type`** — widen the CHECK constraint, set the
   account's type, and make routing admin-aware. BUT admin *authority* stays
   email-based (`ADMIN_EMAILS` / `isAdminUser`). `user_type='admin'` is a
   label/routing signal only, never a privilege grant.
2. **Suspend (timed) + Deactivate (indefinite) + Dismiss** for fraud reports,
   plus Reactivate (undo).

## Section 1 — Admin Account Setup

One SQL migration updates the admin user row:

- `user_type = 'admin'` (requires §2 constraint change first, same migration)
- `onboarding_completed_at = NOW()` — so the auth state machine resolves the
  account to `AUTHENTICATED_READY` and never routes it into the type-specific
  onboarding wizard (`/onboarding` / `/investor-onboarding`).
- `email_verified = true` (already true; included for idempotency).

No password change (already set to `admin12345`). Existing startup profile row is
left untouched — harmless and ignored for an admin.

## Section 2 — `admin` as a real user_type (safely)

### Migration

`supabase/migrations/20260628_add_admin_user_type.sql`:

```sql
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('startup', 'investor', 'admin'));

UPDATE public.users
  SET user_type = 'admin',
      onboarding_completed_at = COALESCE(onboarding_completed_at, NOW()),
      email_verified = TRUE
  WHERE LOWER(email) = LOWER('vepu2003nanthan@gmail.com');
```

Note: the `user_type_enum` from `20260329` is a separate type used only by the
refined profile tables; `users.user_type` remains `VARCHAR(20)` + CHECK, so only
this one constraint is touched.

### Code changes (entry/routing points only — NOT all 18 controllers)

- `client/src/utils/roleUtils.js` — `getRoleHomePath`: add
  `admin → /admin/analytics`. So `/dashboard` and post-login land an admin on the
  admin dashboard rather than `/investors`.
- Admin authority is unchanged: `isAdminUser` (email-based) remains the only thing
  that grants `/api/admin/*` and `AdminRoute`. `user.isAdmin` is already in the
  auth response (`serializeAuthUser`), independent of `user_type`.

Controllers that branch `if (userType === 'investor') … else … (startup)` are
**not** rewritten. An admin never traverses connection/pitch/dataroom flows
(routing sends them to the admin area), so those branches are never reached by an
admin. Leaving them untouched preserves all existing behavior.

## Section 3 — Admin Fraud-Report Management (new)

### Repository — extend `ProfileReportRepository.js`

- `listReports({ status })` → reports joined to reporter + reported user
  (id, email, full_name, user_type, current `fraud_flagged`,
  `account_locked_until`, `deleted_at`), newest first.
- `getReportById(id)`
- `resolveReportsForUser({ userId, status, reviewedBy })` → set open reports for a
  user to `RESOLVED`/`DISMISSED` + `reviewed_at`.
- `dismissReport({ id, reviewedBy })` → mark one report `DISMISSED`; if no other
  open reports remain for that user, clear `fraud_flagged` and the auto-suspension
  `account_locked_until`.
- `suspendUser(userId, days)` → `account_locked_until = NOW() + days`.
- `deactivateUser(userId)` → `deleted_at = NOW()`.
- `reactivateUser(userId)` → clear `account_locked_until`, `deleted_at`,
  `fraud_flagged`.

Login-blocking for suspended (`account_locked_until`) and deactivated
(`deleted_at`) accounts is **already enforced** by `middleware/auth.js` — no auth
changes needed.

### Controller + routes — `adminFraudController.js`, mount on existing `/api/admin`

Guarded by the existing `router.use(protect, requireAdmin)` in `routes/admin.js`.

- `GET    /api/admin/reports?status=` → list
- `POST   /api/admin/reports/:id/dismiss` → dismiss one report
- `POST   /api/admin/users/:userId/suspend`     `{ days, reason }`
- `POST   /api/admin/users/:userId/deactivate`  `{ reason }`
- `POST   /api/admin/users/:userId/reactivate`

Suspend/deactivate also resolve that user's open reports. Every action writes to
`AdminActionLogRepository` (same audit pattern as the verification controller).

No email to the reported user (not in acceptance criteria; avoids tipping off bad
actors). Easy to add later as a toggle.

### Frontend — `AdminFraudReportsPage.jsx` + service + route

- Route `/admin/reports` wrapped in `AdminRoute`, lazy-loaded like the other
  admin pages.
- `services/adminFraudService.js` — list + action calls via shared `apiClient`.
- Page: reports grouped by reported user; shows reason(s), reporter, count,
  current account-status badge; per-user actions **Suspend** (days + reason),
  **Deactivate** (reason confirm), **Dismiss**, **Reactivate** (when already
  suspended/deactivated).
- Cross-link: add a "Fraud reports" link in `AdminAnalyticsPage` and
  `AdminVerificationPage` headers + the admin links block in
  `VerificationSettingsTab`.

## Error Handling

- All admin endpoints: 401 (no auth) / 403 (not admin) via existing middleware;
  404 for missing report/user; 400 for invalid `days`/missing reason.
- Self-action guard: admin cannot suspend/deactivate their own account.
- Frontend: confirm dialog before deactivate; optimistic row update with
  rollback on failure.

## Testing

- Backend: extend admin RBAC test to cover the new endpoints (403 for non-admin);
  unit-test `resolveReportsForUser` and the dismiss-clears-flag logic.
- Manual: report a profile as a normal user → 3rd report auto-flags → admin sees
  it at `/admin/reports` → suspend → suspended user blocked at login → reactivate
  → login works.
- `npm run build` (client) + existing server test suite must pass unchanged.

## Out of Scope

- Emailing reported users on moderation actions.
- Rewriting type-branching in non-admin controllers.
- Changing the verification flow or admin analytics (already complete).
