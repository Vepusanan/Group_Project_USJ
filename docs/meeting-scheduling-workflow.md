# Meeting Scheduling Workflow

This document maps the target meeting scheduling flow to the **current implementation**.

---

## 1. Investor Initiates Meeting Request

| Target spec | Implemented |
|-------------|-------------|
| Navigate to connected startup profile or connection record | Yes — **Request Meeting** on startup profile (when connected) and **Meetings** on **My Connections** |
| Click **Request Meeting** | Yes — opens `ConnectionMeetingsPanel` with request form |
| Proposed date and time | Yes — `datetime-local` → `proposed_at` |
| Meeting format | Yes — `VIDEO_CALL`, `PHONE_CALL`, `IN_PERSON` |
| Agenda | Yes — required |
| Message | Yes — optional |

### Rules

- Requires an **accepted** connection.
- Only the **investor** in the connection can create requests (`POST /api/meetings/connection/:connectionId`).
- Proposed time must be **in the future**.

---

## 2. Startup Receives and Reviews Request

| Target spec | Implemented |
|-------------|-------------|
| In-app notification | Yes — `meeting_request` (header bell → opens **Meetings** panel on that connection) |
| Email notification | Yes — `sendMeetingRequestEmail` with date, format, agenda, message |
| Review request details | Yes — meeting card in `ConnectionMeetingsPanel` |
| Accept or Decline | Yes — startup buttons → `PATCH /api/meetings/:meetingId/respond` |

---

## 3. Confirmation and Calendar Entry

| Target spec | Implemented |
|-------------|-------------|
| Confirmation notification (both parties) | Yes — in-app `meeting_confirmed` / `meeting_declined` (last 7 days) |
| Confirmation email (both parties) | Yes — `sendMeetingConfirmationEmail` with full details |
| Meeting in connection history | Yes — listed in `ConnectionMeetingsPanel` per connection |
| External calendar reminder | Yes — **Add to calendar (.ics)** for accepted meetings (`GET /api/meetings/:meetingId/calendar.ics`); confirmation email directs users to download from Connections |

---

## 4. Post-Meeting Notes

| Target spec | Implemented |
|-------------|-------------|
| Notes after meeting date has passed | Yes — `can_add_notes` when `proposed_at` is in the past; API rejects earlier notes |
| Notes private to each party | Yes — API returns only the current user's notes; UI labelled **Your private notes** |
| Preserved in meeting history | Yes — all notes stored in `meeting_notes`; each party sees only their own in the UI |

---

## Status model

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting startup response |
| `accepted` | Confirmed meeting |
| `declined` | Startup declined the request |

---

## API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/meetings/connection/:connectionId` | List meetings + user's private notes |
| `POST` | `/api/meetings/connection/:connectionId` | Investor creates meeting request |
| `PATCH` | `/api/meetings/:meetingId/respond` | Startup accepts or declines |
| `GET` | `/api/meetings/:meetingId/calendar.ics` | Download calendar file (accepted only) |
| `POST` | `/api/meetings/:meetingId/notes` | Add post-meeting note (after scheduled time) |

### Deep links

Meeting notifications navigate to `/connections?open=meetings&connectionId={id}` so the startup (or either party for confirmations) lands directly on the meeting history panel.
