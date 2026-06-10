import api from "./apiClient";

export const PIPELINE_STAGES = [
  { id: "DISCOVERED", label: "Discovered", color: "bg-slate-500/15 border-slate-500/30" },
  { id: "CONNECTED", label: "Connected", color: "bg-primary/15 border-primary/30" },
  { id: "REVIEWING", label: "Reviewing", color: "bg-warning/15 border-warning/30" },
  { id: "DUE_DILIGENCE", label: "Due Diligence", color: "bg-purple-500/15 border-purple-500/30" },
  { id: "DECISION", label: "Decision", color: "bg-emerald-500/15 border-emerald-500/30" },
  { id: "ARCHIVED", label: "Archived", color: "bg-content-muted/15 border-line" },
];

export const ANALYTICS_PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export const dealPipelineService = {
  getPipeline: async (period = "30d") => {
    try {
      const response = await api.get("/deal-pipeline", { params: { period } });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load deal pipeline",
      };
    }
  },

  moveCard: async (cardId, stage) => {
    try {
      const response = await api.patch(`/deal-pipeline/cards/${cardId}/stage`, {
        stage,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to move card",
      };
    }
  },

  updateNotes: async (cardId, { privateNotes, decisionOutcome } = {}) => {
    try {
      const response = await api.patch(`/deal-pipeline/cards/${cardId}/notes`, {
        private_notes: privateNotes,
        ...(decisionOutcome !== undefined
          ? { decision_outcome: decisionOutcome }
          : {}),
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save notes",
      };
    }
  },
};

export default dealPipelineService;
