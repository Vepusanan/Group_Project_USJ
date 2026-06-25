import { profileService } from "../services/profileService";
import { investorProfileService } from "../services/investorProfileService";
import { onboardingPathFor } from "./roleUtils";

const getProfileService = (userType) =>
  userType === "investor" ? investorProfileService : profileService;

const extractCompletion = (result) => result?.data?.data ?? result?.data ?? null;

/**
 * Resolves where an authenticated user should land after login or email verification.
 */
export const resolvePostAuthRedirect = async (user) => {
  if (!user?.userType) {
    return "/login";
  }

  if (user.emailVerified === false) {
    const email = user.email ? `?email=${encodeURIComponent(user.email)}` : "";
    return `/verify-email${email}`;
  }

  const service = getProfileService(user.userType);
  const profileResult = await service.getMyProfile();
  const profile = profileResult?.data?.data ?? profileResult?.data ?? null;
  const hasProfile = Boolean(
    profile?.startup_profile_id ||
      profile?.investor_profile_id ||
      profile?.id,
  );

  if (!hasProfile) {
    return onboardingPathFor(user.userType);
  }

  const completionResult = await service.getProfileCompletion?.();
  if (completionResult?.success) {
    const completion = extractCompletion(completionResult);
    if (completion?.isComplete) {
      return "/dashboard";
    }
  }

  return onboardingPathFor(user.userType);
};

export const verificationRequiredPath = (email) =>
  `/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`;
