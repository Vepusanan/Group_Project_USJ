import api from "./apiClient";

export const FUNDING_STAGE_OPTIONS = [
  { value: "PRE_SEED", label: "Pre-seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "LKR", label: "LKR (Rs)" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "SGD", label: "SGD" },
];

export const fundingRoundService = {
  getMyRound: async () => {
    try {
      const response = await api.get("/funding-rounds/me");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load funding round",
      };
    }
  },

  getStartupRound: async (startupProfileId) => {
    try {
      const response = await api.get(`/funding-rounds/startup/${startupProfileId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load funding round",
      };
    }
  },

  createRound: async (payload) => {
    try {
      const response = await api.post("/funding-rounds", payload);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create funding round",
      };
    }
  },

  updateRound: async (roundId, payload) => {
    try {
      const response = await api.put(`/funding-rounds/${roundId}`, payload);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update funding round",
      };
    }
  },

  closeRound: async (roundId) => {
    try {
      const response = await api.post(`/funding-rounds/${roundId}/close`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to close funding round",
      };
    }
  },
};

export default fundingRoundService;
