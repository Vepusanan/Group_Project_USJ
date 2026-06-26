import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_STATUS,
  buildAuthStatePayload,
  deriveAuthStatus,
  getAuthState,
  resolveAuthRouteDecision,
  validateAuthSessionContract,
  GUARD_MODE,
} from "../../shared/authStateMachine.mjs";

const ONBOARDED_AT = "2024-06-01T12:00:00.000Z";

test("deriveAuthStatus maps flags to canonical states", () => {
  assert.equal(
    deriveAuthStatus({ emailVerified: false, onboardingCompletedAt: null }, true),
    AUTH_STATUS.EMAIL_UNVERIFIED,
  );
  assert.equal(
    deriveAuthStatus({ emailVerified: true, onboardingCompletedAt: null }, true),
    AUTH_STATUS.ONBOARDING_REQUIRED,
  );
  assert.equal(
    deriveAuthStatus({ emailVerified: true, onboardingCompletedAt: ONBOARDED_AT }, true),
    AUTH_STATUS.AUTHENTICATED_READY,
  );
  assert.equal(
    deriveAuthStatus({ emailVerified: true, onboardingCompletedAt: ONBOARDED_AT }, false),
    AUTH_STATUS.UNAUTHENTICATED,
  );
});

test("getAuthState is the only interpretation of session payloads", () => {
  const unauth = getAuthState(null);
  assert.equal(unauth.status, AUTH_STATUS.UNAUTHENTICATED);

  const unverified = getAuthState({
    user: { id: "1", email: "a@test.com" },
    redirectPath: "/verify-email?email=a%40test.com",
    authState: buildAuthStatePayload({
      emailVerified: false,
      onboardingCompletedAt: null,
      requiredRoute: "/verify-email?email=a%40test.com",
    }),
  });
  assert.equal(unverified.status, AUTH_STATUS.EMAIL_UNVERIFIED);

  const onboarding = getAuthState({
    user: { id: "1" },
    redirectPath: "/onboarding",
    authState: buildAuthStatePayload({
      emailVerified: true,
      onboardingCompletedAt: null,
      requiredRoute: "/onboarding",
    }),
  });
  assert.equal(onboarding.status, AUTH_STATUS.ONBOARDING_REQUIRED);

  const ready = getAuthState({
    user: { id: "1" },
    redirectPath: "/dashboard",
    authState: buildAuthStatePayload({
      emailVerified: true,
      onboardingCompletedAt: ONBOARDED_AT,
      requiredRoute: null,
    }),
  });
  assert.equal(ready.status, AUTH_STATUS.AUTHENTICATED_READY);
});

test("validateAuthSessionContract rejects ambiguous states", () => {
  const bad = validateAuthSessionContract({
    user: { id: "1" },
    redirectPath: "/dashboard",
    authState: {
      status: AUTH_STATUS.AUTHENTICATED_READY,
      emailVerified: false,
      onboardingComplete: true,
      onboardingCompletedAt: ONBOARDED_AT,
      requiredRoute: null,
    },
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.length > 0);
});

test("route decisions are deterministic per guard mode", () => {
  const unverified = getAuthState({
    user: { id: "1" },
    redirectPath: "/verify-email?email=a%40test.com",
    authState: buildAuthStatePayload({
      emailVerified: false,
      onboardingCompletedAt: null,
      requiredRoute: "/verify-email?email=a%40test.com",
    }),
  });

  assert.deepEqual(
    resolveAuthRouteDecision(unverified, "/connections", GUARD_MODE.APP),
    { redirect: "/verify-email?email=a%40test.com" },
  );
  assert.deepEqual(
    resolveAuthRouteDecision(unverified, "/verify-email", GUARD_MODE.VERIFY_EMAIL),
    { allow: true },
  );

  const ready = getAuthState({
    user: { id: "1" },
    redirectPath: "/dashboard",
    authState: buildAuthStatePayload({
      emailVerified: true,
      onboardingCompletedAt: ONBOARDED_AT,
      requiredRoute: null,
    }),
  });

  assert.deepEqual(
    resolveAuthRouteDecision(ready, "/login", GUARD_MODE.PUBLIC_AUTH),
    { redirect: "/dashboard" },
  );
});
