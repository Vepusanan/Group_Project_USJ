import React, { useCallback, useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import connectionQaService from "../../services/connectionQaService";
import { useAuth } from "../../hooks/useAuth";

const CATEGORIES = [
  { value: "MARKET", label: "Market" },
  { value: "PRODUCT", label: "Product" },
  { value: "TEAM", label: "Team" },
  { value: "FINANCIALS", label: "Financials" },
  { value: "LEGAL", label: "Legal" },
];

const formatTimestamp = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ConnectionQaPanel = ({
  connectionId,
  otherUserName,
  checklistItemId = null,
  checklistItemDescription = null,
  onClose,
}) => {
  const { user } = useAuth();
  const isInvestor = user?.userType === "investor";
  const isStartup = user?.userType === "startup";

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    category: "MARKET",
    question: "",
  });
  const [answerDrafts, setAnswerDrafts] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const result = await connectionQaService.listThreads(connectionId);
    if (!result.success) {
      setError(result.error);
      setThreads([]);
    } else {
      setThreads(result.data || []);
    }
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!questionForm.question.trim()) return;
    setBusy(true);
    setError("");
    const result = await connectionQaService.askQuestion(connectionId, {
      category: questionForm.category,
      question: questionForm.question.trim(),
      ...(checklistItemId ? { checklist_item_id: checklistItemId } : {}),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setQuestionForm({ category: "MARKET", question: "" });
    await load();
  };

  const handleAnswer = async (threadId) => {
    const answer = (answerDrafts[threadId] || "").trim();
    if (!answer) return;
    setBusy(true);
    setError("");
    const result = await connectionQaService.answerQuestion(threadId, answer);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAnswerDrafts((prev) => ({ ...prev, [threadId]: "" }));
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-content">
              Q&A Board — {otherUserName || "connection"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-alt">
            <X className="w-5 h-5 text-content-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {checklistItemDescription && (
            <p className="text-xs text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              Follow-up on checklist item: <em>{checklistItemDescription}</em>
            </p>
          )}

          {loading ? (
            <p className="text-sm text-content-muted">Loading Q&A history…</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-content-muted">
              No questions yet. {isInvestor ? "Submit a structured evaluation question below." : "Waiting for investor questions."}
            </p>
          ) : (
            <ul className="space-y-4">
              {threads.map((thread) => (
                <li
                  key={thread.id}
                  className="rounded-xl border border-line bg-surface-alt p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {thread.category}
                    </span>
                    {thread.checklist_item_description && (
                      <span className="text-[10px] text-content-muted italic">
                        Re: {thread.checklist_item_description}
                      </span>
                    )}
                    <span className="text-[10px] text-content-muted">
                      Asked {formatTimestamp(thread.asked_at)}
                    </span>
                  </div>
                  <p className="text-sm text-content font-medium">{thread.question}</p>

                  {thread.answer ? (
                    <div className="rounded-lg bg-surface border border-line p-3">
                      <p className="text-xs text-content-muted mb-1">
                        Response · {formatTimestamp(thread.answered_at)}
                      </p>
                      <p className="text-sm text-content-secondary whitespace-pre-wrap">
                        {thread.answer}
                      </p>
                    </div>
                  ) : isStartup ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={answerDrafts[thread.id] || ""}
                        onChange={(e) =>
                          setAnswerDrafts((prev) => ({
                            ...prev,
                            [thread.id]: e.target.value,
                          }))
                        }
                        placeholder="Write your response…"
                        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAnswer(thread.id)}
                        disabled={busy || !(answerDrafts[thread.id] || "").trim()}
                        className="px-3 py-1.5 rounded-lg bg-primary text-content-inverse text-sm disabled:opacity-50"
                      >
                        Submit answer
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-content-muted italic">Awaiting startup response</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {isInvestor && (
          <form onSubmit={handleAsk} className="px-5 py-4 border-t border-line space-y-2">
            <div className="flex gap-2">
              <select
                value={questionForm.category}
                onChange={(e) =>
                  setQuestionForm((prev) => ({ ...prev, category: e.target.value }))
                }
                className="rounded-lg border border-line bg-surface-alt px-2 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              value={questionForm.question}
              onChange={(e) =>
                setQuestionForm((prev) => ({ ...prev, question: e.target.value }))
              }
              placeholder="Ask a formal evaluation question…"
              className="w-full rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm resize-none"
            />
            <button
              type="submit"
              disabled={busy || !questionForm.question.trim()}
              className="w-full px-4 py-2 rounded-lg bg-primary text-content-inverse text-sm disabled:opacity-50"
            >
              Submit question
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConnectionQaPanel;
