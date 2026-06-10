import api from "./apiClient";

const connectionQaService = {
  listThreads: async (connectionId) => {
    try {
      const res = await api.get(`/connection-qa/connection/${connectionId}`);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load Q&A",
      };
    }
  },

  askQuestion: async (connectionId, { checklist_item_id, ...payload } = {}) => {
    try {
      const res = await api.post(
        `/connection-qa/connection/${connectionId}`,
        {
          ...payload,
          ...(checklist_item_id ? { checklist_item_id } : {}),
        },
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit question",
      };
    }
  },

  answerQuestion: async (threadId, answer) => {
    try {
      const res = await api.post(`/connection-qa/${threadId}/answer`, {
        answer,
      });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit answer",
      };
    }
  },
};

export default connectionQaService;
