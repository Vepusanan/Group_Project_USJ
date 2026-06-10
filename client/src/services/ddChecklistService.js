import api from "./apiClient";

const ddChecklistService = {
  getChecklist: async (connectionId) => {
    try {
      const res = await api.get(`/dd-checklists/connection/${connectionId}`);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load checklist",
      };
    }
  },

  addItem: async (connectionId, payload) => {
    try {
      const res = await api.post(
        `/dd-checklists/connection/${connectionId}/items`,
        payload,
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to add item",
      };
    }
  },

  updateItem: async (itemId, payload) => {
    try {
      const res = await api.patch(`/dd-checklists/items/${itemId}`, payload);
      return {
        success: true,
        data: res.data.data,
        all_items_completed: res.data.all_items_completed,
        suggest_pipeline_move: res.data.suggest_pipeline_move,
        pipeline_card: res.data.pipeline_card,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update item",
      };
    }
  },

  deleteItem: async (itemId) => {
    try {
      await api.delete(`/dd-checklists/items/${itemId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete item",
      };
    }
  },

  shareChecklist: async (connectionId) => {
    try {
      const res = await api.post(
        `/dd-checklists/connection/${connectionId}/share`,
      );
      return { success: true, data: res.data.data, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to share checklist",
      };
    }
  },

  submitResponse: async (itemId, file) => {
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await api.post(
        `/dd-checklists/items/${itemId}/response`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        },
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit response",
      };
    }
  },

  linkDataRoom: async (itemId, payload) => {
    try {
      const res = await api.post(
        `/dd-checklists/items/${itemId}/link-data-room`,
        payload,
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to link data room resource",
      };
    }
  },

  fetchItemDocument: async (itemId) => {
    try {
      const response = await api.get(`/dd-checklists/items/${itemId}/file`, {
        responseType: "arraybuffer",
        timeout: 120000,
      });
      const bytes = new Uint8Array(response.data).slice();
      const contentType = response.headers["content-type"] || "";
      return { success: true, data: bytes, contentType };
    } catch (error) {
      let message = "Failed to load document";
      if (error.response?.data instanceof ArrayBuffer) {
        try {
          const parsed = JSON.parse(new TextDecoder().decode(error.response.data));
          message = parsed.error || message;
        } catch {
          // keep default
        }
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      return { success: false, error: message };
    }
  },

  downloadItemDocument: async (itemId, fileName = "document") => {
    const result = await ddChecklistService.fetchItemDocument(itemId);
    if (!result.success) return result;

    const blob = new Blob([result.data], {
      type: result.contentType || "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return { success: true };
  },
};

export default ddChecklistService;
