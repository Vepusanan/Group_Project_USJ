# Railway deployment (full stack)

Deploy **frontend + backend + Socket.io** as a single Railway service from the repository root.

## Architecture

```text
https://your-app.up.railway.app
├── /              → React SPA (client/dist)
├── /api/*         → Express REST API
├── /uploads/*     → local uploads (dev; use Supabase in prod)
└── socket.io      → real-time messaging
```

Config: [`railway.toml`](../railway.toml) at repo root.

## 1. Create the Railway project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select this repository
3. **Root directory:** `.` (repository root)
4. Railway reads `railway.toml` for build/start commands

Generate a public domain: **Settings → Networking → Generate Domain**

## 2. Environment variables

Set in **Railway → Service → Variables** (copy from `server/.env`):

### Required

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase pooler URL |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | or `SUPABASE_SERVICE_KEY` |
| `JWT_SECRET` | long random string |
| `JWT_VERIFY_SECRET` | long random string |
| `BASE_URL` | `https://your-app.up.railway.app` |
| `FRONTEND_URL` | `https://your-app.up.railway.app` |
| `ADMIN_EMAILS` | `you@example.com` |

### Email

| Variable | Notes |
|----------|--------|
| `EMAIL_SMTP_HOST` | e.g. `smtp-relay.brevo.com` |
| `EMAIL_SMTP_PORT` | `587` |
| `EMAIL_SMTP_USER` | |
| `EMAIL_PASS` | |
| `EMAIL_FROM` | verified sender |

### Build-time (set on Railway so Vite embeds `/api`)

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `/api` |

Already included in `railway.toml` build command; setting it in Railway Variables is a good backup.

### Optional

`GEMINI_API_KEY`, `CRON_TIMEZONE`, `AUTH_COOKIE_SAME_SITE`, etc. — see `server/.env.example`.

**Do not set** `VITE_SOCKET_URL` for same-origin deploy — Socket.io uses the current host automatically.

## 3. Build and start (automatic)

| Phase | Command |
|-------|---------|
| **Build** | `npm ci` (client + server) → `vite build` with `VITE_API_URL=/api` |
| **Start** | `node server/server.js` |
| **Health** | `GET /api/health` |

Local production smoke test:

```bash
npm run build:production
NODE_ENV=production PORT=5001 npm start
# open http://localhost:5001
```

## 4. CI locally

```bash
npm run ci
```

## 5. Verify after deploy

```bash
curl https://your-app.up.railway.app/api/health
```

Open the app URL in a browser — login, messaging (Socket.io), and uploads should work.

## 6. Cron jobs

Nightly cleanup runs via `node-cron` inside `server/server.js` (02:00, `CRON_TIMEZONE` or `Asia/Colombo`). No external cron setup required.

## 7. Notes

- **Cookies:** same domain for SPA and API — `AUTH_COOKIE_SAME_SITE=strict` works out of the box.
- **File storage:** use Supabase; `server/uploads/` is ephemeral on Railway.
- **Vercel files** (`vercel.json`, `api/index.js`) are unused on Railway — safe to ignore.
- **Disable frontend serving** (API-only): `SERVE_FRONTEND=false`

## 8. Custom domain

Railway → **Settings → Networking → Custom Domain** → update `BASE_URL` and `FRONTEND_URL` → redeploy.
