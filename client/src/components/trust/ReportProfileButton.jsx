import React, { useState } from "react";
import { Flag } from "lucide-react";
import engagementService from "../../services/engagementService";

const ReportProfileButton = ({ reportedUserId, reportedName }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!reportedUserId) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const result = await engagementService.reportProfile(reportedUserId, reason.trim());
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setMessage(result.message || "Report submitted.");
    setReason("");
    setTimeout(() => setOpen(false), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-content-muted text-xs hover:text-error hover:border-error/30 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-card"
          >
            <h3 className="text-lg font-semibold text-content">Report profile</h3>
            <p className="text-sm text-content-secondary">
              Flag {reportedName || "this profile"} as potentially fraudulent or misleading.
              Reports are reviewed by administrators.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              placeholder="Describe the issue (minimum 10 characters)…"
              className="w-full rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm text-content"
            />
            {error && <p className="text-sm text-error">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-line text-sm text-content-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || reason.trim().length < 10}
                className="px-4 py-2 rounded-lg bg-error text-white text-sm disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ReportProfileButton;
