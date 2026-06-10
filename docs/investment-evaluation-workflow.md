# Investment Evaluation Workflow (End-to-End)

Maps the six-stage investor evaluation journey to the **current implementation**.

---

## 1. Discovery

| Target spec | Implemented |
|-------------|-------------|
| Browse startup discovery feed | Yes — `/startups` (`StartupsPage`) with filters, sort by match score |
| Review match scores | Yes — compatibility scoring on cards and profiles |
| Save prospects to watchlist | Yes — toggle on feed/profile; `/watchlist` page |
| AI match explanations | Yes — on **profile** (Gemini when configured); **rule-based summaries on discovery feed cards** and watchlist |

---

## 2. Initial Evaluation

| Target spec | Implemented |
|-------------|-------------|
| View startup public profiles | Yes — `/startups/:id` with public sections + locked private areas |
| Review interactive pitch deck | Yes — investors can open pitch deck viewer **before connection** for initial evaluation |
| Assign intent — Watching / Interested | Yes — `IntentLevelControl` on **profile** (pre-connection) and **connections/pipeline** (post-connection) |
| Pipeline at **Discovered** | Yes — pre-connection intent (`PUT /api/investor-intents/startup/:id`) creates virtual **Discovered** cards (no connection yet) |

### Rules

- **Watching / Interested** before connect → `investor_profile_intents` → appears in pipeline **Discovered**.
- **Pass** from discovery → virtual **Archived** card (existing behaviour).
- Pitch deck deep review still gated until connected (by design for confidential decks).

---

## 3. Connection

| Target spec | Implemented |
|-------------|-------------|
| Investor sends connection request | Yes — modal with optional message |
| Startup accepts | Yes — accept on profile or `/connections` |
| Pipeline → **Connected** | Yes — `ensurePipelineCardForConnection` on accept; profile intent cleared |
| Private profile sections | Yes — funding, documents, contact unlock after accept |

See `docs/connection-workflow.md`.

---

## 4. Deep Review

| Target spec | Implemented |
|-------------|-------------|
| Data room access | Yes — grant/request flow; investor viewer at `/startups/:id/data-room` |
| AI document summariser (financial docs) | Yes — **AI summary** in `DataRoomPdfViewer` (`POST /api/data-rooms/documents/:id/analyze`, Gemini) |
| Startup comparison tool | Yes — up to 4 startups at `/compare` from discovery or pipeline |
| Pipeline → **Reviewing** | **Auto-advance** when pitch deck session starts or data room access is granted (if card is earlier stage) |

---

## 5. Due Diligence

| Target spec | Implemented |
|-------------|-------------|
| DD checklist create & share | Yes — `ConnectionDdChecklistPanel`; share email + in-app notification |
| Startup fulfils requests | Yes — upload or link data room doc/folder per item |
| Review via data room audit log | **Partial** — startup full audit log on manage page; investor sees **own activity** on data room viewer |
| Meeting scheduling | Yes — see `docs/meeting-scheduling-workflow.md` |
| Pipeline → **Due Diligence** | **Auto-advance** when checklist is shared; **auto-advance to Decision** when all items complete |

See `docs/due-diligence-workflow.md`.

---

## 6. Decision

| Target spec | Implemented |
|-------------|-------------|
| Q&A for final clarifying questions | Yes — `ConnectionQaPanel` per connection (optional DD item link) |
| Pipeline → **Decision** | Yes — manual drag; notes modal with DD summary prompt |
| Record decision in pipeline notes | Yes — `PipelineCardNotesPanel` → `private_notes` + structured outcome (`INVEST` / `PASS` / `DEFER`) |
| Off-platform transition guidance | Yes — copy in Decision notes modal (legal/financial execution off-platform) |

---

## Pipeline stages

| Stage | Typical trigger |
|-------|-----------------|
| **Discovered** | Investor sets Watching/Interested on profile (pre-connection) |
| **Connected** | Connection accepted (auto card create) |
| **Reviewing** | Auto on pitch deck view or data room grant; manual drag also supported |
| **Due Diligence** | Auto when DD checklist shared |
| **Decision** | Auto when all DD items complete; manual drag also supported |
| **Archived** | Pass from discovery, intent PASSED on connection, or manual drag |

Auto-advance only moves **forward** (never backward). Investors can still drag cards manually at any time.

---

## API quick reference

| Area | Key endpoints |
|------|-----------------|
| Discovery | `GET /api/search/startups`, `POST /api/watchlist` |
| Intent | `PUT /api/investor-intents/startup/:id`, `PUT /api/investor-intents/connection/:id` |
| Pipeline | `GET /api/deal-pipeline`, `PATCH /api/deal-pipeline/cards/:id/stage` |
| Data room AI | `POST /api/data-rooms/documents/:id/analyze` |
| Investor audit | `GET /api/data-rooms/startup/:id/audit-log` |
| Comparison | `GET /api/comparisons?ids=...` |
| DD | `/api/dd-checklists/...` |
| Meetings | `/api/meetings/...` |
| Q&A | `/api/connection-qa/...` |

---

## Migrations

- `20260621_investor_profile_intents.sql` — pre-connection intent / Discovered pipeline
- `20260622_pipeline_decision_outcome.sql` — `decision_outcome` on pipeline cards
