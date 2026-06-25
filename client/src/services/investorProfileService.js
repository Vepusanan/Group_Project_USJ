import api from "./apiClient";

/**
 * Investor Profile Service for Investor Onboarding
 */
export const investorProfileService = {
  /**
   * Create a new investor profile
   * @param {FormData} formData - Form data with profile information and files
   * @returns {Promise}
   */
  createProfile: async (formData) => {
    try {
      const response = await api.post("/investors/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Create investor profile error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create profile",
      };
    }
  },

  /**
   * Update existing investor profile
   * @param {string} profileId - Profile ID
   * @param {FormData} formData - Form data with updated information
   * @returns {Promise}
   */
  updateProfile: async (profileId, formData) => {
    try {
      const response = await api.put(
        `/investors/profile/${profileId}`,
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
      console.error("Update investor profile error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update profile",
      };
    }
  },

  /**
   * Get current user's investor profile
   * @returns {Promise}
   */
  getMyProfile: async () => {
    try {
      const response = await api.get("/investors/profile/me");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: true,
          data: null,
        };
      }
      console.error("Get investor profile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get profile",
      };
    }
  },

  /**
   * Get investor profile by ID
   * @param {string} investorId - Investor ID
   * @returns {Promise}
   */
  getProfile: async (investorId) => {
    try {
      const response = await api.get(`/investors/profile/${investorId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get investor profile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get profile",
      };
    }
  },

  getProfileCompletion: async () => {
    try {
      const response = await api.get("/investors/profile/completion");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Get investor profile completion error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to get completion status",
      };
    }
  },

  /**
   * Check if investor has completed onboarding
   * @returns {Promise}
   */
  checkOnboardingStatus: async () => {
    try {
      const response = await api.get("/investors/profile/me");
      return {
        success: true,
        hasProfile: !!response.data?.data,
        data: response.data,
      };
    } catch (error) {
      console.error("Check onboarding status error:", error);
      return {
        success: false,
        hasProfile: false,
      };
    }
  },
};

export default investorProfileService;
