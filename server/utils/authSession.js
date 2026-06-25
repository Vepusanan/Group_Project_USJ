import { getProfileCompletionStatus } from "../services/profileCompletionService.js";
import { onboardingPathForUserType } from "./authRedirects.js";

export const verificationPathForEmail = (email) =>
  `/verify-email?email=${encodeURIComponent(email)}`;

/**
 * Authoritative auth session payload returned by /auth/me and post-auth endpoints.
 */
export async function buildAuthSession(user, serializeUser) {
  const serialized = serializeUser(user);

  if (!user.email_verified) {
    const requiredRoute = verificationPathForEmail(user.email);
    return {
      user: serialized,
      redirectPath: requiredRoute,
      authState: {
        emailVerified: false,
        onboardingComplete: false,
        requiredRoute,
      },
    };
  }

  const status = await getProfileCompletionStatus(user.id, user.user_type);
  const onboardingComplete = Boolean(status.hasProfile && status.isComplete);
  const onboardingPath = onboardingPathForUserType(user.user_type);
  const redirectPath = onboardingComplete ? "/dashboard" : onboardingPath;

  return {
    user: serialized,
    redirectPath,
    authState: {
      emailVerified: true,
      onboardingComplete,
      requiredRoute: onboardingComplete ? null : onboardingPath,
    },
  };
}
