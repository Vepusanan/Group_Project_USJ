# Connection Process Workflow

This document describes the **implemented** investor ↔ startup connection flow.

---

## 1. Connection Request Sent

1. Either an **investor** or **startup** clicks **Connect** on the other party's profile (discovery cards use a connect modal with optional message; profile pages use the same modal).
2. The client sends `POST /api/connections` with `userId` and an optional `message` (up to **300 characters**).
3. A row is created in `connections` with status **`pending`**, `requester_id` set to the initiator, and `request_message` stored when provided.
4. The button shows **Pending** for the sender. **Senders cannot cancel** a pending request.

### Rules

- Only **investor ↔ startup** pairs are allowed.
- Duplicate pending requests return `409 REQUEST_PENDING`.
- After a **declined** request, the sender must wait **30 days** before reconnecting (`409 COOLING_PERIOD` with `coolingEndsAt`).

---

## 2. Notification Delivered

### In-app

- Header bell shows a count badge for unread notification items.
- Pending **received** requests appear as `connection_request` notifications (polled every 30s).
- Notifications include sender name, optional message preview, photo URL, and profile link metadata.
- **Both directions** work: investors and startups each see incoming requests when they are the non-requester.

### Email

`sendConnectionRequestEmail` sends:

- Requester name and photo (when available)
- Optional request message
- Deep link to the requester's profile
- Link to **My Connections** to review pending requests

---

## 3. Recipient Review

1. Recipient opens **My Connections** (`/connections`).
2. Tabs: **Connected**, **Pending Sent**, **Pending Received**.
3. **Pending Received** shows requester photo, name, profile link, optional message, and accept/decline actions.
4. **Pending Sent** shows outgoing requests (read-only **Pending** badge — no cancel).

Pending queries use `requester_id` so startup-initiated requests to investors appear correctly for investors.

---

## 4. Acceptance and Unlocking

When the **non-requester** accepts (`PUT /api/connections/:id` with `status: "accepted"`):

| Outcome | Implemented |
|---------|-------------|
| Both parties connected | Yes — `connections.status = accepted` |
| Private profile sections unlocked | Yes |
| Messaging available | Yes |
| Startup in investor deal pipeline | Yes |
| Confirmation notification to both | Yes — in-app `connection_accepted` + `sendConnectionAcceptedEmail` to both parties |

Only the **recipient** (non-requester) may accept or decline.

---

## 5. Decline

When the recipient declines (`status: "declined"`):

| Behavior | Implemented |
|----------|---------------|
| Row kept with `declined` status | Yes |
| `declined_at` timestamp set | Yes |
| Sender notified of decline | No (silent per spec) |
| 30-day cooling before re-request | Yes — enforced server-side and reflected in discovery/profile UI |
| Sender can cancel pending | No |

After cooling ends, the sender may connect again; the existing row is updated back to `pending` with a new `requester_id` and message.

---

## API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/connections` | Send request (`userId`, optional `message`) |
| `GET` | `/api/connections` | List all connections for current user |
| `GET` | `/api/connections/pending/sent` | Outgoing pending (`requester_id = current user`) |
| `GET` | `/api/connections/pending/received` | Incoming pending (`requester_id ≠ current user`) |
| `PUT` | `/api/connections/:id` | Accept or decline (`{ status: "accepted" \| "declined" }`) |
| `DELETE` | `/api/connections/:id` | Remove **accepted** connections only; pending returns `403 PENDING_CANNOT_DELETE` |

---

## Database

Migration `20260618_connection_workflow_enhancements.sql` adds:

- `request_message VARCHAR(300)`
- `declined_at TIMESTAMPTZ`

`ensureConnectionColumns()` in `ConnectionRepository` applies these columns at runtime if the migration has not been run yet.
