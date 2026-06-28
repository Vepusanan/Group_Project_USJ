# API Reference (NFR 17.6 / 7.4)

Internal reference for all HTTP endpoints. Generated from `server/routes/*` and
the mounts in `server/app.js`. Keep in sync when routes change.

## Conventions

- **Base:** all paths below are prefixed as mounted in `app.js` (shown per
  section). On Vercel the API is same-origin under `/api`.
- **Auth column:**
  - `Public` — no authentication.
  - `Auth` — requires a valid session (`protect`: HttpOnly cookie or
    `Authorization: Bearer` fallback).
  - `Auth+Profile` — requires auth **and** a completed profile
    (`requireProfileComplete`).
  - `Admin` — requires auth **and** an email in `ADMIN_EMAILS` (`requireAdmin`).
  - `Role` — restricted to a user type (startup/investor) via role middleware.
- **Rate limits:** `auth` = `authLimiter` (20 / 15 min / IP); `ai` = `aiLimiter`
  (per-user hourly); `general` = `generalLimiter` (200 / min / IP, applies to all
  `/api`).
- **Response shape:** JSON `{ success, data?, error?, errors? }`. Validation
  failures return `400` with `{ success:false, error, errors:[{field,message}] }`.

---

## Auth — `/api/auth`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/register` | Public (`auth` limit) | Validated; requires `agreedToTerms` |
| POST | `/login` | Public (`auth` limit) | Validated |
| GET | `/verify-email` | Public | `?token=` |
| POST | `/resend-verification` | Public (`auth` limit) | Validated |
| POST | `/token` | Public | Refresh access token from refresh cookie |
| POST | `/forgot-password` | Public (`auth` limit) | Validated |
| POST | `/reset-password` | Public (`auth` limit) | Validated |
| POST | `/logout` | Auth | |
| POST | `/logout-all` | Auth | Revoke all sessions |
| GET | `/sessions` | Auth | List active sessions |
| DELETE | `/sessions/:sessionId` | Auth | Revoke one session |
| GET | `/me` | Auth (session) | Current user |

## Account — `/api/account`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| PUT | `/email` | Auth | Validated; starts email-change flow |
| GET | `/verify-email-change` | Public | `?token=` |
| PUT | `/password` | Auth | Validated |
| DELETE | `/` | Auth | Validated; soft-delete (30-day grace) |
| GET | `/export` | Auth | GDPR data export (JSON) |

## Settings — `/api/settings`

| Method | Path | Auth |
| --- | --- | --- |
| GET / PUT | `/privacy` | Auth+Profile |
| GET / PUT | `/notifications` | Auth |

## Startup profiles — `/api/startups/profile`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/` | Auth | Create (multipart) |
| GET | `/me` | Auth | My profile |
| GET | `/completion` | Auth | Completion status |
| GET | `/:id/match-explanation` | Auth | AI match explanation (with fallback) |
| PUT | `/:id` | Auth | Update (multipart) |
| GET | `/:id` | Auth | |

## Investor profiles — `/api/investors/profile`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/` | Auth | Create (multipart) |
| GET | `/me` | Auth | |
| GET | `/completion` | Auth | |
| PUT | `/:id` | Auth | Update (multipart) |
| GET | `/:id` | Auth | |

## Discovery / search

| Method | Path | Mount | Auth | Notes |
| --- | --- | --- | --- | --- |
| GET | `/` (startups) | `/api/startups`, `/startups` | Public/optional | Discovery feed |
| POST | `/natural-language` | `/api/startups` | Auth+Profile (`ai`) | NL → filters (Gemini, fallback) |
| GET | `/` (investors) | `/api/investors` | Public/optional | Investor discovery |

## Connections — `/api/connections` *(Auth+Profile)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | List connections |
| POST | `/` | Create request (`connectionRequestLimiter`) |
| GET | `/pending` · `/pending/sent` · `/pending/received` | Pending views |
| GET | `/:connectionId/notes` | My private notes (AES-256 at rest) |
| POST | `/:connectionId/notes` | Add note |
| PATCH | `/:id` | Accept/decline |
| DELETE | `/:id` | Remove |

## Messaging — `/api/messages` *(Auth+Profile)*

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/` | Send message |
| POST | `/attachments` | Upload attachment |
| GET | `/conversations` | Conversation list |
| GET | `/conversation/:id` | Message history |

## Realtime — `/api/realtime` *(Auth)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/token` | Supabase realtime token |
| POST | `/presence` | Update presence |

## Notifications — `/api/notifications` *(Auth)*

| Method | Path |
| --- | --- |
| GET | `/` |
| POST | `/read` |

## Pitch decks — `/api/pitch-decks` *(Auth)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/:startupProfileId/meta` | |
| GET | `/:startupProfileId/file` | Streams PDF |
| POST | `/:startupProfileId/analyze` | `ai` — Gemini analysis (fallback) |
| POST | `/:startupProfileId/sessions` | View session start (`pitchDeckSessionLimiter`) |
| PATCH | `/sessions/:sessionId` | Heartbeat |
| POST | `/sessions/:sessionId/complete` | End session |

## Data rooms — `/api/data-rooms` *(Auth+Profile)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/me` · `/audit-log` · `/connected-investors` | Owner views |
| GET | `/startup/:startupProfileId/meta` · `/startup/:startupProfileId` | Investor view |
| POST | `/startup/:startupProfileId/request-access` | Request access |
| GET | `/startup/:startupProfileId/audit-log` | |
| POST/PATCH/DELETE | `/folders` · `/folders/:folderId` | Folder CRUD |
| POST/PATCH/DELETE | `/documents` · `/documents/:documentId` | Document CRUD (upload) |
| GET | `/documents/:documentId/file` | Stream doc |
| POST | `/documents/:documentId/analyze` | `ai` — Gemini summary (fallback) |
| POST/DELETE | `/access` · `/access/:grantId` | Grant / revoke access |

## Funding rounds — `/api/funding-rounds` *(Auth, Role: startup for writes)*

| Method | Path |
| --- | --- |
| GET | `/me` · `/startup/:startupProfileId` |
| POST | `/` |
| PUT | `/:roundId` |
| POST | `/:roundId/close` |

## Deal pipeline — `/api/deal-pipeline` *(Auth, investor)*

| Method | Path |
| --- | --- |
| GET | `/` |
| PATCH | `/cards/:cardId/stage` · `/cards/:cardId/notes` |

## Investor intents — `/api/investor-intents` *(Auth, investor)*

| Method | Path |
| --- | --- |
| GET | `/` |
| PUT | `/connection/:connectionId` · `/startup/:startupProfileId` |
| POST/DELETE | `/pass/:startupProfileId` |

## Startup analytics — `/api/startup-analytics` *(Auth, startup)*

| Method | Path |
| --- | --- |
| GET | `/me` |

## Watchlist — `/api/watchlist` *(Auth)*

| Method | Path |
| --- | --- |
| GET | `/` |
| POST | `/` |
| DELETE | `/:startupProfileId` |

## Milestones — `/api/milestones` *(Auth)*

| Method | Path |
| --- | --- |
| GET | `/startup/:startupProfileId` |
| POST | `/` |
| PATCH/DELETE | `/:milestoneId` |

## Meetings — `/api/meetings` *(Auth)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/connection/:connectionId` | |
| POST | `/connection/:connectionId` | Request meeting |
| PATCH | `/:meetingId/respond` | |
| POST | `/:meetingId/brief` | `ai` — Gemini brief (fallback) |
| GET | `/:meetingId/calendar.ics` | ICS download |
| POST | `/:meetingId/notes` | |

## Due-diligence checklists — `/api/dd-checklists` *(Auth)*

| Method | Path |
| --- | --- |
| GET | `/connection/:connectionId` |
| POST | `/connection/:connectionId/items` · `/connection/:connectionId/share` |
| PATCH/DELETE | `/items/:itemId` |
| GET | `/items/:itemId/file` |
| POST | `/items/:itemId/link-data-room` · `/items/:itemId/response` |

## Comparisons — `/api/comparisons` *(Auth, investor)*

| Method | Path |
| --- | --- |
| POST | `/compare` |
| GET/POST | `/snapshots` |
| DELETE | `/snapshots/:snapshotId` |

## Connection Q&A — `/api/connection-qa` *(Auth)*

| Method | Path |
| --- | --- |
| GET/POST | `/connection/:connectionId` |
| POST | `/:threadId/answer` |

## Verification (self-serve) — `/api/verification` *(Auth)*

| Method | Path |
| --- | --- |
| GET | `/me` |
| POST | `/identity` · `/business` |

## Fraud reporting — `/api/profile-reports` *(Auth)*

| Method | Path |
| --- | --- |
| POST | `/:userId` |

## Uploads — `/api/uploads` *(Auth)*

| Method | Path |
| --- | --- |
| POST | `/message` |

## Admin — `/api/admin` *(Admin: protect + requireAdmin)*

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/analytics` | Platform analytics |
| GET | `/verification-requests` | Pending verifications |
| POST | `/verification-requests/:requestId/approve` · `/reject` | |
| GET | `/reports` | Fraud reports |
| POST | `/reports/:id/dismiss` | |
| POST | `/users/:userId/suspend` · `/deactivate` · `/reactivate` | Moderation (audited) |

## Health — `/api/health`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | DB ping + config checks; used by uptime monitor |
