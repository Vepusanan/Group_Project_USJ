import api from "./apiClient";

export const watchlistService = {
  list: async () => {
    try {
      const response = await api.get("/watchlist");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load watchlist",
      };
    }
  },

  add: async (startupProfileId) => {
    try {
      const response = await api.post("/watchlist", {
        startup_profile_id: startupProfileId,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save to watchlist",
      };
    }
  },

  remove: async (startupProfileId) => {
    try {
      await api.delete(`/watchlist/${startupProfileId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to remove from watchlist",
      };
    }
  },
};

export default watchlistService;
