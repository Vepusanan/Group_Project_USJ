import api from "./apiClient";
import { API_ENDPOINTS } from "../utils/constants";

const cleanQueryParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

const getRequestErrorMessage = (error, fallback) => {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }
  if (!error.response) {
    return "Unable to reach the server. Check that the backend is running.";
  }
  return fallback;
};

export const apiService = {
  getCurrentUser: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME, {
        _silentAuth: true,
      });
      return {
        success: true,
        data: response.data.user,
      };
    } catch (error) {
      console.error("getCurrentUser error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get current user",
      };
    }
  },

  /**
   * Get all startups
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with startups data
   */
  getStartups: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.STARTUPS, {
        params: cleanQueryParams(params),
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("getStartups error:", error);
      return {
        success: false,
        error: getRequestErrorMessage(error, "Failed to get startups"),
      };
    }
  },

  parseNaturalLanguageSearch: async (phrase) => {
    try {
      const response = await api.post(
        "/startups/natural-language",
        { phrase },
        { timeout: 60000 },
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          getRequestErrorMessage(error, "Failed to parse search"),
      };
    }
  },

  /**
   * Get all investors
   * @param {Object} params - Query parameters
   * @returns {Promise} Response with investors data
   */
  getInvestors: async (params = {}) => {
    try {
      const response = await api.get(API_ENDPOINTS.INVESTORS, {
        params: cleanQueryParams(params),
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("getInvestors error:", error);
      return {
        success: false,
        error: getRequestErrorMessage(error, "Failed to get investors"),
      };
    }
  },

  /**
   * Create connection request
   * @param {string} userId - User ID to connect with
   * @param {string} message - Connection message
   * @returns {Promise} Response
   */
  createConnection: async (userId, message) => {
    try {
      const response = await api.post(API_ENDPOINTS.CONNECTIONS, {
        userId,
        message,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("createConnection error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create connection",
      };
    }
  },

  /**
   * Get user's connections
   * @returns {Promise} Response with connections data
   */
  getConnections: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.CONNECTIONS);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("getConnections error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get connections",
      };
    }
  },

  getStartupProfileById: async (profileId) => {
    try {
      const response = await api.get(`/startups/profile/${profileId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get startup profile",
      };
    }
  },

  getInvestorProfileById: async (profileId) => {
    try {
      const response = await api.get(`/investors/profile/${profileId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get investor profile",
      };
    }
  },

  getPendingConnectionRequests: async () => {
    try {
      const response = await api.get(`${API_ENDPOINTS.CONNECTIONS}/pending`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get pending requests",
      };
    }
  },

  getPendingSentConnections: async () => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.CONNECTIONS}/pending/sent`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to get pending sent requests",
      };
    }
  },

  getPendingReceivedConnections: async () => {
    try {
      const response = await api.get(
        `${API_ENDPOINTS.CONNECTIONS}/pending/received`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to get pending received requests",
      };
    }
  },

  respondToConnection: async (connectionId, status) => {
    try {
      const response = await api.patch(
        `${API_ENDPOINTS.CONNECTIONS}/${connectionId}`,
        { status },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to update connection request",
      };
    }
  },

  removeConnection: async (connectionId) => {
    try {
      const response = await api.delete(
        `${API_ENDPOINTS.CONNECTIONS}/${connectionId}`,
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to remove connection",
      };
    }
  },

  getConversations: async () => {
    try {
      const response = await api.get("/messages/conversations");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get conversations",
      };
    }
  },

  getConversationMessages: async (conversationId, params = {}) => {
    try {
      const response = await api.get(
        `/messages/conversation/${conversationId}`,
        { params },
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get messages",
      };
    }
  },

  sendMessage: async ({ receiverId, text, attachmentUrl = null }) => {
    try {
      const response = await api.post("/messages", {
        receiverId,
        text,
        attachmentUrl,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to send message",
      };
    }
  },

  uploadMessageAttachment: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append("attachment", file);

      const response = await api.post("/messages/attachments", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (!onProgress || !progressEvent.total) return;
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to upload attachment",
      };
    }
  },

  getNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get notifications",
      };
    }
  },

  markNotificationRead: async (notificationKey) => {
    try {
      const response = await api.post("/notifications/read", {
        notificationKey,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to mark notification as read",
      };
    }
  },

  getPrivacySettings: async () => {
    try {
      const response = await api.get("/settings/privacy");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get privacy settings",
      };
    }
  },

  updatePrivacySettings: async (payload) => {
    try {
      const response = await api.put("/settings/privacy", payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to update privacy settings",
      };
    }
  },

  getNotificationSettings: async () => {
    try {
      const response = await api.get("/settings/notifications");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to get notification settings",
      };
    }
  },

  updateNotificationSettings: async (payload) => {
    try {
      const response = await api.put("/settings/notifications", payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Failed to update notification settings",
      };
    }
  },

  changeEmail: async (newEmail) => {
    try {
      const response = await api.put("/account/email", { newEmail });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to change email",
      };
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const response = await api.put("/account/password", {
        currentPassword,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to change password",
      };
    }
  },

  exportAccountData: async () => {
    try {
      const response = await api.get("/account/export");
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to export account data",
      };
    }
  },

  deleteAccount: async (password) => {
    try {
      const response = await api.delete("/account", { data: { password } });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete account",
      };
    }
  },

  getSessions: async () => {
    try {
      const response = await api.get("/auth/sessions");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get sessions",
      };
    }
  },

  logoutAllDevices: async () => {
    try {
      const response = await api.post("/auth/logout-all");
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to logout all devices",
      };
    }
  },

  revokeSession: async (sessionId) => {
    try {
      const response = await api.delete(`/auth/sessions/${sessionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to revoke session",
      };
    }
  },
};

export default apiService;
