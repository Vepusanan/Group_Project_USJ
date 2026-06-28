# Disaster Recovery & Backups

Covers NFR 17.4 (Reliability) tasks: **automated daily backups + 30-day
retention (4.2)** and the **Recovery Time / Recovery Point Objectives (4.3)**.

## Hosting context

| Layer | Provider | Relevant facts |
| --- | --- | --- |
| App server | **Vercel** (serverless functions) | Stateless; no local disk persistence; redeploy from Git is instant. |
| Database | **Supabase — Free tier** | PostgreSQL. **No automated backups on the Free plan.** |
| File storage | **Supabase Storage** | Buckets: `startup_logo`, `startup_documents`, `investor_photos`, `message-attachments`. |

> ⚠️ **Known limitation (Supabase Free tier).** Automated daily backups and
> Point-In-Time Recovery (PITR) are **paid features**. On Free, Supabase keeps
> *no* scheduled backups of your database. Meeting "daily backups with 30-day
> retention" therefore requires **either** upgrading to Supabase Pro **or**
> running the manual backup procedure below on a schedule.

## What we do instead (Free tier): scripted `pg_dump`

This repo ships a runnable backup script that, when scheduled daily, satisfies
the daily-backup + 30-day-retention requirement.

- Script: [`server/scripts/backup-database.js`](../server/scripts/backup-database.js)
- Run manually: `cd server && npm run backup-db`
- Output: compressed custom-format dumps in `BACKUP_DIR` (default
  `server/backups/`), named `backup-<ISO-timestamp>.dump`.
- Retention: the script auto-prunes dumps older than `BACKUP_RETENTION_DAYS`
  (default **30**).

Requirements: PostgreSQL client tools (`pg_dump` / `pg_restore`) on `PATH`, and
the same DB env vars the app uses (`DATABASE_URL`, or `SUPABASE_URL` +
`DB_PASSWORD`).

### Scheduling it (pick one)

**A. GitHub Actions (recommended — free, off-box, keeps dumps as artifacts).**
Add a workflow that runs daily, executes `npm run backup-db`, and uploads the
`server/backups/*.dump` as an artifact (GitHub retains artifacts up to 90 days,
covering the 30-day requirement). Store DB creds as repo secrets.

```yaml
# .github/workflows/db-backup.yml (template — wire up secrets before enabling)
name: Daily DB backup
on:
  schedule:
    - cron: "0 2 * * *"   # 02:00 UTC daily
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: sudo apt-get update && sudo apt-get install -y postgresql-client
      - run: cd server && npm ci && npm run backup-db
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      - uses: actions/upload-artifact@v4
        with:
          name: db-backup
          path: server/backups/*.dump
          retention-days: 30
```

**B. A local/cron machine.** Schedule `npm run backup-db` via `cron`
(Linux/macOS) or Task Scheduler (Windows), pointing `BACKUP_DIR` at durable
storage you control.

**C. Upgrade Supabase to Pro.** Pro gives daily automated backups (7-day
retention) and PITR can extend retention. If the project moves to Pro, this
manual script becomes a secondary safeguard rather than the primary mechanism.

## Restore procedure (the runbook)

1. **Provision a target.** A fresh Supabase project (or local Postgres) with the
   connection string in `$DATABASE_URL`.
2. **Restore the most recent good dump:**
   ```bash
   pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" \
     server/backups/backup-<timestamp>.dump
   ```
3. **Re-point the app.** Update `DATABASE_URL` (and Supabase keys if the project
   changed) in Vercel → Settings → Environment Variables, then redeploy.
4. **Verify.** `cd server && npm run test-db`, then hit `GET /api/health` — it
   reports DB connectivity and config status.
5. **Storage objects** (logos, documents, attachments) live in Supabase Storage
   and are **not** included in the DB dump. If a Storage bucket is lost, restore
   from Supabase's storage backups or re-uploads; DB rows reference object paths,
   so missing objects surface as broken media, not data corruption.

## RTO / RPO assessment

| Objective | Target (PRD 17.4) | Achievable on this stack? |
| --- | --- | --- |
| **RTO** (time to restore service) | **4 hours** | ✅ Yes. App redeploys from Git in minutes (stateless on Vercel). DB restore from a `pg_dump` is typically minutes-to-an-hour for a project this size, well within 4h. |
| **RPO** (max acceptable data loss) | **24 hours** | ⚠️ Only if the daily backup is actually scheduled (A/B above). With a daily 02:00 dump, worst-case data loss ≈ time since last dump (≤24h) — meets RPO. **Without scheduling, RPO is unbounded** (data since the last manual run). |

**Action to actually meet 4.2/4.3:** enable one of the scheduling options above
(or upgrade to Supabase Pro). Until then, treat daily backups as a documented,
manually-runnable procedure rather than an automated guarantee.

## Related NFR facts (already satisfied by the hosting)

- **HTTPS / TLS 1.3 (2.1):** terminated automatically by Vercel on all
  `*.vercel.app` and custom domains. No app config required.
- **Static-asset CDN (5.3):** `client/dist` is served from Vercel's global Edge
  CDN; `vercel.json` sets `Cache-Control: immutable` on `/assets/*`.
- **Connection pooling (5.1):** `pg.Pool` against the Supabase pooler endpoint
  (`config/database.js`, `DB_POOL_MAX`).
- **Decoupled storage (5.2):** user files go to Supabase Storage, never the app
  server's disk.
- **Stateless / horizontally scalable (5.4):** sessions live in the DB, not in
  process memory, so Vercel can run any number of function instances.
