import { StartupProfile } from "../models/StartupProfiles.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { getInvestorProfileByUserId } from "../repositories/InvestorProfileRepository.js";

export const getProfileCompletionStatus = async (userId, userType) => {
  if (userType === "startup") {
    const profile = await getStartupProfileByUserId(userId);
    if (!profile) {
      return {
        hasProfile: false,
        isComplete: false,
        completionPercentage: 0,
        incompleteSections: [],
      };
    }

    const model = new StartupProfile(profile);
    model.parseJsonFields();
    const completion = model.calculateCompletion();
    return { hasProfile: true, ...completion };
  }

  if (userType === "investor") {
    const profile = await getInvestorProfileByUserId(userId);
    if (!profile) {
      return {
        hasProfile: false,
        isComplete: false,
        completionPercentage: 0,
        incompleteSections: [],
      };
    }

    const model = new InvestorProfile(profile);
    model.parseJsonFields();
    const completion = model.calculateCompletion();
    return { hasProfile: true, ...completion };
  }

  return {
    hasProfile: false,
    isComplete: false,
    completionPercentage: 0,
    incompleteSections: [],
  };
};
