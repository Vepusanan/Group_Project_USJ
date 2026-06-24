import { getProfileCompletionStatus } from "../services/profileCompletionService.js";

const onboardingRequiredResponse = (res, { completionPercentage } = {}) =>
  res.status(403).json({
    success: false,
    error: "onboarding_required",
    message: "Complete your profile onboarding before accessing this feature.",
    ...(completionPercentage !== undefined
      ? { completionPercentage }
      : {}),
  });

export const requireProfileComplete = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }

  try {
    const status = await getProfileCompletionStatus(
      req.user.id,
      req.user.user_type,
    );

    if (!status.hasProfile) {
      return onboardingRequiredResponse(res);
    }

    if (!status.isComplete) {
      return onboardingRequiredResponse(res, {
        completionPercentage: status.completionPercentage,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/** For optionalAuth routes: anonymous users pass through; authenticated users must be complete. */
export const requireProfileCompleteIfAuthenticated = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  return requireProfileComplete(req, res, next);
};
