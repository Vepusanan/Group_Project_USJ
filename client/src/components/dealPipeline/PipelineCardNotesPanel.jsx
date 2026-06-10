import React, { useState } from "react";
import { StickyNote, X } from "lucide-react";
import dealPipelineService from "../../services/dealPipelineService";

const DECISION_OPTIONS = [
  { value: "INVEST", label: "Proceed to invest" },
  { value: "DEFER", label: "Defer / revisit later" },
  { value: "PASS", label: "Pass on this deal" },
];

const PipelineCardNotesPanel = ({
  card,
  promptDdSummary = false,
  showDecisionGuidance = false,
  onClose,
  onSaved,
}) => {
  const [notes, setNotes] = useState(card?.private_notes || "");
  const [decisionOutcome, setDecisionOutcome] = useState(
    card?.decision_outcome || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const showDecisionFields = promptDdSummary || showDecisionGuidance;

  const handleSave = async (e) => {
    e.preventDefault();
    if (showDecisionFields && !decisionOutcome) {
      setError("Select an investment decision outcome.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await dealPipelineService.updateNotes(card.id, {
      privateNotes: notes.trim(),
      decisionOutcome: showDecisionFields ? decisionOutcome : undefined,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSaved?.(result.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-content">
              Pipeline notes — {card?.startup_name || "Startup"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-alt">
            <X className="w-5 h-5 text-content-muted" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-5 py-4 space-y-3">
          {error && (
            <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {showDecisionFields && (
            <div className="text-sm text-content-secondary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 space-y-2">
              <p>
                You moved this deal to <strong>Decision</strong>. Record your investment
                decision and key rationale below — this note is private to your pipeline card.
              </p>
              <p className="text-xs text-content-muted">
                If you proceed positively, term sheets, legal review, and closing typically
                continue off-platform with your own counsel and the startup&apos;s team.
                Use Connections for any final Q&A before you formalise next steps.
              </p>
            </div>
          )}

          {showDecisionFields && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                Investment decision
              </legend>
              {DECISION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm text-content cursor-pointer"
                >
                  <input
                    type="radio"
                    name="decision_outcome"
                    value={option.value}
                    checked={decisionOutcome === option.value}
                    onChange={() => setDecisionOutcome(option.value)}
                    className="border-line text-primary"
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          )}

          <textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              showDecisionFields
                ? "DD outcome, risks, open items, recommendation…"
                : "Private notes for this deal…"
            }
            className="w-full rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-line text-sm text-content-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-primary text-content-inverse text-sm disabled:opacity-50"
            >
              Save notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PipelineCardNotesPanel;
