/**
 * Canonical authentication state machine — single source of truth for interpreting
 * `/auth/me` (and equivalent post-auth) responses on both server and client.
 *
 * Onboarding routing uses `onboardingCompletedAt` (wizard submitted once).
 * Profile completion % is never used for auth state.
 */

export const AUTH_STATUS = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  EMAIL_UNVERIFIED: "EMAIL_UNVERIFIED",
  ONBOARDING_REQUIRED: "ONBOARDING_REQUIRED",
  AUTHENTICATED_READY: "AUTHENTICATED_READY",
});

const VALID_STATUSES = new Set(Object.values(AUTH_STATUS));

export const onboardingCompleteFromTimestamp = (onboardingCompletedAt) =>
  onboardingCompletedAt != null && onboardingCompletedAt !== "";

/**
 * Derive status from session flags (used when `authState.status` is absent).
 */
export function deriveAuthStatus(
  { emailVerified, onboardingCompletedAt, onboardingComplete },
  hasUser,
) {
  if (!hasUser) return AUTH_STATUS.UNAUTHENTICATED;
  if (!emailVerified) return AUTH_STATUS.EMAIL_UNVERIFIED;
  const onboarded =
    onboardingComplete !== undefined
      ? Boolean(onboardingComplete)
      : onboardingCompleteFromTimestamp(onboardingCompletedAt);
  if (!onboarded) return AUTH_STATUS.ONBOARDING_REQUIRED;
  return AUTH_STATUS.AUTHENTICATED_READY;
}

/**
 * The ONLY supported way to interpret an `/auth/me` (or login/verify/register) payload.
 * @param {{ user?: object, authState?: object, redirectPath?: string } | null | undefined} session
 */
export function getAuthState(session) {
  const user = session?.user ?? null;
  const hasUser = Boolean(user);

  if (!hasUser) {
    return {
      status: AUTH_STATUS.UNAUTHENTICATED,
      user: null,
      emailVerified: false,
      onboardingComplete: false,
      onboardingCompletedAt: null,
      requiredRoute: null,
      redirectPath: "/login",
    };
  }

  const raw = session?.authState ?? {};
  const emailVerified = Boolean(raw.emailVerified);
  const onboardingCompletedAt = raw.onboardingCompletedAt ?? null;
  const onboardingComplete =
    raw.onboardingComplete !== undefined
      ? Boolean(raw.onboardingComplete)
      : onboardingCompleteFromTimestamp(onboardingCompletedAt);
  const status =
    raw.status && VALID_STATUSES.has(raw.status)
      ? raw.status
      : deriveAuthStatus(
          { emailVerified, onboardingCompletedAt, onboardingComplete },
          true,
        );

  return {
    status,
    user,
    emailVerified,
    onboardingComplete,
    onboardingCompletedAt,
    requiredRoute: raw.requiredRoute ?? null,
    redirectPath: session?.redirectPath ?? null,
  };
}

export const GUARD_MODE = Object.freeze({
  PUBLIC_AUTH: "public_auth",
  VERIFY_EMAIL: "verify_email",
  PROTECTED: "protected",
  APP: "app",
});

const PUBLIC_AUTH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

const ONBOARDING_PREFIXES = ["/onboarding", "/investor-onboarding"];

export function classifyRoute(pathname) {
  if (pathname === "/verify-email" || pathname.startsWith("/verify-email?")) {
    return "verify_email";
  }
  if (ONBOARDING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "onboarding";
  }
  if (PUBLIC_AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "public_auth";
  }
  if (pathname === "/" || pathname === "/terms" || pathname === "/privacy") {
    return "public_content";
  }
  return "app";
}

/**
 * Deterministic route decision for a guard mode and current pathname.
 * @returns {{ allow: true } | { redirect: string }}
 */
export function resolveAuthRouteDecision(machine, pathname, guardMode) {
  const { status, requiredRoute, redirectPath } = machine;
  const routeKind = classifyRoute(pathname);

  switch (status) {
    case AUTH_STATUS.UNAUTHENTICATED:
      if (guardMode === GUARD_MODE.PROTECTED || guardMode === GUARD_MODE.APP) {
        return { redirect: "/login" };
      }
      return { allow: true };

    case AUTH_STATUS.EMAIL_UNVERIFIED:
      if (guardMode === GUARD_MODE.VERIFY_EMAIL || routeKind === "verify_email") {
        return { allow: true };
      }
      return { redirect: requiredRoute || "/verify-email" };

    case AUTH_STATUS.ONBOARDING_REQUIRED:
      if (guardMode === GUARD_MODE.VERIFY_EMAIL) {
        return { redirect: redirectPath || requiredRoute || "/onboarding" };
      }
      if (guardMode === GUARD_MODE.PUBLIC_AUTH) {
        return { redirect: redirectPath || requiredRoute || "/onboarding" };
      }
      if (guardMode === GUARD_MODE.APP && routeKind === "app") {
        return { redirect: requiredRoute || "/onboarding" };
      }
      if (guardMode === GUARD_MODE.PROTECTED && routeKind === "onboarding") {
        return { allow: true };
      }
      if (guardMode === GUARD_MODE.PROTECTED) {
        return { allow: true };
      }
      return { allow: true };

    case AUTH_STATUS.AUTHENTICATED_READY:
      if (
        guardMode === GUARD_MODE.PUBLIC_AUTH ||
        guardMode === GUARD_MODE.VERIFY_EMAIL ||
        routeKind === "onboarding" ||
        routeKind === "verify_email"
      ) {
        return { redirect: redirectPath || "/dashboard" };
      }
      return { allow: true };

    default:
      return { redirect: "/login" };
  }
}

/**
 * Validate `/auth/me` authState contract — throws on ambiguous or inconsistent payloads.
 */
export function validateAuthSessionContract(session) {
  const errors = [];

  if (!session || typeof session !== "object") {
    errors.push("session must be an object");
    return { valid: false, errors };
  }

  if (!session.user || typeof session.user !== "object") {
    errors.push("session.user is required");
    return { valid: false, errors };
  }

  const authState = session.authState;
  if (!authState || typeof authState !== "object") {
    errors.push("session.authState is required when user is present");
    return { valid: false, errors };
  }

  if (typeof authState.emailVerified !== "boolean") {
    errors.push("authState.emailVerified must be a boolean");
  }
  if (typeof authState.onboardingComplete !== "boolean") {
    errors.push("authState.onboardingComplete must be a boolean");
  }
  if (
    authState.onboardingCompletedAt !== null &&
    authState.onboardingCompletedAt !== undefined &&
    typeof authState.onboardingCompletedAt !== "string"
  ) {
    errors.push("authState.onboardingCompletedAt must be an ISO string or null");
  }
  if (
    authState.requiredRoute !== null &&
    typeof authState.requiredRoute !== "string"
  ) {
    errors.push("authState.requiredRoute must be string or null");
  }
  if (authState.status !== undefined && !VALID_STATUSES.has(authState.status)) {
    errors.push(`authState.status must be one of ${[...VALID_STATUSES].join(", ")}`);
  }

  if (authState.emailVerified === false && authState.onboardingComplete === true) {
    errors.push("onboardingComplete cannot be true when emailVerified is false");
  }

  const machine = getAuthState(session);

  if (authState.status && authState.status !== machine.status) {
    errors.push(
      `authState.status (${authState.status}) disagrees with flags (${machine.status})`,
    );
  }

  if (machine.status === AUTH_STATUS.EMAIL_UNVERIFIED) {
    if (!authState.requiredRoute?.startsWith("/verify-email")) {
      errors.push("EMAIL_UNVERIFIED requires requiredRoute starting with /verify-email");
    }
    if (authState.onboardingComplete !== false) {
      errors.push("EMAIL_UNVERIFIED requires onboardingComplete === false");
    }
  }

  if (machine.status === AUTH_STATUS.ONBOARDING_REQUIRED) {
    if (!authState.requiredRoute) {
      errors.push("ONBOARDING_REQUIRED requires a non-null requiredRoute");
    }
    if (authState.emailVerified !== true) {
      errors.push("ONBOARDING_REQUIRED requires emailVerified === true");
    }
  }

  if (machine.status === AUTH_STATUS.AUTHENTICATED_READY) {
    if (authState.requiredRoute !== null) {
      errors.push("AUTHENTICATED_READY requires requiredRoute === null");
    }
    if (authState.onboardingComplete !== true) {
      errors.push("AUTHENTICATED_READY requires onboardingComplete === true");
    }
    if (!authState.onboardingCompletedAt) {
      errors.push("AUTHENTICATED_READY requires onboardingCompletedAt to be set");
    }
  }

  if (typeof session.redirectPath !== "string" || !session.redirectPath.startsWith("/")) {
    errors.push("redirectPath must be a path string starting with /");
  }

  return { valid: errors.length === 0, errors, machine };
}

/**
 * Build authState payload for API responses (server-side).
 */
export function buildAuthStatePayload({
  emailVerified,
  onboardingCompletedAt = null,
  requiredRoute,
}) {
  const onboardingComplete = onboardingCompleteFromTimestamp(onboardingCompletedAt);
  const status = deriveAuthStatus(
    { emailVerified, onboardingCompletedAt, onboardingComplete },
    true,
  );
  return {
    status,
    emailVerified: Boolean(emailVerified),
    onboardingComplete,
    onboardingCompletedAt: onboardingCompletedAt ?? null,
    requiredRoute: requiredRoute ?? null,
  };
}
