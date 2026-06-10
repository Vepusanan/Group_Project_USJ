import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { DollarSign, Save, XCircle } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { SectionCard } from "../components/common/SectionCard";
import FundingRoundTracker from "../components/funding/FundingRoundTracker";
import { useAuth } from "../hooks/useAuth";
import {
  CURRENCY_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  fundingRoundService,
} from "../services/fundingRoundService";

const emptyForm = {
  funding_stage: "SEED",
  target_amount: "",
  committed_amount: "0",
  currency: "USD",
  opening_date: "",
  target_closing_date: "",
};

const FundingRoundManagePage = () => {
  const { user } = useAuth();
  const [round, setRound] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const loadRound = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await fundingRoundService.getMyRound();
    if (!result.success) {
      setError(result.error);
      setRound(null);
      setLoading(false);
      return;
    }
    setRound(result.data);
    if (result.data) {
      setForm({
        funding_stage: result.data.funding_stage || "SEED",
        target_amount: String(result.data.target_amount ?? ""),
        committed_amount: String(result.data.committed_amount ?? "0"),
        currency: result.data.currency || "USD",
        opening_date: result.data.opening_date?.split("T")[0] || "",
        target_closing_date: result.data.target_closing_date?.split("T")[0] || "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSuccess("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const result = await fundingRoundService.createRound({
      ...form,
      target_amount: Number(form.target_amount),
      committed_amount: Number(form.committed_amount || 0),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess("Funding round published on your profile.");
    await loadRound();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!round?.id) return;
    setBusy(true);
    setError("");
    setSuccess("");
    const result = await fundingRoundService.updateRound(round.id, {
      ...form,
      target_amount: Number(form.target_amount),
      committed_amount: Number(form.committed_amount || 0),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess("Funding round updated.");
    await loadRound();
  };

  const handleClose = async () => {
    if (!round?.id) return;
    if (!window.confirm("Mark this funding round as closed? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    const result = await fundingRoundService.closeRound(round.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess("Funding round marked as closed.");
    await loadRound();
  };

  if (user?.userType === "investor") {
    return <Navigate to="/startups" replace />;
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  const isActive = round?.status === "active";

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">US-04</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content">Funding Round Tracker</h1>
            <p className="text-content-secondary text-sm mt-1">
              Show investors your target raise and commitment progress to build momentum.
            </p>
          </div>
          <Link to="/profile" className="btn-secondary-token text-sm px-4 py-2 self-start">
            Back to Profile
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        )}

        {round && <FundingRoundTracker round={round} isOwner />}

        <SectionCard
          title={round ? (isActive ? "Update Round" : "Round Closed") : "Create Funding Round"}
          icon={DollarSign}
          accent="amber"
        >
          {round && !isActive ? (
            <p className="text-sm text-content-secondary">
              This round is closed. Create a new round after closing to start tracking again.
            </p>
          ) : (
            <form onSubmit={round ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">
                    Funding stage
                  </label>
                  <select
                    value={form.funding_stage}
                    onChange={handleChange("funding_stage")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  >
                    {FUNDING_STAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={handleChange("currency")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  >
                    {CURRENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">
                    Target raise amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.target_amount}
                    onChange={handleChange("target_amount")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">
                    Committed to date
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.committed_amount}
                    onChange={handleChange("committed_amount")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">
                    Opening date
                  </label>
                  <input
                    type="date"
                    value={form.opening_date}
                    onChange={handleChange("opening_date")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">
                    Target closing date
                  </label>
                  <input
                    type="date"
                    value={form.target_closing_date}
                    onChange={handleChange("target_closing_date")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 btn-primary-token text-sm px-4 py-2"
                >
                  <Save className="w-4 h-4" />
                  {round ? "Save Changes" : "Publish Round"}
                </button>
                {round && isActive && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleClose}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-error/30 text-error hover:bg-error/10"
                  >
                    <XCircle className="w-4 h-4" />
                    Mark as Closed
                  </button>
                )}
              </div>
            </form>
          )}

          {round && !isActive && (
            <form onSubmit={handleCreate} className="space-y-4 mt-6 pt-6 border-t border-line">
              <p className="text-sm font-medium text-content">Start a new round</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">Stage</label>
                  <select
                    value={form.funding_stage}
                    onChange={handleChange("funding_stage")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  >
                    {FUNDING_STAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-content-muted mb-1">Target</label>
                  <input
                    type="number"
                    min="1"
                    value={form.target_amount}
                    onChange={handleChange("target_amount")}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button type="submit" disabled={busy} className="btn-primary-token text-sm px-4 py-2">
                Create New Round
              </button>
            </form>
          )}
        </SectionCard>
      </div>
    </PageLayout>
  );
};

export default FundingRoundManagePage;
