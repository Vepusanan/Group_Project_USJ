import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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
        error: error.response?.data?.error || "Failed to create profile",
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
      const response = await api.put(`/investors/${profileId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Update investor profile error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update profile",
      };
    }
  },

  /**
   * Get current user's investor profile
   * @returns {Promise}
   */
  getMyProfile: async () => {
    try {
      const response = await api.get("/investors/me");
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

  /**
   * Get investor profile by ID
   * @param {string} investorId - Investor ID
   * @returns {Promise}
   */
  getProfile: async (investorId) => {
    try {
      const response = await api.get(`/investors/${investorId}`);
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

  /**
   * Check if investor has completed onboarding
   * @returns {Promise}
   */
  checkOnboardingStatus: async () => {
    try {
      const response = await api.get("/investors/onboarding/status");
      return {
        success: true,
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
