export const getRoleHomePath = (userType) =>
  userType === "investor" ? "/startups" : "/investors";

export const onboardingPathFor = (userType) =>
  userType === "investor" ? "/investor-onboarding" : "/onboarding";
