import api from "./apiClient";

/**
 * Profile Service for Startup Onboarding
 */
export const profileService = {
  /**
   * Create a new startup profile
   * @param {FormData} formData - Form data with profile information and files
   * @returns {Promise}
   */
  createProfile: async (formData) => {
    try {
      const response = await api.post("/startups/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Create profile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create profile",
      };
    }
  },

  /**
   * Update existing startup profile
   * @param {string} profileId - Profile ID
   * @param {FormData} formData - Form data with updated information
   * @returns {Promise}
   */
  updateProfile: async (profileId, formData) => {
    try {
      const response = await api.put(
        `/startups/profile/${profileId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update profile",
      };
    }
  },

  /**
   * Get current user's startup profile
   * @returns {Promise}
   */
  getMyProfile: async () => {
    try {
      const response = await api.get("/startups/profile/me");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // 404 means no profile exists yet
      if (error.response?.status === 404) {
        return {
          success: true,
          data: null,
        };
      }
      console.error("Get my profile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get profile",
      };
    }
  },

  /**
   * Get profile completion status
   * @returns {Promise}
   */
  getProfileCompletion: async () => {
    try {
      const response = await api.get("/startups/profile/completion");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get profile completion error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get completion status",
      };
    }
  },
};

export default profileService;
