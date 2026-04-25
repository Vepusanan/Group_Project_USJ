import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants";

// Create axios instance for general API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      // Notify AuthContext so in-memory state is also cleared before redirect
      window.dispatchEvent(new Event("auth:force-logout"));
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

/**
 * General API service for non-auth related calls
 * NOTE: These endpoints are NOT your responsibility (other developers')
 * They use PROFILE, STARTUPS, INVESTORS, CONNECTIONS endpoints
 */
export const apiService = {
  /**
   * Get current user profile
   * IMPORTANT: /auth/me endpoint was removed from backend
   * Using /profile endpoint instead (if it exists)
   * @returns {Promise} Response with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
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
      const response = await api.get(API_ENDPOINTS.STARTUPS, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("getStartups error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get startups",
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
      const response = await api.get(API_ENDPOINTS.INVESTORS, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("getInvestors error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get investors",
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

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Response with updated profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put(API_ENDPOINTS.PROFILE, profileData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("updateProfile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update profile",
      };
    }
  },
};

export default apiService;
