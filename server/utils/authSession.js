import { hasCompletedOnboarding } from "../services/onboardingService.js";
import { onboardingPathForUserType } from "./authRedirects.js";
import {
  buildAuthStatePayload,
  validateAuthSessionContract,
} from "../../shared/authStateMachine.mjs";

export const verificationPathForEmail = (email) =>
  `/verify-email?email=${encodeURIComponent(email)}`;

const toIsoTimestamp = (value) =>
  value instanceof Date ? value.toISOString() : value ?? null;

/**
 * Authoritative auth session payload returned by /auth/me and post-auth endpoints.
 */
export async function buildAuthSession(user, serializeUser) {
  const serialized = serializeUser(user);

  if (!user.email_verified) {
    const requiredRoute = verificationPathForEmail(user.email);
    const authState = buildAuthStatePayload({
      emailVerified: false,
      onboardingCompletedAt: null,
      requiredRoute,
    });
    const session = {
      user: serialized,
      redirectPath: requiredRoute,
      authState,
    };
    const { valid, errors } = validateAuthSessionContract(session);
    if (!valid) {
      throw new Error(`Invalid auth session contract: ${errors.join("; ")}`);
    }
    return session;
  }

  const onboardingComplete = hasCompletedOnboarding(user);
  const onboardingPath = onboardingPathForUserType(user.user_type);
  const redirectPath = onboardingComplete ? "/dashboard" : onboardingPath;
  const onboardingCompletedAt = toIsoTimestamp(user.onboarding_completed_at);
  const authState = buildAuthStatePayload({
    emailVerified: true,
    onboardingCompletedAt,
    requiredRoute: onboardingComplete ? null : onboardingPath,
  });

  if (process.env.AUTH_DEBUG === "1") {
    console.info("[auth/session] buildAuthSession", {
      userId: user.id,
      emailVerified: true,
      onboardingCompletedAt,
      onboardingComplete,
      authStatus: authState.status,
      redirectPath,
    });
  }

  const session = {
    user: serialized,
    redirectPath,
    authState,
  };
  const { valid, errors } = validateAuthSessionContract(session);
  if (!valid) {
    throw new Error(`Invalid auth session contract: ${errors.join("; ")}`);
  }
  return session;
}
