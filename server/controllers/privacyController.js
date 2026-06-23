import {
  getPrivacySettingsByUserId,
  createDefaultPrivacySettings,
  createPrivacySettings,
  updatePrivacySettings as updatePrivacySettingsRepo,
  privacySettingsExist,
} from "../repositories/PrivacySettingsRepository.js";

/**
 * Get Privacy Settings
 * GET /api/settings/privacy
 * 
 * Returns the current user's privacy settings.
 * If no settings exist yet, creates default settings.
 */
export const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get existing privacy settings
    let settings = await getPrivacySettingsByUserId(userId);

    // If no settings exist, create default settings
    if (!settings) {
      settings = await createDefaultPrivacySettings(userId);
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get privacy settings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while retrieving privacy settings",
    });
  }
};

/**
 * Update Privacy Settings
 * PUT /api/settings/privacy
 * 
 * Updates the current user's privacy settings.
 * Creates settings if they don't exist yet.
 */
export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      profile_visibility,
      connection_request_setting,
      show_connections_list,
      show_activity_status,
    } = req.body;

    // Validate profile_visibility if provided
    if (profile_visibility && !["public", "connections_only"].includes(profile_visibility)) {
      return res.status(400).json({
        success: false,
        error: "profile_visibility must be either 'public' or 'connections_only'",
      });
    }

    // Validate boolean fields if provided
    const booleanFields = {
      connection_request_setting,
      show_connections_list,
      show_activity_status,
    };

    for (const [field, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== "boolean") {
        return res.status(400).json({
          success: false,
          error: `${field} must be a boolean value`,
        });
      }
    }

    // Check if settings exist
    const settingsExist = await privacySettingsExist(userId);

    let result;
    if (!settingsExist) {
      // Create new settings with provided values
      result = await createPrivacySettings(userId, {
        profile_visibility,
        connection_request_setting,
        show_connections_list,
        show_activity_status,
      });
    } else {
      // Update existing settings
      const updates = {
        profile_visibility,
        connection_request_setting,
        show_connections_list,
        show_activity_status,
      };

      result = await updatePrivacySettingsRepo(userId, updates);

      // If no updates were provided, get current settings
      if (!result) {
        result = await getPrivacySettingsByUserId(userId);
      }
    }

    res.status(200).json({
      success: true,
      message: "Privacy settings updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update privacy settings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while updating privacy settings",
    });
  }
};
