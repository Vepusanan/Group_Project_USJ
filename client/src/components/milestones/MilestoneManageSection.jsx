import React, { useCallback, useEffect, useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import engagementService from "../../services/engagementService";

const CATEGORIES = [
  { value: "PRODUCT_LAUNCH", label: "Product Launch" },
  { value: "REVENUE_MILESTONE", label: "Revenue Milestone" },
  { value: "NEW_CUSTOMER", label: "New Customer Acquisition" },
  { value: "STRATEGIC_PARTNERSHIP", label: "Strategic Partnership" },
  { value: "TEAM_EXPANSION", label: "Team Expansion" },
  { value: "FUNDING_ACHIEVEMENT", label: "Funding Achievement" },
  { value: "OTHER", label: "Other" },
];

const emptyForm = {
  category: "PRODUCT_LAUNCH",
  headline: "",
  description: "",
  milestone_date: "",
};

const MilestoneManageSection = ({ startupProfileId }) => {
  const [milestones, setMilestones] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await engagementService.listMilestones(startupProfileId);
    setMilestones(result.success ? result.data || [] : []);
  }, [startupProfileId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const result = await engagementService.createMilestone({
      category: form.category,
      headline: form.headline.trim(),
      description: form.description.trim(),
      milestone_date: form.milestone_date || undefined,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm(emptyForm);
    setSuccess("Milestone published. Connected investors were notified.");
    await load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this milestone?")) return;
    const result = await engagementService.deleteMilestone(id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-content">Publish milestone update</h2>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <form onSubmit={handlePublish} className="space-y-3">
        <select
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <input
          value={form.headline}
          onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
          placeholder="Headline"
          className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm"
          required
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description (max 500 characters)"
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm"
          required
        />
        <input
          type="date"
          value={form.milestone_date}
          onChange={(e) => setForm((p) => ({ ...p, milestone_date: e.target.value }))}
          className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="btn-primary-token text-sm px-4 py-2 disabled:opacity-50"
        >
          Publish milestone
        </button>
      </form>

      {milestones.length > 0 && (
        <div className="border-t border-line pt-4 space-y-2">
          <p className="text-xs text-content-muted uppercase tracking-wide">Your milestones</p>
          {milestones.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-2 text-sm">
              <span className="text-content-secondary">{m.headline}</span>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="text-error hover:text-error/80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestoneManageSection;
