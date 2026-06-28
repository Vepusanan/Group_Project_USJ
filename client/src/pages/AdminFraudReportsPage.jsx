import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Ban,
  Clock,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { adminFraudService } from "../services/adminFraudService";

// Reports carry the reported user's profile id (per type). Build the public
// profile URL so the admin can inspect the account before acting.
const reportedProfilePath = (row) => {
  if (row.reported_user_type === "startup" && row.reported_startup_profile_id) {
    return `/startups/${row.reported_startup_profile_id}`;
  }
  if (row.reported_user_type === "investor" && row.reported_investor_profile_id) {
    return `/investors/${row.reported_investor_profile_id}`;
  }
  return null;
};

const StatusBadge = ({ row }) => {
  if (row.deleted_at)
    return <span className="text-xs font-medium text-error">Deactivated</span>;
  if (row.account_locked_until && new Date(row.account_locked_until) > new Date())
    return <span className="text-xs font-medium text-warning">Suspended</span>;
  if (row.fraud_flagged)
    return <span className="text-xs font-medium text-warning">Flagged</span>;
  return <span className="text-xs font-medium text-success">Active</span>;
};

const AdminFraudReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await adminFraudService.listReports();
    if (!result.success) {
      setError(result.error);
      setReports([]);
    } else {
      setReports(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (key, fn) => {
    setBusyId(key);
    const result = await fn();
    setBusyId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const onSuspend = (row) => {
    const days = Number(window.prompt("Suspend for how many days?", "7"));
    if (!days || days < 1) return;
    const reason = window.prompt("Reason (optional):", "") || "";
    act(`s-${row.id}`, () =>
      adminFraudService.suspend(row.reported_user_id, { days, reason }),
    );
  };
  const onDeactivate = (row) => {
    if (!window.confirm(`Permanently deactivate ${row.reported_email}?`)) return;
    const reason = window.prompt("Reason (optional):", "") || "";
    act(`d-${row.id}`, () =>
      adminFraudService.deactivate(row.reported_user_id, { reason }),
    );
  };
  const onDismiss = (row) =>
    act(`x-${row.id}`, () => adminFraudService.dismiss(row.id));
  const onReactivate = (row) =>
    act(`r-${row.id}`, () => adminFraudService.reactivate(row.reported_user_id));

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-sm font-medium">Trust &amp; safety</span>
            </div>
            <h1 className="text-3xl font-bold text-content">Fraud Reports</h1>
            <p className="text-content-secondary text-sm mt-1">
              Review reported profiles and take moderation action.
            </p>
          </div>
          <Link to="/admin/analytics" className="text-sm text-primary hover:underline">
            ← Dashboard
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-error/30 bg-error/10 p-4 text-error text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center text-content-secondary">
            No reports to review.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((row) => {
              const suspended =
                row.account_locked_until &&
                new Date(row.account_locked_until) > new Date();
              const disabled = busyId !== null;
              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-line bg-surface p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-content">
                          {row.reported_name || row.reported_email}
                        </p>
                        <span className="text-xs text-content-muted">
                          ({row.reported_user_type})
                        </span>
                        <StatusBadge row={row} />
                      </div>
                      <p className="text-sm text-content-secondary mt-1">{row.reason}</p>
                      <p className="text-xs text-content-muted mt-1">
                        Reported by {row.reporter_email} ·{" "}
                        {new Date(row.created_at).toLocaleString()} · {row.status}
                      </p>
                      {reportedProfilePath(row) && (
                        <Link
                          to={reportedProfilePath(row)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View reported profile
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(suspended || row.deleted_at) ? (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onReactivate(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-content hover:bg-surface-alt disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" /> Reactivate
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSuspend(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-warning/40 px-3 py-1.5 text-sm font-medium text-warning hover:bg-warning/10 disabled:opacity-50"
                          >
                            <Clock className="w-4 h-4" /> Suspend
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onDeactivate(row)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-error/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-50"
                          >
                            <Ban className="w-4 h-4" /> Deactivate
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onDismiss(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-content-secondary hover:bg-surface-alt disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminFraudReportsPage;
