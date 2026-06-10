import api from "./apiClient";

export const engagementService = {
  listConnectionNotes: async (connectionId) => {
    try {
      const res = await api.get(`/connections/${connectionId}/notes`);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load notes",
      };
    }
  },

  addConnectionNote: async (connectionId, content) => {
    try {
      const res = await api.post(`/connections/${connectionId}/notes`, {
        content,
      });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save note",
      };
    }
  },

  getVerificationStatus: async () => {
    try {
      const res = await api.get("/verification/me");
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load verification status",
      };
    }
  },

  reportProfile: async (userId, reason) => {
    try {
      const res = await api.post(`/profile-reports/${userId}`, { reason });
      return {
        success: true,
        data: res.data.data,
        message: res.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit report",
      };
    }
  },

  submitIdentityVerification: async (linkedin_profile_url) => {
    try {
      const res = await api.post("/verification/identity", {
        linkedin_profile_url,
      });
      return { success: true, data: res.data.data, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit identity verification",
      };
    }
  },

  submitBusinessVerification: async (linkedin_profile_url, file) => {
    try {
      const formData = new FormData();
      formData.append("linkedin_profile_url", linkedin_profile_url);
      formData.append("document", file);
      const res = await api.post("/verification/business", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      return { success: true, data: res.data.data, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to submit business verification",
      };
    }
  },

  listPendingVerifications: async () => {
    try {
      const res = await api.get("/admin/verification-requests");
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load verification queue",
      };
    }
  },

  approveVerification: async (requestId) => {
    try {
      const res = await api.post(
        `/admin/verification-requests/${requestId}/approve`,
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to approve request",
      };
    }
  },

  rejectVerification: async (requestId, reason) => {
    try {
      const res = await api.post(
        `/admin/verification-requests/${requestId}/reject`,
        { reason },
      );
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to reject request",
      };
    }
  },

  getWatchlist: async () => {
    try {
      const res = await api.get("/watchlist");
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load watchlist",
      };
    }
  },

  addToWatchlist: async (startupProfileId) => {
    try {
      const res = await api.post("/watchlist", { startup_profile_id: startupProfileId });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save to watchlist",
      };
    }
  },

  removeFromWatchlist: async (startupProfileId) => {
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

  listMilestones: async (startupProfileId) => {
    try {
      const res = await api.get(`/milestones/startup/${startupProfileId}`);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load milestones",
      };
    }
  },

  createMilestone: async (payload) => {
    try {
      const res = await api.post("/milestones", payload);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to publish milestone",
      };
    }
  },

  updateMilestone: async (milestoneId, payload) => {
    try {
      const res = await api.patch(`/milestones/${milestoneId}`, payload);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update milestone",
      };
    }
  },

  deleteMilestone: async (milestoneId) => {
    try {
      await api.delete(`/milestones/${milestoneId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete milestone",
      };
    }
  },

  listMeetings: async (connectionId) => {
    try {
      const res = await api.get(`/meetings/connection/${connectionId}`);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to load meetings",
      };
    }
  },

  requestMeeting: async (connectionId, payload) => {
    try {
      const res = await api.post(`/meetings/connection/${connectionId}`, payload);
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to request meeting",
      };
    }
  },

  respondMeeting: async (meetingId, status) => {
    try {
      const res = await api.patch(`/meetings/${meetingId}/respond`, { status });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update meeting",
      };
    }
  },

  addMeetingNote: async (meetingId, content) => {
    try {
      const res = await api.post(`/meetings/${meetingId}/notes`, { content });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to save meeting note",
      };
    }
  },

  downloadMeetingCalendar: async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}/calendar.ics`, {
        responseType: "blob",
      });
      if (response.data?.type === "application/json") {
        const text = await response.data.text();
        const parsed = JSON.parse(text);
        return {
          success: false,
          error: parsed.error || "Failed to download calendar file",
        };
      }
      const blob = new Blob([response.data], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `meeting-${meetingId}.ics`;
      anchor.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to download calendar file",
      };
    }
  },

  generateMeetingBrief: async (meetingId) => {
    try {
      const res = await api.post(`/meetings/${meetingId}/brief`, {}, {
        timeout: 120000,
      });
      return { success: true, data: res.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to generate meeting brief",
      };
    }
  },
};

export default engagementService;
