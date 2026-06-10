import api from "./apiClient";

export const connectionNotesService = {
  list: async (connectionId) => {
    try {
      const response = await api.get(`/connections/${connectionId}/notes`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load notes",
      };
    }
  },

  add: async (connectionId, content) => {
    try {
      const response = await api.post(`/connections/${connectionId}/notes`, {
        content,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save note",
      };
    }
  },
};

export default connectionNotesService;
