# Authentication system behavior contract

This document defines how auth and onboarding must behave in production. Code and tests should enforce these rules.

## Single source of truth

| Rule | Implementation |
|------|----------------|
| Auth state authority | `GET /api/auth/me` only |
| State interpretation | `getAuthState()` in `shared/authStateMachine.mjs` — **the only** way to derive auth status |
| Route decisions | `resolveAuthRouteDecision()` + `useAuthRouteGuard()` — no scattered boolean checks |
| Frontend context | Mirrors `/auth/me` via `authStatus` / `authMachine` from `getAuthState()` |
| Post-auth redirect | Backend `redirectPath` from login/register/verify responses |

The frontend `AuthContext` calls `/auth/me` on:

- Initial app load
- Every client-side route change (`RouteChangeAuthSync`)
- Tab focus (`visibilitychange`)
- Cross-tab sync (`storage` + `BroadcastChannel` via `auth:revision`)
- After login, logout, verify, token refresh, onboarding submit

`localStorage.userData` is a display cache only. It is **not** used for auth decisions.

## Canonical auth states

| Status | Meaning | Default route |
|--------|---------|---------------|
| `UNAUTHENTICATED` | No session | Public routes only |
| `UNVERIFIED` | Session exists, email not verified | `/verify-email?email=...` |
| `ONBOARDING_INCOMPLETE` | Verified, profile incomplete | `/onboarding` or `/investor-onboarding` |
| `VERIFIED_READY` | Fully onboarded | `/dashboard` and app routes |

## Auth session shape (`/auth/me`)

```json
{
  "success": true,
  "user": { "id", "email", "fullName", "userType", "emailVerified", "isAdmin" },
  "redirectPath": "/onboarding | /investor-onboarding | /dashboard | /verify-email?email=...",
  "authState": {
    "status": "UNVERIFIED | ONBOARDING_INCOMPLETE | VERIFIED_READY",
    "emailVerified": true,
    "onboardingComplete": false,
    "requiredRoute": "/onboarding | /verify-email?email=... | null"
  }
}
```

`buildAuthSession()` validates the contract via `validateAuthSessionContract()` before returning.

## Route gating (state machine)

All guards use `useAuthRouteGuard(guardMode)` — no independent `isVerified` / `isOnboarded` checks.

| Guard mode | Used for |
|------------|----------|
| `PUBLIC_AUTH` | `/login`, `/signup`, password reset |
| `VERIFY_EMAIL` | `/verify-email` |
| `PROTECTED` | Onboarding routes (auth required) |
| `APP` | Dashboard, connections, messages, etc. |

Guards show a full-screen spinner until `/auth/me` resolves (`isLoading` or `isRevalidating`).

## Session endpoints

| Endpoint | Middleware | Notes |
|----------|------------|-------|
| `GET /auth/me` | `protectSession` | Allows unverified users (returns `UNVERIFIED`) |
| Other protected APIs | `protect` | Blocks unverified users (403) |

Register and login issue sessions for unverified users so `/auth/me` can return `UNVERIFIED`.

## Cookies (production)

| Attribute | Value |
|-----------|--------|
| `HttpOnly` | `true` |
| `Secure` | `true` when deployed (`VERCEL=1` or `NODE_ENV=production`) |
| `SameSite` | `lax` (override via `AUTH_COOKIE_SAME_SITE`) |
| `Path` | `/` |
| `Domain` | unset (same-origin Vercel deploy) |

Tokens are never exposed in JSON responses or `localStorage`.

## Multi-tab synchronization

When auth changes in one tab (login, logout, verify, register), `notifyAuthChanged()` bumps `localStorage.auth:revision` and broadcasts on `BroadcastChannel`. Other tabs revalidate via `/auth/me` and update `authStatus`.

## CI validation

| Check | Script / test |
|-------|----------------|
| Auth contract | `scripts/validate-auth-state-contract.mjs` |
| State machine unit tests | `server/tests/authStateMachine.test.js` |
| Auth flow integration | `server/tests/authStateFlow.test.js` |
| E2E state transitions | `e2e/auth-state-machine.spec.js` |
| Startup smoke | `e2e/production-smoke.spec.js` |

## E2E coverage

See `e2e/auth-state-machine.spec.js`, `e2e/auth-hardening.spec.js`, `e2e/auth.spec.js`:

- Signup → `UNVERIFIED`
- Email verification → `ONBOARDING_INCOMPLETE`
- Onboarding complete → `VERIFIED_READY`
- Refresh persistence
- Multi-tab sync
- Token refresh / revalidation
