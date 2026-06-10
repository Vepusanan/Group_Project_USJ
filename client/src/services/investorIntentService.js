import api from "./apiClient";

export const INTENT_LEVELS = [
  { value: "WATCHING", label: "Watching", description: "Monitoring progress" },
  { value: "INTERESTED", label: "Interested", description: "Actively evaluating" },
  { value: "PASSED", label: "Passed", description: "Not pursuing now" },
];

export const INTENT_BADGE_CLASS = {
  WATCHING: "bg-slate-500/15 text-slate-600 border-slate-500/25",
  INTERESTED: "bg-primary/15 text-primary border-primary/30",
  PASSED: "bg-content-muted/15 text-content-muted border-line",
};

export const investorIntentService = {
  passStartup: async (startupProfileId) => {
    try {
      const response = await api.post(
        `/investor-intents/pass/${startupProfileId}`,
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to pass startup",
      };
    }
  },

  setIntent: async (connectionId, intentLevel) => {
    try {
      const response = await api.put(
        `/investor-intents/connection/${connectionId}`,
        { intent_level: intentLevel },
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update intent",
      };
    }
  },

  setProfileIntent: async (startupProfileId, intentLevel) => {
    try {
      const response = await api.put(
        `/investor-intents/startup/${startupProfileId}`,
        { intent_level: intentLevel },
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update intent",
      };
    }
  },
};

export default investorIntentService;
