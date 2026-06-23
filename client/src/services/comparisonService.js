import api from "./apiClient";

const comparisonService = {
  compare: async (startupProfileIds) => {
    try {
      const res = await api.post("/comparisons/compare", {
        startup_profile_ids: startupProfileIds,
      });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to compare startups",
      };
    }
  },

  listSnapshots: async () => {
    try {
      const res = await api.get("/comparisons/snapshots");
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load snapshots",
      };
    }
  },

  saveSnapshot: async (name, startupProfileIds) => {
    try {
      const res = await api.post("/comparisons/snapshots", {
        name,
        startup_profile_ids: startupProfileIds,
      });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save snapshot",
      };
    }
  },

  deleteSnapshot: async (snapshotId) => {
    try {
      await api.delete(`/comparisons/snapshots/${snapshotId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete snapshot",
      };
    }
  },
};

export default comparisonService;
