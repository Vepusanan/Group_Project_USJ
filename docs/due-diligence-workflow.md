# Due Diligence Workflow

This document maps the target due diligence flow to the **current implementation**.

---

## 1. Investor Creates Checklist

| Target spec | Implemented |
|-------------|-------------|
| Navigate to connection record with startup | Yes — **My Connections** → **DD Checklist** opens `ConnectionDdChecklistPanel` |
| Create new due diligence checklist | Yes — one checklist per connection (`dd_checklists`, auto-created for investor) |
| Add line items (document / info requests) | Yes — description (required) + optional due date per item |

### Rules

- Requires an **accepted** connection.
- Checklist is **private** until the investor shares it.
- Only **investors** can add, edit, delete items, or change status.

---

## 2. Checklist Shared with Startup

| Target spec | Implemented |
|-------------|-------------|
| Investor clicks **Share Checklist** | Yes — **Share checklist** (`POST .../share`) |
| In-app notification to startup | Yes — `dd_checklist_shared` (recent shares, header bell) |
| Email notification | Yes — `sendDdChecklistSharedEmail` on share |
| Startup views checklist in connection record | Yes — same **DD Checklist** panel when `is_shared` is true |

Until shared, startup sees: “The investor has not shared a due diligence checklist yet.”

---

## 3. Startup Fulfils Requests

| Target spec | Implemented |
|-------------|-------------|
| Review each checklist item | Yes — shared items listed with status |
| Upload document to checklist item | Yes — `POST .../items/:itemId/respond` with file upload |
| Grant data room access to relevant folder | Yes — link data room **document** or **folder** via `POST .../items/:itemId/link-data-room` |
| Status → **In Review** on fulfilment | Yes — upload/link sets `IN_REVIEW` automatically |

Uploaded files are stored via `uploadDataRoomDocument`. Linked resources reference `data_room_documents` / `data_room_folders`.

---

## 4. Investor Reviews Submissions

| Target spec | Implemented |
|-------------|-------------|
| Notification per fulfilled item | Yes — in-app `dd_checklist_response` + email (`sendDdChecklistResponseEmail`) |
| Review submitted documents | Yes — external link; **in-platform PDF viewer** for uploads and linked PDFs |
| Update item to **Completed** | Yes — investor status dropdown (`REQUESTED` / `IN_REVIEW` / `COMPLETED`) |
| Q&A follow-up on specific submissions | Yes — **Ask follow-up question** per item; `checklist_item_id` on Q&A threads |

When all items are `COMPLETED` and the pipeline card is in **Due Diligence**, the checklist panel shows a hint to move the deal to **Decision**.

---

## 5. Investor Updates Pipeline Stage

| Target spec | Implemented |
|-------------|-------------|
| Drag card from **Due Diligence** → **Decision** | Yes — **Deal Pipeline** (`/deal-pipeline`) drag-and-drop |
| Add note summarising DD outcome | Yes — `PipelineCardNotesPanel` saves `deal_pipeline_cards.private_notes`; prompted when moving from **Due Diligence** → **Decision** |

### Other pipeline notes

- No automatic stage move when all checklist items are `COMPLETED` — UI suggests moving to **Decision** instead.
- Passed startups without connection appear in **Archived** (separate from DD flow).

---

## Status model

| Status | Meaning |
|--------|---------|
| `REQUESTED` | Item created; awaiting startup action |
| `IN_REVIEW` | Startup uploaded or linked a document (auto on submit) |
| `COMPLETED` | Investor marked satisfied |

---

## API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/dd-checklists/connection/:connectionId` | Get checklist + items (+ completion / pipeline hints) |
| `POST` | `/api/dd-checklists/connection/:connectionId/items` | Add item (investor) |
| `PATCH` | `/api/dd-checklists/items/:itemId` | Update item / status (investor) |
| `DELETE` | `/api/dd-checklists/items/:itemId` | Delete item (investor) |
| `POST` | `/api/dd-checklists/connection/:connectionId/share` | Share with startup (+ email) |
| `POST` | `/api/dd-checklists/items/:itemId/respond` | Startup upload (multipart `document`) |
| `POST` | `/api/dd-checklists/items/:itemId/link-data-room` | Startup link data room doc/folder |
| `GET` | `/api/dd-checklists/items/:itemId/file` | Stream checklist upload for in-platform review |
| `GET` | `/api/connection-qa/connection/:connectionId` | Q&A threads (optional `checklist_item_id`) |
| `POST` | `/api/connection-qa/connection/:connectionId` | Ask question (optional `checklist_item_id`) |
| `PATCH` | `/api/deal-pipeline/cards/:cardId/stage` | Move pipeline card |
| `PATCH` | `/api/deal-pipeline/cards/:cardId/notes` | Save pipeline private notes |

---

## Database

Migration `20260620_dd_workflow_enhancements.sql`:

- `dd_checklist_items.response_type` — `upload` | `data_room_document` | `data_room_folder`
- `dd_checklist_items.data_room_document_id`, `data_room_folder_id`
- `connection_qa_threads.checklist_item_id`
