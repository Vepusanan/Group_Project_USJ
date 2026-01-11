import axios from 'axios';
import { API_ENDPOINTS } from '../utils/constants';

// Create axios instance for general API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * General API service for non-auth related calls
 * 
 * use PROFILE, STARTUPS, INVESTORS, CONNECTIONS endpoints
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
      // Try using /profile endpoint instead of /auth/me
      const response = await api.get(API_ENDPOINTS.PROFILE);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get current user',
        suggestion: 'Check if /profile endpoint exists or contact backend team',
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
      console.error('getStartups error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get startups',
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
      console.error('getInvestors error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get investors',
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
      const response = await api.post(API_ENDPOINTS.CONNECTIONS, { userId, message });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('createConnection error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create connection',
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
      console.error('getConnections error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get connections',
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
      console.error('updateProfile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
      };
    }
  },
};

export default apiService;