# Database Index Audit (NFR 17.1 / 3.3)

Audited the hottest query paths (discovery/matching, analytics, connections,
messaging) against the indexes defined in `supabase/migrations/`.

**Verdict:** the schema is already well-indexed — every high-traffic query has a
composite index matching its filter + ordering. One micro-optimisation was added
(messaging history); nothing else was missing.

## Hot paths reviewed

| Query path | Filters / order | Existing index | Verdict |
| --- | --- | --- | --- |
| **Discovery ranking** (investor's match list) | `WHERE investor_user_id = ? ORDER BY match_score DESC` | `(investor_user_id, match_score DESC)` | ✅ optimal |
| **Match lookup by startup** | `WHERE startup_profile_id = ?` | `(startup_profile_id)` | ✅ |
| **Startup analytics — views** | `WHERE startup_profile_id = ? ORDER BY view_date DESC` | `(startup_profile_id, view_date DESC)` | ✅ optimal |
| **Connections list** | `WHERE investor_id/startup_id = ? AND status = ?` | `(investor_id, status)` + `(startup_id, status)` | ✅ optimal |
| **Connection uniqueness** | pair check | `UNIQUE (investor_id, startup_id)` | ✅ |
| **Profile discovery search** | industry / status / funding filters + FTS | per-column btree + GIN FTS index | ✅ |
| **Messaging — conversation list** | `ORDER BY last_message_time DESC` | indexed via conversation/sender/receiver | ✅ |
| **Messaging — message history** | `WHERE conversation_id = ? ORDER BY created_at DESC` | was `(conversation_id)` only | 🔧 **improved** |
| **Match analytics (aggregate)** | `ORDER BY recorded_at DESC` | `(recorded_at DESC)` | ✅ |
| **Failed-login audit** | by user / by IP, recent first | `(user_id, attempted_at DESC)` + `(client_ip, attempted_at DESC)` | ✅ |

## The one change made

**`messages (conversation_id, created_at DESC)`** —
migration `20260628_message_conversation_created_idx.sql`.

The conversation-history query
(`MessageRepository`, `ORDER BY m.conversation_id, m.created_at DESC`) filtered
on the single-column `conversation_id` index but then sorted by `created_at`.
The composite index lets Postgres serve the filter **and** the order straight
from the index, removing the sort — the cheapest win on the busiest messaging
read. Additive and idempotent (the old single-column index stays).

## Notes / non-actions

- **No N+1 index gaps found.** Foreign keys used in joins (`user_id` on profile
  tables, etc.) already carry indexes.
- **Free-tier caveat:** index benefits are most visible under load. On Supabase
  Free with low data volume, query plans may still seq-scan tiny tables (the
  planner's correct choice) — the indexes matter as the dataset grows.
- **No over-indexing introduced.** Extra indexes cost write throughput; only the
  one demonstrably-useful composite was added.

## How to re-verify (when you have data)

Run `EXPLAIN ANALYZE` on a suspect query in the Supabase SQL editor and confirm
it shows an `Index Scan` / `Index Only Scan` rather than `Seq Scan` + `Sort`,
e.g.:

```sql
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE conversation_id = '<id>'
ORDER BY created_at DESC
LIMIT 50;
```
