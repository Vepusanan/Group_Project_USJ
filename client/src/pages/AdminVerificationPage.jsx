import React, { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Shield } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import engagementService from "../services/engagementService";
import { useAuth } from "../hooks/useAuth";

const AdminVerificationPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const statusRes = await engagementService.getVerificationStatus();
    if (statusRes.success) {
      setIsAdmin(statusRes.data?.is_admin);
      if (!statusRes.data?.is_admin) {
        setLoading(false);
        return;
      }
    }
    const result = await engagementService.listPendingVerifications();
    if (!result.success) {
      setError(result.error);
      setRequests([]);
    } else {
      setRequests(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    setBusy(true);
    const result = await engagementService.approveVerification(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setBusy(true);
    const result = await engagementService.rejectVerification(rejectId, rejectReason.trim());
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRejectId(null);
    setRejectReason("");
    await load();
  };

  if (isAdmin === false) {
    return <Navigate to="/settings" replace />;
  }

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Administrator</span>
          </div>
          <h1 className="text-3xl font-bold text-content">Verification review queue</h1>
          <p className="text-content-secondary text-sm mt-1">
            Approve or reject Business Verified documentation submissions.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-content-muted text-sm">No pending verification requests.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-line bg-surface p-5 space-y-3">
                <div>
                  <p className="font-semibold text-content">{req.full_name}</p>
                  <p className="text-sm text-content-secondary">{req.email}</p>
                  <p className="text-xs text-content-muted capitalize mt-1">
                    {req.user_type} · {req.requested_tier} · current: {req.verification_tier}
                    {req.hours_pending != null && (
                      <span className={req.hours_pending > 48 ? " text-warning" : ""}>
                        {" "}· pending {req.hours_pending}h
                        {req.hours_pending > 48 ? " (over 48h SLA)" : ""}
                      </span>
                    )}
                  </p>
                </div>
                {req.linkedin_profile_url && (
                  <a
                    href={req.linkedin_profile_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    LinkedIn profile
                  </a>
                )}
                {req.document_url && (
                  <a
                    href={req.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    View document ({req.document_name || "file"})
                  </a>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(req.id)}
                    className="text-sm px-4 py-2 rounded-lg bg-success/10 text-success border border-success/30"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRejectId(req.id)}
                    className="text-sm px-4 py-2 rounded-lg bg-error/10 text-error border border-error/30"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {rejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 space-y-3">
              <p className="font-semibold text-content">Rejection reason</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm"
                placeholder="Explain what the applicant must fix before resubmitting..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="text-sm px-3 py-2 text-content-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || !rejectReason.trim()}
                  onClick={handleReject}
                  className="btn-primary-token text-sm px-4 py-2"
                >
                  Send rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminVerificationPage;
