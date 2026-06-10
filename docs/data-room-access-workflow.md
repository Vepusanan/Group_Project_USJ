# Data Room Access Workflow

This document describes the **implemented** data room access flow.

---

## 1. Startup Creates Data Room

1. Startup opens **My Profile → Manage Data Room** (`/data-room`).
2. Creates named folders (e.g. Financials, Legal, Product).
3. Uploads documents per folder with optional descriptions.

---

## 2. Startup Grants Investor Access

1. **Access Control** tab lists connected investors.
2. Startup clicks **Grant Access** → `POST /api/data-rooms/access`.
3. Investor receives:
   - **In-app** `data_room_access` notification (header bell)
   - **Email** with links to the data room and startup profile

Only connected investors can be granted access. Investors may **request access** from the profile first; startup must still grant explicitly.

---

## 3. Investor Reviews Data Room

1. From startup profile → **Open Private Data Room** (`/startups/:id/data-room`).
2. Browse folders and documents.
3. **PDFs** open in an **embedded in-platform viewer** (pdf.js modal).
4. Other file types open/download via secure stream; explicit **Download** available for all types.
5. Access is audited in real time:

| Event | `action_type` |
|-------|----------------|
| Open data room | `view_data_room` |
| View PDF | `view_document` |
| Download file | `download_document` |

---

## 4. Startup Reviews Audit Log

**Audit Log** tab on `/data-room`:

- Loads up to **200** entries via `GET /api/data-rooms/audit-log`
- **Filters:** investor, document, action type
- Columns: timestamp, action, investor, document/folder, performed by

Query params: `investor_user_id`, `document_id`, `action_type`, `limit`.

---

## 5. Startup Revokes Access

1. **Revoke** on Access Control tab → immediate removal.
2. **No notification** sent to investor (by design).
3. `revoke_access` recorded in audit log.

---

## API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/data-rooms/me` | Startup manage view |
| `GET` | `/api/data-rooms/audit-log` | Filtered audit log |
| `POST` | `/api/data-rooms/access` | Grant (+ email) |
| `DELETE` | `/api/data-rooms/access/:grantId` | Revoke |
| `GET` | `/api/data-rooms/startup/:id` | Investor data room |
| `GET` | `/api/data-rooms/documents/:id/file` | Stream + audit |
