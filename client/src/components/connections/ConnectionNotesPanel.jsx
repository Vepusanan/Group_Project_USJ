import React, { useCallback, useEffect, useState } from "react";
import { X, StickyNote } from "lucide-react";
import engagementService from "../../services/engagementService";

const ConnectionNotesPanel = ({
  connectionId,
  title = "Private notes",
  onClose,
}) => {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    setError("");
    const result = await engagementService.listConnectionNotes(connectionId);
    if (!result.success) {
      setError(result.error);
      setNotes([]);
    } else {
      setNotes(result.data || []);
    }
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const content = draft.trim();
    if (!content) return;
    if (content.length > 4000) {
      setError("Notes must be 4000 characters or fewer");
      return;
    }
    setSaving(true);
    setError("");
    const result = await engagementService.addConnectionNote(connectionId, content);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDraft("");
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-content">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-content-muted">
            Only you can see these notes. The other party cannot view or be notified.
          </p>

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          {loading ? (
            <p className="text-sm text-content-muted">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-content-muted">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-line bg-surface-alt p-3"
                >
                  <p className="text-xs text-content-muted mb-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-content whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-line space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Add a private note (up to 4000 characters)..."
            className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-sm text-content"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-content-muted">{draft.length}/4000</span>
            <button
              type="button"
              disabled={saving || !draft.trim()}
              onClick={handleSave}
              className="btn-primary-token text-sm px-4 py-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionNotesPanel;
