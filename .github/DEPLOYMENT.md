# Vercel deployment (full stack)

This repo deploys as a **single Vercel project** from the repository root:

- **Frontend:** Vite build → `client/dist` (static SPA)
- **Backend:** Express app → `api/index.js` (serverless)
- **Cron:** nightly cleanup → `api/cron/cleanup.js`

Do **not** point Vercel at `client/` or `server/` alone — use the root `vercel.json`.

## 1. Create the Vercel project

1. Import the GitHub repo in [Vercel](https://vercel.com/new).
2. **Root Directory:** `.` (repository root)
3. **Framework Preset:** Other (settings come from `vercel.json`)
4. **Node.js Version:** 20

Link the project locally (optional):

```bash
npx vercel link
```

Note `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `.vercel/project.json` for GitHub secrets.

## 2. GitHub Actions secrets

In **Settings → Secrets and variables → Actions**, add:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | [Vercel account token](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Team/user ID from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Project ID from `.vercel/project.json` |

### GitHub environments (recommended)

Create **production** and **preview** environments under **Settings → Environments** so deploy jobs can be protected with required reviewers.

## 3. CI/CD pipeline

Workflow: [`.github/workflows/ci-cd.yml`](workflows/ci-cd.yml)

| Trigger | What runs |
|---------|-----------|
| Push / PR to `main`, `master`, `develop`, `Vepusanan` | Install → build client → server tests → validate `vercel.json` |
| Push to `main` | Above + **production deploy** + `/api/health` smoke test |
| Pull request | Above + **preview deploy** + PR comment with preview URL |
| Manual `workflow_dispatch` | CI only, or CI + deploy when **Deploy** is enabled |

Run CI locally:

```bash
npm run ci
```

## 4. Vercel environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for **Production** and **Preview** (see `server/.env.example` for full list).

### Required

| Variable | Example | Notes |
|----------|---------|--------|
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | Supabase pooler URL | PostgreSQL connection |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Storage |
| `SUPABASE_ANON_KEY` | | Or `SUPABASE_SERVICE_KEY` for uploads |
| `JWT_SECRET` | long random string | Auth |
| `JWT_VERIFY_SECRET` | long random string | Email verification |
| `BASE_URL` | `https://your-app.vercel.app` | API public URL |
| `FRONTEND_URL` | `https://your-app.vercel.app` | CORS + cookies |
| `CRON_SECRET` | long random string | Secures `/api/cron/cleanup` |
| `ADMIN_EMAILS` | `you@example.com` | Comma-separated |

### Build-time (frontend)

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `/api` |

Already set in `vercel.json`; you can mirror it in the Vercel dashboard for clarity.

### Email (recommended)

| Variable | Notes |
|----------|--------|
| `EMAIL_SMTP_HOST` | e.g. Brevo |
| `EMAIL_SMTP_PORT` | `587` |
| `EMAIL_SMTP_USER` | |
| `EMAIL_PASS` | |
| `EMAIL_FROM` | Verified sender |

### Optional

`GEMINI_API_KEY`, `AUTH_COOKIE_SAME_SITE`, `CONNECTION_NOTES_ENCRYPTION_KEY`, etc. — see `server/.env.example`.

## 5. Cron job

`vercel.json` schedules `/api/cron/cleanup` daily at 02:00 UTC. Vercel sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set in the project.

## 6. Known limitations on Vercel

- **WebSockets / Socket.io** (`server/server.js`) do not run in serverless. Real-time messaging needs a separate long-running host, or polling-only mode without `VITE_SOCKET_URL`.
- **Local uploads** (`server/uploads/`) are ephemeral on serverless. Production file storage should use Supabase (already integrated).
- **Cold starts:** first API request after idle may be slower; `maxDuration` is 60s in `vercel.json`.

## 7. Verify after deploy

```bash
curl https://your-app.vercel.app/api/health
```

Expect `status: "ok"` and `database: "connected"` when env vars and Supabase are configured.
