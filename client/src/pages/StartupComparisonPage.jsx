import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Columns3, Trash2 } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import VerificationBadge from "../components/common/VerificationBadge";
import comparisonService from "../services/comparisonService";

const ROWS = [
  { key: "industry", label: "Industry" },
  { key: "funding_stage", label: "Funding stage" },
  { key: "amount_seeking", label: "Amount seeking" },
  { key: "revenue_status", label: "Revenue status" },
  { key: "location", label: "Location" },
  { key: "founding_date", label: "Founding date" },
  { key: "team_size", label: "Team size" },
  { key: "match_score", label: "Match score" },
  { key: "verification_level", label: "Verification" },
];

const StartupComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const startupIds = useMemo(
    () => idsParam.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 4),
    [idsParam],
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadComparison = useCallback(async () => {
    if (startupIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const result = await comparisonService.compare(startupIds);
    if (!result.success) {
      setError(result.error);
      setRows([]);
    } else {
      setRows(result.data || []);
    }
    setLoading(false);
  }, [startupIds]);

  const loadSnapshots = useCallback(async () => {
    const result = await comparisonService.listSnapshots();
    if (result.success) {
      setSnapshots(result.data || []);
    }
  }, []);

  useEffect(() => {
    loadComparison();
    loadSnapshots();
  }, [loadComparison, loadSnapshots]);

  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim() || startupIds.length === 0) return;
    setSaving(true);
    const result = await comparisonService.saveSnapshot(
      snapshotName.trim(),
      startupIds,
    );
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSnapshotName("");
    await loadSnapshots();
  };

  const handleDeleteSnapshot = async (snapshotId) => {
    const result = await comparisonService.deleteSnapshot(snapshotId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadSnapshots();
  };

  const handleLoadSnapshot = (snapshot) => {
    const ids = (snapshot.startup_profile_ids || []).join(",");
    window.location.href = `/compare?ids=${ids}`;
  };

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Columns3 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">FR-17</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-content">Startup Comparison</h1>
          <p className="text-content-secondary text-sm mt-1">
            Compare up to four startups side by side.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/startups"
            className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to discovery
          </Link>
          <Link
            to="/analytics"
            className="text-sm text-content-secondary hover:text-primary"
          >
            Deal pipeline
          </Link>
        </div>

        {error && (
          <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {startupIds.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="text-content-muted text-sm">
              Select startups from the discovery page or deal pipeline, then open Compare (up to 4).
            </p>
          </div>
        ) : loading ? (
          <p className="text-sm text-content-muted">Loading comparison…</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-alt">
                    <th className="text-left px-4 py-3 text-content-muted font-medium w-40">
                      Attribute
                    </th>
                    {rows.map((col) => (
                      <th key={col.startup_profile_id} className="text-left px-4 py-3 min-w-[160px]">
                        <Link
                          to={`/startups/${col.startup_profile_id}`}
                          className="font-semibold text-content hover:text-primary"
                        >
                          {col.company_name}
                        </Link>
                        {!col.is_connected && (
                          <p className="text-[10px] text-content-muted mt-0.5">
                            Public info only
                          </p>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.key} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-content-muted font-medium">
                        {row.label}
                      </td>
                      {rows.map((col) => (
                        <td key={`${col.startup_profile_id}-${row.key}`} className="px-4 py-3 text-content-secondary">
                          {row.key === "verification_level" ? (
                            <VerificationBadge tier={col.verification_level} />
                          ) : row.key === "match_score" ? (
                            col.match_score != null ? `${col.match_score}%` : "—"
                          ) : row.key === "team_size" ? (
                            col.team_size ?? "—"
                          ) : (
                            col[row.key] || "—"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <h3 className="font-semibold text-content flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-primary" />
                Save comparison snapshot
              </h3>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  placeholder="Snapshot name"
                  className="flex-1 min-w-[200px] rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveSnapshot}
                  disabled={saving || !snapshotName.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-content-inverse text-sm disabled:opacity-50"
                >
                  Save snapshot
                </button>
              </div>
            </div>
          </>
        )}

        {snapshots.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <h3 className="font-semibold text-content">Saved snapshots</h3>
            <ul className="space-y-2">
              {snapshots.map((snapshot) => (
                <li
                  key={snapshot.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => handleLoadSnapshot(snapshot)}
                    className="text-sm text-content hover:text-primary text-left"
                  >
                    {snapshot.name}
                    <span className="block text-[10px] text-content-muted">
                      {(snapshot.startup_profile_ids || []).length} startups ·{" "}
                      {new Date(snapshot.created_at).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSnapshot(snapshot.id)}
                    className="text-content-muted hover:text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default StartupComparisonPage;
