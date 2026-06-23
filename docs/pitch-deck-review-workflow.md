# Pitch Deck Review Workflow

This document describes the **implemented** pitch deck review flow.

---

## 1. Startup Uploads Pitch Deck

1. Startup opens **Settings → Profile Settings → Documents** (`/settings?tab=profile`) or **Edit Profile → Investor Materials**.
2. Uploads pitch deck as **PDF** (and optionally founder video).
3. File is stored via `uploadDocument`; `startup_profiles.pitch_deck_url` is updated.
4. Connected investors see an **interactive slide preview** and **View Pitch Deck** on the startup profile.

---

## 2. Investor Discovers Pitch Deck

1. Investor opens the startup profile (connection not required for pitch deck review).
2. **Documents & Resources** shows a slide thumbnail preview + **View Pitch Deck** CTA when `can_view_pitch_deck` is true.
3. Profile header also includes **View Pitch Deck** and **Video Pitch** (founder video requires connection).

Access: startup owner always; investors during initial evaluation (pre-connection). Founder video remains connection-gated.

---

## 3. Investor Reviews Deck

1. Investor opens `/startups/:id/pitch-deck` (pdf.js viewer).
2. Session tracking (`usePitchDeckSession`):
   - `started_at` on session create
   - `pages_viewed` array updated on navigation + 5s heartbeat
   - `time_per_page_ms` per slide
   - `completed = true` only when **all slides** were viewed (`total_pages` matched)

---

## 4. AI Analysis Available

1. Investor clicks **AI Summary** in the pitch deck viewer.
2. `POST /api/pitch-decks/:startupProfileId/analyze` sends the PDF to Gemini.
3. Response includes `summary`, `structure`, `missing_sections`, `strengths`, `observations`.

Requires `GEMINI_API_KEY` on the server. Max PDF size for analysis: 8MB.

---

## 5. Startup Reviews Engagement Data

**Analytics dashboard** (`/analytics`):

| Metric | Source |
|--------|--------|
| Total pitch deck views | Session count + trend chart |
| Completion rate | % of sessions with `completed = true` |
| Time per slide | Aggregated `time_per_page_ms` |
| Per-investor views, revisits, completion | `pitch_deck_by_investor` table |
| Top slide per investor | Highest `time_per_page_ms` slide |

---

## API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/pitch-decks/:id/meta` | Deck metadata |
| `GET` | `/api/pitch-decks/:id/file` | Stream PDF |
| `POST` | `/api/pitch-decks/:id/sessions` | Start view session |
| `PATCH` | `/api/pitch-decks/sessions/:sessionId` | Progress heartbeat |
| `POST` | `/api/pitch-decks/sessions/:sessionId/complete` | End session (full-deck completion flag) |
| `POST` | `/api/pitch-decks/:id/analyze` | Gemini AI deck summary (investors) |
| `PUT` | `/api/startups/profile/:id` | Upload `pitch_deck` / `founder_video` |
