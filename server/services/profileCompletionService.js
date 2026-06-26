import { StartupProfile } from "../models/StartupProfiles.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { getInvestorProfileByUserId } from "../repositories/InvestorProfileRepository.js";

/**
 * Profile field completion — used only for feature gating and analytics.
 * Must NOT be used for auth routing or onboarding state.
 */
export const getProfileCompletionStatus = async (userId, userType) => {
  if (userType === "startup") {
    const profile = await getStartupProfileByUserId(userId);
    if (!profile) {
      return {
        hasProfile: false,
        completionPercent: 0,
        completionPercentage: 0,
        isFullyComplete: false,
        isComplete: false,
        incompleteSections: [],
      };
    }

    const model = new StartupProfile(profile);
    model.parseJsonFields();
    const completion = model.calculateCompletion();
    return {
      hasProfile: true,
      completionPercent: completion.completionPercentage,
      completionPercentage: completion.completionPercentage,
      isFullyComplete: completion.isComplete,
      isComplete: completion.isComplete,
      incompleteSections: completion.incompleteSections,
    };
  }

  if (userType === "investor") {
    const profile = await getInvestorProfileByUserId(userId);
    if (!profile) {
      return {
        hasProfile: false,
        completionPercent: 0,
        completionPercentage: 0,
        isFullyComplete: false,
        isComplete: false,
        incompleteSections: [],
      };
    }

    const model = new InvestorProfile(profile);
    model.parseJsonFields();
    const completion = model.calculateCompletion();
    return {
      hasProfile: true,
      completionPercent: completion.completionPercentage,
      completionPercentage: completion.completionPercentage,
      isFullyComplete: completion.isComplete,
      isComplete: completion.isComplete,
      incompleteSections: completion.incompleteSections,
    };
  }

  return {
    hasProfile: false,
    completionPercent: 0,
    completionPercentage: 0,
    isFullyComplete: false,
    isComplete: false,
    incompleteSections: [],
  };
};
