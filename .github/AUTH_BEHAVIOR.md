# Authentication system behavior contract

This document defines how auth and onboarding must behave in production. Code and tests should enforce these rules.

## Single source of truth

| Rule | Implementation |
|------|----------------|
| Auth state authority | `GET /api/auth/me` only |
| Route decisions | `authState.requiredRoute` and `redirectPath` from `/auth/me` |
| Frontend context | Mirrors `/auth/me`; never decides auth independently |
| Post-login redirect | Backend `redirectPath` from login/verify responses |
| Onboarding gate | `authState.onboardingComplete` from `/auth/me` |

The frontend `AuthContext` calls `/auth/me` on:

- Initial app load
- Every client-side route change (`RouteChangeAuthSync`)
- Tab focus (`visibilitychange`)
- Cross-tab sync (`storage` + `BroadcastChannel` via `auth:revision`)
- After login, logout, verify, token refresh, onboarding submit

`localStorage.userData` is a display cache only. It is **not** used for `isAuthenticated`.

## Auth session shape (`/auth/me`)

```json
{
  "success": true,
  "user": { "id", "email", "fullName", "userType", "emailVerified", "isAdmin" },
  "redirectPath": "/onboarding | /investor-onboarding | /dashboard | /verify-email?email=...",
  "authState": {
    "emailVerified": true,
    "onboardingComplete": false,
    "requiredRoute": "/onboarding | null"
  }
}
```

## Route gating (deterministic)

| State | Allowed routes | Redirect |
|-------|----------------|----------|
| Anonymous | Public (`/login`, `/signup`, `/`, etc.) | Protected → `/login` |
| Authenticated, unverified | `/verify-email` | Protected → `/verify-email?email=...` |
| Verified, onboarding incomplete | Onboarding routes | App routes → `requiredRoute` |
| Verified, onboarding complete | Full app | Public auth routes → `redirectPath` |

Guards show a full-screen spinner until `/auth/me` resolves (`isLoading` or `isRevalidating`).

## Cookies (production)

| Attribute | Value |
|-----------|--------|
| `HttpOnly` | `true` |
| `Secure` | `true` when deployed (`VERCEL=1` or `NODE_ENV=production`) |
| `SameSite` | `lax` (override via `AUTH_COOKIE_SAME_SITE`) |
| `Path` | `/` |
| `Domain` | unset (same-origin Vercel deploy) |

Tokens are never exposed in JSON responses or `localStorage`.

## URL configuration (fail-fast)

| Environment | Rule |
|-------------|------|
| Production | `FRONTEND_URL` required, non-localhost |
| Development | `FRONTEND_URL` or `http://localhost:3000` |

No `BASE_URL` fallback, no `VERCEL_URL` guessing. `/api/health` reports `appUrl` and returns 503 if misconfigured.

## Multi-tab synchronization

When auth changes in one tab (login, logout, verify), `notifyAuthChanged()` bumps `localStorage.auth:revision` and broadcasts on `BroadcastChannel`. Other tabs revalidate via `/auth/me`.

## CI/CD deployment

**Single path:** Vercel Git Integration (push to `main` → Vercel auto-deploy).

GitHub Actions runs build + test only. Vercel deploy jobs in CI are disabled to avoid dual-deployment confusion. To use GitHub Actions deploy instead, configure `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` and re-enable the deploy workflow.

## E2E coverage

See `e2e/auth.spec.js` and `e2e/auth-hardening.spec.js`:

- Session persistence after refresh
- Incomplete onboarding blocked from app routes
- Multi-tab login sync
- Invalid credentials rejected
