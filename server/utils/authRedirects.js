import { getProfileCompletionStatus } from "../services/profileCompletionService.js";

export const onboardingPathForUserType = (userType) =>
  userType === "investor" ? "/investor-onboarding" : "/onboarding";

export const resolvePostAuthRedirectPath = async (user) => {
  const onboardingPath = onboardingPathForUserType(user.user_type);
  const status = await getProfileCompletionStatus(user.id, user.user_type);

  if (!status.hasProfile || !status.isComplete) {
    return onboardingPath;
  }

  return "/dashboard";
};
