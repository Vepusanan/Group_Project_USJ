import api from "./apiClient";

export const verificationService = {
  getStatus: async () => {
    try {
      const response = await api.get("/verification/me");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load verification status",
      };
    }
  },

  submitIdentity: async (linkedinProfileUrl) => {
    try {
      const response = await api.post("/verification/identity", {
        linkedin_profile_url: linkedinProfileUrl,
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit identity verification",
      };
    }
  },

  submitBusiness: async (linkedinProfileUrl, file) => {
    try {
      const formData = new FormData();
      formData.append("linkedin_profile_url", linkedinProfileUrl);
      if (file) formData.append("document", file);
      const response = await api.post("/verification/business", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit business verification",
      };
    }
  },

  listPendingAdmin: async () => {
    try {
      const response = await api.get("/admin/verification-requests");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load requests",
      };
    }
  },

  approveRequest: async (requestId) => {
    try {
      const response = await api.post(
        `/admin/verification-requests/${requestId}/approve`,
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to approve",
      };
    }
  },

  rejectRequest: async (requestId, reason) => {
    try {
      const response = await api.post(
        `/admin/verification-requests/${requestId}/reject`,
        { reason },
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reject",
      };
    }
  },
};

export default verificationService;
