import React, { useCallback, useEffect, useState } from "react";
import { Calendar, CalendarPlus, Loader2, Sparkles, X } from "lucide-react";
import engagementService from "../../services/engagementService";
import { useAuth } from "../../hooks/useAuth";

const FORMAT_LABELS = {
  VIDEO_CALL: "Video call",
  PHONE_CALL: "Phone call",
  IN_PERSON: "In person",
};

const ConnectionMeetingsPanel = ({
  connectionId,
  otherUserName,
  onClose,
  initialShowRequestForm = false,
}) => {
  const { user } = useAuth();
  const isInvestor = user?.userType === "investor";
  const isStartup = user?.userType === "startup";

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(initialShowRequestForm);
  const [form, setForm] = useState({
    proposed_at: "",
    format: "VIDEO_CALL",
    agenda: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [briefLoadingId, setBriefLoadingId] = useState(null);
  const [briefErrors, setBriefErrors] = useState({});
  const [briefs, setBriefs] = useState({});

  const minDateTime = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await engagementService.listMeetings(connectionId);
    if (!result.success) {
      setError(result.error);
      setMeetings([]);
    } else {
      setMeetings(result.data || []);
      const initialBriefs = {};
      for (const meeting of result.data || []) {
        if (meeting.ai_brief) {
          initialBriefs[meeting.id] = meeting.ai_brief;
        }
      }
      setBriefs(initialBriefs);
    }
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (new Date(form.proposed_at).getTime() <= Date.now()) {
      setError("Please choose a meeting time in the future.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await engagementService.requestMeeting(connectionId, {
      proposed_at: new Date(form.proposed_at).toISOString(),
      format: form.format,
      agenda: form.agenda.trim(),
      message: form.message.trim() || undefined,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ proposed_at: "", format: "VIDEO_CALL", agenda: "", message: "" });
    setShowRequestForm(false);
    await load();
  };

  const handleRespond = async (meetingId, status) => {
    setBusy(true);
    const result = await engagementService.respondMeeting(meetingId, status);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleAddNote = async (meetingId) => {
    const content = (noteDrafts[meetingId] || "").trim();
    if (!content) return;
    setBusy(true);
    const result = await engagementService.addMeetingNote(meetingId, content);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNoteDrafts((prev) => ({ ...prev, [meetingId]: "" }));
    await load();
  };

  const handleDownloadCalendar = async (meetingId) => {
    const result = await engagementService.downloadMeetingCalendar(meetingId);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleGenerateBrief = async (meetingId) => {
    setBriefLoadingId(meetingId);
    setBriefErrors((prev) => ({ ...prev, [meetingId]: "" }));
    const result = await engagementService.generateMeetingBrief(meetingId);
    setBriefLoadingId(null);
    if (!result.success) {
      setBriefErrors((prev) => ({
        ...prev,
        [meetingId]: result.error || "Failed to generate brief",
      }));
      return;
    }
    setBriefs((prev) => ({
      ...prev,
      [meetingId]: result.data?.brief || null,
    }));
  };

  const renderBrief = (meetingId) => {
    const brief = briefs[meetingId];
    if (!brief) return null;

    return (
      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 text-xs text-content-secondary">
        <p className="text-[10px] uppercase tracking-wide text-primary font-medium">
          AI meeting brief
        </p>
        {brief.company_overview && (
          <div>
            <p className="font-medium text-content">Company overview</p>
            <p>{brief.company_overview}</p>
          </div>
        )}
        {brief.recent_activity_and_signals && (
          <div>
            <p className="font-medium text-content">Recent activity & signals</p>
            <p>{brief.recent_activity_and_signals}</p>
          </div>
        )}
        {brief.key_questions_to_explore?.length > 0 && (
          <div>
            <p className="font-medium text-content">Key questions to explore</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {brief.key_questions_to_explore.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {brief.suggested_talking_points?.length > 0 && (
          <div>
            <p className="font-medium text-content">Suggested talking points</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {brief.suggested_talking_points.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-content">
              Meetings with {otherUserName || "connection"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-content-muted hover:text-content">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {isInvestor && (
            <div className="space-y-3">
              {!showRequestForm ? (
                <button
                  type="button"
                  onClick={() => setShowRequestForm(true)}
                  className="btn-primary-token text-sm px-4 py-2"
                >
                  Request meeting
                </button>
              ) : (
                <form onSubmit={handleRequest} className="rounded-xl border border-line bg-surface-alt p-4 space-y-3">
                  <p className="text-sm font-medium text-content">Request a meeting</p>
                  <input
                    type="datetime-local"
                    value={form.proposed_at}
                    min={minDateTime}
                    onChange={(e) => setForm((p) => ({ ...p, proposed_at: e.target.value }))}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  />
                  <select
                    value={form.format}
                    onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  >
                    <option value="VIDEO_CALL">Video call</option>
                    <option value="PHONE_CALL">Phone call</option>
                    <option value="IN_PERSON">In person</option>
                  </select>
                  <textarea
                    value={form.agenda}
                    onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))}
                    placeholder="Meeting agenda / purpose"
                    rows={2}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    required
                  />
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Optional message to the startup"
                    rows={2}
                    className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="px-4 py-2 rounded-lg border border-line text-sm text-content-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary-token text-sm px-4 py-2 disabled:opacity-50"
                    >
                      Send meeting request
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-content-muted">Loading meetings...</p>
          ) : meetings.length === 0 ? (
            <p className="text-sm text-content-muted">No meetings scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-line p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-content">
                      {new Date(meeting.proposed_at).toLocaleString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-line text-content-secondary">
                      {FORMAT_LABELS[meeting.format] || meeting.format}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-line capitalize">
                      {meeting.status}
                    </span>
                  </div>
                  <p className="text-sm text-content-secondary">{meeting.agenda}</p>
                  {meeting.message && (
                    <p className="text-xs text-content-muted">{meeting.message}</p>
                  )}

                  {isStartup && meeting.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRespond(meeting.id, "accepted")}
                        className="text-sm px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/30"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRespond(meeting.id, "declined")}
                        className="text-sm px-3 py-1.5 rounded-lg bg-error/10 text-error border border-error/30"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {meeting.status === "accepted" && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadCalendar(meeting.id)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        Add to calendar (.ics)
                      </button>
                      {isInvestor && (
                        <button
                          type="button"
                          onClick={() => handleGenerateBrief(meeting.id)}
                          disabled={briefLoadingId === meeting.id}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                        >
                          {briefLoadingId === meeting.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {briefs[meeting.id] ? "Refresh brief" : "Generate brief"}
                        </button>
                      )}
                    </div>
                  )}

                  {briefErrors[meeting.id] && (
                    <p className="text-xs text-error">{briefErrors[meeting.id]}</p>
                  )}
                  {renderBrief(meeting.id)}

                  {meeting.status === "accepted" && meeting.can_add_notes && (
                    <div className="pt-2 space-y-2 border-t border-line mt-2">
                      <p className="text-[10px] uppercase tracking-wide text-content-muted">
                        Your private notes
                      </p>
                      {(meeting.notes || []).map((note) => (
                        <div key={note.id} className="text-xs text-content-secondary">
                          <span className="text-content-muted">
                            {new Date(note.created_at).toLocaleString()} —
                          </span>{" "}
                          {note.content}
                        </div>
                      ))}
                      <textarea
                        value={noteDrafts[meeting.id] || ""}
                        onChange={(e) =>
                          setNoteDrafts((p) => ({ ...p, [meeting.id]: e.target.value }))
                        }
                        rows={2}
                        placeholder="Add post-meeting notes (only visible to you)..."
                        className="w-full rounded-lg border border-line bg-surface-alt px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAddNote(meeting.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        Save meeting note
                      </button>
                    </div>
                  )}

                  {meeting.status === "accepted" && !meeting.can_add_notes && (
                    <p className="text-xs text-content-muted pt-2 border-t border-line mt-2">
                      Post-meeting notes unlock after the scheduled time.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionMeetingsPanel;
