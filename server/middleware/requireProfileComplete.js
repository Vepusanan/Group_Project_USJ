import { hasCompletedOnboarding } from "../services/onboardingService.js";
import { getProfileCompletionStatus } from "../services/profileCompletionService.js";

const onboardingRequiredResponse = (res) =>
  res.status(403).json({
    success: false,
    error: "onboarding_required",
    message: "Complete onboarding before accessing this feature.",
  });

/**
 * Requires onboarding wizard completion (users.onboarding_completed_at).
 * Profile field completion % is NOT used here — see profile completion endpoints.
 */
export const requireProfileComplete = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }

  if (!hasCompletedOnboarding(req.user)) {
    return onboardingRequiredResponse(res);
  }

  next();
};

/** For optionalAuth routes: anonymous users pass through; authenticated users must have completed onboarding. */
export const requireProfileCompleteIfAuthenticated = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  return requireProfileComplete(req, res, next);
};

/**
 * Optional middleware for routes that require 100% profile field completion.
 * Not used for core navigation features — only attach where explicitly needed.
 */
export const requireFullProfileFields = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }

  if (!hasCompletedOnboarding(req.user)) {
    return onboardingRequiredResponse(res);
  }

  try {
    const status = await getProfileCompletionStatus(
      req.user.id,
      req.user.user_type,
    );

    if (!status.isFullyComplete) {
      return res.status(403).json({
        success: false,
        error: "profile_incomplete",
        message: "Complete your profile fields to access this feature.",
        completionPercentage: status.completionPercentage,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
