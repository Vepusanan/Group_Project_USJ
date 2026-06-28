# Data Minimisation Review (NFR 17.5 / 6.4)

Reviews every place the app collects or stores **personal data**, and confirms
each field is actually needed by a feature (GDPR/CCPA "data minimisation":
collect only what you use).

**Verdict:** the schema is feature-driven — no field is collected "just in
case". Every personal field maps to a feature that reads it. Two retention
notes (audit logs) are flagged below as accepted, low-risk trade-offs.

## Method

Cross-referenced the table definitions in `supabase/migrations/` against actual
reads in `server/repositories`, `server/controllers`, and the client onboarding
wizards. A field "passes" if something renders or acts on it.

## `users` (core identity)

| Field | Personal? | Needed for | Verdict |
| --- | --- | --- | --- |
| `email` | Yes | Login, notifications, verification | ✅ essential |
| `password_hash` | Yes (hashed) | Authentication (bcrypt) | ✅ essential |
| `full_name` | Yes | Display name across the app | ✅ used |
| `user_type` | No | Routing/role | ✅ used |
| `email_verified`, `*_token`, `*_expires` | No | Email verification flow | ✅ used |
| `terms_accepted_at`, `terms_version` | No | Consent record (6.3) | ✅ required by GDPR |
| `deleted_at`, `deletion_scheduled_at` | No | Soft-delete grace window | ✅ used |

**No over-collection.** The table is intentionally minimal; all richer profile
data lives in the profile tables and is optional.

## `startup_profiles` / `investor_profiles`

All fields (company info, funding prefs, contact details, document URLs,
social links) are **collected by the onboarding wizards** (`Step1…Step7`,
`InvestorStep1…Step7`) and **rendered on the profile pages** + used by
discovery/matching. Confirmed in use: `phone_number`, `contact_email`,
`primary_contact_name`, `founder_names`, `key_team_members`,
`customer_testimonials`, `social_media_links`.

- These are **self-supplied, optional** profile fields — the user chooses what
  to share to attract matches. That is consistent with minimisation: the
  platform's purpose is discovery, so contact + company detail is in-scope.
- `contact_email` / `phone_number` duplicate channels the user opts into for
  outreach; they are not silently harvested.

**Recommendation (optional, not a defect):** mark clearly in the UI which
profile fields are public vs. connection-only. The privacy-settings table
already governs visibility, so this is a labelling nicety, not missing
functionality.

## Audit / security logs (the two retention notes)

| Table | Personal data | Retention today | Note |
| --- | --- | --- | --- |
| `failed_login_attempts` | `email`, `client_ip`, `user_agent` | No automatic purge | ⚠️ Accepted trade-off — needed for brute-force detection (TC-SEC-004/005). `user_id` is `ON DELETE SET NULL`, so it **auto-anonymises** when the account is hard-deleted. |
| admin action / auth-event logs | actor + target ids, IP | Retained by design | ✅ Per 6.2, audit logs are intentionally retained even after erasure (legal/accountability). |

**Optional hardening (not required for this project):** add a periodic purge of
`failed_login_attempts` older than N days (e.g. 90) to bound IP retention. The
existing daily cleanup cron (`utils/cleanup.js`) is the natural home for it.
Left out deliberately to avoid changing security behaviour without a clear
requirement.

## Erasure path (confirms minimisation on delete)

`DELETE /api/account` soft-deletes (`deleted_at` + 30-day grace), terminates
sessions immediately, then the daily cron hard-deletes via `DELETE FROM users`,
which **cascades** to `startup_profiles` / `investor_profiles` (FK
`ON DELETE CASCADE`). Audit logs survive by design; their `user_id` FKs null out
so no profile PII remains linkable.

## Conclusion

✅ **Data minimisation is satisfied.** Collected data is limited to what
features use; sensitive logs are either auto-anonymised on deletion or
intentionally retained for security/accountability. The only open items are
**optional** hardening (a `failed_login_attempts` retention purge and clearer
public/private field labels), neither of which is a compliance gap for this
university project on free-tier hosting.
