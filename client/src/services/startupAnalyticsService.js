import api from "./apiClient";

export const ANALYTICS_PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export const startupAnalyticsService = {
  getDashboard: async (period = "30d") => {
    try {
      const response = await api.get("/startup-analytics/me", {
        params: { period },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to load analytics dashboard",
      };
    }
  },
};

export default startupAnalyticsService;
