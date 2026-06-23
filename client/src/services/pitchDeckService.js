import api from "./apiClient";

const API_BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "http://localhost:5001/api");

export const pitchDeckService = {
  getMeta: async (startupProfileId) => {
    try {
      const response = await api.get(`/pitch-decks/${startupProfileId}/meta`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load pitch deck",
      };
    }
  },

  getFileUrl: (startupProfileId) =>
    `${API_BASE}/pitch-decks/${startupProfileId}/file`,

  fetchFileData: async (startupProfileId) => {
    try {
      const response = await api.get(`/pitch-decks/${startupProfileId}/file`, {
        responseType: "arraybuffer",
        timeout: 120000,
      });

      // Clone so pdf.js can transfer the buffer to its worker without
      // detaching the only copy (which breaks on re-render / page changes).
      const bytes = new Uint8Array(response.data).slice();
      const header = new TextDecoder().decode(bytes.subarray(0, 5));
      if (!header.startsWith("%PDF")) {
        return {
          success: false,
          error: "The uploaded file is not a valid PDF.",
        };
      }

      return { success: true, data: bytes };
    } catch (error) {
      let message = "Failed to load pitch deck file";

      if (error.response?.data instanceof ArrayBuffer) {
        try {
          const parsed = JSON.parse(
            new TextDecoder().decode(error.response.data),
          );
          message = parsed.error || message;
        } catch {
          // keep default message
        }
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.code === "ECONNABORTED") {
        message = "Pitch deck download timed out. The file may be too large.";
      }

      return { success: false, error: message };
    }
  },

  startSession: async (startupProfileId) => {
    try {
      const response = await api.post(`/pitch-decks/${startupProfileId}/sessions`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to start viewing session",
      };
    }
  },

  updateSession: async (sessionId, payload) => {
    try {
      const response = await api.patch(`/pitch-decks/sessions/${sessionId}`, payload);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update viewing session",
      };
    }
  },

  completeSession: async (sessionId, payload) => {
    try {
      const response = await api.post(
        `/pitch-decks/sessions/${sessionId}/complete`,
        payload,
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to complete viewing session",
      };
    }
  },

  analyzeDeck: async (startupProfileId) => {
    try {
      const response = await api.post(
        `/pitch-decks/${startupProfileId}/analyze`,
        {},
        { timeout: 120000 },
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to analyze pitch deck",
      };
    }
  },
};

export default pitchDeckService;
