import api from "./apiClient";

export const dataRoomService = {
  getMyDataRoom: async () => {
    try {
      const response = await api.get("/data-rooms/me");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load data room",
      };
    }
  },

  getStartupDataRoom: async (startupProfileId) => {
    try {
      const response = await api.get(`/data-rooms/startup/${startupProfileId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load data room",
      };
    }
  },

  getMeta: async (startupProfileId) => {
    try {
      const response = await api.get(
        `/data-rooms/startup/${startupProfileId}/meta`,
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to check data room access",
      };
    }
  },

  createFolder: async (name) => {
    try {
      const response = await api.post("/data-rooms/folders", { name });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create folder",
      };
    }
  },

  updateFolder: async (folderId, name) => {
    try {
      const response = await api.patch(`/data-rooms/folders/${folderId}`, {
        name,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update folder",
      };
    }
  },

  deleteFolder: async (folderId) => {
    try {
      await api.delete(`/data-rooms/folders/${folderId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete folder",
      };
    }
  },

  uploadDocument: async ({ file, folderId, name, description }, onProgress) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) formData.append("folder_id", folderId);
      if (name) formData.append("name", name);
      if (description) formData.append("description", description);

      const response = await api.post("/data-rooms/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to upload document",
      };
    }
  },

  updateDocument: async (documentId, payload) => {
    try {
      const response = await api.patch(
        `/data-rooms/documents/${documentId}`,
        payload,
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update document",
      };
    }
  },

  deleteDocument: async (documentId) => {
    try {
      await api.delete(`/data-rooms/documents/${documentId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete document",
      };
    }
  },

  getDocumentFileUrl: (documentId) => `/api/data-rooms/documents/${documentId}/file`,

  fetchDocument: async (documentId) => {
    try {
      const response = await api.get(`/data-rooms/documents/${documentId}/file`, {
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

  downloadDocument: async (documentId, fileName = "document") => {
    try {
      const response = await api.get(`/data-rooms/documents/${documentId}/file`, {
        responseType: "blob",
        timeout: 120000,
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to download document",
      };
    }
  },

  openDocument: async (documentId, fileName = "document") => {
    try {
      const response = await api.get(`/data-rooms/documents/${documentId}/file`, {
        responseType: "blob",
        timeout: 120000,
      });
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to open document",
      };
    }
  },

  getConnectedInvestors: async () => {
    try {
      const response = await api.get("/data-rooms/connected-investors");
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to load connected investors",
      };
    }
  },

  requestAccess: async (startupProfileId) => {
    try {
      const response = await api.post(
        `/data-rooms/startup/${startupProfileId}/request-access`,
      );
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.error || "Failed to request data room access",
      };
    }
  },

  grantAccess: async (investorUserId) => {
    try {
      const response = await api.post("/data-rooms/access", { investor_user_id: investorUserId });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to grant access",
      };
    }
  },

  revokeAccess: async (grantId) => {
    try {
      const response = await api.delete(`/data-rooms/access/${grantId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to revoke access",
      };
    }
  },

  analyzeDocument: async (documentId) => {
    try {
      const response = await api.post(`/data-rooms/documents/${documentId}/analyze`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to analyse document",
      };
    }
  },

  getInvestorAuditLog: async (startupProfileId, filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.set("limit", String(filters.limit));
      if (filters.documentId) params.set("document_id", filters.documentId);
      if (filters.actionType) params.set("action_type", filters.actionType);
      const query = params.toString();
      const response = await api.get(
        `/data-rooms/startup/${startupProfileId}/audit-log${query ? `?${query}` : ""}`,
      );
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load audit log",
      };
    }
  },

  getAuditLog: async ({
    limit = 200,
    investorUserId = null,
    documentId = null,
    actionType = null,
  } = {}) => {
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (investorUserId) params.set("investor_user_id", investorUserId);
      if (documentId) params.set("document_id", documentId);
      if (actionType) params.set("action_type", actionType);

      const response = await api.get(`/data-rooms/audit-log?${params}`);
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load audit log",
      };
    }
  },
};

export default dataRoomService;
