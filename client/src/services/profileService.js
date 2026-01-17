import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
      const response = await api.post('/startups', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Create profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create profile',
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
      const response = await api.put(`/startups/${profileId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
      };
    }
  },

  /**
   * Get current user's startup profile
   * @returns {Promise}
   */
  getMyProfile: async () => {
    try {
      const response = await api.get('/startups/me');
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
      console.error('Get my profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get profile',
      };
    }
  },

  /**
   * Get profile completion status
   * @returns {Promise}
   */
  getProfileCompletion: async () => {
    try {
      const response = await api.get('/startups/completion');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Get profile completion error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get completion status',
      };
    }
  },

  /**
   * Upload additional documents
   * @param {string} profileId - Profile ID
   * @param {FormData} formData - Form data with documents
   * @returns {Promise}
   */
  uploadDocuments: async (profileId, formData) => {
    try {
      const response = await api.post(`/startups/${profileId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Upload documents error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload documents',
      };
    }
  },

  /**
   * Delete a document
   * @param {string} profileId - Profile ID
   * @param {number} documentIndex - Index of document to delete
   * @returns {Promise}
   */
  deleteDocument: async (profileId, documentIndex) => {
    try {
      const response = await api.delete(`/startups/${profileId}/documents/${documentIndex}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete document',
      };
    }
  },
};

export default profileService;
