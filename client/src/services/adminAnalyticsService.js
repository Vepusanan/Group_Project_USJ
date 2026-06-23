import api from "./apiClient";

export const adminAnalyticsService = {
  getDashboard: async () => {
    try {
      const response = await api.get("/admin/analytics");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load platform analytics",
      };
    }
  },
};
