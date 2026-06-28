import { getPrivacySettingsByUserId } from "../repositories/PrivacySettingsRepository.js";
import { isUsersConnected } from "../repositories/ConnectionRepository.js";

export const canViewProfile = async (
  profileUserId,
  requestingUserId,
  { requesterIsAdmin = false } = {},
) => {
  if (requestingUserId && profileUserId === requestingUserId) {
    return { canView: true, isOwner: true, isConnected: false };
  }

  // Admins can view any profile (including private ones) for moderation —
  // e.g. inspecting a reported account from the fraud-reports queue.
  if (requesterIsAdmin) {
    return { canView: true, isOwner: false, isConnected: false };
  }

  const connected = requestingUserId
    ? await isUsersConnected(profileUserId, requestingUserId)
    : false;

  const privacySettings = await getPrivacySettingsByUserId(profileUserId);
  if (!privacySettings) {
    return { canView: true, isOwner: false, isConnected: connected };
  }

  const { profile_visibility } = privacySettings;

  if (profile_visibility === "public") {
    return { canView: true, isOwner: false, isConnected: connected };
  }

  if (profile_visibility === "connections_only" && !requestingUserId) {
    return { canView: false, isOwner: false, isConnected: false };
  }

  if (profile_visibility === "connections_only") {
    return { canView: connected, isOwner: false, isConnected: connected };
  }

  return { canView: true, isOwner: false, isConnected: connected };
};
