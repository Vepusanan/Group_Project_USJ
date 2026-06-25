# Vercel deployment

Production hosting for **StartHub Capital** — React SPA + Express API + Supabase Realtime.

## Architecture

```text
https://your-app.vercel.app
├── /              → React SPA (client/dist)
├── /api/*         → Express serverless (api/index.js → server/app.js)
├── /api/cron/*    → Scheduled cleanup
└── Realtime       → Browser → Supabase (messages)
```

**Root config:** `vercel.json` at repository root. Do not deploy `client/` or `server/` as separate projects.

## 1. Create the Vercel project

1. [vercel.com/new](https://vercel.com/new) → import GitHub repo
2. **Root Directory:** `.` (repository root — **not** `client/`)
3. **Framework:** Other (uses `vercel.json`)
4. **Node.js:** 24

### Critical dashboard settings

Confirm these in **Vercel → Project → Settings → General**:

| Setting | Must be |
|---------|---------|
| Root Directory | `.` |
| Output Directory | `client/dist` |
| Install Command | `npm ci` |
| Build Command | `npm run vercel-build` |

Wrong **Output Directory** (`dist` instead of `client/dist`) is the most common cause of a **white screen**.

## 2. Environment variables

Set in **Vercel → Settings → Environment Variables** for **Production** and **Preview**.

### Server (runtime)

| Variable | Required | Notes |
|----------|----------|--------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | Supabase pooler URL |
| `SUPABASE_URL` | Yes | |
| `SUPABASE_ANON_KEY` | Yes | Or `SUPABASE_SERVICE_KEY` for uploads |
| `SUPABASE_JWT_SECRET` | Yes | Supabase → Settings → API → JWT Secret |
| `JWT_SECRET` | Yes | App auth |
| `JWT_VERIFY_SECRET` | Yes | Email verification |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` — required; server fails fast if missing or localhost |
| `CRON_SECRET` | Yes | Random string for `/api/cron/cleanup` |
| `ADMIN_EMAILS` | Yes | Comma-separated |
| `EMAIL_SMTP_*` / `EMAIL_FROM` | Recommended | Auth emails |

### Frontend (build-time)

| Variable | Required | Value |
|----------|----------|--------|
| `VITE_API_URL` | Yes | `/api` |
| `VITE_SUPABASE_URL` | Yes | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon key |

`VITE_API_URL` is also set in `vercel.json`; Supabase vars must be in the Vercel dashboard.

## 3. Supabase setup

1. Run `supabase/migrations/20260623_messages_realtime_presence.sql` in the SQL editor
2. Confirm `messages` is in the `supabase_realtime` publication
3. Copy **JWT Secret** → `SUPABASE_JWT_SECRET` on Vercel

## 4. CI/CD

Workflow: `.github/workflows/ci-cd.yml`

| Trigger | Action |
|---------|--------|
| Push / PR | Build, test, validate `vercel.json` |
| Manual `workflow_dispatch` with deploy=true | Optional Vercel deploy via Actions (requires secrets) |

**Production deployment:** Vercel Git Integration (connect repo in Vercel dashboard — push to `main` auto-deploys).

GitHub Actions does **not** auto-deploy on push (avoids dual-deployment with Vercel Git Integration).

To deploy via Actions instead, set secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and run workflow_dispatch with deploy enabled.

## 5. Local commands

```bash
npm run ci          # install, build, test
npm run dev:client  # Vite on :3000 (proxies /api)
npm run dev:server  # Express on :5001
```

Production smoke test locally:

```bash
npm run build:production
NODE_ENV=production npm run dev:server
```

## 6. Troubleshooting white screen / API errors

### `FUNCTION_INVOCATION_FAILED` on `/api/health`

The serverless function is crashing at startup — almost always **missing environment variables on Vercel**.

1. Open **Vercel → Project → Settings → Environment Variables**
2. Copy values from your local `server/.env` (at minimum):
   - `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`
   - `JWT_SECRET`, `JWT_VERIFY_SECRET`, `BASE_URL`, `FRONTEND_URL`
   - `ADMIN_EMAILS`, `CRON_SECRET`
3. Set build-time vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=/api`
4. **Redeploy** (env changes do not apply to past deployments)

After redeploy, `/api/health` should return JSON (503 with a clear message if something is still missing, or 200 when connected). Check `appUrl.frontend` — it must be your production domain, never `localhost`.

### Verification emails link to localhost

1. Open **Vercel → Settings → Environment Variables**
2. Ensure `FRONTEND_URL` and `BASE_URL` are both `https://your-production-domain` for **Production** (not `http://localhost:3000`)
3. Redeploy — env changes do not apply to past deployments

The server ignores localhost values in production and falls back to `BASE_URL` or Vercel's `VERCEL_URL`, but you should still fix the env vars.

### White screen (frontend)

1. **Output Directory** must be `client/dist` (not `dist`)
2. **Build logs** should end with `Vercel build verified` and `Client bundle validation passed`
3. **CI smoke test** must pass (`production-smoke.spec.js`)
4. **DevTools → Network** — `/assets/*.js` must return `200` + `application/javascript` (not HTML)
5. **DevTools → Console** — check for `ReferenceError` / `is not defined` (common cause: missing imports in `apiClient.js`)
6. **API check:** `curl https://your-app.vercel.app/api/health`

## 7. Verify after deploy

**Required before considering a release healthy:**

1. GitHub Actions `Build client and test server` job passes (includes production smoke test).
2. `curl https://your-app.vercel.app/api/health` returns `"status":"ok"`.
3. Homepage renders (not a blank `#root`) — smoke test covers this in CI; manually verify if needed.

```bash
curl -s https://your-app.vercel.app/api/health | python3 -m json.tool
npm run test:smoke:production   # local: build client first
```

### Production smoke test (CI)

On every push/PR, CI will:

1. Build `client/dist`
2. Run `scripts/validate-client-bundle.mjs` (critical imports, axios chunk linkage)
3. Serve the production build via `vite preview`
4. Run Playwright `e2e/production-smoke.spec.js` — fails on:
   - Empty `#root` / blank screen
   - `pageerror` (e.g. `ReferenceError: axios is not defined`)
   - Uncaught promise rejections
   - Application `console.error` crashes

**Do not deploy** if the smoke test job fails.

Test: login, messaging (instant via Realtime), file uploads (Supabase storage).

## 8. Notes

- **File uploads** use in-memory multer → Supabase (Vercel-compatible)
- **Messaging** uses Supabase Realtime, not Socket.io
- **`server/server.js`** is for local dev only; Vercel uses `api/index.js`
- **Cron** runs via Vercel cron + `CRON_SECRET`, not `node-cron`
