import { getProfileCompletionStatus } from "../services/profileCompletionService.js";
import { onboardingPathForUserType } from "./authRedirects.js";
import {
  buildAuthStatePayload,
  validateAuthSessionContract,
} from "../../shared/authStateMachine.mjs";

export const verificationPathForEmail = (email) =>
  `/verify-email?email=${encodeURIComponent(email)}`;

/**
 * Authoritative auth session payload returned by /auth/me and post-auth endpoints.
 */
export async function buildAuthSession(user, serializeUser) {
  const serialized = serializeUser(user);

  if (!user.email_verified) {
    const requiredRoute = verificationPathForEmail(user.email);
    const authState = buildAuthStatePayload({
      emailVerified: false,
      onboardingComplete: false,
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

  const status = await getProfileCompletionStatus(user.id, user.user_type);
  const onboardingComplete = Boolean(status.hasProfile && status.isComplete);
  const onboardingPath = onboardingPathForUserType(user.user_type);
  const redirectPath = onboardingComplete ? "/dashboard" : onboardingPath;
  const authState = buildAuthStatePayload({
    emailVerified: true,
    onboardingComplete,
    requiredRoute: onboardingComplete ? null : onboardingPath,
  });

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
