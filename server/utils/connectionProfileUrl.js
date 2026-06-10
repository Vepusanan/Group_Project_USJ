import { getFrontendBaseUrl } from "./emailServices.js";

export const buildProfileUrl = (userType, profileId) => {
  if (!profileId) {
    return `${getFrontendBaseUrl()}/connections`;
  }

  const segment = userType === "investor" ? "investors" : "startups";
  return `${getFrontendBaseUrl()}/${segment}/${profileId}`;
};
