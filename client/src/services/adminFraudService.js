import api from "./apiClient";

const wrap = async (promise, fallback) => {
  try {
    const response = await promise;
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || fallback };
  }
};

export const adminFraudService = {
  listReports: (status) =>
    wrap(
      api.get("/admin/reports", { params: status ? { status } : {} }),
      "Failed to load reports",
    ),
  dismiss: (reportId) =>
    wrap(api.post(`/admin/reports/${reportId}/dismiss`), "Failed to dismiss report"),
  suspend: (userId, { days, reason }) =>
    wrap(api.post(`/admin/users/${userId}/suspend`, { days, reason }), "Failed to suspend user"),
  deactivate: (userId, { reason }) =>
    wrap(api.post(`/admin/users/${userId}/deactivate`, { reason }), "Failed to deactivate user"),
  reactivate: (userId) =>
    wrap(api.post(`/admin/users/${userId}/reactivate`), "Failed to reactivate user"),
};
