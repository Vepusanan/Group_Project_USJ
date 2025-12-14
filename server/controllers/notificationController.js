import {
  getNotificationSettingsByUserId,
  createDefaultNotificationSettings,
  createNotificationSettings,
  updateNotificationSettings as updateNotificationSettingsRepo,
  notificationSettingsExist,
} from "../repositories/NotificationSettingsRepository.js";

/**
 * Get Notification Settings
 * GET /api/settings/notifications
 * 
 * Returns the current user's notification settings.
 * If no settings exist yet, creates default settings.
 */
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get existing notification settings
    let settings = await getNotificationSettingsByUserId(userId);

    // If no settings exist, create default settings
    if (!settings) {
      settings = await createDefaultNotificationSettings(userId);
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while retrieving notification settings",
    });
  }
};

/**
 * Update Notification Settings
 * PUT /api/settings/notifications
 * 
 * Updates the current user's notification settings.
 * Creates settings if they don't exist yet.
 */
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      notification_frequency,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates,
    } = req.body;

    // Validate notification_frequency if provided
    if (notification_frequency && !["instant", "daily", "weekly"].includes(notification_frequency)) {
      return res.status(400).json({
        success: false,
        error: "notification_frequency must be 'instant', 'daily', or 'weekly'",
      });
    }

    // Validate boolean fields if provided
    const booleanFields = {
      email_connection_requests,
      email_messages,
      email_profile_views,
      email_weekly_digest,
      inapp_connection_requests,
      inapp_messages,
      inapp_profile_views,
      inapp_system_updates,
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
    const settingsExist = await notificationSettingsExist(userId);

    let result;
    if (!settingsExist) {
      // Create new settings with provided values
      result = await createNotificationSettings(userId, {
        email_connection_requests,
        email_messages,
        email_profile_views,
        email_weekly_digest,
        notification_frequency,
        inapp_connection_requests,
        inapp_messages,
        inapp_profile_views,
        inapp_system_updates,
      });
    } else {
      // Update existing settings
      const updates = {
        email_connection_requests,
        email_messages,
        email_profile_views,
        email_weekly_digest,
        notification_frequency,
        inapp_connection_requests,
        inapp_messages,
        inapp_profile_views,
        inapp_system_updates,
      };

      result = await updateNotificationSettingsRepo(userId, updates);

      // If no updates were provided, get current settings
      if (!result) {
        result = await getNotificationSettingsByUserId(userId);
      }
    }

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while updating notification settings",
    });
  }
};
