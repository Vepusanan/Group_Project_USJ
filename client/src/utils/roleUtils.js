export const getRoleHomePath = (userType) => {
  if (userType === "admin") return "/admin/analytics";
  return userType === "investor" ? "/startups" : "/investors";
};

export const onboardingPathFor = (userType) =>
  userType === "investor" ? "/investor-onboarding" : "/onboarding";
