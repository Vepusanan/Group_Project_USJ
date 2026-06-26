import { hasCompletedOnboarding } from "../services/onboardingService.js";

export const onboardingPathForUserType = (userType) =>
  userType === "investor" ? "/investor-onboarding" : "/onboarding";

export const resolvePostAuthRedirectPath = async (user) => {
  const onboardingPath = onboardingPathForUserType(user.user_type);

  if (!hasCompletedOnboarding(user)) {
    return onboardingPath;
  }

  return "/dashboard";
};
